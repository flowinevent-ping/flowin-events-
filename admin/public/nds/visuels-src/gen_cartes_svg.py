# -*- coding: utf-8 -*-
"""
Génère les cartes QR en SVG VECTORIEL ÉDITABLE (Canva).
Chaque élément (fond, bordure, chip, textes, cadre, QR) = objet séparé.
- Textes = vrais <text> (police Manrope, éditable dans Canva)
- QR = <image> embarqué (seul raster, objet unique déplaçable/remplaçable)
- Couleurs samplées depuis les PNG de référence (jamais inventées) :
    navy #081020 · gris #788090 · amber #f4b544 · magenta #e6187f · carte blanche
Deux sorties par carte :
  - <out>.svg          → livrable Canva (font-family="Manrope" + font-weight)
  - <out>.preview.svg  → rendu d'aperçu (graisses statiques ManropeXB/SB/M)
"""
import base64, os, sys
from PIL import ImageFont

REPO = "/home/claude/flowin-events-"
KIT  = f"{REPO}/admin/public/nds/kit-digital"
FONTS = os.path.expanduser("~/.fonts")

NAVY   = "#081020"
GREY   = "#788090"
AMBER  = "#f4b544"
MAGENTA= "#e6187f"
WHITE  = "#ffffff"
FRAME_BG = "#f6f7fb"
FRAME_BD = "#e9ebf2"

W, H = 760, 1000

# rôle -> (famille_canva, poids_canva, famille_preview, taille_px PIL pour mesure)
def fam_canva(weight): return f'Manrope, Arial, sans-serif'
PREVIEW_FAM = {800: "ManropeXB", 700: "ManropeB", 600: "ManropeSB", 500: "ManropeM"}
PREVIEW_TTF = {800: "Manrope-XB.ttf", 700: "Manrope-B.ttf", 600: "Manrope-SB.ttf", 500: "Manrope-M.ttf"}

def b64(path):
    with open(path, "rb") as fh:
        return base64.b64encode(fh.read()).decode()

def esc(t):
    return t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def measure(txt, weight, size):
    f = ImageFont.truetype(f"{FONTS}/{PREVIEW_TTF[weight]}", size)
    box = f.getbbox(txt)
    return box[2] - box[0]

def fit_size(txt, weight, size, maxw):
    """réduit la taille jusqu'à tenir dans maxw."""
    s = size
    while s > 14 and measure(txt, weight, s) > maxw:
        s -= 2
    return s

def text(parts, cx, y, txt, weight, size, fill, preview,
         anchor="middle", spacing=None):
    fam = PREVIEW_FAM[weight] if preview else fam_canva(weight)
    extra = f' letter-spacing="{spacing}"' if spacing else ""
    wattr = "" if preview else f' font-weight="{weight}"'
    parts.append(
        f'<text x="{cx:.0f}" y="{y:.0f}" font-family="{fam}"{wattr} '
        f'font-size="{size}" fill="{fill}" text-anchor="{anchor}" '
        f'dominant-baseline="central"{extra}>{esc(txt)}</text>'
    )

def chip(parts, cx, cy, txt, fill, preview):
    weight, size = 800, 34
    tw = measure(txt, weight, size)
    padx, padh = 46, 64
    w = tw + padx * 2
    x = cx - w / 2
    y = cy - padh / 2
    parts.append(
        f'<rect x="{x:.0f}" y="{y:.0f}" width="{w:.0f}" height="{padh}" '
        f'rx="{padh/2:.0f}" ry="{padh/2:.0f}" fill="{fill}"/>'
    )
    text(parts, cx, cy + 2, txt, weight, size, WHITE, preview)

def build(slug, commerce, variant, qr_png, preview):
    accent = AMBER if variant == "station" else MAGENTA
    chip_txt = "EN BOUTIQUE" if variant == "station" else "EN LIGNE"
    sub_txt = ("Scanne le QR ici, en boutique" if variant == "station"
               else "Joue depuis chez toi")
    P = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
         f'viewBox="0 0 {W} {H}">']

    # 1. carte blanche + bordure accent (objet : Fond)
    P.append(f'<rect x="10" y="10" width="{W-20}" height="{H-20}" rx="40" ry="40" '
             f'fill="{WHITE}" stroke="{accent}" stroke-width="10"/>')

    # 2. eyebrow
    text(P, W/2, 64, "LE GRAND JEU DES NUITS DU SUD", 700, 25, GREY, preview, spacing="2.5")

    # 3. chip
    chip(P, W/2, 122, chip_txt, accent, preview)

    # 4. nom commerce (auto-fit largeur)
    nsize = fit_size(commerce, 800, 60, W-200)
    text(P, W/2, 208, commerce, 800, nsize, NAVY, preview)

    # 5. cadre QR (objet : Cadre)
    fx, fy, fw, fh = 143, 240, 474, 474
    P.append(f'<rect x="{fx}" y="{fy}" width="{fw}" height="{fh}" rx="30" ry="30" '
             f'fill="{FRAME_BG}" stroke="{FRAME_BD}" stroke-width="2"/>')

    # 6. QR embarqué (objet image unique, remplaçable)
    pad = 52
    qs = fw - pad * 2
    qx = fx + pad
    qy = fy + pad
    data = b64(qr_png)
    P.append(f'<image x="{qx}" y="{qy}" width="{qs}" height="{qs}" '
             f'href="data:image/png;base64,{data}" '
             f'style="image-rendering:pixelated"/>')

    # 7. accroche
    text(P, W/2, 768, "Flashe & joue", 800, 54, NAVY, preview)

    # 8. sous-titre
    text(P, W/2, 826, sub_txt, 500, 31, GREY, preview)

    # 9. footer
    text(P, W/2, 946, "Nuits du Sud \u00d7 Flowin \u00b7 flowinevent@gmail.com",
         500, 26, GREY, preview)

    P.append("</svg>")
    return "\n".join(P)

def run(slug, commerce):
    outdir = f"{KIT}/{slug}"
    for variant in ("station", "reseaux"):
        qr = f"{outdir}/qr-{variant}-{slug}.png"
        # livrable Canva
        svg = build(slug, commerce, variant, qr, preview=False)
        op = f"{outdir}/carte-qr-{variant}-{slug}.svg"
        open(op, "w").write(svg)
        # aperçu
        pv = build(slug, commerce, variant, qr, preview=True)
        pp = f"{outdir}/_preview-{variant}-{slug}.svg"
        open(pp, "w").write(pv)
        print("OK", op)

COMMERCES = [
    ("alafut",         "\u00c0 la F\u00fbt"),
    ("bergerie",       "Domaine de la Bergerie"),
    ("carrosserie-gp", "Carrosserie GP"),
    ("giordano",       "\u00c9lectrom\u00e9nager J Giordano"),
    ("pegase",         "Auto-Moto-\u00c9cole P\u00e9gase"),
    ("utile",          "Utile Vence"),
]

if __name__ == "__main__":
    for slug, com in COMMERCES:
        run(slug, com)
    print("DONE")
