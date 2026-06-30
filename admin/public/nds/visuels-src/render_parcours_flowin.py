# -*- coding: utf-8 -*-
# Parcours Jeu / Flowin x Nuits du Sud — version VERTICALE 9x16 du spot.
# Recompose les 6 scenes du spot (intro / comment ca marche / a gagner / ou jouer /
# nos partenaires LOGOS / grand tirage + Flowin). Flash sans e. QR badge persistant.
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import qrcode

W,H,FPS=1080,1920,24
DUR=37.0; NF=int(DUR*FPS)
OUT=sys.argv[4] if len(sys.argv)>4 else "/home/claude/spotwork/frames"
os.makedirs(OUT,exist_ok=True)
NAVY=(10,16,32); WHITE=(248,249,252); SOFT=(206,212,228); AMBER=(244,181,68)
MAGENTA=(230,24,127); TEAL=(32,224,196); CARD=(30,38,72); CARD2=(42,52,92)
FP="/home/claude/vid/fonts/Manrope.ttf"; ASSET="/home/claude/spotwork"
_fc={}
def font(s,w=800):
    k=(s,w)
    if k in _fc: return _fc[k]
    f=ImageFont.truetype(FP,int(s))
    try: f.set_variation_by_axes([w])
    except: pass
    _fc[k]=f; return f
def ease(x): x=max(0.0,min(1.0,x)); return x*x*(3-2*x)
def ramp(t,a,b): return 0.0 if t<a else (1.0 if t>=b else (t-a)/(b-a))
def tw(d,txt,f): return d.textlength(txt,font=f)

# ---- fond statique (navy + lueur magenta haut-droite, style spot) ----
def _bg():
    yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
    base=np.zeros((H,W,3),np.float32)
    for i in range(3): base[:,:,i]=NAVY[i]
    def rad(cx,cy,r,col,s):
        d=np.sqrt((xx-cx)**2+(yy-cy)**2)/r; g=np.clip(1-d,0,1)**2*s
        return np.stack([g*col[0],g*col[1],g*col[2]],-1)
    acc=rad(W*0.82,H*0.16,W*0.75,(150,40,95),0.55)+rad(W*0.28,H*0.42,W*0.95,(46,62,122),0.40)+rad(W*0.5,H*0.84,W*0.7,(20,60,90),0.22)
    return Image.fromarray(np.clip(base+acc,0,255).astype(np.uint8),"RGB").convert("RGBA")
BG=_bg()
LOGO=Image.open(os.path.join(ASSET,"logo_nds.png")).convert("RGBA")
# QR
_qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=18,border=2)
_qr.add_data("https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-digitale"); _qr.make(fit=True)
QR=_qr.make_image(fill_color="black",back_color="white").convert("RGB")

def put_alpha(img,layer,a):
    if a>=1.0: img.alpha_composite(layer); return
    al=layer.split()[3].point(lambda p:int(p*a)); layer.putalpha(al); img.alpha_composite(layer)

def text(img,cx,cy,txt,size,col,a=1.0,w=800,anchor="mm",slide=0):
    if a<=0: return
    f=font(size,w); l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    yo=int((1-ease(a))*slide)
    d.text((cx,cy+yo),txt,font=f,fill=col,anchor=anchor)
    put_alpha(img,l,ease(a))

def head(img,cx,cy,kicker,a):  # petit titre de section
    text(img,cx,cy,kicker,34,TEAL,a,800,"mm",24)

def logo_header(img):
    lw=int(W*0.30); lh=int(LOGO.height*lw/LOGO.width)
    img.alpha_composite(LOGO.resize((lw,lh),Image.LANCZOS),(60,64))

def qr_badge(img,a=1.0,qsz=300):  # badge QR persistant bas-centre
    if a<=0: return
    cw=qsz+64; cx=(W-cw)//2; cy=H-cw-92
    card=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(card)
    d.rounded_rectangle([cx,cy,cx+cw,cy+cw],radius=40,fill=(255,255,255,255))
    card.paste(QR.resize((qsz,qsz),Image.NEAREST),(cx+32,cy+32))
    put_alpha(img,card,ease(a))
    text(img,W/2,cy-40,"FLASH & JOUE",34,AMBER,a,800,"mm")
    text(img,W/2,cy+cw+38,"Le grand jeu des Nuits du Sud",32,WHITE,a,700,"mm")

def step_pill(img,cx,cy,wd,ht,num,txt,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2); yo=int((1-ease(a))*30)
    d.rounded_rectangle([x0,y0+yo,x0+wd,y0+ht+yo],radius=int(ht*0.30),fill=CARD+(235,))
    # numero rond
    r=int(ht*0.32); ncx=x0+r+28; ncy=y0+ht//2+yo
    d.ellipse([ncx-r,ncy-r,ncx+r,ncy+r],fill=MAGENTA+(255,))
    d.text((ncx,ncy),str(num),font=font(int(r*1.1),800),fill=WHITE,anchor="mm")
    d.text((ncx+r+30,ncy),txt,font=font(int(ht*0.34),700),fill=WHITE,anchor="lm")
    put_alpha(img,l,ease(a))

def info_card(img,cx,cy,wd,ht,title,desc,icon_col,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2); yo=int((1-ease(a))*30)
    d.rounded_rectangle([x0,y0+yo,x0+wd,y0+ht+yo],radius=28,fill=CARD+(235,))
    bar=18; d.rounded_rectangle([x0,y0+yo,x0+bar,y0+ht+yo],radius=8,fill=icon_col+(255,))
    d.text((x0+56,y0+ht*0.34+yo),title,font=font(int(ht*0.26),800),fill=WHITE,anchor="lm")
    d.text((x0+56,y0+ht*0.70+yo),desc,font=font(int(ht*0.17),600),fill=SOFT,anchor="lm")
    put_alpha(img,l,ease(a))

def logo_card(img,cx,cy,wd,ht,slug,a):
    if a<=0: return
    try: lg=Image.open(f"/home/claude/vid/logos/{slug}.png").convert("RGBA")
    except: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2); yo=int((1-ease(a))*24)
    d.rounded_rectangle([x0,y0+yo,x0+wd,y0+ht+yo],radius=24,fill=(255,255,255,255))
    bb=lg.split()[3].getbbox()
    if bb: lg=lg.crop(bb)
    pad=0.16; mw,mh=int(wd*(1-pad)),int(ht*(1-pad))
    r=min(mw/lg.width,mh/lg.height); nw,nh=max(1,int(lg.width*r)),max(1,int(lg.height*r))
    lg=lg.resize((nw,nh),Image.LANCZOS)
    l.alpha_composite(lg,(int(cx-nw/2),int(cy-nh/2)+yo))
    put_alpha(img,l,ease(a))

def mini_map(img,cx,cy,wd,ht,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2)
    d.rounded_rectangle([x0,y0,x0+wd,y0+ht],radius=22,fill=(20,28,54,235))
    for gx in range(1,4): d.line([(x0+gx*wd/4,y0),(x0+gx*wd/4,y0+ht)],fill=(60,70,110,120),width=2)
    for gy in range(1,3): d.line([(x0,y0+gy*ht/3),(x0+wd,y0+gy*ht/3)],fill=(60,70,110,120),width=2)
    pins=[(0.22,0.30,AMBER),(0.62,0.25,MAGENTA),(0.78,0.62,AMBER),(0.30,0.70,MAGENTA),(0.50,0.50,TEAL)]
    for px,py,col in pins:
        px2=x0+px*wd; py2=y0+py*ht; r=14
        d.ellipse([px2-r,py2-r,px2+r,py2+r],fill=col+(255,))
        d.ellipse([px2-r-7,py2-r-7,px2+r+7,py2+r+7],outline=col+(110,),width=3)
    put_alpha(img,l,ease(a))

# ---------------- SCENES ----------------
def scene(t):
    img=BG.copy(); logo_header(img)
    if t<6.0:                       # 1 INTRO
        l=t
        # badge GRAND JEU OFFICIEL
        a0=ramp(l,0.0,0.4)
        if a0>0:
            ll=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ll)
            bf=font(30,800); bx=60; bw=tw(d,"GRAND JEU OFFICIEL",bf)
            d.rounded_rectangle([bx,250,bx+bw+56,310],radius=30,fill=(38,46,86,235))
            d.text((bx+28,280),"GRAND JEU OFFICIEL",font=bf,fill=TEAL,anchor="lm")
            put_alpha(img,ll,ease(a0))
        for i,(wd,pc) in enumerate([("Flash",AMBER),("Joue",MAGENTA),("Gagne",TEAL)]):
            a=ramp(l,0.3+i*0.22,0.8+i*0.22); 
            if a<=0: continue
            yy=470+i*168
            ll=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ll)
            big=font(148,800); d.text((64,yy),wd,font=big,fill=WHITE,anchor="lm")
            wwd=tw(d,wd,big); d.text((64+wwd+8,yy),".",font=big,fill=pc,anchor="lm")
            put_alpha(img,ll,ease(a))
        a2=ramp(l,1.4,1.9)
        text(img,64,470+3*168+8,"Le grand jeu des Nuits du Sud",44,SOFT,a2,700,"lm",20)
        text(img,64,470+3*168+62,"× Flowin",44,MAGENTA,ramp(l,1.6,2.1),800,"lm",20)
        qr_badge(img,ramp(l,1.0,1.6))
    elif t<12.0:                    # 2 COMMENT CA MARCHE
        l=t-6.0; head(img,W/2,250,"COMMENT ÇA MARCHE",ramp(l,0,0.4))
        steps=[(1,"Flash le QR code"),(2,"Réponds au quiz"),(3,"Cumule des tickets")]
        for i,(n,txt) in enumerate(steps):
            step_pill(img,W/2,440+i*150,920,120,n,txt,ramp(l,0.4+i*0.25,0.9+i*0.25))
        text(img,W/2,440+3*150+10,"Plus tu joues, plus tu gagnes !",42,AMBER,ramp(l,1.5,2.0),800,"mm",20)
        qr_badge(img,1.0)
    elif t<18.0:                    # 3 A GAGNER
        l=t-12.0; head(img,W/2,250,"À GAGNER",ramp(l,0,0.4))
        info_card(img,W/2,440,920,150,"Des places de concert","à gagner chaque soir du festival",TEAL,ramp(l,0.4,0.9))
        info_card(img,W/2,620,920,150,"Des bons d'achat","dans les commerces participants",AMBER,ramp(l,0.7,1.2))
        text(img,W/2,800,"Cumule tes tickets et remporte les lots !",40,MAGENTA,ramp(l,1.4,1.9),800,"mm",20)
        qr_badge(img,1.0)
    elif t<24.0:                    # 4 OU JOUER
        l=t-18.0; head(img,W/2,250,"OÙ JOUER ?",ramp(l,0,0.4))
        text(img,W/2,360,"Rendez-vous sur la carte",54,WHITE,ramp(l,0.2,0.7),800,"mm",20)
        mini_map(img,W/2,540,700,250,ramp(l,0.5,1.0))
        info_card(img,W/2,758,920,128,"Ce soir, au festival","aux caisses, aux bars, brigade verte",MAGENTA,ramp(l,0.9,1.4))
        info_card(img,W/2,902,920,128,"Et chez les commerces","tous les commerces participants",AMBER,ramp(l,1.1,1.6))
        qr_badge(img,1.0,250)
    elif t<30.0:                    # 5 NOS PARTENAIRES (logos)
        l=t-24.0; head(img,W/2,240,"NOS PARTENAIRES",ramp(l,0,0.4))
        tw_,th_=300,150; gx=W/2; dx2=tw_/2+18; dx3=tw_+22
        rows=[[("bergerie",gx-dx2,360),("pegase",gx+dx2,360)],
              [("utile",gx-dx3,524),("charvolin",gx,524),("carrosserie-gp",gx+dx3,524)],
              [("giordano",gx-dx2,688),("alafut",gx+dx2,688)]]
        i=0
        for row in rows:
            for slug,cx,cy in row:
                logo_card(img,cx,cy,tw_,th_,slug,ramp(l,0.4+i*0.10,0.9+i*0.10)); i+=1
        qr_badge(img,1.0,250)
    else:                           # 6 GRAND TIRAGE + FLOWIN
        l=t-30.0
        text(img,W/2,300,"Et un grand tirage final",58,AMBER,ramp(l,0,0.45),800,"mm",24)
        text(img,W/2,372,"à la clôture du festival",48,WHITE,ramp(l,0.2,0.7),700,"mm",24)
        a3=ramp(l,0.6,1.1)
        if a3>0:
            ll=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ll)
            f=font(132,800); fl="Flow"; ww=tw(d,fl,f); tot=ww+tw(d,"in",f); sx=W/2-tot/2; sy=H*0.345
            d.text((sx,sy),fl,font=f,fill=MAGENTA,anchor="lm")
            d.text((sx+ww,sy),"in",font=f,fill=AMBER,anchor="lm")
            put_alpha(img,ll,ease(a3))
            text(img,W/2,H*0.345+108,"Partenaire jeux des Nuits du Sud",40,SOFT,ramp(l,0.9,1.4),700,"mm")
        qr_badge(img,ramp(l,0.4,0.9),300)
    return img.convert("RGB")

if __name__=="__main__":
    a=int(sys.argv[1]); b=int(sys.argv[2])
    for i in range(a,min(b,NF)):
        scene(i/FPS).save(f"{OUT}/f{i:04d}.jpg",quality=90)
    print("OK",a,min(b,NF))
