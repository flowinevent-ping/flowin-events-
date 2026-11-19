-- =============================================================================
-- SÉCURITÉ JOUEURS — écritures et lectures joueur derrière des RPC (19/11/2026)
-- Doc : docs/SECURITE-joueurs-rpc-2026-11-19.md
--
-- PARTIE A : fonctions SECURITY DEFINER (additif, sans risque, applicable à tout moment).
-- PARTIE B : retrait des INSERT/SELECT anonymes sur se_tickets, se_gains, se_reponses,
--            parrainage, et du SELECT anonyme sur visites / partenaire_clics.
--            À appliquer UNIQUEMENT après déploiement Vercel du code qui appelle la partie A.
-- PARTIE C : (commentée) SELECT anonyme sur joueurs / participations / tirages :
--            prérequis listés dans la doc, ne pas appliquer en l'état.
-- Idempotent (create or replace / drop policy if exists). Rollback en pied de fichier.
-- =============================================================================

-- ═════════════════════════════ PARTIE A ═════════════════════════════════════

-- Jour de référence : le client calcule « today » en UTC (toISOString). On accepte
-- le jour du client s'il est à ±1 jour du jour serveur UTC, sinon on prend le jour serveur.
create or replace function public.flowin_jour_joueur(p_jour date)
returns date language sql stable set search_path = public as $$
  select case when p_jour is not null
               and p_jour between (now() at time zone 'UTC')::date - 1 and (now() at time zone 'UTC')::date + 1
              then p_jour else (now() at time zone 'UTC')::date end;
$$;

-- A1. Tickets Super Event + gain immédiat, décidés côté serveur.
-- Règles reprises de lib/parcours.ts attribuerSuperEvent (aucune nouvelle règle de jeu) :
--   * station rattachée à un super event, events.gain_ticket <> false ;
--   * 1 ticket « quiz » + 1 ticket « bonus » max par joueur / station / jour
--     (index unique se_tickets_unique_jour_type, ON CONFLICT DO NOTHING) ;
--   * gain immédiat = events.gain_immediat (libellé lu en base, jamais envoyé par le client),
--     code généré serveur, une fois par joueur / station / jour.
-- Contrôles serveur ajoutés (demande Romain) : joueur existant, partie enregistrée
-- (participation de ce joueur sur cette station dans les dernières 24 h), station et
-- super event non archivés, jour dans les dates du super event (±1 jour de tolérance).
create or replace function public.se_attribuer_partie(
  p_joueur_id uuid, p_event_id text, p_quiz boolean, p_bonus boolean,
  p_sur_place boolean default true, p_jour date default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_jour date := public.flowin_jour_joueur(p_jour);
  v_ev record; v_se record;
  v_tk int := 0; v_n int;
  v_code text; v_gain jsonb := null;
begin
  if p_joueur_id is null or p_event_id is null then return jsonb_build_object('ok', false, 'raison', 'parametres'); end if;
  if not exists (select 1 from joueurs j where j.id = p_joueur_id) then
    return jsonb_build_object('ok', false, 'raison', 'joueur'); end if;
  select e.id, e.super_event_id, e.gain_immediat, e.gain_ticket, e.status into v_ev from events e where e.id = p_event_id;
  if v_ev.id is null or v_ev.super_event_id is null then return jsonb_build_object('ok', false, 'raison', 'station'); end if;
  if coalesce(v_ev.status, '') = 'archived' then return jsonb_build_object('ok', false, 'raison', 'station_archivee'); end if;
  select s.id, s.status, s.date_d, s.date_f into v_se from super_events s where s.id = v_ev.super_event_id;
  if v_se.id is null or coalesce(v_se.status, '') = 'archived' then return jsonb_build_object('ok', false, 'raison', 'super_event'); end if;
  if (v_se.date_d is not null and v_jour < v_se.date_d - 1) or (v_se.date_f is not null and v_jour > v_se.date_f + 1) then
    return jsonb_build_object('ok', false, 'raison', 'hors_dates'); end if;
  if not exists (select 1 from participations p where p.joueur_id = p_joueur_id and p.event_id = p_event_id
                  and p.created_at > now() - interval '24 hours') then
    return jsonb_build_object('ok', false, 'raison', 'sans_partie'); end if;

  if coalesce(p_sur_place, true) and v_ev.gain_ticket is distinct from false then
    if coalesce(p_quiz, false) then
      insert into se_tickets (super_event_id, joueur_id, event_id, jour, type)
      values (v_se.id, p_joueur_id, p_event_id, v_jour, 'quiz') on conflict (joueur_id, event_id, jour, type) do nothing;
      get diagnostics v_n = row_count; v_tk := v_tk + v_n;
    end if;
    if coalesce(p_bonus, false) then
      insert into se_tickets (super_event_id, joueur_id, event_id, jour, type)
      values (v_se.id, p_joueur_id, p_event_id, v_jour, 'bonus') on conflict (joueur_id, event_id, jour, type) do nothing;
      get diagnostics v_n = row_count; v_tk := v_tk + v_n;
    end if;
  end if;

  if coalesce(p_sur_place, true) and nullif(btrim(coalesce(v_ev.gain_immediat, '')), '') is not null
     and not exists (select 1 from se_gains g where g.joueur_id = p_joueur_id and g.event_id = p_event_id
                      and g.type = 'immediat' and (g.created_at at time zone 'UTC')::date = v_jour) then
    v_code := 'G-' || upper(substr(md5(gen_random_uuid()::text), 1, 6));
    insert into se_gains (super_event_id, joueur_id, event_id, type, libelle, code, utilise)
    values (v_se.id, p_joueur_id, p_event_id, 'immediat', v_ev.gain_immediat, v_code, false);
    v_gain := jsonb_build_object('libelle', v_ev.gain_immediat, 'code', v_code);
  end if;
  return jsonb_build_object('ok', true, 'tickets', v_tk, 'gain', v_gain);
end $$;

-- A2. Réponses complètes (profil + découverte + quiz + bonus) : même contenu qu'avant,
-- super event déduit serveur. Garde-fou anti-flood : 10 lignes max par joueur/station/jour
-- (le client en écrit 1, + ré-essais réseau).
create or replace function public.se_enregistrer_reponses(
  p_joueur_id uuid, p_event_id text, p_jour date, p_source text, p_decouverte text,
  p_form jsonb, p_quiz_reponses jsonb, p_bonus_reponses jsonb, p_score numeric)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_jour date := public.flowin_jour_joueur(p_jour); v_se text;
begin
  if p_joueur_id is null or p_event_id is null then return false; end if;
  if not exists (select 1 from joueurs j where j.id = p_joueur_id) then return false; end if;
  select e.super_event_id into v_se from events e where e.id = p_event_id;
  if not found then return false; end if;
  if (select count(*) from se_reponses r where r.joueur_id = p_joueur_id and r.event_id = p_event_id and r.jour = v_jour) >= 10 then
    return false; end if;
  insert into se_reponses (joueur_id, event_id, super_event_id, jour, source, decouverte, form, quiz_reponses, bonus_reponses, score)
  values (p_joueur_id, p_event_id, v_se, v_jour, p_source, p_decouverte, p_form, p_quiz_reponses, p_bonus_reponses, p_score);
  return true;
end $$;

-- A3. Historique anti-répétition du joueur (ids de questions déjà vues + bonus déjà fait).
create or replace function public.mon_historique_reponses(p_joueur_id uuid)
returns jsonb language sql stable security definer set search_path = public as $$
  with r as (select quiz_reponses, bonus_reponses from se_reponses where joueur_id = p_joueur_id order by ts desc limit 200)
  select jsonb_build_object(
    'answered_quiz_ids', coalesce((select jsonb_agg(distinct q->>'qid') from r, jsonb_array_elements(
        case when jsonb_typeof(r.quiz_reponses) = 'array' then r.quiz_reponses else '[]'::jsonb end) q
        where coalesce(q->>'qid', '') <> ''), '[]'::jsonb),
    'bonus_done', exists (select 1 from r where jsonb_typeof(r.bonus_reponses) = 'object' and r.bonus_reponses <> '{}'::jsonb));
$$;

-- A4. Parrainage : mêmes règles que lib/parrainage.ts (pas d'auto-parrainage, 1 fois par
-- couple parrain/filleul, 3 parrainages validés max par parrain et par jour), plus :
-- parrain et filleul doivent exister (joueurs.external_id).
create or replace function public.parrainage_capturer(p_ref text, p_filleul text, p_etab text default null, p_canal text default null)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare v_ref text := nullif(btrim(coalesce(p_ref, '')), ''); v_fil text := nullif(btrim(coalesce(p_filleul, '')), '');
begin
  if v_ref is null or v_fil is null or v_ref = v_fil then return false; end if;
  if not exists (select 1 from joueurs where external_id = v_fil) then return false; end if;
  if not exists (select 1 from joueurs where external_id = v_ref) then return false; end if;
  if exists (select 1 from parrainage where sender = v_ref and destinataire = v_fil) then return false; end if;
  if (select count(*) from parrainage where sender = v_ref and statut = 'valide'
        and ts >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC') >= 3 then return false; end if;
  insert into parrainage (sender, sender_etab, destinataire, channel, statut, destinataire_inscrit, pts_alloues)
  values (v_ref, nullif(btrim(coalesce(p_etab, '')), ''), v_fil, nullif(btrim(coalesce(p_canal, '')), ''), 'valide', true, 1);
  return true;
end $$;

-- A5. Côté filleul : date du parrainage reçu (aucune autre colonne).
create or replace function public.parrainage_recu(p_external_id text)
returns timestamptz language sql stable security definer set search_path = public as $$
  select ts from parrainage where destinataire = p_external_id and statut = 'valide' order by ts desc limit 1;
$$;

-- A6. Données du joueur lui-même (identifié par son id gardé dans le téléphone, comme
-- mes_notifications / mes_cadeaux) : tickets, gains, stations terminées.
create or replace function public.moi_tickets_gains(p_joueur_id uuid, p_super_event_id text default null, p_event_ids text[] default null)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'tickets', coalesce((select jsonb_agg(jsonb_build_object('event_id', t.event_id, 'super_event_id', t.super_event_id, 'type', t.type, 'jour', t.jour) order by t.created_at)
                 from se_tickets t where t.joueur_id = p_joueur_id and (p_super_event_id is null or t.super_event_id = p_super_event_id)), '[]'::jsonb),
    'gains', coalesce((select jsonb_agg(jsonb_build_object('id', g.id, 'libelle', g.libelle, 'code', g.code, 'utilise', g.utilise, 'event_id', g.event_id, 'super_event_id', g.super_event_id, 'type', g.type) order by g.created_at)
                 from se_gains g where g.joueur_id = p_joueur_id and (p_super_event_id is null or g.super_event_id = p_super_event_id)), '[]'::jsonb),
    'stations_terminees', coalesce((select jsonb_agg(distinct p.event_id) from participations p
                 where p.joueur_id = p_joueur_id and p.completed = true and p_event_ids is not null and p.event_id = any (p_event_ids)), '[]'::jsonb));
$$;

-- A7. Agrégats pour les pages pro rendues côté serveur (sans session) : uniquement des comptes.
create or replace function public.se_tickets_compte_event(p_event_id text)
returns integer language sql stable security definer set search_path = public as $$
  select count(*)::int from se_tickets where event_id = p_event_id;
$$;

-- Origines : chaque visiteur identifié compte une fois, sur sa première source.
create or replace function public.visites_origines(p_event_ids text[], p_sans_etape boolean default true)
returns table(source text, n integer) language sql stable security definer set search_path = public as $$
  select x.source, count(*)::int from (
    select distinct on (v.visiteur_id) coalesce(nullif(v.source, ''), 'direct') as source
      from visites v
     where v.event_id = any (p_event_ids) and v.visiteur_id is not null
       and (not coalesce(p_sans_etape, true) or v.etape is null)
     order by v.visiteur_id, v.created_at) x
  group by x.source order by 2 desc;
$$;

-- Entonnoir d'une station : ont ouvert le quiz, ont fini, coupures réseau (jour UTC optionnel).
create or replace function public.visites_entonnoir(p_event_id text, p_jour date default null)
returns table(ont_ouvert integer, ont_fini integer, coupures integer) language sql stable security definer set search_path = public as $$
  select count(distinct visiteur_id) filter (where etape = 'quiz')::int,
         count(distinct visiteur_id) filter (where etape = 'resultats')::int,
         count(*) filter (where etape = 'err:reprise-reseau')::int
    from visites where event_id = p_event_id
     and (p_jour is null or (created_at at time zone 'UTC')::date = p_jour);
$$;

revoke all on function public.flowin_jour_joueur(date) from public;
grant execute on function public.flowin_jour_joueur(date) to anon, authenticated;
do $$ declare f text; begin
  foreach f in array array[
    'se_attribuer_partie(uuid,text,boolean,boolean,boolean,date)',
    'se_enregistrer_reponses(uuid,text,date,text,text,jsonb,jsonb,jsonb,numeric)',
    'mon_historique_reponses(uuid)', 'parrainage_capturer(text,text,text,text)', 'parrainage_recu(text)',
    'moi_tickets_gains(uuid,text,text[])', 'se_tickets_compte_event(text)',
    'visites_origines(text[],boolean)', 'visites_entonnoir(text,date)'] loop
    execute 'revoke all on function public.' || f || ' from public';
    execute 'grant execute on function public.' || f || ' to anon, authenticated';
  end loop; end $$;

notify pgrst, 'reload schema';

-- ═════════════════════════════ PARTIE B ═════════════════════════════════════
-- ⚠ Après déploiement du code (commit « Sécurité joueurs : RPC ») et contrôle de la
--   checklist « avant partie B » de la doc. Copier à partir d'ici.
-- -- PARTIE B DÉBUT

-- se_tickets : plus d'écriture ni de lecture anonyme ; lecture SA, pro de la station ou du super event.
drop policy if exists se_tickets_insert_joueur on public.se_tickets;
drop policy if exists se_tickets_lecture on public.se_tickets;
drop policy if exists se_tickets_lecture_sa_pro on public.se_tickets;
create policy se_tickets_lecture_sa_pro on public.se_tickets for select to authenticated
  using (est_super_admin() or qr_est_proprietaire(event_id) or flowin_est_pro_super_event(super_event_id));

-- se_gains (nom / e-mail / tél des gagnants) : lecture via se_gains_ecriture_sa_ou_pro (ALL) seulement.
drop policy if exists se_gains_insert_joueur on public.se_gains;
drop policy if exists se_gains_lecture on public.se_gains;

-- se_reponses (formulaire joueur complet) : lecture SA ou pro de la station / du super event.
drop policy if exists se_reponses_insert_joueur on public.se_reponses;
drop policy if exists se_reponses_lecture on public.se_reponses;
drop policy if exists se_reponses_lecture_sa_pro on public.se_reponses;
create policy se_reponses_lecture_sa_pro on public.se_reponses for select to authenticated
  using (est_super_admin() or qr_est_proprietaire(event_id) or flowin_est_pro_super_event(super_event_id));

-- parrainage : écriture par parrainage_capturer ; lecture SA (parrainage_ecriture_sa).
drop policy if exists parrainage_insert_joueur on public.parrainage;
drop policy if exists parrainage_lecture on public.parrainage;

-- visites : INSERT anonyme conservé (télémétrie) ; lecture SA ou pro de la station / du super event.
drop policy if exists visites_lecture on public.visites;
drop policy if exists visites_lecture_sa_pro on public.visites;
create policy visites_lecture_sa_pro on public.visites for select to authenticated
  using (est_super_admin() or qr_est_proprietaire(event_id)
         or exists (select 1 from public.events e where e.id = visites.event_id and flowin_est_pro_super_event(e.super_event_id)));

-- partenaire_clics : INSERT anonyme conservé (télémétrie) ; lecture SA, pro du partenaire ou de la station.
drop policy if exists partenaire_clics_lecture on public.partenaire_clics;
drop policy if exists partenaire_clics_lecture_sa_pro on public.partenaire_clics;
create policy partenaire_clics_lecture_sa_pro on public.partenaire_clics for select to authenticated
  using (est_super_admin() or flowin_pro_lie_partenaire(partenaire_id) or qr_est_proprietaire(event_id));

notify pgrst, 'reload schema';
-- -- PARTIE B FIN

-- ═════════════════════════════ PARTIE C (NE PAS APPLIQUER) ══════════════════
-- Lecture anonyme de joueurs / participations / tirages. Prérequis (doc, § Partie C) :
-- migrer les 8 parcours vanilla (public/parcours/*.html, parcours_user.html), writeJoueur /
-- claimJoueur / lookupJoueurByEmail (lib/parcours.ts), lib/mesLots.ts, tirage-nds.html,
-- lib/masters/tickets.ts et les pages pro serveur (/pro/*) qui lisent ces tables sans session.
-- drop policy if exists joueurs_anon_select on public.joueurs;
-- drop policy if exists participations_anon_select on public.participations;
-- drop policy if exists tirages_anon_select on public.tirages;

-- ═════════════════════════════ ROLLBACK ═════════════════════════════════════
-- Partie B :
-- drop policy if exists se_tickets_lecture_sa_pro on public.se_tickets;
-- create policy se_tickets_lecture on public.se_tickets for select to anon, authenticated using (true);
-- create policy se_tickets_insert_joueur on public.se_tickets for insert to anon, authenticated
--   with check (joueur_id is not null and super_event_id is not null and type = any (array['quiz','bonus']));
-- create policy se_gains_lecture on public.se_gains for select to anon, authenticated using (true);
-- create policy se_gains_insert_joueur on public.se_gains for insert to anon, authenticated
--   with check (type = 'immediat' and coalesce(utilise,false) = false and utilise_ts is null and joueur_id is not null and super_event_id is not null);
-- drop policy if exists se_reponses_lecture_sa_pro on public.se_reponses;
-- create policy se_reponses_lecture on public.se_reponses for select to anon, authenticated using (true);
-- create policy se_reponses_insert_joueur on public.se_reponses for insert to anon, authenticated with check (joueur_id is not null);
-- create policy parrainage_lecture on public.parrainage for select to anon, authenticated using (true);
-- create policy parrainage_insert_joueur on public.parrainage for insert to anon, authenticated
--   with check (sender is not null and destinataire is not null and sender <> destinataire and coalesce(pts_alloues,1) <= 1);
-- drop policy if exists visites_lecture_sa_pro on public.visites;
-- create policy visites_lecture on public.visites for select to anon, authenticated using (true);
-- drop policy if exists partenaire_clics_lecture_sa_pro on public.partenaire_clics;
-- create policy partenaire_clics_lecture on public.partenaire_clics for select to anon, authenticated using (true);
-- Partie A :
-- drop function if exists public.se_attribuer_partie(uuid,text,boolean,boolean,boolean,date), public.se_enregistrer_reponses(uuid,text,date,text,text,jsonb,jsonb,jsonb,numeric),
--   public.mon_historique_reponses(uuid), public.parrainage_capturer(text,text,text,text), public.parrainage_recu(text),
--   public.moi_tickets_gains(uuid,text,text[]), public.se_tickets_compte_event(text), public.visites_origines(text[],boolean),
--   public.visites_entonnoir(text,date), public.flowin_jour_joueur(date);
