#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import math
from PIL import Image, ImageDraw, ImageFont
FP="/home/claude/vid/fonts/Manrope.ttf"
def font(s,w=800):
    f=ImageFont.truetype(FP,s)
    try:f.set_variation_by_axes([w])
    except Exception:pass
    return f
QR=Image.open("/home/claude/vid/qr_ecrans_hd.png").convert("RGB")
LOGO=Image.open("/home/claude/repo/admin/public/nds/logo_nds_blanc_hd.png").convert("RGBA")
NAVY_TOP=(11,16,64);NAVY_BOT=(42,18,86);ORANGE=(255,122,26);TEAL=(32,224,196);WHITE=(255,255,255)
def bg(W,H):
    img=Image.new("RGB",(W,H),NAVY_TOP);px=img.load()
    for y in range(H):
        k=y/H;px2=(int(NAVY_TOP[0]+(NAVY_BOT[0]-NAVY_TOP[0])*k),int(NAVY_TOP[1]+(NAVY_BOT[1]-NAVY_TOP[1])*k),int(NAVY_TOP[2]+(NAVY_BOT[2]-NAVY_TOP[2])*k))
        for x in range(W):px[x,y]=px2
    glow=Image.new("RGBA",(W,H),(0,0,0,0));gd=ImageDraw.Draw(glow)
    cx,cy=W//2,int(H*0.40);maxr=int(min(W,H)*0.75)
    for i in range(maxr,0,-12):
        a=int(40*(1-i/maxr));gd.ellipse([cx-i,cy-i,cx+i,cy+i],fill=(255,122,26,max(0,a)))
    return Image.alpha_composite(img.convert("RGBA"),glow)
def ctext(d,cx,y,txt,fnt,color,anchor="mm"):
    d.text((cx,y),txt,font=fnt,fill=color,anchor=anchor)
def measure(d,txt,fnt):
    bb=d.textbbox((0,0),txt,font=fnt);return bb[2]-bb[0],bb[3]-bb[1]
def put_logo(img,cx,cy,scale):
    lw=int(LOGO.width*scale);lh=int(LOGO.height*scale);img.alpha_composite(LOGO.resize((lw,lh),Image.LANCZOS),(int(cx-lw/2),int(cy-lh/2)))
def put_qr(img,cx,cy,size,border=True):
    q=QR.resize((size,size),Image.NEAREST)
    if border:
        card=Image.new("RGBA",(size+44,size+44),(255,255,255,255));card.paste(q,(22,22))
        img.alpha_composite(card,(int(cx-(size+44)/2),int(cy-(size+44)/2)))
    else:
        img.alpha_composite(q.convert("RGBA"),(int(cx-size/2),int(cy-size/2)))
def chip(img,cx,cy,txt,fnt,fill=ORANGE,fg=WHITE,padx=44,pady=18):
    d=ImageDraw.Draw(img);tw,th=measure(d,txt,fnt)
    w=tw+padx*2;h=th+pady*2
    pill=Image.new("RGBA",(w,h),(0,0,0,0));pd=ImageDraw.Draw(pill)
    pd.rounded_rectangle([0,0,w-1,h-1],radius=h//2,fill=fill)
    pd.text((w/2,h/2),txt,font=fnt,fill=fg,anchor="mm")
    img.alpha_composite(pill,(int(cx-w/2),int(cy-h/2)))
CONTACT="flowinevent@gmail.com · 06 16 35 49 36"
SIGN="Animez · Fidélisez · Boostez"

# ============ ACQ INSTA 1080x1080 ============
def acq_insta():
    W,H=1080,1080;img=bg(W,H);d=ImageDraw.Draw(img)
    put_logo(img,W/2,118,0.42)
    ctext(d,W/2,H*0.225,"VOTRE COMMERCE",font(74,800),WHITE)
    ctext(d,W/2,H*0.295,"DANS LE GRAND JEU",font(74,800),ORANGE)
    ctext(d,W/2,H*0.40,"24 000",font(150,800),TEAL)
    ctext(d,W/2,H*0.475,"festivaliers · 6 soirs · à Vence",font(40,600),WHITE)
    for i,w in enumerate(["ANIMEZ","FIDÉLISEZ","BOOSTEZ"]):
        chip(img,W/2,H*0.575+i*0.0,w,font(0+0,0)) if False else None
    chip(img,W*0.27,H*0.60,"ANIMEZ",font(40,800));chip(img,W*0.52,H*0.60,"FIDÉLISEZ",font(40,800));chip(img,W*0.77,H*0.60,"BOOSTEZ",font(40,800))
    ctext(d,W/2,H*0.70,"Vos clients jouent, cumulent des points",font(40,600),WHITE)
    ctext(d,W/2,H*0.745,"et gagnent un bon d'achat chez vous.",font(40,600),WHITE)
    chip(img,W/2,H*0.84,"DEVENEZ PARTENAIRE",font(46,800),fill=ORANGE)
    ctext(d,W/2,H*0.915,CONTACT,font(34,700),WHITE)
    ctext(d,W/2,H*0.955,SIGN,font(30,700),TEAL)
    return img.convert("RGB")

# ============ ACQ FB 1200x630 ============
def acq_fb():
    W,H=1200,630;img=bg(W,H);d=ImageDraw.Draw(img)
    put_logo(img,W*0.74,H*0.30,0.5)
    ctext(d,W*0.06,H*0.30,"VOTRE COMMERCE",font(58,800),WHITE,anchor="lm")
    ctext(d,W*0.06,H*0.40,"DANS LE GRAND JEU",font(58,800),ORANGE,anchor="lm")
    ctext(d,W*0.06,H*0.575,"24 000",font(96,800),TEAL,anchor="lm")
    ctext(d,W*0.06,H*0.685,"festivaliers · Nuits du Sud 2026",font(34,600),WHITE,anchor="lm")
    chip(img,W*0.74,H*0.62,"DEVENEZ PARTENAIRE",font(38,800),fill=ORANGE)
    ctext(d,W*0.74,H*0.80,CONTACT,font(28,700),WHITE)
    ctext(d,W*0.74,H*0.875,SIGN,font(26,700),TEAL)
    return img.convert("RGB")

# ============ ACQ PRESENTATION 1920x1080 ============
def acq_pres():
    W,H=1920,1080;img=bg(W,H);d=ImageDraw.Draw(img)
    put_logo(img,W/2,110,0.5)
    ctext(d,W/2,H*0.215,"Animez vos commerces pendant le festival",font(72,800),WHITE)
    steps=[("1","Un QR à votre nom","Affiché en boutique + lien à diffuser."),
           ("2","Vos clients cumulent","Ils jouent, gagnent des points, reviennent."),
           ("3","Ils gagnent chez vous","Un bon d'achat dans votre commerce + grand tirage final.")]
    cw=W/3
    for i,(n,t,desc) in enumerate(steps):
        cx=cw*i+cw/2
        circ=Image.new("RGBA",(120,120),(0,0,0,0));cd=ImageDraw.Draw(circ)
        cd.ellipse([0,0,119,119],fill=ORANGE);cd.text((60,60),n,font=font(64,800),fill=WHITE,anchor="mm")
        img.alpha_composite(circ,(int(cx-60),int(H*0.40-60)))
        ctext(d,cx,H*0.56,t,font(48,800),TEAL)
        # wrap desc
        words=desc.split();line1=" ".join(words[:4]);line2=" ".join(words[4:])
        ctext(d,cx,H*0.625,line1,font(36,600),WHITE)
        if line2:ctext(d,cx,H*0.665,line2,font(36,600),WHITE)
    chip(img,W/2,H*0.81,"DEVENEZ PARTENAIRE",font(48,800),fill=ORANGE)
    ctext(d,W/2,H*0.89,CONTACT,font(36,700),WHITE)
    ctext(d,W/2,H*0.935,SIGN,font(32,700),TEAL)
    return img.convert("RGB")

# ============ A4 COMMERCE 1654x2339 (client en boutique) ============
def a4():
    W,H=1654,2339;img=bg(W,H);d=ImageDraw.Draw(img)
    put_logo(img,W/2,260,0.95)
    ctext(d,W/2,H*0.235,"GRAND JEU",font(110,700),TEAL)
    ctext(d,W/2,H*0.305,"FLASH",font(220,800),ORANGE)
    ctext(d,W/2,H*0.395,"JOUE · GAGNE",font(150,800),WHITE)
    ctext(d,W/2,H*0.475,"Jouez ici et tentez de gagner",font(56,600),WHITE)
    ctext(d,W/2,H*0.508,"un bon d'achat dans ce commerce.",font(56,600),WHITE)
    put_qr(img,W/2,H*0.66,560)
    ctext(d,W/2,H*0.785,"Flashez le QR · répondez · cumulez",font(50,700),TEAL)
    ctext(d,W/2,H*0.83,"+ grand tirage en clôture du festival",font(46,600),WHITE)
    ctext(d,W/2,H*0.92,"Nuits du Sud · 9 → 18 juillet 2026 · Vence",font(42,700),WHITE)
    return img.convert("RGB")

import os
os.makedirs("/home/claude/vid/out",exist_ok=True)
acq_insta().save("/home/claude/vid/out/acq_insta.png")
acq_fb().save("/home/claude/vid/out/acq_fb.png")
acq_pres().save("/home/claude/vid/out/acq_presentation.png")
a4().save("/home/claude/vid/out/a4.png")
print("OK 4 visuels")
