-- ============================================================================
-- 12 — DEMANDES DE RATTACHEMENT : pack et tarif souhaites  [03/11/2026]
-- ============================================================================
-- NON APPLIQUE EN BASE. Facultatif, sans dependance. Idempotent.
-- La grille de tarifs a cocher du parcours « rejoindre un super event » presélectionne la demande. Tant que ce fichier n'est pas applique,
-- le pack coche est range dans le texte de la colonne offre (visible dans « Demandes de participation ») : rien n'est perdu.
-- Applique, il ajoute deux colonnes lisibles par le Super Admin. Rien n'est facture : « Tarif a confirmer par Flowin ».
--   pack_souhaite      : visibilite | animation | sponsor | visible  (admin/lib/commercial.ts, PACKS_DEMANDE ; descriptifs de nds-partenaire.html)
--   tarif_souhaite_ht  : prix HT affiche au moment de la demande (500 / 1400 / 3590 ; NULL pour « simplement visible » : tarif à définir avec Flowin), a titre indicatif
-- ============================================================================
alter table public.demandes_rattachement_super_event add column if not exists pack_souhaite     text;
alter table public.demandes_rattachement_super_event add column if not exists tarif_souhaite_ht numeric;
