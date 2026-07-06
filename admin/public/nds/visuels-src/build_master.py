# -*- coding: utf-8 -*-
"""MASTER reseau = CapCut (montage+SON) + mur 7 correct + texte 'STATIONS JEUX'.
   Garde le QR ecrans (remplace par pro ensuite, rapide). Audio conserve."""
import subprocess, os, glob, numpy as np, sys
sys.path.insert(0,"/home/claude/vid")
import nds_lib as L
from PIL import Image, ImageDraw
ROOT="/home/claude/flowin/admin/public/nds/kit-digital"
REF=f"{ROOT}/nds/refs-romain/LANCEMENT_capcut_montage-son_REF.mp4"
LOGODIR="/home/claude/repo/admin/public/nds/partenaires"
OUT="/home/claude/out/MASTER-reseau-CORRECT.mp4"
FR="/home/claude/vid/mframes"; os.makedirs(FR,exist_ok=True)
for f in glob.glob(f"{FR}/*.png"): os.remove(f)
AMBER=(244,181,68)

PILLS=[("bergerie",62,194,122,68),("pegase",195,194,122,68),("utile",327,194,123,68),
 ("nook",62,281,122,67),("giordano",195,281,122,67),("charvolin",327,281,123,67),
 ("carrosserie-gp",127,367,258,70)]
PILLIMG={s:L.logo_card(f"{LOGODIR}/{s}.png",w,h,pad_ratio=0.13,radius_ratio=0.20) for (s,x,y,w,h) in PILLS}
WALL0,WALL1=35.0,40.75
TXT0,TXT1=20.5,27.6

rr=subprocess.check_output(['ffprobe','-v','0','-select_streams','v','-show_entries','stream=r_frame_rate','-of','csv=p=0',REF]).decode().strip()
n_,d_=rr.split('/'); FPS=float(n_)/float(d_)
subprocess.run(['ffmpeg','-y','-i',REF,'-vsync','0',f'{FR}/%05d.png','-loglevel','error'],check=True)
frames=sorted(glob.glob(f'{FR}/*.png')); N=len(frames); W,H=Image.open(frames[0]).size
print(f"frames={N} fps={FPS:.2f} {W}x{H}")

# --- bbox du mot amber 'STATIONS' (frame representative t=23) ---
def amber_box(im, yb=(180,252)):
    a=np.asarray(im).astype(np.int16)
    am=(abs(a[:,:,0]-244)<48)&(abs(a[:,:,1]-181)<58)&(a[:,:,2]<135)&(a[:,:,0]>188)
    am[:yb[0],:]=False; am[yb[1]:,:]=False
    ys,xs=np.where(am)
    if len(xs)<40: return None
    return xs.min(),ys.min(),xs.max(),ys.max()
imr=Image.open(frames[int(23*FPS)]).convert('RGB')
box=amber_box(imr); print("STATIONS box:",box)
tx0,ty0,tx1,ty1=box; wcy=(ty0+ty1)//2
# fit "STATIONS JEUX"
def fit_font(txt,h,maxw):
    s=int(h*1.25)
    while s>8:
        f=L.font(s,800)
        if L.measure(txt,f)[0]<=maxw: return f,s
        s-=2
    return L.font(10,800),10
TFONT,_=fit_font("STATIONS JEUX",(ty1-ty0),int(W*0.92))

def inpaint(arr,x0,y0,x1,y1,pad=9):
    x0=max(0,x0-pad);y0=max(0,y0-pad);x1=min(W-1,x1+pad);y1=min(H-1,y1+pad)
    lx=max(0,x0-24); rx=min(W-1,x1+24)
    left=arr[y0:y1,lx][:,None,:].astype(np.float32)
    right=arr[y0:y1,rx][:,None,:].astype(np.float32)
    f=np.linspace(0,1,x1-x0)[None,:,None]
    arr[y0:y1,x0:x1]=(left+(right-left)*f).astype(np.uint8)

nq=nw=nt=0
for i,fp in enumerate(frames):
    t=i/FPS; im=Image.open(fp).convert('RGB')
    if TXT0<=t<=TXT1:
        b=amber_box(im)
        if b:
            a=np.asarray(im).copy(); inpaint(a,*b); im=Image.fromarray(a)
        d=ImageDraw.Draw(im); d.text((W/2,wcy),"STATIONS JEUX",font=TFONT,fill=AMBER,anchor="mm"); nt+=1
    if WALL0<=t<=WALL1:
        imr2=im.convert('RGBA')
        for (s,x,y,w,h) in PILLS: imr2.alpha_composite(PILLIMG[s],(x,y))
        im=imr2.convert('RGB'); nw+=1
    im.save(fp,quality=95)
print(f"txt={nt} wall={nw}")
subprocess.run(['ffmpeg','-y','-framerate',f'{FPS}','-i',f'{FR}/%05d.png','-i',REF,
 '-map','0:v','-map','1:a','-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-preset','veryfast',
 '-c:a','copy','-shortest',OUT,'-loglevel','error'],check=True)
print("MASTER",OUT,os.path.getsize(OUT))
