# FLOWIN EVENTS — Reprise mission, 31/08/2026 soir

Ce fichier est le point d'entrée obligatoire pour toute nouvelle conversation
qui reprend ce travail. Lire dans l'ordre, ne rien sauter.

## 0. Test d'accès — À FAIRE EN PREMIER, AVANT TOUTE LECTURE

1. `git clone https://github.com/flowinevent-ping/flowin-events-.git`
2. Demander à Romain le **PAT GitHub courant** (jamais stocké nulle part —
   ni ici, ni dans le repo, ni dans les échanges). Générer un nouveau si besoin :
   `https://github.com/settings/tokens/new` — scope `public_repo` suffit
   (le repo est public), expiration 7 jours.
3. Commit test + push réel (pas juste un clone — le repo est public, le clone
   réussit toujours et ne prouve rien) :
   `git remote set-url origin https://x-access-token:<TOKEN>@github.com/flowinevent-ping/flowin-events-.git`
4. Supabase MCP : `execute_sql("select 1")` sur le projet `ywcqtupgoxfzkddqkztk`
   (compte Google `romain.collin@gmail.com`, org affichée « flowin revision
   olivia » — nom trompeur, c'est le bon projet).
5. Si push OU Supabase MCP échoue : **STOP immédiat**, le dire en une phrase,
   ne jamais continuer en mode dégradé. Cause connue possible : conversation
   dont le repo n'était pas attaché aux sources à sa création (résolu en
   ouvrant une conversation où le repo est explicitement attaché dès le
   départ, pas résolu en insistant avec un token dans la même conversation).

## 1. Lecture obligatoire, dans cet ordre

1. Ce fichier en entier.
2. Supabase, table `handoff_notes`, clé `handoff-nds-2026-comm` (contexte
   métier NDS 2026 : chiffres définitifs, contacts, patterns).
3. Supabase, table `handoff_notes`, clé `handoff-reorga-dashboard-2026-08`
   (tout l'historique technique de la réorganisation dashboard, très long,
   lire au moins les 2-3 dernières entrées en tête).
4. Notion, hub `38c6dcca-9add-81dd-9af2-c93139e06393` (même contenu que le
   handoff Supabase, format lisible).
5. `docs/patterns-bugs-connus.md` (11 patterns documentés, A à K — lire
   avant de reconstruire quoi que ce soit, beaucoup de pièges déjà tombés
   dedans une fois).
6. `admin/lib/roadmap.ts` (page `/dashboard/roadmap` en prod) — la feuille
   de route réelle, avec état par item (ok/hold/todo).

## 2. Discipline non négociable

- **3 piliers à chaque étape** : commit+push GitHub, `handoff_notes`
  Supabase (prepend, jamais écraser), Notion hub (insert_content en tête).
  Aucune étape sans les 3.
- **Vérifier avant de déclarer fait** : `tsc --noEmit` 0 erreur + `next build`
  OK avant tout push. Pour les RPC Supabase, tester par un appel réel
  (grant temporaire à `supabase_read_only_user`, tester, revoke immédiat) --
  jamais juste relire le SQL et supposer que ça marche.
- **Ce projet n'a PAS de session Supabase Auth réelle** — tout tourne sur la
  clé anon. Ne JAMAIS restreindre une RPC lue par le dashboard à
  `authenticated` (régression vécue le 31/08, cf. Pattern dans le handoff --
  ça casse la prod silencieusement, `authenticated` n'est jamais atteint).
- **Distinguer "vérifié dans le code/données" de "vérifié à l'écran"** —
  Claude n'a pas d'accès navigateur, ne peut pas voir le rendu réel. Dire
  explicitement lequel des deux a été fait, ne jamais laisser "corrigé"
  sous-entendre plus que ce qui a été vérifié. Le mécanisme qui marche le
  mieux pour combler ce trou : Romain envoie une capture dès que quelque
  chose semble faux -- ça a mené à un vrai fix à chaque fois. Le garder.
- **Ne jamais reconstruire ce qui existe déjà** (Pattern G) -- chercher dans
  les 3 couches (monolithe legacy `dashboard.html`, dashboard Next.js,
  `admin/public/*.html` standalone) avant de coder quoi que ce soit.

## 3. État complet au 31/08/2026 soir

Session très longue (28/08 au 31/08), des dizaines de commits. Résumé par
thème plutôt que liste chronologique complète (voir `git log` pour le détail) :

**Contenu du jeu** : écrans de config pour quiz/quizmaster/quizsolo/vote
dans EventDrawer (banques, nb questions, chrono, éléments à voter).

**Sidebar** : réduite de 44 entrées / 10 groupes à 46 entrées / 6 groupes
(ACCUEIL / SUPER EVENT / EVENTS / COMM & OUTILS / CRM / SYSTÈME). Events
fusionné en 1 seule page (kanban + Parcours mobil + bouton Nouvel event).

**Bugs de fond corrigés** (tous vérifiés par données réelles, pas supposés) :
- `v_se_dashboard` lisait `se_gains` (table abandonnée le 28/07) au lieu de
  `tirages` -- gains affichés à 0.
- `tirage_lot()` ne vérifiait jamais la quantité configurée du lot --
  155 tirages fantômes en base (jamais confirmés), nettoyés après
  vérification par rafales horaires (3 sessions de test distinctes,
  cf. Pattern K).
- Bornage de date manquant sur `super_event_rapport_points()` et
  `super_event_bonus_resultats()` -- 19 répondants de test comptés en trop.
- `super_event_jours()` ne lisait que les participations, jamais les
  flashs -- des jours entiers avec activité étaient invisibles (21 → 55
  jours réels).
- Régression que Claude a lui-même introduite puis corrigée : grants RPC
  restreints à `authenticated` au lieu de `PUBLIC` (cf. section 2 ci-dessus).

**Restaurations** (régressions du monolithe legacy jamais portées) :
- Donuts RGPD/engagement sur `/dashboard/nds-resultat` (opt-in, rejeu,
  bonus, couverture landing).
- Preview navigable des landing pages (cadre téléphone, 12 pages réelles
  dont 9 statiques jamais suivies en table `landings`).

**Nouveautés** :
- `/dashboard/envoi-masse` : liste destinataires + composeur + liens Gmail
  par lots de 40 en BCC (PAS de dépendance Resend -- corrigé après retour
  direct de Romain : "utilise ce qui existe, ne refabrique pas").
- Fiche organisateur visible sur les cartes Super Event (le pro
  `pro-nds-2026`, "Nuits du Sud — Ville de Vence", existait déjà en base).
- Icônes SVG du wizard SA alignées sur le wizard pro autonome.

**Harmonisation visuelle des 8 outils HTML autonomes** :
- Bandeau Flowin cohérent (logo + lien retour dashboard) ajouté aux 8.
- Thème clair appliqué à 2 d'entre eux (`bons-commande-liste.html`,
  `kit-digital/index.html`) -- entièrement pilotés par variables CSS,
  palette alignée sur `sa-*` (mêmes valeurs hex).
- **Reste sombre, non converti** : `nds-visuels.html` -- couleurs codées en
  dur partout (pas de variables CSS), conversion plus risquée qu'un geste
  rapide, à faire en passe dédiée.
- **Pas vérifiées** (mêmes outils, pas encore auditées pour le thème) :
  `facture-nds.html`, `plaquette-nds.html`, `pitch-nds.html`,
  `flowin-partenaire-presentation.html`, `tirage-nds.html` (confirmé déjà
  clair, `--bg:#f4f6fb`).

## 4. Audit du menu — 31/08 soir, à corriger dans LA PROCHAINE conversation

Romain (captures d'écran du menu complet) : "il manque de rangement, on ne
voit pas bien Events et Super Event, agrandis les [en-têtes de groupe] en
couleur, il y a des sous-onglets à créer, des onglets qui font doublon."

**Vérifié avant de conclure** (pas supposé) :

### 4.1 Hiérarchie visuelle des groupes — vrai problème confirmé
`.sa-sb-group` (CSS, `globals.css:18`) : `font-size:10px`, couleur grise
terne (`--sa-sb-text-dim`), aucune icône, aucune couleur distinctive entre
groupes. Les 6 groupes (ACCUEIL/SUPER EVENT/EVENTS/COMM & OUTILS/CRM/
SYSTÈME) sont visuellement quasi identiques entre eux. **À corriger** :
agrandir la taille de police, donner une couleur/icône distincte par
groupe (ex. Super Event en violet, Events en vert, etc.), envisager un
séparateur visuel plus marqué entre groupes.

### 4.2 "Doublons" — vérifié : AUCUN doublon fonctionnel réel, mais confusion
de nommage sur 3 paires (pages différentes, noms trop proches) :
- **Bons de commande** (`/dashboard/nds-bon-commande`, outil de création)
  vs **Bons de commande & Factures (liste)** (`/bons-commande-liste.html`,
  vue liste CRM). Rôles différents, noms à différencier plus clairement
  (ex. "Créer un bon de commande" vs "Bons & factures — liste").
- **Prospection** (`/dashboard/prospection`, outil terrain) vs
  **Prospects B2B** (`/dashboard/btob-prospects`, suivi CRM). Même
  remarque.
- **Landing pages** (`/dashboard/landing-page`, gestion/preview des pages)
  vs **CRM Landing pages** (`/dashboard/crm-landing`, contacts capturés
  via ces pages). Même remarque.

Proposition à valider avec Romain avant d'exécuter : renommer pour clarifier
l'intention (outil de création/gestion vs vue de suivi CRM), pas fusionner
(les deux existent pour de bonnes raisons distinctes).

### 4.3 Sous-onglets par event/super event — à construire
Romain veut des sous-rubriques permettant de gérer/filtrer par event et par
super event à l'intérieur des sections existantes (pas juste une liste
plate). Rejoint le chantier "CRM clic → fiche complète" déjà partiellement
fait (organisateur visible sur la carte Super Event, lien vers
`/dashboard/operations/[id]`) mais pas généralisé aux autres pages.

**Ne pas exécuter ces 3 points dans cette conversation-ci — Romain a
explicitement demandé l'audit maintenant, l'exécution dans la conversation
suivante.**

## 5. Déploiement

Vercel : auto-deploy sur push `main`, racine `/admin`, domaine
`flowin-events.vercel.app`. Le push suffit, ne jamais toucher à Vercel
directement.

## 6. Ce qui n'a jamais été construit (roadmap priorité basse, section
"Dashboard SA — chantiers identifiés")

Voir `admin/lib/roadmap.ts` pour le détail à jour. Au 31/08 soir, tout ce
qui y était marqué a été fait sauf : harmonisation complète des 8 outils
HTML (2/8 faits), sous-onglets par event/super event (section 4.3
ci-dessus).
