# -*- coding: utf-8 -*-
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W, H, FPS = 1080, 1920, 24
OUT = "/home/claude/vid/fk40"; os.makedirs(OUT, exist_ok=True)
QR = Image.open("/home/claude/vid/qr/ecrans_hd.png").convert("RGB")
LOGOS = {k: f"/home/claude/vid/logos/{k}.png" for k in ["bergerie", "pegase", "utile", "carrosserie-gp"]}

BG = (9, 16, 32)
AMBER = (244, 181, 68)
WHITE = (255, 255, 255)
MAGENTA = (230, 24, 127)
PURPLE = (124, 58, 200)

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def ramp(t, a, b):
    return clamp((t - a) / (b - a)) if b > a else 1.

def _radial(cx, cy, rad, col, strength):
    yy, xx = np.ogrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
    g = np.clip(1 - d, 0, 1) ** 2 * strength
    return np.stack([g * col[0], g * col[1], g * col[2]], -1)

def _beam(pts, col, strength, blur):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m, np.float32) / 255.0 * strength
    return np.stack([a * col[0], a * col[1], a * col[2]], -1)

_BGCACHE = {}
def make_bg(t):
    # faisceaux quasi statiques + pulsation lente (cache par pas de 0.5s)
    key = round(t * 2)
    if key in _BGCACHE: return _BGCACHE[key].copy()
    pulse = 0.92 + 0.08 * math.sin(key / 2 * 1.3)
    base = np.zeros((H, W, 3), np.float32)
    for i in range(3): base[:, :, i] = BG[i]
    acc = np.zeros((H, W, 3), np.float32)
    # cones de spot (haut) — magenta / violet, definis
    acc += _beam([(W * 0.32, -60), (W * 0.04, H * 0.40), (W * 0.26, H * 0.40)], (165, 48, 100), 1.05 * pulse, 80)
    acc += _beam([(W * 0.56, -60), (W * 0.30, H * 0.38), (W * 0.60, H * 0.38)], (120, 42, 120), 0.95 * pulse, 80)
    acc += _beam([(W * 0.82, -60), (W * 0.60, H * 0.40), (W * 1.02, H * 0.32)], (180, 44, 116), 1.1 * pulse, 78)
    # coeur lumineux plus net en haut
    acc += _radial(W * 0.62, H * 0.12, W * 0.30, (150, 40, 95), 0.5 * pulse)
    # glows bas
    acc += _radial(W * 0.50, H * 0.46, W * 0.52, (46, 62, 122), 0.5)
    acc += _radial(W * 0.16, H * 0.64, W * 0.48, (22, 96, 92), 0.46)
    acc += _radial(W * 0.56, H * 0.70, W * 0.52, (70, 52, 30), 0.24)
    out = np.clip(base + acc, 0, 255).astype(np.uint8)
    im = Image.fromarray(out, "RGB").convert("RGBA")
    _BGCACHE[key] = im.copy()
    return im

def tl(txt, size, color, weight=800): return L.text_layer(txt, L.font(size, weight), color)

def pop(base, layer, cx, cy, prog, sf=0.55):
    s = sf + (1 - sf) * eo(prog); a = int(255 * eo(min(1., prog * 1.7)))
    lw, lh = layer.size; nw, nh = max(1, int(lw * s)), max(1, int(lh * s))
    lr = layer.resize((nw, nh), Image.LANCZOS)
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 34); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def _icon(cd, kind, x, y, s):
    w = WHITE + (255,)
    if kind == "music":
        r = int(s * 0.16)
        cd.ellipse([x + s*0.20 - r, y + s*0.66 - r, x + s*0.20 + r, y + s*0.66 + r], fill=w)
        cd.ellipse([x + s*0.66 - r, y + s*0.56 - r, x + s*0.66 + r, y + s*0.56 + r], fill=w)
        cd.line([(x + s*0.20 + r, y + s*0.66), (x + s*0.20 + r, y + s*0.26)], fill=w, width=max(3, int(s*0.07)))
        cd.line([(x + s*0.66 + r, y + s*0.56), (x + s*0.66 + r, y + s*0.16)], fill=w, width=max(3, int(s*0.07)))
        cd.line([(x + s*0.20 + r, y + s*0.26), (x + s*0.66 + r, y + s*0.16)], fill=w, width=max(3, int(s*0.07)))
    else:  # gift
        cd.rounded_rectangle([x + s*0.16, y + s*0.40, x + s*0.84, y + s*0.84], radius=int(s*0.06), fill=w)
        cd.rectangle([x + s*0.10, y + s*0.32, x + s*0.90, y + s*0.46], fill=w)
        cd.line([(x + s*0.50, y + s*0.32), (x + s*0.50, y + s*0.84)], fill=(0,0,0,90), width=max(2, int(s*0.05)))
        cd.line([(x + s*0.50, y + s*0.40), (x + s*0.30, y + s*0.20)], fill=w, width=max(2, int(s*0.05)))
        cd.line([(x + s*0.50, y + s*0.40), (x + s*0.70, y + s*0.20)], fill=w, width=max(2, int(s*0.05)))

# ---- carte gain (degrade + icone + label + titre) facon reference ----
def gain_card(base, cx, cy, w, h, grad, icon, label, title, prog):
    a = eo(min(1, prog * 1.6))
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    # degrade horizontal
    grad_img = Image.new("RGBA", (w, h), (0, 0, 0, 0)); gpx = grad_img.load()
    c0, c1 = grad
    for x in range(w):
        f = x / (w - 1)
        col = (int(c0[0] + (c1[0] - c0[0]) * f), int(c0[1] + (c1[1] - c0[1]) * f), int(c0[2] + (c1[2] - c0[2]) * f), 255)
        for y in range(h): gpx[x, y] = col
    mask = Image.new("L", (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=int(h * 0.26), fill=255)
    card = Image.composite(grad_img, card, mask); cd = ImageDraw.Draw(card)
    # chip icone
    isz = int(h * 0.46); ix, iy = int(h * 0.27), int((h - isz) / 2)
    cd.rounded_rectangle([ix, iy, ix + isz, iy + isz], radius=int(isz * 0.28), fill=(255, 255, 255, 55))
    _icon(cd, icon, ix + isz * 0.16, iy + isz * 0.12, isz * 0.7)
    tx = ix + isz + int(h * 0.28)
    cd.text((tx, h * 0.32), label, font=L.font(int(h * 0.15), 800), fill=(255, 255, 255, 230), anchor="lm")
    cd.text((tx, h * 0.60), title, font=L.font(int(h * 0.235), 800), fill=WHITE, anchor="lm")
    s = 0.85 + 0.15 * eo(prog); nw, nh = int(w * s), int(h * s)
    cr = card.resize((nw, nh), Image.LANCZOS); al = cr.split()[3].point(lambda p: int(p * a)); cr.putalpha(al)
    xo = int((1 - eo(prog)) * 60)
    base.alpha_composite(cr, (int(cx - nw / 2) - xo, int(cy - nh / 2)))

# ---- badge QR persistant (plus GRAND que la ref) ----
def qr_badge(base, t, big=False):
    ap = eo(ramp(t, 1.0, 1.6))
    if ap <= 0: return
    qsz = 300 if not big else 300
    pad = 26
    cw = qsz + pad * 2
    card = Image.new("RGBA", (cw, cw), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, cw - 1, cw - 1], radius=40, fill=(255, 255, 255, 250))
    card.paste(QR.resize((qsz, qsz), Image.NEAREST), (pad, pad))
    bx = W - cw - 40; by = H - cw - 150
    if ap < 1: 
        al = card.split()[3].point(lambda p: int(p * ap)); card.putalpha(al)
    base.alpha_composite(card, (bx, by))
    d = ImageDraw.Draw(base)
    d.text((bx + cw / 2, by + cw + 30), "Flashe-moi", font=L.font(52, 800), fill=AMBER, anchor="mm")

def logo_tile(base, slug, cx, cy, w, h, prog):
    card = L.logo_card(LOGOS[slug], w, h)
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(w * s), int(h * s)
    lr = card.resize((nw, nh), Image.LANCZOS); a = int(255 * eo(min(1, prog * 1.5)))
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 30); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def chip(base, txt, cx, cy, prog, fill=AMBER):
    layer = tl(txt, 50, BG); lw, lh = layer.size
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(lw * s), int(lh * s)
    pill = Image.new("RGBA", (nw + 80, nh + 34), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    a = int(255 * eo(min(1, prog * 1.5)))
    pd.rounded_rectangle([0, 0, nw + 79, nh + 33], radius=(nh + 33) // 2, fill=fill + (a,))
    lr = layer.resize((nw, nh), Image.LANCZOS); al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    pill.alpha_composite(lr, (40, 17)); base.alpha_composite(pill, (int(cx - (nw + 80) / 2), int(cy - (nh + 34) / 2)))

PARTNERS = ["bergerie", "pegase", "utile", "carrosserie-gp"]
DUR = 40.0; NF = int(DUR * FPS)

def frame(t):
    img = make_bg(t)
    show_badge = True
    if t < 3.0:                                    # INTRO
        L.put_logo(img, W / 2, H * 0.30, 0.56 * eo(ramp(t, 0.1, 0.7)), alpha=eo(ramp(t, 0.1, 0.6)))
        if t > 0.7: pop(img, tl("LE GRAND JEU", 96, WHITE), W / 2, H * 0.50, ramp(t, 0.7, 1.2))
        if t > 1.1: pop(img, tl("DU FESTIVAL", 96, AMBER), W / 2, H * 0.585, ramp(t, 1.1, 1.6))
        if t > 1.8: pop(img, tl("9 → 18 juillet · Vence", 46, WHITE), W / 2, H * 0.66, ramp(t, 1.8, 2.3))
        show_badge = t > 1.6
    elif t < 7.6:                                  # FLASH. JOUE. GAGNE.
        lt = t - 3.0
        for (w, c, d0), y in zip([("FLASH.", AMBER, 0.0), ("JOUE.", WHITE, 0.7), ("GAGNE.", MAGENTA, 1.4)], [H * 0.32, H * 0.47, H * 0.62]):
            p = ramp(lt, d0, d0 + 0.55)
            if p > 0: pop(img, tl(w, 168, c), W / 2, y, p, 0.5)
    elif t < 13.5:                                 # GAINS — cartes degradees (comme la ref)
        lt = t - 7.6
        pop(img, tl("À GAGNER", 66, AMBER), W / 2, H * 0.18, ramp(lt, 0.0, 0.45))
        gain_card(img, W / 2, H * 0.38, int(W * 0.86), 196, ((230, 24, 127), (110, 70, 210)), "♪", "DES PLACES DE", "Concert", ramp(lt, 0.4, 0.95))
        gain_card(img, W / 2, H * 0.55, int(W * 0.86), 220, ((246, 196, 74), (232, 150, 40)), "🎁", "DES BONS D'ACHAT", "chez nos partenaires", ramp(lt, 0.9, 1.45))
        if lt > 2.2: pop(img, tl("+ grand tirage final", 50, WHITE), W / 2, H * 0.70, ramp(lt, 2.2, 2.7))
    elif t < 18.5:                                 # FLASHE PARTOUT + stations
        lt = t - 13.5
        pop(img, tl("FLASHE PARTOUT", 88, WHITE), W / 2, H * 0.20, ramp(lt, 0.0, 0.45))
        pop(img, tl("au festival", 48, AMBER), W / 2, H * 0.275, ramp(lt, 0.2, 0.6))
        for i, s in enumerate(["LE BAR", "L'ENTRÉE", "LA BRIGADE VERTE", "L'ÉCRAN"]):
            chip(img, s, W / 2, H * (0.40 + i * 0.095), ramp(lt, 0.7 + i * 0.28, 1.1 + i * 0.28))
    elif t < 23.0:                                 # CUMULE / REMPORTE (comme ref r010)
        lt = t - 18.5
        pop(img, tl("CUMULE", 132, AMBER), W / 2, H * 0.32, ramp(lt, 0.0, 0.5))
        pop(img, tl("TES POINTS", 132, WHITE), W / 2, H * 0.42, ramp(lt, 0.25, 0.75))
        pop(img, tl("REMPORTE", 132, MAGENTA), W / 2, H * 0.55, ramp(lt, 0.7, 1.2))
        pop(img, tl("LES LOTS !", 132, MAGENTA), W / 2, H * 0.65, ramp(lt, 0.9, 1.4))
    elif t < 29.5:                                 # PARTENAIRES AVEC LOGOS (ajout)
        lt = t - 23.0
        pop(img, tl("ET DANS LES COMMERCES", 60, AMBER), W / 2, H * 0.16, ramp(lt, 0.0, 0.45))
        pop(img, tl("nos partenaires locaux", 44, WHITE), W / 2, H * 0.225, ramp(lt, 0.2, 0.65))
        tw, th = 392, 232; gx, gy = W * 0.5, H * 0.45
        pos = [(-1, -1), (1, -1), (-1, 1), (1, 1)]
        for i, slug in enumerate(PARTNERS):
            dx, dy = pos[i]
            logo_tile(img, slug, gx + dx * (tw / 2 + 22), gy + dy * (th / 2 + 22), tw, th, ramp(lt, 0.5 + i * 0.28, 0.95 + i * 0.28))
    else:                                          # FINALE — QR plein cadre
        lt = t - 29.5; show_badge = False
        pop(img, tl("FLASHE LE QR", 110, AMBER), W / 2, H * 0.16, ramp(lt, 0.0, 0.45))
        p = eo(ramp(lt, 0.25, 0.9)); qsz = int(720 * p)
        if qsz > 4:
            q = QR.resize((qsz, qsz), Image.NEAREST); card = Image.new("RGBA", (qsz + 64, qsz + 64), (255, 255, 255, 255)); card.paste(q, (32, 32))
            img.alpha_composite(card, (int(W / 2 - (qsz + 64) / 2), int(H * 0.27)))
        if lt > 1.0: pop(img, tl("ce soir & dans les commerces", 48, WHITE), W / 2, H * 0.74, ramp(lt, 1.0, 1.4))
    if show_badge:
        qr_badge(img, t)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", a, min(b, NF))
