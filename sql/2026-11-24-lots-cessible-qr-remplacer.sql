-- Lots 5 B / 6 A / 6 B (24/11/2026) : colonnes additives. NON APPLIQUE : à faire valider par securite-donnees puis Romain.
-- Additif seulement : aucune colonne existante modifiée, aucune donnée supprimée.
-- Le code retombe sur les colonnes existantes tant que ce fichier n'est pas appliqué
-- (cessible reste dans events.cfg.lots ; la désactivation d'un QR n'écrit que qr_stations.publie).

-- 1. Lot cessible à un tiers (NULL = ancien comportement : billet au porteur). Nouveaux lots : false par défaut côté code.
alter table public.lots add column if not exists cessible boolean;

-- 2. Remplacement d'un QR par le pro : horodatage de la désactivation et lien vers le QR qui le remplace.
alter table public.qr_stations add column if not exists desactive_le timestamptz;
alter table public.qr_stations add column if not exists remplace_par text;

-- Droits : les colonnes héritent des politiques RLS des tables (lots_*, qr_stations_*). Aucun GRANT ajouté.
-- À vérifier avant application : un pro connecté peut-il UPDATE qr_stations (politique qr_stations_auth_gestion) ?
--   select polname, polcmd, pg_get_expr(polqual, polrelid) from pg_policy where polrelid = 'public.qr_stations'::regclass;

-- Retour arrière (colonnes vides sans effet ; à ne lancer que si Romain le demande) :
--   alter table public.lots drop column if exists cessible;
--   alter table public.qr_stations drop column if exists desactive_le;
--   alter table public.qr_stations drop column if exists remplace_par;
