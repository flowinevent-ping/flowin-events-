-- ============================================================
-- PATCH 13/05/2026 — Ajout colonnes partenaires + table votes
-- À exécuter dans Supabase SQL Editor
-- Idempotent
-- ============================================================

-- 1. Ajouter colonnes manquantes à partenaires
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Local';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS siret TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS contrat TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS events TEXT[] DEFAULT '{}';

-- 2. Table VOTES (module vote)
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  joueur_id TEXT,
  cible_id TEXT NOT NULL,      -- ID du choix voté (pro, comédien, concert, etc.)
  cible_type TEXT,              -- 'pro', 'comedien', 'concert', 'autre'
  note INT,                     -- note 1-5 si vote étoiles, sinon NULL
  ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_votes_event ON public.votes(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_cible ON public.votes(cible_id);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes_sa" ON public.votes;
DROP POLICY IF EXISTS "votes_pro" ON public.votes;
DROP POLICY IF EXISTS "votes_anon_insert" ON public.votes;
CREATE POLICY "votes_sa" ON public.votes FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "votes_pro" ON public.votes FOR SELECT USING (event_id IN (SELECT id FROM public.events WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid())));
CREATE POLICY "votes_anon_insert" ON public.votes FOR INSERT WITH CHECK (true);

-- 3. Vérification
SELECT 'partenaires' as tbl, count(*) FROM public.partenaires
UNION ALL SELECT 'votes', count(*) FROM public.votes;
