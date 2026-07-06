# -*- coding: utf-8 -*-
"""Depuis le MASTER : appose le QR reseaux de CHAQUE pro (5 fenetres) en 1 passe ffmpeg.
   Mur fige, seul le QR change. Audio copie. Verif pyzbar. Copie dans les kits."""
import subprocess, os, numpy as np
from pyzbar.pyzbar import decode
from PIL import Image, ImageDraw
ROOT="/home/claude/flowin/admin/public/nds/kit-digital"
MASTER="/home/claude/out/MASTER-reseau-CORRECT.mp4"
PARTNERS=["bergerie","pegase","utile","nook","giordano","charvolin","carrosserie-gp"]
# fenetres QR (centre, taille) detectees + temps
WINS=[  # (t0,t1, cx,cy, size_source)
 (0.6, 8.0, 275, 613, 125),
 (8.4, 11.0,271, 635, 121),
 (17.6,27.9,270, 632, 141),
 (27.9,34.8,255, 408, 259),
 (34.8,40.9,255, 582, 175),
]
CARD=1.30
os.makedirs("/home/claude/vid/qrcards",exist_ok=True)

def make_card(qr_trim, S, path):
    S=int(S); pad=max(3,int(S*0.08))
    c=Image.new('RGBA',(S,S),(0,0,0,0))
    ImageDraw.Draw(c).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.11),fill=(255,255,255,255))
    c.paste(qr_trim.resize((S-2*pad,S-2*pad),Image.NEAREST),(pad,pad)); c.save(path)

def trim(qrpath):
    q=Image.open(qrpath).convert('RGB'); a=np.asarray(q); m=(a<128).any(2); ys,xs=np.where(m)
    return q.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))

report={}
for slug in PARTNERS:
    qr=trim(f"{ROOT}/{slug}/qr-reseaux-{slug}.png")
    inputs=['-i',MASTER]; fc=[]; last="0:v"
    for k,(t0,t1,cx,cy,sz) in enumerate(WINS):
        S=int(sz*CARD); p=f"/home/claude/vid/qrcards/{slug}_{k}.png"; make_card(qr,S,p)
        inputs+=['-i',p]; x=int(cx-S/2); y=int(cy-S/2)
        fc.append(f"[{last}][{k+1}:v]overlay={x}:{y}:enable='between(t,{t0},{t1})'[v{k}]"); last=f"v{k}"
    out=f"{ROOT}/{slug}/video-{slug}-9x16.mp4"
    subprocess.run(['ffmpeg','-y',*inputs,'-filter_complex',";".join(fc),'-map',f'[{last}]','-map','0:a',
        '-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-preset','veryfast','-c:a','copy','-shortest',
        out,'-loglevel','error'],check=True)
    # verif QR
    ok=set()
    for t in [3,9,22,31,38]:
        subprocess.run(['ffmpeg','-y','-ss',str(t),'-i',out,'-frames:v','1','/tmp/o.png','-loglevel','error'],check=False)
        r=decode(Image.open('/tmp/o.png')); ok.add(r[0].data.decode().split('?')[-1] if r else 'NO')
    report[slug]=(os.path.getsize(out),ok)
    print(f"{slug:16} {os.path.getsize(out)//1024}Ko  QR={ok}")
print("DONE 7")
