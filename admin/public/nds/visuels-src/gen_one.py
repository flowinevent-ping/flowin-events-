# -*- coding: utf-8 -*-
import subprocess, os, sys, numpy as np
from pyzbar.pyzbar import decode
from PIL import Image, ImageDraw
MASTER="/home/claude/out/MASTER-reseau-CORRECT.mp4"
qrpath=sys.argv[1]; out=sys.argv[2]
WINS=[(0.6,8.0,275,613,125),(8.4,11.0,271,635,121),(17.6,27.9,270,632,141),
      (27.9,34.8,255,408,259),(34.8,40.9,255,582,175)]
CARD=1.30
q=Image.open(qrpath).convert('RGB'); a=np.asarray(q); m=(a<128).any(2); ys,xs=np.where(m)
q=q.crop((xs.min(),ys.min(),xs.max()+1,ys.max()+1))
os.makedirs("/home/claude/vid/qrcards",exist_ok=True)
inputs=['-i',MASTER]; fc=[]; last="0:v"
for k,(t0,t1,cx,cy,sz) in enumerate(WINS):
    S=int(sz*CARD); pad=max(3,int(S*0.08))
    c=Image.new('RGBA',(S,S),(0,0,0,0)); ImageDraw.Draw(c).rounded_rectangle([0,0,S-1,S-1],radius=int(S*0.11),fill=(255,255,255,255))
    c.paste(q.resize((S-2*pad,S-2*pad),Image.NEAREST),(pad,pad))
    p=f"/home/claude/vid/qrcards/nds_{k}.png"; c.save(p); inputs+=['-i',p]
    x=int(cx-S/2); y=int(cy-S/2)
    fc.append(f"[{last}][{k+1}:v]overlay={x}:{y}:enable='between(t,{t0},{t1})'[v{k}]"); last=f"v{k}"
subprocess.run(['ffmpeg','-y',*inputs,'-filter_complex',";".join(fc),'-map',f'[{last}]','-map','0:a',
 '-c:v','libx264','-crf','18','-pix_fmt','yuv420p','-preset','veryfast','-c:a','copy','-shortest',out,'-loglevel','error'],check=True)
ok=set()
for t in [3,9,22,31,38]:
    subprocess.run(['ffmpeg','-y','-ss',str(t),'-i',out,'-frames:v','1','/tmp/o.png','-loglevel','error'],check=False)
    r=decode(Image.open('/tmp/o.png')); ok.add(r[0].data.decode().split('?')[-1] if r else 'NO')
print("OUT",out,os.path.getsize(out),"QR",ok)
