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
    if lw < 1 or lh < 1: return
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

_logocache = {}
def logo_card(path, card_w, card_h, pad_ratio=0.16, radius_ratio=0.14):
    """Logo PNG (transparence ou fond) ajuste/centre sur cartouche blanc arrondi. Cache par (path,w,h)."""
    key = (path, card_w, card_h)
    if key in _logocache: return _logocache[key].copy()
    logo = Image.open(path).convert("RGBA")
    # trim transparent borders si presents
    bbox = logo.split()[3].getbbox()
    if bbox: logo = logo.crop(bbox)
    pad = int(min(card_w, card_h) * pad_ratio)
    inner_w, inner_h = card_w - 2 * pad, card_h - 2 * pad
    ratio = min(inner_w / logo.width, inner_h / logo.height)
    nw, nh = max(1, int(logo.width * ratio)), max(1, int(logo.height * ratio))
    logo = logo.resize((nw, nh), Image.LANCZOS)
    card = Image.new("RGBA", (card_w, card_h), (0, 0, 0, 0))
    mask = Image.new("L", (card_w, card_h), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, card_w - 1, card_h - 1], radius=int(min(card_w, card_h) * radius_ratio), fill=255)
    white = Image.new("RGBA", (card_w, card_h), (255, 255, 255, 255))
    card = Image.composite(white, card, mask)
    card.alpha_composite(logo, (int((card_w - nw) / 2), int((card_h - nh) / 2)))
    _logocache[key] = card.copy()
    return card


# ============================================================================
# SOURCE UNIQUE DE VERITE — liste des commerces partenaires NDS 2026
# Pour AJOUTER un partenaire : 1) ajouter son logo dans admin/public/nds/partenaires/<slug>.png
#                             2) ajouter "<slug>" a la fin de PARTNERS ci-dessous
#                             3) lancer  bash rebuild_partenaires.sh   (regenere TOUT)
# Tous les generateurs (forex, A4, videos, montage) lisent CETTE liste — plus de drift.
# ============================================================================
PARTNERS = [
    "bergerie", "pegase", "utile", "carrosserie-gp",
    "giordano", "vip-coiffure", "charvolin", "dekra", "nook",
]
PARTENAIRES_DIR = "/home/claude/repo/admin/public/nds/partenaires"

def partner_logo(slug):
    """Chemin du logo PNG d'un partenaire."""
    return f"{PARTENAIRES_DIR}/{slug}.png"

def logo_grid(slugs, cx, cy, area_w, area_h, cols=None, gap_ratio=0.10):
    """Auto-layout d'une grille de logos centree sur (cx,cy) dans une zone area_w x area_h.
    Retourne une liste de tuples (slug, tile_cx, tile_cy, tile_w, tile_h).
    Le nombre de colonnes est calcule pour rester proche d'un ratio tuile ~1.85:1.
    L'APPELANT gere l'animation (ramp) en iterant sur le resultat — la lib ne fait que placer."""
    import math
    n = len(slugs)
    if n == 0: return []
    if cols is None:
        # nb de colonnes equilibre, proche du ratio largeur/hauteur de la zone
        cols = max(1, min(n, round(math.sqrt(n * area_w / area_h))))
    rows = (n + cols - 1) // cols
    cell_w = area_w / cols
    cell_h = area_h / rows
    tw = int(cell_w * (1 - gap_ratio))
    th = int(min(cell_h * (1 - gap_ratio), tw / 1.85))
    out = []
    for i, slug in enumerate(slugs):
        r = i // cols
        c = i % cols
        # nb de tuiles sur CETTE ligne (derniere ligne possiblement incomplete -> centree)
        on_row = min(cols, n - r * cols)
        row_w = on_row * cell_w
        x0 = cx - row_w / 2 + cell_w / 2
        tx = x0 + c * cell_w
        y0 = cy - rows * cell_h / 2 + cell_h / 2
        ty = y0 + r * cell_h
        out.append((slug, tx, ty, tw, th))
    return out
