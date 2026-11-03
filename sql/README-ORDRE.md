# Ordre d'application des fichiers SQL en attente

> **Aucun de ces fichiers n'est appliqué en production.** Ils se lancent à la main (éditeur SQL Supabase),
> un par un, dans l'ordre ci-dessous, **avec l'accord explicite de Romain**. Chaque fichier se rejoue sans dommage
> (idempotent). Tant qu'un fichier manque, le code fonctionne en mode dégradé (message clair, rien ne casse).
> Les anciens fichiers du dépôt (`FINAL_CONSOLIDATED.sql`, `RUN_ON_SUPABASE.sql`, `crm_pro.sql`…) sont déjà en base : ne pas les rejouer.

Numéros uniques : plus aucune collision (les trois anciens `08-*` sont devenus `08`, `09`, `10`).

## La chaîne (dans cet ordre)

1. `sql/07-joueurs-optin-version.sql` — colonne `joueurs.optin_version` écrite par le code. Sans prérequis, à lancer en premier : sans elle, l'inscription d'un joueur peut échouer.
2. `sql/01-identite-super-admin.sql` — qui est Super Admin (table `flowin_super_admins`, fonction `est_super_admin()`). Prérequis de presque tout le reste. **À fournir par Romain avant** : le compte Supabase Auth du Super Admin (voir l'insert commenté en tête du fichier).
3. `sql/02-pros-entreprise-onboarding.sql` — champs entreprise de « Ma première fois » (SIREN, forme juridique, NAF…).
4. `sql/03-commandes-animation.sql` — commandes, factures, paiement, mise en service du compte pro (requiert 01 et 02 ; la fonction edge `notify-commande-animation` est à déployer à part).
5. `sql/04-pros-rib.sql` — coordonnées bancaires du pro (requiert 01).
6. `sql/05-confidentialite-contacts.sql` — contacts joueurs, **phase 1 seulement** (requiert 01 et la fonction `crm_pro` déjà en base). Les phases 2 et 3 sont un plan écrit en commentaires, à ne pas exécuter avant la connexion du Super Admin.
7. `sql/06-droits-pro.sql` — droits d'accès du pro pilotés par le Super Admin (requiert 01).
8. `sql/2026-10-31-jeux-masters.sql` — table `jeux_masters` (valeurs par défaut des jeux modifiables par le Super Admin).
9. `sql/2026-10-31-positions-joueurs.sql` — positions « autour de moi » (consentement explicite).
10. `sql/2026-11-01-tirage-auto-liste-gagnants.sql` — QR tracés, liste publique des gagnants, tirage programmé. **Avant la section 6** : remplacer `<ANON_KEY>` par la clé anon du projet (jamais une clé service_role).
11. `sql/08-bon-commande-v2.sql` — bon de commande v2 : numérotation, export CRM, garantie souscrite après coup (requiert 01 et 03).
12. `sql/09-qr-permaliens.sql` — QR permanents `/q/<code>` (requiert 01 et `2026-11-01-tirage-auto-liste-gagnants.sql`, sections 1 et 2 au minimum).
13. `sql/10-resultats-tirage.sql` — résultats de tirage par participant (profil joueur + alerte). **Avant la section 4** : remplacer `<ANON_KEY>` comme ci-dessus.
14. `sql/11-super-events-demo.sql` — **données** : colonnes de position des super events, « Nice Jazz Festival » (Nice) et « Nuits du Sud » (Vence, position seulement) sur la carte, démo des Fêtes du haut et moyen pays (logo, Quiz + bonus). Dates non inventées (« [à compléter] »).
15. `sql/12-demandes-pack-souhaite.sql` — pack et tarif souhaités dans la demande de rejoindre un super event (facultatif ; sans lui le pack est rangé dans le texte de la demande).

## Comment c'est testé

`admin/scripts/qa-qr/chaine-sql.sh` reconstruit une base Postgres **locale jetable** à partir de `sql/`, applique cette liste dans l'ordre
avec arrêt à la première erreur, la rejoue une seconde fois (idempotence), puis lance des contrôles (droits, verrous, fonctions).
Cette liste est lue par le script : garder le format `N. \`sql/fichier.sql\``.
Les tables qui existent en prod mais dont le DDL n'est pas dans `sql/` (`tirages`, `se_tickets`, `demandes_rattachement_super_event`…)
sont simulées par `admin/scripts/qa-qr/db/11-tables-prod-manquantes.sql` (test seulement, jamais appliqué).

## Rappel des filets de sécurité

- Le code détecte l'absence d'une colonne ou d'une fonction et se replie : voir la liste « Mode dégradé » de la PR.
- `apply_migration` = DDL persistant immédiatement en prod : ne pas rejouer à la légère.
