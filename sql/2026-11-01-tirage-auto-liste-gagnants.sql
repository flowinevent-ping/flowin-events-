-- =============================================================================
-- sql/2026-11-01-tirage-auto-liste-gagnants.sql
-- Lot « QR tracés, consentement, tirage programmé » (branche feat/qr-traces-consentement)
--
-- NON APPLIQUÉ EN BASE. À appliquer à la main (SQL editor / apply_migration),
-- section par section, DANS L'ORDRE ci-dessous. Chaque section est idempotente
-- (create … if not exists, create or replace, garde-fous DO).
--
--   1. qr_stations : colonnes support / type_qr, publication immédiate
--   2. participations : index uniques des règles de QR (digital / physique)
--   3. stats_qr_evenement()          -> onglet Trafic, statistiques par QR
--   4. liste_gagnants_publique()     -> page publique /gagnants/[evId]
--   5. joueurs_uniques_par_mois()    -> compteur « Participants ce mois-ci »
--   6. tirage_auto_animations()      -> tirage programmé + envoi du billet
--   7. pg_cron : planification toutes les 15 min
--
-- AVANT LA SECTION 6 : remplacer <ANON_KEY> par la clé anon legacy du projet
-- (JWT public, même convention que docs/sql/nds-notify-souscription.sql).
-- Ne jamais y mettre une clé service_role.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. QR TRACÉS = STATIONS DE JEU
-- La table existe en prod (aucun DDL dans le dépôt jusqu'ici) : le create ne
-- sert que de documentation et ne fait rien si elle existe.
-- -----------------------------------------------------------------------------
create table if not exists public.qr_stations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  nom text not null,
  source_qr text not null,
  publie boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.qr_stations add column if not exists support text;
alter table public.qr_stations add column if not exists type_qr text;
alter table public.qr_stations alter column publie set default true;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'qr_stations_type_qr_check') then
    alter table public.qr_stations
      add constraint qr_stations_type_qr_check check (type_qr is null or type_qr in ('physique', 'digital'));
  end if;
end $$;

-- Type des QR existants, déduit de la convention NDS 2026 (reseaux-* = digital).
update public.qr_stations
   set type_qr = case when source_qr like 'reseaux-%' then 'digital' else 'physique' end
 where type_qr is null;

-- Plus de validation Flowin : les QR « en attente » (publie = false) créés par
-- les pros avant ce lot deviennent visibles. Le SA garde la possibilité d'en
-- masquer un ensuite (bouton « Masquer »).
update public.qr_stations set publie = true where publie is distinct from true;

-- Un slug par event (le code ajoute -2, -3… ; l'index le garantit en base).
do $$
begin
  if exists (select 1 from public.qr_stations group by event_id, source_qr having count(*) > 1) then
    raise notice 'qr_stations : doublons (event_id, source_qr) présents, index unique NON créé. À dédoublonner puis rejouer.';
  else
    create unique index if not exists uniq_qr_stations_event_source on public.qr_stations (event_id, source_qr);
  end if;
end $$;


-- -----------------------------------------------------------------------------
-- 2. RÈGLES DE JEU PAR QR — contrôle en base (doublé côté code par
--    controleRegleQr dans admin/lib/parcours.ts, pour TOUS les jeux).
--    QR digital (source_qr reseaux-*) : une seule participation digitale par
--    compte et par animation.
--    QR physique : 1 participation par jour, par joueur et par QR.
--
-- Nouveaux noms d'index : les index NDS cités dans HANDOFF-flowin-nds2026.md
-- (uniq_participation_digital_oneshot, uniq_participation_physique_jour) n'ont
-- pas de DDL dans le dépôt ; on ne les recrée pas sous le même nom.
-- -----------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1 from public.participations
     where source_qr like 'reseaux-%' and joueur_id is not null
     group by joueur_id, event_id having count(*) > 1
  ) then
    raise notice 'participations : doublons digitaux existants, index uniq_participation_digital_compte_event NON créé.';
  else
    create unique index if not exists uniq_participation_digital_compte_event
      on public.participations (joueur_id, event_id)
      where source_qr like 'reseaux-%';
  end if;

  if exists (
    select 1 from public.participations
     where (source_qr is null or source_qr not like 'reseaux-%') and joueur_id is not null and played_date is not null
     group by joueur_id, event_id, coalesce(source_qr, ''), played_date having count(*) > 1
  ) then
    raise notice 'participations : doublons physiques/jour existants, index uniq_participation_qr_physique_jour NON créé.';
  else
    create unique index if not exists uniq_participation_qr_physique_jour
      on public.participations (joueur_id, event_id, coalesce(source_qr, ''), played_date)
      where source_qr is null or source_qr not like 'reseaux-%';
  end if;
end $$;

-- À DÉCIDER (laissé en commentaire) : si l'index historique
-- uniq_participation_physique_jour porte sur (joueur_id, event_id, played_date)
-- sans source_qr, il empêche de jouer sur DEUX QR physiques différents de la
-- même animation le même jour (le joueur verra « Reviens demain ! »). Vérifier :
--   select indexdef from pg_indexes where indexname = 'uniq_participation_physique_jour';
-- puis, si la règle « 1/jour/QR » doit s'appliquer pleinement :
--   drop index if exists public.uniq_participation_physique_jour;
-- (NDS 2026 garde sa règle 1/jour/station côté code, préfixe ND.)


-- -----------------------------------------------------------------------------
-- 3. STATISTIQUES PAR QR (onglet Trafic) — mêmes définitions que
--    evenement_tracking : flash = visite sans étape ; partie = participation.
--    Source vide = lien principal sans QR tracé. Comptes uniquement.
-- -----------------------------------------------------------------------------
create or replace function public.stats_qr_evenement(p_events text[])
returns table (source text, flashs bigint, parties bigint, joueurs bigint)
language sql stable security definer
set search_path = public
as $$
  with f as (
    select coalesce(nullif(nullif(btrim(v.source), ''), 'direct'), '') as source, count(*) as flashs
      from visites v
     where v.event_id = any(p_events) and v.etape is null
     group by 1
  ),
  p as (
    select coalesce(nullif(btrim(pa.source_qr), ''), '') as source,
           count(*) as parties, count(distinct pa.joueur_id) as joueurs
      from participations pa
     where pa.event_id = any(p_events)
     group by 1
  ),
  q as (
    select distinct qs.source_qr as source from qr_stations qs where qs.event_id = any(p_events)
  ),
  k as (select source from f union select source from p union select source from q)
  select k.source, coalesce(f.flashs, 0), coalesce(p.parties, 0), coalesce(p.joueurs, 0)
    from k left join f on f.source = k.source left join p on p.source = k.source;
$$;
grant execute on function public.stats_qr_evenement(text[]) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 4. LISTE PUBLIQUE DES GAGNANTS — lisible SEULEMENT si le pro l'a choisi
--    (events.cfg.publierGagnants = true). Ne renvoie que : « Prénom N. »,
--    lot, date, commerce. Jamais email, téléphone ni nom complet.
-- -----------------------------------------------------------------------------
create or replace function public.liste_gagnants_publique(p_event_id text)
returns jsonb
language plpgsql stable security definer
set search_path = public
as $$
declare
  e record;
  v_commerce text;
  v_gagnants jsonb;
begin
  select ev.id, ev.nom, ev.pro_id, ev.cfg into e from events ev where ev.id = p_event_id;
  if not found or coalesce((e.cfg ->> 'publierGagnants')::boolean, false) is not true then
    return jsonb_build_object('publie', false);
  end if;

  select coalesce(nullif(btrim(pa.nom), ''), nullif(btrim(pr.nom), ''))
    into v_commerce
    from pros pr left join partenaires pa on pa.id = pr.partenaire_id
   where pr.id = e.pro_id;

  select coalesce(jsonb_agg(jsonb_build_object(
           'nom', g.nom_masque, 'lot', g.lot_nom, 'date', g.created_at
         ) order by g.created_at), '[]'::jsonb)
    into v_gagnants
    from (
      select t.created_at, t.lot_nom,
             btrim(
               initcap(coalesce(nullif(btrim(j.prenom), ''), split_part(btrim(coalesce(t.joueur_nom, '')), ' ', 1), 'Gagnant'))
               || coalesce(' ' || upper(left(coalesce(nullif(btrim(j.nom), ''), nullif(split_part(btrim(coalesce(t.joueur_nom, '')), ' ', 2), '')), 1)) || '.', '')
             ) as nom_masque
        from tirages t
        left join joueurs j on j.id = t.joueur_id
       where t.event_id = p_event_id
         and coalesce(t.statut, '') <> 'annule'
    ) g;

  return jsonb_build_object(
    'publie', true,
    'event_nom', e.nom,
    'commerce', v_commerce,
    'gagnants', v_gagnants
  );
end;
$$;
grant execute on function public.liste_gagnants_publique(text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 5. COMPTEUR MENSUEL (facturation par palier) — joueurs DISTINCTS par mois
--    civil (heure de Paris), toutes animations du pro (events.pro_id, stations
--    de super event comprises).
-- -----------------------------------------------------------------------------
create or replace function public.joueurs_uniques_par_mois(p_pro_id text)
returns table (mois date, joueurs bigint)
language sql stable security definer
set search_path = public
as $$
  select date_trunc('month', pa.created_at at time zone 'Europe/Paris')::date as mois,
         count(distinct pa.joueur_id) as joueurs
    from participations pa
    join events ev on ev.id = pa.event_id
   where ev.pro_id = p_pro_id
     and pa.joueur_id is not null
   group by 1
   order by 1 desc;
$$;
grant execute on function public.joueurs_uniques_par_mois(text) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- 6. TIRAGE AUTOMATIQUE DES ANIMATIONS
--
-- Config (écrite par le parcours de création et l'écran Gagnants) :
--   events.cfg.tirage = { "mode": "manuel" | "auto", "date": "<ISO>" }
-- Animations concernées : mode auto, date échue, hors super event (le tirage
-- des super events reste piloté par Flowin), pas encore tirées.
--
-- Même éligibilité que le tirage pro (fetchJoueursEligibles, lib/dashboard.ts) :
-- joueurs ayant RÉELLEMENT une participation sur l'animation, comptes de test
-- exclus (nom contenant « collin », « lucie giordano »). En plus : un joueur
-- déjà gagnant (non annulé) de l'animation n'est pas retiré.
-- Lots : table `lots` de l'animation, hors gains immédiats, dans la limite de
-- la quantité restante (quantité − gagnants non annulés de ce lot). Sans lot
-- enregistré : un gagnant « Lot — <nom de l'animation> » (comme l'écran pro).
-- Écriture : attribuer_gain_joueur() (même RPC que le tirage pro).
-- Envoi : pg_net -> edge function send-ticket-gagnant (même charge utile que
-- envoyerTicketGagnant côté pro).
--
-- IDEMPOTENCE : l'animation est verrouillée (for update skip locked) puis
-- marquée cfg.tirage.fait_le ; une animation marquée n'est JAMAIS retirée.
-- -----------------------------------------------------------------------------
create extension if not exists pg_net;

create or replace function public.tirage_auto_animations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  e record;
  l record;
  t record;
  v_restant integer;
  v_joueur uuid;
  v_vivier uuid[];
  v_i integer;
  v_nb integer;
  v_total integer := 0;
  v_pro_nom text;
  v_pro_email text;
  v_pro_part text;
  v_avec_lots boolean;
begin
  for e in
    select ev.id, ev.nom, ev.pro_id, ev.cfg
      from events ev
     where ev.super_event_id is null
       and ev.cfg -> 'tirage' ->> 'mode' = 'auto'
       and nullif(ev.cfg -> 'tirage' ->> 'date', '') is not null
       and (ev.cfg -> 'tirage' ->> 'date')::timestamptz <= now()
       and nullif(ev.cfg -> 'tirage' ->> 'fait_le', '') is null
     for update skip locked
  loop
    v_nb := 0;
    v_i := 1;
    v_pro_nom := null; v_pro_email := null; v_pro_part := null;
    select pr.nom, pr.email, pr.partenaire_id into v_pro_nom, v_pro_email, v_pro_part from pros pr where pr.id = e.pro_id;

    -- Vivier : joueurs ayant joué, comptes de test exclus, pas déjà gagnants,
    -- mélangé une fois (aléatoire côté SQL) puis consommé dans l'ordre.
    select coalesce(array_agg(x.joueur_id order by random()), '{}') into v_vivier
      from (
        select distinct pa.joueur_id
          from participations pa
          join joueurs j on j.id = pa.joueur_id
         where pa.event_id = e.id
           and pa.joueur_id is not null
           and lower(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, ''))) not like '%collin%'
           and lower(btrim(coalesce(j.prenom, '') || ' ' || coalesce(j.nom, ''))) <> 'lucie giordano'
           and not exists (
             select 1 from tirages tg
              where tg.event_id = e.id and tg.joueur_id = pa.joueur_id and coalesce(tg.statut, '') <> 'annule'
           )
      ) x;

    select exists (select 1 from lots lo where lo.event_id = e.id) into v_avec_lots;

    for l in
      select lo.id, coalesce(nullif(btrim(lo.nom), ''), nullif(btrim(lo.titre), ''), 'Lot') as nom,
             coalesce(lo.valeur_euros, lo.valeur) as valeur, lo.partenaire_id, coalesce(lo.quantite, 1) as quantite
        from lots lo
       where lo.event_id = e.id
         and coalesce(lo.note, '') not ilike '%instantan%'
      union all
      -- Animation sans aucun lot enregistré : un gagnant, lot au nom de l'animation.
      select null, 'Lot — ' || e.nom, null, v_pro_part, 1
       where not v_avec_lots
    loop
      select l.quantite - count(*) into v_restant
        from tirages tg
       where tg.event_id = e.id and tg.lot_nom = l.nom and coalesce(tg.statut, '') <> 'annule';

      while v_restant > 0 loop
        exit when v_i > coalesce(array_length(v_vivier, 1), 0);
        v_joueur := v_vivier[v_i];
        v_i := v_i + 1;

        select * into t
          from attribuer_gain_joueur(v_joueur, l.nom, coalesce(l.partenaire_id, v_pro_part), l.valeur, null, e.id)
         limit 1;

        if t.id is not null and coalesce(t.joueur_email, '') like '%@%' then
          perform net.http_post(
            url := 'https://ywcqtupgoxfzkddqkztk.supabase.co/functions/v1/send-ticket-gagnant',
            body := jsonb_build_object(
              'gagnant_email', t.joueur_email,
              'gagnant_nom', coalesce(nullif(t.joueur_nom, ''), 'Gagnant'),
              'lot_nom', l.nom,
              'code', coalesce(t.ticket_code, ''),
              'retrait_token', coalesce(t.retrait_token, ''),
              'partenaire_nom', coalesce(v_pro_nom, ''),
              'from_name', coalesce(nullif(v_pro_nom, ''), 'Flowin'),
              'reply_to', coalesce(v_pro_email, '')
            ),
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer <ANON_KEY>'
            ),
            timeout_milliseconds := 5000
          );
        end if;
        if t.id is not null then v_nb := v_nb + 1; end if;
        v_restant := v_restant - 1;
      end loop;
    end loop;

    -- Marque l'animation : plus jamais retirée automatiquement.
    update events
       set cfg = jsonb_set(
                   jsonb_set(coalesce(cfg, '{}'::jsonb), '{tirage,fait_le}', to_jsonb(now()), true),
                   '{tirage,gagnants}', to_jsonb(v_nb), true)
     where id = e.id;

    v_total := v_total + v_nb;
  end loop;
  return v_total;
end;
$$;

-- Réservée au planificateur (et au SA en SQL) : jamais appelable depuis le web.
revoke all on function public.tirage_auto_animations() from public, anon, authenticated;


-- -----------------------------------------------------------------------------
-- 7. PLANIFICATION pg_cron — toutes les 15 minutes (idempotent : le job
--    existant du même nom est remplacé).
-- -----------------------------------------------------------------------------
create extension if not exists pg_cron;

do $$
declare j record;
begin
  for j in select jobid from cron.job where jobname = 'tirage-auto-animations' loop
    perform cron.unschedule(j.jobid);
  end loop;
  perform cron.schedule('tirage-auto-animations', '*/15 * * * *', 'select public.tirage_auto_animations();');
end $$;

-- Contrôles après application :
--   select * from cron.job where jobname = 'tirage-auto-animations';
--   select id, nom, cfg->'tirage' from events where cfg->'tirage'->>'mode' = 'auto';
--   select public.liste_gagnants_publique('<event_id>');
--   select * from public.joueurs_uniques_par_mois('<pro_id>');
