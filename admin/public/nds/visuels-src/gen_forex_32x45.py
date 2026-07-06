# -*- coding: utf-8 -*-
# Forex 32x45 cm (PORTRAIT) — meme charte cinematique / wording / QR station / bandeau 7 partenaires
# que gen_forex.py (70x70). Layout re-espace pour le portrait. 150 DPI.
import sys, os; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

DPI = 150
W = round(32/2.54*DPI)   # 1890
H = round(45/2.54*DPI)   # 2657
OUT = "/home/claude/vid/forex32x45"; os.makedirs(OUT, exist_ok=True)

BG=(9,16,32); AMBER=(244,181,68); TEAL=(32,224,196); WHITE=(255,255,255)

def _radial(arr,cx,cy,rad,col,strength):
    yy,xx=np.ogrid[0:H,0:W]
    dd=np.sqrt((xx-cx)**2+(yy-cy)**2)/rad
    g=np.clip(1-dd,0,1)**2*strength
    arr+=np.stack([g*col[0],g*col[1],g*col[2]],-1)

def _beam(arr,pts,col,strength,blur):
    m=Image.new("L",(W,H),0); ImageDraw.Draw(m).polygon(pts,fill=255)
    m=m.filter(ImageFilter.GaussianBlur(blur))
    a=np.asarray(m,np.float32)/255.0*strength
    arr+=np.stack([a*col[0],a*col[1],a*col[2]],-1)

_BG=[None]
def make_bg():
    if _BG[0] is not None: return _BG[0].copy()
    base=np.zeros((H,W,3),np.float32)
    for i in range(3): base[:,:,i]=BG[i]
    acc=np.zeros((H,W,3),np.float32)
    _beam(acc,[(W*0.30,-160),(W*0.02,H*0.34),(W*0.26,H*0.34)],(170,50,104),1.05,170)
    _beam(acc,[(W*0.56,-160),(W*0.28,H*0.32),(W*0.62,H*0.32)],(122,44,124),0.98,170)
    _beam(acc,[(W*0.86,-160),(W*0.62,H*0.34),(W*1.08,H*0.28)],(184,46,118),1.10,166)
    _radial(acc,W*0.62,H*0.07,W*0.52,(152,42,98),0.55)
    _radial(acc,W*0.50,H*0.42,W*0.80,(46,62,122),0.40)
    _radial(acc,W*0.16,H*0.62,W*0.70,(22,96,92),0.32)
    _radial(acc,W*0.86,H*0.66,W*0.70,(80,52,28),0.20)
    out=np.clip(base+acc,0,255).astype(np.uint8)
    _BG[0]=Image.fromarray(out,"RGB").convert("RGBA")
    return _BG[0].copy()

def k(x): return int(x/1080*W)

def ct(img,cx,cy,txt,size,col,w=800):
    L.ctext(img,cx,cy,txt,L.font(size,w),col)

def qr_card(img, qr_path, cx, cy, qsz):
    qr=Image.open(qr_path).convert("RGB").resize((qsz,qsz),Image.NEAREST)
    pad=int(qsz*0.07); cw=qsz+pad*2
    halo=Image.new("RGBA",(cw+200,cw+200),(0,0,0,0))
    ImageDraw.Draw(halo).rounded_rectangle([100,100,100+cw,100+cw],radius=int(cw*0.09),fill=AMBER+(120,))
    halo=halo.filter(ImageFilter.GaussianBlur(70))
    img.alpha_composite(halo,(int(cx-(cw+200)/2),int(cy-(cw+200)/2)))
    card=Image.new("RGBA",(cw,cw),(0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,cw-1,cw-1],radius=int(cw*0.06),fill=(255,255,255,255))
    card.paste(qr,(pad,pad))
    img.alpha_composite(card,(int(cx-cw/2),int(cy-cw/2)))

def step_row(img, cy, num, label):
    d=ImageDraw.Draw(img)
    rx=k(120); ry=int(cy)
    d.ellipse([rx-k(34),ry-k(34),rx+k(34),ry+k(34)], fill=AMBER)
    d.text((rx,ry),str(num),font=L.font(k(40),800),fill=(9,16,32),anchor="mm")
    d.text((rx+k(70),ry),label,font=L.font(k(38),700),fill=WHITE,anchor="lm")

def sponsor_strip(img, cy):
    d=ImageDraw.Draw(img,"RGBA")
    ct(img, W/2, cy-k(78), "NOS PARTENAIRES", k(40), TEAL, 800)
    slots=list(L.PARTNERS)   # source unique: nds_lib.PARTNERS (7, GP<->Nook)
    margin=k(50); n=len(slots)
    bx0=margin; bx1=W-margin; bh=k(210); by0=int(cy)
    band=Image.new("RGBA",(bx1-bx0,bh),(0,0,0,0))
    ImageDraw.Draw(band).rounded_rectangle([0,0,bx1-bx0-1,bh-1],radius=k(26),fill=(255,255,255,255))
    img.alpha_composite(band,(bx0,by0))
    cellw=(bx1-bx0)/n
    boxh=int(bh*0.66); boxw=int(cellw*0.82)
    for i,slug in enumerate(slots):
        ccx=bx0+cellw*(i+0.5); ccy=by0+bh/2
        p=f"/home/claude/repo/admin/public/nds/partenaires/{slug}.png"
        if os.path.exists(p):
            logo=Image.open(p).convert("RGBA"); bb=logo.split()[3].getbbox()
            if bb: logo=logo.crop(bb)
            r=min(boxw/logo.width, boxh/logo.height); nw,nh=max(1,int(logo.width*r)),max(1,int(logo.height*r))
            logo=logo.resize((nw,nh),Image.LANCZOS)
            img.alpha_composite(logo,(int(ccx-nw/2),int(ccy-nh/2)))

def forex(station_id, station_label, fname):
    img=make_bg(); d=ImageDraw.Draw(img)
    # logo (contient dates+Vence)
    L.put_logo(img, W/2, H*0.070, 0.30*W/1080)
    # chip station haut-droite
    cfnt=L.font(k(36),800); ctw=L.measure(station_label.upper(),cfnt)[0]; cpadx=k(36)
    chipw=ctw+cpadx*2
    L.chip(img, W-k(56)-chipw/2, H*0.035+k(30), station_label.upper(), cfnt, fill=L.ORANGE, fg=WHITE, padx=cpadx, pady=k(16))
    # eyebrow + titre
    ct(img, W/2, H*0.150, "STATION DE JEU", k(50), TEAL, 800)
    ct(img, W/2, H*0.200, "GAGNE TES PLACES", k(66), AMBER, 800)
    ct(img, W/2, H*0.238, "DE CONCERT & BONS D'ACHAT", k(50), WHITE, 800)
    # QR central grand
    qr_card(img, f"/home/claude/vid/qr/{station_id}.png", W/2, H*0.430, k(430))
    ct(img, W/2, H*0.588, "Flash le QR avec ton telephone", k(38), WHITE, 700)
    # 1-2-3
    step_row(img, H*0.648, 1, "Flashe le QR")
    step_row(img, H*0.694, 2, "Joue le quiz (4 bonnes reponses)")
    step_row(img, H*0.740, 3, "Cumule des points & gagne")
    # bandeau sponsors
    sponsor_strip(img, H*0.810)
    # contact
    ct(img, W/2, H*0.972, L.CONTACT, k(30), (190,196,224), 600)
    p=f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(DPI,DPI)); return p

JOBS = [
    ("ev-nds-caisse-1", "Caisse 1", "forex_32x45_caisse-1"),
    ("ev-nds-caisse-2", "Caisse 2", "forex_32x45_caisse-2"),
    ("ev-nds-bar-1",    "Bar 1",    "forex_32x45_bar-1"),
    ("ev-nds-bar-2",    "Bar 2",    "forex_32x45_bar-2"),
    ("ev-nds-bar-3",    "Bar 3",    "forex_32x45_bar-3"),
]
if __name__=="__main__":
    only = sys.argv[1] if len(sys.argv)>1 else None
    for sid,lbl,fn in JOBS:
        if only and only not in fn: continue
        print("OK", forex(sid,lbl,fn))
    print("DONE")
