# Sources maîtres / éditables — NDS 2026 (manifeste)

> 📍 **Carte complète des livrables** (sources → maîtres → téléchargeables, par type) :
> `docs/INDEX-LIVRABLES-nds2026.md` dans le repo. Ce manifeste en est le résumé public.

Où trouver les sources MODIFIABLES de chaque élément (Canva/CapCut) dans ce repo :

- **Canva (SVG éditables)** : `admin/public/nds/kit-digital/svg/` → `nds_a4_<slug>.svg` (6 A4) + `forex_70x70_caisse-1/2/3.svg` (+ `.pptx` éditables).
- **Scripts maîtres (re-render)** : `admin/public/nds/visuels-src/` → `gen_a4_clean.py` (A4 v10, source de vérité), `gen_forex.py`, `gen_tickets.py`, `gen_svg.py`, `nds_lib.py`, `render_kref40.py` (charte vidéo), `render_partners_v2.py` (mur logos), `render_pres16x9.py`, `render_ecran40.py`, `render_social1x1.py`, `kinetic/`.
- **Vidéos (clips)** : `admin/public/nds/visuels/nds-pro-<slug>-9x16.mp4` + `kit-digital/nds/nds-{insta-9x16,fb-16x9,ecrans-9x16,partenaire-16x9}.mp4`. Sources vidéo committées : `visuels-src/sources-video/`.
- **Assets** : `admin/public/nds/logo_nds_blanc_hd.png`, `partenaires/<slug>.png`, QR HD régénérables (URL lue dans `cfg->>'qrUrl'`).
- **Polices** : Manrope (`ofl/manrope`), Anton (`ofl/anton`).

Bundle téléchargeable complet (SVG + scripts + assets + fonts + vidéos) : `sources-maitres-nds2026.zip`.
Charte : navy #0a1020 / ambre #f4b544 / teal #20e0c4 / magenta #e6187f · Manrope + Anton.
Pas de projet CapCut natif (.draft) : vidéos générées par script → demander un re-render pour toute variante.
