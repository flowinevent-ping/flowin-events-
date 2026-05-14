-- ============================================================
-- FIX RLS · MODE TEST · 14/05/2026
-- Désactive complètement RLS sur toutes les tables data.
-- ⚠️ MODE TEST UNIQUEMENT — à réactiver avant production.
-- ============================================================

ALTER TABLE public.pros DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.partenaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.joueurs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.banques DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.participations DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Vérification
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname='public' 
ORDER BY tablename;
-- Toutes les colonnes rowsecurity doivent être false
