-- ============================================================
-- FIX QR URLs · v2 · 15/05/2026
-- 
-- Reformatte TOUTES les qrUrl pour qu'elles soient cohérentes :
--   https://flowin-events.vercel.app/parcours_user.html?ev={event_id}
-- 
-- À exécuter UNE FOIS après le déploiement du nouveau code.
-- À l'avenir, supaWriteEvent() génère ça automatiquement à chaque save.
-- ============================================================

UPDATE public.events
SET cfg = jsonb_set(
  COALESCE(cfg, '{}'::jsonb),
  '{qrUrl}',
  to_jsonb('https://flowin-events.vercel.app/parcours_user.html?ev=' || id)
);

-- Vérification : tous les events test doivent avoir la bonne URL
SELECT 
  id, 
  module,
  cfg->>'qrUrl' AS qr_url
FROM public.events
WHERE id LIKE 'ev-test-%'
ORDER BY id;
