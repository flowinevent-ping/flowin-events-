-- =====================================================================
-- 2026-11-19 · Sécurité RLS — PHASE 2 (toutes les autres tables public)
-- ORDRE D'APPLICATION :
--   1. sql/2026-11-19-securite-rls-tables.sql (phase 1, déjà appliquée en prod le 19/11)
--   2. CE FICHIER
-- Projet Supabase ywcqtupgoxfzkddqkztk · SQL Editor · coller tout le fichier · Run.
-- Détail table par table : docs/SECURITE-rls-tables-2026-11-19.md, section « Phase 2 ».
-- NON APPLIQUÉ : audit en lecture seule (pg_policies, grants, pg_proc) du 19/11.
--
-- Confirmé par Romain (19/11) : aucun Google Apps Script ni outil externe n'écrit en base.
-- Seuls écrivent : le code de ce dépôt, les edge functions (service_role, non concernées
-- par les RLS) et pg_cron (superutilisateur, non concerné).
--
-- Principe :
--   * flux joueur/visiteur anonymes (constatés dans le code) : INSERT seul, avec contrôle
--     de colonnes quand c'est possible ; plus aucun UPDATE/DELETE anonyme ;
--   * tables administrées : lecture selon les pages publiques qui les lisent ; écriture
--     Super Admin (public.est_super_admin()) ou pro propriétaire ;
--   * tables sans écrivain dans le code : RLS active, aucune politique anon ;
--   * TRUNCATE (qui contourne les RLS) retiré à anon et authenticated sur TOUTES les tables.
--
-- Idempotent : rejouable sans erreur. Aucune table ni donnée supprimée.
-- Code adapté dans la même livraison : admin/public/prospection.html envoie désormais le
-- jeton de session SA (avant : clé publishable seule).
-- =====================================================================

begin;

-- Fonction d'aide : le pro connecté possède-t-il le super event ? (SECURITY DEFINER)
create or replace function public.flowin_est_pro_super_event(p_se text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and p_se is not null
     and exists (select 1 from public.super_events s
                   join public.pros p on p.id = s.pro_id
                  where s.id = p_se and p.auth_id = auth.uid());
$$;
revoke all on function public.flowin_est_pro_super_event(text) from public;
grant execute on function public.flowin_est_pro_super_event(text) to authenticated;

-- Le pro connecté gère-t-il le lot (event du lot, ou partenaire du lot sans event) ?
create or replace function public.flowin_pro_gere_lot(p_lot text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and p_lot is not null
     and exists (select 1 from public.lots l
                  where l.id::text = p_lot
                    and (public.qr_est_proprietaire(l.event_id)
                         or (l.event_id is null and public.flowin_pro_lie_partenaire(l.partenaire_id))));
$$;
revoke all on function public.flowin_pro_gere_lot(text) from public;
grant execute on function public.flowin_pro_gere_lot(text) to authenticated;

-- ---------------------------------------------------------------------
-- 0. TRUNCATE retiré partout (contourne les RLS). Aucun code ne fait de TRUNCATE.
-- ---------------------------------------------------------------------
do $$
declare r record;
begin
  for r in select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
            where n.nspname = 'public' and c.relkind in ('r','p') loop
    execute format('revoke truncate on public.%I from anon, authenticated', r.relname);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- 1. config — aucun écrivain dans le code. Lecture publique conservée.
-- ---------------------------------------------------------------------
alter table public.config enable row level security;
drop policy if exists "allow all config" on public.config;
drop policy if exists "anon all config" on public.config;
drop policy if exists "anon insert config" on public.config;
drop policy if exists "anon update config" on public.config;
drop policy if exists "anon write config" on public.config;
drop policy if exists config_ecriture_sa on public.config;
create policy config_ecriture_sa on public.config
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 2. landings — lus par /landing, /nds (anon) ; écrits par dashboard.html et
--    OpsDetailClient (SA).
-- ---------------------------------------------------------------------
alter table public.landings enable row level security;
drop policy if exists flowin_anon_all_landings on public.landings;
drop policy if exists landings_write_anon on public.landings;
drop policy if exists landings_ecriture_sa on public.landings;
create policy landings_ecriture_sa on public.landings
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());
-- landings_read_public (SELECT public) conservée.

-- ---------------------------------------------------------------------
-- 3. banques — lues par les parcours joueurs (anon) ; écrites par le pro (BanqueEditor,
--    lib/banques.ts, Configurateur, ParcoursCreation) et le SA (dashboard).
-- ---------------------------------------------------------------------
alter table public.banques enable row level security;
drop policy if exists flowin_anon_all_banques on public.banques;
drop policy if exists banques_lecture on public.banques;
create policy banques_lecture on public.banques for select to anon, authenticated using (true);
drop policy if exists banques_insert_sa_ou_pro on public.banques;
create policy banques_insert_sa_ou_pro on public.banques
  for insert to authenticated
  with check (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));
drop policy if exists banques_update_sa_ou_pro on public.banques;
create policy banques_update_sa_ou_pro on public.banques
  for update to authenticated
  using (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id))
  with check (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));
drop policy if exists banques_delete_sa_ou_pro on public.banques;
create policy banques_delete_sa_ou_pro on public.banques
  for delete to authenticated
  using (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));

-- ---------------------------------------------------------------------
-- 4. event_modeles — /dashboard/jeux (lib/modeles.ts) uniquement : SA.
-- ---------------------------------------------------------------------
alter table public.event_modeles enable row level security;
drop policy if exists flowin_anon_all_event_modeles on public.event_modeles;
drop policy if exists event_modeles_lecture on public.event_modeles;
create policy event_modeles_lecture on public.event_modeles for select to anon, authenticated using (true);
drop policy if exists event_modeles_ecriture_sa on public.event_modeles;
create policy event_modeles_ecriture_sa on public.event_modeles
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 5. se_gains — lus par /moi, /se (anon) ; insérés par le joueur (gain immédiat,
--    lib/parcours.ts) et par le SA (dashboard.html).
-- ---------------------------------------------------------------------
alter table public.se_gains enable row level security;
drop policy if exists flowin_anon_all_se_gains on public.se_gains;
drop policy if exists se_gains_lecture on public.se_gains;
create policy se_gains_lecture on public.se_gains for select to anon, authenticated using (true);
drop policy if exists se_gains_insert_joueur on public.se_gains;
create policy se_gains_insert_joueur on public.se_gains
  for insert to anon, authenticated
  with check (type = 'immediat' and coalesce(utilise, false) = false and utilise_ts is null
              and joueur_id is not null and super_event_id is not null);
drop policy if exists se_gains_ecriture_sa_ou_pro on public.se_gains;
create policy se_gains_ecriture_sa_ou_pro on public.se_gains
  for all to authenticated
  using (public.est_super_admin() or public.qr_est_proprietaire(event_id)
         or public.flowin_est_pro_super_event(super_event_id))
  with check (public.est_super_admin() or public.qr_est_proprietaire(event_id)
              or public.flowin_est_pro_super_event(super_event_id));

-- ---------------------------------------------------------------------
-- 6. se_lots — lus par /jouer, tirage (anon) ; insérés à la création d'un super event
--    (ParcoursCreation, sous jeton SA sur /dashboard).
-- ---------------------------------------------------------------------
alter table public.se_lots enable row level security;
drop policy if exists flowin_anon_all_se_lots on public.se_lots;
drop policy if exists se_lots_lecture on public.se_lots;
create policy se_lots_lecture on public.se_lots for select to anon, authenticated using (true);
drop policy if exists se_lots_ecriture_sa_ou_pro on public.se_lots;
create policy se_lots_ecriture_sa_ou_pro on public.se_lots
  for all to authenticated
  using (public.est_super_admin() or public.flowin_est_pro_super_event(super_event_id))
  with check (public.est_super_admin() or public.flowin_est_pro_super_event(super_event_id));

-- ---------------------------------------------------------------------
-- 7. se_reponses — insert joueur (lib/parcours.ts) ; lecture joueur (historique).
-- ---------------------------------------------------------------------
alter table public.se_reponses enable row level security;
drop policy if exists flowin_anon_all_se_reponses on public.se_reponses;
drop policy if exists se_reponses_public_all on public.se_reponses;
drop policy if exists se_reponses_lecture on public.se_reponses;
create policy se_reponses_lecture on public.se_reponses for select to anon, authenticated using (true);
drop policy if exists se_reponses_insert_joueur on public.se_reponses;
create policy se_reponses_insert_joueur on public.se_reponses
  for insert to anon, authenticated with check (joueur_id is not null);
drop policy if exists se_reponses_ecriture_sa on public.se_reponses;
create policy se_reponses_ecriture_sa on public.se_reponses
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 8. se_tickets — upsert « ignore duplicates » joueur (= INSERT ON CONFLICT DO NOTHING).
-- ---------------------------------------------------------------------
alter table public.se_tickets enable row level security;
drop policy if exists flowin_anon_all_se_tickets on public.se_tickets;
drop policy if exists se_tickets_lecture on public.se_tickets;
create policy se_tickets_lecture on public.se_tickets for select to anon, authenticated using (true);
drop policy if exists se_tickets_insert_joueur on public.se_tickets;
create policy se_tickets_insert_joueur on public.se_tickets
  for insert to anon, authenticated
  with check (joueur_id is not null and super_event_id is not null and type in ('quiz','bonus'));
drop policy if exists se_tickets_ecriture_sa on public.se_tickets;
create policy se_tickets_ecriture_sa on public.se_tickets
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 9. sondage_brigade — insert anonyme (lib/parcours.ts, nds-brigade-verte*). Lecture SA.
-- ---------------------------------------------------------------------
alter table public.sondage_brigade enable row level security;
drop policy if exists sondage_brigade_public_all on public.sondage_brigade;
drop policy if exists sondage_brigade_public_insert on public.sondage_brigade;
drop policy if exists sondage_brigade_insert on public.sondage_brigade;
create policy sondage_brigade_insert on public.sondage_brigade
  for insert to anon, authenticated with check (coalesce(converti, false) = false);
drop policy if exists sondage_brigade_sa on public.sondage_brigade;
create policy sondage_brigade_sa on public.sondage_brigade
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 10. visites — insert anonyme (lib/track.ts) ; lue par les pages pro serveur (anon).
-- ---------------------------------------------------------------------
alter table public.visites enable row level security;
drop policy if exists flowin_anon_all_visites on public.visites;
drop policy if exists visites_lecture on public.visites;
create policy visites_lecture on public.visites for select to anon, authenticated using (true);
drop policy if exists visites_insert on public.visites;
create policy visites_insert on public.visites for insert to anon, authenticated with check (true);
drop policy if exists visites_ecriture_sa on public.visites;
create policy visites_ecriture_sa on public.visites
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 11. partenaire_clics — insert anonyme (parcours-tracking, NDS2026Client, /r/[pid]).
-- ---------------------------------------------------------------------
alter table public.partenaire_clics enable row level security;
drop policy if exists flowin_anon_all_partenaire_clics on public.partenaire_clics;
drop policy if exists partenaire_clics_lecture on public.partenaire_clics;
create policy partenaire_clics_lecture on public.partenaire_clics for select to anon, authenticated using (true);
drop policy if exists partenaire_clics_insert on public.partenaire_clics;
create policy partenaire_clics_insert on public.partenaire_clics
  for insert to anon, authenticated with check (partenaire_id is not null);
drop policy if exists partenaire_clics_ecriture_sa on public.partenaire_clics;
create policy partenaire_clics_ecriture_sa on public.partenaire_clics
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 12. crm_retours — leads entrants : nds-partenaire.html (anon), lib/pro.ts (pro) ;
--     gestion complète dashboard.html (SA). Plus de lecture anonyme (données de contact).
-- ---------------------------------------------------------------------
alter table public.crm_retours enable row level security;
drop policy if exists "Public read write crm_retours" on public.crm_retours;
drop policy if exists crm_retours_insert_lead on public.crm_retours;
create policy crm_retours_insert_lead on public.crm_retours
  for insert to anon, authenticated
  with check (coalesce(etat, 'nouveau') = 'nouveau' and coalesce(paiement_recu, false) = false
              and coalesce(facture_emise, false) = false and coalesce(logo_envoye, false) = false);
drop policy if exists crm_retours_sa on public.crm_retours;
create policy crm_retours_sa on public.crm_retours
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 13. parrainage — lecture + insert joueur (lib/parrainage.ts, déduplication côté client).
-- ---------------------------------------------------------------------
alter table public.parrainage enable row level security;
drop policy if exists "allow all parrainage" on public.parrainage;
drop policy if exists "anon all parrainage" on public.parrainage;
drop policy if exists parrainage_lecture on public.parrainage;
create policy parrainage_lecture on public.parrainage for select to anon, authenticated using (true);
drop policy if exists parrainage_insert_joueur on public.parrainage;
create policy parrainage_insert_joueur on public.parrainage
  for insert to anon, authenticated
  with check (sender is not null and destinataire is not null and sender <> destinataire
              and coalesce(pts_alloues, 1) <= 1);
drop policy if exists parrainage_ecriture_sa on public.parrainage;
create policy parrainage_ecriture_sa on public.parrainage
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 14. lots_stock — codes de lots : lib/stock.ts, lib/operations.ts (SA ou pro du lot).
--     Plus de lecture anonyme (les codes ne doivent pas fuiter).
-- ---------------------------------------------------------------------
alter table public.lots_stock enable row level security;
drop policy if exists "anon all lots_stock" on public.lots_stock;
drop policy if exists lots_stock_all on public.lots_stock;
drop policy if exists lots_stock_sa_ou_pro on public.lots_stock;
create policy lots_stock_sa_ou_pro on public.lots_stock
  for all to authenticated
  using (public.est_super_admin() or public.flowin_pro_gere_lot(lot_id))
  with check (public.est_super_admin() or public.flowin_pro_gere_lot(lot_id));

-- ---------------------------------------------------------------------
-- 15. liens_ephemeres — lib/dashboard.ts (SA) ; pro de l'event autorisé.
-- ---------------------------------------------------------------------
alter table public.liens_ephemeres enable row level security;
drop policy if exists liens_ephemeres_anon_all on public.liens_ephemeres;
drop policy if exists liens_ephemeres_sa_ou_pro on public.liens_ephemeres;
create policy liens_ephemeres_sa_ou_pro on public.liens_ephemeres
  for all to authenticated
  using (public.est_super_admin() or public.qr_est_proprietaire(event_id))
  with check (public.est_super_admin() or public.qr_est_proprietaire(event_id));

-- ---------------------------------------------------------------------
-- 16. prospection — dashboard.html, lib/commercial.ts, prospection.html (jeton SA).
--     Base commerciale (téléphones, emails) : SA uniquement, plus de lecture anonyme.
-- ---------------------------------------------------------------------
alter table public.prospection enable row level security;
drop policy if exists prospection_admin_all on public.prospection;
drop policy if exists prospection_anon_update on public.prospection;
drop policy if exists prospection_anon_select on public.prospection;
drop policy if exists prospection_sa on public.prospection;
create policy prospection_sa on public.prospection
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 17. documents_legaux — lus par cgv-nds.html (anon) ; édités par dashboard.html (SA).
-- ---------------------------------------------------------------------
alter table public.documents_legaux enable row level security;
drop policy if exists documents_legaux_admin_all on public.documents_legaux;
drop policy if exists documents_legaux_sa on public.documents_legaux;
create policy documents_legaux_sa on public.documents_legaux
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());
-- documents_legaux_select_public conservée.

-- ---------------------------------------------------------------------
-- 18. packs_participation — lus par lib/commercial.ts ; aucun écrivain : SA.
-- ---------------------------------------------------------------------
alter table public.packs_participation enable row level security;
drop policy if exists packs_participation_anon_update on public.packs_participation;
drop policy if exists packs_participation_sa on public.packs_participation;
create policy packs_participation_sa on public.packs_participation
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

-- ---------------------------------------------------------------------
-- 19. lots_visuels — lots-nds.html (session SA). Avant : tout compte connecté écrivait.
-- ---------------------------------------------------------------------
alter table public.lots_visuels enable row level security;
drop policy if exists lots_visuels_write on public.lots_visuels;
drop policy if exists lots_visuels_sa on public.lots_visuels;
create policy lots_visuels_sa on public.lots_visuels
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());
-- lots_visuels_read conservée.

-- ---------------------------------------------------------------------
-- 20. Tables sans écrivain dans le code : RLS active, plus aucune écriture anon.
--     gains (ancien modèle) : gains_select_own conservée.
--     votes, analytics_*, gas_backup_log : aucun lecteur ni écrivain -> aucune politique
--     (accès service_role / SQL Editor seulement).
-- ---------------------------------------------------------------------
alter table public.gains enable row level security;
drop policy if exists flowin_anon_all_gains on public.gains;
drop policy if exists gains_ecriture_sa on public.gains;
create policy gains_ecriture_sa on public.gains
  for all to authenticated using (public.est_super_admin()) with check (public.est_super_admin());

alter table public.votes enable row level security;
drop policy if exists anon_all_votes on public.votes;

alter table public.analytics_daily enable row level security;
drop policy if exists "allow all analytics_daily" on public.analytics_daily;
alter table public.analytics_events enable row level security;
drop policy if exists "allow all analytics_events" on public.analytics_events;
alter table public.analytics_kpi_snapshots enable row level security;
drop policy if exists "allow all analytics_kpi_snapshots" on public.analytics_kpi_snapshots;

alter table public.gas_backup_log enable row level security;
drop policy if exists anon_all_gas on public.gas_backup_log;

commit;

-- Vérification :
--   select tablename, policyname, cmd, roles::text, qual, with_check from pg_policies
--    where schemaname = 'public' and cmd <> 'SELECT'
--      and (qual = 'true' or with_check = 'true') order by 1, 2;
--   attendu : seules restent les INSERT voulus (joueurs_anon_insert, participations_anon_insert,
--   visites_insert, leads_landing « Anyone can insert », profils) ; aucun UPDATE/DELETE/ALL true.
--   select count(*) from information_schema.role_table_grants
--    where table_schema = 'public' and grantee in ('anon','authenticated') and privilege_type = 'TRUNCATE';
--   attendu : 0.
--
-- ROLLBACK (retour exact à l'état du 19/11, uniquement en cas de blocage en prod) :
--   begin;
--   create policy "allow all config" on public.config for all to public using (true) with check (true);
--   create policy "anon all config" on public.config for all to public using (true) with check (true);
--   create policy "anon insert config" on public.config for insert to public with check (true);
--   create policy "anon update config" on public.config for update to public using (true);
--   create policy "anon write config" on public.config for all to public using (true) with check (true);
--   create policy flowin_anon_all_landings on public.landings for all to public using (true) with check (true);
--   create policy landings_write_anon on public.landings for all to public using (true) with check (true);
--   create policy flowin_anon_all_banques on public.banques for all to public using (true) with check (true);
--   create policy flowin_anon_all_event_modeles on public.event_modeles for all to public using (true) with check (true);
--   create policy flowin_anon_all_se_gains on public.se_gains for all to public using (true) with check (true);
--   create policy flowin_anon_all_se_lots on public.se_lots for all to public using (true) with check (true);
--   create policy flowin_anon_all_se_reponses on public.se_reponses for all to public using (true) with check (true);
--   create policy se_reponses_public_all on public.se_reponses for all to public using (true) with check (true);
--   create policy flowin_anon_all_se_tickets on public.se_tickets for all to public using (true) with check (true);
--   create policy sondage_brigade_public_all on public.sondage_brigade for all to public using (true) with check (true);
--   create policy sondage_brigade_public_insert on public.sondage_brigade for insert to public with check (true);
--   create policy flowin_anon_all_visites on public.visites for all to public using (true) with check (true);
--   create policy flowin_anon_all_partenaire_clics on public.partenaire_clics for all to anon, authenticated using (true) with check (true);
--   create policy "Public read write crm_retours" on public.crm_retours for all to public using (true) with check (true);
--   create policy "allow all parrainage" on public.parrainage for all to public using (true) with check (true);
--   create policy "anon all parrainage" on public.parrainage for all to public using (true) with check (true);
--   create policy "anon all lots_stock" on public.lots_stock for all to anon using (true);
--   create policy lots_stock_all on public.lots_stock for all to public using (true);
--   create policy liens_ephemeres_anon_all on public.liens_ephemeres for all to anon using (true) with check (true);
--   create policy prospection_admin_all on public.prospection for all to authenticated using (true) with check (true);
--   create policy prospection_anon_update on public.prospection for update to anon using (true) with check (true);
--   create policy prospection_anon_select on public.prospection for select to anon using (true);
--   create policy documents_legaux_admin_all on public.documents_legaux for all to authenticated using (true) with check (true);
--   create policy packs_participation_anon_update on public.packs_participation for update to anon, authenticated using (true) with check (true);
--   create policy lots_visuels_write on public.lots_visuels for all to authenticated using (true) with check (true);
--   create policy flowin_anon_all_gains on public.gains for all to public using (true) with check (true);
--   create policy anon_all_votes on public.votes for all to public using (true) with check (true);
--   create policy "allow all analytics_daily" on public.analytics_daily for all to public using (true) with check (true);
--   create policy "allow all analytics_events" on public.analytics_events for all to public using (true) with check (true);
--   create policy "allow all analytics_kpi_snapshots" on public.analytics_kpi_snapshots for all to public using (true) with check (true);
--   create policy anon_all_gas on public.gas_backup_log for all to public using (true) with check (true);
--   -- TRUNCATE (seulement si réellement nécessaire, il contourne les RLS) :
--   -- do $$ declare r record; begin for r in select c.relname from pg_class c join pg_namespace n
--   --   on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind in ('r','p') loop
--   --   execute format('grant truncate on public.%I to anon, authenticated', r.relname); end loop; end $$;
--   commit;
--   (les nouvelles politiques peuvent rester : elles s'additionnent aux anciennes.)
--   prospection.html : revenir au commit précédent si la table est rouverte à anon.
