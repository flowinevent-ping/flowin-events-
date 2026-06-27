# -*- coding: utf-8 -*-
import sys, os; sys.path.insert(0, "/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw

OUT = "/home/claude/vid/client"; os.makedirs(OUT, exist_ok=True)
QR = Image.open("/home/claude/vid/qr/ev-nds-ecrans.png").convert("RGB")

def dotline(img, cx, y, txt, fnt):
    # cercle teal dessine + texte blanc, bloc centre
    d = ImageDraw.Draw(img)
    tw, th = L.measure(txt, fnt)
    r = max(5, int(th * 0.16)); gap = int(th * 0.55)
    total = r * 2 + gap + tw
    x0 = cx - total / 2
    d.ellipse([x0, y - r, x0 + 2 * r, y + r], fill=L.TEAL)
    d.text((x0 + 2 * r + gap, y), txt, font=fnt, fill=L.WHITE, anchor="lm")

def carre():
    W = H = 1080
    img = L.bg(W, H, glow_cy=0.30); d = ImageDraw.Draw(img)
    L.put_logo(img, W/2, H*0.10, 0.40)
    L.ctext(img, W/2, H*0.205, "FLASH · JOUE · GAGNE", L.font(76, 800), L.WHITE)
    L.ctext(img, W/2, H*0.275, "Le grand jeu du festival", L.font(40, 600), L.TEAL)
    L.chip(img, W/2, H*0.345, "À GAGNER", L.font(38, 800), fill=L.ORANGE)
    for i, t in enumerate(["Des places de concert chaque soir",
                            "Grand tirage : 2 Pass Nuits du Sud 2027",
                            "Des bons d'achat chez nos commerces"]):
        dotline(img, W/2, H*(0.43 + i*0.062), t, L.font(34, 600))
    L.put_qr(img, QR, W/2, H*0.715, 250, border=18)
    L.ctext(img, W/2, H*0.865, "Scanne · joue · cumule tes points", L.font(38, 700), L.WHITE)
    L.ctext(img, W/2, H*0.945, "9 → 18 juillet · Vence", L.font(34, 600), (200, 206, 232))
    p = f"{OUT}/carre_1080x1080.png"; img.convert("RGB").save(p, quality=95); return p

def story():
    W, H = 1080, 1920
    img = L.bg(W, H, glow_cy=0.26); d = ImageDraw.Draw(img)
    L.put_logo(img, W/2, H*0.105, 0.46)
    L.ctext(img, W/2, H*0.205, "FLASH", L.font(150, 800), L.ORANGE)
    L.ctext(img, W/2, H*0.275, "JOUE · GAGNE", L.font(96, 800), L.WHITE)
    L.ctext(img, W/2, H*0.335, "Le grand jeu du festival", L.font(44, 600), L.TEAL)
    L.chip(img, W/2, H*0.405, "À GAGNER", L.font(40, 800), fill=L.ORANGE)
    for i, t in enumerate(["Des places de concert chaque soir",
                           "Grand tirage : 2 Pass Nuits du Sud 2027",
                           "Des bons d'achat chez nos commerces"]):
        dotline(img, W/2, H*(0.475 + i*0.05), t, L.font(38, 600))
    L.put_qr(img, QR, W/2, H*0.715, 360, border=24)
    L.ctext(img, W/2, H*0.860, "Scanne-moi · joue · cumule", L.font(46, 700), L.WHITE)
    L.ctext(img, W/2, H*0.920, "9 → 18 juillet · Vence", L.font(38, 600), (200, 206, 232))
    p = f"{OUT}/story_1080x1920.png"; img.convert("RGB").save(p, quality=95); return p

print("OK", carre())
print("OK", story())
