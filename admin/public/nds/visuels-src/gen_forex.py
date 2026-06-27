# -*- coding: utf-8 -*-
import sys; sys.path.insert(0, "/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw
import os

W = H = 3500  # ~127 DPI a 70cm
OUT = "/home/claude/vid/forex"; os.makedirs(OUT, exist_ok=True)

def k(x): return int(x / 1080 * W)  # echelle depuis grille 1080

def forex(station_id, station_label, fname):
    img = L.bg(W, H, glow_cy=0.30, glow_strength=1.05)
    d = ImageDraw.Draw(img)
    # logo haut
    L.put_logo(img, W/2, H*0.062, 0.36 * W/1080)
    # headline kinetique
    L.ctext(img, W/2, H*0.150, "FLASH · JOUE · GAGNE", L.font(k(80), 800), L.WHITE)
    # a gagner
    L.ctext(img, W/2, H*0.210, "DES PLACES DE CONCERT", L.font(k(50), 800), L.TEAL)
    L.ctext(img, W/2, H*0.248, "& des bons d'achat chez vos commerces", L.font(k(36), 600), (220, 224, 240))
    # chip station (au-dessus du QR)
    L.chip(img, W/2, H*0.308, station_label.upper(), L.font(k(48), 800), fill=L.ORANGE, padx=k(52), pady=k(20))
    # QR central
    qr = Image.open(f"/home/claude/vid/qr/{station_id}.png").convert("RGB")
    L.put_qr(img, qr, W/2, H*0.555, k(400), border=k(30))
    # instruction
    L.ctext(img, W/2, H*0.820, "Scanne · joue le quiz · cumule tes points", L.font(k(44), 700), L.WHITE)
    L.ctext(img, W/2, H*0.862, "Gagne un bon d'achat + le grand tirage", L.font(k(38), 600), (220, 224, 240))
    # signature + contact
    L.ctext(img, W/2, H*0.922, L.SIGN, L.font(k(44), 800), L.TEAL)
    L.ctext(img, W/2, H*0.960, L.CONTACT, L.font(k(32), 600), (190, 196, 224))
    out_png = f"{OUT}/{fname}.png"
    img.convert("RGB").save(out_png, quality=95)
    return out_png

JOBS = [
    ("ev-nds-ecrans",   "Festival",  "forex_70x70_festival"),
    ("ev-nds-caisse-1", "Caisse 1",  "forex_70x70_caisse-1"),
    ("ev-nds-caisse-2", "Caisse 2",  "forex_70x70_caisse-2"),
    ("ev-nds-caisse-3", "Caisse 3",  "forex_70x70_caisse-3"),
    ("ev-nds-bar-1",    "Bar 1",     "forex_70x70_bar-1"),
    ("ev-nds-bar-2",    "Bar 2",     "forex_70x70_bar-2"),
]
for sid, lbl, fn in JOBS:
    p = forex(sid, lbl, fn)
    print("OK", p)
print("DONE", len(JOBS))
