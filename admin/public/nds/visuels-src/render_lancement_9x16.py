#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Renderer complet nds-lancement-jeux-9x16 (v4) — 5 scenes a la charte NDS/Flowin.
Demandes appliquees :
  - "Flash" SANS e partout (intro + bloc QR)
  - police intro agrandie
  - bandeau "Plus tu joues, plus tu gagnes !" rendu visuel/important
  - QR centre
  - QR -> station ev-nds-ecrans (NDS L'Ecran)
Produit : panel_intro / panel_comment / panel_gagner / panel_ouj / panel_finale (.png)
"""
import numpy as np
import qrcode
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = "/home/claude/flowin-events-/admin/public/nds"
FONT = "/home/claude/work/fonts/Manrope-ExtraBold.ttf"
OUT = "/home/claude/work"
W, H = 1080, 1920

BG=(8,16,29); MAGENTA=(230,24,127); AMBER=(244,181,68); TEAL=(45,212,160)
BLUE=(66,133,244); WHITE=(255,255,255); GREY=(176,186,205)
PARTNERS=["bergerie","pegase","utile","carrosserie-gp","giordano","charvolin","nook","cycles963"]
QR_URL="https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-ecrans"


def f(weight,size):
    ft=ImageFont.truetype(FONT,size)
    try: ft.set_variation_by_name(weight)
    except Exception: pass
    return ft

def radial(size,cx,cy,r,color,strength):
    w,h=size; yy,xx=np.mgrid[0:h,0:w]
    d=np.sqrt((xx-cx)**2+(yy-cy)**2)/r; a=np.clip(1-d,0,1)**2*strength
    L=np.zeros((h,w,4),np.uint8)
    for i in range(3): L[...,i]=color[i]
    L[...,3]=(a*255).astype(np.uint8); return Image.fromarray(L,"RGBA")

def rounded(size,radius,fill):
    im=Image.new("RGBA",size,(0,0,0,0))
    ImageDraw.Draw(im).rounded_rectangle([0,0,size[0]-1,size[1]-1],radius,fill=fill); return im

def trim_content(im):
    """Rogne un logo sur sa marque reelle (marges transparentes OU fond opaque uni)."""
    a=np.array(im.convert("RGBA")); alpha=a[...,3]
    if alpha.min()<240:                      # a de la transparence -> bbox alpha
        mask=alpha>28
    else:                                    # fond opaque uni -> bbox du contenu vs coin
        rgb=a[...,:3].astype(int)
        corner=np.array([a[0,0,:3],a[0,-1,:3],a[-1,0,:3],a[-1,-1,:3]]).astype(int).mean(0)
        mask=np.abs(rgb-corner).sum(2)>45
    ys,xs=np.where(mask)
    if len(xs)==0: return im
    m=6
    return im.crop((max(0,xs.min()-m),max(0,ys.min()-m),
                    min(im.size[0],xs.max()+1+m),min(im.size[1],ys.max()+1+m)))

def fit_contain(logo,bw,bh,pad):
    logo=trim_content(logo)               # <-- rogne d'abord les marges
    lw,lh=logo.size; s=min((bw-2*pad)/lw,(bh-2*pad)/lh)
    return logo.resize((max(1,int(lw*s)),max(1,int(lh*s))),Image.LANCZOS)

def tc(d,cx,y,s,font,fill,sp=0):
    if sp:
        tot=sum(d.textlength(ch,font=font)+sp for ch in s)-sp; x=cx-tot/2
        for ch in s: d.text((x,y),ch,font=font,fill=fill); x+=d.textlength(ch,font=font)+sp
    else:
        d.text((cx-d.textlength(s,font=font)/2,y),s,font=font,fill=fill)

def bg_base():
    img=Image.new("RGBA",(W,H),BG+(255,))
    img.alpha_composite(radial((W,H),int(W*0.30),430,620,MAGENTA,0.42))
    img.alpha_composite(radial((W,H),int(W*0.82),900,700,(24,60,150),0.40)); return img

def header(img):
    nds=Image.open(f"{REPO}/logo_nds_blanc_hd.png").convert("RGBA")
    hw=360; hh=int(nds.size[1]*hw/nds.size[0])
    img.alpha_composite(nds.resize((hw,hh),Image.LANCZOS),((W-hw)//2,58))

def qr_block(img,d):
    qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=18,border=2)
    qr.add_data(QR_URL); qr.make(fit=True)
    qim=qr.make_image(fill_color="black",back_color="white").convert("RGB").resize((420,420),Image.NEAREST)
    qx=(W-420)//2; qy=1250            # QR CENTRE
    pad=46; cw,ch=420+2*pad,420+2*pad; cx,cy=qx-pad,qy-pad
    glow=rounded((cw+60,ch+60),60,(244,181,68,70)).filter(ImageFilter.GaussianBlur(24))
    img.alpha_composite(glow,(cx-30,cy-30))
    img.alpha_composite(rounded((cw,ch),40,(255,255,255,255)),(cx,cy))
    img.paste(qim,(qx,qy))
    tc(d,W//2,cy-74,"FLASH & JOUE",f("ExtraBold",40),AMBER,sp=4)     # SANS e
    tc(d,W//2,cy+ch+20,"Le grand jeu des Nuits du Sud",f("SemiBold",34),WHITE)

# ---- icones ----
def ic_ticket(sz=72):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.rounded_rectangle([10,20,sz-10,sz-20],7,outline=WHITE,width=5)
    d.pieslice([2,sz//2-9,18,sz//2+9],270,90,fill=BG)
    d.pieslice([sz-18,sz//2-9,sz-2,sz//2+9],90,270,fill=BG)
    for yy in range(27,sz-22,8): d.line([sz//2,yy,sz//2,yy+4],fill=WHITE,width=3)
    return im
def ic_glass(sz=72):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.polygon([(14,16),(sz-14,16),(sz//2,sz//2+2)],outline=WHITE,width=5)
    d.line([sz//2,sz//2+2,sz//2,sz-15],fill=WHITE,width=5)
    d.line([sz//2-15,sz-15,sz//2+15,sz-15],fill=WHITE,width=5)
    d.ellipse([sz//2-5,9,sz//2+6,20],fill=WHITE); return im
def ic_leaf(sz=72):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.pieslice([11,11,sz-4,sz-4],90,270,fill=WHITE); d.pieslice([4,11,sz-11,sz-4],270,90,fill=WHITE)
    d.line([sz-13,15,15,sz-13],fill=BG,width=5); return im
def ic_shop(sz=72):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.polygon([(9,28),(sz-9,28),(sz-14,13),(14,13)],fill=WHITE)
    for i in range(4):
        x0=14+i*(sz-28)/4; d.polygon([(x0+(sz-28)/8,28),(x0,13),(x0+(sz-28)/4,13)],fill=BG)
    d.rectangle([14,28,sz-14,sz-11],outline=WHITE,width=5)
    d.rectangle([sz//2-7,sz-30,sz//2+7,sz-11],fill=WHITE); return im
def ic_note(sz=72):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.ellipse([12,sz-26,32,sz-8],fill=WHITE); d.ellipse([sz-30,sz-20,sz-10,sz-2],fill=WHITE)
    d.line([30,sz-17,30,14],fill=WHITE,width=5); d.line([sz-12,sz-11,sz-12,20],fill=WHITE,width=5)
    d.line([30,14,sz-12,20],fill=WHITE,width=6); return im
def ic_euro(sz=72):
    im=Image.new("RGBA",(sz,sz),(0,0,0,0)); d=ImageDraw.Draw(im)
    d.text((sz//2-d.textlength("€",font=f("ExtraBold",56))/2,4),"€",font=f("ExtraBold",56),fill=WHITE)
    return im

def pastille(img,d,y,accent,icon,label,sub=None,ph=None):
    x0,x1=60,W-60; ph=ph or (104 if sub else 96)
    img.alpha_composite(rounded((x1-x0,ph),26,(20,28,52,240)),(x0,y))
    img.alpha_composite(rounded((10,ph-24),5,accent+(255,)),(x0+12,y+12))
    bd=76; bx,by=x0+40,y+(ph-bd)//2
    badge=Image.new("RGBA",(bd,bd),(0,0,0,0)); ImageDraw.Draw(badge).ellipse([0,0,bd-1,bd-1],fill=accent+(255,))
    ic=icon(72); badge.alpha_composite(ic,((bd-72)//2,(bd-72)//2)); img.alpha_composite(badge,(bx,by))
    tx=bx+bd+26
    if sub:
        d.text((tx,y+22),label,font=f("ExtraBold",42),fill=WHITE)
        d.text((tx,y+66),sub,font=f("Medium",27),fill=GREY)
    else:
        d.text((tx,y+(ph-46)//2),label,font=f("ExtraBold",44),fill=WHITE)

# ================= SCENES =================
def scene_intro():
    img=bg_base(); d=ImageDraw.Draw(img); header(img)
    # pill GRAND JEU OFFICIEL
    ft=f("Bold",30); lbl="GRAND JEU OFFICIEL"; wtxt=sum(d.textlength(c,font=ft)+6 for c in lbl)-6
    pw=int(wtxt)+64; px=(W-pw)//2
    d.rounded_rectangle([px,300,px+pw,364],32,outline=AMBER,width=3)
    tc(d,W//2,314,lbl,ft,AMBER,sp=6)
    # Flash. Joue. Gagne.  (POLICE AGRANDIE ~150, SANS e)
    big=f("ExtraBold",150); dot=[(".",MAGENTA),(".",AMBER),(".",TEAL)]
    for i,(w,c) in enumerate([("Flash",MAGENTA),("Joue",AMBER),("Gagne",TEAL)]):
        yy=420+i*168
        wl=d.textlength(w,font=big); tot=wl+d.textlength(".",font=big)
        x=(W-tot)/2
        d.text((x,yy),w,font=big,fill=WHITE)
        d.text((x+wl,yy),".",font=big,fill=c)
    tc(d,W//2,948,"Le grand jeu des Nuits du Sud × Flowin",f("Medium",38),GREY)
    qr_block(img,d); img.convert("RGB").save(f"{OUT}/panel_intro.png",quality=95); print("intro OK")

def scene_comment():
    img=bg_base(); d=ImageDraw.Draw(img); header(img)
    tc(d,W//2,246,"COMMENT ÇA MARCHE",f("Bold",34),AMBER,sp=4)
    steps=[("1","Flash le QR code"),("2","Réponds au quiz"),("3","Cumule des tickets")]  # SANS e
    y0=336
    for i,(n,t) in enumerate(steps):
        y=y0+i*130; x0=70
        img.alpha_composite(rounded((W-140,110),26,(20,28,52,240)),(x0,y))
        # numero
        bd=78; ImageDraw.Draw(img)  # placeholder
        badge=Image.new("RGBA",(bd,bd),(0,0,0,0)); ImageDraw.Draw(badge).ellipse([0,0,bd-1,bd-1],fill=AMBER+(255,))
        bdd=ImageDraw.Draw(badge); bdd.text((bd/2-bdd.textlength(n,font=f("ExtraBold",46))/2,12),n,font=f("ExtraBold",46),fill=BG)
        img.alpha_composite(badge,(x0+22,y+16))
        d.text((x0+22+bd+26,y+30),t,font=f("ExtraBold",46),fill=WHITE)
    # bandeau PLUS TU JOUES (visuel important)
    by=y0+3*130+18
    band=rounded((W-120,140),34,None); 
    # gradient amber->magenta band
    bw,bh=W-120,140; yy,xx=np.mgrid[0:bh,0:bw]; t=np.clip(xx/bw,0,1)
    g=(np.array(AMBER)[None,None,:]*(1-t)[...,None]+np.array(MAGENTA)[None,None,:]*t[...,None]).astype(np.uint8)
    ba=np.dstack([g,np.full((bh,bw),255,np.uint8)])
    bandimg=Image.fromarray(ba,"RGBA"); m=Image.new("L",(bw,bh),0); ImageDraw.Draw(m).rounded_rectangle([0,0,bw-1,bh-1],34,fill=255); bandimg.putalpha(m)
    glow=rounded((bw+50,bh+50),50,MAGENTA+(90,)).filter(ImageFilter.GaussianBlur(26))
    img.alpha_composite(glow,(60-25,by-25)); img.alpha_composite(bandimg,(60,by))
    tc(d,W//2,by+30,"PLUS TU JOUES,",f("ExtraBold",50),WHITE)
    tc(d,W//2,by+82,"PLUS TU GAGNES !",f("ExtraBold",50),WHITE)
    qr_block(img,d); img.convert("RGB").save(f"{OUT}/panel_comment.png",quality=95); print("comment OK")

def scene_gagner():
    img=bg_base(); d=ImageDraw.Draw(img); header(img)
    tc(d,W//2,246,"À GAGNER",f("Bold",34),AMBER,sp=6)
    pastille(img,d,360,MAGENTA,ic_note,"Des places de concert",sub="à gagner chaque soir du festival",ph=130)
    pastille(img,d,516,AMBER,ic_euro,"Des bons d'achat",sub="chez les commerces partenaires",ph=130)
    # rappel tickets
    pastille(img,d,672,TEAL,ic_ticket,"+ des tickets tombola",sub="pour le grand tirage final",ph=130)
    qr_block(img,d); img.convert("RGB").save(f"{OUT}/panel_gagner.png",quality=95); print("gagner OK")

def scene_ouj():
    img=bg_base(); d=ImageDraw.Draw(img); header(img)
    tc(d,W//2,235,"OÙ JOUER ?",f("Bold",32),AMBER,sp=8)
    tc(d,W//2,280,"Rendez-vous sur la carte",f("ExtraBold",60),WHITE)
    d.rounded_rectangle([W//2-120,372,W//2+120,380],4,fill=AMBER)
    d.text((70,430),"CE SOIR, AU FESTIVAL",font=f("Bold",28),fill=AMBER)
    pastille(img,d,476,AMBER,ic_ticket,"Aux caisses")
    pastille(img,d,586,MAGENTA,ic_glass,"Aux bars")
    pastille(img,d,696,TEAL,ic_leaf,"Avec la Brigade Verte")
    d.text((70,826),"ET CHEZ LES COMMERCES",font=f("Bold",28),fill=AMBER)
    pastille(img,d,872,BLUE,ic_shop,"Tous les commerces",sub="tous les commerces participants")
    qr_block(img,d); img.convert("RGB").save(f"{OUT}/panel_ouj.png",quality=95); print("ouj OK")

def scene_finale():
    img=bg_base(); d=ImageDraw.Draw(img); header(img)
    y=232; ft=f("ExtraBold",60)
    d.text((90,y),"Un grand ",font=ft,fill=WHITE)
    d.text((90+d.textlength("Un grand ",font=ft),y),"tirage au sort",font=ft,fill=AMBER)
    d.text((90,y+76),"à la clôture du festival",font=ft,fill=WHITE)
    d.rounded_rectangle([90,y+162,320,y+170],4,fill=AMBER)
    tc(d,W//2,440,"NOS PARTENAIRES",f("Bold",30),AMBER,sp=6)
    rows=[PARTNERS[0:3],PARTNERS[3:6],PARTNERS[6:8]]; cw,ch=306,140; gx,gy=20,20; gy0=478
    for r,row in enumerate(rows):
        n=len(row); tot=n*cw+(n-1)*gx; x0=(W-tot)//2; cy=gy0+r*(ch+gy)
        for c,slug in enumerate(row):
            cx=x0+c*(cw+gx); img.alpha_composite(rounded((cw,ch),22,(255,255,255,255)),(cx,cy))
            try:
                lg=fit_contain(Image.open(f"{REPO}/partenaires/{slug}.png").convert("RGBA"),cw,ch,10)
                img.alpha_composite(lg,(cx+(cw-lg.size[0])//2,cy+(ch-lg.size[1])//2))
            except FileNotFoundError: pass
    fy=gy0+3*(ch+gy)+12; ftf=f("ExtraBold",72); word="Flowin"; ww=d.textlength(word,font=ftf); fx=(W-ww)/2
    wl=Image.new("RGBA",(int(ww)+8,96),(0,0,0,0)); ImageDraw.Draw(wl).text((0,0),word,font=ftf,fill=WHITE)
    arr=np.array(wl); gxx=np.linspace(0,1,arr.shape[1])
    grad=(np.array(MAGENTA)[None,:]*(1-gxx)[:,None]+np.array(AMBER)[None,:]*gxx[:,None]).astype(np.uint8)
    for i in range(3): arr[...,i]=grad[:,i][None,:]
    img.alpha_composite(Image.fromarray(arr,"RGBA"),(int(fx),int(fy)))
    tc(d,W//2,fy+90,"Partenaire jeux des Nuits du Sud",f("Medium",30),GREY)
    qr_block(img,d); img.convert("RGB").save(f"{OUT}/panel_finale.png",quality=95); print("finale OK")

if __name__=="__main__":
    scene_intro(); scene_comment(); scene_gagner(); scene_ouj(); scene_finale()
