-- =============================================================================
-- sql/2026-11-18-tirage-correctifs.sql — Sécurité + correctifs du tirage au sort
-- Audit : docs/audit-2026-11-17/TEST-TIRAGE-2026-11-18.md
-- Note de sécurité : docs/SECURITE-tirage-2026-11-18.md
--
-- NON APPLIQUÉ EN BASE. À relire par Romain, puis à exécuter EN UNE FOIS (une transaction)
-- dans l'éditeur SQL Supabase (projet ywcqtupgoxfzkddqkztk). Script idempotent : le rejouer
-- ne change rien (create or replace, revoke/grant).
--
-- PROBLÈME CORRIGÉ : six fonctions d'écriture étaient exécutables par anon, sans contrôle :
--   attribuer_gain_joueur, tirage_super_event, annuler_tirage, marquer_notifie, tirage_lot,
--   tirage_soir. Avec la seule clé publique, n'importe qui pouvait créer un billet gagnant
--   valable ou annuler un gagnant.
--
-- PRÉREQUIS CÔTÉ CODE (déjà livrés avec ce fichier) : tous les appelants web envoient un jeton
-- de session (SA : flowin_admin_session ; pro : session supabase-js). Sans session, l'écran
-- demande de se connecter au lieu d'échouer en silence.
--
-- Vérifié en lecture le 18/11/2026 : appliquer_regle_gain (gains immédiats des joueurs, appelée
-- par anon) est SECURITY DEFINER, propriétaire postgres. Elle n'appelle plus
-- attribuer_gain_joueur mais _attribuer_gain_interne (section 3) : les joueurs anonymes gardent
-- leurs gains immédiats sans que la porte publique reste ouverte.
-- =============================================================================

begin;

-- -----------------------------------------------------------------------------
-- 0. PARAMÈTRE À TRANCHER PAR ROMAIN : « un gain par joueur et par animation ».
--    true  = un joueur ne peut avoir qu'un seul gain non annulé par animation / super event.
--    Appliqué AUX TIRAGES (attribuer_gain_joueur appelé par le pro ou le SA).
--    Pour les GAINS IMMÉDIATS (appliquer_regle_gain), la règle est DÉSACTIVÉE en attendant la
--    décision : la règle existante « un gain par jour et par animation » reste seule en place.
--    Pour changer : modifier la valeur renvoyée ci-dessous, puis rejouer ce bloc seul.
-- -----------------------------------------------------------------------------
create or replace function public._tirage_un_gain_par_joueur(p_contexte text)
returns boolean
language sql immutable
set search_path to 'public'
as $function$
  select case p_contexte
           when 'tirage'         then true    -- tirage au sort (pro / SA)
           when 'gain_immediat'  then false   -- EN ATTENTE DE LA DÉCISION DE ROMAIN
           else true
         end;
$function$;
revoke execute on function public._tirage_un_gain_par_joueur(text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 1. Contrôle d'accès commun : super admin, pro propriétaire, ou appel interne.
--    Pro propriétaire = pros.auth_id = auth.uid() ET (pros.id = events.pro_id de l'animation,
--    ou = super_events.pro_id du super event, ou pros.partenaire_id = partenaire du lot).
--    « Appel interne » = aucune requête PostgREST (pas de request.jwt.claims : éditeur SQL,
--    pg_cron) ou rôle service_role. anon passe toujours par PostgREST, donc jamais interne.
-- -----------------------------------------------------------------------------
create or replace function public._tirage_acces(p_event_id text, p_super_event_id text, p_partenaire_id text)
returns boolean
language sql stable security definer
set search_path to 'public'
as $function$
  select
       nullif(current_setting('request.jwt.claims', true), '') is null
    or (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role') = 'service_role'
    or public.est_super_admin()
    or (auth.uid() is not null and exists (
          select 1 from public.pros pr
           where pr.auth_id = auth.uid()
             and (   (p_event_id is not null and exists (select 1 from public.events e
                                                          where e.id = p_event_id and e.pro_id = pr.id))
                  or (p_super_event_id is not null and exists (select 1 from public.super_events s
                                                                where s.id = p_super_event_id and s.pro_id = pr.id))
                  or (p_partenaire_id is not null and pr.partenaire_id = p_partenaire_id))));
$function$;
revoke execute on function public._tirage_acces(text, text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Fermer les six fonctions à anon / public, ouvrir à authenticated (le contrôle fin est
--    fait DANS chaque fonction, sections 3 à 7).
-- -----------------------------------------------------------------------------
revoke execute on function public.attribuer_gain_joueur(uuid, text, text, numeric, text, text) from public, anon;
revoke execute on function public.tirage_super_event(text, integer) from public, anon;
revoke execute on function public.annuler_tirage(bigint) from public, anon;
revoke execute on function public.marquer_notifie(bigint, boolean) from public, anon;
revoke execute on function public.tirage_lot(text, text, numeric, integer) from public, anon;
revoke execute on function public.tirage_soir(date, integer, text) from public, anon;
grant execute on function public.attribuer_gain_joueur(uuid, text, text, numeric, text, text) to authenticated, service_role;
grant execute on function public.tirage_super_event(text, integer) to authenticated, service_role;
grant execute on function public.annuler_tirage(bigint) to authenticated, service_role;
grant execute on function public.marquer_notifie(bigint, boolean) to authenticated, service_role;
grant execute on function public.tirage_lot(text, text, numeric, integer) to authenticated, service_role;
grant execute on function public.tirage_soir(date, integer, text) to authenticated, service_role;
-- Restent ouverts à anon (lecture / caisse protégée par PIN) : billet_par_token, valider_lot,
-- date_limite_tirage, date_debut_tirage, lot_du_tirage, partenaire_du_tirage, appliquer_regle_gain.

-- -----------------------------------------------------------------------------
-- 3. Cœur d'attribution d'un gain (non exposé) + attribuer_gain_joueur (exposé, contrôlé).
--    Garde-fous (constat B de l'audit) :
--    - verrou par animation (pg_advisory_xact_lock) : deux clics simultanés ne dépassent plus
--      la quantité ;
--    - quantité du lot (table lots, nom OU titre) respectée ;
--    - « un gain par joueur » seulement si p_un_gain (paramètre section 0).
-- -----------------------------------------------------------------------------
create or replace function public._attribuer_gain_interne(
  p_joueur_id uuid, p_lot_nom text, p_partenaire_id text, p_valeur numeric,
  p_super_event_id text, p_event_id text, p_un_gain boolean)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
declare v_qte integer;
begin
  perform pg_advisory_xact_lock(hashtext('tirage:' || coalesce(p_event_id, '') || ':' || coalesce(p_super_event_id, '')));

  if p_un_gain and exists (select 1 from tirages t
              where t.joueur_id = p_joueur_id and t.statut <> 'annule'
                and ((p_event_id is not null and t.event_id = p_event_id)
                  or (p_super_event_id is not null and t.super_event_id = p_super_event_id))) then
    return;
  end if;

  if p_event_id is not null then
    select sum(coalesce(lo.quantite, 1)) into v_qte
      from lots lo where lo.event_id = p_event_id and p_lot_nom in (lo.nom, lo.titre);
    if v_qte is not null and (select count(*) from tirages t
         where t.event_id = p_event_id and t.lot_nom = p_lot_nom and t.statut <> 'annule') >= v_qte then
      return;
    end if;
  end if;

  return query
  insert into tirages(type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel,
                      ticket_code, retrait_token, super_event_id, event_id)
  select 'grand', p_partenaire_id, p_lot_nom, p_valeur, j.id,
         coalesce(nullif(trim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')), ''), j.email), j.email, j.tel, j.ticket_code,
         replace(gen_random_uuid()::text, '-', ''), p_super_event_id, p_event_id
    from joueurs j where j.id = p_joueur_id
  returning *;
end;
$function$;
revoke execute on function public._attribuer_gain_interne(uuid, text, text, numeric, text, text, boolean) from public, anon, authenticated;

-- Signature et colonnes inchangées : lib/dashboard.ts reçoit 0 ligne si le gain est refusé
-- (« Le tirage n'a pas pu être enregistré »), une erreur 42501 si l'accès est refusé.
create or replace function public.attribuer_gain_joueur(
  p_joueur_id uuid, p_lot_nom text, p_partenaire_id text default null, p_valeur numeric default null,
  p_super_event_id text default null, p_event_id text default null)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
begin
  if not public._tirage_acces(p_event_id, p_super_event_id, p_partenaire_id) then
    raise exception 'Accès refusé : connectez-vous (super admin ou pro organisateur).' using errcode = '42501';
  end if;
  return query select * from public._attribuer_gain_interne(
    p_joueur_id, p_lot_nom, p_partenaire_id, p_valeur, p_super_event_id, p_event_id,
    public._tirage_un_gain_par_joueur('tirage'));
end;
$function$;

-- appliquer_regle_gain : corps identique à la prod (lu le 18/11), seul l'appel final change
-- (_attribuer_gain_interne, règle « un gain » = paramètre 'gain_immediat'). Reste ouverte à anon.
create or replace function public.appliquer_regle_gain(p_joueur_id uuid, p_event_id text, p_lot_nom text default null::text)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  e record; r jsonb; v_mode text; v_x int; v_p numeric; v_n int;
  l record; t record; v_gagne boolean := false;
begin
  select id, super_event_id, cfg, pro_id, module into e from events where id = p_event_id;
  if not found or e.super_event_id is not null then
    return jsonb_build_object('gagne', false);
  end if;

  if exists (select 1 from tirages where event_id = p_event_id and joueur_id = p_joueur_id
               and statut <> 'annule' and created_at::date = current_date) then
    return jsonb_build_object('gagne', false);
  end if;

  if p_lot_nom is not null and btrim(p_lot_nom) <> '' then
    select lo.* into l from lots lo
     where lo.event_id = p_event_id and lower(btrim(coalesce(lo.titre, lo.nom))) = lower(btrim(p_lot_nom))
       and coalesce(lo.quantite, 1) > (select count(*) from tirages ti where ti.event_id = p_event_id
                                        and ti.lot_nom = coalesce(lo.titre, lo.nom) and ti.statut <> 'annule')
     limit 1;
    if not found then return jsonb_build_object('gagne', false); end if;
    v_gagne := true;
  else
    if e.module = 'spin' then return jsonb_build_object('gagne', false); end if;
    r := e.cfg -> 'regleRecompense';
    if r is null or jsonb_typeof(r) <> 'object' then return jsonb_build_object('gagne', false); end if;
    v_mode := coalesce(r->>'mode', 'aleatoire');
    select lo.* into l from lots lo
     where lo.event_id = p_event_id and coalesce(lo.note, '') ilike '%instantan%'
       and coalesce(lo.quantite, 1) > (select count(*) from tirages ti where ti.event_id = p_event_id
                                        and ti.lot_nom = coalesce(lo.titre, lo.nom) and ti.statut <> 'annule')
     order by lo.id
     limit 1;
    if not found then return jsonb_build_object('gagne', false); end if;

    if v_mode = 'tousLesX' then
      v_x := greatest(coalesce(nullif(r->>'everyX', '')::int, 10), 1);
      select count(*) into v_n from participations where event_id = p_event_id;
      v_gagne := v_n > 0 and v_n % v_x = 0;
    else
      v_p := least(greatest(coalesce(nullif(r->>'probabilite', '')::numeric, 0), 0), 100);
      v_gagne := random() * 100 < v_p;
    end if;
  end if;

  if not v_gagne then return jsonb_build_object('gagne', false); end if;

  select * into t from public._attribuer_gain_interne(
    p_joueur_id, coalesce(l.titre, l.nom), l.partenaire_id,
    coalesce(l.valeur_euros, l.valeur), null, p_event_id,
    public._tirage_un_gain_par_joueur('gain_immediat')) limit 1;
  if t.id is null then return jsonb_build_object('gagne', false); end if;

  return jsonb_build_object('gagne', true, 'lot', coalesce(l.titre, l.nom),
                            'conditions', l.conditions,
                            'ticket_code', t.ticket_code, 'retrait_token', t.retrait_token);
end;
$function$;

-- -----------------------------------------------------------------------------
-- 4. tirage_super_event : contrôle d'accès + verrou par lot + nom du lot aligné
--    (lots.nom d'abord, comme lib/operations.ts ; les anciens gagnants enregistrés sous
--    lots.titre restent comptés). Le reste du corps est identique à la prod.
-- -----------------------------------------------------------------------------
create or replace function public.tirage_super_event(p_lot_id text, p_nb integer default 1)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
declare
  l record; se record; v_restant int; v_nb int; v_nom text;
begin
  perform pg_advisory_xact_lock(hashtext('tirage-lot:' || coalesce(p_lot_id, '')));
  select lo.*, e.super_event_id as se_id into l
    from lots lo join events e on e.id = lo.event_id
   where lo.id = p_lot_id;
  if not found or l.se_id is null then return; end if;
  if not public._tirage_acces(l.event_id, l.se_id, l.partenaire_id) then
    raise exception 'Accès refusé : connectez-vous (super admin ou pro organisateur).' using errcode = '42501';
  end if;
  v_nom := coalesce(nullif(btrim(l.nom), ''), l.titre);
  select id, coalesce(tirage_global, true) as global into se from super_events where id = l.se_id;

  select greatest(coalesce(l.quantite, 1) - count(*), 0) into v_restant
    from tirages
   where event_id = l.event_id and lot_nom in (v_nom, l.titre) and statut <> 'annule';
  v_nb := least(greatest(coalesce(p_nb, 1), 0), v_restant);
  if v_nb <= 0 then return; end if;

  return query
  with vivier as (
    select pa.joueur_id, greatest(sum(coalesce(pa.tickets, 1)), 1) as tk
      from participations pa
      join events e on e.id = pa.event_id
     where pa.joueur_id is not null
       and e.super_event_id = l.se_id
       and (se.global or pa.event_id = l.event_id)
     group by pa.joueur_id
  ), elig as (
    select v.joueur_id, v.tk
      from vivier v join joueurs j on j.id = v.joueur_id
     where lower(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')) not like '%collin%'
       and lower(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,''))) <> 'lucie giordano'
       and v.joueur_id not in (select t.joueur_id from tirages t
                                where t.super_event_id = l.se_id and t.statut <> 'annule' and t.joueur_id is not null)
  ), pick as (
    select joueur_id from elig order by power(random(), 1.0 / tk) desc limit v_nb
  )
  insert into tirages (type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel,
                       ticket_code, retrait_token, super_event_id, event_id)
  select 'grand', l.partenaire_id, v_nom, coalesce(l.valeur_euros, l.valeur), j.id,
         coalesce(nullif(btrim(coalesce(j.prenom,'') || ' ' || coalesce(j.nom,'')), ''), j.email),
         j.email, j.tel, j.ticket_code, replace(gen_random_uuid()::text, '-', ''), l.se_id, l.event_id
    from pick k join joueurs j on j.id = k.joueur_id
  returning *;
end;
$function$;

-- -----------------------------------------------------------------------------
-- 5. annuler_tirage et marquer_notifie : contrôle sur l'animation / le super event /
--    le partenaire du tirage. Corps identique à la prod pour le reste.
-- -----------------------------------------------------------------------------
create or replace function public.annuler_tirage(p_tirage_id bigint)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare st text; t record;
begin
  select event_id, super_event_id, partenaire_id into t from public.tirages where id = p_tirage_id;
  if found and not public._tirage_acces(t.event_id, t.super_event_id, t.partenaire_id) then
    raise exception 'Accès refusé : connectez-vous (super admin ou pro organisateur).' using errcode = '42501';
  end if;
  update public.tirages
     set statut = 'annule'
   where id = p_tirage_id and notifie_at is null and retire_at is null
   returning statut into st;
  if not found then
    return jsonb_build_object('ok', false, 'erreur', 'tirage introuvable, ou deja confirme/retire (protection : on ne peut annuler qu''un tirage jamais confirme)');
  end if;
  return jsonb_build_object('ok', true, 'statut', st);
end
$function$;

create or replace function public.marquer_notifie(p_tirage_id bigint, p_on boolean default true)
returns jsonb
language plpgsql security definer
set search_path to 'public'
as $function$
declare v timestamptz; t record;
begin
  select event_id, super_event_id, partenaire_id into t from public.tirages where id = p_tirage_id;
  if found and not public._tirage_acces(t.event_id, t.super_event_id, t.partenaire_id) then
    raise exception 'Accès refusé : connectez-vous (super admin ou pro organisateur).' using errcode = '42501';
  end if;
  update public.tirages
     set notifie_at = case when p_on then now() else null end
   where id = p_tirage_id
   returning notifie_at into v;
  if not found then return jsonb_build_object('ok', false, 'erreur', 'tirage introuvable'); end if;
  return jsonb_build_object('ok', true, 'notifie_at', v);
end $function$;

-- -----------------------------------------------------------------------------
-- 6. tirage_lot (grand tirage NDS par partenaire) et tirage_soir (places du soir NDS) :
--    on N'ÉCRASE PAS leur corps (logique NDS spécifique). On les renomme en version interne
--    et on remet devant une enveloppe contrôlée, même signature.
--    Idempotent : le renommage n'a lieu que si la version interne n'existe pas encore.
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regprocedure('public._tirage_lot_interne(text,text,numeric,integer)') is null then
    alter function public.tirage_lot(text, text, numeric, integer) rename to _tirage_lot_interne;
  end if;
  if to_regprocedure('public._tirage_soir_interne(date,integer,text)') is null then
    alter function public.tirage_soir(date, integer, text) rename to _tirage_soir_interne;
  end if;
end $$;
revoke execute on function public._tirage_lot_interne(text, text, numeric, integer) from public, anon, authenticated;
revoke execute on function public._tirage_soir_interne(date, integer, text) from public, anon, authenticated;

create or replace function public.tirage_lot(p_partenaire_id text, p_lot_nom text, p_valeur numeric, p_nb integer)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
begin
  if not public._tirage_acces(null, null, p_partenaire_id) then
    raise exception 'Accès refusé : connectez-vous (super admin ou pro organisateur).' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('tirage-lot-pt:' || coalesce(p_partenaire_id, '') || ':' || coalesce(p_lot_nom, '')));
  return query select * from public._tirage_lot_interne(p_partenaire_id, p_lot_nom, p_valeur, p_nb);
end;
$function$;

-- tirage_soir : réservé au super admin (outil Flowin tirage-nds.html).
create or replace function public.tirage_soir(p_date date, p_nb integer, p_lot text default 'Place de concert'::text)
returns setof tirages
language plpgsql security definer
set search_path to 'public'
as $function$
begin
  if not public._tirage_acces(null, null, null) then
    raise exception 'Accès refusé : connexion super admin requise.' using errcode = '42501';
  end if;
  perform pg_advisory_xact_lock(hashtext('tirage-soir:' || coalesce(p_date::text, '')));
  return query select * from public._tirage_soir_interne(p_date, p_nb, p_lot);
end;
$function$;

-- Les fonctions recréées dans la section 6 repartent avec les droits par défaut : on les refixe.
revoke execute on function public.tirage_lot(text, text, numeric, integer) from public, anon;
revoke execute on function public.tirage_soir(date, integer, text) from public, anon;
grant execute on function public.tirage_lot(text, text, numeric, integer) to authenticated, service_role;
grant execute on function public.tirage_soir(date, integer, text) to authenticated, service_role;

commit;

notify pgrst, 'reload schema';

-- -----------------------------------------------------------------------------
-- 7. CONTRÔLE APRÈS APPLICATION (lecture seule) — doit montrer anon absent des six
--    fonctions, présent sur appliquer_regle_gain :
-- select p.proname, p.proacl::text from pg_proc p
--  where p.pronamespace = 'public'::regnamespace
--    and p.proname in ('attribuer_gain_joueur','tirage_super_event','annuler_tirage','marquer_notifie',
--                      'tirage_lot','tirage_soir','appliquer_regle_gain','_attribuer_gain_interne',
--                      '_tirage_lot_interne','_tirage_soir_interne','_tirage_acces');
-- -----------------------------------------------------------------------------

-- =============================================================================
-- ROLLBACK (à n'utiliser qu'en cas de blocage en festival). Rouvre l'accès anon
-- (la faille revient !) et remet les corps d'origine. À exécuter en une fois.
-- =============================================================================
-- begin;
-- -- tirage_lot / tirage_soir : retirer l'enveloppe et rendre leur nom aux versions d'origine.
-- drop function if exists public.tirage_lot(text, text, numeric, integer);
-- drop function if exists public.tirage_soir(date, integer, text);
-- alter function public._tirage_lot_interne(text, text, numeric, integer) rename to tirage_lot;
-- alter function public._tirage_soir_interne(date, integer, text) rename to tirage_soir;
-- -- appliquer_regle_gain : remettre l'appel d'origine (avant de supprimer le cœur interne).
-- --   Rejouer la section 3 « appliquer_regle_gain » en remplaçant l'appel final par :
-- --   select * into t from attribuer_gain_joueur(p_joueur_id, coalesce(l.titre, l.nom), l.partenaire_id,
-- --          coalesce(l.valeur_euros, l.valeur), null, p_event_id) limit 1;
-- -- attribuer_gain_joueur d'origine (sans garde-fou) :
-- create or replace function public.attribuer_gain_joueur(p_joueur_id uuid, p_lot_nom text, p_partenaire_id text default null,
--   p_valeur numeric default null, p_super_event_id text default null, p_event_id text default null)
-- returns setof tirages language sql security definer as $f$
--   insert into tirages(type, partenaire_id, lot_nom, lot_valeur, joueur_id, joueur_nom, joueur_email, joueur_tel, ticket_code, retrait_token, super_event_id, event_id)
--   select 'grand', p_partenaire_id, p_lot_nom, p_valeur, j.id,
--     coalesce(nullif(trim(coalesce(j.prenom,'')||' '||coalesce(j.nom,'')),''), j.email), j.email, j.tel, j.ticket_code,
--     replace(gen_random_uuid()::text,'-',''), p_super_event_id, p_event_id
--   from joueurs j where j.id = p_joueur_id returning *; $f$;
-- -- annuler_tirage / marquer_notifie / tirage_super_event d'origine : rejouer les sections 4 et 5
-- -- en retirant le bloc « if ... _tirage_acces ... raise ... end if; » (le reste est identique).
-- grant execute on function public.attribuer_gain_joueur(uuid, text, text, numeric, text, text) to anon;
-- grant execute on function public.tirage_super_event(text, integer) to anon;
-- grant execute on function public.annuler_tirage(bigint) to anon;
-- grant execute on function public.marquer_notifie(bigint, boolean) to anon;
-- grant execute on function public.tirage_lot(text, text, numeric, integer) to anon;
-- grant execute on function public.tirage_soir(date, integer, text) to anon;
-- drop function if exists public._attribuer_gain_interne(uuid, text, text, numeric, text, text, boolean);
-- drop function if exists public._tirage_acces(text, text, text);
-- drop function if exists public._tirage_un_gain_par_joueur(text);
-- commit;
-- notify pgrst, 'reload schema';
