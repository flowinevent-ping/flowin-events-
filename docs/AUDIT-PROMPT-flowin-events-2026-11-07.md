# Prompt d'audit 10/10 — Flowin Events

Adapté le 07/11/2026 du prompt générique utilisé pour Flowin Révision, à la
demande de Romain. Contexte rempli avec ce qui est **vérifié dans le dépôt**
(marqué ✅) ; ce qui reste à trancher par Romain est marqué **❓ À CONFIRMER**.
Les ajouts par rapport au prompt générique (éléments de contrôle qui
manquaient) sont signalés par **[AJOUT]**.

Validé par Romain le 07/11/2026 (comptes de test `qa+`, pas d'interdit de
vocabulaire particulier au-delà des règles déjà connues) — Phase 1 lancée le
jour même, en parallèle, un agent par profil + deux agents dédiés
(souscription pro, patterns connus).

---

## Contexte

**Application** : Flowin Events.
- Prod : `flowin-events.vercel.app` (routes clés : `/landing`, `/nds`,
  `/dashboard.html`, `/pro-nds-live.html?ev=`, `/bon-commande-nds.html`).
- Dépôt : `flowinevent-ping/flowin-events-`.
- Deux couches de code actives **[AJOUT — Pattern G, patterns-bugs-connus.md]** :
  dashboard SA legacy vanilla JS (`admin/public/dashboard.html` + miroir
  `admin/public/static/dashboard.html`, MD5 identiques obligatoire) et
  Next.js 14 App Router (`admin/`, déployé sur Vercel, root `/admin`,
  auto-deploy depuis `main`). Une collection d'outils HTML autonomes
  (`admin/public/*.html` : factures, bons de commande, kit-digital…)
  s'y ajoute. **Les trois couches ne sont pas fusionnées** : une fonctionnalité
  peut exister et être soignée dans une couche et absente/différente dans les
  deux autres. Avant de dire « ça n'existe pas » ou « il manque X », chercher
  dans les trois.

**Profils d'utilisateurs** :
- **SA** (équipe Flowin / BAITA) — pilotage global, dashboard SA.
- **Pro / organisateur** — un commerce (« event » seul) ou un festival/collectif
  (« super event », plusieurs stations). C'est le profil que Romain cible en
  priorité pour cet audit (« trop d'info, il faut des choses simples pour les
  pros, les organisateurs »).
- **Joueur / participant** — grand public, parcours de jeu + retrait de lot.

**Promesse en une phrase** (reprise des mots de Romain + `docs/REFERENTIEL-fonctionnel-flowin.md`) :
Flowin est un **outil de communication et d'animation événementielle** — un
jeu simple (quiz, roue, tombola, vote) qu'un commerce ou un festival diffuse
pour faire venir du trafic en boutique/sur site et constituer un CRM visiteurs,
seul ou en réseau multi-stations.

**Supports de référence (vérifiés dans le dépôt)** :
- `docs/DESIGN-TOKENS-flowin.md` — charte couleurs/typo officielle (bleu
  #3B5CC4, violet #7A4FE0, logo « Flow »+« in », univers comics jaune/rouge
  réservé au Super event). **Design graphique déjà validé par Romain — ne pas
  y toucher, logo et tagline conservés tels quels.**
- `docs/REFERENTIEL-fonctionnel-flowin.md` — périmètre fonctionnel validé le
  16/09 par Romain : **toute correction se mesure à ce document**, c'est la
  référence pour juger ce qui manque vs ce qui est hors-scope.
- `admin/lib/charte.ts`, `admin/public/flowin-tokens.css`.
- Plaquettes : `admin/public/plaquette-nds.html`, `plaquette-super-event.html`,
  `plaquette-animation-magasin.html`, `docs/plaquette-interactive/`.
- **[AJOUT]** `docs/patterns-bugs-connus.md` — 13 classes de bugs déjà
  identifiées sur ce projet (voir section dédiée ci-dessous : chaque agent
  d'audit doit les connaître AVANT de partir en exploration, pour ne pas
  rediagnostiquer des causes déjà fausses et déjà corrigées ailleurs).

**Parcours de souscription concernés** (le point d'alerte de Romain) :
`/pro/inscription`, `/pro/premiere-fois`, `/pro/nouvelle`, `/pro/rejoindre`,
`/rejoindre/[se]`, `/dashboard/wizard-pro`. À vérifier : lequel de ces points
d'entrée est réellement celui qu'un pro externe rencontre en premier en
production (plusieurs existent, risque de redondance ou d'incohérence entre
eux — cf. Pattern G).

**Comptes de test** : tranché par Romain le 07/11 — comptes jetables créés à
la volée, préfixés `qa+` (ex. `qa+pro1@flowin.events`), isolés des vraies
données. Seule écriture autorisée en prod pendant l'audit (cf. règle «
lecture seule » ci-dessous, qui reste la règle par défaut pour tout le
reste). Pour le dashboard SA, l'accès Supabase direct au projet
`ywcqtupgoxfzkddqkztk` est confirmé fonctionnel depuis cette session.

**Interdits de ton et de vocabulaire** : tranché par Romain le 07/11 — pas
d'interdit de vocabulaire particulier au-delà des règles déjà connues.
Règles déjà connues (CLAUDE.md), à vérifier automatiquement (0 occurrence
attendue pour les manquements) :
- Formulaires : genre limité à Homme / Femme / vide — **jamais** « Autre ».
- Jamais de données inventées (téléphone, email, SIRET, TVA, coordonnées,
  réseaux sociaux) — placeholders explicites `[… à compléter]` uniquement.
- **[AJOUT]** Cohérence tutoiement/vouvoiement : le joueur est tutoyé
  (`mail-gagnant.js` : « Bonjour [prénom], tu as gagné… »), le pro est-il
  vouvoyé partout côté SA/Pro ? À vérifier, pas supposé — relève de l'axe
  Compréhension (homogénéité des textes), pas d'un interdit à proprement
  parler.

**Règles métier connues** (CLAUDE.md + référentiel fonctionnel) :
- `jsonb_set` pour toute mise à jour de config, jamais d'écrasement d'objet.
- Table `joueurs` : colonne `tel` (pas `telephone`), `email_lower` générée
  (jamais insérée).
- `apply_migration` = DDL immédiat en prod, jamais rejoué ; `execute_sql` =
  DML ; requêtes une par une.
- **Fichiers protégés, jamais modifiés** **[AJOUT — à rappeler explicitement
  aux agents de correction, pas seulement d'audit]** :
  `NDS2026Client.tsx` (logique maître) et `nds2026Design.ts` (base dark-theme
  canonique). Les surcharges white-theme vivent exclusivement dans
  `NDS2026Client.tsx` en règles `!important` scopées `.ndsbody`.
- Vanilla JS du dashboard SA : Acorn `ecmaVersion: 2020`, 0 erreur, syntaxe
  iOS Safari-safe (`var`, `.indexOf()`, pas de spread, pas d'`Object.assign`).
  **[AJOUT]** → implique que le test mobile de la Phase 1 doit couvrir
  **Safari iOS réel**, pas seulement une fenêtre 390×844 sous Chromium : une
  régression de syntaxe non Safari-safe ne se voit pas dans un simple
  changement de viewport.

---

## Mission

Identique au prompt d'origine : auditeur extérieur exigeant et objectif,
10/10 par axe, point de vue d'un utilisateur réel. Chaque constat prouvé
(capture, mesure, requête, ligne de code). Ce qui est vérifié est toujours
séparé de ce qui est supposé.

## Règles de travail

Celles du prompt d'origine, **plus** :

- **[AJOUT] Lecture seule, explicite.** Toute requête d'audit sur Supabase
  est un `select`. Aucun `insert`/`update`/`delete`/`apply_migration` pendant
  la Phase 1, même « pour tester » — quelle que soit la facilité d'accès
  técnique au projet `ywcqtupgoxfzkddqkztk`.
- **[AJOUT] Connaître `docs/patterns-bugs-connus.md` avant d'auditer.** Les
  13 patterns (A à M) y décrivent des classes de bugs déjà rencontrées :
  liste sans clic, mauvaise source de données gagnants/lots, page orpheline
  non reliée au menu, RLS sans policy `anon`, token de session jamais
  rafraîchi, page réintégrée avec un style disjoint du système `sa-*`, RPC
  mal appelé… Chaque agent doit les relire et les rechercher activement,
  pas seulement tomber dessus par hasard.
- **[AJOUT] Les « volets », « cartes » et pages qui sautent sont nommément
  dans le périmètre.** Romain a signalé trois symptômes précis à vérifier
  systématiquement, écran par écran : (1) des pages qui « sautent » au
  chargement (CLS visible), (2) une carte/fonction carte qui ne marche pas
  bien, (3) un volet (drawer/modal/panneau latéral) qui ne s'ouvre ou ne se
  ferme pas correctement. Chaque drawer et modal de l'app (`openDrawer`,
  `ModalGererLots`, tiroirs `sa-drawer-*`, panneaux du parcours pro) est
  ouvert ET fermé au moins une fois pendant l'audit, pas seulement listé.

## Phase 1 : audit sévère (agents en parallèle, un par profil)

Identique au prompt d'origine (agent SA, agent Pro/organisateur, agent
Joueur, agent transversal), avec deux agents supplémentaires proposés
**[AJOUT]**, vu l'alerte spécifique de Romain :

- **Agent dédié « Souscription pro »** : parcourt exclusivement les points
  d'entrée listés plus haut (`/pro/inscription`, `/pro/premiere-fois`,
  `/pro/nouvelle`, `/pro/rejoindre`, `/rejoindre/[se]`,
  `/dashboard/wizard-pro`), compte le nombre d'écrans, de champs par écran,
  de mots par écran, identifie les écrans qui annoncent une info avant que
  l'utilisateur en ait besoin (surcharge), et propose une version resserrée
  à nombre d'écrans réduit — sans coder, juste décrite + maquette en Phase 2.
- **Agent technique dédié aux patterns connus** : exécute littéralement les
  commandes de vérification données dans `docs/patterns-bugs-connus.md`
  pour chacun des 13 patterns (greps et requête SQL fournis), sur
  l'intégralité du dépôt, pas seulement les pages déjà suspectées.

Grille de contrôle (axes du prompt d'origine, tableau Design / Ergonomie /
Fluidité / Compréhension / Fonctionnel / Données / Engagement / Attractivité
/ Accessibilité / Technique) **inchangée**, avec ces précisions
**[AJOUT]** sur l'axe Technique :
- Erreurs console navigateur **et** erreurs Vercel (build + runtime logs).
- Score Lighthouse mobile (Performance / Accessibilité / Bonnes pratiques /
  SEO) sur au moins les 3 pages publiques critiques : `/landing`, `/nds`,
  `/rejoindre/[se]`.
- QR codes : au moins un QR par type (station, tracking, lot) réellement
  scanné et vérifié résolvant la bonne URL (cf. `docs/AUDIT-QR-permaliens-2026-11-01.md`
  si existant — à relire avant de reproduire ce travail).
- Liens email pré-remplis (`mail-gagnant.js`, `mailPartenaireUrl`) : au moins
  un généré et vérifié (destinataire, sujet, corps) par type d'email.

### Livrable de la phase 1
Identique au prompt d'origine (notes /10 justifiées, liste priorisée
P0/P1/P2 avec fichier + cause racine + correctif, analyse concurrentielle
courte, liste de ce qui n'a pas pu être vérifié).

## Phase 2 : maquette navigable

Identique au prompt d'origine. **[AJOUT]** : la maquette reprend exactement
la palette de `docs/DESIGN-TOKENS-flowin.md` (pas de nouvelle palette créée
pour l'occasion) et respecte la règle « univers comics réservé au Super
event » — pas de logo Super event sur un écran Pro/SA générique.

## Phase 3 : validation page par page
Identique au prompt d'origine.

## Phase 4 : démos sans compte et archives
Identique au prompt d'origine.

## Phase 5 : mise en ligne sans régression

Identique au prompt d'origine, mappé sur le vrai workflow du dépôt
**[AJOUT]** :
- Double push obligatoire : branche `claude/admiring-cannon-66nr9y` **et**
  `main` (auto-deploy Vercel depuis `main`) — `git ls-remote origin -h
  refs/heads/main` pour confirmer l'atterrissage après chaque push.
- Avant tout commit Next.js : `npx tsc --noEmit` **et** `npm run build`
  (lire `✓ Compiled successfully` dans le log, pas seulement le code de
  sortie) ; `git checkout -- tsconfig.tsbuildinfo` s'il a changé.
- Avant tout commit touchant `admin/public/dashboard.html` : validation
  Acorn `ecmaVersion: 2020`, 0 erreur, **et** vérification que
  `admin/public/static/dashboard.html` a un MD5 identique.
- `git pull --ff-only` avant de pousser (plusieurs sessions écrivent sur
  `main`).

## Format des comptes rendus
Identique au prompt d'origine : français, court, sans jargon, verdict
d'abord puis les faits, toujours Fait et vérifié / Pas encore fait ou non
vérifié / Décisions attendues.
