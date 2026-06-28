# -*- coding: utf-8 -*-
# A4 STATION v9 (2480x3508, 300dpi) — direction Station validee (cinematique + QR).
# Ordre vertical (brief Romain 28/06):
#  1) logo NDS  2) "LE GRAND JEU DES NUITS DU SUD" (gros titre)
#  3) "FLASH ET JOUE" (typo display Anton, couleur marquante)
#  4) "STATION JEUX" + LOGO partenaire (lockup horizontal)
#  5) GAINS agrandis (places de concert + bons d'achat, gros/marquants)
#  6) QR sous les gains  7) cumul points / grand tirage / mentions.
# Lots = partenaires.lots (donnees reelles, passees dans PARTNERS).
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 2480, 3508
OUT = "/home/claude/vid/a4"; os.makedirs(OUT, exist_ok=True)
LOGODIR = "/home/claude/repo/admin/public/nds/partenaires"

BG=(9,16,32); AMBER=(244,181,68); ORANGE=(255,122,26); WHITE=(255,255,255)
TEAL=(32,224,196); MAGENTA=(230,24,127); PURPLE=(124,58,200); INK=(18,14,34); MUTE=(196,204,228)
_PLATE=False; _TEXTLOG=[]

# ---- police display secondaire (Anton) pour "FLASH ET JOUE" ----
_ANTON="/home/claude/vid/fonts/Anton.ttf"
_acache={}
def anton(size):
    if size in _acache: return _acache[size]
    f=ImageFont.truetype(_ANTON,size); _acache[size]=f; return f
def ameasure(txt,fnt):
    tmp=Image.new("RGBA",(10,10)); d=ImageDraw.Draw(tmp)
    bb=d.textbbox((0,0),txt,font=fnt); return bb[2]-bb[0],bb[3]-bb[1]

# ---------- fond cinematique ----------
def _radial(arr,cx,cy,rad,col,strength):
    yy,xx=np.ogrid[0:H,0:W]; dd=np.sqrt((xx-cx)**2+(yy-cy)**2)/rad
    g=np.clip(1-dd,0,1)**2*strength; arr+=np.stack([g*col[0],g*col[1],g*col[2]],-1)
def _beam(arr,pts,col,strength,blur):
    m=Image.new("L",(W,H),0); ImageDraw.Draw(m).polygon(pts,fill=255)
    m=m.filter(ImageFilter.GaussianBlur(blur)); a=np.asarray(m,np.float32)/255.0*strength
    arr+=np.stack([a*col[0],a*col[1],a*col[2]],-1)
_BG=[None]
def make_bg():
    if _BG[0] is not None: return _BG[0].copy()
    base=np.zeros((H,W,3),np.float32)
    for i in range(3): base[:,:,i]=BG[i]
    acc=np.zeros((H,W,3),np.float32)
    _beam(acc,[(W*0.30,-160),(W*0.02,H*0.34),(W*0.24,H*0.34)],(170,50,104),1.0,170)
    _beam(acc,[(W*0.56,-160),(W*0.28,H*0.32),(W*0.60,H*0.32)],(122,44,124),0.95,170)
    _beam(acc,[(W*0.84,-160),(W*0.60,H*0.34),(W*1.04,H*0.28)],(184,46,118),1.05,168)
    _radial(acc,W*0.62,H*0.08,W*0.42,(152,42,98),0.52)
    _radial(acc,W*0.50,H*0.42,W*0.64,(46,62,122),0.38)
    _radial(acc,W*0.16,H*0.62,W*0.56,(22,96,92),0.30)
    _radial(acc,W*0.84,H*0.70,W*0.56,(80,52,28),0.22)
    img=Image.fromarray(np.clip(base+acc,0,255).astype(np.uint8),"RGB").convert("RGBA")
    _BG[0]=img; return _BG[0].copy()

def glow_blob(img,cx,cy,r,col,a):
    g=Image.new("RGBA",(int(r*2),int(r*2)),(0,0,0,0))
    ImageDraw.Draw(g).ellipse([0,0,r*2,r*2],fill=col+(a,))
    g=g.filter(ImageFilter.GaussianBlur(int(r*0.35))); img.alpha_composite(g,(int(cx-r),int(cy-r)))

# ---------- texte instrumente (pour SVG editable) ----------
def ct(d,cx,y,txt,size,col,w=800):
    _TEXTLOG.append((txt,cx,y,size,col,w))
    if not _PLATE: d.text((cx,y),txt,font=L.font(size,w),fill=col,anchor="mm")
def tracked(d,cx,y,txt,size,col,w,tr):
    fnt=L.font(size,w); ws=[L.measure(c,fnt)[0] for c in txt]
    tot=sum(ws)+tr*(len(txt)-1); x=cx-tot/2
    _TEXTLOG.append((txt,cx,y,size,col,w))
    if _PLATE: return
    for i,c in enumerate(txt):
        d.text((x,y),c,font=fnt,fill=col,anchor="lm"); x+=ws[i]+tr
def fitsz(txt,maxsize,maxw,w,minsz=46):
    sz=maxsize
    while sz>minsz and L.measure(txt,L.font(sz,w))[0]>maxw: sz-=2
    return sz
def fit_ct(d,cx,y,txt,maxsize,col,maxw,w=800,minsz=46):
    sz=fitsz(txt,maxsize,maxw,w,minsz)
    _TEXTLOG.append((txt,cx,y,sz,col,w))
    if not _PLATE: d.text((cx,y),txt,font=L.font(sz,w),fill=col,anchor="mm")
    return sz
def hrule(d,cx,y,wd,col,th=6):
    d.rounded_rectangle([cx-wd/2,y-th/2,cx+wd/2,y+th/2],radius=th/2,fill=col+(255,))

# ---------- banniere FLASH ET JOUE (Anton, amber, glow magenta) ----------
def flash_banner(img,cx,cy,txt="FLASH ET JOUE"):
    fnt=anton(176); tw,th=ameasure(txt,fnt)
    padx=110; pady=40; w=tw+padx*2; h=th+pady*2
    # glow magenta derriere (toujours, meme en plate -> visible sur SVG)
    glow=Image.new("RGBA",(w+220,h+220),(0,0,0,0))
    ImageDraw.Draw(glow).rounded_rectangle([110,110,110+w,110+h],radius=h//2,fill=MAGENTA+(150,))
    glow=glow.filter(ImageFilter.GaussianBlur(60)); img.alpha_composite(glow,(int(cx-(w+220)/2),int(cy-(h+220)/2)))
    # banniere amber
    pill=Image.new("RGBA",(w,h),(0,0,0,0)); pd=ImageDraw.Draw(pill)
    pd.rounded_rectangle([0,0,w-1,h-1],radius=h//2,fill=AMBER+(255,))
    pd.rounded_rectangle([6,6,w-7,h-7],radius=(h-12)//2,outline=(255,255,255,150),width=4)
    img.alpha_composite(pill,(int(cx-w/2),int(cy-h/2)))
    # texte Anton ink (log pour SVG ; fallback Manrope cote Canva)
    _TEXTLOG.append((txt,cx,cy,150,INK,800))
    if not _PLATE:
        d=ImageDraw.Draw(img); d.text((cx,cy-th*0.06),txt,font=fnt,fill=INK+(255,),anchor="mm")

# ---------- lockup STATION JEUX + logo ----------
def station_lockup(img, slug, cx, cy):
    d=ImageDraw.Draw(img,"RGBA")
    t1="STATION"; t2="JEUX"; f=L.font(100,800)
    w1=L.measure(t1,f)[0]; w2=L.measure(t2,f)[0]; gap_tt=36
    txt_w=w1+gap_tt+w2
    box=360; gap=72
    total=txt_w+gap+box
    x=cx-total/2
    # texte (STATION blanc + JEUX teal)
    ty=cy
    _TEXTLOG.append((t1,x+w1/2,ty,96,WHITE,800)); _TEXTLOG.append((t2,x+w1+gap_tt+w2/2,ty,96,TEAL,800))
    if not _PLATE:
        d.text((x,ty),t1,font=f,fill=WHITE+(255,),anchor="lm")
        d.text((x+w1+gap_tt,ty),t2,font=f,fill=TEAL+(255,),anchor="lm")
    # logo card a droite
    lx=x+txt_w+gap
    p=f"{LOGODIR}/{slug}.png"
    if os.path.exists(p):
        card=L.logo_card(p, box, box, pad_ratio=0.05, radius_ratio=0.18)
        img.alpha_composite(card,(int(lx),int(cy-box/2)))

# ---------- gros visuels gains ----------
def icon_concert(cd,cx,cy,s,col):
    # billet de concert incline + notes de musique
    w=col+(255,)
    tw,th=int(s*1.18),int(s*0.66)
    tk=Image.new("RGBA",(tw+40,th+40),(0,0,0,0)); td=ImageDraw.Draw(tk)
    bw,bh=tw,th; ox,oy=20,20
    td.rounded_rectangle([ox,oy,ox+bw,oy+bh],radius=int(bh*0.16),fill=w)
    # encoches
    nr=int(bh*0.16)
    td.ellipse([ox+bw*0.62-nr,oy-nr,ox+bw*0.62+nr,oy+nr],fill=(0,0,0,0))
    td.ellipse([ox+bw*0.62-nr,oy+bh-nr,ox+bw*0.62+nr,oy+bh+nr],fill=(0,0,0,0))
    # perforation
    for yy in range(int(oy+bh*0.18),int(oy+bh*0.82),int(bh*0.13)):
        td.line([(ox+bw*0.62,yy),(ox+bw*0.62,yy+int(bh*0.06))],fill=(BG[0],BG[1],BG[2],255),width=4)
    # notes sur la souche gauche (couleur tile)
    tk=tk.rotate(-10,expand=True,resample=Image.BICUBIC)
    img_paste(cd, tk, cx, cy)
def note_overlay(img,cx,cy,s,col):
    d=ImageDraw.Draw(img,"RGBA"); c=col+(255,); r=int(s*0.12)
    d.ellipse([cx-s*0.34-r,cy+s*0.10-r,cx-s*0.34+r,cy+s*0.10+r],fill=c)
    d.ellipse([cx+s*0.02-r,cy-s*0.02-r,cx+s*0.02+r,cy-s*0.02+r],fill=c)
    lw=max(4,int(s*0.06))
    d.line([(cx-s*0.34+r,cy+s*0.10),(cx-s*0.34+r,cy-s*0.30)],fill=c,width=lw)
    d.line([(cx+s*0.02+r,cy-s*0.02),(cx+s*0.02+r,cy-s*0.42)],fill=c,width=lw)
    d.line([(cx-s*0.34+r,cy-s*0.30),(cx+s*0.02+r,cy-s*0.42)],fill=c,width=lw)

def img_paste(target_draw, tile, cx, cy):
    pass  # placeholder (icone concert dessinee directement ci-dessous)

def icon_voucher(d,cx,cy,s,col):
    # gros coupon avec € + noeud cadeau
    w=col+(255,)
    bw,bh=int(s*1.16),int(s*0.74)
    x0,y0=cx-bw/2,cy-bh/2+s*0.06
    d.rounded_rectangle([x0,y0,x0+bw,y0+bh],radius=int(bh*0.16),fill=w)
    # bord pointille interne (couleur tile)
    inset=int(bh*0.12)
    for xx in range(int(x0+inset),int(x0+bw-inset),int(bh*0.16)):
        d.line([(xx,y0+inset),(xx+int(bh*0.08),y0+inset)],fill=(0,0,0,0),width=0)
    # € central
    d.text((cx,y0+bh*0.54),"€",font=L.font(int(bh*0.78),800),fill=(BG[0],BG[1],BG[2],255),anchor="mm")
    # noeud cadeau au-dessus
    by=y0-s*0.02
    d.ellipse([cx-s*0.30,by-s*0.16,cx-s*0.02,by+s*0.06],outline=w,width=max(5,int(s*0.07)))
    d.ellipse([cx+s*0.02,by-s*0.16,cx+s*0.30,by+s*0.06],outline=w,width=max(5,int(s*0.07)))
    d.polygon([(cx,by-s*0.04),(cx-s*0.10,by+s*0.16),(cx+s*0.10,by+s*0.16)],fill=w)

def gain_tile(img, x0, y0, x1, y1, grad, draw_icon, title, sub, accent):
    w=int(x1-x0); h=int(y1-y0)
    # glow
    glow=Image.new("RGBA",(w+180,h+180),(0,0,0,0))
    ImageDraw.Draw(glow).rounded_rectangle([90,90,90+w,90+h],radius=int(h*0.16),fill=accent+(70,))
    glow=glow.filter(ImageFilter.GaussianBlur(50)); img.alpha_composite(glow,(int(x0-90),int(y0-90)))
    # degrade
    arr=np.zeros((h,w,4),np.uint8); c0,c1=grad
    for yy in range(h):
        f=yy/max(1,h-1)
        arr[yy,:,0]=int(c0[0]+(c1[0]-c0[0])*f); arr[yy,:,1]=int(c0[1]+(c1[1]-c0[1])*f)
        arr[yy,:,2]=int(c0[2]+(c1[2]-c0[2])*f); arr[yy,:,3]=255
    g=Image.fromarray(arr,"RGBA")
    mask=Image.new("L",(w,h),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,w-1,h-1],radius=int(h*0.16),fill=255)
    tile=Image.composite(g,Image.new("RGBA",(w,h),(0,0,0,0)),mask)
    # gloss haut
    gl=Image.new("L",(w,h),0); ImageDraw.Draw(gl).rounded_rectangle([0,0,w-1,int(h*0.42)],radius=int(h*0.16),fill=46)
    gl=gl.filter(ImageFilter.GaussianBlur(22)); wl=Image.new("RGBA",(w,h),(255,255,255,255)); wl.putalpha(gl); tile.alpha_composite(wl)
    img.alpha_composite(tile,(int(x0),int(y0)))
    d=ImageDraw.Draw(img,"RGBA")
    d.rounded_rectangle([x0,y0,x1,y1],radius=int(h*0.16),outline=(255,255,255,150),width=3)
    cx=(x0+x1)/2
    # icone (gros, haut de la tuile)
    iy=y0+h*0.34; isz=h*0.40
    draw_icon(d,cx,iy,isz,WHITE)
    # titre + sub
    ct(d,cx,y0+h*0.70,title,68,WHITE,800)
    ct(d,cx,y0+h*0.855,sub,40,(235,240,252),600)

# ---------- QR ----------
def qr_block(img, qr_path, cx, cy, qsz):
    halo=Image.new("RGBA",(qsz*2,qsz*2),(0,0,0,0))
    ImageDraw.Draw(halo).ellipse([qsz*0.22,qsz*0.22,qsz*1.78,qsz*1.78],fill=AMBER+(110,))
    halo=halo.filter(ImageFilter.GaussianBlur(58)); img.alpha_composite(halo,(int(cx-qsz),int(cy-qsz)))
    qr=Image.open(qr_path).convert("RGB").resize((qsz,qsz),Image.NEAREST)
    pad=int(qsz*0.07); cw=qsz+pad*2
    card=Image.new("RGBA",(cw,cw),(0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,cw-1,cw-1],radius=int(cw*0.06),fill=(255,255,255,255))
    card.paste(qr,(pad,pad)); img.alpha_composite(card,(int(cx-cw/2),int(cy-cw/2)))
    # crochets ambre
    d=ImageDraw.Draw(img,"RGBA"); bl=int(cw*0.15); off=int(cw/2)+24; t=12
    for sx,sy in [(-1,-1),(1,-1),(-1,1),(1,1)]:
        x=cx+sx*off; y=cy+sy*off
        d.line([(x,y),(x+sx*bl,y)],fill=AMBER+(255,),width=t)
        d.line([(x,y),(x,y+sy*bl)],fill=AMBER+(255,),width=t)

def grand_tirage_pill(img, cx, cy):
    txt="★  GRAND TIRAGE À LA CLÔTURE DU FESTIVAL"
    fnt=L.font(60,800); tw=L.measure(txt,fnt)[0]; padx=80; w=tw+padx*2; h=146
    glow=Image.new("RGBA",(w+120,h+120),(0,0,0,0))
    ImageDraw.Draw(glow).rounded_rectangle([60,60,60+w,60+h],radius=h//2,fill=AMBER+(140,))
    glow=glow.filter(ImageFilter.GaussianBlur(40)); img.alpha_composite(glow,(int(cx-(w+120)/2),int(cy-(h+120)/2)))
    pill=Image.new("RGBA",(w,h),(0,0,0,0)); pd=ImageDraw.Draw(pill)
    pd.rounded_rectangle([0,0,w-1,h-1],radius=h//2,fill=AMBER+(255,))
    pd.rounded_rectangle([7,7,w-8,h-8],radius=(h-14)//2,outline=(255,255,255,150),width=4)
    pd.text((w/2,h/2),txt,font=fnt,fill=INK+(255,),anchor="mm")
    img.alpha_composite(pill,(int(cx-w/2),int(cy-h/2)))
    _TEXTLOG.append((txt,cx,cy,60,INK,800))


# ---------- gros visuels GAINS "wow" (forme = le gain, pas de vignette plate) ----------
def _grad_round(w,h,c0,c1,rad,notch=False):
    arr=np.zeros((h,w,4),np.uint8)
    for yy in range(h):
        f=yy/max(1,h-1)
        arr[yy,:,0]=int(c0[0]+(c1[0]-c0[0])*f); arr[yy,:,1]=int(c0[1]+(c1[1]-c0[1])*f)
        arr[yy,:,2]=int(c0[2]+(c1[2]-c0[2])*f); arr[yy,:,3]=255
    g=Image.fromarray(arr,"RGBA")
    mask=Image.new("L",(w,h),0); md=ImageDraw.Draw(mask)
    md.rounded_rectangle([0,0,w-1,h-1],radius=rad,fill=255)
    if notch:
        nr=int(h*0.16); nx=int(w*0.62)
        md.ellipse([nx-nr,-nr,nx+nr,nr],fill=0); md.ellipse([nx-nr,h-nr,nx+nr,h+nr],fill=0)
    card=Image.composite(g,Image.new("RGBA",(w,h),(0,0,0,0)),mask)
    gl=Image.new("L",(w,h),0); ImageDraw.Draw(gl).rounded_rectangle([0,0,w-1,int(h*0.46)],radius=rad,fill=58)
    gl=gl.filter(ImageFilter.GaussianBlur(max(8,int(h*0.05)))); wl=Image.new("RGBA",(w,h),(255,255,255,255)); wl.putalpha(gl); card.alpha_composite(wl)
    cd=ImageDraw.Draw(card); cd.rounded_rectangle([0,0,w-1,h-1],radius=rad,outline=(255,255,255,150),width=4)
    return card

def _note(cd,x,y,s,col):
    r=int(s*0.16); lw=max(4,int(s*0.075))
    h1=(int(x-s*0.30),int(y+s*0.20)); h2=(int(x+s*0.14),int(y+s*0.06))
    t1=(h1[0]+r,int(y-s*0.34)); t2=(h2[0]+r,int(y-s*0.48))
    cd.line([(h1[0]+r,h1[1]),t1],fill=col,width=lw); cd.line([(h2[0]+r,h2[1]),t2],fill=col,width=lw)
    cd.line([t1,t2],fill=col,width=lw)
    cd.ellipse([h1[0]-r,h1[1]-r,h1[0]+r,h1[1]+r],fill=col); cd.ellipse([h2[0]-r,h2[1]-r,h2[0]+r,h2[1]+r],fill=col)

def _dash_rect(cd,x0,y0,x1,y1,col,th):
    step=max(12,int((x1-x0)*0.07)); seg=int(step*0.55)
    xx=x0
    while xx<x1:
        cd.line([(xx,y0),(min(xx+seg,x1),y0)],fill=col,width=th); cd.line([(xx,y1),(min(xx+seg,x1),y1)],fill=col,width=th); xx+=step
    yy=y0
    while yy<y1:
        cd.line([(x0,yy),(x0,min(yy+seg,y1))],fill=col,width=th); cd.line([(x1,yy),(x1,min(yy+seg,y1))],fill=col,width=th); yy+=step

def hero_concert(img,cx,cy,w):
    h=int(w*0.62); glow_blob(img,cx,cy,int(w*0.66),(32,224,196),85)
    card=_grad_round(w,h,(70,240,214),(10,150,150),int(h*0.18),notch=True)
    cd=ImageDraw.Draw(card)
    nx=int(w*0.62)
    for yy in range(int(h*0.16),int(h*0.86),int(h*0.12)):
        cd.line([(nx,yy),(nx,yy+int(h*0.055))],fill=(255,255,255,160),width=max(3,int(h*0.022)))
    _note(cd,int(w*0.30),int(h*0.52),int(h*0.80),(255,255,255,255))
    card=card.rotate(-6,expand=True,resample=Image.BICUBIC)
    img.alpha_composite(card,(int(cx-card.width/2),int(cy-card.height/2)))

def hero_voucher(img,cx,cy,w):
    h=int(w*0.62); glow_blob(img,cx,cy,int(w*0.66),(244,181,68),85)
    card=_grad_round(w,h,(255,202,96),(236,128,24),int(h*0.18),notch=False)
    cd=ImageDraw.Draw(card)
    ins=int(h*0.13); _dash_rect(cd,ins,ins,w-ins,h-ins,(255,255,255,210),max(4,int(h*0.028)))
    cd.text((int(w*0.5),int(h*0.56)),"€",font=L.font(int(h*0.64),800),fill=(255,255,255,255),anchor="mm")
    bx,by=int(w*0.5),int(h*0.12); rr=int(h*0.11); bw2=max(5,int(h*0.05))
    cd.ellipse([bx-rr*2,by-rr,bx,by+rr],outline=(255,255,255,255),width=bw2)
    cd.ellipse([bx,by-rr,bx+rr*2,by+rr],outline=(255,255,255,255),width=bw2)
    cd.polygon([(bx,by-int(rr*0.4)),(bx-int(rr*0.7),by+int(rr*1.1)),(bx+int(rr*0.7),by+int(rr*1.1))],fill=(255,255,255,255))
    card=card.rotate(5,expand=True,resample=Image.BICUBIC)
    img.alpha_composite(card,(int(cx-card.width/2),int(cy-card.height/2)))

def cta_stations(img,cx,cy):
    # CTA SANS encadre ni fond — typo display Anton (change de typo), 1 seule ligne forte + sous-ligne
    line1="+ VOUS AUGMENTEZ VOS CHANCES DE GAGNER"; line2="Découvrez les autres stations du festival"
    d=ImageDraw.Draw(img,"RGBA")
    s=176
    while s>72 and ameasure(line1,anton(s))[0] > int(W*0.92): s-=4
    fnt=anton(s); tw,th=ameasure(line1,fnt)
    _TEXTLOG.append((line1,cx,cy,int(s*0.85),AMBER,800))
    if not _PLATE: d.text((cx,cy-th*0.04),line1,font=fnt,fill=AMBER+(255,),anchor="mm")
    _TEXTLOG.append((line2,cx,cy+th*0.62+34,44,TEAL,600))
    if not _PLATE: d.text((cx,cy+th*0.62+34),line2,font=L.font(44,600),fill=TEAL+(255,),anchor="mm")

def footer_contact(img,cx,y):
    d=ImageDraw.Draw(img,"RGBA")
    d.rounded_rectangle([W*0.10,y-3,W*0.90,y+3],radius=3,fill=(120,110,80,140))
    tracked(d,cx,y+58,L.CONTACT,40,(220,224,240),700,10)

# ============================ A4 ============================
def a4(slug, commerce, lot_title, fname):
    global _TEXTLOG
    _TEXTLOG=[]
    img=make_bg()
    if not _PLATE:
        glow_blob(img, W*0.50, H*0.150, W*0.46, (212,40,150), 60)
        glow_blob(img, W*0.30, H*0.130, W*0.30, (120,46,196), 52)
    d=ImageDraw.Draw(img,"RGBA")
    MAXW=int(W*0.90)

    # 1) TITRE HAUT "LE GRAND JEU DES" (charte, impactant) — a la place du logo
    tracked(d, W/2, H*0.064, "LE GRAND JEU DES", 92, TEAL, 800, 18)

    # 2) LOGO NUITS DU SUD en HERO (agrandi) — remplace le texte "NUITS DU SUD"
    L.put_logo(img, W/2, H*0.162, 1.02)
    hrule(d, W/2, H*0.244, 160, MAGENTA, 7)

    # 3) FLASH ET JOUE (Anton, banniere amber)
    flash_banner(img, W/2, H*0.292, "FLASH ET JOUE")

    # 4) STATION JEUX + logo partenaire (logo agrandi, SANS nom commerce)
    station_lockup(img, slug, W/2, H*0.372)

    # 5) GAINS "wow" (billets reduits, SANS sous-texte)
    hw=int(W*0.295); cxL=W*0.300; cxR=W*0.700; gcy=H*0.500
    hero_concert(img, cxL, gcy, hw)
    hero_voucher(img, cxR, gcy, hw)
    lblY=H*0.582
    ct(d, cxL, lblY, "PLACES DE CONCERT", 58, WHITE, 800)
    ct(d, cxR, lblY, "BONS D'ACHAT", 58, WHITE, 800)

    # 6) QR (sous les gains)
    qr_block(img, f"/home/claude/vid/qr/{slug}_hd.png", W/2, H*0.700, 460)

    # 7) CTA (sans encadre/fond, typo Anton) — degage du QR
    cta_stations(img, W/2, H*0.835)

    # 8) GRAND TIRAGE (agrandi) + contact en bas pleine ligne
    grand_tirage_pill(img, W/2, H*0.908)
    tracked(d, W/2, H*0.944, "JEU GRATUIT · SANS OBLIGATION D'ACHAT", 27, (150,158,182), 600, 5)
    footer_contact(img, W/2, H*0.958)

    pref="plate_" if _PLATE else ""
    p=f"{OUT}/{pref}{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(300,300)); return p

# wrappers icones (signature d, cx, cy, s, col)
def concert_icon(d,cx,cy,s,col):
    # billet incline + notes
    w=(255,255,255,255)
    bw,bh=int(s*1.24),int(s*0.70)
    tk=Image.new("RGBA",(bw+60,bh+60),(0,0,0,0)); td=ImageDraw.Draw(tk)
    ox,oy=30,30
    td.rounded_rectangle([ox,oy,ox+bw,oy+bh],radius=int(bh*0.18),fill=w)
    nr=int(bh*0.18)
    td.ellipse([ox+bw*0.60-nr,oy-nr,ox+bw*0.60+nr,oy+nr],fill=(0,0,0,0))
    td.ellipse([ox+bw*0.60-nr,oy+bh-nr,ox+bw*0.60+nr,oy+bh+nr],fill=(0,0,0,0))
    for yy in range(int(oy+bh*0.16),int(oy+bh*0.84),int(bh*0.14)):
        td.line([(ox+bw*0.60,yy),(ox+bw*0.60,yy+int(bh*0.06))],fill=(BG[0],BG[1],BG[2],255),width=4)
    # notes sur la souche gauche (couleur sombre)
    nc=(BG[0],BG[1],BG[2],255); r=int(bh*0.10)
    n1x,n1y=ox+bw*0.20,oy+bh*0.66; n2x,n2y=ox+bw*0.40,oy+bh*0.58
    td.ellipse([n1x-r,n1y-r,n1x+r,n1y+r],fill=nc); td.ellipse([n2x-r,n2y-r,n2x+r,n2y+r],fill=nc)
    lw=max(4,int(bh*0.05))
    td.line([(n1x+r,n1y),(n1x+r,oy+bh*0.30)],fill=nc,width=lw)
    td.line([(n2x+r,n2y),(n2x+r,oy+bh*0.22)],fill=nc,width=lw)
    td.line([(n1x+r,oy+bh*0.30),(n2x+r,oy+bh*0.22)],fill=nc,width=lw)
    tk=tk.rotate(-9,expand=True,resample=Image.BICUBIC)
    # composer sur l'image via le draw cible (on recupere l'image par d._image)
    base=d._image; base.alpha_composite(tk,(int(cx-tk.width/2),int(cy-tk.height/2)))

def icon_voucher_wrap(d,cx,cy,s,col):
    icon_voucher(d,cx,cy,s,col)

PARTNERS = [
    ("bergerie",       "Domaine de la Bergerie",  "1 nuit offerte au camping",        "nds_a4_bergerie"),
    ("pegase",         "Auto-Moto-École Pégase",  "Formation 125 · 50 € remise permis","nds_a4_pegase"),
    ("utile",          "Utile Vence",             "19 bons d'achat à gagner",         "nds_a4_utile"),
    ("carrosserie-gp", "Carrosserie GP",          "2 bons d'achat révision",          "nds_a4_carrosserie-gp"),
    ("giordano",       "Électroménager Giordano", "2 bons d'achat à gagner",          "nds_a4_giordano"),
    ("alafut",         "À la Fût",                "",                                  "nds_a4_alafut"),
]
if __name__=="__main__":
    for slug,com,lot,fn in PARTNERS:
        print("OK", a4(slug,com,lot,fn))
    print("DONE", len(PARTNERS))
