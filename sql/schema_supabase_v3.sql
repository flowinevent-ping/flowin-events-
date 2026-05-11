-- ============================================================
-- FLOWIN · schema_supabase_v3.sql
-- Migration B2B — à appliquer après schema_supabase_v2.sql
-- Supabase eu-west-1 · OPConsult / BAITA EURL · 08/05/2026
-- ============================================================
-- ORDRE D'EXÉCUTION :
--   1. ALTER TABLE joueurs        (nouvelles colonnes B2B)
--   2. ALTER TABLE events         (clientType)
--   3. CREATE VIEW v_prospects    (filtre B2B natif)
--   4. RLS policies               (isolation B2B)
--   5. GAS backup key             (rappel manuel)
-- ============================================================


-- ============================================================
-- 1. TABLE joueurs — colonnes B2B
-- ============================================================

-- Enseigne / Structure professionnelle
ALTER TABLE joueurs
  ADD COLUMN IF NOT EXISTS enseigne TEXT DEFAULT '';

-- Lot gagné (label du segment spin)
ALTER TABLE joueurs
  ADD COLUMN IF NOT EXISTS lot_gagne TEXT DEFAULT '';

-- Code ticket unique (ex: FW-PRO-4782)
ALTER TABLE joueurs
  ADD COLUMN IF NOT EXISTS ticket_code TEXT DEFAULT '';

-- Source de découverte (LinkedIn, Bouche à oreille, etc.)
ALTER TABLE joueurs
  ADD COLUMN IF NOT EXISTS decouverte TEXT DEFAULT '';

-- Type client discriminant (btoc | btob)
-- Stocké aussi dans tags[] mais ce champ permet les index et filtres SQL natifs
ALTER TABLE joueurs
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'btoc'
  CHECK (client_type IN ('btoc', 'btob'));

-- Index pour les filtres fréquents
CREATE INDEX IF NOT EXISTS idx_joueurs_client_type ON joueurs(client_type);
CREATE INDEX IF NOT EXISTS idx_joueurs_enseigne    ON joueurs(enseigne) WHERE enseigne IS NOT NULL AND enseigne != '';


-- ============================================================
-- 2. TABLE events — clientType
-- ============================================================

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'btoc'
  CHECK (client_type IN ('btoc', 'btob'));

-- Mettre à jour ev-flowin-demo si déjà présent
UPDATE events
  SET client_type = 'btob'
  WHERE id = 'ev-flowin-demo';


-- ============================================================
-- 3. VUE v_prospects — filtre B2B natif
-- ============================================================

DROP VIEW IF EXISTS v_prospects;

CREATE VIEW v_prospects AS
SELECT
  j.id,
  j.enseigne,
  j.prenom,
  j.nom,
  j.email,
  j.tel,
  j.ville,
  j.code_postal,
  j.optin,
  j.optin_date,
  j.lot_gagne,
  j.ticket_code,
  j.decouverte,
  j.tags,
  j.source,
  j.first_seen,
  j.last_seen,
  j.events,
  j.client_type
FROM joueurs j
WHERE j.client_type = 'btob'
ORDER BY j.first_seen DESC;

COMMENT ON VIEW v_prospects IS
  'Prospects B2B Flowin — joueurs issus des events clientType=btob. '
  'Accès SA uniquement via RLS. Export CSV disponible depuis le dashboard.';


-- ============================================================
-- 4. RLS — Row Level Security
-- ============================================================

-- Activer RLS sur joueurs si pas déjà fait
ALTER TABLE joueurs ENABLE ROW LEVEL SECURITY;

-- Politique existante B2C (à conserver)
-- Les pros voient uniquement les joueurs de leurs events
-- (déjà défini dans schema_supabase_v2.sql)

-- Nouvelle politique : les prospects B2B visibles uniquement par SA
DROP POLICY IF EXISTS "btob_sa_only" ON joueurs;

CREATE POLICY "btob_sa_only"
ON joueurs
FOR ALL
USING (
  -- B2C : visible par le pro propriétaire de l'event
  (client_type = 'btoc')
  OR
  -- B2B : visible uniquement par le Super Admin
  (
    client_type = 'btob'
    AND auth.uid() IN (
      SELECT user_id FROM profiles WHERE role = 'sa'
    )
  )
);

-- RLS sur la vue v_prospects : SA uniquement
DROP POLICY IF EXISTS "v_prospects_sa_only" ON joueurs;
-- Note : la vue hérite des RLS de la table joueurs
-- Pas de politique séparée nécessaire


-- ============================================================
-- 5. FONCTION upsert_joueur_btob
-- Appelée depuis writeJoueurBtoBProd() dans flowin_v12.html
-- ============================================================

CREATE OR REPLACE FUNCTION upsert_joueur_btob(
  p_id            TEXT,
  p_prenom        TEXT,
  p_nom           TEXT,
  p_email         TEXT,
  p_tel           TEXT,
  p_ville         TEXT,
  p_enseigne      TEXT,
  p_event_id      TEXT,
  p_optin         BOOLEAN,
  p_source        TEXT,
  p_tags          TEXT[],
  p_lot_gagne     TEXT,
  p_ticket_code   TEXT,
  p_decouverte    TEXT
)
RETURNS joueurs AS $$
DECLARE
  result joueurs;
BEGIN
  INSERT INTO joueurs (
    id, prenom, nom, email, tel, ville, enseigne,
    events, optin, optin_date, source, tags,
    lot_gagne, ticket_code, decouverte,
    client_type, first_seen, last_seen,
    gains, score_moy, code_postal, adresse, date_naissance
  ) VALUES (
    p_id, p_prenom, p_nom, p_email, p_tel, p_ville, p_enseigne,
    ARRAY[p_event_id], p_optin, NOW()::date, p_source, p_tags,
    p_lot_gagne, p_ticket_code, p_decouverte,
    'btob', NOW()::date, NOW()::date,
    1, '', '', '', ''
  )
  ON CONFLICT (email) DO UPDATE SET
    last_seen    = NOW()::date,
    lot_gagne    = EXCLUDED.lot_gagne,
    ticket_code  = EXCLUDED.ticket_code,
    decouverte   = EXCLUDED.decouverte,
    enseigne     = COALESCE(NULLIF(EXCLUDED.enseigne,''), joueurs.enseigne),
    tags         = joueurs.tags || EXCLUDED.tags
  RETURNING * INTO result;

  -- Incrémenter le compteur participants de l'event
  UPDATE events
    SET participants    = participants + 1,
        joueurs_optin   = joueurs_optin + 1
    WHERE id = p_event_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 6. RAPPELS ACTIONS MANUELLES (non SQL)
-- ============================================================

-- [ ] Remplacer '33XXXXXXXXX' par le vrai numéro WhatsApp de Romain
--     dans flowin_v12.html → spinSubmitForm()

-- [ ] Brancher writeJoueurBtoBProd() dans flowin_v12.html
--     Remplacer le bloc localStorage par :
--     await upsert_joueur_btob(supabase, { ...data })

-- [ ] Mettre à jour GAS whitelist
--     Ajouter la clé 'btob_lead' dans le Google Apps Script

-- [ ] Vérifier les variables d'environnement Supabase
--     SUPABASE_URL et SUPABASE_ANON_KEY dans Vercel/Netlify

-- [ ] Tester le flux complet en local avant merge GitHub → Vercel
--     1. Vider cache dashboard (bouton sidebar SA)
--     2. Jouer le parcours dans flowin_v12.html
--     3. Vérifier apparition dans dashboard → Prospects B2B
--     4. Vérifier compteur ev-flowin-demo participants


-- ============================================================
-- FIN schema_supabase_v3.sql
-- Version : 3.0 · 08/05/2026 · Flowin B2B migration
-- ============================================================
