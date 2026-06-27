# -*- coding: utf-8 -*-
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw

W, H, FPS = 1080, 1920, 24
OUT = "/home/claude/vid/f40"; os.makedirs(OUT, exist_ok=True)
QR = Image.open("/home/claude/vid/qr/ev-nds-ecrans.png").convert("RGB")

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def ramp(t, a, b):
    if b <= a: return 1.
    return clamp((t - a) / (b - a))

_bg = {}
def bg(t):
    key = round(t * 3)
    if key in _bg: base = _bg[key].copy()
    else:
        pulse = 0.5 + 0.5 * math.sin(key / 3 * 2.0)
        base = L.bg(W, H, glow_cy=0.40, glow_strength=0.85 + 0.4 * pulse)
        _bg[key] = base.copy()
    return base

def pop(base, layer, cx, cy, prog, sf=0.6, alpha=255):
    s = sf + (1 - sf) * eo(prog); a = int(alpha * eo(min(1., prog * 1.6)))
    lw, lh = layer.size; nw, nh = max(1, int(lw * s)), max(1, int(lh * s))
    lr = layer.resize((nw, nh), Image.LANCZOS)
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 44); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def tl(txt, fnt, color): return L.text_layer(txt, fnt, color)

def chip(base, txt, cx, cy, prog, fill=L.ORANGE):
    fnt = L.font(46, 800); layer = tl(txt, fnt, L.WHITE); lw, lh = layer.size
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(lw * s), int(lh * s)
    pill = Image.new("RGBA", (nw + 70, nh + 30), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    a = int(255 * eo(min(1, prog * 1.5)))
    pd.rounded_rectangle([0, 0, nw + 69, nh + 29], radius=(nh + 29) // 2, fill=fill + (int(0.94 * a),))
    lr = layer.resize((nw, nh), Image.LANCZOS); al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    pill.alpha_composite(lr, (35, 15)); yo = int((1 - eo(prog)) * 30)
    base.alpha_composite(pill, (int(cx - (nw + 70) / 2), int(cy - (nh + 30) / 2) + yo))

def logo(base, cy, scale, fade):
    L.put_logo(base, W / 2, cy, scale, alpha=fade)

def badge(base, t):
    f = eo(ramp(t, 3.0, 3.6)); size = 150; q = QR.resize((size, size), Image.NEAREST); pad = 14
    card = Image.new("RGBA", (size + pad * 2, size + pad * 2), (255, 255, 255, int(238 * f))); card.paste(q, (pad, pad))
    base.alpha_composite(card, (W - size - pad * 2 - 40, 52))

PARTNERS = ["Domaine de la Bergerie", "Auto-Moto-École Pégase", "Utile Vence", "Carrosserie GP", "Électroménager J Giordano"]
STATIONS = ["LE BAR", "L'ENTRÉE", "LA BRIGADE VERTE", "L'ÉCRAN"]
DUR = 40.0; NF = int(DUR * FPS)

def frame(t):
    img = bg(t)
    if t < 3.0:                                   # INTRO
        logo(img, H * 0.32, 0.62 * eo(ramp(t, 0.1, 0.7)), eo(ramp(t, 0.1, 0.6)))
        if t > 0.7: pop(img, tl("LE GRAND JEU", L.font(110, 800), L.WHITE), W / 2, H * 0.50, ramp(t, 0.7, 1.2), 0.5)
        if t > 1.1: pop(img, tl("DU FESTIVAL", L.font(110, 800), L.ORANGE), W / 2, H * 0.59, ramp(t, 1.1, 1.6), 0.5)
        if t > 1.7: pop(img, tl("9 → 18 juillet · Vence", L.font(50, 600), L.TEAL), W / 2, H * 0.70, ramp(t, 1.7, 2.2), 0.7)
    elif t < 6.5:                                 # FLASH JOUE GAGNE
        lt = t - 3.0
        for (w, c, d0), y in zip([("FLASH", L.ORANGE, 0.0), ("JOUE", L.WHITE, 0.4), ("GAGNE", L.TEAL, 0.8)], [H * 0.34, H * 0.47, H * 0.60]):
            p = ramp(lt, d0, d0 + 0.5)
            if p > 0: pop(img, tl(w, L.font(150, 800), c), W / 2, y, p, 0.45)
    elif t < 11.0:                                # A GAGNER
        lt = t - 6.5
        pop(img, tl("À GAGNER", L.font(86, 700), L.TEAL), W / 2, H * 0.20, ramp(lt, 0.0, 0.4), 0.6)
        pop(img, tl("DES PLACES", L.font(124, 800), L.WHITE), W / 2, H * 0.36, ramp(lt, 0.3, 0.8), 0.55)
        pop(img, tl("DE CONCERT", L.font(124, 800), L.ORANGE), W / 2, H * 0.48, ramp(lt, 0.45, 0.95), 0.55)
        if lt > 1.0:
            pop(img, tl("+ DES BONS D'ACHAT", L.font(74, 800), L.WHITE), W / 2, H * 0.64, ramp(lt, 1.0, 1.5), 0.6)
            pop(img, tl("chez nos commerces partenaires", L.font(44, 600), L.TEAL), W / 2, H * 0.72, ramp(lt, 1.2, 1.7), 0.7)
        if lt > 2.6:
            pop(img, tl("+ GRAND TIRAGE FINAL", L.font(60, 800), L.TEAL), W / 2, H * 0.83, ramp(lt, 2.6, 3.1), 0.6)
    elif t < 16.0:                                # FLASHE PARTOUT + stations
        lt = t - 11.0
        pop(img, tl("FLASHE PARTOUT", L.font(96, 800), L.WHITE), W / 2, H * 0.20, ramp(lt, 0.0, 0.45), 0.55)
        pop(img, tl("au festival", L.font(56, 600), L.TEAL), W / 2, H * 0.285, ramp(lt, 0.2, 0.6), 0.7)
        for i, (s, y) in enumerate(zip(STATIONS, [H * 0.42, H * 0.52, H * 0.62, H * 0.72])):
            chip(img, s, W / 2, y, ramp(lt, 0.7 + i * 0.30, 1.1 + i * 0.30))
    elif t < 20.0:                                # CUMULE / REMPORTE
        lt = t - 16.0
        pop(img, tl("CUMULE TES POINTS", L.font(86, 800), L.WHITE), W / 2, H * 0.38, ramp(lt, 0.0, 0.5), 0.55)
        pop(img, tl("REMPORTE LES LOTS !", L.font(98, 800), L.ORANGE), W / 2, H * 0.52, ramp(lt, 0.4, 0.9), 0.5)
    elif t < 26.0:                                # COMMERCES PARTENAIRES (noms)
        lt = t - 20.0
        pop(img, tl("ET DANS LES COMMERCES", L.font(70, 800), L.TEAL), W / 2, H * 0.18, ramp(lt, 0.0, 0.45), 0.6)
        for i, name in enumerate(PARTNERS):
            p = ramp(lt, 0.5 + i * 0.5, 0.9 + i * 0.5)
            if p > 0: pop(img, tl(name, L.font(56, 700), L.WHITE), W / 2, H * (0.30 + i * 0.10), p, 0.7)
    elif t < 31.5:                                # COMMENT JOUER 1-2-3
        lt = t - 26.0
        pop(img, tl("COMMENT JOUER", L.font(80, 800), L.ORANGE), W / 2, H * 0.18, ramp(lt, 0.0, 0.4), 0.55)
        steps = ["1 · Flashe le QR", "2 · Réponds au quiz", "3 · Gagne tes lots"]
        for i, s in enumerate(steps):
            p = ramp(lt, 0.6 + i * 0.6, 1.0 + i * 0.6)
            if p > 0: pop(img, tl(s, L.font(66, 800), L.WHITE), W / 2, H * (0.36 + i * 0.13), p, 0.6)
    else:                                         # QR FINAL
        lt = t - 31.5
        pop(img, tl("FLASH LE QR", L.font(120, 800), L.ORANGE), W / 2, H * 0.16, ramp(lt, 0.0, 0.45), 0.5)
        p = eo(ramp(lt, 0.25, 0.9)); qsz = int(660 * p)
        if qsz > 4:
            q = QR.resize((qsz, qsz), Image.NEAREST); card = Image.new("RGBA", (qsz + 56, qsz + 56), (255, 255, 255, 255)); card.paste(q, (28, 28))
            img.alpha_composite(card, (int(W / 2 - (qsz + 56) / 2), int(H * 0.26)))
        if lt > 1.0: pop(img, tl("ce soir & dans les commerces", L.font(50, 700), L.WHITE), W / 2, H * 0.80, ramp(lt, 1.0, 1.4), 0.7)
        if lt > 1.4: logo(img, H * 0.90, 0.5 * eo(ramp(lt, 1.4, 1.9)), eo(ramp(lt, 1.4, 1.8)))
    if 3.0 <= t < 31.5: badge(img, t)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", a, min(b, NF))
