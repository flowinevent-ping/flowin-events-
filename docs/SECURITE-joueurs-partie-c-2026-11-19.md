# Sécurité joueurs — partie C : lecture de joueurs / participations / tirages (19/11/2026)

SQL : `sql/2026-11-19-securite-joueurs-partie-c.sql` (C1 additive, C2 après déploiement, rollback en pied).
Suite de `SECURITE-joueurs-rpc-2026-11-19.md` (parties A et B). **Rien n'est appliqué en prod** : audit en lecture seule uniquement.

## Le trou (vérifié en prod le 19/11)
- `joueurs_anon_select`, `participations_anon_select`, `tirages_anon_select` : `using (true)` pour **anon** → n'importe qui lit nom, e-mail, téléphone des joueurs et des gagnants avec la clé publishable.
- `joueurs_lecture_authentifiee`, `participations_lecture_authentifiee`, `tirages_lecture_authentifiee` : `using (true)` pour **tout compte connecté**, or la connexion joueur par lien e-mail crée des comptes Auth (`shouldCreateUser: true`).
- Les pages `/pro/*` rendues côté serveur (sans session, `?pro=`) recevaient aussi les gagnants avec e-mail / téléphone (`fetchOperationsPro`).

Identité joueur inchangée : l'id `joueurs.id` gardé dans le téléphone (comme `mes_cadeaux`, `moi_tickets_gains`), et pour un compte connecté l'e-mail Auth confirmé = `joueurs.email_lower` (comme `moi_joueur_par_session`).

## C1 — RPC (SECURITY DEFINER, anon + authenticated)
| RPC | Remplace | Renvoie / contrôles |
|---|---|---|
| `joueur_inscrire(jsonb)` | insert / upsert `joueurs` + relecture de l'id (`writeJoueur`, parcours vanilla, Brigade Verte, `lib/joueurs.ts`, `lib/landing.ts`) | `{ok, id, nouveau}`. Identité par e-mail puis `external_id`. Joueur connu : **seulement** events / last_seen / ticket (comme `joueur_marquer_partie` : l'anonyme n'a jamais pu réécrire une fiche). Nouveau : colonnes en liste blanche, longueurs bornées, e-mail validé, `optin` vrai seulement si envoyé vrai (consentement inchangé), genre `Homme`/`Femme` (ou `H`/`F` historiques) sinon vide. |
| `joueur_reconnaitre(email, event, jour)` | `lookupJoueurByEmail`, pré-contrôle de `writeJoueur` | `{id, prenom, deja_joue}` — **plus de téléphone, nom, code postal, âge, genre** d'un autre joueur |
| `joueur_doublon_event(email, tel, event)` | anti-doublon des parcours vanilla, `lib/joueurs.ts` | `'email'`, `'tel'` ou null |
| `joueur_regle_qr(joueur, event, source, digital, nds, depuis)` | `controleRegleQr` | `{bloque, digital, ticket}` (même règle : digital 1 fois / compte, physique 1 / jour / QR, NDS 1 / jour / station) |
| `prospect_btob_existe(email)` | doublon landing B2B | booléen |
| `moi_profil(joueur)` | `/moi` select `joueurs` | id, prénom, nom, e-mail, external_id du joueur lui-même |
| `mes_lots(joueur)` | `lib/mesLots.ts` | lots gagnés + reçus ; l'uuid de l'ami n'est jamais renvoyé (null / uuid nul) |
| `mes_participations(joueur)` | `lib/masters/tickets.ts` (`/jouer`) | event, ticket, date, nb tickets |
| `pro_joueurs_stats(pro)` | `lib/pro.ts` `fetchProDashboard`, `pro_mobile.html` | colonnes statistiques seules (règle CONFIDENTIALITÉ 31/10), id **pseudonymisé** (`flowin_joueur_ref`) |
| `pro_participations_lignes(events[], jour)` | `/pro/super`, `/pro/super/[event]` | parties, joueur pseudonymisé |
| `pro_participations_comptes(events[])` | comptes de `fetchOperationsPro` | nombre de parties / station |
| `pro_tirages_operation(pro)` | gagnants de `fetchOperationsPro` (rendu serveur) | **sans** nom, e-mail, tél, uuid, jeton de retrait |
| `pro_tirages_joueur(pro, joueur)` | `fetchJoueurTirages` de `/pro/crm/[id]` | lots du joueur dans le périmètre du pro, sans jeton |
| `tirages_comptes_partenaire(partenaire, se)` | `fetchEventSuperEventStats` | 2 comptes |
Fonctions d'accès : `flowin_joueur_est_moi(uuid)`, `flowin_pro_voit_joueur(uuid)` (partie sur une station du pro, station d'un super event qu'il organise, `clients_commerce`, lot de son partenaire), `flowin_joueur_ref(uuid)`.

## C2 — politiques
- `joueurs` SELECT authenticated : `est_super_admin() or flowin_pro_voit_joueur(id) or flowin_joueur_est_moi(id)`.
- `participations` SELECT authenticated : SA, `qr_est_proprietaire(event_id)`, organisateur du super event de la station, ou le joueur.
- `tirages` SELECT authenticated : SA, `qr_est_proprietaire(event_id)`, `flowin_pro_lie_partenaire(partenaire_id)`, `flowin_est_pro_super_event(super_event_id)`, le gagnant ou le destinataire du lot offert.
- SELECT anonyme retiré sur les 3 tables. **INSERT anonymes conservés** sur `joueurs` et `participations` (parcours) ; les inserts du code sont en `return=minimal` (Brigade Verte passée en `return=minimal` pour `participations`).

## Appelants avant / après (ce commit)
| Fichier | Avant | Après (repli direct si RPC absente : PGRST202 / 42883 / 404) |
|---|---|---|
| `lib/parcours.ts` `writeJoueur` | select/insert/update `joueurs`, select `participations` | `joueur_reconnaitre`, `joueur_inscrire`, `joueur_regle_qr` |
| `lib/parcours.ts` `lookupJoueurByEmail`, `claimJoueur` | select `joueurs` (tél, nom…), `participations` | `joueur_reconnaitre`, `joueur_regle_qr` |
| `public/parcours/{quizmaster,quizsolo,spin,vote}.html` (+ copies `admin/parcours/`) | select `joueurs` par e-mail / tél ; upsert + relecture | `joueur_doublon_event` ; `joueur_inscrire` |
| `public/parcours/{quiz,tombola}.html` | contrôle doublon **qui ne trouvait jamais rien** (`events=cs.{"+_evId+"}` dans une chaîne littérale) | contrôle retiré (même comportement, zéro lecture) ; inscription `joueur_inscrire` |
| `public/parcours/standup.html` | upsert + relecture | `joueur_inscrire` |
| `public/parcours_user.html` | upsert avec `id` texte (refusé : colonne uuid) + participation au même id texte | `joueur_inscrire` puis participation à l'uuid réel |
| `public/nds-brigade-verte-MASTER.js`, `nds-brigade-verte-manuel.html` | insert `joueurs`/`participations` `return=representation` | `joueur_inscrire` ; participation `return=minimal` |
| `public/static/pro_mobile.html` | `joueurs?select=*` anonyme | `pro_joueurs_stats` (le fil « derniers joueurs » n'affiche plus de nom) |
| `lib/joueurs.ts`, `lib/landing.ts` (non importés aujourd'hui) | select / upsert `joueurs` | `joueur_doublon_event`, `prospect_btob_existe`, `joueur_inscrire` |
| `lib/mesLots.ts`, `lib/masters/tickets.ts`, `app/moi/page.tsx` | select `tirages`, `participations`, `joueurs` | `mes_lots`, `mes_participations`, `moi_profil` |
| `lib/pro.ts`, `app/pro/super/page.tsx`, `app/pro/super/[event]/page.tsx` | select `joueurs`, `participations` (serveur, anon) | `pro_joueurs_stats`, `pro_participations_lignes` |
| `lib/operations.ts` `fetchOperationsPro` | select `tirages` (avec contacts), comptes `participations` | serveur : `pro_tirages_operation`, `pro_participations_comptes` ; navigateur : lecture directe avec la session pro |
| `GagnantsClient`, `FicheOperationPro`, `HistoriqueClient` | données du rendu serveur | rechargement une fois au montage avec la session pro (contacts des gagnants) |
| `lib/dashboard.ts` `fetchEventSuperEventStats`, `/pro/crm/[id]` | select `tirages` | `tirages_comptes_partenaire`, `fetchJoueurTiragesPro` → `pro_tirages_joueur` |

Inchangés, couverts par C2 (jeton SA ou session pro) : `dashboard.html` / `static/dashboard.html` (non modifiés), `tirage-nds.html` (jeton SA obligatoire, redirige sinon), `app/dashboard/*`, `components/dashboard/*`, `lib/crmLanding.ts` (SA), `DataOperation`, `DiffusionOperation`, `CompteurMensuel`, `ScannerBillet`, `lib/qrTraces.ts` (session pro).
`NDS2026Client.tsx` (non modifié) : ne lit pas ces tables en direct ; il passe par `lookupJoueurByEmail` / `writeJoueur` / `claimJoueur`. Effet : la reconnaissance par e-mail ne pré-remplit plus que le prénom (nom, tél, CP, âge, sexe restent ceux saisis).
`admin/landing/index.html`, `admin/pro_mobile.html`, `admin/parcours_user.html` (racine, non servis par Vercel) : non modifiés.

## Effets connus / résiduels
- La reconnaissance par e-mail renvoie toujours l'**id** du joueur (nécessaire à `claimJoueur`) : connaître un e-mail donne l'id, donc les RPC « moi » (tickets, gains, lots). Modèle existant (id = jeton du téléphone), non aggravé ; le durcir demande une preuve (lien e-mail) avant de rendre l'id.
- Pages `/pro/*` serveur protégées par le seul `?pro=` : elles reçoivent désormais des statistiques sans coordonnées ; `crm_pro` / `fetchCrmPro` (hors périmètre) restent à revoir.
- Un pro non connecté ouvrant `/pro/...?pro=` : après C2, le rechargement client renvoie une liste de gagnants vide.
- INSERT anonyme sur `joueurs` (spam possible) conservé : nécessaire aux parcours.

## Tests (19/11)
- PostgreSQL 16 local, schéma stub (tables, index uniques, colonne générée `email_lower` / `played_date`, politiques prod du 19/11, fonctions d'accès, `auth.users`) : **C1 + C2 appliqués deux fois sans erreur**.
  - anon après C2 : SELECT des 3 tables → `0 | 0 | 0` ; INSERT `participations` / `joueurs` en `return=minimal` → OK.
  - `joueur_inscrire` : nouveau → `nouveau:true` ; connu (prénom « HACK ») → même id, fiche non réécrite ; e-mail invalide → `email` ; genre « Autre » → vide ; Brigade sans e-mail → ok.
  - `joueur_reconnaitre` → `{id, prenom, deja_joue}` uniquement ; `joueur_doublon_event` → `email` / `tel` / null ; `joueur_regle_qr` digital → bloqué + ticket, physique autre QR → libre, NDS → bloqué.
  - `mes_lots` : lot offert → l'ami voit le lot avec `joueur_id` null, le donneur voit l'uuid nul ; `pro_tirages_operation` → e-mail / jeton / uuid null ; `pro_tirages_joueur` hors périmètre → 0.
  - authenticated : compte joueur sans fiche → `0 | 0 | 0` ; joueuse connectée → sa fiche, ses parties, son lot ; pro A → ses joueurs / parties / lots ; pro B organisateur du super event → stations du super event ; SA → tout.
- `npx tsc --noEmit` : 0 erreur. `npm run build` (copie scratchpad) : `✓ Compiled successfully`. `tsconfig.tsbuildinfo` inchangé.
- Acorn `ecmaVersion: 2020` : 0 erreur sur les 7 parcours (×2 copies), `parcours_user.html`, `nds-brigade-verte-manuel.html`, `nds-brigade-verte-MASTER.js`, `static/pro_mobile.html`.
- Playwright (Chromium, `next start` de la copie lancé depuis `/home/user`, 390 px, non-GET vers supabase.co bloqués et comptés, clic automatique sur les boutons visibles — le mode démo remplit les champs) : 7 parcours vanilla (`quiz`, `quizmaster`, `quizsolo`, `spin`, `standup`, `tombola`, `vote`), `parcours_user.html`, `/parcours/quiz`, `/parcours/spin` (roue), `/parcours/quizsolo`, `/parcours/vote`, `/parcours/nds2026`, `/jouer`, `/moi` (mes lots, offrir à un ami), `/se/se-nds-2026`, `/rejoindre/se-nds-2026?ref=…` (parrainage), `/pro`, `/pro/super`, `/pro/super/<station>`, `/pro/operation`, `/pro/historique`, `/pro/donnees`, `/pro/compte`, `/static/pro_mobile.html`, `/dashboard`, `/dashboard.html`, `/static/dashboard.html`, tous `?demo=1` : **HTTP 200, 0 non-GET, 0 erreur JS**.
  Pages sans `flowin-demo.js` (mode démo inactif, inchangé) : `nds-brigade-verte-*.html` → 1 POST `rpc/get_sondage_questions` déjà présent avant ce commit ; `tirage-nds.html` (non modifié, jeton SA factice) → POST `rpc/tirage_soir` déclenchés par le clic automatique sur « Tirer ». 0 erreur JS.
- Repli vérifié en prod (lecture) : `GET /rest/v1/rpc/joueur_reconnaitre` → `PGRST202` (RPC absente), code reconnu par `rpcAbsente` et par les parcours vanilla.

## Ordre d'application
1. Déployer ce commit (Vercel, auto depuis `main`) — fonctionne avant C1 grâce au repli.
2. Appliquer **C1** (du début jusqu'à `PARTIE C2 ═`), éditeur SQL Supabase.
3. Checklist « avant C2 ».
4. Appliquer **C2** (entre `-- PARTIE C2 DÉBUT` et `-- PARTIE C2 FIN`).
5. Checklist « après C2 ». En cas de souci : rollback C2 en pied de fichier (retour exact à l'état du 19/11).

## Checklist prod
Avant C2 : `select count(*) from pg_proc where proname in ('joueur_inscrire','joueur_reconnaitre','joueur_doublon_event','joueur_regle_qr','prospect_btob_existe','moi_profil','mes_lots','mes_participations','pro_joueurs_stats','pro_participations_lignes','pro_participations_comptes','pro_tirages_operation','pro_tirages_joueur','tirages_comptes_partenaire','flowin_joueur_est_moi','flowin_pro_voit_joueur','flowin_joueur_ref')` → 17 ; jouer une partie (quiz Next + un parcours vanilla) → onglet réseau : `rpc/joueur_inscrire` 200, `rpc/joueur_regle_qr` 200, aucune requête `GET /rest/v1/joueurs` ; `/moi` → `rpc/moi_profil`, `rpc/mes_lots` 200 ; `/pro/super?pro=…` affiche joueurs / sexe / âges.
Après C2 : en anon `GET /rest/v1/joueurs?select=email&limit=1` → `[]`, idem `tirages?select=joueur_email` et `participations` ; partie complète + rejouer le même jour → « déjà joué » ; e-mail connu reconnu ; `/moi` lots + offrir à un ami ; pro connecté : gagnants avec contacts, CRM, données ; SA : `dashboard.html` joueurs / passages, `tirage-nds.html` liste des tirages.
