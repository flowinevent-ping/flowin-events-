-- ============================================================
-- SIMULATION : 4 joueurs scannent les QR et participent
-- (équivalent de tester en vrai depuis un téléphone)
-- 
-- Joueurs simulés :
--   · Romain joue au Spin seul → gagne "Cadeau"
--   · Sophie joue à la Tombola → ticket 247831
--   · Karim vote aux concerts → notes étoiles
--   · Léa joue au Quiz → score 4/5
-- ============================================================

-- 1. ROMAIN SPIN
INSERT INTO public.joueurs (id, email, nom, prenom, tel, ville, code_postal, 
  events, source, optin, optin_date, first_seen, last_seen, gains, lot_gagne, client_type, tags) 
VALUES (
  'j-sim-romain', 'romain.test@flowin.fr', 'Collin', 'Romain', '06 12 34 56 78',
  'Vence', '06140', ARRAY['ev-test-spin-only'], 'QR Spin Cannes (simu)', TRUE, 
  '2026-05-14', '2026-05-14', '2026-05-14', 1, 'Cadeau', 'btoc', ARRAY['SIMU']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.participations (event_id, joueur_id, score, completed) 
VALUES ('ev-test-spin-only', 'j-sim-romain', 0, TRUE);

-- 2. SOPHIE TOMBOLA
INSERT INTO public.joueurs (id, email, nom, prenom, tel, ville, code_postal,
  events, source, optin, optin_date, first_seen, last_seen, gains, ticket_code, client_type, tags)
VALUES (
  'j-sim-sophie', 'sophie.test@flowin.fr', 'Martin', 'Sophie', '06 22 33 44 55',
  'Cannes', '06400', ARRAY['ev-test-tombola-only'], 'QR Tombola Cannes (simu)', TRUE,
  '2026-05-14', '2026-05-14', '2026-05-14', 0, '247831', 'btoc', ARRAY['SIMU']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.participations (event_id, joueur_id, score, completed)
VALUES ('ev-test-tombola-only', 'j-sim-sophie', 0, TRUE);

-- 3. KARIM VOTE CONCERTS
INSERT INTO public.joueurs (id, email, nom, prenom, ville, 
  events, source, optin, optin_date, first_seen, last_seen, client_type, tags)
VALUES (
  'j-sim-karim', 'karim.test@flowin.fr', 'Benali', 'Karim', 'Nice',
  ARRAY['ev-test-vote'], 'QR Vote (simu)', TRUE,
  '2026-05-14', '2026-05-14', '2026-05-14', 'btoc', ARRAY['SIMU']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.votes (event_id, joueur_id, cible_id, cible_type, note) VALUES
  ('ev-test-vote', 'j-sim-karim', 'c1', 'concert', 5),  -- Rock
  ('ev-test-vote', 'j-sim-karim', 'c2', 'concert', 3),  -- Jazz
  ('ev-test-vote', 'j-sim-karim', 'c3', 'concert', 4);  -- Pop

INSERT INTO public.participations (event_id, joueur_id, score, completed)
VALUES ('ev-test-vote', 'j-sim-karim', 0, TRUE);

-- 4. LÉA QUIZ
INSERT INTO public.joueurs (id, email, nom, prenom, ville, code_postal,
  events, source, optin, optin_date, first_seen, last_seen, score_moy, decouverte, client_type, tags)
VALUES (
  'j-sim-lea', 'lea.test@flowin.fr', 'Dupré', 'Léa', 'Antibes', '06600',
  ARRAY['ev-test-quiz'], 'QR Quiz Cannes (simu)', TRUE,
  '2026-05-14', '2026-05-14', '2026-05-14', '4/5', 'instagram', 'btoc', ARRAY['SIMU']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.participations (event_id, joueur_id, score, completed)
VALUES ('ev-test-quiz', 'j-sim-lea', 4, TRUE);

-- ─── VÉRIFICATION ─────────────────────────────────────────
SELECT 'Joueurs simulés' AS scope, count(*) AS n FROM public.joueurs WHERE id LIKE 'j-sim-%'
UNION ALL SELECT 'Participations simulées', count(*) FROM public.participations WHERE joueur_id LIKE 'j-sim-%'
UNION ALL SELECT 'Votes simulés', count(*) FROM public.votes WHERE joueur_id LIKE 'j-sim-%'
UNION ALL SELECT 'TOTAL joueurs base', count(*) FROM public.joueurs;
