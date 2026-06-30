# 🗺️ Index des livrables — NDS 2026

> **À quoi sert ce document** : pour chaque visuel, savoir **où est le fichier final** (à télécharger), **où est sa source** (pour le modifier) et **comment le régénérer**.
> MAJ : 2026-06-30. Tous les chemins sont relatifs à la racine du repo. Les URL publiques sont servies depuis `https://flowin-events.vercel.app/nds/…` (= dossier `admin/public/nds/`).

---

## 🎯 Le plus simple : la page de distribution

**👉 https://flowin-events.vercel.app/nds/kit-digital/index.html**

C'est la page à **envoyer aux commerces**. Elle liste tous les téléchargeables (kit festival + kit par commerce) avec aperçus et boutons. Source de la page : `admin/public/nds/kit-digital/index.html`.

---

## 🧱 Les 3 niveaux d'un visuel

| Niveau | C'est quoi | Où |
|---|---|---|
| **SOURCE** | Le script Python ou le SVG qui **fabrique** le visuel. À toucher pour modifier. | `admin/public/nds/visuels-src/` (scripts) · `admin/public/nds/kit-digital/svg/` (SVG Canva) |
| **MAÎTRE** | La **référence de charte** dont tout découle (couleurs, polices, cadrage vidéo). | `render_kref40.py` (vidéo) · `nds_lib.py` (helpers communs) · `gen_a4_clean.py` (A4 v10) |
| **TÉLÉCHARGEABLE** | Le **fichier final** livré / imprimé / posté. | `admin/public/nds/kit-digital/…` · `admin/public/nds/visuels/…` |

> 🎨 **Charte (jamais inventer une couleur)** : navy `#0a1020` · ambre `#f4b544` · teal `#20e0c4` · magenta `#e6187f` · polices **Manrope** + **Anton**. Référence vidéo = `render_kref40.py`.

---

## 📄 A4 « Jouez ici »

| | Détail |
|---|---|
| **Source de vérité** | `admin/public/nds/visuels-src/gen_a4_clean.py` (A4 v10) |
| **SVG éditable (Canva)** | `admin/public/nds/kit-digital/svg/nds_a4_<slug>.svg` |
| **Téléchargeables** (par commerce) | `admin/public/nds/kit-digital/<slug>/nds_a4_<slug>.{png,pdf,pptx,svg}` |
| **URL** | `…/nds/kit-digital/<slug>/nds_a4_<slug>.pdf` (et `.png`, `.pptx`, `.svg`) |
| **Régénérer** | lancer `gen_a4_clean.py` (lit `cfg->>'qrUrl'` en base pour le QR) |

`<slug>` ∈ `bergerie, pegase, utile, carrosserie-gp, giordano, alafut`.

---

## 🎬 Vidéos

| Vidéo | Téléchargeable | Source |
|---|---|---|
| **Par commerce** (9×16) | `…/kit-digital/<slug>/video-<slug>-9x16.mp4` | `render_kref40.py` (+ `composite_qr.py` pour le QR réseaux) |
| **Insta** (9×16) | `…/kit-digital/nds/nds-insta-9x16.mp4` | `render_social1x1.py` / `render_kref40.py` |
| **Facebook** (16×9) | `…/kit-digital/nds/nds-fb-16x9.mp4` | idem |
| **Écrans festival** (9×16) | `…/kit-digital/nds/nds-ecrans-9x16.mp4` | `render_ecran40.py` |
| **Mur partenaires** (16×9) | `…/kit-digital/nds/nds-partenaire-16x9.mp4` | `render_partners_v2.py` (7 logos, QR remonté) |
| **Présentation** (16×9) | `admin/public/nds/visuels/nds-presentation-kinetic40-16x9.mp4` | `render_pres16x9.py` / `kinetic/` |
| **Spot festival** (16×9) | `admin/public/nds/spot-nds2026-16x9.mp4` | `render_kref40.py` |

> 🎵 **Musique** confirmée libre de droit (Romain, 30/06) → sources committées dans `visuels-src/sources-video/`. Recette de montage Bergerie reproductible : `visuels-src/build_bergerie_video_test.py`.
>
> 🔁 **Commande permanente « 1 vidéo / partenaire »** : QR `…/parcours/nds2026?ev=ev-nds-<slug>&source=reseaux-<slug>` sur toutes les scènes, mur de logos à jour.

---

## 🟧 Forex 70×70 (panneaux rigides)

| | Détail |
|---|---|
| **Source** | `admin/public/nds/visuels-src/gen_forex.py` |
| **Éditable (pptx)** | `admin/public/nds/kit-digital/svg/forex_70x70_<poste>-editable.pptx` |
| **Téléchargeables (impression)** | `admin/public/nds/visuels/forex/forex_70x70_<poste>.{pdf,png}` |
| **Postes** | `caisse-1`, `caisse-2`, `caisse-3`, `bar-1`, `bar-2`, `festival` |
| **Régénérer** | `gen_forex.py` (QR de la station injecté depuis `cfg->>'qrUrl'`) |

---

## 🎫 Tickets / lots

| | Détail |
|---|---|
| **Source** | `admin/public/nds/visuels-src/gen_tickets.py` · `gen_ticket_plate.py` |
| **Éditables (pptx)** | `admin/public/nds/visuels/tickets/nds_ticket_<…>-editable.pptx` |
| **Téléchargeables (PDF)** | `admin/public/nds/visuels/tickets/nds_tickets_<…>.pdf` |

---

## 🔳 QR codes

| | Détail |
|---|---|
| **Station** (en boutique) | `…/kit-digital/<slug>/qr-station-<slug>.png` — URL fixe `…/parcours/nds2026?ev=ev-nds-<slug>` |
| **Réseaux** (en ligne) | `…/kit-digital/<slug>/qr-reseaux-<slug>.png` — même URL `+ &source=reseaux-<slug>` |
| **Sources HD** | `admin/public/nds/visuels-src/qr/ev-nds-<slug>.png` |
| **Règle** | tout QR encode **verbatim** `events.cfg.qrUrl`, et est **revérifié par décodage** (pyzbar) avant commit |

---

## 🏷️ Logos partenaires

| | Détail |
|---|---|
| **Emplacement** | `admin/public/nds/partenaires/<slug>.png` |
| **Présents** | alafut, allianz-charvolin, bergerie, carrosserie-gp, charvolin, giordano, pegase, utile ✅ |
| **À confirmer** | affichage du mur de logos sur tous les supports (les 4 PNG ex-« 404 » bergerie/carrosserie-gp/pegase/utile **sont désormais dans le repo** — vérifier qu'ils s'affichent partout) |
| **Anti-cache** | incrémenter `?v=YYYYMMDDx` à chaque remplacement d'un PNG |
| **Règle permanente** | insérer les logos sur **tous** les supports (vidéo, forex, A4, présentation) ; mettre à jour le mur à **chaque** nouveau partenaire signé |

---

## 📁 Cartographie des dossiers (mémo)

```
admin/public/nds/
├── kit-digital/              ← TÉLÉCHARGEABLES (page de distribution)
│   ├── index.html            ← la page publique à partager
│   ├── nds/                  ← kit festival (zip, vidéos insta/fb/écrans/partenaire, forex)
│   ├── svg/                  ← SVG + pptx ÉDITABLES (Canva / PowerPoint)
│   └── <commerce>/           ← kit par commerce (A4 ×4, vidéo, 2 QR, zip)
├── visuels/                  ← RENDUS (A4 png, vidéos pro, social, posters)
│   ├── forex/                ← forex 70×70 imprimables (pdf + png)
│   └── tickets/              ← tickets/lots (pdf + pptx)
├── visuels-src/              ← SOURCES (scripts Python générateurs)
│   ├── sources-video/        ← sources CapCut + rendus test
│   ├── qr/                   ← QR sources HD
│   └── kinetic/              ← animation kinétique
├── partenaires/              ← logos
└── SOURCES-MAITRES.md        ← manifeste court des sources (pointe vers ce fichier)
```

---

## 🔧 Régénérer un visuel — méthode

1. Identifier la **source** dans le tableau ci-dessus.
2. Le QR vient toujours de la base : `select cfg->>'qrUrl' from events where id='<station>'`.
3. Lancer le script. Pour les vidéos : frames PIL (JPEG q90, chunks ≤160) puis `ffmpeg -framerate 24 -crf 19 -c:v libx264 -pix_fmt yuv420p`.
4. **Vérifier le QR par décodage** (pyzbar) avant de committer.
5. **Committer source + rendu ensemble, dans la même session** (`/home/claude` est éphémère).
6. Cache-bust : incrémenter `?v=` sur l'asset remplacé.

---

*Pour le détail technique du pipeline → [`SPEC-TECHNIQUE-flowin.md`](SPEC-TECHNIQUE-flowin.md) §7. Pour comprendre le produit → [`ARCHITECTURE-flowin.md`](ARCHITECTURE-flowin.md).*
