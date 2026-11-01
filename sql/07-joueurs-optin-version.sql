-- ============================================================================
-- 07 — joueurs.optin_version : colonne ECRITE par le code, absente de tout SQL du depot  [01/11/2026]
-- ============================================================================
-- NON APPLIQUE EN BASE. Independant des autres fichiers (aucun prerequis) : a lancer EN PREMIER.
-- Idempotent.
--
-- CONSTAT (verification 01/11, rejeu sur Postgres local) : lib/parcours.ts ecrit
-- `optin_version` (version du texte de consentement, ex. « flowin-consentement-2026-11 ») a chaque
-- inscription d'un joueur. Aucun fichier sql/ ne cree cette colonne. Si elle manque en prod,
-- l'INSERT dans joueurs est refuse (PostgREST PGRST204 « Could not find the 'optin_version' column »)
-- et TOUT joueur qui valide le formulaire voit « Enregistrement impossible ».
-- Le code a en plus un repli (nouvel essai sans cette colonne) : l'inscription ne casse plus,
-- mais la version du consentement n'est alors PAS tracee tant que ce fichier n'est pas applique.
--
-- VERIFIER AVANT (lecture seule) :
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'joueurs' and column_name = 'optin_version';
alter table public.joueurs add column if not exists optin_version text;
comment on column public.joueurs.optin_version is
  'Version du texte de consentement accepte (CONSENTEMENT_VERSION, lib/parcours.ts), pour prouver ce a quoi le joueur a consenti.';
