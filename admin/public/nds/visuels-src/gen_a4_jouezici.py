# -*- coding: utf-8 -*-
# A4 client en boutique (2480x3508, 300dpi) — REFONTE charte KINETIQUE VALIDEE
# Fond cinematique (faisceaux magenta/violet) + cartes gains a lueur + QR proeminent + logo du commerce + son lot reel.
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W, H = 2480, 3508
OUT = "/home/claude/vid/a4"; os.makedirs(OUT, exist_ok=True)
LOGODIR = "/home/claude/repo/admin/public/nds/partenaires"

BG      = (9, 16, 32)
AMBER   = (244, 181, 68)
ORANGE  = (255, 122, 26)
WHITE   = (255, 255, 255)
TEAL    = (32, 224, 196)
MAGENTA = (230, 24, 127)
PURPLE  = (124, 58, 200)
INK     = (24, 16, 44)
MUTE    = (188, 196, 224)

def _radial(arr, cx, cy, rad, col, strength):
    yy, xx = np.ogrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
    g = np.clip(1 - d, 0, 1) ** 2 * strength
    arr += np.stack([g * col[0], g * col[1], g * col[2]], -1)

def _beam(arr, pts, col, strength, blur):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m, np.float32) / 255.0 * strength
    arr += np.stack([a * col[0], a * col[1], a * col[2]], -1)

_BG = [None]
def make_bg():
    if _BG[0] is not None: return _BG[0].copy()
    base = np.zeros((H, W, 3), np.float32)
    for i in range(3): base[:, :, i] = BG[i]
    acc = np.zeros((H, W, 3), np.float32)
    # faisceaux de scene (haut) magenta / violet — comme la video
    _beam(acc, [(W*0.30,-140),(W*0.02,H*0.34),(W*0.24,H*0.34)], (170,50,104), 1.05, 150)
    _beam(acc, [(W*0.56,-140),(W*0.28,H*0.32),(W*0.60,H*0.32)], (122,44,124), 0.98, 150)
    _beam(acc, [(W*0.84,-140),(W*0.60,H*0.34),(W*1.04,H*0.28)], (184,46,118), 1.10, 148)
    _radial(acc, W*0.62, H*0.09, W*0.42, (152,42,98), 0.55)   # coeur haut
    _radial(acc, W*0.50, H*0.40, W*0.62, (46,62,122), 0.42)   # glow bleu centre
    _radial(acc, W*0.16, H*0.58, W*0.56, (22,96,92), 0.34)    # teal bas gauche
    _radial(acc, W*0.84, H*0.66, W*0.56, (80,52,28), 0.22)    # ambre bas droite
    _radial(acc, W*0.50, H*0.60, W*0.66, (40,30,80), 0.30)
    out = np.clip(base + acc, 0, 255).astype(np.uint8)
    _BG[0] = Image.fromarray(out, "RGB").convert("RGBA")
    return _BG[0].copy()

def ct(d, cx, y, txt, size, col, w=800):
    d.text((cx, y), txt, font=L.font(size, w), fill=col, anchor="mm")

def wrap(d, cx, y, txt, size, col, maxw, lh, w=600):
    fnt = L.font(size, w); words = txt.split(); lines=[]; cur=""
    for word in words:
        t=(cur+" "+word).strip()
        if L.measure(t,fnt)[0] > maxw and cur: lines.append(cur); cur=word
        else: cur=t
    if cur: lines.append(cur)
    yy = y - (len(lines)-1)*lh/2
    for ln in lines:
        d.text((cx,yy), ln, font=fnt, fill=col, anchor="mm"); yy+=lh
    return len(lines)

def _icon(cd, kind, x, y, s, col=WHITE):
    w = col + (255,); lw = max(3, int(s*0.07))
    if kind == "music":
        r = int(s*0.15)
        cd.ellipse([x+s*0.18-r,y+s*0.68-r,x+s*0.18+r,y+s*0.68+r], fill=w)
        cd.ellipse([x+s*0.64-r,y+s*0.58-r,x+s*0.64+r,y+s*0.58+r], fill=w)
        cd.line([(x+s*0.18+r,y+s*0.68),(x+s*0.18+r,y+s*0.26)], fill=w, width=lw)
        cd.line([(x+s*0.64+r,y+s*0.58),(x+s*0.64+r,y+s*0.16)], fill=w, width=lw)
        cd.line([(x+s*0.18+r,y+s*0.26),(x+s*0.64+r,y+s*0.16)], fill=w, width=lw)
    elif kind == "gift":
        cd.rounded_rectangle([x+s*0.16,y+s*0.42,x+s*0.84,y+s*0.86], radius=int(s*0.06), fill=w)
        cd.rectangle([x+s*0.10,y+s*0.34,x+s*0.90,y+s*0.48], fill=w)
        cd.line([(x+s*0.50,y+s*0.34),(x+s*0.50,y+s*0.86)], fill=(0,0,0,90), width=max(2,int(s*0.05)))
        cd.line([(x+s*0.50,y+s*0.42),(x+s*0.30,y+s*0.22)], fill=w, width=max(2,int(s*0.05)))
        cd.line([(x+s*0.50,y+s*0.42),(x+s*0.70,y+s*0.22)], fill=w, width=max(2,int(s*0.05)))

def gain_card(img, cx, cy, w, h, grad, icon, label, title, dark=False):
    c0, c1 = grad
    txt_col = INK if dark else WHITE
    lbl_col = (INK[0],INK[1],INK[2],210) if dark else (255,255,255,235)
    # lueur derriere
    gcol = ((c0[0]+c1[0])//2,(c0[1]+c1[1])//2,(c0[2]+c1[2])//2); gpad=90
    glow = Image.new("RGBA",(w+gpad*2,h+gpad*2),(0,0,0,0))
    ImageDraw.Draw(glow).rounded_rectangle([gpad,gpad,gpad+w,gpad+h],radius=int(h*0.18),fill=gcol+(150,))
    glow = glow.filter(ImageFilter.GaussianBlur(46))
    img.alpha_composite(glow,(int(cx-w/2-gpad),int(cy-h/2-gpad)))
    # carte degrade vertical
    card = Image.new("RGBA",(w,h),(0,0,0,0))
    grad_arr = np.zeros((h,w,4),np.uint8)
    for yy in range(h):
        f=yy/max(1,h-1)
        grad_arr[yy,:,0]=int(c0[0]+(c1[0]-c0[0])*f)
        grad_arr[yy,:,1]=int(c0[1]+(c1[1]-c0[1])*f)
        grad_arr[yy,:,2]=int(c0[2]+(c1[2]-c0[2])*f)
        grad_arr[yy,:,3]=255
    gimg=Image.fromarray(grad_arr,"RGBA")
    mask=Image.new("L",(w,h),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,w-1,h-1],radius=int(h*0.18),fill=255)
    card=Image.composite(gimg,card,mask)
    cd=ImageDraw.Draw(card)
    # gloss haut
    gloss=Image.new("L",(w,h),0); ImageDraw.Draw(gloss).rounded_rectangle([0,0,w-1,int(h*0.46)],radius=int(h*0.18),fill=70)
    gloss=gloss.filter(ImageFilter.GaussianBlur(20))
    white=Image.new("RGBA",(w,h),(255,255,255,255)); card=Image.composite(white,card,gloss) if False else card
    card.alpha_composite(_gloss_layer(w,h))
    cd=ImageDraw.Draw(card)
    # icone dans pastille
    isz=int(h*0.30); ix=int(w*0.12); iy=int(h*0.16)
    chip=Image.new("RGBA",(isz,isz),(0,0,0,0))
    ImageDraw.Draw(chip).ellipse([0,0,isz-1,isz-1], fill=(255,255,255,235) if not dark else (40,28,70,235))
    _icon(ImageDraw.Draw(chip), icon, 0, 0, isz, col=(c0 if not dark else WHITE))
    card.alpha_composite(chip,(ix,iy))
    # label + titre
    cd.text((int(w*0.12), int(h*0.60)), label, font=L.font(int(h*0.115),700), fill=lbl_col)
    cd.text((int(w*0.12), int(h*0.72)), title, font=L.font(int(h*0.175),800), fill=txt_col+(255,) if isinstance(txt_col,tuple) and len(txt_col)==3 else txt_col)
    img.alpha_composite(card,(int(cx-w/2),int(cy-h/2)))

def _gloss_layer(w,h):
    g=Image.new("RGBA",(w,h),(0,0,0,0))
    m=Image.new("L",(w,h),0); ImageDraw.Draw(m).rounded_rectangle([0,0,w-1,int(h*0.5)],radius=int(h*0.18),fill=60)
    m=m.filter(ImageFilter.GaussianBlur(18))
    wl=Image.new("RGBA",(w,h),(255,255,255,255)); wl.putalpha(m)
    return wl

def qr_card(img, qr_path, cx, cy, qsz):
    qr = Image.open(qr_path).convert("RGB").resize((qsz,qsz), Image.NEAREST)
    pad=int(qsz*0.07); cw=qsz+pad*2
    # halo
    halo=Image.new("RGBA",(cw+120,cw+120),(0,0,0,0))
    ImageDraw.Draw(halo).rounded_rectangle([60,60,60+cw,60+cw],radius=int(cw*0.10),fill=AMBER+(120,))
    halo=halo.filter(ImageFilter.GaussianBlur(40))
    img.alpha_composite(halo,(int(cx-(cw+120)/2),int(cy-(cw+120)/2)))
    card=Image.new("RGBA",(cw,cw),(0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,cw-1,cw-1],radius=int(cw*0.07),fill=(255,255,255,255))
    card.paste(qr,(pad,pad))
    img.alpha_composite(card,(int(cx-cw/2),int(cy-cw/2)))

def logo_badge(img, slug, cx, cy, box):
    p=f"{LOGODIR}/{slug}.png"
    if not os.path.exists(p): return
    card=L.logo_card(p, box, box, pad_ratio=0.12, radius_ratio=0.18)
    img.alpha_composite(card,(int(cx-box/2),int(cy-box/2)))

def step_chip(img, cx, cy, n, txt, maxw):
    d=ImageDraw.Draw(img); r=58
    d.ellipse([cx-r,cy-r,cx+r,cy+r], fill=TEAL+(255,))
    d.text((cx,cy), str(n), font=L.font(64,800), fill=INK+(255,), anchor="mm")
    wrap(d, cx+r+30+ (maxw)/2, cy, txt, 50, WHITE, maxw, 60, 600)

def a4(slug, commerce, gift_concert, lot_title, fname):
    img = make_bg(); d = ImageDraw.Draw(img)
    L.put_logo(img, W/2, H*0.066, 1.02)
    ct(d, W/2, H*0.118, "GRAND JEU DES NUITS DU SUD", 70, TEAL, 700)
    ct(d, W/2, H*0.175, "FLASH", 300, AMBER, 800)
    ct(d, W/2, H*0.238, "JOUE · GAGNE", 168, WHITE, 800)
    # 2 cartes gains
    cw, ch = 940, 360; gap=80
    gain_card(img, W/2 - (cw+gap)/2, H*0.340, cw, ch, ((232,40,150),(120,46,196)), "music", "À GAGNER", "Places de concert")
    gain_card(img, W/2 + (cw+gap)/2, H*0.340, cw, ch, ((255,176,60),(240,120,20)), "gift", "À GAGNER", "Bons d'achat", dark=True)
    # jouez ici + logo commerce
    ct(d, W/2, H*0.458, "Jouez ici, chez", 70, WHITE, 700)
    ct(d, W/2, H*0.498, commerce, 86, AMBER, 800)
    logo_badge(img, slug, W/2, H*0.574, 360)
    # lot du commerce (chip)
    L.chip(img, W/2, H*0.648, "Votre lot : " + lot_title, L.font(58,800), fill=TEAL, fg=INK, padx=56, pady=26)
    # QR
    qr_card(img, f"/home/claude/vid/qr/{slug}_hd.png", W/2, H*0.770, 700)
    bf=L.font(82,800)
    fw=L.measure("Flash ",bf)[0]+L.measure("le QR",bf)[0]; x0=W/2-fw/2
    d.text((x0,H*0.912),"Flash ",font=bf,fill=AMBER,anchor="lm")
    d.text((x0+L.measure("Flash ",bf)[0],H*0.912),"le QR",font=bf,fill=WHITE,anchor="lm")
    # cumule + tirage
    wrap(d, W/2, H*0.948, "Cumule tes points chez les commerces partenaires et aux concerts · grand tirage à la clôture", 48, MUTE, int(W*0.86), 62, 600)
    # bas dates + legal
    ct(d, W/2, H*0.975, "Nuits du Sud · 9 → 18 juillet 2026 · Vence", 46, WHITE, 700)
    ct(d, W/2, H*0.991, "Jeu gratuit · sans obligation d'achat", 36, (170,178,206), 600)
    p=f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(300,300)); return p

PARTNERS = [
    ("bergerie",       "Domaine de la Bergerie",  "1 nuit offerte au camping",       "nds_a4_bergerie"),
    ("pegase",         "Auto-Moto-École Pégase",  "Formation 125 ou remise permis",  "nds_a4_pegase"),
    ("utile",          "Utile Vence",             "Bon d'achat",                     "nds_a4_utile"),
    ("carrosserie-gp", "Carrosserie GP",          "Bon d'achat révision",            "nds_a4_carrosserie-gp"),
    ("giordano",       "Électroménager Giordano", "Bon d'achat",                     "nds_a4_giordano"),
]

if __name__ == "__main__":
    for slug, com, _, lot, fn in [(s,c,None,l,f) for (s,c,l,f) in PARTNERS]:
        print("OK", a4(slug, com, None, lot, fn))
    print("DONE", len(PARTNERS))
