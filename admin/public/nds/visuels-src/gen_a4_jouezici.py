# -*- coding: utf-8 -*-
# A4 client en boutique (2480x3508, 300dpi) — DESIGN v4 "plus graphique / expressif"
# Confettis festival + parcours 3 etapes (Flash/Joue/Gagne) + gains en tickets + QR focal a rayons + badge grand tirage.
import sys, os, math, random; sys.path.insert(0, "/home/claude/vid")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W, H = 2480, 3508
OUT = "/home/claude/vid/a4"; os.makedirs(OUT, exist_ok=True)
LOGODIR = "/home/claude/repo/admin/public/nds/partenaires"

BG=(9,16,32); AMBER=(244,181,68); ORANGE=(255,122,26); WHITE=(255,255,255)
TEAL=(32,224,196); MAGENTA=(230,24,127); PURPLE=(124,58,200); INK=(22,16,40); MUTE=(190,198,226)

def _radial(arr,cx,cy,rad,col,strength):
    yy,xx=np.ogrid[0:H,0:W]; d=np.sqrt((xx-cx)**2+(yy-cy)**2)/rad
    g=np.clip(1-d,0,1)**2*strength; arr+=np.stack([g*col[0],g*col[1],g*col[2]],-1)
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
    _beam(acc,[(W*0.30,-160),(W*0.02,H*0.36),(W*0.24,H*0.36)],(170,50,104),1.0,170)
    _beam(acc,[(W*0.56,-160),(W*0.28,H*0.34),(W*0.60,H*0.34)],(122,44,124),0.95,170)
    _beam(acc,[(W*0.84,-160),(W*0.60,H*0.36),(W*1.04,H*0.30)],(184,46,118),1.05,168)
    _radial(acc,W*0.62,H*0.08,W*0.42,(152,42,98),0.52)
    _radial(acc,W*0.50,H*0.44,W*0.64,(46,62,122),0.40)
    _radial(acc,W*0.16,H*0.62,W*0.56,(22,96,92),0.32)
    _radial(acc,W*0.84,H*0.66,W*0.56,(80,52,28),0.22)
    img=Image.fromarray(np.clip(base+acc,0,255).astype(np.uint8),"RGB").convert("RGBA")
    _BG[0]=img
    return _BG[0].copy()

def _confetti(img):
    rnd=random.Random(7)
    d=ImageDraw.Draw(img,"RGBA")
    cols=[AMBER,TEAL,MAGENTA,WHITE,ORANGE,PURPLE]
    # zones a eviter (centre) : on parsème surtout sur les bords
    for _ in range(120):
        x=rnd.randint(0,W); y=rnd.randint(int(H*0.02),int(H*0.99))
        # densite plus faible au centre
        if abs(x-W/2)<W*0.30 and H*0.30<y<H*0.92 and rnd.random()<0.78: continue
        c=rnd.choice(cols); a=rnd.randint(40,150); s=rnd.randint(6,20)
        shape=rnd.random()
        if shape<0.45:
            d.ellipse([x,y,x+s,y+s], fill=c+(a,))
        elif shape<0.75:
            ang=rnd.random()*math.pi
            dx,dy=math.cos(ang)*s, math.sin(ang)*s
            d.line([(x,y),(x+dx,y+dy)], fill=c+(a,), width=max(3,s//4))
        else:
            # petite croix etincelle
            d.line([(x-s,y),(x+s,y)],fill=c+(a,),width=3)
            d.line([(x,y-s),(x,y+s)],fill=c+(a,),width=3)

def ct(d,cx,y,txt,size,col,w=800): d.text((cx,y),txt,font=L.font(size,w),fill=col,anchor="mm")
def measure(txt,fnt): return L.measure(txt,fnt)

def wrap(d,cx,y,txt,size,col,maxw,lh,w=600):
    fnt=L.font(size,w); words=txt.split(); lines=[]; cur=""
    for word in words:
        t=(cur+" "+word).strip()
        if L.measure(t,fnt)[0]>maxw and cur: lines.append(cur); cur=word
        else: cur=t
    if cur: lines.append(cur)
    yy=y-(len(lines)-1)*lh/2
    for ln in lines: d.text((cx,yy),ln,font=fnt,fill=col,anchor="mm"); yy+=lh

# ---------- icones ----------
def icon_qr(cd,x,y,s,col):
    w=col+(255,); b=max(3,int(s*0.10))
    # 3 finder squares
    for (fx,fy) in [(0.06,0.06),(0.58,0.06),(0.06,0.58)]:
        cd.rounded_rectangle([x+s*fx,y+s*fy,x+s*(fx+0.36),y+s*(fy+0.36)],radius=int(s*0.05),outline=w,width=b)
        cd.rectangle([x+s*(fx+0.12),y+s*(fy+0.12),x+s*(fx+0.24),y+s*(fy+0.24)],fill=w)
    # quelques modules
    for (mx,my) in [(0.60,0.60),(0.74,0.60),(0.60,0.74),(0.88,0.74),(0.74,0.88),(0.88,0.58)]:
        cd.rectangle([x+s*mx,y+s*my,x+s*(mx+0.10),y+s*(my+0.10)],fill=w)
def icon_quiz(cd,x,y,s,col):
    w=col+(255,)
    cd.text((x+s*0.5,y+s*0.48),"?",font=L.font(int(s*0.78),800),fill=w,anchor="mm")
def icon_gift(cd,x,y,s,col):
    w=col+(255,)
    cd.rounded_rectangle([x+s*0.18,y+s*0.42,x+s*0.82,y+s*0.86],radius=int(s*0.06),fill=w)
    cd.rectangle([x+s*0.12,y+s*0.34,x+s*0.88,y+s*0.48],fill=w)
    cd.line([(x+s*0.5,y+s*0.34),(x+s*0.5,y+s*0.86)],fill=(BG[0],BG[1],BG[2],150),width=max(2,int(s*0.05)))
    cd.line([(x+s*0.5,y+s*0.40),(x+s*0.32,y+s*0.20)],fill=w,width=max(2,int(s*0.05)))
    cd.line([(x+s*0.5,y+s*0.40),(x+s*0.68,y+s*0.20)],fill=w,width=max(2,int(s*0.05)))
def icon_music(cd,x,y,s,col):
    w=col+(255,); r=int(s*0.13)
    cd.ellipse([x+s*0.20-r,y+s*0.74-r,x+s*0.20+r,y+s*0.74+r],fill=w)
    cd.ellipse([x+s*0.64-r,y+s*0.64-r,x+s*0.64+r,y+s*0.64+r],fill=w)
    lw=max(3,int(s*0.07))
    cd.line([(x+s*0.20+r,y+s*0.74),(x+s*0.20+r,y+s*0.30)],fill=w,width=lw)
    cd.line([(x+s*0.64+r,y+s*0.64),(x+s*0.64+r,y+s*0.20)],fill=w,width=lw)
    cd.line([(x+s*0.20+r,y+s*0.30),(x+s*0.64+r,y+s*0.20)],fill=w,width=lw)

# ---------- parcours 3 etapes ----------
def step(img, cx, cy, num, icon_fn, big, small, ring):
    d=ImageDraw.Draw(img,"RGBA")
    R=128
    # halo
    halo=Image.new("RGBA",(R*4,R*4),(0,0,0,0))
    ImageDraw.Draw(halo).ellipse([R,R,R*3,R*3],fill=ring+(55,))
    halo=halo.filter(ImageFilter.GaussianBlur(40)); img.alpha_composite(halo,(int(cx-R*2),int(cy-R*2)))
    # disque verre
    disc=Image.new("RGBA",(R*2,R*2),(0,0,0,0))
    dd=ImageDraw.Draw(disc)
    dd.ellipse([0,0,R*2-1,R*2-1],fill=(255,255,255,28),outline=ring+(255,),width=8)
    img.alpha_composite(disc,(int(cx-R),int(cy-R)))
    icon_fn(d, cx-70, cy-70, 140, WHITE)
    # numero
    nb=46; nx,ny=cx+R-nb-6, cy-R+6
    d.ellipse([nx,ny,nx+nb*2,ny+nb*2],fill=AMBER+(255,))
    d.text((nx+nb,ny+nb),str(num),font=L.font(54,800),fill=INK+(255,),anchor="mm")
    # labels
    d.text((cx,cy+R+58),big,font=L.font(64,800),fill=WHITE+(255,),anchor="mm")
    d.text((cx,cy+R+116),small,font=L.font(40,600),fill=MUTE+(255,),anchor="mm")

def connector(img, x0, x1, y):
    d=ImageDraw.Draw(img,"RGBA")
    n=10
    for i in range(n):
        xx=x0+(x1-x0)*i/n
        d.ellipse([xx,y-6,xx+12,y+6],fill=(TEAL[0],TEAL[1],TEAL[2],180))
    # fleche
    d.polygon([(x1-2,y-16),(x1+24,y),(x1-2,y+16)],fill=TEAL+(220,))

# ---------- ticket gain ----------
def prize_ticket(angle, w, h, grad, icon_fn, label, dark=False):
    SS=3
    bw,bh=w*SS,h*SS
    card=Image.new("RGBA",(bw,bh),(0,0,0,0))
    # degrade
    arr=np.zeros((bh,bw,4),np.uint8); c0,c1=grad
    for yy in range(bh):
        f=yy/max(1,bh-1)
        arr[yy,:,0]=int(c0[0]+(c1[0]-c0[0])*f); arr[yy,:,1]=int(c0[1]+(c1[1]-c0[1])*f)
        arr[yy,:,2]=int(c0[2]+(c1[2]-c0[2])*f); arr[yy,:,3]=255
    g=Image.fromarray(arr,"RGBA")
    mask=Image.new("L",(bw,bh),0); md=ImageDraw.Draw(mask)
    md.rounded_rectangle([0,0,bw-1,bh-1],radius=int(bh*0.16),fill=255)
    # encoches laterales (ticket)
    nr=int(bh*0.16)
    md.ellipse([-nr,bh//2-nr,nr,bh//2+nr],fill=0)
    md.ellipse([bw-nr,bh//2-nr,bw+nr,bh//2+nr],fill=0)
    card=Image.composite(g,card,mask)
    cd=ImageDraw.Draw(card)
    # gloss
    gl=Image.new("L",(bw,bh),0); ImageDraw.Draw(gl).rounded_rectangle([0,0,bw-1,int(bh*0.46)],radius=int(bh*0.16),fill=60)
    gl=gl.filter(ImageFilter.GaussianBlur(20*SS//3)); wl=Image.new("RGBA",(bw,bh),(255,255,255,255)); wl.putalpha(gl); card.alpha_composite(wl)
    cd=ImageDraw.Draw(card)
    # ligne perforee verticale gauche (souche)
    px=int(bw*0.30)
    for yy in range(int(bh*0.12),int(bh*0.88),int(bh*0.07)):
        cd.line([(px,yy),(px,yy+int(bh*0.035))],fill=(255,255,255,120),width=max(2,SS))
    txtcol=INK if dark else WHITE
    # icone souche
    icon_fn(cd,int(bw*0.06),int(bh*0.30),int(bh*0.40),txtcol)
    # label "A GAGNER" + titre
    cd.text((int(bw*0.36),int(bh*0.34)),"À GAGNER",font=L.font(int(bh*0.13)*SS//SS,700),fill=(txtcol+(220,)),anchor="lm")
    cd.text((int(bw*0.36),int(bh*0.62)),label,font=L.font(int(bh*0.20),800),fill=txtcol+(255,),anchor="lm")
    card=card.resize((w,h),Image.LANCZOS)
    if angle: card=card.rotate(angle,expand=True,resample=Image.BICUBIC)
    return card

def qr_focal(img, qr_path, cx, cy, qsz):
    d=ImageDraw.Draw(img,"RGBA")
    # rayons derriere
    rays=Image.new("RGBA",(W,H),(0,0,0,0)); rd=ImageDraw.Draw(rays)
    R=int(qsz*1.45)
    for i in range(24):
        a=i/24*2*math.pi
        x2=cx+math.cos(a)*R; y2=cy+math.sin(a)*R
        col=AMBER if i%2==0 else ORANGE
        rd.line([(cx,cy),(x2,y2)],fill=col+(70,),width=26)
    rays=rays.filter(ImageFilter.GaussianBlur(10)); img.alpha_composite(rays)
    # halo doux
    halo=Image.new("RGBA",(qsz*2,qsz*2),(0,0,0,0))
    ImageDraw.Draw(halo).ellipse([qsz*0.2,qsz*0.2,qsz*1.8,qsz*1.8],fill=AMBER+(120,))
    halo=halo.filter(ImageFilter.GaussianBlur(60)); img.alpha_composite(halo,(int(cx-qsz),int(cy-qsz)))
    # carte QR
    qr=Image.open(qr_path).convert("RGB").resize((qsz,qsz),Image.NEAREST)
    pad=int(qsz*0.08); cw=qsz+pad*2
    card=Image.new("RGBA",(cw,cw),(0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,cw-1,cw-1],radius=int(cw*0.06),fill=(255,255,255,255))
    card.paste(qr,(pad,pad)); img.alpha_composite(card,(int(cx-cw/2),int(cy-cw/2)))
    # crochets d'angle (brackets)
    bl=int(cw*0.16); off=int(cw/2)+26; t=12
    for sx,sy in [(-1,-1),(1,-1),(-1,1),(1,1)]:
        x=cx+sx*off; y=cy+sy*off
        d.line([(x, y),(x+sx*bl, y)],fill=AMBER+(255,),width=t)
        d.line([(x, y),(x, y+sy*bl)],fill=AMBER+(255,),width=t)

def starburst(img, cx, cy, r, col):
    d=ImageDraw.Draw(img,"RGBA"); pts=[]
    for i in range(24):
        rr = r if i%2==0 else r*0.62
        a=i/24*2*math.pi - math.pi/2
        pts.append((cx+math.cos(a)*rr, cy+math.sin(a)*rr))
    d.polygon(pts, fill=col+(255,))

def logo_badge(img, slug, cx, cy, box):
    p=f"{LOGODIR}/{slug}.png"
    if not os.path.exists(p): return
    card=L.logo_card(p, box, box, pad_ratio=0.12, radius_ratio=0.22)
    img.alpha_composite(card,(int(cx-box/2),int(cy-box/2)))

def grand_tirage_pill(img, cx, cy):
    txt="★  GRAND TIRAGE À LA CLÔTURE"
    fnt=L.font(46,800); tw=L.measure(txt,fnt)[0]; padx=60; w=tw+padx*2; h=104
    pill=Image.new("RGBA",(w,h),(0,0,0,0)); pd=ImageDraw.Draw(pill)
    pd.rounded_rectangle([0,0,w-1,h-1],radius=h//2,fill=AMBER+(255,))
    glow=Image.new("RGBA",(w+80,h+80),(0,0,0,0))
    ImageDraw.Draw(glow).rounded_rectangle([40,40,40+w,40+h],radius=h//2,fill=AMBER+(110,))
    glow=glow.filter(ImageFilter.GaussianBlur(28)); img.alpha_composite(glow,(int(cx-(w+80)/2),int(cy-(h+80)/2)))
    pd.text((w/2,h/2),txt,font=fnt,fill=INK+(255,),anchor="mm")
    img.alpha_composite(pill,(int(cx-w/2),int(cy-h/2)))

def fit_ct(d,cx,y,txt,maxsize,col,maxw,w=800):
    sz=maxsize
    while sz>48 and L.measure(txt,L.font(sz,w))[0]>maxw: sz-=4
    d.text((cx,y),txt,font=L.font(sz,w),fill=col,anchor="mm")

def qr_sobre(img, qr_path, cx, cy, qsz):
    halo=Image.new("RGBA",(qsz*2,qsz*2),(0,0,0,0))
    ImageDraw.Draw(halo).ellipse([qsz*0.25,qsz*0.25,qsz*1.75,qsz*1.75],fill=AMBER+(95,))
    halo=halo.filter(ImageFilter.GaussianBlur(58)); img.alpha_composite(halo,(int(cx-qsz),int(cy-qsz)))
    qr=Image.open(qr_path).convert("RGB").resize((qsz,qsz),Image.NEAREST)
    pad=int(qsz*0.07); cw=qsz+pad*2
    card=Image.new("RGBA",(cw,cw),(0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,cw-1,cw-1],radius=int(cw*0.06),fill=(255,255,255,255))
    card.paste(qr,(pad,pad)); img.alpha_composite(card,(int(cx-cw/2),int(cy-cw/2)))

def a4(slug, commerce, lot_title, fname):
    img=make_bg(); d=ImageDraw.Draw(img,"RGBA")
    L.put_logo(img, W/2, H*0.072, 0.96)
    MAXW=int(W*0.90)
    # eyebrow
    ct(d, W/2, H*0.150, "GRAND JEU DES NUITS DU SUD", 72, TEAL, 800)
    # HERO (gros, facon forex)
    fit_ct(d, W/2, H*0.214, "GAGNE TES PLACES DE CONCERT", 132, AMBER, MAXW, 800)
    fit_ct(d, W/2, H*0.274, "& BONS D'ACHAT", 132, WHITE, MAXW, 800)
    # incentive engageant
    fit_ct(d, W/2, H*0.340, "+ tu joues, plus tu augmentes tes chances", 74, WHITE, MAXW, 700)
    # commerce focal (gros)
    fit_ct(d, W/2, H*0.428, "Jouez ici, chez " + commerce, 86, WHITE, MAXW, 800)
    logo_badge(img, slug, W*0.5, H*0.500, 230)
    L.chip(img, W/2, H*0.560, "Votre lot : " + lot_title, L.font(60,800), fill=TEAL, fg=INK, padx=58, pady=28)
    # GROS QR focal (halo facon forex)
    qr_sobre(img, f"/home/claude/vid/qr/{slug}_hd.png", W/2, H*0.745, 760)
    # CTA + tirage
    bf=L.font(92,800)
    fw=L.measure("Flash ",bf)[0]+L.measure("le QR",bf)[0]; x0=W/2-fw/2
    d.text((x0,H*0.892),"Flash ",font=bf,fill=AMBER,anchor="lm")
    d.text((x0+L.measure("Flash ",bf)[0],H*0.892),"le QR",font=bf,fill=WHITE,anchor="lm")
    ct(d, W/2, H*0.940, "Grand tirage à la clôture du festival", 50, (214,220,238), 700)
    ct(d, W/2, H*0.968, "Jeu gratuit · sans obligation d'achat", 36, MUTE, 600)
    p=f"{OUT}/{fname}.png"; img.convert("RGB").save(p, quality=95, dpi=(300,300)); return p

PARTNERS = [
    ("bergerie",       "Domaine de la Bergerie",  "1 nuit offerte au camping",      "nds_a4_bergerie"),
    ("pegase",         "Auto-Moto-École Pégase",  "Formation 125 ou remise permis", "nds_a4_pegase"),
    ("utile",          "Utile Vence",             "Bon d'achat",                    "nds_a4_utile"),
    ("carrosserie-gp", "Carrosserie GP",          "Bon d'achat révision",           "nds_a4_carrosserie-gp"),
    ("giordano",       "Électroménager Giordano", "Bon d'achat",                    "nds_a4_giordano"),
]
if __name__=="__main__":
    for slug,com,lot,fn in PARTNERS:
        print("OK", a4(slug,com,lot,fn))
    print("DONE", len(PARTNERS))
