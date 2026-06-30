# HANDOFF — Flowin / Nuits du Sud 2026 — Comm & Production

> **À coller en début de toute nouvelle conversation de ce projet.**
> Source de vérité = ce fichier + table Supabase `handoff_notes` (`cle='handoff-nds-2026-comm'`).
> Festival : 9 → 18 juillet 2026, Vence. ~24 000 festivaliers.

---

## 0. BOOTSTRAP OBLIGATOIRE (toujours, dans cet ordre)

1. **Cloner** `flowinevent-ping/flowin-events-` + `git log` + **test push** (dry-run).
2. **Supabase MCP** : `execute_sql` trivial → `select 1`.
3. **Si l'un des deux manque → STOP**, le signaler, ne jamais continuer en mode dégradé.
4. **Lire le handoff** : ce fichier + `select contenu from handoff_notes where cle='handoff-nds-2026-comm';`
5. Puis exécuter **sans s'arrêter** (rendre la main uniquement si : info que seul Romain possède, accès externe manquant, ou conflit destructeur irréversible).

**RÈGLE ANTI-PERTE ABSOLUE** : `/home/claude` est **éphémère** (remis à zéro entre sessions). Tout asset produit (rendu **+ script source**) doit être **committé dans le repo DANS LA MÊME SESSION**, immédiatement. Ne jamais laisser un livrable uniquement dans `/home/claude`.

---

## 1. ACCÈS

| Service | Détail |
|---|---|
| **Supabase** | ref `ywcqtupgoxfzkddqkztk` (eu-west-1), via **MCP** (`execute_sql` / `apply_migration`). Compte Google `romain.collin@gmail.com`, org « romain.collin@gmail.com's Org », projet au nom trompeur « flowin revision olivia » = **bien le NDS**. Anon key publique `sb_publishable_yQcGyoh4UdlUCwA96RKSwg_3jMJVVb1`. ⚠️ FREE-tier → **passer Pro avant le 9/07** (pause auto après 7 j). |
| **GitHub** | repo `flowinevent-ping/flowin-events-`, branche `main`. Push : `https://x-access-token:<PAT>@github.com/flowinevent-ping/flowin-events-.git`. **PAT en mémoire projet #5** — jamais en clair ici ni dans Notion. Si push 401 → token périmé, demander à Romain. Identité commit : `git -c user.email=romain@flowin.events -c user.name="Romain Collin"`. |
| **Vercel** | auto-deploy sur push `main`, racine `/admin`. Rien à faire manuellement. |
| **Notion** | workspace courant. Page « NDS 2026 — Comm (Production & Handoff) ». ⚠️ `update_page` déclenche une **autorisation in-chat à chaque appel** (Romain doit approuver le prompt). |

**Réseau bash** : github.com, api.github.com, raw.githubusercontent.com, pypi, npm, mirrors ubuntu uniquement. **Supabase/Vercel inaccessibles depuis bash** → passer par le MCP.

---

## 2. BOÎTE À OUTILS & TUYAUX (rendu)

- **Rendu vidéo/visuels sans Chrome** : `ffmpeg` (présent) + **Python PIL** (présent) + `pip install qrcode --break-system-packages`. Pipeline déterministe frame-by-frame PIL → `ffmpeg -framerate 24 -c:v libx264 -crf 19 -pix_fmt yuv420p`. (Puppeteer/Chrome **pas installé** par défaut, le cache `/home/claude/.cache/puppeteer/...` est éphémère → préférer PIL.)
- **Police** : Manrope variable récupérable via `raw.githubusercontent.com/google/fonts/main/ofl/manrope/Manrope%5Bwght%5D.ttf` → `set_variation_by_axes([800])`. Fallback : DejaVuSans-Bold (système).
- **QR** : générer en HD depuis l'URL réelle de la station (`select cfg->>'qrUrl' from events where id=...`), `qrcode` ERROR_CORRECT_M box_size 20.
- **Charte comm** : fond dégradé navy (#0B1040 → #2A1A5E), accent **orange #FF7A1A**, **teal #20E0C4**, texte blanc, **logo NDS** `admin/public/nds/logo_nds_blanc_hd.png`. « **Flash** » **sans e** partout. Contact = `flowinevent@gmail.com · 06 16 35 49 36` (**sans nom**), signature **Animez · Fidélisez · Boostez**.
- **Style vidéo de référence** (à garder) = la kinétique écran : engageant, impactant, captivant, BOOM plein écran, QR persistant + gros QR final.
- **Validation avant push** : screenshot/`view` d'une frame AVANT d'encoder ; dashboard.html → Acorn ES2020 + miroir static MD5-identique.

---

## 3. RÈGLES DE FOND (ne pas enfreindre)

- **Données réelles uniquement** : jamais inventer logos, contacts, coordonnées, wording. Réutiliser le wording validé (concept canonique).
- **Wording validé / concept canonique** : 24 000 festivaliers jouent au quiz RSE, découvrent les commerces sur une carte ; dans le commerce le jeu continue (QR à son nom + lien), les clients cumulent des points et gagnent un **bon d'achat chez le commerçant + grand tirage** en clôture. 1 commerce = 1 lot.
- **Masters Next.js intouchables** (`SpinClient.tsx`, `QuizClient.tsx`) : toute config event passe par `events.cfg`.

---

## 4. ÉTAT EN BASE (déjà acquis — NE PAS refaire)

Super-event `se-nds-2026`. 5 partenaires + 5 stations module `quiz`, GPS réels, liens fiche↔station :

| Partenaire | Station | qr_token | image_url (base) |
|---|---|---|---|
| Domaine de la Bergerie | ev-nds-bergerie | bca57d8f65 | /nds/partenaires/bergerie.png |
| Auto-Moto-École Pégase | ev-nds-pegase | eb9982a248 | /nds/partenaires/pegase.png |
| Utile Vence | ev-nds-utile | b8197749a4 | /nds/partenaires/utile.png |
| Carrosserie GP | ev-nds-carrosserie-gp | fb14993748 | /nds/partenaires/carrosserie-gp.png |
| Électroménager J Giordano | ev-nds-giordano | daa4642cf5 | *(vide)* |

⚠️ **Les 4 `image_url` pointent sur des fichiers qui N'EXISTENT PAS dans le repo** (dossier `admin/public/nds/partenaires/` absent) → **4 liens 404** tant que les logos ne sont pas fournis + committés.

Stations festival (module `nds2026`) avec QR réels : `ev-nds-bar`, `ev-nds-caisses` (+caisse-1/2/3), `ev-nds-ecrans`, `ev-nds-tablette` (« Brigade Verte »), etc. URL type `https://flowin-events.vercel.app/parcours/nds2026?ev=<id>`.

---

## 5. RECAP DU TRAVAIL — FAIT ✅ / RESTE 🔜

### FAIT ✅ (committé dans Git cette session)
- **Vidéo écran kinétique** 9×16, 14,5 s — `admin/public/nds/visuels/nds-ecrans-kinetic-9x16.mp4` (commit `c788a7d`). QR réel `ev-nds-ecrans`, beats : CE SOIR → Flash·Joue·Gagne → lots → stations (Bar·Entrée·Brigade verte·Écran) → cumule/remporte → commerces → gros QR.
- **Acq Insta / FB / Présentation** + **A4 commerce** — `admin/public/nds/visuels/{acq_insta,acq_fb,acq_presentation,a4}.png` (commit `5ce6618`). Contact corrigé, « Flash » sans e.
- **Sources re-rendables** committées : `visuels-src/kinetic/render.py` (+ QR HD), `visuels-src/visuels.py`.
- **5 fiches + 5 stations + GPS + liens** en base (vérifié).
- Page Notion créée (« NDS 2026 — Comm »).

### RESTE 🔜
**Comm / création (même style que la kinétique écran) :**
- [ ] **Vidéo Insta** (format social vertical/carré).
- [ ] **Vidéo FB**.
- [ ] **Vidéo présentation** (partenaire).
- [ ] **Forex 70×70 À REFAIRE plus wow** + **déclinaisons par station** (caisse 1/2/3, bar 1/2) avec le **QR de la station** correspondante.
- [ ] **Kit digital** par pro : QR correspondant à **sa** station.

**Partenaires (bloqué tant que Romain ne fournit pas les fichiers) :**
- [ ] **4 logos partenaires** PNG/SVG → `admin/public/nds/partenaires/{bergerie,pegase,utile,carrosserie-gp}.png` (corrige les 404) + intégration dans vidéos/visuels.
- [ ] **Masters originaux** des sessions passées si Romain les ré-uploade (vkin.html, vert40.html, acq_*.html, r3.js, r1.js, assets.json) + rendus/essais (kinetic 13s, bornes 32s/26s, pro-out) → nommer/ranger/committer.
- [ ] Vidéo écran **40 s** avec les vrais logos (la 14,5 s actuelle couvre les beats, sans logos).

**Vérifications produit (dashboard / front) :**
- [ ] Dashboard : onglet **Lots & Tickets**, bouton **+1 point** proéminent, **app gift list** par station à la clôture.
- [ ] **Outils d'affichage des logos** partenaires (fiches + carte) une fois les logos committés.
- [ ] **Section partenaire** + **implantation GPS** des stations (vérifier rendu carte).

**Actions Romain (externes) :**
- [ ] Repo GitHub **privé** · **Supabase Pro avant 9/07** · domaine **Resend** vérifié · **CGV** validées juriste.

---

## 6. INVENTAIRE NOMMÉ (convention `NDS2026_<TYPE>_<Usage>_<version>_<ratio>`)

Tous présents dans le repo `admin/public/nds/` (+ exportés dans `outputs/NDS2026_materiel/`).

- **Vidéos** : Ecran_Kinetic_14s_9x16 ✅ · EcranFestival_34s_16x9 · SpotReseaux_37s_16x9 · Jeu (25s + ALT 30,8s).
- **Visuels** : ACQ_Insta_1x1 · ACQ_FB_1200x630 · ACQ_Presentation_16x9 · AFFICHE_Commerce_A4 · Poster_Partenaire · Forex_700x700 (+PDF print) · Story_1080x1920 · Carre_1080x1080 · Ecran_16x9 · BonAchat_90/159/259.
- **Sources éditables** : `visuels-src/kinetic/render.py`, `visuels-src/visuels.py`, `visuels-src/{carre,forex,story}.html`.
- **QR** : `nds/qr/*` (bar, caisse, tablette, ecrans) + `qr-carte`.
- **Logo / fonds** : logo_nds_blanc_hd.png, hero.jpg, bg-stage.webp.
