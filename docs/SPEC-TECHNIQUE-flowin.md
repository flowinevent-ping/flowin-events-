# SPEC TECHNIQUE — Flowin Events

> Document de référence pour travailler avec des **agents IA de production et de maintenance**.
> Version : **v1** · MAJ : 2026-06-28 · Source de vérité opérationnelle : table Supabase `handoff_notes` clé `handoff-nds-2026-comm`.
> Déploiement de référence : **Nuits du Sud 2026** (festival Vence, 9–18 juillet, ~24 000 festivaliers).

Ce document est descriptif de l'état **réel** du système (audité en base + repo le 28/06/2026). Il ne prescrit pas de refonte. Les invariants marqués 🔒 ne doivent pas être modifiés sans instruction explicite.

---

## 0. Bootstrap obligatoire (à chaque session)

Vérifier les **deux** accès avant toute action. Si l'un manque → **STOP**, signaler, ne pas continuer en mode dégradé.

1. **Code / git** : `git clone https://github.com/flowinevent-ping/flowin-events-.git` ; `git log` ; test push (`git push --dry-run origin main`).
2. **Supabase MCP** : `execute_sql "select 1"` sur le projet `ywcqtupgoxfzkddqkztk`.

Lire ensuite `handoff_notes` (`select contenu from handoff_notes where cle='handoff-nds-2026-comm'`) + `HANDOFF-flowin-nds2026.md`.

Règle anti-perte : `/home/claude` est éphémère (remis à zéro entre sessions). **Tout asset produit (rendu + script source) est committé dans la même session.**

---

## 1. Architecture

```
GitHub (flowinevent-ping/flowin-events-, branche main)
   └─ push main ──► Vercel (auto-deploy, racine /admin)
                       └─ Next.js (App Router) : parcours joueurs (React) + pages pro/landing
   Supabase (ref ywcqtupgoxfzkddqkztk, eu-west-1, Pro)  ◄── lecture/écriture (clé anon publique + MCP côté ops)
   Dashboard Super Admin = monolithe HTML statique (admin/public/dashboard.html + miroir static/)
```

### Composants
- **Next.js `/admin`** : App Router. Parcours joueurs sous `admin/app/parcours/<module>/` (chaque module = un `page.tsx` server + un `Client.tsx`). Pages pro/landing/super-event sous `admin/app/{pro,nds,se,landing,...}`. Libs partagées dans `admin/lib/`.
- **Dashboard SA** : `admin/public/dashboard.html` — fichier monolithe (HTML + 2 blocs `<script>` vanilla JS, pas de build). Miroir obligatoire `admin/public/static/dashboard.html` (MD5 identique). Aucune authentification : l'URL directe = accès Super Admin (action owner : passer le repo en privé ; durcissement post-festival).
- **Supabase** : Postgres + RLS + PostgREST (REST anon) + fonctions PL/pgSQL. Accès ops uniquement via **MCP** (`execute_sql` / `apply_migration`) ; `bash` ne peut pas joindre `*.supabase.co`.
- **Vercel** : auto-deploy sur push `main`, racine `/admin`. Assets servis depuis `https://flowin-events.vercel.app`.

### Comptes (⚠️ 3 emails distincts — migration prévue post-festival)
| Service | Compte | Note |
|---|---|---|
| GitHub | `flowinevent-ping` | repo, token fine-grained Contents R/W (exp. ~17/09/2026) |
| Supabase | `romain.collin@gmail.com` | org nommée trompeusement « flowin revision olivia » = bien le projet NDS |
| Vercel | (compte distinct) | auto-deploy |

Procédure de rapatriement vers un email unique : `docs/rapatriement-compte-maitre.md` (à exécuter **après** le festival).

---

## 2. Flowin Events — modèle événement / station

### Table `events` (34 colonnes)
Colonnes clés : `id (text)`, `pro_id`, `nom`, `module`, `status`, `date_d/date_f`, `lieu`, `lat/lng`, `super_event_id`, `qr_token`, `categorie`, `gain_ticket (bool)`, `cfg (jsonb)`, `stats (jsonb)`, `pro_visib (jsonb)`.

- **`cfg` (jsonb)** = source de configuration d'un event : `qrUrl`, banque(s) de questions, paramètres de jeu (`quizNbQuestions`, `quizBonusList`…), thème, etc. 🔒 **Toute configuration passe par `cfg`** — on ne modifie pas les clients maîtres pour configurer un event.
- **`module`** = métadonnée. 🔒 **Le module ne sélectionne PAS le client** : c'est l'**URL** qui détermine le rendu (voir Routing).

### Modules / parcours disponibles
`spin`, `quiz`, `quizmaster`, `quizsolo`, `vote`, `tombola`, `nds2026`. Chacun = `admin/app/parcours/<module>/{page.tsx, <Module>Client.tsx}`.

### Routing (🔒 invariant)
Le `page.tsx` d'un module importe **un client fixe**. L'URL `/parcours/<module>?ev=<eventId>` détermine donc le client rendu, indépendamment du champ `events.module` :
- `/parcours/nds2026?ev=…` → `NDS2026Client` (parcours festival riche : carte stations, cumul, parrainage).
- `/parcours/quiz?ev=…` → `QuizClient` (quiz simple).
- `/parcours/spin?ev=…` → `SpinClient`, etc.

`page.tsx` appelle `fetchParcoursData(evId)` (`admin/lib/parcours.ts`) puis rend `<Client {...data} evId={evId} />`.

### QR / `qrUrl`
Le QR d'une station encode **verbatim** `events.cfg.qrUrl`. Génération QR : `box_size=20`, `ERROR_CORRECT_M`, URL réelle lue en base (`select cfg->>'qrUrl' from events where id='<station>'`). Tout QR produit est **revérifié par décodage** (cv2 / pyzbar) avant commit.

### État NDS 2026 (audité 28/06)
Toutes les stations NDS (`ev-nds-*`) sont sur le super-event `se-nds-2026`, module `nds2026`, `qrUrl = /parcours/nds2026?ev=<station>` — y compris les 6 stations **commerce** (bergerie, pegase, utile, carrosserie-gp, giordano, alafut), basculées sur le parcours NDS pour une UX identique aux stations festival. Exceptions : `ev-nds-2026` (event « compte » master, module `quiz`) et `ev-nds-demo-1` (`spin`).
Stations festival : caisse-1/2/3, caisses, bar/bar-1/bar-2, tablette/tablette-1/2/3, ecrans, digitale (canal réseaux sociaux, hors carte physique).

---

## 3. Super Events — regroupement, tickets, tirages

### Table `super_events` (18 colonnes)
`id`, `nom`, `pros[]`, `events[]`, `date_d/f`, `status`, `tirage_global (bool)`, `nb_gagnants_final`, `frais_pro`, `pct_flowin`, `qr_token`, `geofence_m`, `geo_controle`, `social (jsonb)`, `theme (jsonb)`. NDS = `se-nds-2026`.

### Table `se_tickets` — registre des tickets de tombola (7 colonnes)
`id (uuid)`, `super_event_id`, `joueur_id (uuid)`, `event_id`, `jour (date)`, `type`, `created_at`.
- **Unicité** : un ticket par `(joueur_id, event_id, jour, type)` (upsert `onConflict`). Garantit **1 ticket / station / jour**.
- `type` ∈ { ticket de jeu, `parrainage`, … }. Les tickets parrainage utilisent `event_id='prr-<filleul>'` pour autoriser N parrainages/jour avec dédup par ami.
- `se_tickets` est la **source de vérité du tirage**. (À distinguer de `lots_stock` = tickets-papier à numéro de série.)

### Tirages
Modalités : **un tirage chaque soir** (places de concert, manuel, compte NDS via `lot-nds-concert` = 12 places) **+ un grand tirage à la clôture** du festival. Le moteur tirage du dashboard désigne N gagnants par station/jour, écrit dans `gains`/`se_gains`, export PDF A4.

### Parrainage
- Capture à l'inscription via `?ref=<extId>` (`admin/lib/parrainage.ts`, `captureParrainage`), anti-auto-parrainage, 1× par paire, rattaché au commerce source.
- Crédit du ticket : trigger **`trg_parrainage_credit`** (AFTER INSERT/UPDATE sur `parrainage`, fonction SECURITY DEFINER `tg_parrainage_credit_ticket`). Quand `statut='valide'` & `destinataire_inscrit`, insère un `se_tickets` (`type='parrainage'`) pour le parrain (`joueurs.external_id = sender`).
- Validation : triggers `trg_valider_parrainage` (AFTER INSERT) et `trg_valider_parrainage_update` (AFTER UPDATE) sur `joueurs`.
- `ref` du lien de partage = `j-nd-<email>` (= `joueurs.external_id`). Les clics sont tracés dans `visites` (`source=parrainage`).

---

## 4. Règles du jeu (🔒 invariants produit)

- 🔒 **4/4 bonnes réponses = 1 ticket** (+1 ticket si la question **bonus** est réussie). Ne pas changer cette mécanique.
- 🔒 **1 participation / station / jour** (droit au ticket d'une station remis à zéro chaque jour ; le **cumul** des tickets gagnés est conservé à vie — ledger monotone, jamais remis à zéro).
- Le score cumule par action (`q.points`). La banque festival = `bq-nds-artistes` (« Nuits du Sud — Festival & artistes », 14 questions, tire `quizNbQuestions=4`).
- 🔒 **Genre** dans les formulaires : `Homme` / `Femme` (+ valeur vide) uniquement — jamais « Autre ».
- Optin RGPD : texte figé `nds-2026-v3` ; consentement enregistré (`joueurs.optin/optin_date/optin_version`).

### Lien digital « usage unique » vs QR « usage régulier » (mécanique tranchée = A)
Décision Romain (28/06) :
- **QR sur site** = station récurrente classique (`qrUrl` persistant) → jouer/gagner sur place, incite à venir en boutique.
- **Lien digital** (envoyé par mail/WhatsApp) = **jeton à usage unique, NON-station** : 1 inscription/participation max, consommé après usage, trace `source + date + heure`. Ne permet **pas** de jouer/gagner sans passer par le lieu de jeu.
- **Fondation DB construite (28/06)** : table `public.liens` `(id uuid, partenaire_id, type[unique|regulier], token unique, source, event_id, used_at, usage_count, max_usage, actif)` + primitives server-side `generer_lien(...)` et `consommer_lien(p_token, p_source)` (SECURITY DEFINER, `search_path` verrouillé, REVOKE anon/authenticated). `consommer_lien` applique la mécanique A (unique = 1 seule conso, journalise `used_at` + source, désactive après usage ; regulier = illimité). Migration versionnée : `docs/sql/kit-digital-liens.sql`. Colonne `partenaires.liens (jsonb)` conservée (dénormalisation front). **Reste à cadrer avec Romain (ne pas inventer)** : cadence de minting des liens `unique` (1 token/envoi vs lot), wiring front (où/quand appeler `consommer_lien`), hook « création pro » → génération auto du kit, modèle de grant pour exposer la conso côté front.

---

## 5. Sécurité (état au 28/06 : 0 ERROR au scan advisors)

- **RLS** actif (ex. `documents_legaux`). Vues en `security_invoker`. `search_path` verrouillé sur les fonctions.
- **Fonctions SECURITY DEFINER** : `REVOKE EXECUTE` sur `anon`/`authenticated` pour les fonctions sensibles. Anti-triche confirmé : `add_points`, `attribuer_lot_auto`, `valider_parrainage` **non appelables publiquement** (aucun grant anon/auth). Restent exposées (par design) : `crm_landing_flowin_upsert`, `search_ecoles`, `upsert_ecole`.
- **Clé anon publique** (par design) partagée dashboard + joueurs : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`. Policy `joueurs` = `flowin_anon_all_joueurs` (ALL/public) → stats live remontent. **À durcir post-festival** (lecture/écriture anon sur `joueurs`).
- **Triggers notifications/chaînage** : `trg_bon_commande_chain`, `trg_notify_bon_commande`, `trg_notify_souscription_partenaire`.
- Durcissement RLS avancé = **après** le festival (plan : `docs/sql/securite-durcissement-post-festival.md`).
- Owner : repo GitHub → **privé** ; PITR + backup on-demand avant le 9/07 (Pro souscrit, backups quotidiens ~7 j).

---

## 6. Conventions & invariants (🔒)

- 🔒 **Ne jamais modifier les modules maîtres** `SpinClient.tsx`, `QuizClient.tsx` — toute configuration passe par `cfg` en base.
- 🔒 **`dashboard.html`** : éditer via Python `str.replace()` avec assertion `count==1` (jamais `sed` multiligne). Puis : valider **Acorn `ecmaVersion:2020` (0 erreur)** sur les 2 blocs `<script>`, copier vers `admin/public/static/dashboard.html`, **vérifier MD5 identique**. Visuels du hub versionnés `?v=YYYYMMDD…` — incrémenter à chaque remplacement d'asset.
- 🔒 **Validation Next.js avant push** : `npx tsc --noEmit` (0) + `npx next build` (lire le log « Compiled successfully »), puis `git checkout -- admin/tsconfig.tsbuildinfo`.
- **Émoji** : Manrope ne rend pas les émojis → dessiner en SVG/vecteur dans les rendus.
- **Ne jamais inventer** d'URL, coordonnées, noms de partenaires, lots ou contacts non sourcés.
- **Contact comms partenaires** = `flowinevent@gmail.com` + `06 16 35 49 36`. 🔒 Le nom « Romain Collin » ne figure **jamais** sur les supports clients.
- Identité commit : `git -c user.email=romain@flowin.events -c user.name="Romain Collin"`.
- Travailler en **bloc** (refactor complet cohérent), pas en patch ponctuel. Checklist explicite avant exécution, marquée ✅/❌/🟡.

---

## 7. Procédures

### Déploiement
Push sur `main` → Vercel rebuild automatique (racine `/admin`). Aucune action manuelle Vercel. Le dashboard étant un fichier statique servi par Vercel, un push suffit ; penser au cache-bust `?v=` pour les assets remplacés.

### Rollback
- Front/dashboard : `git revert <sha>` + push (Vercel redeploie). Ne **pas** `git reset --hard origin/main` entre l'édition d'une source et son commit (détruit les sources non committées).
- DB : restauration via backups Supabase (Pro, quotidiens ~7 j ; activer PITR pour restauration à la seconde).

### Sessions concurrentes
Deux sessions écrivant sur `main` → push rejetés. Résolution : `git fetch origin && git reset --hard origin/main`, réappliquer, commit, push. (Attention : committer les sources locales **avant** le reset.)

### Points de vigilance
- `execute_sql` ne retourne que le résultat de la **dernière** requête d'un bloc multi-statements → envoyer séparément.
- Dollar-quoting `$HD$…$HD$` échoue si le contenu contient des apostrophes → doubler les apostrophes en single-quoted.
- Pipeline vidéo : frames PIL JPEG q90 en chunks ≤160 (≤150 s/bash), puis `ffmpeg -framerate 24 -crf 19 -c:v libx264 -pix_fmt yuv420p`. Charte cinématique de référence = `render_kref40.py` (fond `#0a1020` + faisceaux, ambre `#f4b544`, magenta `#e6187f`, Manrope 800). QR revérifié par décodage.

---

## 8. Missions ouvertes (suivi)

1. **Kit digital partenaire auto-généré** (mécanique tranchée = A, cf. §4) : **fondation DB faite** (table `liens` + `generer_lien`/`consommer_lien`, `docs/sql/kit-digital-liens.sql`). Reste : cadence minting `unique`, wiring front (`consommer_lien`), hook « création pro » → génération auto, assemblage assets (A4 + vidéo perso + Insta/FB + email + textes/hashtags), exposition dashboard (hub Vidéo & média). Garde-fous : contact `flowinevent@gmail.com`, ne pas inventer.
2. **Owner Romain** : repo privé ; PITR + backup avant 9/07 ; CGV juriste (`documents_legaux` `cgv-nds-2026`, passer `draft`→`validé`, aligner `CGV_VERSION` `v1-draft`→`v1`) ; Resend domaine `flowin.events` (emails gagnants) ; 4 logos partenaires manquants ; coords Alafut.
3. **Post-festival** : durcissement RLS avancé, rapatriement compte maître, migration Next.js, Skills/sous-agents.

---

*Fin SPEC-TECHNIQUE-flowin v1. Mettre à jour ce fichier ET sa page Notion miroir à chaque évolution structurelle (modèle de données, sécurité, conventions, procédures).*
*Page Notion miroir : https://app.notion.com/p/38d6dcca9add8198aed3f248a9a5fc32 (sous le hub « NDS 2026 — Comm »).*
