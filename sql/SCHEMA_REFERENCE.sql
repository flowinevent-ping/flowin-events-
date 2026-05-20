-- ════════════════════════════════════════════════════════════════════
-- FLOWIN · SCHEMA REFERENCE · 19/05/2026
-- Source de vérité unique — reflète exactement la prod
-- Idempotent — safe à rejouer à tout moment
-- ════════════════════════════════════════════════════════════════════
--
-- ARCHITECTURE :
--   Phase actuelle  → anon key, RLS USING (true), pas d'Auth
--   Phase post-NDS  → Supabase Auth + RLS SA/PRO (voir FINAL_CONSOLIDATED.sql)
--
-- TABLES FLOWIN (9) :
--   pros · partenaires · events · super_events · joueurs
--   lots · banques · participations · landings
--
-- RLS : 1 policy "flowin_anon_all_*" par table, FOR ALL, USING (true)
-- ════════════════════════════════════════════════════════════════════

-- ── EXTENSIONS ──────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════════════
-- 1. PROS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pros (
  id           TEXT PRIMARY KEY,
  nom          TEXT NOT NULL,
  ville        TEXT DEFAULT '',
  code_postal  TEXT DEFAULT '',
  adresse      TEXT DEFAULT '',
  siret        TEXT DEFAULT '',
  secteur      TEXT DEFAULT '',
  contact      TEXT DEFAULT '',
  role_contact TEXT DEFAULT '',
  email        TEXT DEFAULT '',
  tel          TEXT DEFAULT '',
  entree_p     DATE DEFAULT NULL,
  notes        TEXT DEFAULT '',
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_pros" ON pros;
CREATE POLICY "flowin_anon_all_pros" ON pros FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 2. PARTENAIRES
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS partenaires (
  id           TEXT PRIMARY KEY,
  nom          TEXT NOT NULL DEFAULT '',
  type         TEXT DEFAULT 'Local',
  emoji        TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  contact_nom  TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_tel  TEXT DEFAULT '',
  site_web     TEXT DEFAULT '',
  actif        BOOLEAN DEFAULT true,
  visible      BOOLEAN DEFAULT true,
  en_avant     BOOLEAN DEFAULT false,
  couleur      TEXT DEFAULT '#7C5CFC',
  image_url    TEXT DEFAULT '',
  promo_text   TEXT DEFAULT '',
  adresse      TEXT DEFAULT '',
  role         TEXT DEFAULT '',
  email        TEXT DEFAULT '',
  tel          TEXT DEFAULT '',
  url          TEXT DEFAULT '',
  ville        TEXT DEFAULT '',
  code_postal  TEXT DEFAULT '',
  siret        TEXT DEFAULT '',
  contrat      TEXT DEFAULT '',
  notes        TEXT DEFAULT '',
  contact      TEXT DEFAULT '',
  instagram    TEXT DEFAULT '',
  facebook     TEXT DEFAULT '',
  events       TEXT[] DEFAULT '{}',
  tags         TEXT[] DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE partenaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_partenaires" ON partenaires;
CREATE POLICY "flowin_anon_all_partenaires" ON partenaires FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 3. EVENTS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS events (
  id             TEXT PRIMARY KEY,
  pro_id         TEXT REFERENCES pros(id),
  nom            TEXT NOT NULL,
  module         TEXT NOT NULL DEFAULT 'quiz',
  status         TEXT DEFAULT 'upcoming',
  date_d         DATE DEFAULT NULL,
  date_f         DATE DEFAULT NULL,
  h_start        TEXT DEFAULT '10:00',
  h_end          TEXT DEFAULT '18:00',
  lieu           TEXT DEFAULT '',
  adresse        TEXT DEFAULT '',
  description    TEXT DEFAULT '',
  couleur        TEXT DEFAULT '#7C2D92',
  participants   INTEGER DEFAULT 0,
  gagnants       INTEGER DEFAULT 0,
  joueurs_optin  INTEGER DEFAULT 0,
  score_min      INTEGER DEFAULT 0,
  cfg            JSONB DEFAULT '{}',
  stats          JSONB DEFAULT '{}',
  pro_visib      JSONB DEFAULT '{}',
  super_event_id TEXT DEFAULT NULL,
  client_type    TEXT DEFAULT 'btoc',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
-- cfg.partenaires = TEXT[] IDs partenaires liés à l'event (wizard step 4)
-- cfg.qrUrl = URL parcours joueur
-- cfg.front = textes/emojis personnalisés
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_events" ON events;
CREATE POLICY "flowin_anon_all_events" ON events FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 4. SUPER_EVENTS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS super_events (
  id               TEXT PRIMARY KEY,
  nom              TEXT NOT NULL DEFAULT '',
  pros             TEXT[] DEFAULT '{}',
  events           TEXT[] DEFAULT '{}',
  date_d           DATE DEFAULT NULL,
  date_f           DATE DEFAULT NULL,
  description      TEXT DEFAULT '',
  status           TEXT DEFAULT 'upcoming',
  tirage_global    BOOLEAN DEFAULT false,
  nb_gagnants_final INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE super_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_super_events" ON super_events;
CREATE POLICY "flowin_anon_all_super_events" ON super_events FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 5. JOUEURS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS joueurs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_id    TEXT UNIQUE,
  email          TEXT NOT NULL DEFAULT '',
  email_lower    TEXT GENERATED ALWAYS AS (lower(email)) STORED, -- NE PAS écrire, auto-calculé
  nom            TEXT DEFAULT '',
  prenom         TEXT DEFAULT '',
  tel            TEXT DEFAULT '',
  ville          TEXT DEFAULT '',
  code_postal    TEXT DEFAULT '',
  adresse        TEXT DEFAULT '',
  genre          TEXT DEFAULT '',
  date_naissance TEXT DEFAULT '',
  age_tranche    TEXT DEFAULT '',
  optin          BOOLEAN DEFAULT false,
  optin_date     TIMESTAMPTZ DEFAULT NULL,
  gains          INTEGER DEFAULT 0,
  score_moy      TEXT DEFAULT '',
  events         TEXT[] DEFAULT '{}',
  ticket_code    TEXT DEFAULT '',
  lot_gagne      TEXT DEFAULT '',
  source         TEXT DEFAULT '',
  decouverte     TEXT DEFAULT '',
  enseigne       TEXT DEFAULT '',
  client_type    TEXT DEFAULT 'btoc',
  first_seen     TIMESTAMPTZ DEFAULT NULL,
  last_seen      TIMESTAMPTZ DEFAULT NULL,
  -- tags : colonne absente en prod (ne pas ajouter sans migration)
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE joueurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_joueurs" ON joueurs;
CREATE POLICY "flowin_anon_all_joueurs" ON joueurs FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 6. LOTS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS lots (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id),
  partenaire_id TEXT DEFAULT NULL,
  nom           TEXT DEFAULT '',
  titre         TEXT DEFAULT '',
  description   TEXT DEFAULT '',
  emoji         TEXT DEFAULT '',
  valeur        NUMERIC DEFAULT 0,
  valeur_euros  NUMERIC DEFAULT 0,
  quantite      INTEGER DEFAULT 1,
  assigne_a     TEXT DEFAULT NULL,
  retire        BOOLEAN DEFAULT false,
  date_retrait  TIMESTAMPTZ DEFAULT NULL,
  date_assign   TIMESTAMPTZ DEFAULT NULL,
  note          TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_lots" ON lots;
CREATE POLICY "flowin_anon_all_lots" ON lots FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 7. BANQUES (questions quiz)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS banques (
  id          TEXT PRIMARY KEY,
  nom         TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  pro_id      TEXT DEFAULT NULL,
  event_ids   TEXT[] DEFAULT '{}',
  questions   JSONB DEFAULT '[]',
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE banques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_banques" ON banques;
CREATE POLICY "flowin_anon_all_banques" ON banques FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 8. PARTICIPATIONS
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS participations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  joueur_id     UUID REFERENCES joueurs(id),
  event_id      TEXT REFERENCES events(id),
  score         INTEGER DEFAULT 0,
  ticket_code   TEXT DEFAULT '',
  bonus_answers JSONB DEFAULT '{}',
  extra_fields  JSONB DEFAULT '{}',
  tickets       INTEGER DEFAULT 1,
  completed     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_participations" ON participations;
CREATE POLICY "flowin_anon_all_participations" ON participations FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- 9. LANDINGS (pages B2B)
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS landings (
  id           TEXT PRIMARY KEY,
  nom          TEXT NOT NULL DEFAULT '',
  statut       TEXT DEFAULT 'brouillon',
  published    BOOLEAN DEFAULT false,
  deploy_url   TEXT DEFAULT '',
  accent_color TEXT DEFAULT '#3B5CC4',
  module_jeu   TEXT DEFAULT 'spin',
  wa_number    TEXT DEFAULT '',
  hero         JSONB DEFAULT '{}',
  proof        JSONB DEFAULT '{}',
  tunnel       JSONB DEFAULT '[]',
  profils      JSONB DEFAULT '[]',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE landings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "flowin_anon_all_landings" ON landings;
CREATE POLICY "flowin_anon_all_landings" ON landings FOR ALL TO public USING (true) WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════
-- ════════════════════════════════════════════════════════════════════
-- RÈGLES DE CÂBLAGE — à respecter dans tous les supaWrite*
-- ════════════════════════════════════════════════════════════════════
-- joueurs.email_lower : GENERATED ALWAYS — ne jamais inclure dans payload
-- joueurs.score_moy   : numeric — envoyer null si vide (pas '')
-- joueurs.date_naissance : date — envoyer null si vide (pas '')
-- partenaires.site_web : ne pas dupliquer dans le payload
-- banques.event_ids   : lire depuis b.eventIds || b.events
-- supaUpsert          : résolution par PK (id) — comportement correct
-- supaFetch joueurs   : select explicite (exclut email_lower)
-- ════════════════════════════════════════════════════════════════════
-- FIN · SCHEMA_REFERENCE.sql
-- Prochaine étape post-NDS : Supabase Auth + RLS SA/PRO
-- ════════════════════════════════════════════════════════════════════
