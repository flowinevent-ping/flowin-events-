# -*- coding: utf-8 -*-
# Tickets tombola imprimables NDS 2026 — 1 PDF par lot, planches A4 (2 colonnes).
# Bandeau sombre charte (logo + lot + n0 serie) + corps blanc inscriptible (Gagnant/Tel/Date/Emargement).
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

OUT = "/home/claude/vid/tickets"; os.makedirs(OUT, exist_ok=True)
# A4 portrait 300 dpi
PW, PH = 2480, 3508
MARGIN = 120
COLS = 2
TW = (PW - 2*MARGIN - 40) // COLS   # ticket width
TH = 660                            # ticket height
GAPX, GAPY = 40, 40

NAVY=(13,18,38); AMBER=(244,181,68); TEAL=(32,224,196); WHITE=(255,255,255); INK=(22,16,40); MUTE=(120,128,150); MAGENTA=(230,24,127); PURPLE=(124,58,200)

def _beam(arr, pts, col, strength, blur, w, h):
    m=Image.new("L",(w,h),0); ImageDraw.Draw(m).polygon(pts,fill=255)
    m=m.filter(ImageFilter.GaussianBlur(blur))
    a=np.asarray(m,np.float32)/255.0*strength
    arr+=np.stack([a*col[0],a*col[1],a*col[2]],-1)

def header_band(w, h):
    arr=np.zeros((h,w,3),np.float32)
    for i in range(3): arr[:,:,i]=NAVY[i]
    _beam(arr,[(w*0.20,-40),(w*0.02,h*1.2),(w*0.30,h*1.2)],(150,46,100),0.9,60,w,h)
    _beam(arr,[(w*0.70,-40),(w*0.50,h*1.2),(w*0.95,h*1.0)],(120,44,150),0.85,60,w,h)
    yy,xx=np.ogrid[0:h,0:w]
    d=np.sqrt((xx-w*0.5)**2+(yy-h*0.1)**2)/(w*0.6)
    g=np.clip(1-d,0,1)**2*0.4
    org=np.array(AMBER,np.float32)
    arr=arr*(1-g[:,:,None])+org[None,None,:]*g[:,:,None]
    return Image.fromarray(np.clip(arr,0,255).astype(np.uint8),"RGB").convert("RGBA")

_HDR={}
def ticket(lot_title, partner, valeur_txt, serial):
    card=Image.new("RGBA",(TW,TH),(255,255,255,255))
    # corps blanc avec bord arrondi
    mask=Image.new("L",(TW,TH),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,TW-1,TH-1],radius=30,fill=255)
    base=Image.new("RGBA",(TW,TH),(0,0,0,0))
    base=Image.composite(card,base,mask)
    # bandeau sombre haut (50%)
    bh=int(TH*0.46)
    key=(TW,bh)
    if key not in _HDR: _HDR[key]=header_band(TW,bh)
    band=_HDR[key].copy()
    bmask=Image.new("L",(TW,bh),0); ImageDraw.Draw(bmask).rounded_rectangle([0,0,TW-1,bh+30],radius=30,fill=255)
    band.putalpha(bmask)
    base.alpha_composite(band,(0,0))
    d=ImageDraw.Draw(base)
    # logo NDS compact, haut-gauche (scale 0.17 -> ~215x90)
    lscale=0.17; lw=int(L.LOGO.width*lscale); lh=int(L.LOGO.height*lscale)
    L.put_logo(base, 60+lw/2, 46+lh/2, lscale)
    # serial chip (haut droite)
    sfnt=L.font(40,800); sw=L.measure(serial,sfnt)[0]; cw=sw+70
    pill=Image.new("RGBA",(cw,76),(0,0,0,0))
    ImageDraw.Draw(pill).rounded_rectangle([0,0,cw-1,75],radius=38,fill=AMBER+(255,))
    ImageDraw.Draw(pill).text((cw/2,38),serial,font=sfnt,fill=INK+(255,),anchor="mm")
    base.alpha_composite(pill,(TW-cw-40,44))
    # eyebrow TICKET TOMBOLA (sous le logo, pleine largeur a gauche)
    ey=46+lh+26
    d.text((68, ey), "TICKET TOMBOLA", font=L.font(32,800), fill=TEAL+(255,), anchor="lm")
    # lot title
    d.text((68, ey+54), lot_title, font=L.font(50,800), fill=WHITE+(255,), anchor="lm")
    # partner / valeur
    sub = (partner+"  ·  "+valeur_txt) if partner else valeur_txt
    d.text((68, ey+104), sub, font=L.font(34,600), fill=(222,228,246,255), anchor="lm")
    # ligne perforee
    py=bh+6
    for x in range(40, TW-40, 34):
        d.line([(x,py),(x+18,py)], fill=(150,150,160,255), width=3)
    # corps : champs a remplir
    fy=bh+62; fx=80; fnt=L.font(40,700); lcol=INK
    def field(label, y, frac=0.82):
        d.text((fx,y), label, font=fnt, fill=lcol, anchor="lm")
        lw=L.measure(label,fnt)[0]
        x0=fx+lw+24; x1=int(TW*frac)
        d.line([(x0,y+22),(x1,y+22)], fill=(60,66,90,255), width=3)
    field("Gagnant :", fy)
    field("Téléphone :", fy+80)
    # ligne date + emargement
    d.text((fx, fy+160), "Tiré le :", font=fnt, fill=lcol, anchor="lm")
    lw=L.measure("Tiré le :",fnt)[0]; d.line([(fx+lw+24, fy+182),(int(TW*0.46), fy+182)], fill=(60,66,90,255), width=3)
    d.text((int(TW*0.52), fy+160), "Émargement :", font=fnt, fill=lcol, anchor="lm")
    lw2=L.measure("Émargement :",fnt)[0]; d.line([(int(TW*0.52)+lw2+24, fy+182),(TW-80, fy+182)], fill=(60,66,90,255), width=3)
    # mention bas — co-brand Nuits du Sud x Flowin (deux tons, centre)
    fA=L.font(30,800)
    seg=[("Nuits du Sud",(90,96,120)),("  ×  ",(150,156,176)),("Flowin",L.ORANGE)]
    totw=sum(L.measure(txt,fA)[0] for txt,_ in seg)
    x=TW/2-totw/2; yA=TH-58
    for txt,col in seg:
        d.text((x,yA),txt,font=fA,fill=col+(255,),anchor="lm"); x+=L.measure(txt,fA)[0]
    d.text((TW/2, TH-24), "9 → 18 juillet 2026 · Vence · à présenter chez le commerce", font=L.font(24,600), fill=MUTE+(255,), anchor="mm")
    # contour fin
    ImageDraw.Draw(base).rounded_rectangle([1,1,TW-2,TH-2],radius=30,outline=(40,46,70,120),width=2)
    return base

def build_lot_pdf(lot_label, partner, valeur_txt, serials, fname):
    pages=[]
    per_page = COLS * ((PH - 2*MARGIN + GAPY)//(TH+GAPY))
    rows = (PH - 2*MARGIN + GAPY)//(TH+GAPY)
    i=0
    while i < len(serials):
        page=Image.new("RGB",(PW,PH),(244,246,250))
        # entete de planche
        dd=ImageDraw.Draw(page)
        dd.text((MARGIN, 60), "Tickets tombola — "+lot_label, font=L.font(46,800), fill=(20,24,50))
        dd.text((PW-MARGIN, 70), f"{len(serials)} ticket(s)", font=L.font(34,600), fill=(90,96,120), anchor="rm")
        for r in range(rows):
            for c in range(COLS):
                if i>=len(serials): break
                t=ticket(lot_label, partner, valeur_txt, serials[i])
                x=MARGIN + c*(TW+GAPX)
                y=MARGIN+40 + r*(TH+GAPY)
                page.paste(t, (x,y), t)
                i+=1
        pages.append(page)
    p=f"{OUT}/{fname}.pdf"
    pages[0].save(p, "PDF", resolution=300.0, save_all=True, append_images=pages[1:])
    # preview png de la 1ere page
    pages[0].resize((620,877)).save(f"{OUT}/{fname}_preview.png")
    return p, len(pages)

LOTS = [
 ("Domaine de la Bergerie — Nuit offerte", "Domaine de la Bergerie", "Valeur 51 €",
   [f"NDS-BERGERIE-{n:03d}" for n in range(1,6)], "nds_tickets_bergerie"),
 ("Carrosserie GP — Bon d'achat révision", "Carrosserie GP", "Valeur 78 €",
   [f"NDS-CARROSSERIE-{n:03d}" for n in range(1,3)], "nds_tickets_carrosserie-gp"),
 ("Nuits du Sud — Places de concert", "", "12 places · 1 tirage/soir",
   [f"NDS-CONCERT-{n:03d}" for n in range(1,13)], "nds_tickets_concert"),
 ("Électroménager Giordano — Bon d'achat", "Électroménager Giordano", "Valeur 78 €",
   [f"NDS-GIORDANO-{n:03d}" for n in range(1,3)], "nds_tickets_giordano"),
 ("Auto-Moto-École Pégase — Formation 125", "Auto-Moto-École Pégase", "Valeur 280 €",
   ["NDS-PEGASE-F125-001"], "nds_tickets_pegase-formation125"),
 ("Auto-Moto-École Pégase — Remise permis 50 €", "Auto-Moto-École Pégase", "Valeur 50 €",
   ["NDS-PEGASE-REMISE-001"], "nds_tickets_pegase-remise"),
 ("Utile Vence — Bon d'achat", "Utile Vence", "Valeur 13 €",
   [f"NDS-UTILE-{n:03d}" for n in range(1,20)], "nds_tickets_utile"),
]

if __name__=="__main__":
    total=0
    for label,partner,val,serials,fn in LOTS:
        p,n=build_lot_pdf(label,partner,val,serials,fn)
        total+=len(serials)
        print(f"OK {p}  ({len(serials)} tickets, {n} page(s))")
    print("DONE tickets:", total)
