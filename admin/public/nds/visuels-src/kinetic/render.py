#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os, math
from PIL import Image, ImageDraw, ImageFont
W,H=1080,1920; FPS=24; OUT="/home/claude/vid/frames"
os.makedirs(OUT,exist_ok=True)
FP="/home/claude/vid/fonts/Manrope.ttf"
def font(s,w=800):
    f=ImageFont.truetype(FP,s)
    try:f.set_variation_by_axes([w])
    except Exception:pass
    return f
QR=Image.open("/home/claude/vid/qr_ecrans_hd.png").convert("RGB")
LOGO=Image.open("/home/claude/repo/admin/public/nds/logo_nds_blanc_hd.png").convert("RGBA")
NAVY_TOP=(11,16,64);NAVY_BOT=(42,18,86);ORANGE=(255,122,26);TEAL=(32,224,196);WHITE=(255,255,255)
def clamp(x,a=0.,b=1.):return max(a,min(b,x))
def eo(x):x=clamp(x);return 1-(1-x)**3
def ramp(t,a,b):
    if b<=a:return 1.
    return clamp((t-a)/(b-a))
_bgcache={}
def make_bg(t):
    key=round(t*4)
    if key in _bgcache: base=_bgcache[key].copy()
    else:
        base=Image.new("RGB",(W,H),NAVY_TOP);px=base.load()
        for y in range(H):
            k=y/H
            px2=(int(NAVY_TOP[0]+(NAVY_BOT[0]-NAVY_TOP[0])*k),int(NAVY_TOP[1]+(NAVY_BOT[1]-NAVY_TOP[1])*k),int(NAVY_TOP[2]+(NAVY_BOT[2]-NAVY_TOP[2])*k))
            for x in range(W):px[x,y]=px2
        _bgcache[key]=base.copy()
    glow=Image.new("RGBA",(W,H),(0,0,0,0));gd=ImageDraw.Draw(glow)
    pulse=0.5+0.5*math.sin(t*2.2);cx,cy=W//2,int(H*0.42);maxr=int(620+60*pulse)
    for i in range(maxr,0,-10):
        a=int(46*(1-i/maxr)*(0.6+0.4*pulse));gd.ellipse([cx-i,cy-i,cx+i,cy+i],fill=(255,122,26,max(0,a)))
    return Image.alpha_composite(base.convert("RGBA"),glow)
def tl(txt,fnt,color):
    tmp=Image.new("RGBA",(10,10));d=ImageDraw.Draw(tmp);bb=d.textbbox((0,0),txt,font=fnt)
    tw,th=bb[2]-bb[0],bb[3]-bb[1];pad=40
    layer=Image.new("RGBA",(tw+pad*2,th+pad*2),(0,0,0,0));d=ImageDraw.Draw(layer)
    d.text((pad-bb[0],pad-bb[1]),txt,font=fnt,fill=color);return layer
def pop(base,layer,cx,cy,prog,sf=0.7,alpha=255):
    s=sf+(1-sf)*eo(prog);a=int(alpha*eo(min(1.,prog*1.6)))
    lw,lh=layer.size;nw,nh=max(1,int(lw*s)),max(1,int(lh*s));lr=layer.resize((nw,nh),Image.LANCZOS)
    if a<255:
        al=lr.split()[3].point(lambda p:int(p*a/255));lr.putalpha(al)
    yo=int((1-eo(prog))*40);base.alpha_composite(lr,(int(cx-nw/2),int(cy-nh/2)+yo))
def chip(base,txt,cx,cy,prog):
    fnt=font(46,800);layer=tl(txt,fnt,WHITE);lw,lh=layer.size
    s=0.7+0.3*eo(prog);nw,nh=int(lw*s),int(lh*s)
    pill=Image.new("RGBA",(nw+70,nh+30),(0,0,0,0));pd=ImageDraw.Draw(pill)
    a=int(255*eo(min(1,prog*1.5)))
    pd.rounded_rectangle([0,0,nw+69,nh+29],radius=(nh+29)//2,fill=(255,122,26,int(0.92*a)))
    lr=layer.resize((nw,nh),Image.LANCZOS);al=lr.split()[3].point(lambda p:int(p*a/255));lr.putalpha(al)
    pill.alpha_composite(lr,(35,15));yo=int((1-eo(prog))*30)
    base.alpha_composite(pill,(int(cx-(nw+70)/2),int(cy-(nh+30)/2)+yo))
def badge(base,t):
    f=eo(ramp(t,1.9,2.4));size=150;q=QR.resize((size,size),Image.NEAREST);pad=14
    card=Image.new("RGBA",(size+pad*2,size+pad*2),(255,255,255,int(235*f)));card.paste(q,(pad,pad))
    base.alpha_composite(card,(W-size-pad*2-40,52))
def logo(base,cy,scale,fade):
    lw=int(LOGO.width*scale);lh=int(LOGO.height*scale);lr=LOGO.resize((lw,lh),Image.LANCZOS)
    al=lr.split()[3].point(lambda p:int(p*fade));lr.putalpha(al);base.alpha_composite(lr,(int(W/2-lw/2),int(cy-lh/2)))
DUR=14.5;NF=int(DUR*FPS)
PARTNERS=["Domaine de la Bergerie","Auto-Moto-École Pégase","Utile Vence","Carrosserie GP","Électroménager J Giordano"]
STATIONS=["BAR","ENTRÉE","BRIGADE VERTE","ÉCRAN"]
def frame(t):
    img=make_bg(t)
    if t<1.9:
        pop(img,tl("CE SOIR",font(130,800),ORANGE),W/2,H*0.30,ramp(t,0.05,0.55),0.5)
        if t>0.45: pop(img,tl("GRAND JEU",font(118,800),WHITE),W/2,H*0.44,ramp(t,0.5,1.0),0.6)
        if t>0.9: logo(img,H*0.62,0.55*eo(ramp(t,0.9,1.5)),eo(ramp(t,0.9,1.4)))
    elif t<3.7:
        lt=t-1.9
        for (w,c,d0),y in zip([("FLASH",ORANGE,0.0),("JOUE",WHITE,0.35),("GAGNE",TEAL,0.7)],[H*0.34,H*0.47,H*0.60]):
            p=ramp(lt,d0,d0+0.5)
            if p>0:pop(img,tl(w,font(150,800),c),W/2,y,p,0.45)
    elif t<6.0:
        lt=t-3.7
        pop(img,tl("À GAGNER",font(86,700),TEAL),W/2,H*0.22,ramp(lt,0.0,0.4),0.6)
        pop(img,tl("DES PLACES",font(120,800),WHITE),W/2,H*0.38,ramp(lt,0.3,0.8),0.55)
        pop(img,tl("DE CONCERT",font(120,800),ORANGE),W/2,H*0.50,ramp(lt,0.45,0.95),0.55)
        if lt>0.9:
            pop(img,tl("+ DES BONS D'ACHAT",font(72,800),WHITE),W/2,H*0.66,ramp(lt,0.9,1.4),0.6)
            pop(img,tl("chez nos commerces partenaires",font(44,600),TEAL),W/2,H*0.74,ramp(lt,1.1,1.6),0.7)
    elif t<8.4:
        lt=t-6.0
        pop(img,tl("FLASHE PARTOUT",font(96,800),WHITE),W/2,H*0.26,ramp(lt,0.0,0.45),0.55)
        pop(img,tl("au festival",font(56,600),TEAL),W/2,H*0.345,ramp(lt,0.2,0.6),0.7)
        for i,(s,y) in enumerate(zip(STATIONS,[H*0.47,H*0.565,H*0.66,H*0.755])):
            chip(img,s,W/2,y,ramp(lt,0.5+i*0.18,0.9+i*0.18))
    elif t<10.2:
        lt=t-8.4
        pop(img,tl("CUMULE TES POINTS",font(86,800),WHITE),W/2,H*0.40,ramp(lt,0.0,0.5),0.55)
        pop(img,tl("REMPORTE LES LOTS !",font(96,800),ORANGE),W/2,H*0.54,ramp(lt,0.35,0.85),0.5)
    elif t<12.0:
        lt=t-10.2
        pop(img,tl("ET DANS LES COMMERCES",font(66,800),TEAL),W/2,H*0.24,ramp(lt,0.0,0.45),0.6)
        for i,name in enumerate(PARTNERS):
            p=ramp(lt,0.35+i*0.16,0.75+i*0.16)
            if p>0:pop(img,tl(name,font(54,700),WHITE),W/2,H*(0.36+i*0.085),p,0.7)
    else:
        lt=t-12.0
        pop(img,tl("FLASH LE QR",font(120,800),ORANGE),W/2,H*0.18,ramp(lt,0.0,0.45),0.5)
        p=eo(ramp(lt,0.25,0.9));qsz=int(640*p)
        if qsz>4:
            q=QR.resize((qsz,qsz),Image.NEAREST);card=Image.new("RGBA",(qsz+56,qsz+56),(255,255,255,255));card.paste(q,(28,28))
            img.alpha_composite(card,(int(W/2-(qsz+56)/2),int(H*0.28)))
        if lt>0.9:pop(img,tl("ce soir & dans les commerces",font(50,700),WHITE),W/2,H*0.80,ramp(lt,0.9,1.3),0.7)
        if lt>1.2:logo(img,H*0.90,0.5*eo(ramp(lt,1.2,1.7)),eo(ramp(lt,1.2,1.6)))
    if 1.9<=t<12.0: badge(img,t)
    return img.convert("RGB")
for i in range(NF):
    frame(i/FPS).save(f"{OUT}/f{i:04d}.png")
    if i%48==0:print("frame",i,"/",NF)
print("FRAMES_OK",NF)
