# -*- coding: utf-8 -*-
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw

W, H, FPS = 1080, 1920, 24
OUT = "/home/claude/vid/fe40"; os.makedirs(OUT, exist_ok=True)
QR = Image.open("/home/claude/vid/qr/ecrans_hd.png").convert("RGB")
LOGOS = {k: f"/home/claude/vid/logos/{k}.png" for k in L.PARTNERS}   # source unique: nds_lib.PARTNERS

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def ramp(t, a, b):
    if b <= a: return 1.
    return clamp((t - a) / (b - a))

_bg = {}
def bg(t):
    key = round(t * 3)
    if key in _bg: return _bg[key].copy()
    pulse = 0.5 + 0.5 * math.sin(key / 3 * 2.0)
    base = L.bg(W, H, glow_cy=0.34, glow_strength=0.85 + 0.4 * pulse)
    _bg[key] = base.copy()
    return base.copy()

def tl(txt, fnt, color): return L.text_layer(txt, fnt, color)

def pop(base, layer, cx, cy, prog, sf=0.6, alpha=255):
    s = sf + (1 - sf) * eo(prog); a = int(alpha * eo(min(1., prog * 1.6)))
    lw, lh = layer.size; nw, nh = max(1, int(lw * s)), max(1, int(lh * s))
    lr = layer.resize((nw, nh), Image.LANCZOS)
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 40); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def chip(base, txt, cx, cy, prog, fill=L.ORANGE):
    fnt = L.font(48, 800); layer = tl(txt, fnt, L.WHITE); lw, lh = layer.size
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(lw * s), int(lh * s)
    pill = Image.new("RGBA", (nw + 76, nh + 32), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    a = int(255 * eo(min(1, prog * 1.5)))
    pd.rounded_rectangle([0, 0, nw + 75, nh + 31], radius=(nh + 31) // 2, fill=fill + (int(0.95 * a),))
    lr = layer.resize((nw, nh), Image.LANCZOS); al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    pill.alpha_composite(lr, (38, 16)); yo = int((1 - eo(prog)) * 28)
    base.alpha_composite(pill, (int(cx - (nw + 76) / 2), int(cy - (nh + 32) / 2) + yo))

def logo_tile(base, slug, cx, cy, w, h, prog):
    card = L.logo_card(LOGOS[slug], w, h)
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(w * s), int(h * s)
    lr = card.resize((nw, nh), Image.LANCZOS)
    a = int(255 * eo(min(1, prog * 1.5)))
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 30); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

# ---- Bande QR persistante en bas (grande, scannable) ----
def qr_band(base, t):
    appear = eo(ramp(t, 1.2, 1.8))
    if appear <= 0: return
    bw, bh = int(W * 0.90), 340
    bx, by = int((W - bw) / 2), int(H * 0.775)
    band = Image.new("RGBA", (bw, bh), (0, 0, 0, 0)); bd = ImageDraw.Draw(band)
    bd.rounded_rectangle([0, 0, bw - 1, bh - 1], radius=44, fill=(255, 255, 255, 255))
    qsz = 280; q = QR.resize((qsz, qsz), Image.NEAREST)
    band.paste(q, (40, int((bh - qsz) / 2)))
    # texte a droite du QR
    tx = 40 + qsz + 46
    bd.text((tx, bh * 0.30), "FLASHE-MOI", font=L.font(72, 800), fill=L.NAVY_TOP, anchor="lm")
    bd.text((tx, bh * 0.52), "joue · réponds · gagne", font=L.font(40, 700), fill=(60, 50, 90), anchor="lm")
    bd.text((tx, bh * 0.70), "places de concert + bons d'achat", font=L.font(33, 600), fill=L.ORANGE, anchor="lm")
    if appear < 1.0:
        al = band.split()[3].point(lambda p: int(p * appear)); band.putalpha(al)
    yo = int((1 - appear) * 50)
    base.alpha_composite(band, (bx, by + yo))

PARTNERS = ["bergerie", "pegase", "utile", "carrosserie-gp"]
DUR = 40.0; NF = int(DUR * FPS)
TOP = 0.74  # le contenu kinetique vit au-dessus de la bande QR

def frame(t):
    img = bg(t)
    # --- contenu kinetique (zone haute) ---
    if t < 3.2:                                   # INTRO
        L.put_logo(img, W / 2, H * 0.16, 0.58 * eo(ramp(t, 0.1, 0.7)), alpha=eo(ramp(t, 0.1, 0.6)))
        if t > 0.7: pop(img, tl("LE GRAND JEU", L.font(112, 800), L.WHITE), W / 2, H * 0.36, ramp(t, 0.7, 1.2), 0.5)
        if t > 1.1: pop(img, tl("DU FESTIVAL", L.font(112, 800), L.ORANGE), W / 2, H * 0.45, ramp(t, 1.1, 1.6), 0.5)
        if t > 1.7: pop(img, tl("9 → 18 juillet · Vence", L.font(50, 600), L.TEAL), W / 2, H * 0.55, ramp(t, 1.7, 2.2), 0.7)
    elif t < 7.0:                                 # FLASH JOUE GAGNE
        lt = t - 3.2
        for (w, c, d0), y in zip([("FLASH", L.ORANGE, 0.0), ("JOUE", L.WHITE, 0.4), ("GAGNE", L.TEAL, 0.8)], [H * 0.20, H * 0.36, H * 0.52]):
            p = ramp(lt, d0, d0 + 0.5)
            if p > 0: pop(img, tl(w, L.font(168, 800), c), W / 2, y, p, 0.45)
    elif t < 12.0:                                # A GAGNER (texte kinetique)
        lt = t - 7.0
        pop(img, tl("À GAGNER", L.font(82, 700), L.TEAL), W / 2, H * 0.135, ramp(lt, 0.0, 0.4), 0.6)
        pop(img, tl("DES PLACES", L.font(124, 800), L.WHITE), W / 2, H * 0.27, ramp(lt, 0.3, 0.8), 0.55)
        pop(img, tl("DE CONCERT", L.font(124, 800), L.ORANGE), W / 2, H * 0.38, ramp(lt, 0.45, 0.95), 0.55)
        if lt > 1.2:
            pop(img, tl("+ DES BONS D'ACHAT", L.font(70, 800), L.WHITE), W / 2, H * 0.52, ramp(lt, 1.2, 1.7), 0.6)
            pop(img, tl("chez nos commerces partenaires", L.font(42, 600), L.TEAL), W / 2, H * 0.595, ramp(lt, 1.4, 1.9), 0.7)
        if lt > 3.0:
            pop(img, tl("+ GRAND TIRAGE FINAL", L.font(56, 800), L.TEAL), W / 2, H * 0.66, ramp(lt, 3.0, 3.5), 0.6)
    elif t < 17.0:                                # FLASHE PARTOUT + stations animees
        lt = t - 12.0
        pop(img, tl("FLASHE PARTOUT", L.font(92, 800), L.WHITE), W / 2, H * 0.135, ramp(lt, 0.0, 0.45), 0.55)
        pop(img, tl("au festival", L.font(52, 600), L.TEAL), W / 2, H * 0.205, ramp(lt, 0.2, 0.6), 0.7)
        for i, (s, y) in enumerate(zip(["LE BAR", "L'ENTRÉE", "LA BRIGADE VERTE", "L'ÉCRAN"], [H * 0.31, H * 0.41, H * 0.51, H * 0.61])):
            chip(img, s, W / 2, y, ramp(lt, 0.7 + i * 0.30, 1.1 + i * 0.30))
    elif t < 21.5:                                # CUMULE / REMPORTE
        lt = t - 17.0
        pop(img, tl("CUMULE TES POINTS", L.font(84, 800), L.WHITE), W / 2, H * 0.28, ramp(lt, 0.0, 0.5), 0.55)
        pop(img, tl("REMPORTE LES LOTS !", L.font(96, 800), L.ORANGE), W / 2, H * 0.42, ramp(lt, 0.4, 0.9), 0.5)
    elif t < 28.0:                                # PARTENAIRES AVEC LOGOS
        lt = t - 21.5
        pop(img, tl("ET DANS LES COMMERCES", L.font(64, 800), L.TEAL), W / 2, H * 0.115, ramp(lt, 0.0, 0.45), 0.6)
        pop(img, tl("nos partenaires locaux", L.font(44, 600), L.WHITE), W / 2, H * 0.175, ramp(lt, 0.2, 0.65), 0.7)
        tw, th = 392, 230; gx, gy = W * 0.5, H * 0.46
        # grille auto pilotee par nds_lib.PARTNERS
        for i, (slug, cx, cy, ltw, lth) in enumerate(L.logo_grid(L.PARTNERS, gx, H * 0.52, W * 0.90, H * 0.52)):
            logo_tile(img, slug, cx, cy, ltw, lth, ramp(lt, 0.5 + i * 0.14, 0.95 + i * 0.14))
    else:                                         # FINALE QR plein cadre
        lt = t - 28.0
        pop(img, tl("FLASH LE QR", L.font(120, 800), L.ORANGE), W / 2, H * 0.12, ramp(lt, 0.0, 0.45), 0.5)
        p = eo(ramp(lt, 0.25, 0.9)); qsz = int(680 * p)
        if qsz > 4:
            q = QR.resize((qsz, qsz), Image.NEAREST); card = Image.new("RGBA", (qsz + 56, qsz + 56), (255, 255, 255, 255)); card.paste(q, (28, 28))
            img.alpha_composite(card, (int(W / 2 - (qsz + 56) / 2), int(H * 0.24)))
        if lt > 1.0: pop(img, tl("ce soir & dans les commerces", L.font(48, 700), L.WHITE), W / 2, H * 0.70, ramp(lt, 1.0, 1.4), 0.7)
    # --- bande QR persistante (sauf pendant la finale plein cadre) ---
    if t < 28.0:
        qr_band(img, t)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", a, min(b, NF))
