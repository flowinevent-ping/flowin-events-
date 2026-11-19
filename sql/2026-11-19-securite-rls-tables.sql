-- =====================================================================
-- 2026-11-19 · Sécurité RLS des tables sensibles (hors events)
-- ORDRE D'APPLICATION :
--   1. sql/2026-11-18-tirage-correctifs.sql
--   2. sql/2026-11-19-securite-events-rls.sql
--   3. CE FICHIER
-- Projet Supabase ywcqtupgoxfzkddqkztk · SQL Editor · coller tout le fichier · Run.
-- Détail table par table : docs/SECURITE-rls-tables-2026-11-19.md
--
-- Constat (lecture pg_policies / pg_class / grants du 19/11, lecture seule) :
--   lots, super_events       : ALL à public, true/true  -> n'importe qui (clé publishable) écrit/supprime
--   qr_stations              : ALL à anon, true/true    -> idem
--   participations           : UPDATE anon true ; ALL authenticated true
--   joueurs                  : ALL authenticated true   -> tout compte connecté (pro) modifie/supprime
--                              n'importe quel joueur
--   tirages                  : ALL authenticated true   -> tout pro connecté réécrit n'importe quel gain
--   comm_config, comm_templates, visites_archive_2026_06, visites_archive_apercu_2026_09 :
--                              RLS DÉSACTIVÉE + grants complets à anon (y compris TRUNCATE)
--
-- Principe :
--   * lectures : inchangées (les parcours joueurs, /q/[code], landing lisent sous la clé anon) ;
--   * écritures : Super Admin (public.est_super_admin()) ou pro propriétaire
--     (event -> pros.auth_id = auth.uid(), ou pro lié au partenaire du lot/gain) ;
--   * flux joueurs anonymes conservés tels quels : INSERT joueurs, INSERT participations
--     (aucun autre écrit direct anon trouvé dans admin/ ; tout le reste passe par des RPC
--     SECURITY DEFINER : joueur_marquer_partie, attribuer_gain_joueur, valider_lot, …).
--
-- Idempotent : rejouable sans erreur. Aucune table ni donnée supprimée.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 0. Fonctions d'aide (SECURITY DEFINER : ne dépendent pas des RLS de pros)
-- ---------------------------------------------------------------------
-- Déjà créée par 2026-11-19-securite-events-rls.sql ; recréée à l'identique pour que ce
-- fichier se suffise à lui-même.
create or replace function public.flowin_est_pro_proprietaire(p_pro text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null
     and exists (select 1 from public.pros p where p.id = p_pro and p.auth_id = auth.uid());
$$;
revoke all on function public.flowin_est_pro_proprietaire(text) from public;
grant execute on function public.flowin_est_pro_proprietaire(text) to authenticated;

-- Le pro connecté est-il le compte du partenaire (commerce) donné ?
create or replace function public.flowin_pro_lie_partenaire(p_partenaire text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and p_partenaire is not null
     and exists (select 1 from public.pros p
                  where p.auth_id = auth.uid() and p.partenaire_id::text = p_partenaire);
$$;
revoke all on function public.flowin_pro_lie_partenaire(text) from public;
grant execute on function public.flowin_pro_lie_partenaire(text) to authenticated;

-- public.qr_est_proprietaire(event_id) existe déjà (SECURITY DEFINER) : pro propriétaire de l'event.

-- ---------------------------------------------------------------------
-- 1. lots
-- ---------------------------------------------------------------------
alter table public.lots enable row level security;

drop policy if exists lots_lecture_publique on public.lots;
create policy lots_lecture_publique on public.lots
  for select to anon, authenticated using (true);

drop policy if exists lots_insert_sa_ou_pro on public.lots;
create policy lots_insert_sa_ou_pro on public.lots
  for insert to authenticated
  with check (public.est_super_admin()
              or public.qr_est_proprietaire(event_id)
              or (event_id is null and public.flowin_pro_lie_partenaire(partenaire_id)));

drop policy if exists lots_update_sa_ou_pro on public.lots;
create policy lots_update_sa_ou_pro on public.lots
  for update to authenticated
  using (public.est_super_admin()
         or public.qr_est_proprietaire(event_id)
         or (event_id is null and public.flowin_pro_lie_partenaire(partenaire_id)))
  with check (public.est_super_admin()
              or public.qr_est_proprietaire(event_id)
              or (event_id is null and public.flowin_pro_lie_partenaire(partenaire_id)));

drop policy if exists lots_delete_sa_ou_pro on public.lots;
create policy lots_delete_sa_ou_pro on public.lots
  for delete to authenticated
  using (public.est_super_admin() or public.qr_est_proprietaire(event_id));

drop policy if exists flowin_anon_all_lots on public.lots;

-- ---------------------------------------------------------------------
-- 2. super_events (écrits uniquement par le SA aujourd'hui ; pro propriétaire toléré en
--    modification si super_events.pro_id lui appartient)
-- ---------------------------------------------------------------------
alter table public.super_events enable row level security;

drop policy if exists super_events_lecture_publique on public.super_events;
create policy super_events_lecture_publique on public.super_events
  for select to anon, authenticated using (true);

drop policy if exists super_events_insert_sa on public.super_events;
create policy super_events_insert_sa on public.super_events
  for insert to authenticated
  with check (public.est_super_admin());

drop policy if exists super_events_update_sa_ou_pro on public.super_events;
create policy super_events_update_sa_ou_pro on public.super_events
  for update to authenticated
  using (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id))
  with check (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));

drop policy if exists super_events_delete_sa on public.super_events;
create policy super_events_delete_sa on public.super_events
  for delete to authenticated
  using (public.est_super_admin());

drop policy if exists flowin_anon_all_super_events on public.super_events;

-- ---------------------------------------------------------------------
-- 3. qr_stations (lecture anon conservée : /q/[code] résout le code court sous la clé anon)
-- ---------------------------------------------------------------------
alter table public.qr_stations enable row level security;

drop policy if exists qr_stations_lecture_anon on public.qr_stations;
create policy qr_stations_lecture_anon on public.qr_stations
  for select to anon using (true);
-- qr_stations_lecture_publies (SELECT authenticated, publie) et qr_stations_auth_gestion
-- (ALL authenticated, SA ou qr_est_proprietaire) existent déjà et sont conservées.

drop policy if exists qr_stations_anon_all on public.qr_stations;

-- ---------------------------------------------------------------------
-- 4. participations
--    Flux joueur anonyme conservé : SELECT + INSERT anon (lib/parcours.ts, lib/joueurs.ts,
--    public/parcours/*.html). INSERT authenticated conservé : un pro/SA connecté dans le même
--    navigateur qui joue passe en « authenticated » via le client Supabase par défaut.
-- ---------------------------------------------------------------------
alter table public.participations enable row level security;

drop policy if exists participations_lecture_authentifiee on public.participations;
create policy participations_lecture_authentifiee on public.participations
  for select to authenticated using (true);

drop policy if exists participations_insert_authentifie on public.participations;
create policy participations_insert_authentifie on public.participations
  for insert to authenticated with check (true);

drop policy if exists participations_update_sa_ou_pro on public.participations;
create policy participations_update_sa_ou_pro on public.participations
  for update to authenticated
  using (public.est_super_admin() or public.qr_est_proprietaire(event_id))
  with check (public.est_super_admin() or public.qr_est_proprietaire(event_id));

drop policy if exists participations_delete_sa_ou_pro on public.participations;
create policy participations_delete_sa_ou_pro on public.participations
  for delete to authenticated
  using (public.est_super_admin() or public.qr_est_proprietaire(event_id));

-- participations_anon_select et participations_anon_insert : conservées (flux joueur).
drop policy if exists participations_anon_update on public.participations;
drop policy if exists participations_admin_all on public.participations;

-- ---------------------------------------------------------------------
-- 5. joueurs
--    Lecture authentifiée conservée (les pros lisent leurs joueurs en direct : lib/pro.ts,
--    DataOperation, DiffusionOperation) -- risque résiduel documenté, à resserrer en phase 2.
--    INSERT anon conservé (flux joueur), INSERT authenticated conservé (même raison que 4).
--    UPDATE / DELETE : SA uniquement (le joueur passe par joueur_marquer_partie, le pro par
--    import_contacts_pro / maj_consentement, tous SECURITY DEFINER).
-- ---------------------------------------------------------------------
alter table public.joueurs enable row level security;

drop policy if exists joueurs_lecture_authentifiee on public.joueurs;
create policy joueurs_lecture_authentifiee on public.joueurs
  for select to authenticated using (true);

drop policy if exists joueurs_insert_authentifie on public.joueurs;
create policy joueurs_insert_authentifie on public.joueurs
  for insert to authenticated with check (true);

drop policy if exists joueurs_update_sa on public.joueurs;
create policy joueurs_update_sa on public.joueurs
  for update to authenticated
  using (public.est_super_admin()) with check (public.est_super_admin());

drop policy if exists joueurs_delete_sa on public.joueurs;
create policy joueurs_delete_sa on public.joueurs
  for delete to authenticated
  using (public.est_super_admin());

-- joueurs_anon_select et joueurs_anon_insert : conservées.
drop policy if exists joueurs_admin_all on public.joueurs;

-- ---------------------------------------------------------------------
-- 6. tirages
--    Créations / annulations / notifications : RPC SECURITY DEFINER (tirage_lot,
--    attribuer_gain_joueur, annuler_tirage, marquer_notifie…). Écrits directs restants :
--    marquerRelance (relance_envoyee_at), marquerGainUtilise / annulerTiragePro (statut),
--    depuis le SA ou l'espace pro (pro de l'event ou commerce partenaire du gain).
-- ---------------------------------------------------------------------
alter table public.tirages enable row level security;

drop policy if exists tirages_lecture_authentifiee on public.tirages;
create policy tirages_lecture_authentifiee on public.tirages
  for select to authenticated using (true);

drop policy if exists tirages_insert_sa on public.tirages;
create policy tirages_insert_sa on public.tirages
  for insert to authenticated
  with check (public.est_super_admin());

drop policy if exists tirages_update_sa_ou_pro on public.tirages;
create policy tirages_update_sa_ou_pro on public.tirages
  for update to authenticated
  using (public.est_super_admin()
         or public.qr_est_proprietaire(event_id)
         or public.flowin_pro_lie_partenaire(partenaire_id))
  with check (public.est_super_admin()
              or public.qr_est_proprietaire(event_id)
              or public.flowin_pro_lie_partenaire(partenaire_id));

drop policy if exists tirages_delete_sa on public.tirages;
create policy tirages_delete_sa on public.tirages
  for delete to authenticated
  using (public.est_super_admin());

-- tirages_anon_select : conservée.
drop policy if exists tirages_admin_all on public.tirages;

-- ---------------------------------------------------------------------
-- 7. comm_config / comm_templates : RLS désactivée aujourd'hui. Lues par le dashboard
--    (lib/comm.ts) et par la RPC comm_kit (SECURITY DEFINER) ; aucun écrit dans le code.
-- ---------------------------------------------------------------------
alter table public.comm_config enable row level security;
drop policy if exists comm_config_lecture on public.comm_config;
create policy comm_config_lecture on public.comm_config
  for select to anon, authenticated using (true);
drop policy if exists comm_config_ecriture_sa on public.comm_config;
create policy comm_config_ecriture_sa on public.comm_config
  for all to authenticated
  using (public.est_super_admin()) with check (public.est_super_admin());

alter table public.comm_templates enable row level security;
drop policy if exists comm_templates_lecture on public.comm_templates;
create policy comm_templates_lecture on public.comm_templates
  for select to anon, authenticated using (true);
drop policy if exists comm_templates_ecriture_sa on public.comm_templates;
create policy comm_templates_ecriture_sa on public.comm_templates
  for all to authenticated
  using (public.est_super_admin()) with check (public.est_super_admin());

revoke truncate on public.comm_config, public.comm_templates from anon, authenticated;

-- ---------------------------------------------------------------------
-- 8. Archives de visites : RLS désactivée, aucun lecteur ni écrit dans le code.
--    RLS activée sans politique : accès réservé au service_role / SQL Editor.
-- ---------------------------------------------------------------------
alter table public.visites_archive_2026_06 enable row level security;
alter table public.visites_archive_apercu_2026_09 enable row level security;
revoke truncate on public.visites_archive_2026_06, public.visites_archive_apercu_2026_09 from anon, authenticated;

commit;

-- Vérification :
--   select tablename, policyname, cmd, roles::text from pg_policies
--    where tablename in ('lots','super_events','qr_stations','participations','joueurs','tirages',
--                        'comm_config','comm_templates') order by 1,2;
--   select relname, relrowsecurity from pg_class
--    where relname in ('comm_config','comm_templates','visites_archive_2026_06','visites_archive_apercu_2026_09');
--   attendu : plus aucune politique ALL/INSERT/UPDATE/DELETE « true » pour anon/public sur ces
--   tables, hors joueurs_anon_insert et participations_anon_insert (flux joueur, voulus).
--
-- ROLLBACK (retour exact à l'état du 19/11, uniquement en cas de blocage en prod) :
--   begin;
--   create policy flowin_anon_all_lots on public.lots for all to public using (true) with check (true);
--   create policy flowin_anon_all_super_events on public.super_events for all to public using (true) with check (true);
--   create policy qr_stations_anon_all on public.qr_stations for all to anon using (true) with check (true);
--   create policy participations_anon_update on public.participations for update to anon using (true) with check (true);
--   create policy participations_admin_all on public.participations for all to authenticated using (true) with check (true);
--   create policy joueurs_admin_all on public.joueurs for all to authenticated using (true) with check (true);
--   create policy tirages_admin_all on public.tirages for all to authenticated using (true) with check (true);
--   alter table public.comm_config disable row level security;
--   alter table public.comm_templates disable row level security;
--   alter table public.visites_archive_2026_06 disable row level security;
--   alter table public.visites_archive_apercu_2026_09 disable row level security;
--   commit;
--   (les nouvelles politiques peuvent rester : elles sont plus restrictives et s'additionnent.)
