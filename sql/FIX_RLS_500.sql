-- ============================================================
-- FIX RLS 500 ERRORS · 14/05/2026
-- Problème : RLS sur profiles + subqueries vers profiles dans
--            les policies des autres tables → erreur 500.
-- 
-- Solution : ajouter des policies "anon_read" permissives sur 
--            toutes les tables nécessaires au mode test.
-- 
-- ⚠️  Mode TEST uniquement. À durcir avant production.
-- ============================================================

-- POLICIES "anon read all" — autoriser SELECT pour anonymes
-- (le dashboard SA fonctionne avec la clé anon publishable)

DROP POLICY IF EXISTS "anon_read_all" ON public.pros;
DROP POLICY IF EXISTS "anon_read_all" ON public.partenaires;
DROP POLICY IF EXISTS "anon_read_all" ON public.events;
DROP POLICY IF EXISTS "anon_read_all" ON public.super_events;
DROP POLICY IF EXISTS "anon_read_all" ON public.joueurs;
DROP POLICY IF EXISTS "anon_read_all" ON public.lots;
DROP POLICY IF EXISTS "anon_read_all" ON public.banques;
DROP POLICY IF EXISTS "anon_read_all" ON public.participations;
DROP POLICY IF EXISTS "anon_read_all" ON public.votes;
DROP POLICY IF EXISTS "anon_read_all" ON public.profiles;

CREATE POLICY "anon_read_all" ON public.pros FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.partenaires FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.events FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.super_events FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.joueurs FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.lots FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.banques FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.participations FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.votes FOR SELECT USING (true);
CREATE POLICY "anon_read_all" ON public.profiles FOR SELECT USING (true);

-- Autoriser aussi INSERT pour les parcours joueur (anon)
DROP POLICY IF EXISTS "anon_insert" ON public.joueurs;
DROP POLICY IF EXISTS "anon_insert" ON public.participations;
DROP POLICY IF EXISTS "anon_insert" ON public.votes;

CREATE POLICY "anon_insert" ON public.joueurs FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON public.participations FOR INSERT WITH CHECK (true);
CREATE POLICY "anon_insert" ON public.votes FOR INSERT WITH CHECK (true);

-- Vérification : compter les policies de chaque table
SELECT tablename, COUNT(*) AS policies_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Test rapide : SELECT events test depuis "anon"
SELECT id, nom, module FROM public.events WHERE id LIKE 'ev-test-%' LIMIT 5;
