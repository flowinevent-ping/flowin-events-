-- ============================================================
-- FLOWIN — Schema Supabase v2
-- Région : eu-west-1
-- À exécuter dans l'éditeur SQL Supabase
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- AUTH : Table profiles (liée à auth.users Supabase)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('sa', 'pro')),
  pro_id TEXT,  -- null pour SA, 'pro-vence' pour Pro Ville de Vence
  email TEXT,
  nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Utilisateur voit son propre profil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "SA voit tous les profils" ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa'
  );

-- ============================================================
-- PROS
-- ============================================================
CREATE TABLE public.pros (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  ville TEXT,
  code_postal TEXT,
  adresse TEXT,
  siret TEXT,
  secteur TEXT,
  contact TEXT,
  role_contact TEXT,
  email TEXT,
  tel TEXT,
  entree_p DATE,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pros ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA accès total pros" ON public.pros
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit son propre pro" ON public.pros
  FOR SELECT USING (
    id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- EVENTS
-- ============================================================
CREATE TABLE public.events (
  id TEXT PRIMARY KEY,
  pro_id TEXT REFERENCES public.pros(id),
  nom TEXT NOT NULL,
  module TEXT CHECK (module IN ('quiz','quizsolo','quizmaster','vote','standup','spin','tombola')),
  status TEXT CHECK (status IN ('upcoming','live','past')) DEFAULT 'upcoming',
  date_d DATE,
  date_f DATE,
  h_start TIME DEFAULT '10:00',
  h_end TIME DEFAULT '18:00',
  lieu TEXT,
  adresse TEXT,
  description TEXT,
  couleur TEXT DEFAULT '#7C2D92',
  participants INT DEFAULT 0,
  gagnants INT DEFAULT 0,
  joueurs_optin INT DEFAULT 0,
  score_min INT DEFAULT 0,
  cfg JSONB DEFAULT '{}',  -- config module + qrUrl + customQuestions + bonusList
  stats JSONB DEFAULT '{}', -- stats calculées post-event
  pro_visib JSONB DEFAULT '{}', -- permissions vue Pro
  super_event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA accès total events" ON public.events
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses events" ON public.events
  FOR SELECT USING (
    pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid())
  );

-- ============================================================
-- JOUEURS (participants CRM)
-- ============================================================
CREATE TABLE public.joueurs (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  nom TEXT,
  prenom TEXT,
  tel TEXT,
  ville TEXT,
  code_postal TEXT,
  genre TEXT CHECK (genre IN ('H','F','')),
  age_tranche TEXT,
  date_naissance TEXT,
  optin BOOLEAN DEFAULT FALSE,
  optin_date DATE,
  gains INT DEFAULT 0,
  score_moy TEXT DEFAULT '0/4',
  events TEXT[] DEFAULT '{}',  -- IDs des events joués
  source TEXT DEFAULT '',      -- canal d'acquisition
  adresse TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  first_seen DATE,
  last_seen DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_joueurs_email ON public.joueurs(email);
CREATE INDEX idx_joueurs_events ON public.joueurs USING GIN(events);

ALTER TABLE public.joueurs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA accès total joueurs" ON public.joueurs
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses joueurs" ON public.joueurs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = ANY(joueurs.events)
      AND e.pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ============================================================
-- LOTS
-- ============================================================
CREATE TABLE public.lots (
  id TEXT PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE,
  partenaire_id TEXT,
  nom TEXT NOT NULL,
  valeur NUMERIC DEFAULT 0,
  quantite INT DEFAULT 1,
  assigne_a TEXT,  -- joueur_id du gagnant
  retire BOOLEAN DEFAULT FALSE,
  date_retrait DATE,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA accès total lots" ON public.lots
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses lots" ON public.lots
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid())
    )
  );

-- ============================================================
-- BANQUES DE QUESTIONS
-- ============================================================
CREATE TABLE public.banques (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  description TEXT,
  events TEXT[] DEFAULT '{}',
  questions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.banques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA accès total banques" ON public.banques
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Lecture banques pour tous authentifiés" ON public.banques
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- SUPER EVENTS
-- ============================================================
CREATE TABLE public.super_events (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  pros TEXT[] DEFAULT '{}',
  events TEXT[] DEFAULT '{}',
  date_d DATE,
  date_f DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.super_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA accès total super_events" ON public.super_events
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');

-- ============================================================
-- GAS BACKUP LOG (dual-write)
-- ============================================================
CREATE TABLE public.gas_backup_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT,
  joueur_id TEXT,
  action TEXT,
  payload JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW(),
  gas_status TEXT DEFAULT 'pending'  -- pending / ok / error
);

-- ============================================================
-- DONNÉES PÂQUES 2026 (migration initiale)
-- ============================================================
-- Pro Ville de Vence
INSERT INTO public.pros (id, nom, ville, code_postal, adresse, siret, secteur, contact, email, tel)
VALUES (
  'pro-vence', 'Ville de Vence', 'Vence', '06140',
  'Hôtel de Ville, Place du Frêne', '21060157200019',
  'Collectivité', 'Service Animation', 'animation@ville-vence.fr', '04 93 58 06 58'
);

-- Event Pâques 2026
INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, adresse, participants, gagnants, joueurs_optin, couleur, cfg, stats)
VALUES (
  'ev-paques', 'pro-vence', 'Fêtes de Pâques 2026', 'quiz', 'past',
  '2026-04-04', '2026-04-06', '10:00', '18:00',
  'Place du Grand Jardin', 'Place du Grand Jardin, 06140 Vence',
  186, 8, 124, '#D4537E',
  '{"qrUrl":"https://flowin-opconsult.netlify.app/?ev=ev-paques","quizBanques":["bq-paques-vence"],"optinActif":true}',
  '{"ageMoyen":44,"txConversion":100,"txOptin":73,"genre":{"hommes":38,"femmes":62}}'
);

-- Lots Pâques
INSERT INTO public.lots (id, event_id, nom, quantite, note, assigne_a, retire) VALUES
  ('lot-paques-1', 'ev-paques', 'Place Festival Nuits du Sud 2026', 1, 'Valable le 9, 11 ou 16 juillet 2026', 'j-pq-02', true),
  ('lot-paques-2', 'ev-paques', 'Place Festival Nuits du Sud 2026', 1, 'Valable le 9, 11 ou 16 juillet 2026', 'j-pq-06', true),
  ('lot-paques-3', 'ev-paques', 'Place Festival Nuits du Sud 2026', 1, 'Valable le 9, 11 ou 16 juillet 2026', 'j-pq-09', true),
  ('lot-paques-4', 'ev-paques', '2 places enfants Cinéma Casino de Vence', 2, 'Cinéma Casino de Vence', 'j-pq-15', true),
  ('lot-paques-5', 'ev-paques', '2 places enfants Cinéma Casino de Vence', 2, 'Cinéma Casino de Vence', null, false),
  ('lot-paques-6', 'ev-paques', '2 places enfants Cinéma Casino de Vence', 2, 'Cinéma Casino de Vence', null, false),
  ('lot-paques-7', 'ev-paques', '2 places enfants Cinéma Casino de Vence', 2, 'Cinéma Casino de Vence', null, false),
  ('lot-paques-8', 'ev-paques', '2 places enfants Cinéma Casino de Vence', 2, 'Cinéma Casino de Vence', null, false);

-- ============================================================
-- FONCTIONS UTILITAIRES
-- ============================================================

-- Mise à jour automatique updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_joueurs_updated BEFORE UPDATE ON public.joueurs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pros_updated BEFORE UPDATE ON public.pros
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PARTENAIRES (lots dotation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partenaires (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  secteur TEXT DEFAULT '',
  contact TEXT DEFAULT '',
  email TEXT DEFAULT '',
  tel TEXT DEFAULT '',
  ville TEXT DEFAULT '',
  code_postal TEXT DEFAULT '',
  adresse TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA acces total partenaires" ON public.partenaires
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');

CREATE TRIGGER trg_partenaires_updated BEFORE UPDATE ON public.partenaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- PARTICIPATIONS (compteur realtime par event)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.participations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  joueur_id TEXT REFERENCES public.joueurs(id) ON DELETE SET NULL,
  score INT DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_participations_event ON public.participations(event_id);
CREATE INDEX IF NOT EXISTS idx_participations_joueur ON public.participations(joueur_id);

ALTER TABLE public.participations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "SA acces total participations" ON public.participations
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses participations" ON public.participations
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM public.events
      WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid())
    )
  );
-- Parcours joueur peut insérer (anon via service function)
CREATE POLICY "Insert participation anon" ON public.participations
  FOR INSERT WITH CHECK (true);
