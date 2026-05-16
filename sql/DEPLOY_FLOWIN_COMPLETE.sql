-- ══════════════════════════════════════════════════════════════════
-- FLOWIN · DÉPLOIEMENT COMPLET SUPABASE
-- Ordre : CREATE TABLES → ALTER (colonnes manquantes) → INSERT data
-- Idempotent — exécutable plusieurs fois sans risque
-- ══════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
-- 1. CRÉATION DES TABLES
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pros (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  ville       TEXT,
  code_postal TEXT,
  adresse     TEXT,
  siret       TEXT,
  secteur     TEXT,
  contact     TEXT,
  role_contact TEXT,
  email       TEXT,
  tel         TEXT,
  entree_p    DATE,
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.partenaires (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  ville       TEXT,
  code_postal TEXT,
  adresse     TEXT,
  siret       TEXT,
  secteur     TEXT,
  contact     TEXT,
  role        TEXT,
  email       TEXT,
  tel         TEXT,
  url         TEXT DEFAULT '',
  notes       TEXT,
  tags        TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.banques (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  pro_id      TEXT,
  event_ids   TEXT[] DEFAULT '{}',
  questions   JSONB  DEFAULT '[]'::jsonb,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id             TEXT PRIMARY KEY,
  pro_id         TEXT REFERENCES public.pros(id),
  nom            TEXT NOT NULL,
  module         TEXT NOT NULL,
  status         TEXT DEFAULT 'upcoming',
  date_d         DATE,
  date_f         DATE,
  h_start        TIME,
  h_end          TIME,
  lieu           TEXT,
  adresse        TEXT,
  description    TEXT,
  couleur        TEXT DEFAULT '#7C2D92',
  participants   INT  DEFAULT 0,
  gagnants       INT  DEFAULT 0,
  joueurs_optin  INT  DEFAULT 0,
  score_min      INT  DEFAULT 0,
  cfg            JSONB DEFAULT '{}'::jsonb,
  stats          JSONB DEFAULT '{}'::jsonb,
  pro_visib      JSONB DEFAULT '{}'::jsonb,
  super_event_id TEXT,
  client_type    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.super_events (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL,
  pros        TEXT[] DEFAULT '{}',
  events      TEXT[] DEFAULT '{}',
  date_d      DATE,
  date_f      DATE,
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.joueurs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email          TEXT,
  nom            TEXT,
  prenom         TEXT,
  genre          TEXT,
  tel            TEXT,
  ville          TEXT,
  code_postal    TEXT,
  adresse        TEXT,
  date_naissance DATE,
  events         TEXT[] DEFAULT '{}',
  gains          TEXT[] DEFAULT '{}',
  score_moy      NUMERIC DEFAULT 0,
  optin          BOOLEAN DEFAULT FALSE,
  optin_date     DATE,
  last_seen      DATE,
  first_seen     DATE,
  source         TEXT,
  tags           TEXT[] DEFAULT '{}',
  client_type    TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lots (
  id            TEXT PRIMARY KEY,
  event_id      TEXT,
  partenaire_id TEXT,
  nom           TEXT NOT NULL,
  valeur        NUMERIC DEFAULT 0,
  quantite      INT     DEFAULT 1,
  assigne_a     TEXT,
  retire        BOOLEAN DEFAULT FALSE,
  date_retrait  DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.participations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joueur_id     UUID,
  event_id      TEXT,
  score         INT  DEFAULT 0,
  ticket_code   TEXT,
  bonus_answers JSONB DEFAULT '{}'::jsonb,
  extra_fields  JSONB DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.votes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  joueur_id   UUID,
  event_id    TEXT,
  section_id  TEXT,
  note        INT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.gas_backup_log (
  id         BIGSERIAL PRIMARY KEY,
  table_name TEXT,
  payload    JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ════════════════════════════════════════════════════════════
-- 2. ALTER TABLE — colonnes manquantes (idempotent)
-- ════════════════════════════════════════════════════════════

ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS secteur TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS role_contact TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS date_f DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS h_end TIME;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS adresse TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gagnants INT DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS joueurs_optin INT DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS stats JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pro_visib JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS prenom TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS tel TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS code_postal TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS date_naissance DATE;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS last_seen DATE;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS genre TEXT;

ALTER TABLE public.participations ADD COLUMN IF NOT EXISTS ticket_code TEXT;
ALTER TABLE public.participations ADD COLUMN IF NOT EXISTS bonus_answers JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.super_events ADD COLUMN IF NOT EXISTS date_f DATE;

-- ════════════════════════════════════════════════════════════
-- 3. INSERT PROS (référentiels clients)
-- ════════════════════════════════════════════════════════════

INSERT INTO public.pros (id, nom, ville, code_postal, adresse, siret, secteur, contact, role_contact, email, tel, entree_p, notes, tags) VALUES
  ('pro-vence',  'Ville de Vence',          'Vence',  '06140', 'Hôtel de Ville, Place du Frêne',           '21060157200019', 'Collectivité',      'Service Animation', NULL, 'animation@ville-vence.fr', '04 93 58 06 58', '2026-01-01', 'Client pilote Flowin · Fêtes de Pâques 2026 (186 participants)', ARRAY['pilote','collectivité']::text[]),
  ('pro-flowin', 'Flowin',                  'Nice',   '06000', 'Nice, 06000',                               '',               'SaaS · Gamification','Romain Collin',    NULL, 'contact@flowin.fr',        '',              '2026-05-07', 'Compte interne Flowin · Event démo commercial',                  ARRAY['interne','demo']::text[]),
  ('pro-cannes', 'TEST Mairie de Cannes',   'Cannes', '06400', 'Hôtel de Ville, 1 rue Félix Faure, Cannes','21060029200019', 'Collectivité',      'Service Culturel', NULL, 'culture@ville-cannes.fr',  '04 97 06 40 00','2026-05-16', 'Compte test · Vote Concerts Riviera 2026',                       ARRAY['test','collectivité','vote']::text[])
ON CONFLICT (id) DO UPDATE SET
  nom         = EXCLUDED.nom,
  ville       = EXCLUDED.ville,
  code_postal = EXCLUDED.code_postal,
  adresse     = EXCLUDED.adresse,
  secteur     = EXCLUDED.secteur,
  contact     = EXCLUDED.contact,
  email       = EXCLUDED.email,
  tel         = EXCLUDED.tel,
  notes       = EXCLUDED.notes,
  tags        = EXCLUDED.tags;

-- ════════════════════════════════════════════════════════════
-- 4. INSERT SUPER_EVENTS
-- ════════════════════════════════════════════════════════════

INSERT INTO public.super_events (id, nom, pros, events, date_d, date_f, description) VALUES
  ('se-nds-2026', 'Nuits du Sud 2026', ARRAY['pro-vence']::text[], ARRAY['ev-nds']::text[], '2026-07-15', '2026-07-24', 'Festival musiques du monde · 10 soirées · Quiz + Tirage final')
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom, pros = EXCLUDED.pros, events = EXCLUDED.events,
  date_d = EXCLUDED.date_d, date_f = EXCLUDED.date_f, description = EXCLUDED.description;

-- ════════════════════════════════════════════════════════════
-- 5. INSERT EVENTS (tous les events avec leur cfg complet)
-- ════════════════════════════════════════════════════════════

INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, adresse, description, couleur, participants, gagnants, joueurs_optin, score_min, cfg, stats, pro_visib, super_event_id, client_type) VALUES

-- ev-paques
('ev-paques','pro-vence','Fêtes de Pâques 2026','quiz','past','2026-04-04','2026-04-06','10:00','18:00','Place du Grand Jardin','Place du Grand Jardin, 06140 Vence','Quiz Pâques 3 jours · 8 lots à gagner','#D4537E',186,8,124,14,
'{"qrUrl":"https://flowin-events.vercel.app/parcours_user.html?ev=ev-paques","quizBanques":["bq-paques-vence"],"optinActif":true,"customQuestions":[{"id":"decouverte","label":"Comment avez-vous connu l''événement ?","type":"single","options":[{"label":"📸 Instagram","val":"instagram"},{"label":"🔵 Facebook","val":"facebook"},{"label":"🏛 Site de la mairie","val":"mairie"},{"label":"📋 Affiche / Flyer","val":"affiche"},{"label":"🗣 Bouche à oreille","val":"bouche"}]}],"quizBonusList":[{"id":"frequence","label":"Vous êtes venu(e)...","type":"single","options":[{"val":"famille","label":"👨‍👩‍👧 En famille"},{"val":"amis","label":"👫 Entre amis"},{"val":"couple","label":"💑 En couple"},{"val":"seul","label":"🚶 Seul(e)"}]},{"id":"ambiance","label":"Je trouve l''ambiance...","type":"single","options":[{"val":"genial","label":"🤩 Génial !"},{"val":"top","label":"😊 Top, on se sent bien"},{"val":"moyen","label":"😐 Ça va, peut mieux faire"}]},{"id":"retour","label":"Souhaitez-vous revenir ?","type":"single","options":[{"val":"oui","label":"✅ Oui"},{"val":"peut-etre","label":"🤔 Peut-être"},{"val":"non","label":"❌ Non"}]}]}'::jsonb,
'{"ageMoyen":44,"txConversion":67,"txOptin":73,"genre":{"hommes":38,"femmes":62}}'::jsonb,
'{}'::jsonb, NULL, NULL),

-- ev-nds
('ev-nds','pro-vence','Nuits du Sud 2026','quiz','upcoming','2026-07-15','2026-07-24','20:00','23:59','Place du Grand Jardin','Place du Grand Jardin, 06140 Vence','Festival musiques du monde · 10 soirées','#3B5CC4',0,0,0,0,
'{"qrUrl":"https://flowin-events.vercel.app/parcours_user.html?ev=ev-nds","quizBanques":[],"optinActif":true,"proVisib":{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":false,"msgBienvenue":"Bienvenue sur le dashboard Nuits du Sud 2026 !"}}'::jsonb,
'{}'::jsonb,
'{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":false,"msgBienvenue":"Bienvenue sur le dashboard Nuits du Sud 2026 !"}'::jsonb,
'se-nds-2026', NULL),

-- ev-flowin-demo
('ev-flowin-demo','pro-flowin','Flowin — Découverte','spin','live','2026-05-07','2030-05-03','00:00','23:59','Nice','Nice, 06000','Event démo commercial · Spin Roulette','#A855F7',0,0,0,0,
'{"qrUrl":"https://flowin-events.vercel.app/parcours_user.html?ev=ev-flowin-demo","optinActif":true,"spinSegments":[{"id":"seg-1","label":"Accès Flowin complet","sublabel":"Tableau de bord inclus","emoji":"🎛️","color":"#A855F7","prob":20},{"id":"seg-2","label":"1 an offert","sublabel":"Abonnement Flowin gratuit","emoji":"🎁","color":"#00B4A0","prob":20},{"id":"seg-3","label":"Flowin Team","sublabel":"Multi-utilisateurs offert","emoji":"👥","color":"#1B3A5C","prob":20},{"id":"seg-4","label":"1er event offert","sublabel":"Config + déploiement inclus","emoji":"🚀","color":"#E8500A","prob":20},{"id":"seg-5","label":"Parrainer un ami","sublabel":"Et retenter votre chance","emoji":"🤝","color":"#F5A623","prob":20}],"proVisib":{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":true,"msgBienvenue":"Bienvenue — Découvrez Flowin en jouant."}}'::jsonb,
'{}'::jsonb,
'{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":true,"msgBienvenue":"Bienvenue — Découvrez Flowin en jouant."}'::jsonb,
NULL, 'btob'),

-- ev-test-vote
('ev-test-vote','pro-cannes','TEST Vote Concerts Riviera','vote','past','2026-09-20','2026-09-20','18:00','23:00','Palais des Festivals','1 Bd de la Croisette, 06400 Cannes','Vote étoiles · 5 artistes à évaluer','#1E1B4B',3,0,3,0,
'{"qrUrl":"https://flowin-events.vercel.app/parcours_user.html?ev=ev-test-vote","optinActif":true,"voteMode":"stars","voteImgLayout":"central","voteResultatsLive":false,"voteSections":[{"titre":"The Jazz Collective","imageUrl":"","emoji":"🎷"},{"titre":"Maya Simone","imageUrl":"","emoji":"🎤"},{"titre":"Riviera Big Band","imageUrl":"","emoji":"🎺"},{"titre":"Les Percussions du Monde","imageUrl":"","emoji":"🥁"},{"titre":"Electric Sunset","imageUrl":"","emoji":"🎸"}],"customQuestions":[{"id":"decouverte","label":"Comment avez-vous connu l''événement ?","type":"single","options":[{"label":"📸 Instagram","val":"instagram"},{"label":"🔵 Facebook","val":"facebook"},{"label":"🏛 Site mairie","val":"mairie"},{"label":"📋 Affiche / Flyer","val":"affiche"},{"label":"🗣 Bouche à oreille","val":"bouche"}]}],"proVisib":{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":true,"msgBienvenue":"Bienvenue sur le dashboard Concerts Riviera 2026 !"}}'::jsonb,
'{"ageMoyen":34,"txConversion":100,"txOptin":100,"genre":{"hommes":33,"femmes":67},"parJour":[{"d":"20 sep","v":3}]}'::jsonb,
'{"stats":true,"participants":true,"lots":true,"qr":true,"export":true,"activite":true,"msgBienvenue":"Bienvenue sur le dashboard Concerts Riviera 2026 !"}'::jsonb,
NULL, NULL)

ON CONFLICT (id) DO UPDATE SET
  pro_id        = EXCLUDED.pro_id,
  nom           = EXCLUDED.nom,
  module        = EXCLUDED.module,
  status        = EXCLUDED.status,
  couleur       = EXCLUDED.couleur,
  participants  = EXCLUDED.participants,
  gagnants      = EXCLUDED.gagnants,
  joueurs_optin = EXCLUDED.joueurs_optin,
  cfg           = EXCLUDED.cfg,
  stats         = EXCLUDED.stats,
  pro_visib     = EXCLUDED.pro_visib;

-- ════════════════════════════════════════════════════════════
-- 6. VÉRIFICATION FINALE
-- ════════════════════════════════════════════════════════════

SELECT 'pros'   AS table_name, COUNT(*) AS rows FROM public.pros
UNION ALL
SELECT 'events' AS table_name, COUNT(*) AS rows FROM public.events
UNION ALL
SELECT 'super_events', COUNT(*) FROM public.super_events
ORDER BY table_name;
