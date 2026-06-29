# -*- coding: utf-8 -*-
# Decor ticket tombola SANS les textes variables (lot/partenaire-valeur/serial),
# + manifeste positions -> PPTX editable. Reutilise header_band + constantes de gen_tickets.
import sys, os, json; sys.path.insert(0, "/home/claude/vid")
from PIL import Image, ImageDraw
import nds_lib as L
import gen_tickets as G   # header_band, TW, TH, constantes

WORK = "/home/claude/pptx_work"; os.makedirs(WORK, exist_ok=True)
TW, TH = G.TW, G.TH
AMBER, TEAL, WHITE, INK, MUTE = G.AMBER, G.TEAL, G.WHITE, G.INK, G.MUTE

def decor(serial_example):
    """Decor fixe du ticket : header band, logo, eyebrow, perforation, champs, mentions, contour.
    Renvoie (image, positions) ; positions = lot_title / sub / serial (a poser en PPTX)."""
    base = Image.new("RGBA", (TW, TH), (0, 0, 0, 0))
    card = Image.new("RGBA", (TW, TH), (255, 255, 255, 255))
    mask = Image.new("L", (TW, TH), 0); ImageDraw.Draw(mask).rounded_rectangle([0, 0, TW-1, TH-1], radius=30, fill=255)
    base = Image.composite(card, base, mask)
    bh = int(TH*0.46)
    band = G.header_band(TW, bh).copy()
    bmask = Image.new("L", (TW, bh), 0); ImageDraw.Draw(bmask).rounded_rectangle([0, 0, TW-1, bh+30], radius=30, fill=255)
    band.putalpha(bmask); base.alpha_composite(band, (0, 0))
    d = ImageDraw.Draw(base)
    lscale = 0.17; lw = int(L.LOGO.width*lscale); lh = int(L.LOGO.height*lscale)
    L.put_logo(base, 60+lw/2, 46+lh/2, lscale)
    # serial pill (largeur basee sur l'exemple) — la pill reste dans le decor, le serial est editable
    sfnt = L.font(40, 800); sw = L.measure(serial_example, sfnt)[0]; cw = sw+70
    pill = Image.new("RGBA", (cw, 76), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle([0, 0, cw-1, 75], radius=38, fill=AMBER+(255,))
    base.alpha_composite(pill, (TW-cw-40, 44))
    serial_pos = dict(cx=(TW-cw-40)+cw/2, cy=44+38, size_px=40, hex="%02X%02X%02X" % INK, weight=800, anchor="mm", text=serial_example)
    ey = 46+lh+26
    d.text((68, ey), "TICKET TOMBOLA", font=L.font(32, 800), fill=TEAL+(255,), anchor="lm")  # fixe (brule)
    # perforation
    py = bh+6
    for x in range(40, TW-40, 34): d.line([(x, py), (x+18, py)], fill=(150, 150, 160, 255), width=3)
    # champs corps (labels fixes + lignes)
    fy = bh+62; fx = 80; fnt = L.font(40, 700)
    def field(label, y, frac=0.82):
        d.text((fx, y), label, font=fnt, fill=INK+(255,), anchor="lm")
        x0 = fx+L.measure(label, fnt)[0]+24; x1 = int(TW*frac)
        d.line([(x0, y+22), (x1, y+22)], fill=(60, 66, 90, 255), width=3)
    field("Gagnant :", fy); field("Téléphone :", fy+80)
    d.text((fx, fy+160), "Tiré le :", font=fnt, fill=INK+(255,), anchor="lm")
    d.line([(fx+L.measure("Tiré le :", fnt)[0]+24, fy+182), (int(TW*0.46), fy+182)], fill=(60, 66, 90, 255), width=3)
    d.text((int(TW*0.52), fy+160), "Émargement :", font=fnt, fill=INK+(255,), anchor="lm")
    d.line([(int(TW*0.52)+L.measure("Émargement :", fnt)[0]+24, fy+182), (TW-80, fy+182)], fill=(60, 66, 90, 255), width=3)
    # mentions bas (fixes)
    fA = L.font(30, 800)
    seg = [("Nuits du Sud", (90, 96, 120)), ("  ×  ", (150, 156, 176)), ("Flowin", L.ORANGE)]
    totw = sum(L.measure(t, fA)[0] for t, _ in seg); x = TW/2-totw/2; yA = TH-58
    for t, col in seg:
        d.text((x, yA), t, font=fA, fill=col+(255,), anchor="lm"); x += L.measure(t, fA)[0]
    d.text((TW/2, TH-24), "9 → 18 juillet 2026 · Vence · à présenter chez le commerce", font=L.font(24, 600), fill=MUTE+(255,), anchor="mm")
    ImageDraw.Draw(base).rounded_rectangle([1, 1, TW-2, TH-2], radius=30, outline=(40, 46, 70, 120), width=2)
    # positions des textes editables (lot/sub anchor lm a gauche)
    lot_pos = dict(cx=68, cy=ey+54, size_px=50, hex="FFFFFF", weight=800, anchor="lm")
    sub_pos = dict(cx=68, cy=ey+104, size_px=34, hex="DEE4F6", weight=600, anchor="lm")
    return base.convert("RGB"), lot_pos, sub_pos, serial_pos

man = {"tw": TW, "th": TH, "dpi": 300, "lots": []}
for label, partner, val, serials, fn in G.LOTS:
    sub = (partner+"  ·  "+val) if partner else val
    img, lot_pos, sub_pos, serial_pos = decor(serials[0])
    plate = f"{WORK}/tplate_{fn}.png"; img.save(plate)
    lot_pos["text"] = label; sub_pos["text"] = sub
    man["lots"].append(dict(fn=fn, label=label, plate=plate, n=len(serials),
                            texts=[lot_pos, sub_pos, serial_pos]))
    print("decor", fn)
json.dump(man, open(f"{WORK}/manifest_tickets.json", "w"), ensure_ascii=False, indent=1)
print("manifest_tickets.json ecrit :", len(man["lots"]), "lots")
