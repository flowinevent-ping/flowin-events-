-- ============================================================
-- FLOWIN · NETTOYAGE DONNÉES TEST · 13/05/2026
-- ⚠️  IRRÉVERSIBLE
-- 
-- Supprime tout ce qui est marqué TEST/AUDIT :
--   - IDs *-test-*
--   - Tags ARRAY['TEST']
--   - Description [FICTIF AUDIT...]
--   - cfg.audit_id LIKE 'AUDIT-%'
--   - Comptes Auth *-test.fr
-- ============================================================

-- 1. Suppression par préfixe ID
DELETE FROM public.votes WHERE event_id LIKE 'ev-test-%';
DELETE FROM public.participations WHERE event_id LIKE 'ev-test-%';
DELETE FROM public.lots WHERE id LIKE 'lot-test-%';
DELETE FROM public.joueurs WHERE id LIKE 'j-test-%';
DELETE FROM public.events WHERE id LIKE 'ev-test-%';
DELETE FROM public.super_events WHERE id LIKE 'se-test-%';
DELETE FROM public.partenaires WHERE id LIKE 'part-test-%';
DELETE FROM public.pros WHERE id LIKE 'pro-test-%';
DELETE FROM public.banques WHERE id LIKE 'bq-test-%';

-- 2. Suppression par tag TEST
DELETE FROM public.joueurs WHERE 'TEST' = ANY(tags);
DELETE FROM public.partenaires WHERE 'TEST' = ANY(tags);
DELETE FROM public.pros WHERE 'TEST' = ANY(tags);

-- 3. Suppression par description ou audit_id
DELETE FROM public.events WHERE description LIKE '[FICTIF AUDIT%' OR cfg->>'audit_id' LIKE 'AUDIT-%';
DELETE FROM public.pros WHERE notes LIKE '[FICTIF AUDIT%';
DELETE FROM public.partenaires WHERE notes LIKE '[FICTIF AUDIT%';

-- 4. Suppression comptes Auth test
DELETE FROM public.profiles WHERE email LIKE '%@%-test.fr';
DELETE FROM public.profiles WHERE id LIKE '11111111-1111-1111-1111-1111111110%';
DELETE FROM auth.users WHERE email LIKE '%@%-test.fr';

-- 5. Vérification
SELECT 'PROS' as scope, count(*) FROM public.pros WHERE id LIKE 'pro-test-%' OR 'TEST' = ANY(tags)
UNION ALL SELECT 'PARTENAIRES', count(*) FROM public.partenaires WHERE id LIKE 'part-test-%' OR 'TEST' = ANY(tags)
UNION ALL SELECT 'EVENTS', count(*) FROM public.events WHERE id LIKE 'ev-test-%' OR cfg->>'audit_id' LIKE 'AUDIT-%'
UNION ALL SELECT 'SUPER EVENTS', count(*) FROM public.super_events WHERE id LIKE 'se-test-%'
UNION ALL SELECT 'JOUEURS', count(*) FROM public.joueurs WHERE id LIKE 'j-test-%' OR 'TEST' = ANY(tags)
UNION ALL SELECT 'LOTS', count(*) FROM public.lots WHERE id LIKE 'lot-test-%'
UNION ALL SELECT 'VOTES', count(*) FROM public.votes WHERE event_id LIKE 'ev-test-%'
UNION ALL SELECT 'PARTICIPATIONS', count(*) FROM public.participations WHERE event_id LIKE 'ev-test-%'
UNION ALL SELECT 'BANQUES', count(*) FROM public.banques WHERE id LIKE 'bq-test-%'
UNION ALL SELECT 'AUTH USERS test', count(*) FROM auth.users WHERE email LIKE '%@%-test.fr'
UNION ALL SELECT 'PROFILES test', count(*) FROM public.profiles WHERE email LIKE '%@%-test.fr';

-- Tous les résultats doivent être à 0
