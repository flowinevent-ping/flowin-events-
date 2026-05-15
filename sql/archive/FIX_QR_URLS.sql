-- ============================================================
-- FIX QR URLs · 15/05/2026
-- Remplace 'parcours/?ev=' par 'parcours_user.html?ev=' dans cfg.qrUrl
-- (le routeur parcours/index.html a été supprimé, remplacé par parcours_user.html)
-- ============================================================

UPDATE public.events
SET cfg = jsonb_set(
  cfg,
  '{qrUrl}',
  to_jsonb(
    REPLACE(
      cfg->>'qrUrl',
      'flowin-events.vercel.app/parcours/?ev=',
      'flowin-events.vercel.app/parcours_user.html?ev='
    )
  )
)
WHERE cfg->>'qrUrl' LIKE '%parcours/?ev=%';

-- Vérification
SELECT id, cfg->>'qrUrl' AS qr_url
FROM public.events
WHERE id LIKE 'ev-test-%'
ORDER BY id;
