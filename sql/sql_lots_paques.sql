-- ══════════════════════════════════════════════════════════════════
-- FLOWIN · SEED LOTS PÂQUES 2026 — 8 lots
-- assigne_a = code joueur j-pq-* (TEXT reference)
-- Idempotent — ON CONFLICT (id) DO UPDATE
-- ══════════════════════════════════════════════════════════════════

INSERT INTO public.lots (id, event_id, partenaire_id, nom, valeur, quantite, assigne_a, retire, date_retrait, note)
VALUES
  ('lot-paques-1', 'ev-paques', NULL, 'Place Festival Nuits du Sud 2026',     0, 1, 'j-pq-02', TRUE,  '2026-04-07', 'Valable le 9, 11 ou 16 juillet 2026'),
  ('lot-paques-2', 'ev-paques', NULL, 'Place Festival Nuits du Sud 2026',     0, 1, 'j-pq-06', TRUE,  '2026-04-07', 'Valable le 9, 11 ou 16 juillet 2026'),
  ('lot-paques-3', 'ev-paques', NULL, 'Place Festival Nuits du Sud 2026',     0, 1, 'j-pq-09', TRUE,  '2026-04-07', 'Valable le 9, 11 ou 16 juillet 2026'),
  ('lot-paques-4', 'ev-paques', NULL, '2 places enfants Cinéma Casino de Vence', 0, 2, 'j-pq-15', TRUE, '2026-04-07', 'Cinéma Casino de Vence'),
  ('lot-paques-5', 'ev-paques', NULL, '2 places enfants Cinéma Casino de Vence', 0, 2, NULL,    FALSE, NULL,         'Cinéma Casino de Vence'),
  ('lot-paques-6', 'ev-paques', NULL, '2 places enfants Cinéma Casino de Vence', 0, 2, NULL,    FALSE, NULL,         'Cinéma Casino de Vence'),
  ('lot-paques-7', 'ev-paques', NULL, '2 places enfants Cinéma Casino de Vence', 0, 2, NULL,    FALSE, NULL,         'Cinéma Casino de Vence'),
  ('lot-paques-8', 'ev-paques', NULL, '2 places enfants Cinéma Casino de Vence', 0, 2, NULL,    FALSE, NULL,         'Cinéma Casino de Vence')
ON CONFLICT (id) DO UPDATE SET
  nom          = EXCLUDED.nom,
  assigne_a    = EXCLUDED.assigne_a,
  retire       = EXCLUDED.retire,
  date_retrait = EXCLUDED.date_retrait,
  note         = EXCLUDED.note;

SELECT COUNT(*) AS lots_inseres FROM public.lots WHERE event_id = 'ev-paques';
