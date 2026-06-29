# -*- coding: utf-8 -*-
import sys, os, math; sys.path.insert(0, "/home/claude/vid")
sys.path.insert(0, "/home/claude/flowin-events-/admin/public/nds/visuels-src")
import numpy as np
import nds_lib as L
from PIL import Image, ImageDraw, ImageFilter

W, H, FPS = 1080, 1920, 24
OUT = "/home/claude/vid/partners_frames"; os.makedirs(OUT, exist_ok=True)
QR = Image.open("/home/claude/vid/qr/bergerie_reseaux_hd.png").convert("RGB")
LOGOS = {k: f"/home/claude/vid/logos/{k}.png" for k in
         ["bergerie", "pegase", "utile", "carrosserie-gp", "giordano", "alafut", "allianz-charvolin"]}

BG = (9, 16, 32); AMBER = (244, 181, 68); WHITE = (255, 255, 255)
MAGENTA = (230, 24, 127); TEAL = (32, 224, 196)

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def ramp(t, a, b): return clamp((t - a) / (b - a)) if b > a else 1.

def _radial(cx, cy, rad, col, strength):
    yy, xx = np.ogrid[0:H, 0:W]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / rad
    g = np.clip(1 - d, 0, 1) ** 2 * strength
    return np.stack([g * col[0], g * col[1], g * col[2]], -1)

def _beam(pts, col, strength, blur):
    m = Image.new("L", (W, H), 0); ImageDraw.Draw(m).polygon(pts, fill=255)
    m = m.filter(ImageFilter.GaussianBlur(blur))
    a = np.asarray(m, np.float32) / 255.0 * strength
    return np.stack([a * col[0], a * col[1], a * col[2]], -1)

_BGCACHE = {}
def make_bg(t):
    key = round(t * 2)
    if key in _BGCACHE: return _BGCACHE[key].copy()
    pulse = 0.92 + 0.08 * math.sin(key / 2 * 1.3)
    base = np.zeros((H, W, 3), np.float32)
    for i in range(3): base[:, :, i] = BG[i]
    acc = np.zeros((H, W, 3), np.float32)
    acc += _beam([(W * 0.32, -60), (W * 0.04, H * 0.40), (W * 0.26, H * 0.40)], (165, 48, 100), 1.05 * pulse, 80)
    acc += _beam([(W * 0.56, -60), (W * 0.30, H * 0.38), (W * 0.60, H * 0.38)], (120, 42, 120), 0.95 * pulse, 80)
    acc += _beam([(W * 0.82, -60), (W * 0.60, H * 0.40), (W * 1.02, H * 0.32)], (180, 44, 116), 1.1 * pulse, 78)
    acc += _radial(W * 0.62, H * 0.12, W * 0.30, (150, 40, 95), 0.5 * pulse)
    acc += _radial(W * 0.50, H * 0.46, W * 0.52, (46, 62, 122), 0.5)
    acc += _radial(W * 0.16, H * 0.64, W * 0.48, (22, 96, 92), 0.46)
    acc += _radial(W * 0.56, H * 0.70, W * 0.52, (70, 52, 30), 0.24)
    out = np.clip(base + acc, 0, 255).astype(np.uint8)
    im = Image.fromarray(out, "RGB").convert("RGBA")
    _BGCACHE[key] = im.copy()
    return im

def tl(txt, size, color, weight=800): return L.text_layer(txt, L.font(size, weight), color)

def pop(base, layer, cx, cy, prog, sf=0.55):
    s = sf + (1 - sf) * eo(prog); a = int(255 * eo(min(1., prog * 1.7)))
    lw, lh = layer.size; nw, nh = max(1, int(lw * s)), max(1, int(lh * s))
    lr = layer.resize((nw, nh), Image.LANCZOS)
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 34); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def logo_tile(base, slug, cx, cy, w, h, prog):
    card = L.logo_card(LOGOS[slug], w, h, pad_ratio=0.085)
    s = 0.7 + 0.3 * eo(prog); nw, nh = int(w * s), int(h * s)
    lr = card.resize((nw, nh), Image.LANCZOS); a = int(255 * eo(min(1, prog * 1.5)))
    if a < 255:
        al = lr.split()[3].point(lambda p: int(p * a / 255)); lr.putalpha(al)
    yo = int((1 - eo(prog)) * 30); base.alpha_composite(lr, (int(cx - nw / 2), int(cy - nh / 2) + yo))

def big_qr(base, cx, cy, prog, qsz=500):
    # QR centré, agrandi, remonté + label "Flash le QR" centré dessous
    ap = eo(ramp(prog, 0.0, 1.0))
    if ap <= 0.02: return
    pad = 30; cw = qsz + pad * 2
    card = Image.new("RGBA", (cw, cw), (0, 0, 0, 0))
    ImageDraw.Draw(card).rounded_rectangle([0, 0, cw - 1, cw - 1], radius=42, fill=(255, 255, 255, 255))
    card.paste(QR.resize((qsz, qsz), Image.NEAREST), (pad, pad))
    s = 0.84 + 0.16 * ap; nw = int(cw * s)
    cr = card.resize((nw, nw), Image.LANCZOS)
    al = cr.split()[3].point(lambda p: int(p * ap)); cr.putalpha(al)
    base.alpha_composite(cr, (int(cx - nw / 2), int(cy - nw / 2)))
    # label
    d = ImageDraw.Draw(base)
    ly = int(cy + nw / 2 + 56)
    fF = L.font(70, 800)
    txt1, txt2 = "Flash ", "le QR"
    w1 = L.measure(txt1, fF)[0]; w2 = L.measure(txt2, fF)[0]
    x0 = int(cx - (w1 + w2) / 2)
    amber = (int(244 * ap), int(181 * ap), int(68 * ap))
    white = (int(255 * ap),) * 3
    d.text((x0, ly), txt1, font=fF, fill=amber, anchor="lm")
    d.text((x0 + w1, ly), txt2, font=fF, fill=white, anchor="lm")

def frame(t):
    img = make_bg(t)
    # titre + sous-titre
    pop(img, tl("JOUE CHEZ NOS PARTENAIRES", 56, AMBER), W / 2, H * 0.100, ramp(t, 0.0, 0.45))
    pop(img, tl("pendant toute la durée du festival !", 40, WHITE), W / 2, H * 0.158, ramp(t, 0.2, 0.65))
    # 7 logos 2-3-2 (Allianz Charvolin au centre rangée 2)
    tw, th = 320, 172; gx = W * 0.5
    dx2 = tw / 2 + 18; dx3 = tw + 22
    r1, r2, r3 = H * 0.275, H * 0.410, H * 0.545
    logo_tile(img, "bergerie",        gx - dx2, r1, tw, th, ramp(t, 0.50, 0.95))
    logo_tile(img, "pegase",          gx + dx2, r1, tw, th, ramp(t, 0.62, 1.07))
    logo_tile(img, "utile",           gx - dx3, r2, tw, th, ramp(t, 0.76, 1.21))
    logo_tile(img, "allianz-charvolin", gx,     r2, tw, th, ramp(t, 0.90, 1.35))
    logo_tile(img, "carrosserie-gp",  gx + dx3, r2, tw, th, ramp(t, 1.04, 1.49))
    logo_tile(img, "giordano",        gx - dx2, r3, tw, th, ramp(t, 1.18, 1.63))
    logo_tile(img, "alafut",          gx + dx2, r3, tw, th, ramp(t, 1.32, 1.77))
    # QR remonté + agrandi (centré sous les logos)
    big_qr(img, W / 2, H * 0.760, ramp(t, 1.45, 2.3), qsz=500)
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    NF = int(6.5 * FPS)  # 156 frames = 6.5 s (= durée 5-partenaires.mp4)
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=92)
    print("CHUNK_OK", a, min(b, NF))
