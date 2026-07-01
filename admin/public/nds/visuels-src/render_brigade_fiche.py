# -*- coding: utf-8 -*-
"""Fiche QR tablette Brigade Verte (NDS 2026) — charte kinetique NDS/Flowin.
Portrait iPad 1536x2048. Logo NDS + wordmark Flowin en haut, titre brigade,
QR au centre sur cartouche blanc, dates en bas. 3 fiches (brigade 1/2/3)."""
import os, sys
sys.path.insert(0, "/home/claude/vid")
from PIL import Image, ImageDraw
import nds_lib as L

W, H = 1536, 2048
OUT = "/home/claude/vid/out"; os.makedirs(OUT, exist_ok=True)
ORANGE, TEAL, WHITE = L.ORANGE, L.TEAL, L.WHITE
MUTE = (176, 184, 214)


def wordmark_flowin(size, color=ORANGE):
    """Rend 'Flowin' en Manrope 800 -> layer RGBA (trim)."""
    f = L.font(size, 800)
    layer = L.text_layer("Flowin", f, color + (255,))
    bb = layer.split()[3].getbbox()
    return layer.crop(bb) if bb else layer


def cobrand(base, cy):
    """Lockup horizontal centre : [logo NDS]  |  [Flowin]."""
    target_h = 130
    # logo NDS dimensionne par hauteur
    lscale = target_h / L.LOGO.height
    lw = int(L.LOGO.width * lscale); lh = int(L.LOGO.height * lscale)
    wm = wordmark_flowin(96)
    gap = 46; divider_w = 4; dgap = 46
    total = lw + gap + divider_w + dgap + wm.width
    x = W / 2 - total / 2
    # logo NDS
    L.put_logo(base, x + lw / 2, cy, lscale)
    x += lw + gap
    # divider vertical
    d = ImageDraw.Draw(base)
    dh = int(target_h * 0.72)
    d.line([(x + divider_w / 2, cy - dh / 2), (x + divider_w / 2, cy + dh / 2)],
           fill=(255, 255, 255, 90), width=divider_w)
    x += divider_w + dgap
    # wordmark Flowin (centre vertical)
    base.alpha_composite(wm, (int(x), int(cy - wm.height / 2)))


def fiche(n):
    base = L.bg(W, H, glow_cy=0.40, glow_strength=1.05)
    d = ImageDraw.Draw(base)

    # 1) co-brand haut
    cobrand(base, cy=235)

    # 2) eyebrow + titre brigade
    L.chip(base, W / 2, 440, "NUITS DU SUD 2026", L.font(38, 800),
           fill=ORANGE, fg=WHITE, padx=40, pady=18)
    L.ctext(base, W / 2, 585, "BRIGADE VERTE", L.font(94, 800), WHITE + (255,))
    # numero dans une pastille teal (pas de chevauchement avec le QR)
    L.chip(base, W / 2, 700, "N\u00b0 %d" % n, L.font(66, 800),
           fill=TEAL, fg=(9, 16, 32), padx=52, pady=20)

    # 3) QR au centre sur cartouche blanc
    qr = Image.open(f"/home/claude/vid/qr/brigade-{n}.png").convert("RGB")
    qr_cy = 1300
    L.put_qr(base, qr, W / 2, qr_cy, size=720, border=44)

    # 4) call to action sous le QR
    L.ctext(base, W / 2, 1775, "Scannez pour jouer", L.font(70, 800), WHITE + (255,))
    L.ctext(base, W / 2, 1852, "Répondez au quiz éco-citoyen et tentez de gagner un ticket",
            L.font(38, 600), TEAL + (255,))

    # 5) bas : dates + tagline
    d.text((W / 2, H - 128), "9 → 18 juillet 2026  ·  Vence",
           font=L.font(40, 700), fill=WHITE + (255,), anchor="mm")
    d.text((W / 2, H - 66), L.SIGN, font=L.font(30, 600), fill=MUTE + (255,), anchor="mm")

    out = f"{OUT}/fiche-brigade-{n}.png"
    base.convert("RGB").save(out)
    print("rendu", out)
    return out


if __name__ == "__main__":
    only = sys.argv[1] if len(sys.argv) > 1 else None
    for n in ([int(only)] if only else [1, 2, 3]):
        fiche(n)
