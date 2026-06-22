# HANDOFF — Flowin / Nuits du Sud 2026

> Document de reprise. Dernière mise à jour : **23/06/2026** (session présentation/visuels/bon de commande). HEAD au moment du handoff : `b8dfcc6` (toujours revérifier via `git log` — ne pas supposer).
> Objectif : reprendre le projet dans une nouvelle session SANS dégradation ni perte des tâches accomplies.

## 0. SESSION 23/06/2026 — ÉTAT LE PLUS RÉCENT (à lire EN PREMIER)

> Prod toujours gelée (festival 9–18 juil). Tout passe par : édition fichier → Acorn/MD5 (dashboard) ou screenshot Chromium (pages) → commit auteur Romain → push `main` → Vercel auto-deploy. DB via Supabase MCP uniquement.

### 0.1 Ce qui a été fait cette session (tout poussé sur `main`)
- **Bon de commande** (`admin/public/bon-commande-nds.html`) : émetteur affiché **OPConsult** (BAITA en mention légale). Champ **Date éditable** (défaut = aujourd'hui) qui se reporte en direct dans l'en-tête « N° / Date » (fini le `__/__/2026`) ; la date saisie sert de `date_signature`. Champ « envoyer le bon signé à cette adresse ». Sur un bon signé (`?id=`) : boutons « Copier le lien » + « Envoyer par email au client » (mailto), pour transmettre **sans Resend**.
- **Version A4 papier** : `admin/public/bon-commande-nds-a4.html` (impression, à remplir main).
- **Présentation partenaire** (`admin/public/nds-partenaire-presentation.html`) — page commerciale clé qui répond à « **on achète quoi ?** » :
  - Section **« Concrètement, vous achetez quoi ? »** montrant les **VRAIS visuels** reçus : forex 70×70 (boutique) + carré/story (réseaux), images servies depuis `/nds/visuels/`.
  - Lot **Pass Nuits du Sud 2027** ajouté (en plus de places + bons d'achat).
  - **Carte slide-1 refaite** en plan clair OSM (cohérente avec la mini-carte placemap) : 3 stations **Les Caisses / Le Bar / L'Écran** en marqueurs ronds **mis en valeur**, commerce ambre en héros, joueur bleu.
  - **Écrans jeux = 2 stations** (1·2). Total « 12 stations » retiré (devenait faux). **⚠️ RESTE : vrai décompte par poste** (Caisses/Bars/Brigade) à confirmer par Romain pour réafficher un total exact.
- **Visuels** (`admin/public/nds/visuels/`, sources éditables dans `visuels-src/`) : forex/carré/story regénérés avec « Flashe. Joue. Gagne. », lots (places + Pass 2027 + bons d'achat dans ce commerce), QR réel.
  - **Forex** = version finale **AVEC 6 logos partenaires** (bloc « Nos partenaires », 2×3 « Votre logo ici ») — c'est l'état voulu par Romain (cf. journal §0.3).
  - **Anti-cache images** : les PNG sont versionnés `?v=YYYYMMDDx`. **Version courante = `?v=20260623c`** (dans `nds-visuels.html` + `nds-partenaire-presentation.html`). **À CHAQUE remplacement d'un PNG, INCRÉMENTER la lettre** sinon Romain revoit l'ancien (cause n°1 des « rien n'a changé »). Règle Vercel `Cache-Control:no-cache` sur `/nds/visuels/(.*)` déjà en place.
- **Dashboard** : les 2 landings NDS injectées affichent une icône **🎡** (avant : « ? ») ; la carte landing lit `ld.emoji` en priorité.

### 0.2 Visuels & pages — chemins exacts (aucun lien cassé)
- Présentation : `flowin-events.vercel.app/nds-partenaire-presentation.html`
- Offres / devenir partenaire : `/nds-partenaire.html` (rewrite `/nds`→jeu festivalier ; `/nds-partenaire`→offres)
- Bon de commande digital : `/bon-commande-nds.html` · A4 : `/bon-commande-nds-a4.html`
- Hub visuels : `/nds-visuels.html` · fichiers : `/nds/visuels/{carre_1080x1080,story_1080x1920,forex_700x700}.png` + `forex_700x700_print.pdf`
- CGV : `/cgv-nds.html`

### 0.3 JOURNAL DES CONFUSIONS (à garder — ne pas re-déclencher la boucle)
Trois points ont tourné en rond et fait perdre du temps. État figé ici pour ne pas recommencer :

1. **« Insérer la landing dans le dashboard ».** Les 2 landings NDS **SONT** déjà injectées dans le dashboard (Landing Pages → colonne **Actives** : « Présentation partenaire » + « Jeu festivalier ») — visible sur les captures de Romain. Injection idempotente dans `migrateData()` de `dashboard.html` (objets `lp-nds-presentation` / `lp-nds-entry`). Donc **l'insertion est faite**. Le « ? » d'icône (corrigé → 🎡) faisait croire à un bug. **Ambiguïté NON tranchée** : si Romain veut **ÉDITER le contenu** de la présentation DEPUIS le dashboard, ce n'est PAS possible en l'état — ces pages sont **codées à la main**, l'éditeur de landing ne sait modifier que les landings construites dans l'éditeur. → **NE PAS re-deviner. Demander à Romain le comportement exact attendu** (carte présente ? éditer le HTML depuis le dash ? autre ?) AVANT de toucher.
2. **Logos sur le forex.** Aller-retour : « enlève les logos » puis « il faut les logos ». **État final voulu = AVEC 6 logos partenaires** (bloc « Nos partenaires »). C'est la version en ligne. Ne pas re-supprimer sans instruction explicite.
3. **Carte de présentation.** Itérée plusieurs fois. État voulu = **plan clair cohérent avec stations mises en valeur** (fait). Si nouvelle demande « plus proche du réel » : demander une **capture de la carte réelle de l'app** à reproduire, ne pas redeviner.

### 0.4 BLOQUEUR EMAIL (Resend) — action Romain
Bon signé → trigger `trg_notify_bon_commande` → edge function `notify-bon-commande` (Resend). **Resend n'a AUCUN domaine vérifié** → l'expéditeur test `onboarding@resend.dev` ne peut livrer QU'À `flowinevent@gmail.com` (propriétaire du compte). Tout envoi vers un client/autre adresse = **403 bloqué**. **Action Romain** : vérifier un domaine (`flowin.events` ou `opconsult.co`) sur resend.com/domains (~10 min DNS), PUIS Claude met à jour `NOTIFY_FROM` dans l'edge function → envoi auto possible. **En attendant** : utiliser les boutons « Copier le lien » / « Envoyer au client » sur le bon signé (transmission manuelle).

### 0.5 COMPTES — rapatriement sur un compte maître (action Romain, À FROID APRÈS LE FESTIVAL)
Aujourd'hui le projet est éclaté sur **3 comptes/emails différents** → fragile :
- **GitHub** : org `flowinevent-ping` (repo `flowin-events-`).
- **Supabase** : projet `ywcqtupgoxfzkddqkztk` sous le compte **Google `romain.collin@gmail.com`**, org affichée « romain.collin@gmail.com's Org », **nom trompeur du projet = « flowin revision olivia »** (c'est BIEN le projet NDS : prospection + events ev-nds + migrations sécu). Pièges connus : le compte `flowinevent` ne contient qu'un projet Supabase **VIDE** (`atddutvzklcgiqxlpvla`) ; `3opconsult` → projet Nexto (`wmiawwaxwlvascyflpba`).
- **Vercel** : auto-deploy `main`, prod `flowin-events.vercel.app`.
→ **À faire par Romain, à froid après le 9 juillet** : choisir UN email maître et y rapatrier GitHub + Supabase + Vercel. **Procédure détaillée prête : `docs/rapatriement-compte-maitre.md`** (rapatriement prévu ~24/06 au soir selon arbitrage du risque). **NE PAS migrer pendant le festival** (risque de casser le jeu pour 24 000 joueurs). Free-tier Supabase = **pause auto après 7 j d'inactivité** → vérifier l'activité / passer Pro avant le festival.

### 0.6 CONTINUITÉ AUTO-PUSH d'une conversation à l'autre (vérifié 23/06)
Romain veut pouvoir, dans **toute nouvelle conversation**, demander une modif et qu'elle soit **commitée + pushée automatiquement** sans qu'il intervienne. Conditions réunies :
- Le **token GitHub** (fine-grained, Contents R/W, exp ~17/09/2026) est conservé dans la **mémoire du projet Claude** (PAS dans le repo : public + push protection). Donc une nouvelle conversation **du même projet** l'a déjà.
- Auth push vérifiée le 23/06 (`git ls-remote` authentifié OK, API GitHub 200, HEAD `b21bb52`).

**BOOTSTRAP À LANCER EN PREMIER dans chaque nouvelle conversation** (conteneur neuf à chaque fois → re-cloner) :
```
TOKEN=<token en mémoire projet>
git clone https://x-access-token:$TOKEN@github.com/flowinevent-ping/flowin-events-.git
cd flowin-events- && git log --oneline -3        # noter le HEAD réel
# … modifs …
git -c user.email=romain@flowin.events -c user.name="Romain Collin" commit -m "..."
git push origin main                              # remote déjà authentifié via l'URL de clone
```
Puis Vérif DB : Supabase MCP `execute_sql` → `select 1` sur `ywcqtupgoxfzkddqkztk`.
- Push rejeté (non-fast-forward) : `git fetch origin && git reset --hard origin/main`, réappliquer, repush.
- Clone/push **401** = token périmé → demander le courant à Romain UNE fois, MAJ mémoire + ce bloc.
→ Tant que le token est en mémoire projet, **l'auto-push continue tout seul** entre conversations. Si un jour le rapatriement (§0.5) change le repo/owner, mettre à jour ce bloc + la mémoire.

## 1. Projet
- Flowin = SaaS de gamification événementielle (marque OPConsult / société BAITA EURL, Vence 06140), opérateur unique : Romain Collin.
- Déploiement actif : **Nuits du Sud 2026** (festival 9–18 juillet 2026, Place du Grand Jardin, Vence).
- Coordonnées commerciales OFFICIELLES (ne jamais inventer/substituer) : info@opconsult.co · 06 16 35 49 36.

## 2. Stack & accès
- Repo GitHub : `flowinevent-ping/flowin-events-` (**public**) → Vercel auto-deploy depuis `main`, root `/admin`.
- Dashboard SA : monolithe vanilla JS `admin/public/dashboard.html` (~12 5xx lignes) + **miroir MD5-identique** `admin/public/static/dashboard.html`.
- Front joueur + pro : Next.js 14 App Router sous `admin/`.
- Supabase : project_id `ywcqtupgoxfzkddqkztk` (eu-west-1).
- Clé anon **publique par design** : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`.
- Remote push : `https://x-access-token:<TOKEN_GITHUB>@github.com/flowinevent-ping/flowin-events-.git`
  - **<TOKEN_GITHUB>** = token fine-grained (Contents R/W, expire ~17 sep 2026). **JAMAIS en clair dans le repo** (public + GitHub Push Protection). Conservé dans la mémoire du projet Claude et chez Romain. Si push 401 → token périmé, demander le courant à Romain.
- Commits : auteur `Romain Collin <romain@flowin.events>`.

## 3. Bootstrap obligatoire à chaque session
1. `git clone` + `git log` + push fonctionnel (vérifier `git ls-remote`).
2. `execute_sql` trivial (`select 1`) via Supabase MCP.
→ Si l'un des deux manque : STOP, signaler, ne pas continuer en mode dégradé.

## 4. État au 22/06/2026 — TÂCHES ACCOMPLIES (ne pas refaire)
### Sécurité (appliqué en prod, sans risque)
- Vues `SECURITY DEFINER` → `security_invoker` (v_parrainage_commerce, v_nds_commerces_carte, v_bons_achat_nds).
- RLS activée sur `documents_legaux`.
- `search_path` verrouillé sur toutes les fonctions `public`.
- Anti-triche : `EXECUTE` révoqué (anon/authenticated) sur toutes les fonctions `SECURITY DEFINER` SAUF `crm_landing_flowin_upsert`, `search_ecoles`, `upsert_ecole`.
- Résultat scan : **0 ERROR** (était 4).
- Migrations appliquées : `harden_security_safe_step1`, `harden_revoke_secdef_functions`, `bons_commande_add_cgv_tracking`.

### CGV (complet — validé)
- En base : `documents_legaux` id=`cgv-nds-2026`, **statut `valide`, version `v1`** (longueur ~5872 car.). Le brouillon a été remplacé par le texte validé.
- **Greffe RCS confirmé (22/06)** : la mention « RCS de **Grasse**, SIREN 512 026 907 (SIRET 512 026 907 00018), TVA FR82512026907 » est **correcte**. BAITA SARL (nom commercial OP CONSULT), 40 rue des Arcs 06140 Vence, gérant Romain Collin, capital 5000 € ; Vence relève de l'arrondissement/Tribunal de commerce de Grasse (annonce de constitution parue dans *Le Cannois*, ressort de Grasse). Vérifié via societe.com / annuaire officiel.
- Colonnes ajoutées à `bons_commande` : `cgv_version`, `cgv_acceptee_at`.
- Page publique : `admin/public/cgv-nds.html` (charge les CGV depuis la base).
- Bon de commande `admin/public/bon-commande-nds.html` : case « j'accepte les CGV » + lien, **bloquante** avant signature ; enregistre version + date.
- Dashboard : section **SYSTÈME → CGV / Légal** (renderCgv/loadCgv/cgvSave) — édition contenu + version + statut, écriture directe en base.

### Mécanique de jeu (vérifiée, conforme, NE PAS changer)
- NDS2026Client.tsx : **4/4 = 1 ticket** + 1 ticket si question bonus faite ; max 2/station/jour ; cumul par station/jour pour le tirage manuel. Décision Romain confirmée.

### Prospection (table public.prospection)
- Nettoyée : doublons supprimés ; **28 fiches fictives** (seed « Type+Ville », ids ~1459–1487) marquées note=`SEED a verifier/remplacer...`.
- ~178 fiches sans tél : dont **129 réelles** (adresse présente) à compléter, + 28 seed.
- Compléter tél/email = via bouton **Scraping Maps** (collages Romain) → upsert qui complète les tél vides.
- Règles : jamais inventer ; champ non sourcé = NULL ; CP 06xxx ; etat défaut `a_contacter` ; id GENERATED ALWAYS (ne pas fournir).

### Doc préparée
- `docs/sql/securite-durcissement-post-festival.md` : plan complet de durcissement (à dérouler APRÈS le 9 juillet).

## 5. RESTE À FAIRE
### Dépend de Romain
- **CGV** : ✅ validée en base (statut `valide`, v1) — greffe RCS Grasse confirmé le 22/06. Plus d'action requise sauf modif de fond ultérieure.
- **Prospection** : Scraping Maps ville par ville → coller les sorties pour compléter tél/email.
- **Repo GitHub → privé** (Settings GitHub) : retire l'exposition publique du code + clé anon. PRIORITAIRE.
- **Supabase Auth** : activer « Leaked Password Protection » (2 clics console).

### Sécurité — accès dashboard (à décider)
- Le dashboard n'a **aucun login** : accessible par URL directe, s'ouvre en Super Admin. Aucun lien depuis le jeu/pro n'y mène, mais l'URL est devinable.
- Mesure rapide possible : mot de passe d'accès client-side (bloque les curieux, pas une sécurité absolue car clé anon dans le source).
- Vraie protection = séparer l'accès admin de la clé anon (étape 1 du plan post-festival).

### Post-festival (NE PAS toucher avant le 9 juillet — gel)
- Durcissement RLS avancé : séparer admin/joueurs (le dashboard fait INSERT/UPDATE/DELETE en anon → verrou), puis restreindre anon. Voir `docs/sql/securite-durcissement-post-festival.md`.
- Test de charge (connexions massives) : non fait.
- Skills / sous-agents Claude Code : après le 9 juillet.

## 5bis. Chantiers UI commande/partenaire (session 22/06 — EN GRANDE PARTIE FAITS le 23/06, voir §0)
> ⚠️ Plusieurs de ces points (bon de commande digital + A4, carte présentation, visuels) ont été RÉALISÉS le 23/06. **§0 fait foi.** Garder ci-dessous pour historique.
> Constats faits par lecture directe du code au HEAD `4d67750`. Prod gelée (festival) → chaque modif = BLOC validé (Acorn + miroir MD5 + screenshot Chromium) avant push.

1. **Fiche partenaire détail (logo / infos / docs) — accès.** Dans `dashboard.html`, `drawerPartner()` (≈ l.6218) ouvre via `openDrawerFor('partenaire',id)` avec onglets **Infos · Stats · Lots · Events · Contrat** — **pas d'onglet Documents**. Le mode édition gère logo (upload + URL + emoji fallback). À cadrer avec Romain : surface visée (drawer SA, page Pro commerçant `nds-pro.html`/`pro-nds-live.html`, ou page partenaire publique) + symptôme exact d'« inaccessible » (drawer ne s'ouvre pas ? vue lecture seule vide ? section docs absente ?). NB : `pro-nds-live.html` ne contient pas de loader de fiche docs (les `document.` repérés = DOM, pas des documents partenaire).
2. **Carte de présentation à la charte.** Mini-carte refaite au dernier commit (`4d67750`, plan de ville + place du Grand Jardin) dans la présentation partenaire. Tokens charte dispo en `:root` (--ink #1B3A5C, --blue #3B5CC4, --teal #00B4A0, --orange #E85D04, --amber, --violet ; thème sombre --d1/--d2/--d3/--dk). À cadrer : quelle charte cible (sombre nds2026 vs présentation claire) et quel écart visuel précis.
3. **Bandeau logo bord-à-bord.** À cadrer : quelle page + quel bandeau (hero présentation ? bandeau partenaires ? fiche ?).
4. **Bon de commande pré-rempli digital.** `admin/public/bon-commande-nds.html` (26 KB) existe ; à la soumission, statut='signe' → `fn_bon_commande_chain` (crée fiche partenaire/pro + facture + lead CRM). À cadrer : source du pré-remplissage (params URL depuis la landing/CRM ? fiche prospection ? lien nominatif par commerce ?).
5. **Bon de commande papier A4 (PDF).** À produire. À cadrer : génération client (print CSS A4 sur `bon-commande-nds.html`) ou PDF serveur ; coordonnées officielles à figer = info@opconsult.co / 06 16 35 49 36, BAITA SARL / OP CONSULT, RCS Grasse 512 026 907.


- Fichiers NO-TOUCH : `nds2026Design.ts`, `SpinClient.tsx`, `QuizClient.tsx` (modules maîtres ; config via `cfg` en base).
- Dashboard : validation **Acorn ES2020 = 0 erreur** + miroir `static/dashboard.html` **MD5-identique** avant tout push.
- Next.js : `tsc --noEmit` + `next build` (lire le log).
- Gros fichiers : édition par **Python `str.replace()` + assertions** (pas de sed multiligne).
- Push rejeté (non-fast-forward) : `git fetch origin && git reset --hard origin/main`, réappliquer, repush. Vérifier via `git ls-remote`.
- Supabase MCP : `execute_sql` ne renvoie que le résultat de la DERNIÈRE requête ; PostgREST cap 1000 lignes (paginer) ; découverte colonnes via `jsonb_object_keys(to_jsonb(row))`.
- Formulaires : sexe = Homme / Femme (+ vide), jamais « Autre ».
- Gel total de l'architecture pendant le festival (9–18 juillet).
- Communication Romain : français direct, voice-to-text (fautes à interpréter par contexte), ton factuel, pas d'anthropomorphisme.
