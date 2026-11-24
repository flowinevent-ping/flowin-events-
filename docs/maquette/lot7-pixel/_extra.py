# Complements : tramage (dithering), eclatement de pixels, roue variante B, formes. Maquette seulement.
import math, random
from _sprites import sprite, SP, P, INK

P.update(Z='#CBD5F0')
SP.update({
 'inv3': ["...AAAAA...", ".AAAAAAAAA.", "AAAAAAAAAAA", "AAA..A..AAA", "AAAAAAAAAAA", "..AA...AA..", ".AA.AAA.AA.", "AA.......AA"],
 'f_carre': ["AAAAAAA"] * 7,
 'f_rond': [".BBBBB.", "BBBBBBB", "BBBBBBB", "BBBBBBB", "BBBBBBB", "BBBBBBB", ".BBBBB."],
 'f_tri': ["...Y...", "..YYY..", ".YYYYY.", "YYYYYYY", "YYYYYYY"],
 'f_los': ["...I...", "..III..", ".IIIII.", "IIIIIII", ".IIIII.", "..III..", "...I..."],
 'bas': ["AAAAAAA", ".AAAAA.", "..AAA..", "...A..."],
 'coche_g': ["........MM", "......MMM.", "MM...MMM..", ".MM.MMM...", "..MMMM....", "...MM....."],
})
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]

def band(h=150, w=390, cell=4, force=1.0, cls=''):
    """Bandeau tramé (dithering de Bayer) : plein en haut, vide en bas. Prend la couleur --a par masque."""
    rects = []
    for j in range(h // cell):
        alpha = max(0.0, 1 - (j * cell) / h) * force
        i = 0
        row = []
        for i in range(w // cell):
            row.append(BAYER[j % 4][i % 4] / 16.0 < alpha)
        i = 0
        while i < len(row):
            if not row[i]:
                i += 1
                continue
            i2 = i
            while i2 < len(row) and row[i2]:
                i2 += 1
            rects.append(f"<rect x='{i * cell}' y='{j * cell}' width='{(i2 - i) * cell}' height='{cell}'/>")
            i = i2
    uri = (f"url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='{w}' height='{h}'>" + ''.join(rects) + "</svg>\")")
    uri = uri.replace('"', '&quot;')
    return f'<div class="band {cls}" style="height:{h}px;-webkit-mask-image:{uri};mask-image:{uri}"></div>'

def burst(cx, cy, n=22, rmax=84, seed=1, colors=('#F5B82E', '#E8872F', '#3B5CC4', '#15803D', '#FFFFFF')):
    rnd = random.Random(seed)
    out = []
    for k in range(n):
        ang = (k / n) * 2 * math.pi + rnd.random() * .3
        r = rmax * (0.35 + 0.65 * rnd.random())
        dx, dy = round(math.cos(ang) * r / 4) * 4, round(math.sin(ang) * r / 4) * 4
        s = rnd.choice((4, 4, 8))
        col = colors[k % len(colors)]
        out.append(f'<i class="pt" style="left:{cx + dx}px;top:{cy + dy}px;width:{s}px;height:{s}px;background:{col};--dx:{dx}px;--dy:{dy}px"></i>')
    return ''.join(out)

def onde(cx, cy, rayons=(40, 76, 112)):
    return ''.join(f'<i class="onde" style="left:{cx - r}px;top:{cy - r}px;width:{2 * r}px;height:{2 * r}px;opacity:{1 - k * .28}"></i>' for k, r in enumerate(rayons))

SEG = ['LOT', 'PERDU', 'TICKET', 'PERDU', 'LOT', 'PERDU', 'TICKET', 'PERDU']
SEGC = {'LOT': '#E8872F', 'PERDU': '#E3E9F8', 'TICKET': '#3B5CC4'}
ICON = {'LOT': 'coin', 'PERDU': 'croix', 'TICKET': 'ticket'}

def wheel2(rot=0.0, lit=None, variant='A', N=None, cs=None, R=None):
    """Roue en pixels. variant B : cases tramées (damier, rayures), lampes, anneau epais. lit : liste de cases allumees."""
    N, cs, R = N or 45, cs or 7, R or 22
    sc = R / 22.0
    c = (N - 1) / 2
    cells = {}
    for j in range(N):
        for i in range(N):
            dx, dy = i - c, j - c
            r = math.hypot(dx, dy)
            if r > R:
                continue
            a = math.degrees(math.atan2(dx, -dy)) % 360
            rim = 1.3 if variant == 'A' else 2.0
            ring = 4.0 if variant == 'A' else 5.0
            if r > R - rim:
                col = INK
            elif r > R - ring:
                col = '#FFFFFF'
                arc = a % 22.5
                arc = min(arc, 22.5 - arc)
                if abs(r - (R - (rim + ring) / 2 - .2)) < 0.8 and r * math.sin(math.radians(arc)) < 0.8:
                    k = int(a // 22.5)
                    col = '#F5B82E' if k % 2 else '#E8872F'
            elif r <= 3.4 * sc:
                col = '#FFFFFF' if r > 1.6 * sc else INK
            else:
                aa = (a - rot) % 360
                seg = int(aa // 45)
                d = aa % 45
                dist = min(d, 45 - d)
                nom = SEG[seg]
                base = SEGC[nom]
                if r * math.sin(math.radians(dist)) < 0.8:
                    col = INK
                elif r > R - ring - 0.9 and r <= R - ring:
                    col = INK
                else:
                    col = base
                    if variant == 'B':
                        # degrade tramé (Bayer) du centre vers le bord
                        t = (r - 3.4 * sc) / max(1.0, (R - ring - 3.4 * sc))
                        clair = {'LOT': '#F5B82E', 'PERDU': '#FFFFFF', 'TICKET': '#6F8BE0'}[nom]
                        if t > 0.35 and BAYER[j % 4][i % 4] / 16.0 < (t - 0.35) * 0.9:
                            col = clair
                    if lit is not None and seg not in lit:
                        col = '#F1F4F9'
                    elif lit is not None and (i * 7 + j * 3) % 11 == 0 and r > 5:
                        col = '#FFFFFF'
            cells[(i, j)] = col
    out = []
    for j in range(N):
        i = 0
        while i < N:
            col = cells.get((i, j))
            if not col:
                i += 1
                continue
            i2 = i
            while i2 < N and cells.get((i2, j)) == col:
                i2 += 1
            out.append(f'<rect x="{i}" y="{j}" width="{i2 - i}" height="1" fill="{col}"/>')
            i = i2
    svg = (f'<svg class="roue" width="{N * cs}" height="{N * cs}" viewBox="0 0 {N} {N}" shape-rendering="crispEdges" role="img" '
           f'aria-label="Roue : 2 cases lot, 4 cases perdu, 2 cases ticket">' + ''.join(out) + '</svg>')
    icons = []
    rr = 12.5
    for k, nom in enumerate(SEG):
        ang = math.radians(k * 45 + 22.5 + rot)
        x = (c + rr * math.sin(ang)) * cs
        y = (c - rr * math.cos(ang)) * cs
        s = 4 if variant == 'A' else 4
        dim = ' style="opacity:.35"' if (lit is not None and k not in lit) else ''
        icons.append(f'<div class="ico" style="left:{x:.0f}px;top:{y:.0f}px"{dim}>{sprite(ICON[nom], s, True)}</div>')
    return f'<div class="roue-w" style="width:{N * cs}px;height:{N * cs}px">{svg}{"".join(icons)}</div>'
