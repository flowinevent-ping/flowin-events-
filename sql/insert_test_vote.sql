-- ══════════════════════════════════════════════════════
-- INSERT pro-cannes + ev-test-vote dans Supabase
-- À exécuter dans l'éditeur SQL Supabase (eu-west-1)
-- ══════════════════════════════════════════════════════

-- 1. Pro : TEST Mairie de Cannes
INSERT INTO public.profiles (id, role, pro_id, email, nom)
VALUES ('pro-cannes-auth', 'pro', 'pro-cannes', 'culture@ville-cannes.fr', 'TEST Mairie de Cannes')
ON CONFLICT (id) DO UPDATE SET
  pro_id = EXCLUDED.pro_id,
  nom    = EXCLUDED.nom;

-- 2. Event : TEST Vote Concerts Riviera
INSERT INTO public.events (
  id, pro_id, nom, module, status,
  date_d, date_f, h_start, h_end,
  lieu, adresse, description, couleur,
  participants, gagnants, joueurs_optin, score_min,
  cfg, stats, pro_visib
) VALUES (
  'ev-test-vote',
  'pro-cannes',
  'TEST Vote Concerts Riviera',
  'vote',
  'past',
  '2026-09-20', '2026-09-20',
  '18:00', '23:00',
  'Palais des Festivals',
  '1 Bd de la Croisette, 06400 Cannes',
  'Vote étoiles · Test module Vote · 5 artistes à évaluer',
  '#1E1B4B',
  3, 0, 3, 0,
  '{
    "qrUrl": "https://flowin-events.vercel.app/parcours_user.html?ev=ev-test-vote",
    "optinActif": true,
    "voteMode": "stars",
    "voteImgLayout": "central",
    "voteResultatsLive": false,
    "voteSections": [
      {"titre": "The Jazz Collective", "imageUrl": "", "emoji": "🎷"},
      {"titre": "Maya Simone",         "imageUrl": "", "emoji": "🎤"},
      {"titre": "Riviera Big Band",    "imageUrl": "", "emoji": "🎺"},
      {"titre": "Les Percussions du Monde", "imageUrl": "", "emoji": "🥁"},
      {"titre": "Electric Sunset",     "imageUrl": "", "emoji": "🎸"}
    ],
    "customQuestions": [{
      "id": "decouverte",
      "label": "Comment avez-vous connu l''événement ?",
      "type": "single",
      "options": [
        {"label": "📸 Instagram",    "val": "instagram"},
        {"label": "🔵 Facebook",     "val": "facebook"},
        {"label": "🏛 Site mairie",  "val": "mairie"},
        {"label": "📋 Affiche/Flyer","val": "affiche"},
        {"label": "🗣 Bouche à oreille","val": "bouche"}
      ]
    }]
  }'::jsonb,
  '{"ageMoyen":34,"txConversion":100,"txOptin":100,"genre":{"hommes":33,"femmes":67},"parJour":[{"d":"20 sep","v":3}]}'::jsonb,
  '{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":true,"msgBienvenue":"Bienvenue sur le dashboard Concerts Riviera 2026 !","langue":"fr"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  pro_id       = EXCLUDED.pro_id,
  nom          = EXCLUDED.nom,
  module       = EXCLUDED.module,
  status       = EXCLUDED.status,
  lieu         = EXCLUDED.lieu,
  couleur      = EXCLUDED.couleur,
  participants = EXCLUDED.participants,
  joueurs_optin= EXCLUDED.joueurs_optin,
  cfg          = EXCLUDED.cfg,
  stats        = EXCLUDED.stats,
  pro_visib    = EXCLUDED.pro_visib;

-- 3. Vérification
SELECT id, nom, module, status, cfg->>'qrUrl' AS qr_url
FROM public.events
WHERE id = 'ev-test-vote';
