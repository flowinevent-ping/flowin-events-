# -*- coding: utf-8 -*-
# Presentation / FB 16x9 — DERIVE de render_kref40 (meme charte, memes helpers cartes/pills/giordano)
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter
import render_kref40 as R
from render_kref40 import (eo, ramp, clamp, tl, pop, gain_card, station_pill,
                           name_card, logo_tile, AMBER, WHITE, MAGENTA, BG, QR, PARTNERS)

W, H, FPS = 1920, 1080, 24
OUT = "/home/claude/vid/fk16"; os.makedirs(OUT, exist_ok=True)
DUR = 40.0; NF = int(DUR * FPS)

def _beam(pts, col, strength, blur):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m, np.float32) / 255.0 * strength
    return np.stack([a * col[0], a * col[1], a * col[2]], -1)

def _radial(cx, cy, rad, col, strength):
    yy, xx = np.ogrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
    g = np.clip(1 - d, 0, 1) ** 2 * strength
    return np.stack([g * col[0], g * col[1], g * col[2]], -1)

_BG = {}
def make_bg(t):
    key = round(t * 2)
    if key in _BG: return _BG[key].copy()
    pulse = 0.92 + 0.08 * math.sin(key / 2 * 1.3)
    base = np.zeros((H, W, 3), np.float32)
    for i in range(3): base[:, :, i] = BG[i]
    acc = np.zeros((H, W, 3), np.float32)
    # faisceaux haut (paysage) magenta/violet
    acc += _beam([(W * 0.22, -60), (W * 0.04, H * 0.70), (W * 0.20, H * 0.70)], (165, 48, 100), 1.0 * pulse, 90)
    acc += _beam([(W * 0.42, -60), (W * 0.26, H * 0.66), (W * 0.50, H * 0.66)], (120, 42, 120), 0.9 * pulse, 90)
    acc += _beam([(W * 0.70, -60), (W * 0.54, H * 0.70), (W * 0.86, H * 0.62)], (180, 44, 116), 1.05 * pulse, 88)
    acc += _radial(W * 0.55, H * 0.10, W * 0.30, (150, 40, 95), 0.5 * pulse)
    acc += _radial(W * 0.45, H * 0.55, W * 0.55, (46, 62, 122), 0.45)
    acc += _radial(W * 0.12, H * 0.80, W * 0.50, (22, 96, 92), 0.42)
    acc += _radial(W * 0.85, H * 0.85, W * 0.45, (70, 52, 30), 0.22)
    out = np.clip(base + acc, 0, 255).astype(np.uint8)
    im = Image.fromarray(out, "RGB").convert("RGBA")
    _BG[key] = im.copy()
    return im

# panneau QR droit persistant
def qr_panel(base, t, qsz=420):
    ap = eo(ramp(t, 1.0, 1.6))
    if ap <= 0: return
    pad = 30; cw = qsz + pad * 2
    card = Image.new("RGBA", (cw, cw), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, cw - 1, cw - 1], radius=48, fill=(255, 255, 255, 252))
    card.paste(QR.resize((qsz, qsz), Image.NEAREST), (pad, pad))
    cx = int(W * 0.80); bx = int(cx - cw / 2); by = int(H * 0.30)
    if ap < 1:
        al = card.split()[3].point(lambda p: int(p * ap)); card.putalpha(al)
    base.alpha_composite(card, (bx, by))
    d = ImageDraw.Draw(base)
    txc = (int(244*ap), int(181*ap), int(68*ap)) if ap < 1 else AMBER
    whc = (int(255*ap),)*3 if ap < 1 else WHITE
    d.text((cx, by + cw + 56), "Flash", font=L.font(76, 800), fill=txc, anchor="mm")
    d.text((cx, by + cw + 132), "le QR", font=L.font(76, 800), fill=whc, anchor="mm")

CX = W * 0.36   # colonne contenu gauche

def frame(t):
    img = make_bg(t)
    show = True
    if t < 3.0:
        L.put_logo(img, CX, H * 0.34, 0.70 * eo(ramp(t, 0.1, 0.7)), alpha=eo(ramp(t, 0.1, 0.6)))
        if t > 0.7: pop(img, tl("LE GRAND JEU", 104, WHITE), CX, H * 0.62, ramp(t, 0.7, 1.2))
        if t > 1.1: pop(img, tl("DU FESTIVAL", 104, AMBER), CX, H * 0.74, ramp(t, 1.1, 1.6))
        if t > 1.8: pop(img, tl("9 → 18 juillet · Vence", 48, WHITE), CX, H * 0.86, ramp(t, 1.8, 2.3))
        show = t > 1.6
    elif t < 7.6:
        lt = t - 3.0
        for (w, c, d0), y in zip([("FLASH.", AMBER, 0.0), ("JOUE.", WHITE, 0.7), ("GAGNE.", MAGENTA, 1.4)], [H * 0.30, H * 0.52, H * 0.74]):
            p = ramp(lt, d0, d0 + 0.55)
            if p > 0: pop(img, tl(w, 150, c), CX, y, p, 0.5)
    elif t < 13.5:
        lt = t - 7.6
        pop(img, tl("À GAGNER", 64, AMBER), CX, H * 0.18, ramp(lt, 0.0, 0.45))
        gain_card(img, CX, H * 0.42, int(W * 0.58), 180, ((230, 24, 127), (130, 60, 205)), "music", "DES PLACES DE", "Concert", ramp(lt, 0.4, 0.95))
        gain_card(img, CX, H * 0.66, int(W * 0.58), 228, ((246, 196, 74), (232, 150, 40)), "gift", "DES BONS D'ACHAT", "chez nos partenaires\nlocaux", ramp(lt, 0.9, 1.45), dark=True)
        if lt > 2.2: pop(img, tl("+ grand tirage final", 46, WHITE), CX, H * 0.88, ramp(lt, 2.2, 2.7))
    elif t < 18.5:
        lt = t - 13.5
        pop(img, tl("FLASH AUX", 96, WHITE), CX, H * 0.18, ramp(lt, 0.0, 0.45))
        pop(img, tl("STATIONS", 96, AMBER), CX, H * 0.31, ramp(lt, 0.15, 0.6))
        pw, ph = int(W * 0.27), 130
        cells = [("Bar", -1, 0), ("Entrée", 1, 0), ("Brigade verte", -1, 1), ("Écran", 1, 1)]
        for i, (s, dx, row) in enumerate(cells):
            station_pill(img, s, CX + dx * (pw / 2 + 18), H * (0.52 + row * 0.20), pw, ph, ramp(lt, 0.7 + i * 0.22, 1.1 + i * 0.22))
    elif t < 23.0:
        lt = t - 18.5
        pop(img, tl("CUMULE", 120, AMBER), CX, H * 0.28, ramp(lt, 0.0, 0.5))
        pop(img, tl("TES POINTS", 120, WHITE), CX, H * 0.44, ramp(lt, 0.25, 0.75))
        pop(img, tl("REMPORTE", 120, MAGENTA), CX, H * 0.62, ramp(lt, 0.7, 1.2))
        pop(img, tl("LES LOTS !", 120, MAGENTA), CX, H * 0.78, ramp(lt, 0.9, 1.4))
    elif t < 29.5:
        lt = t - 23.0
        pop(img, tl("ET DANS LES COMMERCES", 56, AMBER), CX, H * 0.13, ramp(lt, 0.0, 0.45))
        pop(img, tl("nos partenaires locaux", 42, WHITE), CX, H * 0.22, ramp(lt, 0.2, 0.65))
        tw, th = 340, 196; gy = H * 0.46
        pos = [(-1, -1), (1, -1), (-1, 1), (1, 1)]
        for i, slug in enumerate(PARTNERS):
            dx, dy = pos[i]
            logo_tile(img, slug, CX + dx * (tw / 2 + 20), gy + dy * (th / 2 + 18), tw, th, ramp(lt, 0.5 + i * 0.24, 0.95 + i * 0.24))
        name_card(img, "Électroménager", "Giordano", CX, H * 0.83, int(tw * 1.15), 132, ramp(lt, 1.5, 1.95))
    else:
        lt = t - 29.5; show = False
        pop(img, tl("FLASH LE QR", 120, AMBER), W / 2, H * 0.18, ramp(lt, 0.0, 0.45))
        ap = eo(ramp(lt, 0.25, 0.8)); qsz = 560
        if ap > 0.02:
            q = QR.resize((qsz, qsz), Image.NEAREST); cwq = qsz + 64
            card = Image.new("RGBA", (cwq, cwq), (0, 0, 0, 0))
            ImageDraw.Draw(card).rounded_rectangle([0, 0, cwq - 1, cwq - 1], radius=44, fill=(255, 255, 255, 255))
            card.paste(q, (32, 32))
            s = 0.82 + 0.18 * ap; nw = int(cwq * s)
            cr = card.resize((nw, nw), Image.LANCZOS); al = cr.split()[3].point(lambda px: int(px * ap)); cr.putalpha(al)
            img.alpha_composite(cr, (int(W / 2 - nw / 2), int(H * 0.28)))
        if lt > 0.9: pop(img, tl("ce soir & dans les commerces !", 46, WHITE), W / 2, H * 0.90, ramp(lt, 0.9, 1.35))
    if show:
        qr_panel(img, t)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", a, min(b, NF))
