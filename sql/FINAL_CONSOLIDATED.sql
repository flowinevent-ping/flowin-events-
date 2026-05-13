-- ============================================================
-- FLOWIN · SCHEMA FINAL CONSOLIDÉ · 13/05/2026
-- 11 tables · RLS complet · Vues · Idempotent
-- Conforme aux écritures du dashboard SA/PRO + parcours joueur
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════════════
-- 1. PROFILES (Auth Supabase)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sa','pro')),
  pro_id TEXT,
  email TEXT,
  nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Migration pour bases existantes : ajouter auth_user_id et changer la PK
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_own" ON public.profiles;
DROP POLICY IF EXISTS "profile_sa" ON public.profiles;
CREATE POLICY "profile_own" ON public.profiles FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "profile_sa" ON public.profiles FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');

-- ════════════════════════════════════════════════════════════
-- 2. PROS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.pros (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  ville TEXT, code_postal TEXT, adresse TEXT,
  siret TEXT, secteur TEXT,
  contact TEXT, role_contact TEXT,
  email TEXT, tel TEXT,
  entree_p DATE, notes TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS role_contact TEXT;
ALTER TABLE public.pros ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.pros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pros_sa" ON public.pros;
DROP POLICY IF EXISTS "pros_pro" ON public.pros;
CREATE POLICY "pros_sa" ON public.pros FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "pros_pro" ON public.pros FOR SELECT USING (id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- ════════════════════════════════════════════════════════════
-- 3. PARTENAIRES
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.partenaires (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  type TEXT DEFAULT 'Local',
  secteur TEXT DEFAULT '',
  contact TEXT DEFAULT '', role TEXT DEFAULT '',
  email TEXT DEFAULT '', tel TEXT DEFAULT '',
  ville TEXT DEFAULT '', code_postal TEXT DEFAULT '',
  adresse TEXT DEFAULT '', siret TEXT DEFAULT '',
  contrat TEXT DEFAULT '', notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  events TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Local';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS siret TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS contrat TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS role TEXT DEFAULT '';
ALTER TABLE public.partenaires ADD COLUMN IF NOT EXISTS events TEXT[] DEFAULT '{}';
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partenaires_sa" ON public.partenaires;
DROP POLICY IF EXISTS "partenaires_pro" ON public.partenaires;
CREATE POLICY "partenaires_sa" ON public.partenaires FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "partenaires_pro" ON public.partenaires FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = ANY(partenaires.events) AND e.pro_id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()))
);

-- ════════════════════════════════════════════════════════════
-- 4. EVENTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  pro_id TEXT REFERENCES public.pros(id),
  nom TEXT NOT NULL,
  module TEXT CHECK (module IN ('quiz','quizsolo','quizmaster','vote','standup','spin','tombola')),
  status TEXT CHECK (status IN ('upcoming','live','past')) DEFAULT 'upcoming',
  date_d DATE, date_f DATE,
  h_start TIME DEFAULT '10:00', h_end TIME DEFAULT '18:00',
  lieu TEXT, adresse TEXT, description TEXT,
  couleur TEXT DEFAULT '#7C2D92',
  participants INT DEFAULT 0, gagnants INT DEFAULT 0, joueurs_optin INT DEFAULT 0,
  score_min INT DEFAULT 0,
  cfg JSONB DEFAULT '{}', stats JSONB DEFAULT '{}', pro_visib JSONB DEFAULT '{}',
  super_event_id TEXT,
  client_type TEXT DEFAULT 'btoc' CHECK (client_type IN ('btoc','btob')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'btoc';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS super_event_id TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pro_visib JSONB DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_events_pro ON public.events(pro_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_se ON public.events(super_event_id);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "events_sa" ON public.events;
DROP POLICY IF EXISTS "events_pro" ON public.events;
DROP POLICY IF EXISTS "events_anon_read" ON public.events;
CREATE POLICY "events_sa" ON public.events FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "events_pro" ON public.events FOR SELECT USING (pro_id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()));
CREATE POLICY "events_anon_read" ON public.events FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════════
-- 5. SUPER EVENTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.super_events (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  pros TEXT[] DEFAULT '{}',
  events TEXT[] DEFAULT '{}',
  date_d DATE, date_f DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.super_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "se_sa" ON public.super_events;
DROP POLICY IF EXISTS "se_pro" ON public.super_events;
CREATE POLICY "se_sa" ON public.super_events FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "se_pro" ON public.super_events FOR SELECT USING (
  (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()) = ANY(pros)
);

-- ════════════════════════════════════════════════════════════
-- 6. JOUEURS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.joueurs (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  nom TEXT, prenom TEXT, tel TEXT,
  ville TEXT, code_postal TEXT,
  genre TEXT CHECK (genre IN ('H','F','')),
  age_tranche TEXT, date_naissance TEXT,
  optin BOOLEAN DEFAULT FALSE,
  optin_date DATE,
  gains INT DEFAULT 0,
  score_moy TEXT DEFAULT '0/4',
  events TEXT[] DEFAULT '{}',
  source TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  first_seen DATE, last_seen DATE,
  enseigne TEXT DEFAULT '',
  lot_gagne TEXT DEFAULT '',
  ticket_code TEXT DEFAULT '',
  decouverte TEXT DEFAULT '',
  client_type TEXT DEFAULT 'btoc' CHECK (client_type IN ('btoc','btob')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS age_tranche TEXT;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS optin_date DATE;
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS source TEXT DEFAULT '';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS adresse TEXT DEFAULT '';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS enseigne TEXT DEFAULT '';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS lot_gagne TEXT DEFAULT '';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS ticket_code TEXT DEFAULT '';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS decouverte TEXT DEFAULT '';
ALTER TABLE public.joueurs ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'btoc';
CREATE INDEX IF NOT EXISTS idx_joueurs_email ON public.joueurs(email);
CREATE INDEX IF NOT EXISTS idx_joueurs_events ON public.joueurs USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_joueurs_client_type ON public.joueurs(client_type);
ALTER TABLE public.joueurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "joueurs_sa" ON public.joueurs;
DROP POLICY IF EXISTS "joueurs_pro" ON public.joueurs;
DROP POLICY IF EXISTS "joueurs_anon_insert" ON public.joueurs;
CREATE POLICY "joueurs_sa" ON public.joueurs FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "joueurs_pro" ON public.joueurs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.events e WHERE e.id = ANY(joueurs.events) AND e.pro_id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "joueurs_anon_insert" ON public.joueurs FOR INSERT WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 7. LOTS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.lots (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  partenaire_id TEXT,
  nom TEXT NOT NULL,
  valeur NUMERIC DEFAULT 0,
  quantite INT DEFAULT 1,
  assigne_a TEXT,
  retire BOOLEAN DEFAULT FALSE,
  date_retrait DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_lots_event ON public.lots(event_id);
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lots_sa" ON public.lots;
DROP POLICY IF EXISTS "lots_pro" ON public.lots;
CREATE POLICY "lots_sa" ON public.lots FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "lots_pro" ON public.lots FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()))
);

-- ════════════════════════════════════════════════════════════
-- 8. BANQUES (questions)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.banques (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  events TEXT[] DEFAULT '{}',
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.banques ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "banques_sa" ON public.banques;
DROP POLICY IF EXISTS "banques_read" ON public.banques;
CREATE POLICY "banques_sa" ON public.banques FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "banques_read" ON public.banques FOR SELECT USING (true);

-- ════════════════════════════════════════════════════════════
-- 9. PARTICIPATIONS
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.participations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  joueur_id TEXT,
  score INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_participations_event ON public.participations(event_id);
ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "participations_sa" ON public.participations;
DROP POLICY IF EXISTS "participations_pro" ON public.participations;
DROP POLICY IF EXISTS "participations_anon_insert" ON public.participations;
CREATE POLICY "participations_sa" ON public.participations FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "participations_pro" ON public.participations FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "participations_anon_insert" ON public.participations FOR INSERT WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 10. VOTES (module vote étoiles / choix)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  joueur_id TEXT,
  cible_id TEXT NOT NULL,
  cible_type TEXT,
  note INT,
  ts TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_votes_event ON public.votes(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_cible ON public.votes(cible_id);
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "votes_sa" ON public.votes;
DROP POLICY IF EXISTS "votes_pro" ON public.votes;
DROP POLICY IF EXISTS "votes_anon_insert" ON public.votes;
CREATE POLICY "votes_sa" ON public.votes FOR ALL USING ((SELECT role FROM public.profiles WHERE auth_user_id = auth.uid()) = 'sa');
CREATE POLICY "votes_pro" ON public.votes FOR SELECT USING (
  event_id IN (SELECT id FROM public.events WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE auth_user_id = auth.uid()))
);
CREATE POLICY "votes_anon_insert" ON public.votes FOR INSERT WITH CHECK (true);

-- ════════════════════════════════════════════════════════════
-- 11. GAS BACKUP LOG (audit append-only)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS public.gas_backup_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT, joueur_id TEXT, action TEXT,
  payload JSONB, synced_at TIMESTAMPTZ DEFAULT NOW(),
  gas_status TEXT DEFAULT 'pending'
);

-- ════════════════════════════════════════════════════════════
-- TRIGGERS updated_at
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated ON public.events;
DROP TRIGGER IF EXISTS trg_joueurs_updated ON public.joueurs;
DROP TRIGGER IF EXISTS trg_pros_updated ON public.pros;
DROP TRIGGER IF EXISTS trg_partenaires_updated ON public.partenaires;
DROP TRIGGER IF EXISTS trg_banques_updated ON public.banques;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_joueurs_updated BEFORE UPDATE ON public.joueurs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pros_updated BEFORE UPDATE ON public.pros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_partenaires_updated BEFORE UPDATE ON public.partenaires FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_banques_updated BEFORE UPDATE ON public.banques FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════
-- VUES UTILES
-- ════════════════════════════════════════════════════════════

-- Prospects B2B
DROP VIEW IF EXISTS public.v_prospects CASCADE;
CREATE VIEW public.v_prospects AS
SELECT id, enseigne, prenom, nom, email, tel, ville, code_postal,
       optin, optin_date, lot_gagne, ticket_code, decouverte,
       tags, source, first_seen, last_seen, events, client_type
FROM public.joueurs WHERE client_type = 'btob'
ORDER BY first_seen DESC NULLS LAST;

-- KPIs par event
DROP VIEW IF EXISTS public.v_stats_event CASCADE;
CREATE VIEW public.v_stats_event AS
SELECT e.id, e.nom, e.module, e.status, e.pro_id, e.date_d, e.date_f,
       e.participants, e.joueurs_optin, e.gagnants,
       COUNT(DISTINCT p.id) AS participations_count,
       COUNT(DISTINCT p.joueur_id) FILTER (WHERE p.completed) AS completes_count,
       COUNT(DISTINCT l.id) AS lots_total,
       COUNT(DISTINCT l.id) FILTER (WHERE l.assigne_a IS NOT NULL) AS lots_assignes
FROM public.events e
LEFT JOIN public.participations p ON p.event_id = e.id
LEFT JOIN public.lots l ON l.event_id = e.id
GROUP BY e.id;

-- Top joueurs
DROP VIEW IF EXISTS public.v_top_joueurs CASCADE;
CREATE VIEW public.v_top_joueurs AS
SELECT id, nom, prenom, email, ville, gains, score_moy,
       array_length(events, 1) AS nb_events,
       optin, last_seen
FROM public.joueurs
WHERE client_type = 'btoc'
ORDER BY gains DESC, last_seen DESC NULLS LAST
LIMIT 100;

-- ════════════════════════════════════════════════════════════
-- VÉRIFICATION FINALE
-- ════════════════════════════════════════════════════════════
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
