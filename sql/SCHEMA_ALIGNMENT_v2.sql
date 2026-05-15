-- ============================================================
-- FLOWIN · ALIGNEMENT SCHÉMA SUPABASE · 15/05/2026
--
-- Ajoute les colonnes manquantes pour aligner le schéma Supabase
-- avec ce que le dashboard SA et le parcours user écrivent réellement.
--
-- Audit factuel des écarts :
--   pros          : 6 colonnes manquantes
--   partenaires   : 6 colonnes (dont url, genre déjà fait)
--   events        : 8 colonnes (date_f, description, stats, pro_visib...)
--   super_events  : 1 colonne (date_f)
--   joueurs       : 5 colonnes (prenom, tel, code_postal, date_naissance, last_seen)
--   participations: 1 colonne (ticket_code)
--
-- IDEMPOTENT : ADD COLUMN IF NOT EXISTS — exécutable plusieurs fois.
-- À exécuter dans Supabase SQL Editor.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- 1. PROS (organisations clientes)
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS secteur TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS role_contact TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS notes TEXT;

-- ════════════════════════════════════════════════════════════
-- 2. PARTENAIRES
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS siret TEXT;
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS url TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS notes TEXT;

-- ════════════════════════════════════════════════════════════
-- 3. EVENTS (le plus gros écart)
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date_f DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS h_end TIME;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gagnants INT DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS joueurs_optin INT DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pro_visib JSONB DEFAULT '{}'::jsonb;

-- ════════════════════════════════════════════════════════════
-- 4. SUPER_EVENTS
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.super_events ADD COLUMN IF NOT EXISTS date_f DATE;

-- ════════════════════════════════════════════════════════════
-- 5. JOUEURS (genre déjà ajouté via FIX_GENRE_COLUMN.sql)
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS last_seen DATE;
-- genre déjà ajouté précédemment, mais on le re-déclare pour idempotence
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS genre TEXT;

-- ════════════════════════════════════════════════════════════
-- 6. PARTICIPATIONS
-- ════════════════════════════════════════════════════════════
ALTER TABLE public.participations ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE public.participations ADD COLUMN IF NOT EXISTS bonus_answers JSONB DEFAULT '{}'::jsonb;

-- ════════════════════════════════════════════════════════════
-- VÉRIFICATION : colonnes finales par table
-- ════════════════════════════════════════════════════════════
SELECT
  table_name,
  COUNT(*) AS col_count,
  STRING_AGG(column_name, ', ' ORDER BY ordinal_position) AS columns
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('pros','partenaires','events','super_events','joueurs','lots','banques','participations','votes','profiles','gas_backup_log')
GROUP BY table_name
ORDER BY table_name;
