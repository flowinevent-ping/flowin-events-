-- ============================================================
-- FLOWIN · NETTOYAGE DONNÉES TEST · 13/05/2026
-- ⚠️  ATTENTION : opération IRRÉVERSIBLE
--
-- Supprime toutes les données préfixées *-test-* OU taguées 'TEST'.
-- Préserve les données de production (Pâques Vence, NDS, etc.)
-- ============================================================

-- 1. Suppression par préfixe d'ID (sécurité 1)
DELETE FROM public.votes WHERE event_id LIKE 'ev-test-%';
DELETE FROM public.participations WHERE event_id LIKE 'ev-test-%';
DELETE FROM public.lots WHERE id LIKE 'lot-test-%';
DELETE FROM public.joueurs WHERE id LIKE 'j-test-%';
DELETE FROM public.events WHERE id LIKE 'ev-test-%';
DELETE FROM public.super_events WHERE id LIKE 'se-test-%';
DELETE FROM public.partenaires WHERE id LIKE 'part-test-%';
DELETE FROM public.pros WHERE id LIKE 'pro-test-%';

-- 2. Suppression par tag 'TEST' (sécurité 2, double filet)
DELETE FROM public.joueurs WHERE 'TEST' = ANY(tags);
DELETE FROM public.partenaires WHERE 'TEST' = ANY(tags);
DELETE FROM public.pros WHERE 'TEST' = ANY(tags);

-- 3. Suppression par description [FICTIF AUDIT] (sécurité 3)
DELETE FROM public.events WHERE description LIKE '[FICTIF AUDIT%';
DELETE FROM public.pros WHERE notes LIKE '[FICTIF AUDIT%';
DELETE FROM public.partenaires WHERE notes LIKE '[FICTIF AUDIT%';

-- 4. Vérification post-nettoyage
SELECT 'PROS test restants' as scope, count(*) FROM public.pros WHERE id LIKE 'pro-test-%' OR 'TEST' = ANY(tags)
UNION ALL SELECT 'PARTENAIRES restants', count(*) FROM public.partenaires WHERE id LIKE 'part-test-%' OR 'TEST' = ANY(tags)
UNION ALL SELECT 'EVENTS restants', count(*) FROM public.events WHERE id LIKE 'ev-test-%' OR description LIKE '[FICTIF AUDIT%'
UNION ALL SELECT 'SUPER EVENTS restants', count(*) FROM public.super_events WHERE id LIKE 'se-test-%'
UNION ALL SELECT 'JOUEURS restants', count(*) FROM public.joueurs WHERE id LIKE 'j-test-%' OR 'TEST' = ANY(tags)
UNION ALL SELECT 'LOTS restants', count(*) FROM public.lots WHERE id LIKE 'lot-test-%'
UNION ALL SELECT 'VOTES restants', count(*) FROM public.votes WHERE event_id LIKE 'ev-test-%'
UNION ALL SELECT 'PARTICIPATIONS restantes', count(*) FROM public.participations WHERE event_id LIKE 'ev-test-%';

-- Tous les résultats doivent être à 0
