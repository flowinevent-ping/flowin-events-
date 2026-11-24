# Mémoire : critique-architecture-code (créée le 21/11/2026 ; ≤120 lignes)

## Contraintes à respecter : ne jamais proposer de les lever
- `admin/app/parcours/nds2026/NDS2026Client.tsx` (1 610 lignes) et `nds2026Design.ts` : intouchables (CLAUDE.md 4). Surcharges white-theme seulement en `!important` scopé `.ndsbody` dans le composant.
- Miroir : `admin/public/dashboard.html` = `admin/public/static/dashboard.html` (MD5 identique, vérifié identiques le 21/11). Acorn 2020 à 0 erreur, `var`, `.indexOf()`, pas de spread ni `Object.assign`.
- Aucune ligne de `docs/REGISTRE-livrables-refonte.md` supprimée sans Romain. Tout travail en bloc cohérent (HTML + CSS + JS + SQL).
- Sécurité RLS / RPC appliquée 19-20/11 : aucune simplification qui la relâche.

## Mesures de référence (21/11/2026, dépôt au commit f697f3d8)
- Monolithe : `dashboard.html` 15 648 lignes, 1 163 250 octets, en 2 copies identiques. Plus gros composants : `ParcoursCreation.tsx` 1 608 lignes, `BlocsOperations.tsx` 862, `EventDrawer.tsx` 795, `PremiereFois.tsx` 762. ~37 900 lignes de .tsx au total.
- Doublon prouvé : les 7 pages `admin/parcours/*.html` sont identiques octet pour octet à `admin/public/parcours/*.html` (quiz, quizmaster, quizsolo, spin, standup, tombola, vote). `admin/public` contient 41 pages .html ; 830 fichiers suivis.
- Code mort prouvé par grep (aucun import) : `admin/lib/actions.ts` (20 lignes, `'use server'`), qui est le seul importeur de `admin/lib/joueurs.ts` (104 lignes) ; `admin/lib/landing.ts` (64 lignes) sans importeur. Donc joueurs.ts est mort par ricochet. À revérifier avant toute suppression (imports dynamiques, scripts).
- Poids : `admin/public` 856 Mo (`nds` 668 Mo, `videos` 131 Mo) ; pack git 2,04 Gio, `.git` ~2,3 Go ; ZIP suivis : `nds-dossier-festival.zip` 73 Mo, `kit-nds.zip` 30 Mo, `bergerie-kit.zip` 17 Mo ; `nds-spot-player.html` 12,2 Mo. Déjà proposé : AMEL-PERF-01 (ne pas re-proposer, seulement compléter).
- Tests : aucun framework (ni jest ni vitest) ; seulement des scripts `admin/scripts/qa-qr/*` et `verifier-*.mjs`. Premier workflow CI : `.github/workflows/controle-qualite.yml` (21/11, non encore exécuté sur GitHub).
- Typage : `admin/tsconfig.json` `"strict": false`.
- Dépendances (`admin/package.json`) : `playwright` et `puppeteer-core` sont dans `dependencies` (utilisés seulement par `admin/scripts`), `xlsx` 0.18.5, `leaflet` encore utilisé par `NDS2026Client.tsx` et `app/dashboard/nds-carte` alors que la carte publique est MapLibre. `npm audit` non lancé : non vérifié.
- Base SQL : 95 fichiers dans `sql/` (39 datés 2026-11-xx dont 12 de 20-21/11 ; 56 plus anciens sans date) ; migrations appliquées côté Supabase (`list_migrations`) avec noms différents des fichiers du dépôt : pas de lien 1 pour 1 vérifié.
- Déploiement : Vercel auto-deploy depuis `main` (root `/admin`, `installCommand` avec `--legacy-peer-deps`), Supabase appliqué à la main ; aucun tag git avant le 21/11 (créés ce jour, voir PLAN-DE-REPRISE.md).
- Fonctions Edge déployées sans source dans ce dépôt : `cron-cloture-ligue`, `generer-ia`, `notify-migration-eleve`, `reset-partenaire-revision` (probablement Flow-révision, même projet Supabase : à confirmer).

## Pistes à instruire (aucune n'est encore une proposition validée)
1. Filet de tests avant tout refactor : smoke Playwright déjà en place (`scripts/controle/`) ; ajouter tests unitaires de `lib/` pures.
2. Supprimer les trois fichiers morts (après confirmation par build + grep) : gain faible, risque faible.
3. Une seule source pour les parcours HTML (copie générée au build ou lien) : risque de dérive aujourd'hui nul (identiques), à garder tel quel tant qu'aucune évolution.
4. Sortir `playwright` / `puppeteer-core` de `dependencies` : temps d'installation Vercel à mesurer.

## Pièges
- Ne pas confondre « gros fichier » et « mauvais fichier » : le dashboard est volontairement un monolithe vanilla (iOS Safari-safe) ; proposer un découpage seulement avec test de non-régression et le miroir.
- Lecture seule : pas de `npm install` dans le dépôt de travail d'un autre agent, pas de build qui change `tsconfig.tsbuildinfo`.

## Journal des passages
- 21/11/2026 : création de l'agent et mesures de base (aucun passage complet encore ; premier passage prévu le 01/12/2026).

## Historique 6 mois (Notion + git, importé le 24/11/2026). Sources : voir SOURCES.md (HUB, REP03, REF, PIL) et `docs/patterns-bugs-connus.md` (patterns A à M)
- 01/09 · Un composant « Raccourci » atteint les écrans lourds sans les recopier ; les hubs à onglets font un import dynamique de la page existante : zéro duplication, URLs d'origine inchangées. Bon patron pour un rangement de menu (HUB 31/08 lot 6, 01/09).
- 01/09 · `PartenaireDrawer` en mode `inline` affichait son pied de page : deux boutons « Supprimer » dont un supprimait la mauvaise entité. Un composant réutilisé doit exposer un mode `inline` qui coupe ses actions destructrices (HUB 01/09).
- 01/09 · Piège React : `chargeG` à la fois dans les deps du `useEffect` et posé dedans = « Chargement… » infini ; une liste rechargée « si vide » boucle sur un event sans participants : piloter le chargement par l'identifiant de l'objet chargé (HUB 01/09).
- 01/09 · `tsconfig` cible ES5 : `[...new Set(x)]` échoue (TS2802), utiliser `filter` + `indexOf`. Un remplacement global naïf a produit deux fois `const t = tab ?? t` (TS2448) : relire chaque remplacement (HUB 01/09).
- 29/08 · Source unique du comptage (25/07) : chaque vue calculait ses propres bornes, d'où des valeurs différentes pour une même grandeur ; une CTE sans bornage a gonflé 302 en 321. Garde-fou : un compteur affiché dérive d'une RPC unique, bornage vérifié CTE par CTE (HUB 25/07 et 29/08, Pattern I).
- 18/07 · `events.participants` incrémenté dans une RPC puis rejeu hors ligne qui insère directement : dérive −18 %. Règle : tout compteur est DÉRIVÉ de la table de faits (trigger + backfill), jamais `SET x = x + 1` ; un compteur affiché n'est jamais la longueur d'une liste paginée (`limit=500` pour 769) (HUB 18/07).
- 12/07 · Règle systémique : aucune statistique codée en dur pour un event, une station, un partenaire ; `lib/parcours-tracking.ts` = source unique du traçage ; RPC génériques paramétrées par `p_se` (HUB 12/07). Reste « NDS codé en dur » à déparamétrer (opérations, nds-lots).
- 03/09 · Doublons de définitions : couleurs déclarées à 4 endroits, liste des secteurs inventée en double, SIRET dans deux tables, 9 commerces en double (`pro-safer` et `pt-safer`) résolus dans l'UI sans changer le schéma (REP03, HUB 01/09). Principe de Romain : une seule source par donnée.
- 23/07 · Réécrire de zéro `billets-partenaires.html` a perdu adresses, téléphones et conditions validés (récupérés dans git). Règle : chercher l'existant (`grep` + historique git), modifier ; si réécriture : extraire toutes les données de contenu d'abord, vérifier par diff (HUB 23/07).
- 23/07 · Un même e-mail gagnant existait en 3 exemplaires divergents : source unique `/nds/mail-gagnant.js`. Conditions d'un lot : source unique `partenaires.lots[].conditions` (HUB 23/07).
- 02/09 · QR généré dans le navigateur (composant `Diffusion`) au lieu d'un service tiers `api.qrserver.com` (non téléchargeable, illisible à l'impression, hors service si le tiers tombe) ; `nds-media` et `nds-comm` l'utilisaient encore à l'époque : à revérifier (HUB 02/09).
- 25/07 · Trois systèmes de dashboard jamais fusionnés (Pattern G) ; migration Next terminée 25/07 (31/31 vues) mais KPI du monolithe perdus dans la réécriture (score moyen, clics liens, courbe) : régression à corriger AVANT de retirer le monolithe, pas du code mort (REP27).
- 29/08 · Table abandonnée `se_gains` (remplacée par `tirages` le 28/07) encore lue par des vues : « GAINS 0 » en prod, 0 vers 235 après correction. Après toute migration de table : chercher les lecteurs (vues, RPC, pages) de l'ancienne (HUB 29/08).
- 27/08 · 3 Edge Functions Révision (notify-migration-eleve, generer-ia, reset-partenaire-revision) « pas redéployées » sur le nouveau projet : rapprochement possible (hypothèse, non prouvée) avec les 4 fonctions déployées sans source dans le dépôt ; À TRANCHER avec la ligne Révision de continuite-reprise (HUB 27/08).
