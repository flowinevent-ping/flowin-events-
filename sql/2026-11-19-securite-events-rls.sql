-- =====================================================================
-- 2026-11-19 · Sécurité table public.events (RLS)
-- À APPLIQUER APRÈS sql/2026-11-18-tirage-correctifs.sql (non appliqué à ce jour).
-- Projet Supabase ywcqtupgoxfzkddqkztk · SQL Editor · coller tout le fichier · Run.
--
-- Constat (lecture pg_policies du 19/11) : une seule politique, « flowin_anon_all_events »,
-- FOR ALL TO public USING (true) WITH CHECK (true) : n'importe qui muni de la clé publishable
-- peut créer, modifier, supprimer n'importe quel event.
--
-- Cible :
--   * lecture : ouverte (les parcours joueurs, landing, pro_mobile, admin-commandes lisent
--     events avec select=* sous la clé anon ; RLS ne filtre pas les colonnes, la lecture reste
--     donc identique à aujourd'hui) ;
--   * insertion / modification / suppression : uniquement un utilisateur authentifié qui est
--     Super Admin (public.est_super_admin()) ou le pro propriétaire de l'event
--     (pros.auth_id = auth.uid()).
--
-- Idempotent : rejouable sans erreur. Aucune table supprimée.
-- =====================================================================

begin;

-- Fonction d'aide : l'utilisateur connecté possède-t-il ce pro ?
-- SECURITY DEFINER pour ne pas dépendre des politiques RLS de la table pros.
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

alter table public.events enable row level security;

-- 1. Lecture publique (inchangée fonctionnellement)
drop policy if exists events_lecture_publique on public.events;
create policy events_lecture_publique on public.events
  for select to anon, authenticated
  using (true);

-- 2. Insertion : SA, ou pro qui crée un event pour son propre pro_id
drop policy if exists events_insert_sa_ou_pro on public.events;
create policy events_insert_sa_ou_pro on public.events
  for insert to authenticated
  with check (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));

-- 3. Modification : SA, ou pro propriétaire (avant ET après : il ne peut pas céder l'event)
drop policy if exists events_update_sa_ou_pro on public.events;
create policy events_update_sa_ou_pro on public.events
  for update to authenticated
  using (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id))
  with check (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));

-- 4. Suppression : SA, ou pro propriétaire
drop policy if exists events_delete_sa_ou_pro on public.events;
create policy events_delete_sa_ou_pro on public.events
  for delete to authenticated
  using (public.est_super_admin() or public.flowin_est_pro_proprietaire(pro_id));

-- 5. Retrait de l'ancienne politique ouverte (en dernier, une fois les nouvelles en place,
--    dans la même transaction : aucune fenêtre sans politique de lecture).
drop policy if exists flowin_anon_all_events on public.events;

commit;

-- Vérification :
--   select policyname, cmd, roles::text from pg_policies where tablename = 'events';
--   attendu : events_lecture_publique (SELECT), events_insert_sa_ou_pro, events_update_sa_ou_pro,
--             events_delete_sa_ou_pro ; plus de flowin_anon_all_events.
--
-- ROLLBACK (retour exact à l'état du 19/11, à n'utiliser qu'en cas de blocage en prod) :
--   begin;
--   create policy flowin_anon_all_events on public.events for all to public using (true) with check (true);
--   drop policy if exists events_lecture_publique on public.events;
--   drop policy if exists events_insert_sa_ou_pro on public.events;
--   drop policy if exists events_update_sa_ou_pro on public.events;
--   drop policy if exists events_delete_sa_ou_pro on public.events;
--   commit;
--   (la fonction flowin_est_pro_proprietaire peut rester, elle est inoffensive.)
