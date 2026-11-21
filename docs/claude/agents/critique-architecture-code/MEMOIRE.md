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
