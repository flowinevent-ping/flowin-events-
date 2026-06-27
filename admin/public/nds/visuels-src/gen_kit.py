# -*- coding: utf-8 -*-
import sys; sys.path.insert(0, "/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw
import os, textwrap

OUT = "/home/claude/vid/kit"; os.makedirs(OUT, exist_ok=True)

def wrap_center(img, cx, cy, txt, fnt, color, maxw, lh):
    # wrap manuel selon largeur pixel
    words = txt.split(); lines = []; cur = ""
    for w in words:
        test = (cur + " " + w).strip()
        tw, _ = L.measure(test, fnt)
        if tw > maxw and cur:
            lines.append(cur); cur = w
        else:
            cur = test
    if cur: lines.append(cur)
    y = cy - (len(lines) - 1) * lh / 2
    for ln in lines:
        L.ctext(img, cx, y, ln, fnt, color); y += lh

def kit(station_id, commerce, fname, W=1080, H=1350):
    img = L.bg(W, H, glow_cy=0.34, glow_strength=1.0)
    d = ImageDraw.Draw(img)
    L.put_logo(img, W/2, H*0.075, 0.34)
    L.ctext(img, W/2, H*0.150, "JOUEZ & GAGNEZ", L.font(64, 800), L.WHITE)
    L.ctext(img, W/2, H*0.195, "chez votre commerce", L.font(40, 600), (220, 224, 240))
    # nom commerce (chip teal large, wrap si long)
    wrap_center(img, W/2, H*0.265, commerce, L.font(50, 800), L.TEAL, int(W*0.82), 60)
    # QR
    qr = Image.open(f"/home/claude/vid/qr/{station_id}.png").convert("RGB")
    L.put_qr(img, qr, W/2, H*0.520, 440, border=26)
    L.chip(img, W/2, H*0.715, "FLASHEZ-MOI", L.font(44, 800), fill=L.ORANGE, padx=46, pady=18)
    # explication concept
    wrap_center(img, W/2, H*0.795, "Flashez le QR, jouez le quiz, cumulez des points et gagnez un bon d'achat ici.", L.font(38, 600), L.WHITE, int(W*0.84), 50)
    # tirage
    L.ctext(img, W/2, H*0.880, "+ grand tirage à la clôture du festival", L.font(36, 700), L.TEAL)
    # signature + contact
    L.ctext(img, W/2, H*0.935, L.SIGN, L.font(40, 800), L.WHITE)
    L.ctext(img, W/2, H*0.972, L.CONTACT, L.font(30, 600), (190, 196, 224))
    p = f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95); return p

PARTNERS = [
    ("ev-nds-bergerie",      "Domaine de la Bergerie",       "kit_digital_bergerie"),
    ("ev-nds-pegase",        "Auto-Moto-École Pégase",       "kit_digital_pegase"),
    ("ev-nds-utile",         "Utile Vence",                  "kit_digital_utile"),
    ("ev-nds-carrosserie-gp","Carrosserie GP",               "kit_digital_carrosserie-gp"),
    ("ev-nds-giordano",      "Électroménager J Giordano",    "kit_digital_giordano"),
]
for sid, com, fn in PARTNERS:
    print("OK", kit(sid, com, fn))
print("DONE", len(PARTNERS))
