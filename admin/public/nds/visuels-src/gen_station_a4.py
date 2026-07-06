# -*- coding: utf-8 -*-
# Affiche STATION JEUX — A4 portrait (300 DPI), charte NDS, 7 sponsors (ARA au centre),
# QR de la station, "STATION JEUX" mis en avant. Reutilise la charte du forex.
import sys, os; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W, H = 2480, 3508  # A4 portrait @ 300 DPI
OUT = "/home/claude/vid/station_a4"; os.makedirs(OUT, exist_ok=True)

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

def make_bg():
    base=np.zeros((H,W,3),np.float32)
    for i in range(3): base[:,:,i]=BG[i]
    acc=np.zeros((H,W,3),np.float32)
    _beam(acc,[(W*0.28,-180),(W*0.00,H*0.34),(W*0.24,H*0.34)],(170,50,104),1.05,200)
    _beam(acc,[(W*0.54,-180),(W*0.26,H*0.32),(W*0.60,H*0.32)],(122,44,124),0.98,200)
    _beam(acc,[(W*0.84,-180),(W*0.60,H*0.34),(W*1.06,H*0.28)],(184,46,118),1.10,196)
    _radial(acc,W*0.62,H*0.06,W*0.44,(152,42,98),0.55)
    _radial(acc,W*0.50,H*0.40,W*0.66,(46,62,122),0.42)
    _radial(acc,W*0.16,H*0.60,W*0.58,(22,96,92),0.34)
    _radial(acc,W*0.84,H*0.64,W*0.58,(80,52,28),0.22)
    out=np.clip(base+acc,0,255).astype(np.uint8)
    return Image.fromarray(out,"RGB").convert("RGBA")

def k(x): return int(x/1080*W)

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

# ---- ordre des sponsors : Auto-Ecole de l'ARA (pegase) AU CENTRE ----
def sponsor_order():
    # 5 sponsors demandes, Auto-Ecole de l'ARA (pegase) AU CENTRE
    return ['utile','carrosserie-gp','pegase','charvolin','nook']

def sponsor_strip(img, cy):
    d=ImageDraw.Draw(img,"RGBA")
    L.ctext(img, W/2, cy-k(78), "NOS PARTENAIRES", L.font(k(40),800), TEAL)
    slots=sponsor_order(); n=len(slots)
    margin=k(48); bx0=margin; bx1=W-margin; bh=k(206); by0=int(cy)
    band=Image.new("RGBA",(bx1-bx0,bh),(0,0,0,0))
    ImageDraw.Draw(band).rounded_rectangle([0,0,bx1-bx0-1,bh-1],radius=k(28),fill=(255,255,255,255))
    img.alpha_composite(band,(bx0,by0))
    cellw=(bx1-bx0)/n; boxh=int(bh*0.66); boxw=int(cellw*0.82)
    for i,slug in enumerate(slots):
        ccx=bx0+cellw*(i+0.5); ccy=by0+bh/2
        p=f"/home/claude/repo/admin/public/nds/partenaires/{slug}.png"
        if os.path.exists(p):
            logo=Image.open(p).convert("RGBA"); bb=logo.split()[3].getbbox()
            if bb: logo=logo.crop(bb)
            r=min(boxw/logo.width, boxh/logo.height); nw,nh=max(1,int(logo.width*r)),max(1,int(logo.height*r))
            logo=logo.resize((nw,nh),Image.LANCZOS)
            img.alpha_composite(logo,(int(ccx-nw/2),int(ccy-nh/2)))

def station_a4(station_id, station_label, fname):
    img=make_bg(); d=ImageDraw.Draw(img)
    # logo NDS (dates + Vence inclus)
    L.put_logo(img, W/2, H*0.085, 0.30*W/1080)
    # chip station en haut a droite
    cfnt=L.font(k(38),800); ctw=L.measure(station_label.upper(),cfnt)[0]; cpadx=k(38)
    chipw=ctw+cpadx*2
    L.chip(img, W-k(56)-chipw/2, H*0.052, station_label.upper(), cfnt, fill=L.ORANGE, fg=WHITE, padx=cpadx, pady=k(18))
    # STATION JEUX — mis en avant : gros chip teal centre
    sfnt=L.font(k(66),800); stw=L.measure("STATION JEUX",sfnt)[0]
    L.chip(img, W/2, H*0.176, "STATION JEUX", sfnt, fill=TEAL, fg=(9,16,32), padx=k(46), pady=k(24))
    # titre
    L.ctext(img, W/2, H*0.244, "GAGNE TES PLACES DE CONCERT", L.font(k(60),800), AMBER)
    L.ctext(img, W/2, H*0.290, "& BONS D'ACHAT PARTENAIRES", L.font(k(60),800), WHITE)
    # QR central
    qr_card(img, f"/home/claude/vid/qr/{station_id}.png", W/2, H*0.500, k(360))
    # FLASH & JOUE sous le QR
    L.ctext(img, W/2, H*0.640, "FLASH & JOUE", L.font(k(72),800), AMBER)
    # bandeau sponsors (ARA au centre)
    sponsor_strip(img, H*0.760)
    # bas de page
    L.ctext(img, W/2, H*0.895, "JEU GRATUIT · SANS OBLIGATION D'ACHAT", L.font(k(28),700), (150,158,182))
    # logo Flowin (bas centre)
    _flw=Image.open("/home/claude/repo/admin/public/nds/assets/flowin_logo.png").convert("RGBA")
    _fw=int(W*0.24); _fh=int(_fw*_flw.height/_flw.width); _flw=_flw.resize((_fw,_fh),Image.LANCZOS)
    img.alpha_composite(_flw,(int(W/2-_fw/2),int(H*0.935)))
    p=f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(300,300)); return p

if __name__=="__main__":
    stations=[("ev-nds-caisse-1","Caisse 1","station_a4_caisse-1"),
              ("ev-nds-caisse-2","Caisse 2","station_a4_caisse-2"),
              ("ev-nds-bar-1","Bar 1","station_a4_bar-1"),
              ("ev-nds-bar-2","Bar 2","station_a4_bar-2"),
              ("ev-nds-bar-3","Bar 3","station_a4_bar-3"),
              ("ev-nds-tablette-1","Brigade Verte 1","station_a4_brigade-verte-1"),
              ("ev-nds-tablette-2","Brigade Verte 2","station_a4_brigade-verte-2")]
    only=sys.argv[1] if len(sys.argv)>1 else None
    for sid,lbl,fn in stations:
        if only and only not in fn: continue
        print("OK", station_a4(sid,lbl,fn))
    print("DONE", L.PARTNERS)
