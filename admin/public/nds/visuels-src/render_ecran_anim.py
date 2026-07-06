# -*- coding: utf-8 -*-
"""Animateur ECRAN (pop des elements) — REUTILISE les scenes validees de render_lancement_9x16.
Aucun changement de contenu/positions : on ajoute juste le mouvement (pop scale+fade, staggered).
30 s = 5 scenes x 6 s. QR visible en bas (statique). Sortie: frames JPG dans /home/claude/work/ecran_anim.
Invocation: python3 render_ecran_anim.py <a> <b>  (chunk de frames)."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
from PIL import Image, ImageDraw
import render_lancement_9x16 as R   # helpers, couleurs, icones, positions

W, H, FPS = R.W, R.H, 24
OUT = "/home/claude/work/ecran_anim"; os.makedirs(OUT, exist_ok=True)
SCENE = 6.0; NF = int(5 * SCENE * FPS)  # 720 frames = 30 s

def clamp(x, a=0., b=1.): return max(a, min(b, x))
def eo(x): x = clamp(x); return 1 - (1 - x) ** 3
def ramp(t, a, b): return clamp((t - a) / (b - a)) if b > a else 1.

def pop(base, layer, cx, cy, prog, sf=0.55):
    """Compose 'layer' (RGBA plein cadre) en le scalant autour de (cx,cy) avec fade."""
    p = eo(clamp(prog))
    if p <= 0: return
    s = sf + (1 - sf) * p
    a = int(255 * eo(clamp(prog * 1.5)))
    if s != 1.0:
        nw, nh = max(1, int(W * s)), max(1, int(H * s))
        lay = layer.resize((nw, nh), Image.LANCZOS)
        ox, oy = int(cx - cx * s), int(cy - cy * s)
    else:
        lay, ox, oy = layer.copy(), 0, 0
    if a < 255:
        al = lay.split()[3].point(lambda v: v * a // 255); lay.putalpha(al)
    base.alpha_composite(lay, (ox, oy))

def full():  # calque transparent plein cadre + draw
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); return im, ImageDraw.Draw(im)

def pastille_layer(y, accent, icon, label, sub=None, ph=None, ls=None):
    im, d = full(); R.pastille(im, d, y, accent, icon, label, sub=sub, ph=ph, ls=ls); return im

def text_layer(cx, y, s, font, fill, sp=0):
    im, d = full(); R.tc(d, cx, y, s, font, fill, sp=sp); return im

def rect_layer(box, radius, fill):
    im, d = full(); d.rounded_rectangle(box, radius, outline=fill if False else None, fill=fill); return im

def base_scene():
    img = R.bg_base(); R.header(img); return img

def draw_qr(img):
    R.qr_block(img, ImageDraw.Draw(img))

# ---------- scenes animees (positions COPIEES des scenes validees) ----------
def s_intro(lt, img):
    d = ImageDraw.Draw(img)
    ft = R.f("Bold", 30); lbl = "GRAND JEU OFFICIEL"
    wtxt = sum(d.textlength(c, font=ft) + 6 for c in lbl) - 6; pw = int(wtxt) + 64; px = (W - pw) // 2
    pl, pd = full(); pd.rounded_rectangle([px, 300, px + pw, 364], 32, outline=R.AMBER, width=3)
    R.tc(pd, W // 2, 314, lbl, ft, R.AMBER, sp=6)
    pop(img, pl, W // 2, 332, ramp(lt, 0.0, 0.5))
    big = R.f("ExtraBold", 150)
    for i, (w, c) in enumerate([("Flash", R.MAGENTA), ("Joue", R.AMBER), ("Gagne", R.TEAL)]):
        yy = 420 + i * 168; wl = d.textlength(w, font=big); tot = wl + d.textlength(".", font=big); x = (W - tot) / 2
        wlyr, wd = full(); wd.text((x, yy), w, font=big, fill=R.WHITE); wd.text((x + wl, yy), ".", font=big, fill=c)
        pop(img, wlyr, W // 2, yy + 75, ramp(lt, 0.35 + i * 0.22, 0.85 + i * 0.22))
    pop(img, text_layer(W // 2, 948, "Le grand jeu des Nuits du Sud × Flowin", R.f("Medium", 38), R.GREY),
        W // 2, 966, ramp(lt, 1.1, 1.5))

def s_comment(lt, img):
    pop(img, text_layer(W // 2, 246, "COMMENT ÇA MARCHE", R.f("Bold", 34), R.AMBER, sp=4), W // 2, 262, ramp(lt, 0.0, 0.4))
    steps = [("1", "Flash le QR code"), ("2", "Réponds au quiz"), ("3", "Cumule des tickets")]; y0 = 336
    for i, (n, t) in enumerate(steps):
        y = y0 + i * 130; x0 = 70; im, d = full()
        im.alpha_composite(R.rounded((W - 140, 110), 26, (20, 28, 52, 240)), (x0, y))
        bd = 78; badge = Image.new("RGBA", (bd, bd), (0, 0, 0, 0)); bdd = ImageDraw.Draw(badge)
        bdd.ellipse([0, 0, bd - 1, bd - 1], fill=R.AMBER + (255,))
        bdd.text((bd / 2 - bdd.textlength(n, font=R.f("ExtraBold", 46)) / 2, 12), n, font=R.f("ExtraBold", 46), fill=R.BG)
        im.alpha_composite(badge, (x0 + 22, y + 16))
        d.text((x0 + 22 + bd + 26, y + 30), t, font=R.f("ExtraBold", 46), fill=R.WHITE)
        pop(img, im, W // 2, y + 55, ramp(lt, 0.3 + i * 0.22, 0.8 + i * 0.22))
    # bandeau PLUS TU JOUES
    by = y0 + 3 * 130 + 18
    im2, d2 = full()
    bw, bh = W - 120, 140; yy, xx = np.mgrid[0:bh, 0:bw]; tg = np.clip(xx / bw, 0, 1)
    g = (np.array(R.AMBER)[None, None, :] * (1 - tg)[..., None] + np.array(R.MAGENTA)[None, None, :] * tg[..., None]).astype(np.uint8)
    ba = np.dstack([g, np.full((bh, bw), 255, np.uint8)]); bandimg = Image.fromarray(ba, "RGBA")
    m = Image.new("L", (bw, bh), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, bw - 1, bh - 1], 34, fill=255); bandimg.putalpha(m)
    im2.alpha_composite(bandimg, (60, by))
    R.tc(d2, W // 2, by + 30, "PLUS TU JOUES,", R.f("ExtraBold", 50), R.WHITE)
    R.tc(d2, W // 2, by + 82, "PLUS TU GAGNES !", R.f("ExtraBold", 50), R.WHITE)
    pop(img, im2, W // 2, by + 70, ramp(lt, 1.0, 1.5))

def s_gagner(lt, img):
    pop(img, text_layer(W // 2, 246, "À GAGNER", R.f("Bold", 34), R.AMBER, sp=6), W // 2, 262, ramp(lt, 0.0, 0.4))
    pop(img, pastille_layer(486, R.MAGENTA, R.ic_note, "Des places de concert", sub="à gagner chaque soir du festival", ph=200, ls=56),
        W // 2, 586, ramp(lt, 0.35, 0.85))
    pop(img, pastille_layer(742, R.AMBER, R.ic_euro, "Des bons d'achat", sub="chez les commerces partenaires", ph=200, ls=56),
        W // 2, 842, ramp(lt, 0.6, 1.1))

def s_ouj(lt, img):
    pop(img, text_layer(W // 2, 235, "OÙ JOUER ?", R.f("Bold", 32), R.AMBER, sp=8), W // 2, 251, ramp(lt, 0.0, 0.35))
    pop(img, text_layer(W // 2, 284, "Rendez-vous aux stations de jeux", R.f("ExtraBold", 46), R.WHITE), W // 2, 310, ramp(lt, 0.2, 0.6))
    _py = 440; _pg = 104
    rows = [(_py, R.AMBER, R.ic_ticket, "Aux caisses", None),
            (_py + _pg, R.MAGENTA, R.ic_glass, "Aux bars", None),
            (_py + 2 * _pg, R.TEAL, R.ic_leaf, "À la Brigade Verte", None),
            (_py + 3 * _pg, R.BLUE, R.ic_screen, "Aux écrans scène", None),
            (_py + 4 * _pg + 22, (139, 92, 246), R.ic_shop, "Chez les partenaires participants", 38)]
    for i, (yy, acc, ic, lab, ls) in enumerate(rows):
        pop(img, pastille_layer(yy, acc, ic, lab, ls=ls), W // 2, yy + 48, ramp(lt, 0.4 + i * 0.16, 0.8 + i * 0.16))

def s_finale(lt, img):
    d = ImageDraw.Draw(img)
    pop(img, text_layer(W // 2, 232, "Un grand tirage au sort", R.f("ExtraBold", 60), R.WHITE), W // 2, 262, ramp(lt, 0.0, 0.4))
    # (le vrai finale a 2 lignes + trait ; on garde le titre principal + NOS PARTENAIRES + mur)
    pop(img, text_layer(W // 2, 308, "à la clôture du festival", R.f("ExtraBold", 60), R.WHITE), W // 2, 338, ramp(lt, 0.15, 0.55))
    pop(img, text_layer(W // 2, 440, "NOS PARTENAIRES", R.f("Bold", 30), R.AMBER, sp=6), W // 2, 456, ramp(lt, 0.4, 0.8))
    rows = [R.PARTNERS[0:3], R.PARTNERS[3:6], R.PARTNERS[6:8]]; cw, ch = 306, 140; gx = 20; gy0 = 478; gyg = 20
    idx = 0
    for r, row in enumerate(rows):
        n = len(row); tot = n * cw + (n - 1) * gx; x0 = (W - tot) // 2; cy = gy0 + r * (ch + gyg)
        for c, slug in enumerate(row):
            cx = x0 + c * (cw + gx); im, _ = full()
            im.alpha_composite(R.rounded((cw, ch), 22, (255, 255, 255, 255)), (cx, cy))
            try:
                lg = R.fit_contain(Image.open(f"{R.REPO}/partenaires/{slug}.png").convert("RGBA"), cw, ch, 10)
                im.alpha_composite(lg, (cx + (cw - lg.size[0]) // 2, cy + (ch - lg.size[1]) // 2))
            except Exception:
                pass
            pop(img, im, cx + cw // 2, cy + ch // 2, ramp(lt, 0.55 + idx * 0.12, 0.95 + idx * 0.12)); idx += 1

SCENES = [s_intro, s_comment, s_gagner, s_ouj, s_finale]

def frame(t):
    img = base_scene()
    si = min(4, int(t // SCENE)); lt = t - si * SCENE
    SCENES[si](lt, img)
    draw_qr(img)   # QR statique en bas, toutes scenes
    return img.convert("RGB")

if __name__ == "__main__":
    a = int(sys.argv[1]); b = int(sys.argv[2])
    for i in range(a, min(b, NF)):
        frame(i / FPS).save(f"{OUT}/f{i:04d}.jpg", quality=90)
    print("CHUNK_OK", a, min(b, NF))
