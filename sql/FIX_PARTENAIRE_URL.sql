-- ============================================================
-- AJOUT COLONNE 'url' (site web) DANS partenaires · 15/05/2026
--
-- Objectif : permettre au SA de saisir l'URL site web de chaque
-- partenaire, utilisée comme lien cliquable dans les parcours user
-- (écrans "Nos partenaires").
-- ============================================================

-- 1. Ajout colonne url
ALTER TABLE public.partenaires
  ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '';

-- 2. Vérification
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'partenaires'
ORDER BY ordinal_position;
