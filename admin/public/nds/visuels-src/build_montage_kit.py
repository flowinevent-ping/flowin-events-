# -*- coding: utf-8 -*-
import os, sys; sys.path.insert(0,"/home/claude/vid")
from PIL import Image
import rk as R   # render_kref40 (W,H,FPS, make_bg, a4_ticket, station_pill, tl, LOGOS, QR, AMBER...)
W,H = R.W, R.H
KIT="/home/claude/vid/montage_kit"; EL=f"{KIT}/elements"; TX=f"{KIT}/textes"; SC=f"{KIT}/scenes_apercu"
for d in (KIT,EL,TX,SC): os.makedirs(d, exist_ok=True)

def isolate(draw_fn, path, pad=8):
    lay=Image.new("RGBA",(W,H),(0,0,0,0)); draw_fn(lay)
    bb=lay.getbbox()
    if not bb: print("VIDE", path); return
    x0,y0,x1,y1=bb; x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(W,x1+pad);y1=min(H,y1+pad)
    lay.crop((x0,y0,x1,y1)).save(path)
    print(os.path.basename(path), f"{x1-x0}x{y1-y0}")

# --- ELEMENTS graphiques (PNG transparents) ---
isolate(lambda im: R.a4_ticket(im,"concert",W/2,H/2,int(W*0.62),1.0), f"{EL}/billet-concert.png")
isolate(lambda im: R.a4_ticket(im,"voucher",W/2,H/2,int(W*0.62),1.0), f"{EL}/billet-bon-achat.png")
pw,ph=int(W*0.45),150
for txt,ic,fn in [("Bar","glass","bar"),("Entrée","ticket","entree"),("Brigade verte","leaf","brigade-verte"),("Écran","monitor","ecran")]:
    isolate(lambda im,t=txt,i=ic: R.station_pill(im,t,W/2,H/2,pw,ph,1.0,icon=i), f"{EL}/station-{fn}.png")
# QR ecrans (carte blanche, sur fond transparent via qr_badge sans texte)
qr=R.QR.resize((760,760),Image.NEAREST)
card=Image.new("RGBA",(760+80,760+80),(0,0,0,0))
from PIL import ImageDraw
ImageDraw.Draw(card).rounded_rectangle([0,0,760+79,760+79],radius=60,fill=(255,255,255,255))
card.paste(qr,(40,40)); card.save(f"{EL}/qr-ecrans.png"); print("qr-ecrans.png", card.size)

# --- LOGOS partenaires (copie depuis le repo) ---
import shutil
import nds_lib as L
for slug in L.PARTNERS:   # source unique de verite: nds_lib.PARTNERS
    shutil.copy(f"/home/claude/repo/admin/public/nds/partenaires/{slug}.png", f"{EL}/logo-{slug}.png")
shutil.copy("/home/claude/repo/admin/public/nds/logo_nds_blanc_hd.png", f"{EL}/logo-nuits-du-sud.png")
print("logos copies")

# --- TEXTES (PNG transparents, typo/couleur exactes) ---
A,Wh,M,T = R.AMBER, R.WHITE, R.MAGENTA, R.TEAL
words=[("CE SOIR",54,T,"ce-soir"),("GRAND",152,A,"grand"),("JEU",152,M,"jeu"),
 ("FLASH.",224,A,"flash"),("JOUE.",224,M,"joue"),("GAGNE.",224,T,"gagne"),
 ("À GAGNER",66,A,"a-gagner"),("Des places de concert",44,T,"sous-concert"),("Des bons d'achat",44,A,"sous-bon"),
 ("FLASH AUX",96,Wh,"flash-aux"),("STATIONS",96,A,"stations"),
 ("CUMULE",132,A,"cumule"),("TES POINTS",132,Wh,"tes-points"),("REMPORTE",132,M,"remporte"),("LES LOTS !",132,M,"les-lots"),
 ("JOUE CHEZ NOS PARTENAIRES",56,A,"joue-chez-partenaires"),("pendant toute la durée du festival !",40,Wh,"pendant-festival"),
 ("FLASH LE QR",116,A,"flash-le-qr"),("ce soir & dans les commerces !",50,Wh,"ce-soir-commerces")]
for txt,sz,col,fn in words:
    R.tl(txt,sz,col).save(f"{TX}/txt-{fn}.png")
print("textes:", len(words))
