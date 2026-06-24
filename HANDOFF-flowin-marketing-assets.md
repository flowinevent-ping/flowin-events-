# HANDOFF — Flowin / Nuits du Sud 2026 — Assets marketing & présentation partenaire
**Dernier état : HEAD `bb91c5b` (2026-06-24).** Document de reprise pour continuer dans une nouvelle conversation (push auto + éléments en cours).
> ℹ️ Version repo (token masqué). Le token complet est dans le handoff privé téléchargé par Romain et dans la mémoire Claude.

---

## 0) BOOTSTRAP (à faire au début de chaque conversation)
1. Cloner `flowinevent-ping/flowin-events-` puis :
   ```
   git fetch origin -q && git reset --hard origin/main -q
   git log -1 --oneline    # vérifier le HEAD courant
   ```
2. **Push test** (voir format token plus bas) pour confirmer l'accès écriture.
3. **Supabase MCP** : `execute_sql` trivial (`select 1`) pour confirmer l'accès base.
4. Si l'un des deux manque → STOP, signaler, ne pas continuer en mode dégradé.
5. Source de vérité dev/prod (dans le repo) : `HANDOFF-flowin-nds2026.md`.

---

## 1) ACCÈS

### GitHub (push auto)
- Repo : `github.com/flowinevent-ping/flowin-events-` (compte `flowinevent-ping`).
- Token fine-grained (Contents R/W, expire ~17/09/2026) :
  `<TOKEN — voir handoff privé / mémoire Claude (non commité par sécurité, repo public)>`
- **Format push obligatoire** :
  `https://x-access-token:<TOKEN>@github.com/flowinevent-ping/flowin-events-.git`
- Si push → 401 : token périmé, demander le courant à Romain (ne pas régénérer inutilement).
- Commits : `git -c user.email=romain@flowin.events -c user.name="Romain Collin" commit -m "..."`
- Toujours masquer le token dans les logs : `sed -E 's#x-access-token:[^@]+@#x-access-token:***@#g'`
- Concurrence (plusieurs sessions sur `main`) : `git fetch origin && git reset --hard origin/main`, réappliquer, committer/pusher en une séquence.

### Supabase
- Projet PROD : `ywcqtupgoxfzkddqkztk` (eu-west-1, Irlande). Compte Google `romain.collin@gmail.com`.
- Nom trompeur « flowin revision olivia » = bien le NDS prod.
- Anon key (publique par design) : `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`
- Accès **uniquement via le connecteur MCP Supabase** (bash ne joint pas `*.supabase.co`).
- ⚠️ Free-tier → pause auto après 7 j d'inactivité : passer Pro AVANT le 9 juillet.

### Vercel
- Auto-deploy depuis `main`, **root `/admin`**.
- URL prod : `https://flowin-events.vercel.app`
- Tout push sur `main` redéploie automatiquement (y compris depuis une autre conversation).

### Notion
- Connecteur **Notion MCP disponible** dans l'environnement (tools `notion-*`).
- Pas de workspace/page Flowin spécifique mémorisé → si besoin, demander à Romain l'URL de la page cible avant d'écrire dedans.

---

## 2) LIENS DES ÉLÉMENTS (déployés)
Base : `https://flowin-events.vercel.app`

| Élément | URL |
|---|---|
| **Présentation partenaire** (le doc commercial) | `/nds-partenaire-presentation.html` |
| **Hub visuels partenaires** (téléchargement/partage) | `/nds-visuels.html` |
| App offres partenaire | `/nds` (alias `/nds-partenaire`) |
| Jeu / parcours joueur | `/nds-parcours.html` (alias `/jeu`) |
| Carte interactive | `/carte.html` (alias `/carte`) |
| Carousel pro (5 slides) | `/nds-super-event-pro.html` |
| Parcours client (démo 8 étapes) | `/nds-parcours-client.html` |

### Assets — `/nds/visuels/` (cache courant `?v=20260624d`)
- `forex_700x700.png` (+ `forex_700x700_print.pdf`) — affiche boutique 70×70.
- `carre_1080x1080.png` — post réseaux carré.
- `story_1080x1920.png` — story réseaux.
- `bon_achat_90.png` / `bon_achat_159.png` / `bon_achat_259.png` — bons d'achat (n° gagnant + logo Flowin).
- `ecran_16x9.png` — affiche écran 16:9 (TV festival).
- `poster-partenaire.png` — poster/miniature de la vidéo partenaire.
- `nds-partenaire-video-16x9.mp4` — **vidéo partenaire 36 s** (partenaires mis en avant).
- `nds-jeu-video-16x9.mp4` — vidéo festivalier 25 s (scan & joue).

---

## 3) ÉTAT DES ÉLÉMENTS EN COURS (marketing)

### Présentation partenaire `nds-partenaire-presentation.html`
Sections dans l'ordre : parcours joueur → « Ce que vous pouvez gagner » → « Où apparaît votre logo » → « Concrètement, vous achetez quoi ? » → **« Ce que vous avez, selon votre formule »** → **« Vos supports de com' »** → CTA « Devenir partenaire ».
- **« Ce que vous avez »** = liste **encadrée par offre, empilée** (Visibilité → Animation → Sponsor), **sans prix d'offre**. Chaque offre : bon d'achat en **petite vignette** + « À faire gagner : Bon d'achat X € » + **« Vos supports inclus »** (vrais visuels : affiche boutique/forex, posts réseaux, **vidéo écran** ; icônes pour fiche, contacts, carte, reporting, supports&stations, bandeau, quiz). La **vidéo est dans les supports réseaux** (carte Animation).
- **« Vos supports de com' »** : vidéo écran (lecteur + bouton « Ouvrir la vidéo ») + affiche boutique (forex) + posts réseaux.
- Export **standalone** régénérable (PNG inline base64, vidéo en lien). ⚠️ Regex d'inline doit inclure le **tiret** : `src="/nds/visuels/([a-z0-9_-]+\.png)"` (sinon `poster-partenaire.png` cassé).

### Hub `nds-visuels.html`
Tableau JS `var ITEMS=[...]`. Contient désormais : **vidéo** (miniature poster + ▶ + Télécharger/Partager), **écran 16:9**, carré, story, forex (+pdf), **3 bons d'achat**. Cache `?v=20260624d`.
- JS strings en quotes simples → échapper `\'`, NE PAS `unicode_escape` ces chaînes.
- `video:true` + `thumbFile:'poster-partenaire.png'` pour la tuile vidéo (miniature ≠ fichier téléchargé).

### Bons d'achat (visuels)
1200×630, montant or « en major », « à faire valoir dans votre boutique », « Gagné au Jeu Nuits du Sud 2026 », champ **N° gagnant** (à vérifier dans l'app avant remise), encart logo partenaire, **logo Flowin** (rond « F » teal + Flowin), bord doré + cran ticket.

### Vidéo partenaire 36 s
Scène 1 = build-up (Flashe.Joue.Gagne + QR scan) ; scène 2 = **PARTENAIRES mis en avant** (Work'n Fun · Giordano Électroménager · Util · Alafut + « d'autres à venir »). Sans son (voix off à ajouter).

---

## 4) PIPELINE DE RENDU (visuels & vidéos) — GOTCHAS
- Chrome headless : `/home/claude/.cache/puppeteer/chrome/linux-131.0.6778.204/chrome-linux64/chrome`
  flags : `--headless=new --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=W,H --screenshot=OUT file://...`
- **Le headless tronque ~35 px en bas** → rendre dans une fenêtre plus HAUTE puis cropper (PIL) à la hauteur cible.
- **Un `<video>` à src distante (vercel) BLOQUE le rendu headless** (zombie chrome) → `pkill -9 chrome` entre les rendus ; pour vérifier une page qui contient la vidéo, rendre une copie locale (chemins relatifs) ou la section isolée.
- **Vidéo** : HTML animé exposant `window.setT(t)` (état déterministe par frame, pas de @keyframes), rendu par **chunks de ~300 frames** avec `puppeteer-core` (`/home/claude/.vid/node_modules/puppeteer-core`, `executablePath=`chemin Chrome), puis `ffmpeg -framerate 24 -i frames/f%04d.png -c:v libx264 -pix_fmt yuv420p -crf 18 -movflags +faststart out.mp4`.
- **Cache navigateur** : Romain voit souvent des assets périmés malgré no-store → recommander **navigation privée (Cmd+Maj+N)**. Incrémenter `?v=YYYYMMDD[lettre]` à chaque remplacement PNG.
- Validation avant push : Acorn `ecmaVersion:2020` 0 erreur sur les `<script>`. `dashboard.html` → miroir MD5 identique `static/dashboard.html`.

---

## 5) EN ATTENTE / PROPOSÉ
- [ ] **Version verticale 1080×1920** de la vidéo partenaire (stories) — proposée, en attente du go de Romain.
- [ ] Vérifier le **lien vidéo** déployé en navigation privée (le MP4 est commité ; déploiement parfois en léger différé).
- [ ] Détail mineur : libellé « Bon d'achat 90 € » qui s'enroule un peu serré sous la vignette (peut être élargi).
- [ ] Voix off sur la vidéo partenaire (Romain).

---

## 6) RÉFÉRENCES MÉTIER (ne pas réécrire)
- **Offres réelles** (NE PAS afficher les prix d'offre sur les visuels « ce que vous avez ») :
  Visibilité 590 € HT (lot 90 €) · Animation 1490 € HT (lot 159 €, « le plus choisi ») · Sponsor 3590 € HT (lot 259 €).
- **Partenaires connus** (donnés par Romain) : Work'n Fun, Giordano Électroménager, Util, Alafut (+ à venir).
- **Contact officiel partenaires** : `info@opconsult.co` · `06 16 35 49 36` (signature Romain Collin). `romain@flowin.events` = label git uniquement.
- Jamais d'« Autre » comme genre (Homme/Femme + vide). Ne jamais inventer partenaires/contacts.
- **Palette NDS** : navy `#0a1020`, blue `#5B79E0`, gold `#F5B544`, magenta `#E0218A`, teal `#2FD89E`. **Police** : Manrope.

---

## 7) DERNIERS COMMITS (chaîne récente)
`...e66388d → 764a391 (vidéo partenaire 36s + Hub) → 1bd57fc (section ce-que-vous-avez v1) → bb91c5b (liste encadrée par offre + vidéo dans réseaux + fix vignette tiret)`
