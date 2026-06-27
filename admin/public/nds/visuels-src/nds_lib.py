# -*- coding: utf-8 -*-
"""Lib de rendu NDS - charte kinetique (navy/orange/teal, Manrope). bg numpy rapide."""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

FP = "/home/claude/vid/fonts/Manrope.ttf"
LOGO = Image.open("/home/claude/repo/admin/public/nds/logo_nds_blanc_hd.png").convert("RGBA")
NAVY_TOP = (11, 16, 64); NAVY_BOT = (42, 18, 86)
ORANGE = (255, 122, 26); TEAL = (32, 224, 196); WHITE = (255, 255, 255)

_fcache = {}
def font(s, w=800):
    k = (s, w)
    if k in _fcache: return _fcache[k]
    f = ImageFont.truetype(FP, s)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    _fcache[k] = f
    return f

def bg(W, H, glow_cy=0.40, glow_strength=1.0):
    """Degrade vertical navy + glow orange radial, vectorise numpy."""
    y = np.linspace(0, 1, H)[:, None]
    top = np.array(NAVY_TOP); bot = np.array(NAVY_BOT)
    grad = (top[None, None, :] + (bot - top)[None, None, :] * y[:, :, None])  # H,1,3
    arr = np.repeat(grad, W, axis=1).astype(np.float64)
    # glow radial orange
    xs = np.arange(W)[None, :]; ys = np.arange(H)[:, None]
    cx = W / 2; cy = H * glow_cy
    r = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2)
    maxr = min(W, H) * 0.78
    g = np.clip(1 - r / maxr, 0, 1) ** 1.5 * (0.42 * glow_strength)
    org = np.array(ORANGE)
    arr = arr * (1 - g[:, :, None]) + org[None, None, :] * g[:, :, None]
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8), "RGB").convert("RGBA")

def text_layer(txt, fnt, color):
    tmp = Image.new("RGBA", (10, 10)); d = ImageDraw.Draw(tmp)
    bb = d.textbbox((0, 0), txt, font=fnt); tw, th = bb[2] - bb[0], bb[3] - bb[1]; pad = 40
    layer = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(layer)
    d.text((pad - bb[0], pad - bb[1]), txt, font=fnt, fill=color)
    return layer

def ctext(img, cx, cy, txt, fnt, color):
    d = ImageDraw.Draw(img); d.text((cx, cy), txt, font=fnt, fill=color, anchor="mm")

def measure(txt, fnt):
    tmp = Image.new("RGBA", (10, 10)); d = ImageDraw.Draw(tmp)
    bb = d.textbbox((0, 0), txt, font=fnt); return bb[2] - bb[0], bb[3] - bb[1]

def chip(img, cx, cy, txt, fnt, fill=ORANGE, fg=WHITE, padx=44, pady=20):
    tw, th = measure(txt, fnt); w = tw + padx * 2; h = th + pady * 2
    pill = Image.new("RGBA", (w, h), (0, 0, 0, 0)); pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle([0, 0, w - 1, h - 1], radius=h // 2, fill=fill)
    pd.text((w / 2, h / 2), txt, font=fnt, fill=fg, anchor="mm")
    img.alpha_composite(pill, (int(cx - w / 2), int(cy - h / 2)))

def put_logo(img, cx, cy, scale, alpha=1.0):
    lw = int(LOGO.width * scale); lh = int(LOGO.height * scale)
    lr = LOGO.resize((lw, lh), Image.LANCZOS)
    if alpha < 1.0:
        a = lr.split()[3].point(lambda p: int(p * alpha)); lr.putalpha(a)
    img.alpha_composite(lr, (int(cx - lw / 2), int(cy - lh / 2)))

def put_qr(img, qr_img, cx, cy, size, border=28, bg=(255, 255, 255)):
    q = qr_img.resize((size, size), Image.NEAREST).convert("RGB")
    card = Image.new("RGBA", (size + border * 2, size + border * 2), bg + (255,))
    card.paste(q, (border, border))
    img.alpha_composite(card, (int(cx - (size + border * 2) / 2), int(cy - (size + border * 2) / 2)))

CONTACT = "flowinevent@gmail.com · 06 16 35 49 36"
SIGN = "Animez · Fidélisez · Boostez"
