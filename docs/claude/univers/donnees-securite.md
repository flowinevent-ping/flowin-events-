# Rubrique Données et sécurité
Entrée : « Flowin Event · Données et sécurité ». Agents : `securite-donnees`, `critique-performance-donnees`.

## Ce qui est propre
Droits d'accès (RLS), fonctions de base (RPC), consentement, données personnelles, mineurs, intégrité des jeux et tirages, sauvegardes, contrôles qualité quotidiens.

## Règles
Jamais de secret dans un commit ni dans la mémoire. Table `joueurs` : `tel` (pas `telephone`), `email_lower` jamais inséré. Toute donnée fermée en anonyme se charge avec le jeton SA dans le navigateur. SQL de production : un à la fois, après accord de Romain. Une base séparée pour Flowin Révision : ne jamais y toucher.

## Argent
Aucun. Factures et bons : `paiement.md`.

## Code
`sql/`, `supabase/functions/`, `admin/lib/supabase.ts`, `saSession.ts`, `docs/SECURITE-*.md`, `docs/claude/CONTROLES.md`, `docs/claude/PLAN-DE-REPRISE.md`.

## Où ça vit
| Rôle | Profils |
|---|---|
| Jouent | Tous (chacun lit ses données) |
| Règlent | Super Admin |
| Fournissent | cette rubrique |
| Consomment | Pro (son fichier client), Participant (son profil) |
Lire aussi : `jeux-tirages.md`, `paiement.md`.

## À faire et notes
Factures et bons de commande lisibles sans connexion : décision attendue. `pros_anon_select` : confirmation de Romain attendue. Nettoyage des données TEST bloqué. Détail : `kit/A-FAIRE.md`.
