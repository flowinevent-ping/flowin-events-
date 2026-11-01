-- ============================================================================
-- 02 — PROS : champs entreprise et onboarding (« Ma première fois », 31/10/2026)
-- ============================================================================
-- PREREQUIS : la table public.pros (existante). Aucun autre fichier. Voir l'ordre complet en tete de 01.
-- A APPLIQUER A LA MAIN (SQL editor Supabase ou apply_migration).
-- Rien n'est detruit : uniquement des colonnes ajoutees, toutes facultatives.
--
-- Tant que ce fichier n'est pas applique, le parcours /pro/premiere-fois
-- fonctionne en mode degrade : il cree le pro avec les colonnes historiques
-- (nom, secteur, adresse, siret, contact…) et ignore les nouvelles.
--
-- Origine des valeurs : saisies par le pro, ou pre-remplies depuis l'API
-- publique « Recherche d'entreprises » (INSEE / RNE) puis relues par lui.
-- ============================================================================

alter table public.pros add column if not exists siren               text default '';
alter table public.pros add column if not exists forme_juridique     text default '';  -- libelle (ex. « Société par actions simplifiée (SAS) »)
alter table public.pros add column if not exists forme_juridique_code text default ''; -- code INSEE (ex. 5710)
alter table public.pros add column if not exists code_naf            text default '';  -- ex. 10.71C
alter table public.pros add column if not exists activite_naf        text default '';  -- section NAF lisible
alter table public.pros add column if not exists date_creation_entreprise date;
alter table public.pros add column if not exists nom_commercial      text default '';  -- enseigne
alter table public.pros add column if not exists produits_services   text default '';
alter table public.pros add column if not exists nb_points_vente     integer;
alter table public.pros add column if not exists onboarding_source   text default ''; -- 'premiere-fois' | 'sa' | ''
alter table public.pros add column if not exists onboarding_fini_at  timestamptz;

-- Le SIRET reste dans la colonne historique `siret` (texte, 14 chiffres sans espace).
comment on column public.pros.siren is 'SIREN (9 chiffres), deduit du SIRET ou de l''API Recherche d''entreprises';
comment on column public.pros.nb_points_vente is 'Nombre de points de vente declare par le pro a l''inscription';

-- Date d'ouverture de l'espace pro (posee une seule fois par l'activation au paiement, voir 03).
alter table public.pros add column if not exists acces_active_at timestamptz;
