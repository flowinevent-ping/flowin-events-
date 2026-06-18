-- ============================================================
-- NDS 2026 — Bons d'achat partenaires
-- Migrations appliquees en prod le 18/06/2026
-- project_id ywcqtupgoxfzkddqkztk — NE PAS REJOUER (trace repo)
-- Verifie en prod le 18/06/2026 : 8/8 colonnes, vue OK, fonction OK
-- ============================================================

-- 1. Colonnes ajoutees a se_gains
ALTER TABLE se_gains
  ADD COLUMN IF NOT EXISTS partenaire_id text REFERENCES partenaires(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS montant numeric(10,2),
  ADD COLUMN IF NOT EXISTS station text,
  ADD COLUMN IF NOT EXISTS gagnant_nom text,
  ADD COLUMN IF NOT EXISTS gagnant_email text,
  ADD COLUMN IF NOT EXISTS gagnant_tel text,
  ADD COLUMN IF NOT EXISTS qr_token text UNIQUE DEFAULT encode(gen_random_bytes(12),'hex'),
  ADD COLUMN IF NOT EXISTS valide_jusqu_au date DEFAULT (CURRENT_DATE + INTERVAL '6 months')::date;

CREATE INDEX IF NOT EXISTS idx_se_gains_partenaire ON se_gains(partenaire_id);
CREATE INDEX IF NOT EXISTS idx_se_gains_station ON se_gains(station);
CREATE INDEX IF NOT EXISTS idx_se_gains_qr_token ON se_gains(qr_token);

-- 2. Vue consolidee pour generation des bons
CREATE OR REPLACE VIEW v_bons_achat_nds AS
SELECT
  g.id AS gain_id, g.code AS ticket_num, g.type, g.libelle,
  g.montant, g.station, g.qr_token, g.utilise, g.utilise_ts,
  g.valide_jusqu_au, g.created_at,
  p.id AS partenaire_id, p.nom AS partenaire_nom,
  p.adresse AS partenaire_adresse, p.code_postal AS partenaire_cp,
  p.ville AS partenaire_ville, p.pack AS partenaire_pack,
  COALESCE(g.gagnant_nom, NULLIF(TRIM(COALESCE(j.prenom,'') || ' ' || COALESCE(j.nom,'')),'')) AS gagnant_nom,
  COALESCE(g.gagnant_email, j.email) AS gagnant_email,
  COALESCE(g.gagnant_tel, j.tel) AS gagnant_tel,
  g.super_event_id, g.event_id
FROM se_gains g
LEFT JOIN partenaires p ON p.id = g.partenaire_id
LEFT JOIN joueurs j ON j.id = g.joueur_id
WHERE g.super_event_id = 'se-nds-2026';

-- 3. Fonction de generation de numeros de ticket sequentiels par station
CREATE OR REPLACE FUNCTION next_ticket_code_nds(p_station text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE v_prefix text; v_seq int;
BEGIN
  v_prefix := CASE upper(p_station)
    WHEN 'BAR' THEN 'NDS-BAR-2026-'
    WHEN 'CAISSES' THEN 'NDS-CAI-2026-'
    WHEN 'ECRAN' THEN 'NDS-ECR-2026-'
    WHEN 'TABLETTE' THEN 'NDS-TAB-2026-'
    ELSE 'NDS-XXX-2026-'
  END;
  SELECT COALESCE(MAX(CAST(substring(code FROM '\d+$') AS int)),0)+1
    INTO v_seq FROM se_gains
    WHERE code LIKE v_prefix||'%' AND super_event_id='se-nds-2026';
  RETURN v_prefix || lpad(v_seq::text,5,'0');
END;$$;

-- Test confirme en prod :
--   SELECT next_ticket_code_nds('BAR')      -> NDS-BAR-2026-00001
--   SELECT next_ticket_code_nds('CAISSES')  -> NDS-CAI-2026-00001
--   SELECT next_ticket_code_nds('ECRAN')    -> NDS-ECR-2026-00001
--   SELECT next_ticket_code_nds('TABLETTE') -> NDS-TAB-2026-00001
