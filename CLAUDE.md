# CLAUDE.md — Flowin / Nuits du Sud 2026

Instructions de travail pour toute session Claude Code (cloud ou terminal) sur ce dépôt.
Source de vérité du reste-à-faire : `HANDOFF-flowin-nds2026.md`.

## Projet
- Flowin : plateforme B2B de gamification événementielle. Produit de **BAITA EURL (OPConsult)**.
- Projet actif : **Nuits du Sud 2026** (festival, Vence, 9–18 juillet 2026).
- Deux parties de code :
  - **Dashboard SA** : monolithe vanilla JS — `admin/public/dashboard.html` + miroir `admin/public/static/dashboard.html`.
  - **Next.js 14 (App Router)** sous `admin/` : parcours joueurs React + dashboard pro. Déployé sur Vercel (root `/admin`, auto-deploy depuis `main`).

## Identité des commits
- Author / committer : `Romain Collin <romain@flowin.events>`.

## Règles critiques (ne pas enfreindre)
1. **Jamais de secret dans un commit** : token GitHub, clés Supabase « secret/service_role ». La clé Supabase *publishable* est publique par design et autorisée.
2. **Miroir dashboard** : `admin/public/dashboard.html` et `admin/public/static/dashboard.html` doivent avoir un **MD5 identique** avant tout push.
3. **Vanilla JS du dashboard** : doit passer **Acorn `ecmaVersion: 2020` avec 0 erreur** avant push. Syntaxe **iOS Safari-safe** : `var` uniquement, `.indexOf()` (pas `.includes()`), pas de spread, pas d'`Object.assign`, déclarations `function`.
4. **Ne jamais modifier** `admin/.../NDS2026Client.tsx` (logique maître) ni `nds2026Design.ts` (base dark-theme canonique). Les surcharges white-theme vivent **exclusivement** dans `NDS2026Client.tsx` comme règles `!important` scopées à `.ndsbody`.
5. **Données inventées interdites** : jamais fabriquer téléphone, email, SIRET, n° TVA, coordonnées, handles sociaux. Utiliser des placeholders explicites `[… à compléter]`.
6. **Genre dans les formulaires** : uniquement Homme / Femme / vide. Jamais « Autre ».
7. **Travail en bloc cohérent** : HTML + CSS + JS + SQL alignés dans une même livraison, pas en patchs épars.

## Workflow build / vérification avant push
- Vanilla JS : valider avec Acorn (`ecmaVersion: 2020`).
- Next.js (`admin/`) : `npm install` puis `npx tsc --noEmit` et `npm run build`. **Lire le log de build** (`✓ Compiled successfully`), ne pas se fier au seul code de sortie. `CssSyntaxError` sur Google Fonts = ignorable.
- Avant commit Next : `git checkout -- tsconfig.tsbuildinfo` s'il a changé.
- Après push : vérifier le remote (`git ls-remote origin -h refs/heads/main`).
- Toujours `git pull --ff-only` (ou fetch + rebase propre) avant de pousser : plusieurs environnements peuvent écrire sur `main`.

## Supabase
- Accès DB via **MCP / connecteur Supabase** (projet eu-west-1 `ywcqtupgoxfzkddqkztk`), jamais en dur dans le code.
- Requêtes **une par une** (pas de batch). Projeter les colonnes scalaires : `select *` échoue sur les tables à colonnes jsonb larges.
- `apply_migration` = DDL persistant immédiatement en prod, ne pas rejouer. `execute_sql` = DML.
- Table `joueurs` : colonne `tel` (pas `telephone`) ; `email_lower` est une colonne générée, ne jamais l'insérer.
- Mises à jour de config jsonb : `jsonb_set(cfg, '{clef}', valeur::jsonb, true)` pour ne pas écraser l'objet.

## URLs production
`flowin-events.vercel.app/landing`, `/nds`, `/dashboard.html`, `/pro-nds-live.html?ev=`, `/bon-commande-nds.html`.
