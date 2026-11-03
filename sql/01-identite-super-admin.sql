-- ============================================================================
-- 01 — IDENTITE DU SUPER ADMIN (une seule table, une seule fonction)  [01/11/2026]
-- ============================================================================
-- ORDRE D'APPLICATION : voir sql/README-ORDRE.md (liste complete et a jour, testee par
-- admin/scripts/qa-qr/chaine-sql.sh). Tous les fichiers sont NON APPLIQUES, a lancer a la main, dans l'ordre :
--   07 (en premier, independant), 01 (celui-ci, prerequis de presque tout), 02, 03, 04, 05, 06,
--   2026-10-31-jeux-masters, 2026-10-31-positions-joueurs, 2026-11-01-tirage-auto-liste-gagnants,
--   08-bon-commande-v2, 09-qr-permaliens, 10-resultats-tirage.
-- Chaque fichier peut etre rejoue sans dommage (idempotent), sauf mention contraire.
--
-- PREREQUIS : aucun.
--
-- POURQUOI auth_id ET PAS L'EMAIL SEUL : les pros creent leur compte eux-memes (inscription
-- ouverte). Si on reconnaissait le Super Admin a son seul email, quelqu'un qui s'inscrirait avec
-- cet email avant confirmation pourrait devenir Super Admin. On reconnait donc l'identifiant du
-- compte Supabase Auth (auth.uid()), l'email n'est la que pour la lecture humaine.
--
-- A FOURNIR PAR ROMAIN AVANT D'OUVRIR LA PAGE SA :
--   1. creer le compte Supabase Auth du Super Admin (email + mot de passe, email confirme) ;
--   2. l'inscrire, en remplacant l'email entre crochets :
--        insert into public.flowin_super_admins (auth_id, email)
--          select id, lower(email) from auth.users where lower(email) = lower('[email du Super Admin à compléter]')
--        on conflict (auth_id) do nothing;
--   3. verifier : select count(*) from public.flowin_super_admins;   -- doit valoir >= 1
-- ============================================================================

create table if not exists public.flowin_super_admins (
  auth_id    uuid primary key,
  email      text not null default '',
  created_at timestamptz not null default now()
);
alter table public.flowin_super_admins enable row level security;
revoke all on public.flowin_super_admins from anon, authenticated;
grant all on public.flowin_super_admins to service_role;

create or replace function public.est_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.flowin_super_admins s where s.auth_id = auth.uid());
$$;
revoke all on function public.est_super_admin() from public, anon;
grant execute on function public.est_super_admin() to authenticated, service_role;
