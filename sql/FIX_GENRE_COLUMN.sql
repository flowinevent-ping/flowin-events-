-- ============================================================
-- AJOUT COLONNE 'genre' DANS joueurs · 15/05/2026
-- 
-- Objectif : harmonisation formulaires user (Quiz/QuizSolo/Spin/Vote)
-- Tous capturent désormais : Prénom + Email + Tel + Genre + Âge + CP + Source
-- ============================================================

-- 1. Ajout colonne genre (si absente)
ALTER TABLE public.joueurs
  ADD COLUMN IF NOT EXISTS genre TEXT;

-- 2. Vérification structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'joueurs'
ORDER BY ordinal_position;
