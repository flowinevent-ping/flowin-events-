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

def _icon(cd, kind, x, y, s, col=WHITE):
    w = col + (255,)
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
DARKTXT = (24, 16, 44)
def gain_card(base, cx, cy, w, h, grad, icon, label, title, prog, dark=False):
    a = eo(min(1, prog * 1.6))
    txt_col = DARKTXT if dark else WHITE
    lbl_col = DARKTXT + (210,) if dark else (255, 255, 255, 230)
    chip_fill = (255, 255, 255, 235) if dark else (255, 255, 255, 55)
    icon_col = DARKTXT if dark else WHITE
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    # degrade horizontal
    grad_img = Image.new("RGBA", (w, h), (0, 0, 0, 0)); gpx = grad_img.load()
    c0, c1 = grad
    for x in range(w):
        f = x / (w - 1)
        col = (int(c0[0] + (c1[0] - c0[0]) * f), int(c0[1] + (c1[1] - c0[1]) * f), int(c0[2] + (c1[2] - c0[2]) * f), 255)
        for y in range(h): gpx[x, y] = col
    mask = Image.new("L", (w, h), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], radius=int(h * 0.20), fill=255)
    card = Image.composite(grad_img, card, mask); cd = ImageDraw.Draw(card)
    # chip icone (carre arrondi clair)
    isz = int(h * 0.40); ix, iy = int(h * 0.22), int((h - isz) / 2)
    cd.rounded_rectangle([ix, iy, ix + isz, iy + isz], radius=int(isz * 0.30), fill=chip_fill)
    _icon(cd, icon, ix + isz * 0.16, iy + isz * 0.12, isz * 0.72, col=icon_col)
    tx = ix + isz + int(h * 0.24)
    lines = title.split("\n")
    lbl_f = L.font(int(h * 0.135), 800)
    ttl_f = L.font(int(h * 0.215) if len(lines) > 1 else int(h * 0.235), 800)
    if len(lines) > 1:
        cd.text((tx, h * 0.24), label, font=lbl_f, fill=lbl_col, anchor="lm")
        cd.text((tx, h * 0.50), lines[0], font=ttl_f, fill=txt_col, anchor="lm")
        cd.text((tx, h * 0.74), lines[1], font=ttl_f, fill=txt_col, anchor="lm")
    else:
        cd.text((tx, h * 0.32), label, font=lbl_f, fill=lbl_col, anchor="lm")
        cd.text((tx, h * 0.60), lines[0], font=ttl_f, fill=txt_col, anchor="lm")
    s = 0.85 + 0.15 * eo(prog); nw, nh = int(w * s), int(h * s)
    cr = card.resize((nw, nh), Image.LANCZOS); al = cr.split()[3].point(lambda p: int(p * a)); cr.putalpha(al)
    xo = int((1 - eo(prog)) * 60)
    base.alpha_composite(cr, (int(cx - nw / 2) - xo, int(cy - nh / 2)))

# ---- badge QR persistant : QR + 'Flash'(ambre)/'le QR'(blanc) a droite, AGRANDI ----
def qr_badge(base, t, qr_img=None, qsz=380):
    qr_img = qr_img if qr_img is not None else QR
    ap = eo(ramp(t, 1.0, 1.6))
    if ap <= 0: return
    pad = 26
    cw = qsz + pad * 2
    card = Image.new("RGBA", (cw, cw), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, cw - 1, cw - 1], radius=44, fill=(255, 255, 255, 252))
    card.paste(qr_img.resize((qsz, qsz), Image.NEAREST), (pad, pad))
    # texte a droite : 'Flash' ambre / 'le QR' blanc
    fF = L.font(72, 800); fL = L.font(64, 800)
    tw = max(L.measure("Flash", fF)[0], L.measure("le QR", fL)[0]) + 30
    grp_w = cw + 24 + tw
    bx = W - grp_w - 44; by = H - cw - 120
    if ap < 1:
        al = card.split()[3].point(lambda p: int(p * ap)); card.putalpha(al)
    base.alpha_composite(card, (bx, by))
    d = ImageDraw.Draw(base)
    txc = (int(244*ap), int(181*ap), int(68*ap)) if ap < 1 else AMBER
    whc = (int(255*ap),)*3 if ap < 1 else WHITE
    tcx = bx + cw + 24
    d.text((tcx, by + cw * 0.40), "Flash", font=fF, fill=txc, anchor="lm")
    d.text((tcx, by + cw * 0.62), "le QR", font=fL, fill=whc, anchor="lm")

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

def station_pill(base, txt, cx, cy, w, h, prog):
    a = int(255 * eo(min(1, prog * 1.6)))
    if a <= 0: return
    pill = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gpx = Image.new("RGBA", (w, h), (0, 0, 0, 0)); px = gpx.load()
    c0, c1 = (230, 24, 127), (140, 50, 205)
    for x in range(w):
        f = x / (w - 1)
        cc = (int(c0[0] + (c1[0]-c0[0])*f), int(c0[1] + (c1[1]-c0[1])*f), int(c0[2] + (c1[2]-c0[2])*f), 255)
        for y in range(h): px[x, y] = cc
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, w-1, h-1], radius=int(h*0.34), fill=255)
    pill = Image.composite(gpx, pill, m)
    ImageDraw.Draw(pill).text((w/2, h/2), txt, font=L.font(int(h*0.42), 800), fill=WHITE, anchor="mm")
    s = 0.8 + 0.2 * eo(prog); nw, nh = int(w*s), int(h*s)
    pr = pill.resize((nw, nh), Image.LANCZOS); al = pr.split()[3].point(lambda p: int(p*a/255)); pr.putalpha(al)
    base.alpha_composite(pr, (int(cx-nw/2), int(cy-nh/2)))

def name_card(base, l1, l2, cx, cy, w, h, prog):
    a = int(255 * eo(min(1, prog * 1.5)))
    if a <= 0: return
    card = Image.new("RGBA", (w, h), (0, 0, 0, 0)); cd = ImageDraw.Draw(card)
    cd.rounded_rectangle([0, 0, w-1, h-1], radius=int(min(w, h)*0.16), fill=(255, 255, 255, 255))
    cd.text((w/2, h*0.36), l1, font=L.font(int(h*0.18), 700), fill=(90, 90, 110), anchor="mm")
    cd.text((w/2, h*0.64), l2, font=L.font(int(h*0.27), 800), fill=DARKTXT, anchor="mm")
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(w*s), int(h*s)
    cr = card.resize((nw, nh), Image.LANCZOS); al = cr.split()[3].point(lambda p: int(p*a/255)); cr.putalpha(al)
    yo = int((1 - eo(prog)) * 30); base.alpha_composite(cr, (int(cx-nw/2), int(cy-nh/2)+yo))

PARTNERS = ["bergerie", "pegase", "utile", "carrosserie-gp"]
DUR = 40.0; NF = int(DUR * FPS)

def finale_qr(base, lt, qr_img=None):
    qr_img = qr_img if qr_img is not None else QR
    ap = eo(ramp(lt, 0.25, 0.8)); qsz = 820
    if ap <= 0.02: return
    q = qr_img.resize((qsz, qsz), Image.NEAREST)
    cwq = qsz + 72
    card = Image.new("RGBA", (cwq, cwq), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle([0, 0, cwq - 1, cwq - 1], radius=48, fill=(255, 255, 255, 255))
    card.paste(q, (36, 36))
    s = 0.82 + 0.18 * ap; nw = int(cwq * s)
    cr = card.resize((nw, nw), Image.LANCZOS)
    al = cr.split()[3].point(lambda px: int(px * ap)); cr.putalpha(al)
    base.alpha_composite(cr, (int(W / 2 - nw / 2), int(H * 0.30)))

def qr_overlay(img, t, qr_img=None):
    # ajoute le QR (badge persistant OU finale) — separe de scene() pour compositing par QR
    if t < 29.5:
        if t >= 1.6: qr_badge(img, t, qr_img)
    else:
        finale_qr(img, t - 29.5, qr_img)
    return img

def scene(t):
    # TOUT sauf le QR (badge + carte finale), pour rendu base reutilisable
    img = make_bg(t)
    if t < 3.0:                                    # INTRO
        L.put_logo(img, W / 2, H * 0.30, 0.56 * eo(ramp(t, 0.1, 0.7)), alpha=eo(ramp(t, 0.1, 0.6)))
        if t > 0.7: pop(img, tl("LE GRAND JEU", 96, WHITE), W / 2, H * 0.50, ramp(t, 0.7, 1.2))
        if t > 1.1: pop(img, tl("DU FESTIVAL", 96, AMBER), W / 2, H * 0.585, ramp(t, 1.1, 1.6))
        if t > 1.8: pop(img, tl("9 → 18 juillet · Vence", 46, WHITE), W / 2, H * 0.66, ramp(t, 1.8, 2.3))
    elif t < 7.6:                                  # FLASH. JOUE. GAGNE.
        lt = t - 3.0
        for (w, c, d0), y in zip([("FLASH.", AMBER, 0.0), ("JOUE.", WHITE, 0.7), ("GAGNE.", MAGENTA, 1.4)], [H * 0.32, H * 0.47, H * 0.62]):
            p = ramp(lt, d0, d0 + 0.55)
            if p > 0: pop(img, tl(w, 168, c), W / 2, y, p, 0.5)
    elif t < 13.5:                                 # GAINS — cartes degradees (comme la ref)
        lt = t - 7.6
        pop(img, tl("À GAGNER", 66, AMBER), W / 2, H * 0.16, ramp(lt, 0.0, 0.45))
        gain_card(img, W / 2, H * 0.34, int(W * 0.86), 200, ((230, 24, 127), (130, 60, 205)), "music", "DES PLACES DE", "Concert", ramp(lt, 0.4, 0.95))
        gain_card(img, W / 2, H * 0.52, int(W * 0.86), 256, ((246, 196, 74), (232, 150, 40)), "gift", "DES BONS D'ACHAT", "chez nos partenaires\nlocaux", ramp(lt, 0.9, 1.45), dark=True)
        if lt > 2.2: pop(img, tl("+ grand tirage final", 50, WHITE), W / 2, H * 0.69, ramp(lt, 2.2, 2.7))
    elif t < 18.5:                                 # FLASH AUX STATIONS (libelle ref)
        lt = t - 13.5
        pop(img, tl("FLASH AUX", 96, WHITE), W / 2, H * 0.22, ramp(lt, 0.0, 0.45))
        pop(img, tl("STATIONS", 96, AMBER), W / 2, H * 0.295, ramp(lt, 0.15, 0.6))
        pw, ph = int(W * 0.40), 132; gx = W * 0.5
        cells = [("Bar", -1, 0), ("Entrée", 1, 0), ("Brigade verte", -1, 1), ("Écran", 1, 1)]
        for i, (s, dx, row) in enumerate(cells):
            station_pill(img, s, gx + dx * (pw / 2 + 18), H * (0.43 + row * 0.13), pw, ph, ramp(lt, 0.7 + i * 0.22, 1.1 + i * 0.22))
    elif t < 23.0:                                 # CUMULE / REMPORTE (comme ref r010)
        lt = t - 18.5
        pop(img, tl("CUMULE", 132, AMBER), W / 2, H * 0.32, ramp(lt, 0.0, 0.5))
        pop(img, tl("TES POINTS", 132, WHITE), W / 2, H * 0.42, ramp(lt, 0.25, 0.75))
        pop(img, tl("REMPORTE", 132, MAGENTA), W / 2, H * 0.55, ramp(lt, 0.7, 1.2))
        pop(img, tl("LES LOTS !", 132, MAGENTA), W / 2, H * 0.65, ramp(lt, 0.9, 1.4))
    elif t < 29.5:                                 # PARTENAIRES AVEC LOGOS + GIORDANO (5e)
        lt = t - 23.0
        pop(img, tl("ET DANS LES COMMERCES", 60, AMBER), W / 2, H * 0.14, ramp(lt, 0.0, 0.45))
        pop(img, tl("nos partenaires locaux", 44, WHITE), W / 2, H * 0.205, ramp(lt, 0.2, 0.65))
        tw, th = 392, 226; gx, gy = W * 0.5, H * 0.40
        pos = [(-1, -1), (1, -1), (-1, 1), (1, 1)]
        for i, slug in enumerate(PARTNERS):
            dx, dy = pos[i]
            logo_tile(img, slug, gx + dx * (tw / 2 + 22), gy + dy * (th / 2 + 22), tw, th, ramp(lt, 0.5 + i * 0.24, 0.95 + i * 0.24))
        # 5e partenaire : Electromenager Giordano (pas de logo fourni -> carte nom)
        name_card(img, "Électroménager", "Giordano", gx, H * 0.665, int(tw * 1.18), 150, ramp(lt, 1.5, 1.95))
    else:                                          # FINALE — titre + texte (QR ajoute par finale_qr)
        lt = t - 29.5
        pop(img, tl("FLASH LE QR", 116, AMBER), W / 2, H * 0.18, ramp(lt, 0.0, 0.45))
        if lt > 0.9: pop(img, tl("ce soir & dans les commerces !", 50, WHITE), W / 2, H * 0.78, ramp(lt, 0.9, 1.35))
    return img

def frame(t, qr_img=None):
    img = scene(t)
    qr_overlay(img, t, qr_img)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    mode = sys.argv[3] if len(sys.argv) > 3 else "full"
    outdir = sys.argv[4] if len(sys.argv) > 4 else OUT
    os.makedirs(outdir, exist_ok=True)
    for i in range(a, min(b, NF)):
        t = i / FPS
        im = scene(t) if mode == "base" else frame(t)
        im.convert("RGB").save(f"{outdir}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", mode, a, min(b, NF))
