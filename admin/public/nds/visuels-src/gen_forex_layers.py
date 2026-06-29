# -*- coding: utf-8 -*-
# Decompose chaque forex 70x70 en couches separees (PPTX 100% editable) :
#  bg + logo NDS + chip station + QR + bandeau blanc + 7 logos partenaires (chacun isole) + 4 textes editables.
import sys, os, json; sys.path.insert(0, "/home/claude/vid")
from PIL import Image, ImageDraw
import gen_forex as F
import nds_lib as L

W, H = F.W, F.H
k = F.k
WORK = "/home/claude/vid/forex_layers"; os.makedirs(WORK, exist_ok=True)
SLOTS = ["pegase","giordano","alafut","carrosserie-gp","bergerie","utile","charvolin"]

def isolate(slug, name, draw_fn):
    layer = Image.new("RGBA", (W, H), (0,0,0,0)); draw_fn(layer)
    bb = layer.getbbox()
    if bb is None: return None
    crop = layer.crop(bb); p = f"{WORK}/{slug}__{name}.png"; crop.save(p)
    return dict(name=name, path=p, x=bb[0], y=bb[1], w=bb[2]-bb[0], h=bb[3]-bb[1])

def draw_band(im, cy):
    margin=k(54); bx0=margin; bx1=W-margin; bh=k(196); by0=int(cy)
    band=Image.new("RGBA",(bx1-bx0,bh),(0,0,0,0))
    ImageDraw.Draw(band).rounded_rectangle([0,0,bx1-bx0-1,bh-1],radius=k(26),fill=(255,255,255,255))
    im.alpha_composite(band,(bx0,by0))

def draw_one_logo(im, cy, idx):
    margin=k(54); bx0=margin; bx1=W-margin; bh=k(196); by0=int(cy); n=len(SLOTS)
    cellw=(bx1-bx0)/n; boxh=int(bh*0.64); boxw=int(cellw*0.80)
    slug=SLOTS[idx]; ccx=bx0+cellw*(idx+0.5); ccy=by0+bh/2
    p=f"/home/claude/repo/admin/public/nds/partenaires/{slug}.png"
    logo=Image.open(p).convert("RGBA"); bb=logo.split()[3].getbbox()
    if bb: logo=logo.crop(bb)
    r=min(boxw/logo.width, boxh/logo.height); nw,nh=max(1,int(logo.width*r)),max(1,int(logo.height*r))
    logo=logo.resize((nw,nh),Image.LANCZOS)
    im.alpha_composite(logo,(int(ccx-nw/2),int(ccy-nh/2)))

def chip_drawer(label):
    def d(im):
        cfnt=L.font(k(34),800); ctw=L.measure(label.upper(),cfnt)[0]; cpadx=k(34); chipw=ctw+cpadx*2
        L.chip(im, W-k(60)-chipw/2, H*0.045+k(30), label.upper(), cfnt, fill=L.ORANGE, fg=F.WHITE, padx=cpadx, pady=k(16))
    return d

def hexc(c): return "%02X%02X%02X" % (c[0],c[1],c[2])

man={"page":{"px":W,"dpi":127},"stations":{}}
for sid,lbl,fn in F.JOBS:
    # textes via _PLATE
    F._PLATE=True; F._TEXTLOG=[]
    F.forex(sid,lbl,fn)  # logue les textes, ecrit une plate (ignoree)
    texts=[dict(text=t[0],cx=float(t[1]),cy=float(t[2]),size_px=float(t[3]),hex=hexc(t[4]),weight=int(t[5])) for t in F._TEXTLOG]
    F._PLATE=False
    # fond seul
    bg=F.make_bg(); bgp=f"{WORK}/{fn}__bg.png"; bg.convert("RGB").save(bgp,quality=95)
    cy=H*0.792
    imgs=[]
    for nm,dfn in [
        ("logo_nds", lambda im: L.put_logo(im, W/2, H*0.092, 0.28*W/1080)),
        ("chip_station", chip_drawer(lbl)),
        ("qr", lambda im: F.qr_card(im, f"/home/claude/vid/qr/{sid}.png", W/2, H*0.516, k(338))),
        ("bandeau_blanc", lambda im: draw_band(im, cy)),
    ]:
        r=isolate(fn,nm,dfn)
        if r: imgs.append(r)
    for i,slug in enumerate(SLOTS):
        r=isolate(fn, f"logo_{slug}", (lambda im,ix=i: draw_one_logo(im, cy, ix)))
        if r: imgs.append(r)
    man["stations"][fn]={"label":lbl,"bg":bgp,"images":imgs,"texts":texts}
    print(fn, ":", len(imgs), "images +", len(texts), "textes")

json.dump(man, open("/home/claude/vid/manifest_forex_layers.json","w"), ensure_ascii=False, indent=1)
print("MANIFEST layers OK")
