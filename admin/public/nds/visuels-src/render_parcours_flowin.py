# -*- coding: utf-8 -*-
# Parcours Jeu / Flowin x Nuits du Sud — VERTICAL 9x16 (v2 : QR persistant+scan, fond anime, titres punchy)
# DEPS: /home/claude/spotwork/logo_nds.png (=admin/public/nds/logo_nds_blanc_hd.png), /home/claude/vid/logos/<slug>.png (7),
#       /home/claude/vid/fonts/Manrope.ttf, qrcode/numpy/PIL. RENDU: python3 render_parcours_flowin.py 0 888 full frames
#       puis ffmpeg -framerate 24 -i frames/f%04d.jpg -crf 19 -pix_fmt yuv420p ; mux audio bergerie ; pyzbar ; commit kit-digital/nds/.
import sys, os, math
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import qrcode

W,H,FPS=1080,1920,24
DUR=37.0; NF=int(DUR*FPS)
OUT=sys.argv[4] if len(sys.argv)>4 else "/home/claude/spotwork/frames"
os.makedirs(OUT,exist_ok=True)
NAVY=(10,16,32); WHITE=(248,249,252); SOFT=(206,212,228); AMBER=(244,181,68)
MAGENTA=(230,24,127); TEAL=(32,224,196); CARD=(30,38,72)
FP="/home/claude/vid/fonts/Manrope.ttf"; ASSET="/home/claude/spotwork"
_fc={}
def font(s,w=800):
    k=(int(s),w)
    if k in _fc: return _fc[k]
    f=ImageFont.truetype(FP,int(s))
    try: f.set_variation_by_axes([w])
    except: pass
    _fc[k]=f; return f
def ease(x): x=max(0.0,min(1.0,x)); return x*x*(3-2*x)
def eob(x):
    x=max(0.0,min(1.0,x)); c=1.70158; return 1+ (c+1)*pow(x-1,3)+c*pow(x-1,2)
def ramp(t,a,b): return 0.0 if t<a else (1.0 if t>=b else (t-a)/(b-a))
def twd(d,txt,f): return d.textlength(txt,font=f)

_bgc={}
yy,xx=np.mgrid[0:H,0:W].astype(np.float32)
def _rad(cx,cy,r,col,s):
    dd=np.sqrt((xx-cx)**2+(yy-cy)**2)/r; g=np.clip(1-dd,0,1)**2*s
    return np.stack([g*col[0],g*col[1],g*col[2]],-1)
def bg(t):
    key=round(t*3)
    if key in _bgc: return _bgc[key].copy()
    p=0.85+0.15*math.sin(key/3*1.1)
    dxm=20*math.sin(key/3*0.6)
    base=np.zeros((H,W,3),np.float32)
    for i in range(3): base[:,:,i]=NAVY[i]
    acc=_rad(W*0.82+dxm,H*0.16,W*0.78,(150,40,95),0.60*p)+_rad(W*0.26,H*0.44,W*0.95,(46,62,122),0.40)+_rad(W*0.5,H*0.86,W*0.7,(20,60,90),0.24*p)
    im=Image.fromarray(np.clip(base+acc,0,255).astype(np.uint8),"RGB").convert("RGBA")
    _bgc[key]=im.copy(); return im

LOGO=Image.open(os.path.join(ASSET,"logo_nds.png")).convert("RGBA")
_qr=qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M,box_size=18,border=2)
_qr.add_data("https://flowin-events.vercel.app/parcours/nds2026?ev=ev-nds-digitale"); _qr.make(fit=True)
QR=_qr.make_image(fill_color="black",back_color="white").convert("RGB")

def put_alpha(img,layer,a):
    if a>=1.0: img.alpha_composite(layer); return
    al=layer.split()[3].point(lambda p:int(p*a)); layer.putalpha(al); img.alpha_composite(layer)

def text(img,cx,cy,txt,size,col,a=1.0,w=800,anchor="mm",slide=0):
    if a<=0: return
    f=font(size,w); l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    yo=int((1-ease(a))*slide); d.text((cx,cy+yo),txt,font=f,fill=col,anchor=anchor)
    put_alpha(img,l,ease(a))

def title_pop(img,cx,cy,txt,size,col,prog,w=800):
    if prog<=0: return
    f=font(size,w); l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    bb=d.textbbox((0,0),txt,font=f,anchor="mm"); tw_=bb[2]-bb[0]+40; th_=bb[3]-bb[1]+40
    tile=Image.new("RGBA",(tw_,th_),(0,0,0,0)); ImageDraw.Draw(tile).text((tw_/2,th_/2),txt,font=f,fill=col,anchor="mm")
    sc=0.6+0.4*eob(prog) if prog<1 else 1.0; nw,nh=max(1,int(tw_*sc)),max(1,int(th_*sc))
    tile=tile.resize((nw,nh),Image.LANCZOS); al=tile.split()[3].point(lambda p:int(p*ease(min(1,prog*1.6)))); tile.putalpha(al)
    img.alpha_composite(tile,(int(cx-nw/2),int(cy-nh/2)))

def logo_header(img):
    lw=int(W*0.28); lh=int(LOGO.height*lw/LOGO.width)
    img.alpha_composite(LOGO.resize((lw,lh),Image.LANCZOS),(56,58))

QSZ=270; QCW=QSZ+60; QCX=(W-QCW)//2; QCY=1190
def qr_badge(img,t,a=1.0):
    if a<=0: return
    card=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(card)
    d.rounded_rectangle([QCX,QCY,QCX+QCW,QCY+QCW],radius=36,fill=(255,255,255,255))
    qx,qy=QCX+30,QCY+30
    card.paste(QR.resize((QSZ,QSZ),Image.NEAREST),(qx,qy))
    put_alpha(img,card,ease(a))
    if a>0.5:
        ph=(t%1.8)/1.8; sy=int(qy+ph*QSZ)
        scan=Image.new("RGBA",(W,H),(0,0,0,0)); sd=ImageDraw.Draw(scan)
        for off,al in [(-6,40),(-3,90),(0,200),(3,90),(6,40)]:
            sd.line([(qx,sy+off),(qx+QSZ,sy+off)],fill=TEAL+(al,),width=2)
        scan=scan.filter(ImageFilter.GaussianBlur(1.5)); img.alpha_composite(scan)
    text(img,W/2,QCY-38,"FLASH & JOUE",34,AMBER,a,800,"mm")
    text(img,W/2,QCY+QCW+36,"Le grand jeu des Nuits du Sud",30,WHITE,a,700,"mm")

def step_pill(img,cx,cy,wd,ht,num,txt,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2); yo=int((1-ease(a))*30)
    d.rounded_rectangle([x0,y0+yo,x0+wd,y0+ht+yo],radius=int(ht*0.30),fill=CARD+(235,))
    r=int(ht*0.32); ncx=x0+r+28; ncy=y0+ht//2+yo
    d.ellipse([ncx-r,ncy-r,ncx+r,ncy+r],fill=MAGENTA+(255,))
    d.text((ncx,ncy),str(num),font=font(int(r*1.1),800),fill=WHITE,anchor="mm")
    d.text((ncx+r+30,ncy),txt,font=font(int(ht*0.34),700),fill=WHITE,anchor="lm")
    put_alpha(img,l,ease(a))

def info_card(img,cx,cy,wd,ht,title,desc,icon_col,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2); yo=int((1-ease(a))*30)
    d.rounded_rectangle([x0,y0+yo,x0+wd,y0+ht+yo],radius=26,fill=CARD+(235,))
    d.rounded_rectangle([x0,y0+yo,x0+18,y0+ht+yo],radius=8,fill=icon_col+(255,))
    d.text((x0+54,y0+ht*0.34+yo),title,font=font(int(ht*0.26),800),fill=WHITE,anchor="lm")
    d.text((x0+54,y0+ht*0.70+yo),desc,font=font(int(ht*0.17),600),fill=SOFT,anchor="lm")
    put_alpha(img,l,ease(a))

def logo_card(img,cx,cy,wd,ht,slug,a):
    if a<=0: return
    try: lg=Image.open(f"/home/claude/vid/logos/{slug}.png").convert("RGBA")
    except: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2); yo=int((1-ease(a))*22)
    d.rounded_rectangle([x0,y0+yo,x0+wd,y0+ht+yo],radius=20,fill=(255,255,255,255))
    bb=lg.split()[3].getbbox()
    if bb: lg=lg.crop(bb)
    mw,mh=int(wd*0.84),int(ht*0.84); r=min(mw/lg.width,mh/lg.height)
    nw,nh=max(1,int(lg.width*r)),max(1,int(lg.height*r)); lg=lg.resize((nw,nh),Image.LANCZOS)
    l.alpha_composite(lg,(int(cx-nw/2),int(cy-nh/2)+yo)); put_alpha(img,l,ease(a))

def mini_map(img,cx,cy,wd,ht,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    x0=int(cx-wd/2); y0=int(cy-ht/2)
    d.rounded_rectangle([x0,y0,x0+wd,y0+ht],radius=22,fill=(20,28,54,235))
    for gx in range(1,4): d.line([(x0+gx*wd/4,y0),(x0+gx*wd/4,y0+ht)],fill=(60,70,110,120),width=2)
    for gy in range(1,3): d.line([(x0,y0+gy*ht/3),(x0+wd,y0+gy*ht/3)],fill=(60,70,110,120),width=2)
    for px,py,col in [(0.22,0.30,AMBER),(0.62,0.25,MAGENTA),(0.78,0.62,AMBER),(0.30,0.70,MAGENTA),(0.50,0.50,TEAL)]:
        px2=x0+px*wd; py2=y0+py*ht; r=13
        d.ellipse([px2-r,py2-r,px2+r,py2+r],fill=col+(255,))
        d.ellipse([px2-r-7,py2-r-7,px2+r+7,py2+r+7],outline=col+(110,),width=3)
    put_alpha(img,l,ease(a))

def flowin_sig(img,cx,cy,size,a):
    if a<=0: return
    l=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(l)
    f=font(size,800); ww=twd(d,"Flow",f); tot=ww+twd(d,"in",f); sx=cx-tot/2
    d.text((sx,cy),"Flow",font=f,fill=MAGENTA,anchor="lm"); d.text((sx+ww,cy),"in",font=f,fill=AMBER,anchor="lm")
    put_alpha(img,l,ease(a))
    text(img,cx,cy+int(size*0.62),"partenaire jeux des Nuits du Sud",32,SOFT,a,700,"mm")

def scene(t):
    img=bg(t); logo_header(img)
    if t<6.0:
        l=t; a0=ramp(l,0.0,0.4)
        if a0>0:
            ll=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ll)
            bf=font(30,800); bx=60; bw=twd(d,"GRAND JEU OFFICIEL",bf)
            d.rounded_rectangle([bx,240,bx+bw+56,300],radius=30,fill=(38,46,86,235))
            d.text((bx+28,270),"GRAND JEU OFFICIEL",font=bf,fill=TEAL,anchor="lm")
            put_alpha(img,ll,ease(a0))
        for i,(wd,pc) in enumerate([("Flash",AMBER),("Joue",MAGENTA),("Gagne",TEAL)]):
            a=ramp(l,0.3+i*0.20,0.7+i*0.20)
            if a<=0: continue
            yy_=460+i*156
            ll=Image.new("RGBA",(W,H),(0,0,0,0)); d=ImageDraw.Draw(ll)
            big=font(140,800); d.text((64,yy_),wd,font=big,fill=WHITE,anchor="lm")
            wwd=twd(d,wd,big); d.text((64+wwd+8,yy_),".",font=big,fill=pc,anchor="lm")
            put_alpha(img,ll,ease(a))
        text(img,64,460+3*156+4,"Le grand jeu des Nuits du Sud",42,SOFT,ramp(l,1.3,1.8),700,"lm",18)
        text(img,64,460+3*156+56,"x Flowin",42,MAGENTA,ramp(l,1.5,2.0),800,"lm",18)
        qr_badge(img,t,ramp(l,0.8,1.4))
    elif t<12.0:
        l=t-6.0; title_pop(img,W/2,250,"COMMENT CA MARCHE",40,TEAL,ramp(l,0,0.5))
        for i,(n,txt) in enumerate([(1,"Flash le QR code"),(2,"Reponds au quiz"),(3,"Cumule des tickets")]):
            step_pill(img,W/2,420+i*150,920,120,n,txt,ramp(l,0.4+i*0.22,0.9+i*0.22))
        text(img,W/2,420+3*150+6,"Plus tu joues, plus tu gagnes !",42,AMBER,ramp(l,1.5,2.0),800,"mm",18)
        qr_badge(img,t)
    elif t<18.0:
        l=t-12.0; title_pop(img,W/2,250,"A GAGNER",54,AMBER,ramp(l,0,0.5))
        info_card(img,W/2,430,920,150,"Des places de concert","a gagner chaque soir du festival",TEAL,ramp(l,0.4,0.9))
        info_card(img,W/2,610,920,150,"Des bons d'achat","dans les commerces participants",AMBER,ramp(l,0.7,1.2))
        text(img,W/2,790,"Cumule tes tickets et remporte les lots !",40,MAGENTA,ramp(l,1.4,1.9),800,"mm",18)
        qr_badge(img,t)
    elif t<24.0:
        l=t-18.0; title_pop(img,W/2,240,"OU JOUER ?",50,TEAL,ramp(l,0,0.5))
        text(img,W/2,344,"Rendez-vous sur la carte",50,WHITE,ramp(l,0.2,0.7),800,"mm",18)
        mini_map(img,W/2,520,680,236,ramp(l,0.5,1.0))
        info_card(img,W/2,720,920,124,"Ce soir, au festival","aux caisses, aux bars, brigade verte",MAGENTA,ramp(l,0.9,1.4))
        info_card(img,W/2,858,920,124,"Et chez les commerces","tous les commerces participants",AMBER,ramp(l,1.1,1.6))
        qr_badge(img,t)
    elif t<31.0:
        l=t-24.0
        text(img,W/2,222,"EN GAGNANT,",36,TEAL,ramp(l,0,0.4),800,"mm",18)
        title_pop(img,W/2,300,"LE JEU CONTINUE",52,WHITE,ramp(l,0.15,0.65))
        text(img,W/2,372,"chez nos partenaires",44,AMBER,ramp(l,0.35,0.8),800,"mm",18)
        tw_,th_=260,120; gx=W/2; dx2=tw_/2+16; dx3=tw_+18
        cells=[("bergerie",gx-dx2,470),("pegase",gx+dx2,470),
               ("utile",gx-dx3,604),("charvolin",gx,604),("carrosserie-gp",gx+dx3,604),
               ("giordano",gx-dx2,738),("alafut",gx+dx2,738)]
        for i,(slug,cx,cy) in enumerate(cells):
            logo_card(img,cx,cy,tw_,th_,slug,ramp(l,0.5+i*0.08,1.0+i*0.08))
        flowin_sig(img,W/2,872,64,ramp(l,1.5,2.0))
        qr_badge(img,t)
    else:
        l=t-31.0
        text(img,W/2,300,"Et un",46,WHITE,ramp(l,0,0.4),700,"mm",20)
        title_pop(img,W/2,400,"GRAND TIRAGE FINAL",62,AMBER,ramp(l,0.15,0.7))
        text(img,W/2,492,"a la cloture du festival",48,WHITE,ramp(l,0.4,0.9),700,"mm",18)
        flowin_sig(img,W/2,690,72,ramp(l,0.9,1.4))
        qr_badge(img,t)
    return img.convert("RGB")

if __name__=="__main__":
    a=int(sys.argv[1]); b=int(sys.argv[2])
    for i in range(a,min(b,NF)): scene(i/FPS).save(f"{OUT}/f{i:04d}.jpg",quality=90)
    print("OK",a,min(b,NF))
