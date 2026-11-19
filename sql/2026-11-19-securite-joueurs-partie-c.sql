-- =============================================================================
-- SÉCURITÉ JOUEURS — PARTIE C : lecture de joueurs / participations / tirages (19/11/2026)
-- Doc : docs/SECURITE-joueurs-partie-c-2026-11-19.md
-- Suite de sql/2026-11-19-securite-joueurs-rpc.sql (parties A et B).
--
-- C1 : fonctions SECURITY DEFINER (additif, sans risque, applicable à tout moment).
-- C2 : retrait des SELECT anonymes (joueurs_anon_select, participations_anon_select,
--      tirages_anon_select) et restriction du SELECT authentifié :
--        * super admin (est_super_admin()) ;
--        * pro propriétaire (qr_est_proprietaire), pro du partenaire (flowin_pro_lie_partenaire),
--          pro organisateur du super event (flowin_est_pro_super_event), lien clients_commerce ;
--        * le joueur lui-même (compte Auth dont l'e-mail confirmé = joueurs.email_lower).
--      À appliquer UNIQUEMENT après déploiement Vercel du code qui appelle C1.
-- Idempotent (create or replace / drop policy if exists). Rollback en pied de fichier.
-- Les INSERT anonymes sur joueurs et participations sont conservés (parcours joueurs).
-- =============================================================================

-- ═════════════════════════════ PARTIE C1 ════════════════════════════════════

-- Pseudonyme stable d'un joueur pour les pages pro rendues sans session :
-- permet de croiser joueurs et participations sans jamais exposer l'uuid
-- (l'uuid donne accès aux RPC « moi » : tickets, gains, lots).
create or replace function public.flowin_joueur_ref(p_id uuid)
returns text language sql immutable set search_path = public as $$
  select case when p_id is null then null else md5('flowin-ref:' || p_id::text) end;
$$;

-- Le compte connecté est-il ce joueur ? (même règle que moi_joueur_par_session :
-- e-mail Auth confirmé = joueurs.email_lower)
create or replace function public.flowin_joueur_est_moi(p_joueur uuid)
returns boolean language sql stable security definer set search_path = public, auth as $$
  select auth.uid() is not null and p_joueur is not null and exists (
    select 1 from auth.users u join public.joueurs j on j.email_lower = lower(u.email)
     where u.id = auth.uid() and u.email is not null and u.email_confirmed_at is not null and j.id = p_joueur);
$$;

-- Le pro connecté a-t-il un lien avec ce joueur ? (partie sur une de ses stations, sur une
-- station d'un super event qu'il organise, client de son commerce, gagnant d'un lot de son partenaire)
create or replace function public.flowin_pro_voit_joueur(p_joueur uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null and p_joueur is not null and (
       exists (select 1 from participations p join events e on e.id = p.event_id join pros pr on pr.id = e.pro_id
                where p.joueur_id = p_joueur and pr.auth_id = auth.uid())
    or exists (select 1 from participations p join events e on e.id = p.event_id
                 join super_events s on s.id = e.super_event_id join pros pr on pr.id = s.pro_id
                where p.joueur_id = p_joueur and pr.auth_id = auth.uid())
    or exists (select 1 from clients_commerce c join pros pr on pr.id::text = c.pro_id
                where c.joueur_id = p_joueur and pr.auth_id = auth.uid())
    or exists (select 1 from tirages t join pros pr on pr.partenaire_id::text = t.partenaire_id
                where t.joueur_id = p_joueur and pr.auth_id = auth.uid()));
$$;

-- C1-1. Inscription / reconnaissance d'un joueur (remplace insert/upsert + relecture de l'id).
-- Identité = e-mail (vérité unique, index joueurs_email_lower_unique), sinon external_id.
-- Joueur déjà connu : mêmes seuls champs que joueur_marquer_partie (events, last_seen, ticket) —
-- l'anonyme n'a jamais eu le droit de réécrire la fiche d'un autre.
-- Nouveau joueur : colonnes en liste blanche, consentement tel qu'envoyé (optin vrai seulement
-- si coché), genre limité à Homme / Femme (H / F historiques), sinon vide.
create or replace function public.joueur_inscrire(p_joueur jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v jsonb := case when jsonb_typeof(p_joueur) = 'object' then p_joueur else '{}'::jsonb end;
  v_email text := nullif(lower(btrim(coalesce(v->>'email', ''))), '');
  v_ext text := left(nullif(btrim(coalesce(v->>'external_id', '')), ''), 80);
  v_events text[];
  v_tags text[];
  v_ticket text := left(nullif(btrim(coalesce(v->>'ticket_code', '')), ''), 40);
  v_id uuid;
  v_optin boolean := coalesce(v->'optin' = 'true'::jsonb, false);
begin
  if v_email is not null and v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    return jsonb_build_object('ok', false, 'raison', 'email'); end if;
  if v_email is null and nullif(btrim(coalesce(v->>'tel', '')), '') is null and nullif(btrim(coalesce(v->>'prenom', '')), '') is null then
    return jsonb_build_object('ok', false, 'raison', 'vide'); end if;
  v_events := array(select left(x, 80) from jsonb_array_elements_text(
      case when jsonb_typeof(v->'events') = 'array' then v->'events' else '[]'::jsonb end) x
      where btrim(x) <> '' limit 20);
  v_tags := array(select left(x, 60) from jsonb_array_elements_text(
      case when jsonb_typeof(v->'tags') = 'array' then v->'tags' else '[]'::jsonb end) x
      where btrim(x) <> '' limit 10);

  if v_email is not null then select j.id into v_id from joueurs j where j.email_lower = v_email limit 1; end if;
  if v_id is null and v_ext is not null then select j.id into v_id from joueurs j where j.external_id = v_ext limit 1; end if;

  if v_id is not null then
    update joueurs
       set events = (select coalesce(array_agg(distinct e), '{}') from unnest(coalesce(events, '{}') || v_events) as e where e is not null and e <> ''),
           last_seen = current_date,
           ticket_code = coalesce(v_ticket, ticket_code)
     where id = v_id;
    return jsonb_build_object('ok', true, 'id', v_id, 'nouveau', false);
  end if;

  begin
    insert into joueurs (external_id, email, prenom, nom, tel, ville, code_postal, genre, age_tranche, decouverte,
                         enseigne, secteur, client_type, lot_gagne, score_moy, optin, optin_date, optin_version,
                         first_seen, last_seen, events, ticket_code, source, tags)
    values (v_ext, v_email,
            left(nullif(btrim(coalesce(v->>'prenom', '')), ''), 80),
            left(nullif(btrim(coalesce(v->>'nom', '')), ''), 80),
            left(nullif(btrim(coalesce(v->>'tel', '')), ''), 30),
            left(nullif(btrim(coalesce(v->>'ville', '')), ''), 80),
            left(nullif(btrim(coalesce(v->>'code_postal', '')), ''), 10),
            case when v->>'genre' in ('Homme', 'Femme', 'H', 'F') then v->>'genre' end,
            left(nullif(btrim(coalesce(v->>'age_tranche', '')), ''), 20),
            left(nullif(btrim(coalesce(v->>'decouverte', '')), ''), 120),
            coalesce(left(nullif(btrim(coalesce(v->>'enseigne', '')), ''), 120), ''),
            left(nullif(btrim(coalesce(v->>'secteur', '')), ''), 120),
            case when v->>'client_type' in ('btoc', 'btob') then v->>'client_type' else 'btoc' end,
            coalesce(left(nullif(btrim(coalesce(v->>'lot_gagne', '')), ''), 120), ''),
            case when coalesce(v->>'score_moy', '') ~ '^[0-9]{1,3}(\.[0-9]+)?$' then least((v->>'score_moy')::numeric, 100) else 0 end,
            v_optin,
            case when coalesce(v->>'optin_date', '') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then (v->>'optin_date')::date end,
            left(nullif(btrim(coalesce(v->>'optin_version', '')), ''), 40),
            current_date, current_date, v_events, coalesce(v_ticket, ''),
            left(nullif(btrim(coalesce(v->>'source', '')), ''), 60), v_tags)
    returning id into v_id;
  exception when unique_violation then
    -- Course entre deux envois du même joueur : on renvoie la fiche gagnante.
    select j.id into v_id from joueurs j where (v_email is not null and j.email_lower = v_email) or (v_ext is not null and j.external_id = v_ext) limit 1;
    if v_id is null then return jsonb_build_object('ok', false, 'raison', 'doublon'); end if;
    return jsonb_build_object('ok', true, 'id', v_id, 'nouveau', false);
  end;
  return jsonb_build_object('ok', true, 'id', v_id, 'nouveau', true);
end $$;

-- C1-2. Reconnaissance par e-mail : id et prénom seulement (jamais téléphone, nom, e-mail),
-- + « a déjà joué aujourd'hui sur cette station ».
create or replace function public.joueur_reconnaitre(p_email text, p_event_id text default null, p_jour date default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_email text := nullif(lower(btrim(coalesce(p_email, ''))), ''); v_j record; v_jour date := public.flowin_jour_joueur(p_jour);
begin
  if v_email is null or position('@' in v_email) = 0 then return null; end if;
  select j.id, j.prenom into v_j from joueurs j where j.email_lower = v_email limit 1;
  if v_j.id is null then return null; end if;
  return jsonb_build_object('id', v_j.id, 'prenom', v_j.prenom,
    'deja_joue', p_event_id is not null and exists (select 1 from participations p
        where p.joueur_id = v_j.id and p.event_id = p_event_id and p.played_date = v_jour));
end $$;

-- C1-3. Anti-doublon des parcours vanilla : e-mail ou téléphone déjà inscrit sur cette station.
-- Même requête qu'avant (email_lower / tel + events contient la station), réponse réduite à un mot.
create or replace function public.joueur_doublon_event(p_email text, p_tel text, p_event_id text)
returns text language sql stable security definer set search_path = public as $$
  select case
    when p_event_id is null or p_event_id = '' then null
    when nullif(lower(btrim(coalesce(p_email, ''))), '') is not null and exists (select 1 from joueurs j
         where j.email_lower = lower(btrim(p_email)) and j.events @> array[p_event_id]) then 'email'
    when nullif(btrim(coalesce(p_tel, '')), '') is not null and exists (select 1 from joueurs j
         where j.tel = btrim(p_tel) and j.events @> array[p_event_id]) then 'tel'
  end;
$$;

-- C1-4. Règle du QR flashé (lib/parcours.ts controleRegleQr), même logique :
--   digital : bloqué si le joueur a déjà une participation sur l'animation ;
--   physique : bloqué si participation depuis p_depuis (minuit local du téléphone, borné à 36 h)
--   sur CE QR (hors NDS) ou sur la station (NDS, p_nds).
create or replace function public.joueur_regle_qr(p_joueur_id uuid, p_event_id text, p_source_qr text,
  p_digital boolean, p_nds boolean default false, p_depuis timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path = public, pg_temp as $$
declare v_t text; v_depuis timestamptz := greatest(coalesce(p_depuis, date_trunc('day', now())), now() - interval '36 hours');
begin
  if p_joueur_id is null or p_event_id is null then return jsonb_build_object('bloque', false, 'digital', coalesce(p_digital, false)); end if;
  if coalesce(p_digital, false) then
    select p.ticket_code into v_t from participations p where p.joueur_id = p_joueur_id and p.event_id = p_event_id limit 1;
    return jsonb_build_object('bloque', found, 'digital', true, 'ticket', v_t);
  end if;
  select p.ticket_code into v_t from participations p
   where p.joueur_id = p_joueur_id and p.event_id = p_event_id and p.created_at >= v_depuis
     and (coalesce(p_nds, false) or p.source_qr is not distinct from nullif(p_source_qr, ''))
   limit 1;
  return jsonb_build_object('bloque', found, 'digital', false, 'ticket', v_t);
end $$;

-- C1-5. Landing B2B : prospect déjà enregistré ?
create or replace function public.prospect_btob_existe(p_email text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from joueurs j where j.email_lower = lower(btrim(coalesce(p_email, ''))) and j.client_type = 'btob');
$$;

-- C1-6. /moi : fiche du joueur lui-même (id gardé dans le téléphone, comme mes_cadeaux).
create or replace function public.moi_profil(p_joueur_id uuid)
returns table(id uuid, prenom text, nom text, email text, external_id text)
language sql stable security definer set search_path = public as $$
  select j.id, j.prenom, j.nom, j.email, j.external_id from joueurs j where j.id = p_joueur_id;
$$;

-- C1-7. Mes lots (gagnés + offerts par un ami). L'uuid de l'autre joueur n'est jamais renvoyé :
-- joueur_id vaut null si ce n'est pas moi, offert_a_joueur_id vaut l'uuid nul si c'est un ami.
create or replace function public.mes_lots(p_joueur_id uuid)
returns table(id bigint, event_id text, super_event_id text, partenaire_id text, lot_nom text, lot_valeur numeric,
              ticket_code text, retrait_token text, retire_at timestamptz, notifie_at timestamptz, statut text,
              created_at timestamptz, valable_jusqu_au date, offert_le timestamptz, joueur_id uuid, offert_a_joueur_id uuid)
language sql stable security definer set search_path = public as $$
  select t.id, t.event_id, t.super_event_id, t.partenaire_id, t.lot_nom, t.lot_valeur, t.ticket_code, t.retrait_token,
         t.retire_at, t.notifie_at, t.statut, t.created_at, t.valable_jusqu_au, t.offert_le,
         case when t.joueur_id = p_joueur_id then t.joueur_id end,
         case when t.offert_a_joueur_id is null then null
              when t.offert_a_joueur_id = p_joueur_id then t.offert_a_joueur_id
              else '00000000-0000-0000-0000-000000000000'::uuid end
    from tirages t
   where p_joueur_id is not null and (t.joueur_id = p_joueur_id or t.offert_a_joueur_id = p_joueur_id)
   order by t.created_at desc limit 200;
$$;

-- C1-8. /jouer : mes participations (tickets par commerce).
create or replace function public.mes_participations(p_joueur_id uuid)
returns table(event_id text, ticket_code text, created_at timestamptz, tickets integer)
language sql stable security definer set search_path = public as $$
  select p.event_id, p.ticket_code, p.created_at, p.tickets from participations p
   where p_joueur_id is not null and p.joueur_id = p_joueur_id order by p.created_at desc limit 300;
$$;

-- C1-9. Pages pro rendues côté serveur (sans session, ?pro=) : statistiques joueurs du pro,
-- AUCUNE coordonnée (règle CONFIDENTIALITE du 31/10), identifiant pseudonymisé.
create or replace function public.pro_joueurs_stats(p_pro_id text)
returns table(id text, genre text, sexe text, age_tranche text, tranche_age text, code_postal text, ville text,
              optin boolean, optin_date date, events text[], source text, client_type text,
              first_seen date, last_seen date, gains integer, actif boolean)
language sql stable security definer set search_path = public as $$
  with ev as (select e.id from events e where p_pro_id is not null and e.pro_id = p_pro_id),
       ids as (select j.id from joueurs j where j.events && array(select id from ev)
               union select p.joueur_id from participations p where p.event_id in (select id from ev) and p.joueur_id is not null)
  select public.flowin_joueur_ref(j.id), j.genre, j.sexe, j.age_tranche, j.tranche_age, j.code_postal, j.ville,
         j.optin, j.optin_date, j.events, j.source, j.client_type, j.first_seen, j.last_seen, j.gains, j.actif
    from joueurs j where j.id in (select id from ids);
$$;

-- C1-10. Parties de stations (pages pro serveur) : joueur pseudonymisé, pas de coordonnées.
create or replace function public.pro_participations_lignes(p_event_ids text[], p_jour date default null)
returns table(event_id text, joueur_ref text, played_date date, created_at timestamptz, tickets integer,
              score integer, bonus_answers jsonb, source_qr text)
language sql stable security definer set search_path = public as $$
  select p.event_id, public.flowin_joueur_ref(p.joueur_id), p.played_date, p.created_at, p.tickets,
         p.score, p.bonus_answers, p.source_qr
    from participations p
   where p_event_ids is not null and cardinality(p_event_ids) <= 500 and p.event_id = any (p_event_ids)
     and (p_jour is null or p.played_date = p_jour)
   limit 50000;
$$;

-- C1-11. Nombre de parties par station.
create or replace function public.pro_participations_comptes(p_event_ids text[])
returns table(event_id text, n integer) language sql stable security definer set search_path = public as $$
  select p.event_id, count(*)::int from participations p
   where p_event_ids is not null and cardinality(p_event_ids) <= 500 and p.event_id = any (p_event_ids)
   group by p.event_id;
$$;

-- C1-12. Gagnants des opérations du pro (pages pro serveur) : SANS nom, e-mail, téléphone,
-- uuid ni jeton de retrait (le client connecté recharge la liste complète avec sa session).
create or replace function public.pro_tirages_operation(p_pro_id text)
returns table(id bigint, joueur_id uuid, joueur_nom text, joueur_email text, joueur_tel text, lot_nom text,
              lot_valeur numeric, ticket_code text, retrait_token text, notifie_at timestamptz, retire_at timestamptz,
              relance_envoyee_at timestamptz, created_at timestamptz, super_event_id text, event_id text,
              statut text, type text, valable_jusqu_au date, offert_le timestamptz)
language sql stable security definer set search_path = public as $$
  with pr as (select p.id, p.partenaire_id::text as partenaire_id from pros p where p.id = p_pro_id),
       ev as (select e.id, e.super_event_id from events e where e.pro_id = p_pro_id)
  select t.id, null::uuid, null::text, null::text, null::text, t.lot_nom, t.lot_valeur, t.ticket_code, null::text,
         t.notifie_at, t.retire_at, t.relance_envoyee_at, t.created_at, t.super_event_id, t.event_id, t.statut, t.type,
         t.valable_jusqu_au, t.offert_le
    from tirages t
   where coalesce(t.statut, '') <> 'annule' and p_pro_id is not null
     and (t.event_id in (select id from ev)
          or (t.type = 'grand' and t.partenaire_id = (select partenaire_id from pr)
              and t.super_event_id in (select super_event_id from ev where super_event_id is not null)));
$$;

-- C1-13. Fiche contact du CRM pro (serveur) : lots de CE joueur limités au périmètre du pro, sans jeton.
create or replace function public.pro_tirages_joueur(p_pro_id text, p_joueur_id uuid)
returns table(id bigint, lot_nom text, lot_valeur numeric, partenaire_id text, super_event_id text, event_id text,
              ticket_code text, retrait_token text, retire_at timestamptz, notifie_at timestamptz,
              relance_envoyee_at timestamptz, statut text, created_at timestamptz)
language sql stable security definer set search_path = public as $$
  select t.id, t.lot_nom, t.lot_valeur, t.partenaire_id, t.super_event_id, t.event_id, t.ticket_code, null::text,
         t.retire_at, t.notifie_at, t.relance_envoyee_at, t.statut, t.created_at
    from tirages t
   where p_pro_id is not null and t.joueur_id = p_joueur_id and coalesce(t.statut, '') <> 'annule'
     and (t.event_id in (select e.id from events e where e.pro_id = p_pro_id)
          or t.partenaire_id = (select p.partenaire_id::text from pros p where p.id = p_pro_id))
   order by t.created_at desc;
$$;

-- C1-14. Gains d'un partenaire dans un super event (page pro serveur) : deux comptes.
create or replace function public.tirages_comptes_partenaire(p_partenaire_id text, p_super_event_id text)
returns table(gains integer, utilises integer) language sql stable security definer set search_path = public as $$
  select count(*) filter (where coalesce(statut, '') <> 'annule')::int,
         count(*) filter (where statut = 'retire')::int
    from tirages where partenaire_id = p_partenaire_id and super_event_id = p_super_event_id;
$$;

do $$ declare f text; begin
  foreach f in array array[
    'flowin_joueur_ref(uuid)', 'flowin_joueur_est_moi(uuid)', 'flowin_pro_voit_joueur(uuid)',
    'joueur_inscrire(jsonb)', 'joueur_reconnaitre(text,text,date)', 'joueur_doublon_event(text,text,text)',
    'joueur_regle_qr(uuid,text,text,boolean,boolean,timestamptz)', 'prospect_btob_existe(text)',
    'moi_profil(uuid)', 'mes_lots(uuid)', 'mes_participations(uuid)', 'pro_joueurs_stats(text)',
    'pro_participations_lignes(text[],date)', 'pro_participations_comptes(text[])',
    'pro_tirages_operation(text)', 'pro_tirages_joueur(text,uuid)', 'tirages_comptes_partenaire(text,text)'] loop
    execute 'revoke all on function public.' || f || ' from public';
    execute 'grant execute on function public.' || f || ' to anon, authenticated';
  end loop; end $$;

notify pgrst, 'reload schema';

-- ═════════════════════════════ PARTIE C2 ════════════════════════════════════
-- ⚠ Après déploiement du code (commit « Sécurité joueurs partie C ») et contrôle de la
--   checklist « avant C2 » de la doc. Copier à partir d'ici.
-- -- PARTIE C2 DÉBUT

-- joueurs : plus de lecture anonyme ; lecture SA, pro lié, ou le joueur lui-même.
drop policy if exists joueurs_anon_select on public.joueurs;
drop policy if exists joueurs_lecture_authentifiee on public.joueurs;
drop policy if exists joueurs_lecture_sa_pro_moi on public.joueurs;
create policy joueurs_lecture_sa_pro_moi on public.joueurs for select to authenticated
  using (est_super_admin() or flowin_pro_voit_joueur(id) or flowin_joueur_est_moi(id));

-- participations : lecture SA, pro de la station, organisateur du super event, ou le joueur.
drop policy if exists participations_anon_select on public.participations;
drop policy if exists participations_lecture_authentifiee on public.participations;
drop policy if exists participations_lecture_sa_pro_moi on public.participations;
create policy participations_lecture_sa_pro_moi on public.participations for select to authenticated
  using (est_super_admin() or qr_est_proprietaire(event_id)
         or exists (select 1 from public.events e where e.id = participations.event_id and flowin_est_pro_super_event(e.super_event_id))
         or flowin_joueur_est_moi(joueur_id));

-- tirages (nom / e-mail / tél des gagnants) : lecture SA, pro de la station, du partenaire,
-- organisateur du super event, ou le gagnant / le destinataire du lot offert.
drop policy if exists tirages_anon_select on public.tirages;
drop policy if exists tirages_lecture_authentifiee on public.tirages;
drop policy if exists tirages_lecture_sa_pro_moi on public.tirages;
create policy tirages_lecture_sa_pro_moi on public.tirages for select to authenticated
  using (est_super_admin() or qr_est_proprietaire(event_id) or flowin_pro_lie_partenaire(partenaire_id)
         or flowin_est_pro_super_event(super_event_id)
         or flowin_joueur_est_moi(joueur_id) or flowin_joueur_est_moi(offert_a_joueur_id));

notify pgrst, 'reload schema';
-- -- PARTIE C2 FIN

-- ═════════════════════════════ ROLLBACK ═════════════════════════════════════
-- Partie C2 (retour exact à l'état prod du 19/11) :
-- drop policy if exists joueurs_lecture_sa_pro_moi on public.joueurs;
-- drop policy if exists participations_lecture_sa_pro_moi on public.participations;
-- drop policy if exists tirages_lecture_sa_pro_moi on public.tirages;
-- create policy joueurs_anon_select on public.joueurs for select to anon using (true);
-- create policy joueurs_lecture_authentifiee on public.joueurs for select to authenticated using (true);
-- create policy participations_anon_select on public.participations for select to anon using (true);
-- create policy participations_lecture_authentifiee on public.participations for select to authenticated using (true);
-- create policy tirages_anon_select on public.tirages for select to anon using (true);
-- create policy tirages_lecture_authentifiee on public.tirages for select to authenticated using (true);
-- notify pgrst, 'reload schema';
-- Partie C1 (le code retombe alors sur l'accès direct) :
-- drop function if exists public.joueur_inscrire(jsonb), public.joueur_reconnaitre(text,text,date),
--   public.joueur_doublon_event(text,text,text), public.joueur_regle_qr(uuid,text,text,boolean,boolean,timestamptz),
--   public.prospect_btob_existe(text), public.moi_profil(uuid), public.mes_lots(uuid), public.mes_participations(uuid),
--   public.pro_joueurs_stats(text), public.pro_participations_lignes(text[],date), public.pro_participations_comptes(text[]),
--   public.pro_tirages_operation(text), public.pro_tirages_joueur(text,uuid), public.tirages_comptes_partenaire(text,text),
--   public.flowin_pro_voit_joueur(uuid), public.flowin_joueur_est_moi(uuid), public.flowin_joueur_ref(uuid);
