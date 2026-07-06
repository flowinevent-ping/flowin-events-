# -*- coding: utf-8 -*-
"""v2 : corrige le MUR (7 bonnes pastilles, ordre PARTNERS, recouvre les 8 anciennes)
   + remplace le QR par le QR reseaux du pro. Audio conserve. Verif scan.
Usage: python3 compose_reseau2.py <slug>
"""
import subprocess, os, glob, sys, numpy as np
sys.path.insert(0,"/home/claude/vid")
import nds_lib as L
from pyzbar.pyzbar import decode
from PIL import Image, ImageDraw

slug = sys.argv[1] if len(sys.argv)>1 else "bergerie"
ROOT="/home/claude/flowin/admin/public/nds/kit-digital"
REF=f"{ROOT}/nds/refs-romain/LANCEMENT_capcut_montage-son_REF.mp4"
QRP=f"{ROOT}/{slug}/qr-reseaux-{slug}.png"
LOGODIR="/home/claude/repo/admin/public/nds/partenaires"
OUT=f"/home/claude/out/video-{slug}-reseau-CAPCUT.mp4"
FR="/home/claude/vid/cframes"; os.makedirs(FR,exist_ok=True)
for f in glob.glob(f"{FR}/*.png"): os.remove(f)

# --- QR card du pro ---
qr=Image.open(QRP).convert('RGB'); a=np.asarray(qr); m=(a<128).any(2); ys,xs=np.where(m)
qr=qr.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
def qr_card(S):
    S=int(S); pad=max(3,int(S*0.08))
    c=Image.new('RGBA',(S,S),(0,0,0,0))
    ImageDraw.Draw(c).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.11),fill=(255,255,255,255))
    c.paste(qr.resize((S-2*pad,S-2*pad),Image.NEAREST),(pad,pad)); return c

# --- pastilles mur (ordre = PARTNERS ; positions detectees sur t=38) ---
# row1 y196-260 ; row2 y283-346 ; row3 (wide) y368-436
PILLS=[
 ("bergerie",      62,194,122,68),
 ("pegase",       195,194,122,68),
 ("utile",        327,194,123,68),
 ("nook",          62,281,122,67),
 ("giordano",     195,281,122,67),
 ("charvolin",    327,281,123,67),
 ("carrosserie-gp",127,367,258,70),   # large, centre, recouvre les 2 anciennes
]
def make_pill(slug,w,h):
    return L.logo_card(f"{LOGODIR}/{slug}.png", w, h, pad_ratio=0.13, radius_ratio=0.20)
PILLIMG={s:make_pill(s,w,h) for (s,x,y,w,h) in PILLS}
WALL0,WALL1=35.0,40.75

# fps + extract
rr=subprocess.check_output(['ffprobe','-v','0','-select_streams','v','-show_entries','stream=r_frame_rate','-of','csv=p=0',REF]).decode().strip()
num,den=rr.split('/'); FPS=float(num)/float(den)
subprocess.run(['ffmpeg','-y','-i',REF,'-vsync','0',f'{FR}/%05d.png','-loglevel','error'],check=True)
frames=sorted(glob.glob(f'{FR}/*.png')); N=len(frames); W,H=Image.open(frames[0]).size
print(f"frames={N} fps={FPS:.2f} {W}x{H}")

nq=nw=0
for i,fp in enumerate(frames):
    t=i/FPS; im=Image.open(fp).convert('RGBA')
    if WALL0<=t<=WALL1:
        for (s,x,y,w,h) in PILLS:
            im.alpha_composite(PILLIMG[s],(x,y))
        nw+=1
    res=decode(im.convert('RGB'))
    for r in res:
        cx=r.rect.left+r.rect.width/2; cy=r.rect.top+r.rect.height/2
        S=max(r.rect.width,r.rect.height)*1.30; card=qr_card(S)
        im.alpha_composite(card,(int(cx-card.width/2),int(cy-card.height/2)))
    if res: nq+=1
    im.convert('RGB').save(fp,quality=95)
print(f"wall frames={nw} qr frames={nq}")

subprocess.run(['ffmpeg','-y','-framerate',f'{FPS}','-i',f'{FR}/%05d.png','-i',REF,
 '-map','0:v','-map','1:a','-c:v','libx264','-crf','19','-pix_fmt','yuv420p','-preset','veryfast',
 '-c:a','copy','-shortest',OUT,'-loglevel','error'],check=True)
print("OUT",OUT,os.path.getsize(OUT))
seen={}
for t in [1,9,18,30,37,40]:
    subprocess.run(['ffmpeg','-y','-ss',str(t),'-i',OUT,'-frames:v','1','/tmp/o.png','-loglevel','error'],check=False)
    r=decode(Image.open('/tmp/o.png')); d=r[0].data.decode() if r else 'NO_QR'; seen.setdefault(d,[]).append(t)
for k,v in seen.items(): print("QR",k,v)
