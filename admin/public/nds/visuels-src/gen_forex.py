# -*- coding: utf-8 -*-
# Forex 70x70 "STATION JEUX" — REFONTE charte CINEMATIQUE (faisceaux), declinaisons par station, QR de la station.
# Wording Romain: FLASH · JOUE · GAGNE tes places · participe au grand tirage des bons d'achat chez nos partenaires.
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W = H = 3500  # ~127 DPI a 70cm
OUT = "/home/claude/vid/forex"; os.makedirs(OUT, exist_ok=True)

BG=(9,16,32); AMBER=(244,181,68); TEAL=(32,224,196); WHITE=(255,255,255); INK=(22,16,40); MUTE=(196,204,230)
_PLATE=False; _TEXTLOG=[]

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
    _beam(acc,[(W*0.28,-180),(W*0.00,H*0.40),(W*0.24,H*0.40)],(170,50,104),1.05,200)
    _beam(acc,[(W*0.54,-180),(W*0.26,H*0.38),(W*0.60,H*0.38)],(122,44,124),0.98,200)
    _beam(acc,[(W*0.84,-180),(W*0.60,H*0.40),(W*1.06,H*0.32)],(184,46,118),1.10,196)
    _radial(acc,W*0.62,H*0.08,W*0.44,(152,42,98),0.55)
    _radial(acc,W*0.50,H*0.46,W*0.66,(46,62,122),0.42)
    _radial(acc,W*0.16,H*0.66,W*0.58,(22,96,92),0.34)
    _radial(acc,W*0.84,H*0.70,W*0.58,(80,52,28),0.22)
    out=np.clip(base+acc,0,255).astype(np.uint8)
    _BG[0]=Image.fromarray(out,"RGB").convert("RGBA")
    return _BG[0].copy()

def k(x): return int(x/1080*W)
def ct(img,cx,cy,txt,size,col,w=800):
    _TEXTLOG.append((txt,cx,cy,size,col,w))
    if not _PLATE: L.ctext(img,cx,cy,txt,L.font(size,w),col)

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

def wrap_ct(img,cx,cy,txt,size,col,maxw,lh,w=600):
    d=ImageDraw.Draw(img); fnt=L.font(size,w); words=txt.split(); lines=[]; cur=""
    for word in words:
        t=(cur+" "+word).strip()
        if L.measure(t,fnt)[0]>maxw and cur: lines.append(cur); cur=word
        else: cur=t
    if cur: lines.append(cur)
    yy=cy-(len(lines)-1)*lh/2
    for ln in lines:
        d.text((cx,yy),ln,font=fnt,fill=col,anchor="mm"); yy+=lh

def sponsor_strip(img, cy):
    import os as _os
    d=ImageDraw.Draw(img,"RGBA")
    ct(img, W/2, cy-k(72), "NOS PARTENAIRES", k(38), TEAL, 800)
    slots=list(L.PARTNERS)   # source unique de verite: nds_lib.PARTNERS
    margin=k(54); n=len(slots)
    bx0=margin; bx1=W-margin; bh=k(196); by0=int(cy)
    # bandeau BLANC
    band=Image.new("RGBA",(bx1-bx0,bh),(0,0,0,0))
    ImageDraw.Draw(band).rounded_rectangle([0,0,bx1-bx0-1,bh-1],radius=k(26),fill=(255,255,255,255))
    img.alpha_composite(band,(bx0,by0))
    cellw=(bx1-bx0)/n
    boxh=int(bh*0.64); boxw=int(cellw*0.80)
    for i,slug in enumerate(slots):
        ccx=bx0+cellw*(i+0.5); ccy=by0+bh/2
        p=f"/home/claude/repo/admin/public/nds/partenaires/{slug}.png" if slug else None
        if p and _os.path.exists(p):
            logo=Image.open(p).convert("RGBA"); bb=logo.split()[3].getbbox()
            if bb: logo=logo.crop(bb)
            r=min(boxw/logo.width, boxh/logo.height); nw,nh=max(1,int(logo.width*r)),max(1,int(logo.height*r))
            logo=logo.resize((nw,nh),Image.LANCZOS)
            img.alpha_composite(logo,(int(ccx-nw/2),int(ccy-nh/2)))
        else:
            pw,ph=boxw,boxh
            ph_img=Image.new("RGBA",(pw,ph),(0,0,0,0)); pd=ImageDraw.Draw(ph_img)
            for seg in range(0,pw,30):
                pd.line([(seg,0),(seg+16,0)],fill=(176,182,198,255),width=4)
                pd.line([(seg,ph-1),(seg+16,ph-1)],fill=(176,182,198,255),width=4)
            for seg in range(0,ph,30):
                pd.line([(0,seg),(0,seg+16)],fill=(176,182,198,255),width=4)
                pd.line([(pw-1,seg),(pw-1,seg+16)],fill=(176,182,198,255),width=4)
            pd.text((pw/2,ph/2),"+",font=L.font(int(ph*0.42),700),fill=(176,182,198,255),anchor="mm")
            img.alpha_composite(ph_img,(int(ccx-pw/2),int(ccy-ph/2)))

def forex(station_id, station_label, fname):
    global _TEXTLOG
    _TEXTLOG=[]
    img=make_bg(); d=ImageDraw.Draw(img)
    # logo (contient deja dates+Vence) avec degagement
    L.put_logo(img, W/2, H*0.092, 0.28*W/1080)
    # CAISSE N -> chip REDUIT, en haut a droite (sans chevauchement)
    cfnt=L.font(k(34),800); ctw=L.measure(station_label.upper(),cfnt)[0]; cpadx=k(34)
    chipw=ctw+cpadx*2
    L.chip(img, W-k(60)-chipw/2, H*0.045+k(30), station_label.upper(), cfnt, fill=L.ORANGE, fg=WHITE, padx=cpadx, pady=k(16))
    # eyebrow
    ct(img, W/2, H*0.200, "STATION JEUX", k(48), TEAL, 800)
    # TITRE (essai) : Gagne tes places de concert & bons d'achat
    ct(img, W/2, H*0.256, "GAGNE TES PLACES DE CONCERT", k(58), AMBER, 800)
    ct(img, W/2, H*0.304, "& BONS D'ACHAT", k(58), WHITE, 800)
    # QR central
    qr_card(img, f"/home/claude/vid/qr/{station_id}.png", W/2, H*0.516, k(338))
    # bandeau sponsors (6 emplacements)
    sponsor_strip(img, H*0.792)
    pref="plate_" if _PLATE else ""
    p=f"{OUT}/{pref}{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(127,127)); return p

JOBS = [
    ("ev-nds-caisse-1", "Caisse 1", "forex_70x70_caisse-1"),
    ("ev-nds-caisse-2", "Caisse 2", "forex_70x70_caisse-2"),
    ("ev-nds-caisse-3", "Caisse 3", "forex_70x70_caisse-3"),
    ("ev-nds-bar-1",    "Bar 1",    "forex_70x70_bar-1"),
    ("ev-nds-bar-2",    "Bar 2",    "forex_70x70_bar-2"),
    ("ev-nds-ecrans",   "Festival", "forex_70x70_festival"),
]
if __name__=="__main__":
    for sid,lbl,fn in JOBS:
        print("OK", forex(sid,lbl,fn))
    print("DONE", len(JOBS))
