## 🎬 SESSION 30/06 (suite 2) — spot + partenaire en 9×16 (refonte)

Constat : les mp4 `nds-spot-nds2026-16x9` et `nds-partenaire-16x9` étaient des **rendus périmés** (ancien QR `nds-parcours.html`, « Flashe » avec E, noms texte erronés type « Work'n Fun / Util », scène « pas de téléphone » = fausse info). Les scripts étaient déjà corrigés ; seuls les rendus manquaient.

- 🆕 `kit-digital/nds/nds-spot-9x16.mp4` (1080×1920, 40s, musique bergerie) : intro **FLASH** (sans E), 7 **logos** partenaires, finale **« Et un grand tirage final à la clôture »** + signature **« Flowin — partenaire jeux des Nuits du Sud »**. Source `render_spot40.py` (dérive `render_kref40`, finale custom — le maître n'est PAS touché).
- 🆕 `kit-digital/nds/nds-partenaire-9x16.mp4` (1080×1920, 40s, musique bergerie) : charte verticale, page partenaire (7 logos), **sans** « pas de téléphone ». Base `render_kref40`.
- QR `ev-nds-digitale` (cohérent insta/fb), pyzbar vérifié sur les 2. Musique = audio de `bergerie-video-complete-TEST.mp4` (libre de droit).
- `index.html` : spot 9×16 + partenaire 9×16 ajoutés ; lien `nds-partenaire-16x9` (périmé) retiré.
- ⚠️ Fichier `nds-partenaire-16x9.mp4` toujours sur disque (non listé) — à supprimer si Romain confirme.
- HEAD repo : `c1d9e46`.

---

## 🎬 SESSION 30/06 (suite) — vidéo charvolin + kits 7/7

- 🆕 `kit-digital/charvolin/video-charvolin-9x16.mp4` (1080×1920, 24fps, 40s, muette comme les 6 autres). QR réseaux `ev-nds-charvolin&source=reseaux-charvolin` (pyzbar OK badge+finale). Pipeline = `render_kref40` base 960f + `composite_qr` (QR charvolin). README + zip charvolin régénérés.
- ✅ **Les 7 kits partenaires ont désormais leur vidéo 9×16** (bergerie, pegase, utile, carrosserie-gp, giordano, alafut, charvolin). Le point « 1 vidéo par partenaire » est clos.
- 🧹 `kit-digital/index.html` : section charvolin était **en DOUBLON** (2e occurrence avec liens QR cassés `qr-station.png`/`qr-reseaux.png`) → unifiée + bloc vidéo ajouté. Audit index : 0 doublon d'id, 0 lien QR cassé, 7/7 vidéos présentes.
- ℹ️ Forex festival vérifié : bandeau « NOS PARTENAIRES » à jour avec les **7 logos** (charvolin inclus). Demande « forex par commerce » soulevée puis **annulée par Romain** (30/06) — non traitée.
- HEAD repo : `9ca3ae8`.

---

## 🧭 SESSION 30/06 (réorganisation navigation) — à lire EN PREMIER

**Objectif tenu** : rendre le projet lisible par un humain qui arrive « à froid ». Avant : ~10 docs HANDOFF/RECAP/REPRISE en vrac à la racine, README vide (9 o). Après : **un point d'entrée unique**.

- 🆕 **`README.md`** = porte d'entrée. Tableau « je cherche… → je vais là ». Ne duplique pas, il pointe.
- 🆕 **`docs/ARCHITECTURE-flowin.md`** = comment Flowin marche (schéma, parcours joueur de bout en bout, glossaire) — lisible sans le code.
- 🆕 **`docs/INDEX-LIVRABLES-nds2026.md`** = carte **sources → maîtres → téléchargeables** : pour chaque visuel, où est le fichier final, sa source, comment le régénérer.
- 🧹 **Nettoyage** : 11 docs périmés déplacés dans **`docs/archive/`** (avec table « remplacé par »). Racine = `README` + `HANDOFF` + `CLAUDE` uniquement. `CDC-editeur` et `NDS2026-questions-a-valider` rangés dans `docs/`.
- 🔗 Liens internes **tous vérifiés** (0 mort). `CLAUDE.md`, `SPEC-TECHNIQUE`, `SOURCES-MAITRES.md` (public) repointés vers la nouvelle carte.
- ✅ Découverte au passage : les **4 logos ex-404** (bergerie, carrosserie-gp, pegase, utile) **sont présents** dans `admin/public/nds/partenaires/` → à confirmer côté affichage du mur de logos.

> Aucune modification de code applicatif, de mécanique de jeu, de base ou de module maître. Pur travail de doc + rangement `.md` (0 risque deploy).

---

## 🔁 RÉCAP REPRISE — sessions 28→30/06/2026 (à lire EN PREMIER)

> HEAD repo au moment du handoff : **`2c186df`** (toujours revérifier via `git log`). Source canonique = table Supabase `handoff_notes` clé `handoff-nds-2026-comm` (synchronisée avec ce bloc).

### A. BOOTSTRAP (ouverture obligatoire, dans l'ordre)
1. `git clone https://github.com/flowinevent-ping/flowin-events-.git` puis `git pull --ff-only origin main` → HEAD attendu **`2c186df`**. Branche `main`, app à la racine `/admin`, Vercel auto-deploy sur push.
2. Identité commit : `git -c user.email=romain@flowin.events -c user.name="Romain Collin"`.
3. Push auth : `https://x-access-token:<PAT>@github.com/flowinevent-ping/flowin-events-.git` — **PAT en mémoire projet, jamais en clair dans Notion/public**.
4. Supabase via MCP uniquement, ref `ywcqtupgoxfzkddqkztk`, bootstrap `select 1`.
5. Notion hub Comm : page id `38c6dcca-9add-81dd-9af2-c93139e06393`.
6. Si `git push` OU Supabase échoue → **STOP**, signaler, pas de mode dégradé.

### B. CE QUI A ÉTÉ FAIT (28→30/06)

**B1. Brigade Verte — module sondage-only** (commit `c0bea33`)
- Module `/parcours/nds2026`. Events `ev-nds-tablette` / `-1` / `-2` / `-3`, tous `super_event_id = se-nds-2026`, `gain_ticket = true`, `geo_controle = false`.
- Mécanique : `quizBanques: []` + `quizNbQuestions: 0` + `sondageAnonyme: true` ⇒ quiz sauté, `quizTk=false`, `bonusTk=true` ⇒ **1 ticket** par sondage. Cumul festival via `ndsLedgerAdd`.
- Géoloc : `captureScanGeo` ⇒ `onSite=true` si `geo_controle=false` OU pas de lat/lng ⇒ **ticket toujours accordé sur site, sans coordonnées**.
- Stockage anonyme **VÉRIFIÉ** : `writeSondageBrigade(evId, bonusAnswers)` → table `sondage_brigade` (`event_id` + `reponses` jsonb, **0 PII, 0 coordonnée**). Déclenché dans `finishBonus` dès la fin du sondage, que la personne s'inscrive ensuite ou non. Anti-double via `sondageAnonSaved`.
- Anti-rejeu : `localStorage` 1 participation/jour/station.
- Stations culture (quiz présent) inchangées. Seuls changements globaux : optin désormais **facultatif** + texte optin RGPD reformulé.
- **Non touché** : `SpinClient.tsx` / `QuizClient.tsx` (masters), banque dormante `bq-nds-rse-mobilite`.

**B2. Bug routage QR (critique) — RÉSOLU** (commits `be95f22` + `c319b8f`)
- Symptôme : QR station tombait sur l'écran générique « Jouer gratuitement » (QuizClient) au lieu de l'écran NDS brandé « À GAGNER / Comment jouer » (NDS2026Client).
- Cause : anciens QR pointaient `/parcours/quiz?ev=…` au lieu de `/parcours/nds2026?ev=…`.
- Fix code `be95f22` : garde-fou serveur dans `admin/app/parcours/quiz/page.tsx` → si l'event a un module canonique (`nds2026`…), redirige vers `/parcours/<module>` en conservant `source`. Rattrape tout ancien QR imprimé/vidéo/forex. N'altère pas QuizClient. `tsc 0` + `next build` OK.
- Fix sources `c319b8f` : 6 QR commerce `visuels-src/qr/ev-nds-{alafut,bergerie,carrosserie-gp,giordano,pegase,utile}.png` régénérés en `nds2026`, scan vérifié.
- Inventaire impression : A4 + kit-digital déjà `nds2026` → ce qui s'imprime/se distribue est bon.

**B3. Vidéo Bergerie test + anti-perte** (commits `5f06ed9`, `91984c8`, `7b1e5f3`, `2c186df`)
- Clip partenaires v2 (7 logos + Allianz Charvolin, QR remonté/agrandi) : `admin/public/nds/kit-digital/nds/clips/5-partenaires-bergerie-allianz.mp4` + source `render_partners_v2.py`.
- Logo Allianz Charvolin committé (`partenaires/allianz-charvolin.png`).
- Recette montage complète : `admin/public/nds/visuels-src/build_bergerie_video_test.py` (delogo « CE SOIR » + badge QR agrandi/remonté + splice scène partenaires xfade + grain). Recopie l'audio source. Vérifiée : sortie 40,54 s, QR `nds2026` scanné.
- **Musique confirmée libre de droit par Romain (30/06)** → exception « ne pas committer la musique » LEVÉE. Source + rendu committés :
  - source CapCut : `admin/public/nds/visuels-src/sources-video/bergerie-capcut-source-40s.mp4`
  - rendu final test : `admin/public/nds/visuels-src/sources-video/bergerie-video-complete-TEST.mp4`
  - script branché par défaut sur la source committée → reproductible **sans ré-upload**.

### C. TRAVAIL À SUIVRE (prochaine conversation)
1. **CGV** : faire valider par juriste → coller texte validé via Dashboard CGV/Légal + passer statut `validé`. Page `/cgv-nds.html`.
2. **Règles du jeu** : valider/figer le wording public (4/4 = 1 ticket, +1 si bonus ; brigade = 1 ticket sondage ; 1 participation/jour/station ; cumul festival). **Mécanique gelée — ne pas changer la logique**, seulement publier/clarifier le texte joueur.
3. **Kits digitaux par partenaire** (6 commerces) : compléter/valider A4, cartes QR, vidéo, READMEs. Index `https://flowin-events.vercel.app/nds/kit-digital/index.html`.
4. **Stations Brigade Verte « sondage seulement »** : tester un QR brigade réel (intro → sondage → 1 ticket). Options : 6ᵉ question, ajouter PMR, peaufiner `intro`.
5. **Stockage connexions + réponses même sans coordonnées** (pour traiter les résultats) :
   - ✅ VÉRIFIÉ : réponses sondage stockées sans coordonnée ni PII (`sondage_brigade`) dès la fin du sondage.
   - ⚠️ **GAP À TRAITER** : une connexion (scan QR) abandonnée *avant* la fin du sondage n'est PAS tracée ; réponses partielles non capturées. À implémenter si besoin : log scan/connexion indépendant + capture partielle (ex. table `connexions` ou insert au `mount` avec `session_id`).
   - Colonne `converti` (sondage→inscription) : présente, non alimentée → implémenter si besoin (`session_id` + policy UPDATE).
   - Lecture stats = `service_role` via MCP (anon ne peut PAS lire `sondage_brigade`).
6. **Passe stabilité des règles + sauvegarde** :
   - Vérifier mécanique inchangée (4/4=1, brigade=1) ; fonctions `add_points` / `attribuer_lot_auto` / `valider_parrainage` toujours `REVOKE`'d.
   - Sauvegarde : `config_backups` snapshot à jour ; **backup manuel juste avant le 9/07** ; activer **PITR** ; rendre **repo privé** (actions owner Romain).
   - Vérifier **domaine Resend** (bloqueur email : n'envoie qu'à flowinevent@gmail.com).

### D. RÈGLE PERMANENTE — logos partenaires (À CONSERVER)
- Insérer **systématiquement** les logos partenaires dans TOUS les supports visuels : **vidéo, forex, A4, présentation**. Raison : les partenaires se confirment dans les jours qui viennent → mettre à jour le mur de logos à **chaque nouveau partenaire signé**.
- Forex = version finale **AVEC** logos (bloc « Nos partenaires », grille « Votre logo ici »). Vidéo = mur 7 logos incl. Allianz Charvolin (régénérable via `render_partners_v2.py`).
- **Bloqueur Romain** : fournir PNG/SVG pour `admin/public/nds/partenaires/{bergerie,carrosserie-gp,pegase,utile}.png` (4 liens 404).
- Anti-cache images : incrémenter `?v=YYYYMMDDx` à chaque remplacement de PNG.
- Batch « 1 vidéo par partenaire » (commande permanente) : 1 vidéo/partenaire, QR `/parcours/nds2026?ev=ev-nds-<slug>&source=reseaux-<slug>` sur toutes les scènes, nommage `<Nom> video.mp4`, mur logos à jour.

### E. ANTI-CONFLIT / ANTI-PERTE (impératif)
- `git pull --ff-only` avant tout travail ; jamais `reset --hard` sans avoir committé.
- Committer **source + rendu ensemble**, même session (`/home/claude` éphémère).
- Ne pas toucher `QuizClient.tsx` / `SpinClient.tsx` (config via Supabase `cfg` uniquement).
- Next.js : `tsc --noEmit` + `next build`, puis `git checkout -- admin/tsconfig.tsbuildinfo` avant push.

---

# HANDOFF — Flowin / Nuits du Sud 2026

> Document de reprise. Dernière mise à jour : **23/06/2026** (session présentation/visuels/bon de commande). HEAD au moment du handoff : `b8dfcc6` (toujours revérifier via `git log` — ne pas supposer).
> Objectif : reprendre le projet dans une nouvelle session SANS dégradation ni perte des tâches accomplies.

> ⚠️ **SOURCE À JOUR = table Supabase `handoff_notes` clé `handoff-nds-2026-comm`** (maj 29/06). Ce .md racine n'est pas resynchronisé intégralement.
>
> **Session 29/06 (suite)** — HEAD `158248e`. Supports éditables PPTX livrés car les SVG ne sont pas éditables dans Canva :
> - **A4 éditables** (6 commerces) `e31705f` : `kit-digital/<slug>/nds_a4_<slug>-editable.pptx` (décor image + 10 zones de texte ; 'GRAND TIRAGE' exclu car brûlé dans le plate). Repro : `visuels-src/extract_a4_pptx.py` + `gen_pptx_a4.js`.
> - **Tickets tombola éditables** (7 lots) `158248e` : `visuels/tickets/nds_ticket_<lot>-editable.pptx` (lot/partenaire-valeur/n° série éditables). Repro : `visuels-src/gen_ticket_plate.py` + `gen_pptx_tickets.js`.
> - Pièges PPTX : `writeFile` async → `Promise.all` avant rezip (sinon fichiers tronqués 512Ko) ; recompresser via `pptx/scripts/rezip.py` ; installer Manrope en police système pour un QA fidèle.
> - Mail Lucie (Giordano) corrigé + liens. 3 points à trancher par Romain : 6×42=252 (pas 256), pack 2000€ HT ou TTC, articulation fiche/carte 500HT vs pack 2000.

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
