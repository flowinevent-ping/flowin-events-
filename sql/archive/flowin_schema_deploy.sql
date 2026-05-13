-- ============================================================
-- FLOWIN · Deploy complet v2 + v3 · 12/05/2026
-- Idempotent : safe à re-exécuter
-- Coller en une fois dans Supabase SQL Editor
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (auth)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('sa', 'pro')),
  pro_id TEXT,
  email TEXT,
  nom TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Utilisateur voit son propre profil" ON public.profiles;
DROP POLICY IF EXISTS "SA voit tous les profils" ON public.profiles;
CREATE POLICY "Utilisateur voit son propre profil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "SA voit tous les profils" ON public.profiles
  FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa'
  );

-- ============================================================
-- PROS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.pros (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  ville TEXT, code_postal TEXT, adresse TEXT, siret TEXT,
  secteur TEXT, contact TEXT, role_contact TEXT,
  email TEXT, tel TEXT, entree_p DATE, notes TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.pros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SA accès total pros" ON public.pros;
DROP POLICY IF EXISTS "Pro voit son propre pro" ON public.pros;
CREATE POLICY "SA accès total pros" ON public.pros
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit son propre pro" ON public.pros
  FOR SELECT USING (id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- EVENTS
-- ============================================================
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
  cfg JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  pro_visib JSONB DEFAULT '{}',
  super_event_id TEXT,
  client_type TEXT DEFAULT 'btoc' CHECK (client_type IN ('btoc','btob')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SA accès total events" ON public.events;
DROP POLICY IF EXISTS "Pro voit ses events" ON public.events;
CREATE POLICY "SA accès total events" ON public.events
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses events" ON public.events
  FOR SELECT USING (pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid()));

-- ============================================================
-- JOUEURS
-- ============================================================
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
CREATE INDEX IF NOT EXISTS idx_joueurs_email ON public.joueurs(email);
CREATE INDEX IF NOT EXISTS idx_joueurs_events ON public.joueurs USING GIN(events);
CREATE INDEX IF NOT EXISTS idx_joueurs_client_type ON public.joueurs(client_type);
ALTER TABLE public.joueurs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SA accès total joueurs" ON public.joueurs;
DROP POLICY IF EXISTS "Pro voit ses joueurs" ON public.joueurs;
DROP POLICY IF EXISTS "btob_sa_only" ON public.joueurs;
DROP POLICY IF EXISTS "Insert joueur anon" ON public.joueurs;
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
-- Parcours joueur peut insérer sans auth (anon)
CREATE POLICY "Insert joueur anon" ON public.joueurs
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- LOTS
-- ============================================================
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
ALTER TABLE public.lots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SA accès total lots" ON public.lots;
DROP POLICY IF EXISTS "Pro voit ses lots" ON public.lots;
CREATE POLICY "SA accès total lots" ON public.lots
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses lots" ON public.lots
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid()))
  );

-- ============================================================
-- BANQUES DE QUESTIONS
-- ============================================================
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
DROP POLICY IF EXISTS "SA accès total banques" ON public.banques;
DROP POLICY IF EXISTS "Lecture banques pour tous authentifiés" ON public.banques;
CREATE POLICY "SA accès total banques" ON public.banques
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Lecture banques pour tous authentifiés" ON public.banques
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ============================================================
-- SUPER EVENTS
-- ============================================================
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
DROP POLICY IF EXISTS "SA accès total super_events" ON public.super_events;
CREATE POLICY "SA accès total super_events" ON public.super_events
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');

-- ============================================================
-- PARTENAIRES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partenaires (
  id TEXT PRIMARY KEY,
  nom TEXT NOT NULL,
  secteur TEXT DEFAULT '', contact TEXT DEFAULT '',
  email TEXT DEFAULT '', tel TEXT DEFAULT '',
  ville TEXT DEFAULT '', code_postal TEXT DEFAULT '',
  adresse TEXT DEFAULT '', notes TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.partenaires ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "SA acces total partenaires" ON public.partenaires;
CREATE POLICY "SA acces total partenaires" ON public.partenaires
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');

-- ============================================================
-- PARTICIPATIONS
-- ============================================================
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
DROP POLICY IF EXISTS "SA acces total participations" ON public.participations;
DROP POLICY IF EXISTS "Pro voit ses participations" ON public.participations;
DROP POLICY IF EXISTS "Insert participation anon" ON public.participations;
CREATE POLICY "SA acces total participations" ON public.participations
  FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'sa');
CREATE POLICY "Pro voit ses participations" ON public.participations
  FOR SELECT USING (
    event_id IN (SELECT id FROM public.events WHERE pro_id = (SELECT pro_id FROM public.profiles WHERE id = auth.uid()))
  );
CREATE POLICY "Insert participation anon" ON public.participations
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- GAS BACKUP LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gas_backup_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id TEXT, joueur_id TEXT, action TEXT,
  payload JSONB, synced_at TIMESTAMPTZ DEFAULT NOW(),
  gas_status TEXT DEFAULT 'pending'
);

-- ============================================================
-- TRIGGERS updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_events_updated ON public.events;
DROP TRIGGER IF EXISTS trg_joueurs_updated ON public.joueurs;
DROP TRIGGER IF EXISTS trg_pros_updated ON public.pros;
DROP TRIGGER IF EXISTS trg_partenaires_updated ON public.partenaires;
CREATE TRIGGER trg_events_updated BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_joueurs_updated BEFORE UPDATE ON public.joueurs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pros_updated BEFORE UPDATE ON public.pros FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_partenaires_updated BEFORE UPDATE ON public.partenaires FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VUE v_prospects (B2B)
-- ============================================================
DROP VIEW IF EXISTS v_prospects;
CREATE VIEW v_prospects AS
SELECT id, enseigne, prenom, nom, email, tel, ville, code_postal,
       optin, optin_date, lot_gagne, ticket_code, decouverte,
       tags, source, first_seen, last_seen, events, client_type
FROM joueurs WHERE client_type = 'btob' ORDER BY first_seen DESC;

-- ============================================================
-- FONCTION upsert_joueur_btob
-- ============================================================
CREATE OR REPLACE FUNCTION upsert_joueur_btob(
  p_id TEXT, p_prenom TEXT, p_nom TEXT, p_email TEXT, p_tel TEXT,
  p_ville TEXT, p_enseigne TEXT, p_event_id TEXT, p_optin BOOLEAN,
  p_source TEXT, p_tags TEXT[], p_lot_gagne TEXT, p_ticket_code TEXT, p_decouverte TEXT
) RETURNS joueurs AS $$
DECLARE result joueurs;
BEGIN
  INSERT INTO joueurs (
    id, prenom, nom, email, tel, ville, enseigne,
    events, optin, optin_date, source, tags,
    lot_gagne, ticket_code, decouverte,
    client_type, first_seen, last_seen, gains, score_moy, code_postal, adresse, date_naissance
  ) VALUES (
    p_id, p_prenom, p_nom, p_email, p_tel, p_ville, p_enseigne,
    ARRAY[p_event_id], p_optin, NOW()::date, p_source, p_tags,
    p_lot_gagne, p_ticket_code, p_decouverte,
    'btob', NOW()::date, NOW()::date, 1, '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE SET
    last_seen   = NOW()::date,
    lot_gagne   = EXCLUDED.lot_gagne,
    ticket_code = EXCLUDED.ticket_code,
    decouverte  = EXCLUDED.decouverte,
    enseigne    = COALESCE(NULLIF(EXCLUDED.enseigne,''), joueurs.enseigne),
    tags        = joueurs.tags || EXCLUDED.tags
  RETURNING * INTO result;
  UPDATE events SET participants = participants + 1, joueurs_optin = joueurs_optin + 1 WHERE id = p_event_id;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEED : pro-vence + ev-paques + ev-nds + lots
-- ============================================================
INSERT INTO public.pros (id, nom, ville, code_postal, adresse, siret, secteur, contact, email, tel)
VALUES ('pro-vence','Ville de Vence','Vence','06140','Hôtel de Ville, Place du Frêne','21060157200019','Collectivité','Service Animation','animation@ville-vence.fr','04 93 58 06 58')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, adresse, participants, gagnants, joueurs_optin, couleur, cfg, stats)
VALUES (
  'ev-paques','pro-vence','Fêtes de Pâques 2026','quiz','past',
  '2026-04-04','2026-04-06','10:00','18:00',
  'Place du Grand Jardin','Place du Grand Jardin, 06140 Vence',
  186,8,124,'#D4537E',
  '{"qrUrl":"https://flowin-opconsult.netlify.app/?ev=ev-paques","quizBanques":["bq-paques-vence"],"optinActif":true}',
  '{"ageMoyen":44,"txConversion":100,"txOptin":73}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.events (id, pro_id, nom, module, status, date_d, date_f, h_start, h_end, lieu, adresse, couleur, cfg)
VALUES (
  'ev-nds','pro-vence','Nuits du Sud 2026','quiz','upcoming',
  '2026-07-15','2026-07-24','18:00','23:00',
  'Place du Grand Jardin','Place du Grand Jardin, 06140 Vence',
  '#3B5CC4',
  '{"qrUrl":"","quizBanques":["bq-nds-2026"],"optinActif":true}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lots (id, event_id, nom, quantite, note, assigne_a, retire) VALUES
  ('lot-paques-1','ev-paques','Place Festival Nuits du Sud 2026',1,'Valable le 9, 11 ou 16 juillet 2026','j-pq-02',true),
  ('lot-paques-2','ev-paques','Place Festival Nuits du Sud 2026',1,'Valable le 9, 11 ou 16 juillet 2026','j-pq-06',true),
  ('lot-paques-3','ev-paques','Place Festival Nuits du Sud 2026',1,'Valable le 9, 11 ou 16 juillet 2026','j-pq-09',true),
  ('lot-paques-4','ev-paques','2 places enfants Cinéma Casino de Vence',2,'Cinéma Casino de Vence','j-pq-15',true),
  ('lot-paques-5','ev-paques','2 places enfants Cinéma Casino de Vence',2,'Cinéma Casino de Vence',null,false),
  ('lot-paques-6','ev-paques','2 places enfants Cinéma Casino de Vence',2,'Cinéma Casino de Vence',null,false),
  ('lot-paques-7','ev-paques','2 places enfants Cinéma Casino de Vence',2,'Cinéma Casino de Vence',null,false),
  ('lot-paques-8','ev-paques','2 places enfants Cinéma Casino de Vence',2,'Cinéma Casino de Vence',null,false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
