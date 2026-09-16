-- P3 (16/09 soir) : aperçu du VRAI jeu pendant la creation d une operation.
-- Appliquee le 16/09/2026 sur le projet ywcqtupgoxfzkddqkztk.
-- Un event demo par jeu, sur le modele des demos existantes (ev-demo-quizsolo,
-- ev-demo-quizmaster, ev-demo-vote : client_type 'demo', pro_id null,
-- cfg.demo = true). Ils ne servent qu en ?preview=1 (aucune visite, aucune
-- ecriture joueur en apercu). Segments de roue : ceux que le formulaire public
-- /rejoindre ecrivait par defaut.
insert into events (id, pro_id, nom, module, status, client_type, couleur, cfg, participants, gagnants, joueurs_optin)
values
 ('ev-demo-nds2026', null, 'Démo · Quiz + bonus', 'nds2026', 'live', 'demo', '#7C2D92',
  '{"demo": true, "subtitle": "Aperçu du module", "quizBanques": ["bq-nds-artistes"], "quizNbQuestions": 4, "qrUrl": "https://flowin-events.vercel.app/parcours/nds2026?ev=ev-demo-nds2026"}', 0, 0, 0),
 ('ev-demo-quiz', null, 'Démo · Quiz', 'quiz', 'live', 'demo', '#7C2D92',
  '{"demo": true, "subtitle": "Aperçu du module", "quizBanques": ["bq-nds-artistes"], "quizNbQuestions": 5, "qrUrl": "https://flowin-events.vercel.app/parcours/quiz?ev=ev-demo-quiz"}', 0, 0, 0),
 ('ev-demo-spin', null, 'Démo · Roue', 'spin', 'live', 'demo', '#7C2D92',
  '{"demo": true, "subtitle": "Tente ta chance !", "qrUrl": "https://flowin-events.vercel.app/parcours/spin?ev=ev-demo-spin", "spinSegments": [{"label": "🎁 Surprise", "color": "#0F9E73"}, {"label": "Rejoue", "color": "#64748B", "perdant": true}, {"label": "-10%", "color": "#F59E0B"}, {"label": "🎟️ +1 ticket", "color": "#3B5CC4"}, {"label": "Pas cette fois", "color": "#64748B", "perdant": true}, {"label": "Cadeau", "color": "#E11D48"}]}', 0, 0, 0),
 ('ev-demo-tombola', null, 'Démo · Tombola', 'tombola', 'live', 'demo', '#7C2D92',
  '{"demo": true, "subtitle": "Aperçu du module", "qrUrl": "https://flowin-events.vercel.app/parcours/tombola?ev=ev-demo-tombola"}', 0, 0, 0)
on conflict (id) do nothing;
