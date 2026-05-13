-- ============================================================
-- FLOWIN · NETTOYAGE DONNÉES TEST · 13/05/2026
-- À exécuter pour supprimer le seed fictif
-- ============================================================
DELETE FROM public.votes WHERE event_id LIKE 'ev-test-%';
DELETE FROM public.participations WHERE event_id LIKE 'ev-test-%';
DELETE FROM public.lots WHERE id LIKE 'lot-test-%';
DELETE FROM public.joueurs WHERE id LIKE 'j-test-%';
DELETE FROM public.events WHERE id LIKE 'ev-test-%';
DELETE FROM public.super_events WHERE id LIKE 'se-test-%';
DELETE FROM public.partenaires WHERE id LIKE 'part-test-%';
DELETE FROM public.pros WHERE id LIKE 'pro-test-%';

SELECT 'Données test supprimées' AS status;
