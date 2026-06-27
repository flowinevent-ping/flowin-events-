# -*- coding: utf-8 -*-
# A4 client en boutique (2480x3508, 300dpi) — DESIGN "JOUEZ ICI" valide (navy/teal/orange)
# par commerce : QR de la station + lot du commerce. Ordre : annonce jeu -> cadeaux -> jouez ici + lot -> cumule -> grand tirage.
import sys, os; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw

W, H = 2480, 3508
OUT = "/home/claude/vid/a4"; os.makedirs(OUT, exist_ok=True)
NAVY_TOP = (12, 16, 64); NAVY_BOT = (44, 18, 86)
ORANGE = (255, 122, 26); TEAL = (32, 224, 196); WHITE = (255, 255, 255); AMBER = (244, 181, 68)

def make_bg():
    ys = np.linspace(0, 1, H)[:, None, None]
    top = np.array(NAVY_TOP, np.float32); bot = np.array(NAVY_BOT, np.float32)
    arr = np.repeat((top[None, None, :] + (bot - top)[None, None, :] * ys), W, axis=1)
    yy, xx = np.ogrid[0:H, 0:W]
    cx, cy = W * 0.5, H * 0.40; maxr = min(W, H) * 0.78
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / maxr
    g = np.clip(1 - d, 0, 1) ** 1.5 * 0.34
    org = np.array(ORANGE, np.float32)
    arr = arr * (1 - g[:, :, None]) + org[None, None, :] * g[:, :, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

def ct(d, cx, y, txt, size, col, w=800):
    d.text((cx, y), txt, font=L.font(size, w), fill=col, anchor="mm")

def wrap(d, cx, y, txt, size, col, maxw, lh, w=600):
    fnt = L.font(size, w); words = txt.split(); lines = []; cur = ""
    for word in words:
        t = (cur + " " + word).strip()
        if L.measure(t, fnt)[0] > maxw and cur: lines.append(cur); cur = word
        else: cur = t
    if cur: lines.append(cur)
    yy = y - (len(lines) - 1) * lh / 2
    for ln in lines:
        d.text((cx, yy), ln, font=fnt, fill=col, anchor="mm"); yy += lh

def gift_chip(img, cx, cy, txt, fill):
    d = ImageDraw.Draw(img); fnt = L.font(58, 800)
    tw = L.measure(txt, fnt)[0]; w = tw + 130; h = 116
    pill = Image.new("RGBA", (w, h), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=fill + (255,))
    pd.text((w / 2, h / 2), txt, font=fnt, fill=(14, 14, 28) if fill == AMBER or fill == TEAL else WHITE, anchor="mm")
    img.alpha_composite(pill, (int(cx - w / 2), int(cy - h / 2)))
    return w

def qr_card(img, qr_path, cx, cy, qsz):
    qr = Image.open(qr_path).convert("RGB").resize((qsz, qsz), Image.NEAREST)
    pad = int(qsz * 0.06); cw = qsz + pad * 2
    card = Image.new("RGBA", (cw, cw), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle([0, 0, cw - 1, cw - 1], radius=int(cw * 0.05), fill=(255, 255, 255, 255))
    card.paste(qr, (pad, pad))
    img.alpha_composite(card, (int(cx - cw / 2), int(cy - cw / 2)))

_BG = [None]
def a4(qr_path, commerce, lot, fname):
    if _BG[0] is None: _BG[0] = make_bg()
    img = _BG[0].copy(); d = ImageDraw.Draw(img)
    L.put_logo(img, W / 2, H * 0.075, 1.02)
    ct(d, W / 2, H * 0.145, "GRAND JEU", 130, TEAL, 700)
    ct(d, W / 2, H * 0.205, "FLASH", 296, ORANGE, 800)
    ct(d, W / 2, H * 0.272, "JOUE · GAGNE", 186, WHITE, 800)
    # cadeaux (2 chips)
    g1 = "Places de concert"; g2 = "Bons d'achat"
    w1 = L.measure(g1, L.font(58, 800))[0] + 130
    w2 = L.measure(g2, L.font(58, 800))[0] + 130
    gap = 40; total = w1 + w2 + gap
    gift_chip(img, W / 2 - total / 2 + w1 / 2, H * 0.333, g1, TEAL)
    gift_chip(img, W / 2 + total / 2 - w2 / 2, H * 0.333, g2, ORANGE)
    # jouez ici + commerce + lot
    ct(d, W / 2, H * 0.392, "Jouez ici, chez " + commerce, 64, WHITE, 700)
    ct(d, W / 2, H * 0.428, "Tentez de gagner : " + lot, 60, AMBER, 800)
    # QR
    qr_card(img, qr_path, W / 2, H * 0.598, 900)
    bf = L.font(78, 800)
    fw = L.measure("Flash ", bf)[0] + L.measure("le QR", bf)[0]; x0 = W / 2 - fw / 2
    d.text((x0, H * 0.765), "Flash ", font=bf, fill=AMBER, anchor="lm")
    d.text((x0 + L.measure("Flash ", bf)[0], H * 0.765), "le QR", font=bf, fill=WHITE, anchor="lm")
    # cumule
    wrap(d, W / 2, H * 0.828, "Cumule tes points en jouant chez les partenaires et aux concerts des Nuits du Sud", 54, WHITE, int(W * 0.86), 70, 600)
    ct(d, W / 2, H * 0.892, "+ grand tirage à la clôture du festival", 58, TEAL, 700)
    ct(d, W / 2, H * 0.952, "Nuits du Sud · 9 → 18 juillet 2026 · Vence", 46, WHITE, 700)
    ct(d, W / 2, H * 0.978, "Jeu gratuit · sans obligation d'achat", 40, (200, 206, 230), 600)
    p = f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(300, 300)); return p

PARTNERS = [
    ("/home/claude/vid/qr/bergerie_hd.png",       "Domaine de la Bergerie",    "1 nuit offerte au camping",      "nds_a4_bergerie"),
    ("/home/claude/vid/qr/pegase_hd.png",         "Auto-Moto-École Pégase",    "un lot dans ce commerce",        "nds_a4_pegase"),
    ("/home/claude/vid/qr/utile_hd.png",          "Utile Vence",               "un bon d'achat",                 "nds_a4_utile"),
    ("/home/claude/vid/qr/carrosserie-gp_hd.png", "Carrosserie GP",            "un bon d'achat révision",        "nds_a4_carrosserie-gp"),
    ("/home/claude/vid/qr/giordano_hd.png",       "Électroménager Giordano",   "un bon d'achat",                 "nds_a4_giordano"),
]

if __name__ == "__main__":
    for qr, com, lot, fn in PARTNERS:
        print("OK", a4(qr, com, lot, fn))
    print("DONE", len(PARTNERS))
