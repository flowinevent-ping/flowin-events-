# -*- coding: utf-8 -*-
import subprocess, os, numpy as np
from PIL import Image
from pyzbar.pyzbar import decode
KD="/home/claude/flowin/admin/public/nds/kit-digital"
FLOWIN=Image.open("/home/claude/pptx/flowin_logo.png").convert("RGBA")
PARTNERS=["bergerie","pegase","utile","nook","giordano","charvolin","carrosserie-gp"]

def render(pdf,dpi=300):
    subprocess.run(["pdftoppm","-png","-r",str(dpi),"-singlefile",pdf,"/tmp/r"],check=False)
    return Image.open("/tmp/r.png").convert("RGB")

for s in PARTNERS:
    im=render(f"{KD}/{s}/nds_a4_{s}.pdf",300)
    a=np.asarray(im).copy(); H,W,_=a.shape
    # zone pied a nettoyer : de 27.6cm au bas (garde JEU GRATUIT a 27.07-27.46)
    y0=int(27.6/29.7*H)
    for y in range(y0,H):
        a[y,:,:]=a[y,8,:]   # remplit la ligne par la couleur de fond (bord gauche) -> retire trait + mail
    im2=Image.fromarray(a).convert("RGBA")
    # logo Flowin centre ~28.6cm
    fw=int(W*0.26); fh=int(FLOWIN.height*fw/FLOWIN.width)
    fl=FLOWIN.resize((fw,fh),Image.LANCZOS)
    cy=int(28.55/29.7*H)
    im2.alpha_composite(fl,(int(W/2-fw/2),int(cy-fh/2)))
    im2=im2.convert("RGB")
    # sorties : A4 (21x29.7 @300), A3 (29.7x42 @200), 32x45 (@200)
    im2.save(f"{KD}/{s}/nds_a4_{s}.pdf","PDF",resolution=300.0)
    a3=im2.resize((int(29.7/2.54*200),int(42/2.54*200)),Image.LANCZOS); a3.save(f"{KD}/{s}/nds_a3_{s}.pdf","PDF",resolution=200.0)
    p32=im2.resize((int(32/2.54*200),int(45/2.54*200)),Image.LANCZOS); p32.save(f"{KD}/{s}/affiche-partenaire_32x45_{s}.pdf","PDF",resolution=200.0)
    # apercu PNG (dashboard)
    im2.resize((im2.width//2,im2.height//2)).save(f"{KD}/{s}/nds_a3_{s}.png")
    # verif : QR ok + plus de 'flowinevent' en bas
    r=decode(im2); qr=r[0].data.decode().split("parcours/")[-1] if r else "NO"
    import pytesseract
    foot=pytesseract.image_to_string(im2.crop((0,int(27.6/29.7*H),W,H))).replace(chr(10),' ')
    mail='flowinevent' in foot.lower()
    print(f"{s:16} QR={qr}  mail_en_bas={mail}")
print("DONE")
