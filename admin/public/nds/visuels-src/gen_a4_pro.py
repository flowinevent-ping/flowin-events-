# -*- coding: utf-8 -*-
# A4 print (300 DPI, 2480x3508) charte kinetique validee — 1 par pro avec SON QR (sa station)
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W, H = 2480, 3508
OUT = "/home/claude/vid/a4"; os.makedirs(OUT, exist_ok=True)
BG = (9, 16, 32); AMBER = (244, 181, 68); WHITE = (255, 255, 255)
MAGENTA = (230, 24, 127); DARKTXT = (24, 16, 44)

def _beam(pts, col, s, b):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(b)); a = np.asarray(m, np.float32) / 255.0 * s
    return np.stack([a * col[0], a * col[1], a * col[2]], -1)
def _radial(cx, cy, rad, col, s):
    yy, xx = np.ogrid[0:H, 0:W]; d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
    g = np.clip(1 - d, 0, 1) ** 2 * s
    return np.stack([g * col[0], g * col[1], g * col[2]], -1)

def make_bg():
    base = np.zeros((H, W, 3), np.float32)
    for i in range(3): base[:, :, i] = BG[i]
    acc = np.zeros((H, W, 3), np.float32)
    acc += _beam([(W * 0.30, -120), (W * 0.04, H * 0.52), (W * 0.26, H * 0.52)], (165, 48, 100), 1.0, 200)
    acc += _beam([(W * 0.58, -120), (W * 0.32, H * 0.50), (W * 0.62, H * 0.50)], (120, 42, 120), 0.9, 200)
    acc += _beam([(W * 0.84, -120), (W * 0.62, H * 0.52), (W * 1.04, H * 0.46)], (180, 44, 116), 1.05, 196)
    acc += _radial(W * 0.60, H * 0.10, W * 0.34, (150, 40, 95), 0.5)
    acc += _radial(W * 0.50, H * 0.50, W * 0.55, (46, 62, 122), 0.42)
    acc += _radial(W * 0.16, H * 0.74, W * 0.50, (22, 96, 92), 0.40)
    acc += _radial(W * 0.84, H * 0.80, W * 0.45, (70, 52, 30), 0.20)
    out = np.clip(base + acc, 0, 255).astype(np.uint8)
    return Image.fromarray(out, "RGB").convert("RGBA")

def ctext(d, cx, cy, txt, size, col, w=800):
    d.text((cx, cy), txt, font=L.font(size, w), fill=col, anchor="mm")

def wrap(d, cx, cy, txt, size, col, maxw, lh, w=700):
    fnt = L.font(size, w); words = txt.split(); lines = []; cur = ""
    for word in words:
        test = (cur + " " + word).strip()
        if L.measure(test, fnt)[0] > maxw and cur: lines.append(cur); cur = word
        else: cur = test
    if cur: lines.append(cur)
    y = cy - (len(lines) - 1) * lh / 2
    for ln in lines:
        d.text((cx, y), ln, font=fnt, fill=col, anchor="mm"); y += lh
    return len(lines)

def step_pill(img, idx, label, cx, cy, w, h):
    pill = Image.new("RGBA", (w, h), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    px = pill.load()
    c0, c1 = (230, 24, 127), (140, 50, 205)
    grad = Image.new("RGBA", (w, h)); gp = grad.load()
    for x in range(w):
        f = x / (w - 1)
        cc = (int(c0[0]+(c1[0]-c0[0])*f), int(c0[1]+(c1[1]-c0[1])*f), int(c0[2]+(c1[2]-c0[2])*f), 255)
        for y in range(h): gp[x, y] = cc
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rounded_rectangle([0,0,w-1,h-1], radius=int(h*0.30), fill=255)
    pill = Image.composite(grad, pill, m); pd = ImageDraw.Draw(pill)
    # numero dans un rond blanc
    r = int(h*0.34); pd.ellipse([int(h*0.22)-r, h//2-r, int(h*0.22)+r, h//2+r], fill=(255,255,255,255))
    pd.text((int(h*0.22), h//2), str(idx), font=L.font(int(h*0.42), 800), fill=MAGENTA, anchor="mm")
    pd.text((int(h*0.66), h//2), label, font=L.font(int(h*0.30), 800), fill=WHITE, anchor="lm")
    img.alpha_composite(pill, (int(cx-w/2), int(cy-h/2)))

def qr_card(img, qr_path, cx, cy, qsz):
    qr = Image.open(qr_path).convert("RGB").resize((qsz, qsz), Image.NEAREST)
    pad = int(qsz*0.07); cw = qsz + pad*2
    card = Image.new("RGBA", (cw, cw), (0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,cw-1,cw-1], radius=int(cw*0.06), fill=(255,255,255,255))
    card.paste(qr, (pad, pad))
    img.alpha_composite(card, (int(cx-cw/2), int(cy-cw/2)))

_BGCACHE = [None]
def a4(qr_path, commerce, fname, bon_label="chez votre commerce"):
    if _BGCACHE[0] is None: _BGCACHE[0] = make_bg()
    img = _BGCACHE[0].copy(); d = ImageDraw.Draw(img)
    L.put_logo(img, W/2, H*0.080, 1.00)
    ctext(d, W/2, H*0.150, "JOUEZ & GAGNEZ", 150, WHITE)
    ctext(d, W/2, H*0.190, "pendant les Nuits du Sud", 78, AMBER, 700)
    # nom commerce
    wrap(d, W/2, H*0.240, commerce, 88, WHITE, int(W*0.84), 104, 800)
    # QR
    qr_card(img, qr_path, W/2, H*0.450, 1000)
    # badge Flash le QR (sous la carte)
    bf = L.font(92, 800)
    fw = L.measure("Flash ", bf)[0] + L.measure("le QR", bf)[0]
    x0 = W/2 - fw/2
    d.text((x0, H*0.638), "Flash ", font=bf, fill=AMBER, anchor="lm")
    d.text((x0 + L.measure("Flash ", bf)[0], H*0.638), "le QR", font=bf, fill=WHITE, anchor="lm")
    # 1-2-3
    pw, ph = int(W*0.78), 148
    step_pill(img, 1, "Flashe le QR avec ton téléphone", W/2, H*0.700, pw, ph)
    step_pill(img, 2, "Joue le quiz (4 bonnes réponses)", W/2, H*0.752, pw, ph)
    step_pill(img, 3, "Cumule des points & gagne", W/2, H*0.804, pw, ph)
    # lots
    ctext(d, W/2, H*0.862, "À GAGNER", 86, AMBER)
    wrap(d, W/2, H*0.900, "Des places de concert · un bon d'achat " + bon_label, 60, WHITE, int(W*0.88), 74, 700)
    ctext(d, W/2, H*0.938, "+ grand tirage à la clôture du festival", 56, MAGENTA, 700)
    # signature + contact (sans nom Romain Collin)
    ctext(d, W/2, H*0.968, L.SIGN, 68, WHITE)
    ctext(d, W/2, H*0.988, L.CONTACT, 48, (190, 196, 224), 600)
    p = f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(300, 300)); return p

# Liste pilotee par la SOURCE UNIQUE nds_lib.PARTNERS + NAMES (plus de liste en dur).
# QR = station/physique HD de chaque pro (/home/claude/vid/qr/<slug>_hd.png).
if __name__ == "__main__":
    n = 0
    for slug in L.PARTNERS:
        com = L.NAMES.get(slug, slug)
        qr = f"/home/claude/vid/qr/{slug}_hd.png"
        print("OK", a4(qr, com, f"nds_a4_{slug}", f"chez {com}"))
        n += 1
    print("DONE", n)
