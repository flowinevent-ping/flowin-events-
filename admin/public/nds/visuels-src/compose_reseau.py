# -*- coding: utf-8 -*-
"""Assemble la video reseau d'UN pro a partir du CapCut (montage+SON) :
   - remplace le QR ev-nds-ecrans par le QR reseaux du pro sur CHAQUE fenetre (detection pyzbar)
   - remplace la bande logos du vieux mur par le mur correct (bande logos detectee)
   - garde l'audio original (-c:a copy)
   - re-scanne la sortie pour confirmer le QR reseaux partout.
Usage: python3 compose_reseau.py <slug>
"""
import subprocess, os, glob, sys, numpy as np
from pyzbar.pyzbar import decode
from PIL import Image, ImageDraw

slug = sys.argv[1] if len(sys.argv)>1 else "bergerie"
ROOT = "/home/claude/flowin/admin/public/nds/kit-digital"
REF  = f"/home/claude/flowin/admin/public/nds/kit-digital/nds/refs-romain/LANCEMENT_capcut_montage-son_REF.mp4"
QRP  = f"{ROOT}/{slug}/qr-reseaux-{slug}.png"
MURP = f"/home/claude/flowin/admin/public/nds/kit-digital/nds/refs-romain/MUR-ECRAN-CORRECT_7_GP-nook.png"
OUT  = f"/home/claude/out/video-{slug}-reseau-CAPCUT.mp4"
FR   = "/home/claude/vid/cframes"; os.makedirs(FR, exist_ok=True)
for f in glob.glob(f"{FR}/*.png"): os.remove(f)

# fps
rr = subprocess.check_output(['ffprobe','-v','0','-select_streams','v','-show_entries','stream=r_frame_rate','-of','csv=p=0',REF]).decode().strip()
num,den = rr.split('/'); FPS = float(num)/float(den)
subprocess.run(['ffmpeg','-y','-i',REF,'-vsync','0',f'{FR}/%05d.png','-loglevel','error'],check=True)
frames = sorted(glob.glob(f'{FR}/*.png')); N=len(frames)
W,H = Image.open(frames[0]).size
print(f"frames={N} fps={FPS:.3f} size={W}x{H}")

# --- QR card du pro ---
qr = Image.open(QRP).convert('RGB')
a = np.asarray(qr); m=(a<128).any(2); ys,xs=np.where(m)
qr = qr.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))   # trim quiet zone
def qr_card(S):
    S=int(S); pad=max(3,int(S*0.08))
    card=Image.new('RGBA',(S,S),(0,0,0,0))
    ImageDraw.Draw(card).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.11),fill=(255,255,255,255))
    q=qr.resize((S-2*pad,S-2*pad),Image.NEAREST)
    card.paste(q,(pad,pad))
    return card

# --- detection bande blanche (logos) ---
def white_band(im, ysrch, xthr=0.30, ythr=0.33):
    a=np.asarray(im.convert('RGB')).astype(np.int16); Wi,Hi=im.size
    white=(a[:,:,0]>226)&(a[:,:,1]>226)&(a[:,:,2]>226)
    y0s=int(Hi*ysrch[0]); y1s=int(Hi*ysrch[1])
    rowc=white.sum(1); rows=[y for y in range(y0s,y1s) if rowc[y]>ythr*Wi]
    if not rows: return None
    runs=[]; s=p=rows[0]
    for y in rows[1:]:
        if y-p<=8: p=y
        else: runs.append((s,p)); s=p=y
    runs.append((s,p)); y0,y1=max(runs,key=lambda r:r[1]-r[0])
    band=white[y0:y1+1,:]; colc=band.sum(0)
    cols=[x for x in range(Wi) if colc[x]>xthr*(y1-y0+1)]
    if not cols: return None
    return (min(cols),y0,max(cols),y1)

# mur correct : bande logos (cherche dans moitie basse)
mur = Image.open(MURP).convert('RGB')
mur_band = white_band(mur,(0.40,0.92))
print("MUR band:", mur_band, "mur size", mur.size)

# ref : bande logos de la scene mur (frame pleinement formee ~ t=40), AU-DESSUS du QR bas
tref=min(N-1,int(40.0*FPS))
ref_band = white_band(Image.open(frames[tref]),(0.34,0.66))
print("REF wall band (t=40):", ref_band)

mur_logos = mur.crop(mur_band) if mur_band else None

WALL0, WALL1 = 35.0, 40.6   # fenetre scene mur
nq=0; nw=0
for i,fp in enumerate(frames):
    t=i/FPS
    im=Image.open(fp).convert('RGBA'); changed=False
    # 1) mur (bande logos) pendant la scene mur
    if mur_logos is not None and ref_band is not None and WALL0<=t<=WALL1:
        bx0,by0,bx1,by1=ref_band; bw,bh=bx1-bx0,by1-by0
        patch=mur_logos.resize((bw,bh),Image.LANCZOS).convert('RGBA')
        im.alpha_composite(patch,(bx0,by0)); changed=True; nw+=1
    # 2) QR : detecter et remplacer
    res=decode(im.convert('RGB'))
    for r in res:
        cx=r.rect.left+r.rect.width/2; cy=r.rect.top+r.rect.height/2
        S=max(r.rect.width,r.rect.height)*1.30
        card=qr_card(S)
        im.alpha_composite(card,(int(cx-card.width/2),int(cy-card.height/2))); changed=True
    if res: nq+=1
    im.convert('RGB').save(fp,quality=95)
print(f"frames mur modifiees={nw}  frames QR remplacees={nq}")

# --- encode + mux audio original ---
subprocess.run(['ffmpeg','-y','-framerate',f'{FPS}','-i',f'{FR}/%05d.png','-i',REF,
                '-map','0:v','-map','1:a','-c:v','libx264','-crf','19','-pix_fmt','yuv420p',
                '-preset','veryfast','-c:a','copy','-shortest',OUT,'-loglevel','error'],check=True)
print("OUT:",OUT, os.path.getsize(OUT),"bytes")

# --- verif QR sortie ---
seen={}
for t in [1,3,5,9,18,25,30,37,40]:
    subprocess.run(['ffmpeg','-y','-ss',str(t),'-i',OUT,'-frames:v','1','/tmp/o.png','-loglevel','error'],check=False)
    rr=decode(Image.open('/tmp/o.png')); d=rr[0].data.decode() if rr else 'NO_QR'
    seen.setdefault(d,[]).append(t)
print("=== QR sortie ===")
for k,v in seen.items(): print(" ",k,"@",v)
