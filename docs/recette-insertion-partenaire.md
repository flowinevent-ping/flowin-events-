# 🧩 Recette d'insertion d'un partenaire — NDS 2026

But : ajouter (ou retirer) un commerce partenaire **sans jamais oublier un support**.
Avant, la liste des partenaires était dupliquée dans ~15 fichiers → à chaque ajout certains
supports étaient oubliés (typiquement les vidéos). Désormais il y a **une seule source de vérité**.

## ✅ Source unique de vérité

`admin/public/nds/visuels-src/nds_lib.py` → variable **`PARTNERS`**

```python
PARTNERS = [
    "bergerie", "pegase", "utile", "carrosserie-gp",
    "giordano", "charvolin", "nook",
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
| `nds-spot-9x16.mp4`      | 1080×1920 | `render_spot40.py` (+ audio) | ✅ auto (logo_grid) |
| `nds-insta-9x16.mp4`     | 1080×1920 | `render_spot40.py` (SANS audio — variante Insta silencieuse) | ✅ auto (logo_grid) |
| `nds-ecrans-9x16.mp4`    | 1080×1920 | `render_ecran40.py`   | ✅ auto (logo_grid) |
| `nds-partenaire-16x9.mp4`| 1920×1080 | présentation (upload, 34s) | — pas de mur de logos |
| `render_social1x1.py`    | 1080×1080 | (carré, aucun fichier kit) | — obsolète |

**✅ Recette complète** : `render_pres16x9` (nds-fb-16x9), `render_spot40` (nds-spot-9x16 + nds-insta-9x16) et `render_ecran40` (nds-ecrans-9x16) lisent toutes la source unique via `L.logo_grid(L.PARTNERS)`. Toutes les vidéos festival qui montrent le mur de logos sont pilotées par la liste unique — ajout d'un partenaire = re-render (frames + ffmpeg), 0 coordonnée à toucher.

---

## ⚡ Recette anti-« recommencer » — MASTER sans-QR + STAMP par pro

**Problème résolu :** chaque changement de logo OU de QR pro relançait un re-render
frame-by-frame de toute la vidéo (~1 h 45). Désormais deux opérations rapides et séparées.

### 1. Changer / ajouter / retirer un LOGO  (→ ~1-2 min, pas 1 h 45)
Le mur de logos est sur la source unique `nds_lib.PARTNERS` (comme forex/A4/autres vidéos).
- Éditer `PARTNERS` dans `nds_lib.py` (1 ligne) + déposer `partenaires/<slug>.png`.
- Re-rendre **uniquement** le clip mur-de-logos (156 frames, `render_partners_v2.py`,
  désormais via `L.logo_grid(L.PARTNERS)` — 0 coordonnée à toucher).
- `NOQR=1 python3 render_partners_v2.py 0 156` → clip MASTER **sans QR**.

### 2. Attribuer une vidéo à UN pro avec SON QR  (→ ~30 s par pro, scan vérifié)
Le QR n'est plus « cuit » dans les frames : il est apposé en **1 passe ffmpeg** sur un master sans-QR.
```bash
# 1 pro :
python3 stamp_pro.py <master_sans_qr.mp4> <slug> out/<slug>.mp4 --mode reseaux --window 1:6
# tous les pros (boucle, ~4 min pour 8) :
for s in bergerie pegase utile carrosserie-gp giordano charvolin nook; do
  python3 stamp_pro.py master.mp4 $s out/$s.mp4 --mode reseaux ; done
# QR festival générique :
python3 stamp_pro.py master.mp4 digitale out/digitale.mp4 --mode digitale
```
`stamp_pro.py` : QR (modes `reseaux`/`ev`/`digitale`) → badge validé « Flash le QR » →
overlay ffmpeg (`--at X:Y`, `--window A:B`) → **audio du master conservé** (`-c:a copy`) →
**vérif pyzbar** (sortie KO si le QR scanné ≠ URL attendue).

### Principe
- **Lourd = rendu UNE fois** (fond + mur de logos) → master immuable, sans QR, committé.
- **Léger = par pro** (QR) → passe ffmpeg de quelques secondes, jamais de boucle PIL.
- Logos pilotés par `PARTNERS` ; QR piloté par `--mode/--slug`. Plus aucun re-render complet
  pour un changement de logo ou de QR.

> Vidéo « complete » bergerie (avec musique CapCut) : `build_bergerie_video_test.py <src> <out> <slug>`
> suit déjà ce principe (1 passe ffmpeg, audio intact). Il ne reste qu'à régénérer le clip
> mur-de-logos en 7 logos (nds_lib.PARTNERS) puis stamper le QR pro voulu.
