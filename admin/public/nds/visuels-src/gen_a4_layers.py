# -*- coding: utf-8 -*-
# Decompose chaque A4 en couches separees pour un PPTX 100% editable :
#   - bg.png        : fond cinematique seul (beams + glows + filet) = image de fond
#   - images croppees transparentes : logo NDS, banniere FLASH, logo commerce,
#     ticket concert, ticket voucher, QR, banniere GRAND TIRAGE (chacune deplacable)
#   - manifest : positions des images (px) + tous les textes (11, tous editables)
import sys, os, json; sys.path.insert(0, "/home/claude/vid")
from PIL import Image, ImageDraw
import gen_a4_clean as A

W, H = A.W, A.H
WORK = "/home/claude/pptx_work/layers"; os.makedirs(WORK, exist_ok=True)
A._PLATE = True  # les fonctions ne dessinent PAS le texte (seulement le decor) et loggent dans _TEXTLOG

def isolate(slug, name, draw_fn):
    """Dessine un seul element sur une image transparente, crop a sa bbox, renvoie (path,x,y,w,h)."""
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    draw_fn(layer)
    bb = layer.getbbox()
    if bb is None:
        return None
    crop = layer.crop(bb)
    p = f"{WORK}/{slug}__{name}.png"; crop.save(p)
    return dict(name=name, path=p, x=bb[0], y=bb[1], w=bb[2]-bb[0], h=bb[3]-bb[1])

man = {"page": {"w_in": round(W/300, 3), "h_in": round(H/300, 3)}, "commerces": {}}
for slug, com, lot, fn in A.PARTNERS:
    # 1) textes (passage complet -> _TEXTLOG)
    A._TEXTLOG = []
    A.a4(slug, com, lot, fn)
    texts = []
    for (txt, cx, cy, size, col, wgt) in A._TEXTLOG:
        c = tuple(col[:3])
        texts.append(dict(text=txt, cx=float(cx), cy=float(cy), size_px=float(size),
                          weight=int(wgt), hex="%02X%02X%02X" % c))
    # 2) fond
    bg = A.make_bg()
    A.glow_blob(bg, W*0.50, H*0.150, W*0.46, (212, 40, 150), 60)
    A.glow_blob(bg, W*0.30, H*0.130, W*0.30, (120, 46, 196), 52)
    d = ImageDraw.Draw(bg, "RGBA"); A.hrule(d, W/2, H*0.214, 160, A.MAGENTA, 7)
    bgp = f"{WORK}/{slug}__bg.png"; bg.convert("RGB").save(bgp, quality=95)
    # 3) elements isoles (transparents, croppes)
    hw = int(W*0.225)
    imgs = []
    for nm, dfn in [
        ("logo_nds",   lambda im: A.L.put_logo(im, W/2, H*0.146, 1.0)),
        ("banniere_flash", lambda im: A.flash_banner(im, W/2, H*0.256, "FLASH & JOUE")),
        ("logo_commerce",  lambda im: A.station_lockup(im, slug, W/2, H*0.356)),
        ("ticket_concert", lambda im: A.hero_concert(im, W*0.300, H*0.468, hw)),
        ("ticket_bon",     lambda im: A.hero_voucher(im, W*0.700, H*0.468, hw)),
        ("qr",             lambda im: A.qr_block(im, f"/home/claude/vid/qr/{slug}_hd.png", W/2, H*0.662, 500)),
        ("banniere_tirage",lambda im: A.grand_tirage_pill(im, W/2, H*0.880)),
    ]:
        r = isolate(slug, nm, dfn)
        if r: imgs.append(r)
    man["commerces"][slug] = {"bg": bgp, "images": imgs, "texts": texts}
    print(f"{slug}: {len(imgs)} images + {len(texts)} textes")
json.dump(man, open("/home/claude/pptx_work/manifest_a4_layers.json", "w"), ensure_ascii=False, indent=1)
print("manifest_a4_layers.json ecrit")
