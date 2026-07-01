# -*- coding: utf-8 -*-
"""Fiche QR tablette Brigade Verte (NDS 2026) - charte cinematique NDS/Flowin.
Reference : frame video "GRAND JEU" (fond #0a1020 + faisceaux violet/magenta,
halo teal bas, titre degrade ambre->magenta->teal, wordmark Flow[in magenta]).
Portrait iPad 1536x2048. QR au centre. 3 fiches (brigade 1/2/3)."""
import os, sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

W, H = 1536, 2048
OUT = "/home/claude/vid/out"; os.makedirs(OUT, exist_ok=True)
FP = "/home/claude/vid/fonts/Manrope.ttf"
LOGO = Image.open("/home/claude/repo/admin/public/nds/logo_nds_blanc_hd.png").convert("RGBA")

INK=(10,16,32); AMBER=(244,181,68); MAGENTA=(230,24,127)
TEAL=(32,224,196); VIOLET=(150,78,224); WHITE=(255,255,255); MUTE=(168,178,214)

_fc={}
def font(s,w=800):
    k=(s,w)
    if k in _fc: return _fc[k]
    f=ImageFont.truetype(FP,s)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    _fc[k]=f; return f

def measure(txt,fnt):
    d=ImageDraw.Draw(Image.new("RGBA",(10,10)))
    bb=d.textbbox((0,0),txt,font=fnt); return bb[2]-bb[0], bb[3]-bb[1]

def cine_bg():
    base=np.zeros((H,W,3),np.float32); base[:]=INK
    yy=np.linspace(0,1,H)[:,None]
    lift=(np.clip(1-abs(yy-0.32)*2.4,0,1)**2)*14
    base+=lift[:,:,None]
    beams=Image.new("RGBA",(W,H),(0,0,0,0)); bd=ImageDraw.Draw(beams)
    bd.polygon([(W*0.20,-180),(W*0.44,-180),(W*0.66,H*0.72),(W*0.02,H*0.72)],fill=VIOLET+(120,))
    bd.polygon([(W*0.56,-180),(W*0.82,-180),(W*1.02,H*0.72),(W*0.40,H*0.72)],fill=MAGENTA+(120,))
    beams=beams.filter(ImageFilter.GaussianBlur(150))
    glow=Image.new("RGBA",(W,H),(0,0,0,0)); gd=ImageDraw.Draw(glow)
    gd.ellipse([W*0.05,H*0.80,W*0.75,H*1.20],fill=TEAL+(110,))
    gd.ellipse([W*0.55,H*0.90,W*1.10,H*1.25],fill=VIOLET+(70,))
    glow=glow.filter(ImageFilter.GaussianBlur(170))
    img=Image.fromarray(np.clip(base,0,255).astype(np.uint8),"RGB").convert("RGBA")
    img=Image.alpha_composite(img,beams); img=Image.alpha_composite(img,glow)
    streaks=Image.new("RGBA",(W,H),(0,0,0,0)); sd=ImageDraw.Draw(streaks); random.seed(7)
    for _ in range(26):
        x=random.randint(int(W*0.28),int(W*0.72)); y0=random.randint(int(H*0.30),int(H*0.40))
        ln=random.randint(80,190); a=random.randint(30,80)
        sd.line([(x,y0),(x,y0+ln)],fill=WHITE+(a,),width=random.choice([1,2]))
    streaks=streaks.filter(ImageFilter.GaussianBlur(1.2)); img=Image.alpha_composite(img,streaks)
    noise=(np.random.default_rng(3).integers(-10,10,(H,W,1))).astype(np.int16)
    arr=np.clip(np.asarray(img.convert("RGB"),np.int16)+noise,0,255).astype(np.uint8)
    v=Image.new("L",(W,H),0); vd=ImageDraw.Draw(v)
    vd.ellipse([-W*0.25,-H*0.15,W*1.25,H*1.15],fill=255); v=v.filter(ImageFilter.GaussianBlur(220))
    out=Image.fromarray(arr,"RGB").convert("RGBA")
    black=Image.new("RGBA",(W,H),(0,0,0,255))
    vmask=v.point(lambda p:255-int(p*0.55)); out=Image.composite(black,out,vmask)
    return out.convert("RGBA")

def grad_text_layer(txt,fnt,stops,pad=60):
    d0=ImageDraw.Draw(Image.new("RGBA",(10,10))); bb=d0.textbbox((0,0),txt,font=fnt)
    lw,lh=bb[2]-bb[0]+pad*2, bb[3]-bb[1]+pad*2
    mask=Image.new("L",(lw,lh),0)
    ImageDraw.Draw(mask).text((pad-bb[0],pad-bb[1]),txt,font=fnt,fill=255)
    xs=np.linspace(0,1,lw); pos=[s[0] for s in stops]; cols=[np.array(s[1],float) for s in stops]
    grad=np.zeros((lw,3))
    for i in range(lw):
        x=xs[i]
        for j in range(len(pos)-1):
            if pos[j]<=x<=pos[j+1]:
                f=(x-pos[j])/(pos[j+1]-pos[j]+1e-9); grad[i]=cols[j]*(1-f)+cols[j+1]*f; break
        else:
            grad[i]=cols[-1] if x>pos[-1] else cols[0]
    grow=np.tile(grad[None,:,:],(lh,1,1)).astype(np.uint8)
    layer=Image.fromarray(grow,"RGB").convert("RGBA"); layer.putalpha(mask); return layer

def put_center(base,layer,cx,cy):
    base.alpha_composite(layer,(int(cx-layer.width/2),int(cy-layer.height/2)))

def fit_grad_title(txt,target_w,stops,weight=800,start=150):
    size=start
    while size>40:
        fnt=font(size,weight)
        if measure(txt,fnt)[0]<=target_w: break
        size-=4
    return grad_text_layer(txt,font(size,weight),stops)

def flowin_wordmark(size):
    f=font(size,800); fw=measure("Flow",f)[0]; tw=measure("Flowin",f)[0]
    layer=Image.new("RGBA",(tw+40,int(size*1.5)),(0,0,0,0)); d=ImageDraw.Draw(layer)
    d.text((20,layer.height/2),"Flow",font=f,fill=WHITE+(255,),anchor="lm")
    d.text((20+fw,layer.height/2),"in",font=f,fill=MAGENTA+(255,),anchor="lm")
    bb=layer.split()[3].getbbox(); return layer.crop(bb) if bb else layer

TITLE_STOPS=[(0.0,AMBER),(0.5,MAGENTA),(1.0,TEAL)]

def fiche(n):
    base=cine_bg(); d=ImageDraw.Draw(base)
    lscale=150/LOGO.height; lw=int(LOGO.width*lscale); lh=int(LOGO.height*lscale)
    lr=LOGO.resize((lw,lh),Image.LANCZOS); base.alpha_composite(lr,(int(W/2-lw/2),210))
    title=fit_grad_title("BRIGADE VERTE",int(W*0.86),TITLE_STOPS,start=140); put_center(base,title,W/2,560)
    num=fit_grad_title("N\u00b0 %d"%n,int(W*0.5),TITLE_STOPS,start=118); put_center(base,num,W/2,720)
    qr=Image.open(f"/home/claude/vid/qr/brigade-{n}.png").convert("RGB").resize((720,720),Image.NEAREST)
    border=44; cw=720+border*2
    card=Image.new("RGBA",(cw,cw),(0,0,0,0))
    m=Image.new("L",(cw,cw),0); ImageDraw.Draw(m).rounded_rectangle([0,0,cw-1,cw-1],radius=36,fill=255)
    white=Image.new("RGBA",(cw,cw),WHITE+(255,)); card=Image.composite(white,card,m); card.paste(qr,(border,border))
    qr_cy=1240; base.alpha_composite(card,(int(W/2-cw/2),int(qr_cy-cw/2)))
    d.text((W/2,1712),"Scannez pour jouer",font=font(70,800),fill=WHITE+(255,),anchor="mm")
    d.text((W/2,1788),"R\u00e9pondez au quiz \u00e9co-citoyen et tentez de gagner un ticket",font=font(38,600),fill=TEAL+(255,),anchor="mm")
    d.text((W/2,1868),"9 \u2192 18 juillet 2026  \u00b7  Vence",font=font(40,700),fill=WHITE+(255,),anchor="mm")
    wm=flowin_wordmark(66); put_center(base,wm,W/2,H-70)
    out=f"{OUT}/fiche-brigade-{n}.png"; base.convert("RGB").save(out); print("rendu",out); return out

if __name__=="__main__":
    only=sys.argv[1] if len(sys.argv)>1 else None
    for n in ([int(only)] if only else [1,2,3]): fiche(n)
