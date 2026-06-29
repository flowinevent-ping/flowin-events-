# -*- coding: utf-8 -*-
# Repro PPTX A4 editables : extrait depuis les SVG du repo le plate (decor sans texte)
# + les <text>, calcule 'burned' (texte deja dans le plate -> non repose) et 'size_fit'
# (taille reduite si le texte deborde la largeur). Sortie : manifest_a4.json + plates PNG.
# Puis lancer : node gen_pptx_a4.js  (Manrope installee en police systeme pour un QA fidele).
import re, base64, json, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont

KIT = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/repo/admin/public/nds/kit-digital"
WORK = sys.argv[2] if len(sys.argv) > 2 else "/home/claude/pptx_work"
FP = "/home/claude/vid/fonts/Manrope.ttf"  # Manrope variable (axe wght)
W, H, DPI = 2480, 3508, 300
SLUGS = ["bergerie", "pegase", "utile", "carrosserie-gp", "giordano", "alafut"]
os.makedirs(WORK, exist_ok=True)

_d = ImageDraw.Draw(Image.new("RGB", (10, 10))); _fc = {}
def font(s, w):
    k = (int(s), w)
    if k in _fc: return _fc[k]
    f = ImageFont.truetype(FP, int(s))
    try: f.set_variation_by_axes([w])
    except Exception: pass
    _fc[k] = f; return f

def parse_text(tag):
    g = lambda k: re.search(rf'{k}="([^"]*)"', tag).group(1)
    cx, cy = float(g("x")), float(g("y")); size = float(g("font-size")); fw = int(g("font-weight"))
    r, gg, b = map(int, re.match(r'rgb\((\d+),(\d+),(\d+)\)', g("fill")).groups())
    c = re.search(r'>([^<]*)<', tag).group(1).replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">")
    return dict(text=c, cx=cx, cy=cy, size_px=size, weight=fw, hex="%02X%02X%02X" % (r, gg, b))

man = {"page": {"w_in": round(W / DPI, 3), "h_in": round(H / DPI, 3)}, "commerces": {}}
for s in SLUGS:
    svg = open(f"{KIT}/{s}/nds_a4_{s}.svg", encoding="utf-8").read()
    data = base64.b64decode(re.search(r'data:image/png;base64,([A-Za-z0-9+/=]+)', svg).group(1))
    plate_path = f"{WORK}/plate_{s}.png"; open(plate_path, "wb").write(data)
    texts = [parse_text(t) for t in re.findall(r'<text[^>]*>[^<]*</text>', svg)]
    plate = np.asarray(Image.open(plate_path).convert("L"), dtype=np.int16)
    full = np.asarray(Image.open(f"{KIT}/{s}/nds_a4_{s}.png").convert("L"), dtype=np.int16)
    for t in texts:
        cx, cy, sz = t["cx"], t["cy"], t["size_px"]
        w = max(len(t["text"]) * sz * 0.62, 200); h = sz * 1.5
        x0, x1 = int(max(0, cx - w / 2)), int(min(W, cx + w / 2)); y0, y1 = int(max(0, cy - h / 2)), int(min(H, cy + h / 2))
        t["burned"] = float(np.abs(plate[y0:y1, x0:x1] - full[y0:y1, x0:x1]).mean()) < 6
        avail = 2 * min(cx, W - cx) * 0.95
        tw = _d.textlength(t["text"], font=font(sz, 700 if t["weight"] < 800 else 800))
        t["size_fit"] = round(sz * avail / tw, 1) if tw > avail else sz
    man["commerces"][s] = {"plate": plate_path, "texts": texts}
    print(s, len([t for t in texts if not t["burned"]]), "editables")
json.dump(man, open(f"{WORK}/manifest_a4.json", "w"), ensure_ascii=False, indent=1)
print("manifest_a4.json ->", WORK)
