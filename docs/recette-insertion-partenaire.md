# 🧩 Recette d'insertion d'un partenaire — NDS 2026

But : ajouter (ou retirer) un commerce partenaire **sans jamais oublier un support**.
Avant, la liste des partenaires était dupliquée dans ~15 fichiers → à chaque ajout certains
supports étaient oubliés (typiquement les vidéos). Désormais il y a **une seule source de vérité**.

## ✅ Source unique de vérité

`admin/public/nds/visuels-src/nds_lib.py` → variable **`PARTNERS`**

```python
PARTNERS = [
    "bergerie", "pegase", "utile", "carrosserie-gp",
    "giordano", "alafut", "charvolin", "dekra",
]
```

Tous les générateurs lisent cette liste :
- `gen_forex.py`            → bandeau forex (PNG/SVG)  : `slots = list(L.PARTNERS)`
- `gen_forex_pptx_prep.py` → forex PPTX (via gen_forex)
- `render_kref40.py`       → registre `LOGOS` partagé par toutes les vidéos
- `render_pres16x9.py`     → scène commerces via `L.logo_grid(L.PARTNERS, …)` (grille auto)
- `build_montage_kit.py`   → logos du kit montage écran : `for slug in L.PARTNERS`

Le helper **`L.logo_grid(slugs, cx, cy, area_w, area_h, cols=None)`** place N logos en grille
auto-centrée (colonnes calculées ou imposées) et renvoie `(slug, x, y, w, h)`. L'appelant gère
l'animation. Ajouter un logo à `PARTNERS` reflue automatiquement la grille — **0 coordonnée à toucher**.

## 🔧 Procédure (3 étapes)

1. **Logo** : déposer `admin/public/nds/partenaires/<slug>.png` (fond blanc, marges propres)
   et le copier dans `/home/claude/vid/logos/<slug>.png`.
2. **Liste** : ajouter `"<slug>"` à la fin de `PARTNERS` dans `nds_lib.py` (1 ligne).
3. **Rebuild** : `bash admin/public/nds/visuels-src/rebuild_partenaires.sh`
   → régénère forex PNG/SVG/PPTX + logos du kit montage. Les vidéos se re-rendent avec les
   commandes listées en fin de script (plus lourdes, lancées explicitement).

> ⚠️ Les enregistrements Supabase (`pt-<slug>`, `ev-nds-<slug>`, QR token), l'affiche A4 dédiée,
> le dossier kit `kit-digital/<slug>/`, l'entrée `index.html` et les 2 pages Notion restent des
> étapes **propres au partenaire** (données métier : lots, adresse, tél). Voir le handoff pour le détail.

## 🎬 Mapping vidéo ↔ script (était non documenté — source de la fragilité)

| Fichier kit (`kit-digital/nds/`) | Dimensions | Script source | Bandeau logos |
|---|---|---|---|
| `nds-fb-16x9.mp4`        | 1920×1080 | `render_pres16x9.py`  | ✅ auto (logo_grid) |
| `nds-spot-9x16.mp4`      | 1080×1920 | `render_spot40.py`    | ⚠️ tuiles codées en dur |
| `nds-ecrans-9x16.mp4`    | 1080×1920 | `render_ecran40.py`   | ⚠️ tuiles codées en dur |
| `nds-partenaire-16x9.mp4`| 1920×1080 | (dérivé pres16x9, 34s)| — |
| `nds-insta-9x16.mp4`     | 1080×1920 | source à confirmer    | — |
| `render_social1x1.py`    | 1080×1080 | (carré, aucun fichier kit) | — |

**À FAIRE pour finir la recette** : convertir les scènes commerces de `render_spot40.py` et
`render_ecran40.py` au helper `L.logo_grid(L.PARTNERS, …)` (comme pres16x9) pour qu'elles soient
elles aussi pilotées par la source unique. Tant que ce n'est pas fait, ces 2 vidéos gardent des
tuiles codées en dur et doivent être éditées à la main lors d'un ajout.
