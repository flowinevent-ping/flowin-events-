# -*- coding: utf-8 -*-
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw

W, H, FPS = 1920, 1080, 24
OUT = "/home/claude/vid/fp16"; os.makedirs(OUT, exist_ok=True)
QR = Image.open("/home/claude/vid/qr/ecrans_hd.png").convert("RGB")
LOGOS = {k: f"/home/claude/vid/logos/{k}.png" for k in ["bergerie", "pegase", "utile", "carrosserie-gp"]}
CX = int(W * 0.345)  # centre de la zone contenu (gauche du panneau QR)

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
    base = L.bg(W, H, glow_cy=0.45, glow_strength=0.85 + 0.4 * pulse)
    _bg[key] = base.copy()
    return base.copy()

def tl(txt, fnt, color): return L.text_layer(txt, fnt, color)

def pop(base, layer, cx, cy, prog, sf=0.6):
    s = sf + (1 - sf) * eo(prog); a = int(255 * eo(min(1., prog * 1.6)))
    lw, lh = layer.size; nw, nh = max(1, int(lw * s)), max(1, int(lh * s))
    lr = layer.resize((nw, nh), Image.LANCZOS)
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 30); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def chip(base, txt, cx, cy, prog, fill=L.ORANGE):
    fnt = L.font(40, 800); layer = tl(txt, fnt, L.WHITE); lw, lh = layer.size
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(lw * s), int(lh * s)
    pill = Image.new("RGBA", (nw + 64, nh + 26), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    a = int(255 * eo(min(1, prog * 1.5)))
    pd.rounded_rectangle([0, 0, nw + 63, nh + 25], radius=(nh + 25) // 2, fill=fill + (int(0.95 * a),))
    lr = layer.resize((nw, nh), Image.LANCZOS); al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    pill.alpha_composite(lr, (32, 13)); base.alpha_composite(pill, (int(cx - (nw + 64) / 2), int(cy - (nh + 26) / 2)))

def logo_tile(base, slug, cx, cy, w, h, prog):
    card = L.logo_card(LOGOS[slug], w, h)
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(w * s), int(h * s)
    lr = card.resize((nw, nh), Image.LANCZOS); a = int(255 * eo(min(1, prog * 1.5)))
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2)))

def qr_panel(base, t):
    appear = eo(ramp(t, 1.0, 1.6))
    if appear <= 0: return
    pw, ph = int(W * 0.27), int(H * 0.86)
    px, py = int(W * 0.695), int((H - ph) / 2)
    panel = Image.new("RGBA", (pw, ph), (0, 0, 0, 0)); pd = ImageDraw.Draw(panel)
    pd.rounded_rectangle([0, 0, pw - 1, ph - 1], radius=40, fill=(255, 255, 255, 255))
    pd.text((pw / 2, ph * 0.12), "FLASHE-MOI", font=L.font(58, 800), fill=L.NAVY_TOP, anchor="mm")
    qsz = int(pw * 0.74); q = QR.resize((qsz, qsz), Image.NEAREST)
    panel.paste(q, (int((pw - qsz) / 2), int(ph * 0.20)))
    pd.text((pw / 2, ph * 0.82), "joue · réponds · gagne", font=L.font(34, 700), fill=(60, 50, 90), anchor="mm")
    pd.text((pw / 2, ph * 0.90), "places de concert + bons d'achat", font=L.font(26, 600), fill=L.ORANGE, anchor="mm")
    if appear < 1.0:
        al = panel.split()[3].point(lambda p: int(p * appear)); panel.putalpha(al)
    xo = int((1 - appear) * 50)
    base.alpha_composite(panel, (px + xo, py))

PARTNERS = ["bergerie", "pegase", "utile", "carrosserie-gp"]
DUR = 40.0; NF = int(DUR * FPS)

def frame(t):
    img = bg(t)
    if t < 3.2:
        L.put_logo(img, CX, H * 0.30, 0.50 * eo(ramp(t, 0.1, 0.7)), alpha=eo(ramp(t, 0.1, 0.6)))
        if t > 0.7: pop(img, tl("LE GRAND JEU", L.font(96, 800), L.WHITE), CX, H * 0.56, ramp(t, 0.7, 1.2), 0.5)
        if t > 1.1: pop(img, tl("DU FESTIVAL", L.font(96, 800), L.ORANGE), CX, H * 0.70, ramp(t, 1.1, 1.6), 0.5)
        if t > 1.7: pop(img, tl("9 → 18 juillet · Vence", L.font(44, 600), L.TEAL), CX, H * 0.84, ramp(t, 1.7, 2.2), 0.7)
    elif t < 7.0:
        lt = t - 3.2
        for (w, c, d0), y in zip([("FLASH", L.ORANGE, 0.0), ("JOUE", L.WHITE, 0.4), ("GAGNE", L.TEAL, 0.8)], [H * 0.28, H * 0.50, H * 0.72]):
            p = ramp(lt, d0, d0 + 0.5)
            if p > 0: pop(img, tl(w, L.font(130, 800), c), CX, y, p, 0.45)
    elif t < 12.0:
        lt = t - 7.0
        pop(img, tl("À GAGNER", L.font(60, 700), L.TEAL), CX, H * 0.16, ramp(lt, 0.0, 0.4), 0.6)
        pop(img, tl("DES PLACES", L.font(104, 800), L.WHITE), CX, H * 0.36, ramp(lt, 0.3, 0.8), 0.55)
        pop(img, tl("DE CONCERT", L.font(104, 800), L.ORANGE), CX, H * 0.50, ramp(lt, 0.45, 0.95), 0.55)
        if lt > 1.2:
            pop(img, tl("+ DES BONS D'ACHAT", L.font(58, 800), L.WHITE), CX, H * 0.68, ramp(lt, 1.2, 1.7), 0.6)
            pop(img, tl("chez nos commerces partenaires", L.font(38, 600), L.TEAL), CX, H * 0.78, ramp(lt, 1.4, 1.9), 0.7)
        if lt > 3.0:
            pop(img, tl("+ GRAND TIRAGE FINAL", L.font(48, 800), L.TEAL), CX, H * 0.90, ramp(lt, 3.0, 3.5), 0.6)
    elif t < 17.0:
        lt = t - 12.0
        pop(img, tl("FLASHE PARTOUT", L.font(72, 800), L.WHITE), CX, H * 0.16, ramp(lt, 0.0, 0.45), 0.55)
        pop(img, tl("au festival", L.font(40, 600), L.TEAL), CX, H * 0.26, ramp(lt, 0.2, 0.6), 0.7)
        for i, s in enumerate(["LE BAR", "L'ENTRÉE", "LA BRIGADE VERTE", "L'ÉCRAN"]):
            chip(img, s, CX, H * (0.42 + i * 0.135), ramp(lt, 0.7 + i * 0.30, 1.1 + i * 0.30))
    elif t < 21.5:
        lt = t - 17.0
        pop(img, tl("CUMULE TES POINTS", L.font(66, 800), L.WHITE), CX, H * 0.40, ramp(lt, 0.0, 0.5), 0.55)
        pop(img, tl("REMPORTE LES LOTS !", L.font(78, 800), L.ORANGE), CX, H * 0.58, ramp(lt, 0.4, 0.9), 0.5)
    elif t < 28.0:
        lt = t - 21.5
        pop(img, tl("ET DANS LES COMMERCES", L.font(50, 800), L.TEAL), CX, H * 0.13, ramp(lt, 0.0, 0.45), 0.6)
        pop(img, tl("nos partenaires locaux", L.font(36, 600), L.WHITE), CX, H * 0.22, ramp(lt, 0.2, 0.65), 0.7)
        tw, th = 300, 176
        pos = [(-1, -1), (1, -1), (-1, 1), (1, 1)]
        for i, slug in enumerate(PARTNERS):
            dx, dy = pos[i]
            lx = CX + dx * (tw / 2 + 20); ly = H * 0.56 + dy * (th / 2 + 20)
            logo_tile(img, slug, lx, ly, tw, th, ramp(lt, 0.5 + i * 0.30, 0.95 + i * 0.30))
    else:
        lt = t - 28.0
        pop(img, tl("FLASH LE QR", L.font(96, 800), L.ORANGE), CX, H * 0.30, ramp(lt, 0.0, 0.45), 0.5)
        pop(img, tl("ce soir & dans", L.font(56, 800), L.WHITE), CX, H * 0.52, ramp(lt, 0.5, 0.95), 0.6)
        pop(img, tl("les commerces", L.font(56, 800), L.WHITE), CX, H * 0.63, ramp(lt, 0.6, 1.05), 0.6)
    qr_panel(img, t)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", a, min(b, NF))
