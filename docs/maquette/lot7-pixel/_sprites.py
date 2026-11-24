# Sprites pixel version claire (charte Flowin). Dessins originaux, esprit borne d'arcade. Maquette seulement.
import math, random
# A = accent (couleur du commerce, orange Flowin par defaut) via variable CSS ; B = bleu animation
P = dict(K='#1B3A5C', I='#1B3A5C', A='var(--a)', B='#3B5CC4', W='#FFFFFF', Y='#F5B82E', O='#C98A0B', H='#FFE9A8',
         R='#DC2626', D='#CBD5E1', M='#15803D', U='#A8541A', V='#6E3411', G='#94A3B8', T='#3B2416', L='#7FA3FF', S='#F2B98C')
SP = {
 'inv1': ["..A.....A..", "...A...A...", "..AAAAAAA..", ".AAWAAAWAA.", "AAAAAAAAAAA", "A.AAAAAAA.A", "A.A.....A.A", "...AA.AA..."],
 'inv2': ["...BB...", "..BBBB..", ".BBBBBB.", "BB.BB.BB", "BBBBBBBB", "..B..B..", ".B.BB.B.", "B.B..B.B"],
 'ship': ["....B....", "...BBB...", "...BBB...", ".BBBBBBB.", "BBBBBBBBB", "BBBBBBBBB", "BBBBBBBBB"],
 'boom': ["A...Y...A", ".A..Y..A.", "..A.Y.A..", "...AYA...", "YYYYAYYYY", "...AYA...", "..A.Y.A..", ".A..Y..A.", "A...Y...A"],
 'coin': ["..YYYY..", ".YHHYYY.", "YHHYYYYO", "YHYYYYYO", "YYYYYYYO", "YYYYYYOO", ".YYYYOO.", "..OOOO.."],
 'heart': [".RR.RR.", "RWRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."],
 'heartv': [".DD.DD.", "DDDDDDD", "DDDDDDD", ".DDDDD.", "..DDD..", "...D..."],
 'star': ["...Y...", "...Y...", "YYYYYYY", ".YYYYY.", "..YYY..", ".YY.YY.", ".Y...Y."],
 'ticket': [".YYYYYYYYYY.", "YYYYYYYOYYYY", "YYWWWYYYYYYY", "YYYYYYYOYYYY", "YYWWWYYYYYYY", "YYYYYYYOYYYY", "YYYYYYYYYYYY", ".YYYYYYYYYY."],
 'cup': ["...G..G....", "....G..G...", "...........", "UUUUUUUU...", "UTTTTTTU.UU", "UTTTTTTU..U", "UUUUUUUU.UU", ".UUUUUU....", "..UUUU....."],
 'chest': ["..UUUUUUUUUU..", ".UUUUUUUUUUUU.", "UUUUUUUUUUUUUU", "UUUUUUUUUUUUUU", "VVVVVVVVVVVVVV", "UUUUUUYYUUUUUU", "UUUUUUYYUUUUUU", "UUUUUUUUUUUUUU", "UUUUUUUUUUUUUU", "UUUUUUUUUUUUUU"],
 'candy': ["R.R.....R.R", ".RRYYYYYRR.", "RRRYWYWYRRR", ".RRYYYYYRR.", "R.R.....R.R"],
 'croix': ["RR...RR", ".RR.RR.", "..RRR..", "..RRR..", ".RR.RR.", "RR...RR"],
 'coche': ["......MM", "....MMM.", "MM.MMM..", ".MMMM...", "..MM...."],
 'son': ["...I......", "..II..I...", "IIII...I..", "IIII..I.I.", "IIII..I.I.", "IIII...I..", "..II..I...", "...I......"],
 'muet': ["...I......", "..II......", "IIII.R..R.", "IIII..RR..", "IIII..RR..", "IIII.R..R.", "..II......", "...I......"],
 'aiguille': ["AAAAAAAAA", ".AAAAAAA.", "..AAAAA..", "...AAA...", "....A...."],
}

def sprite(name, s=4, outline=True, rows=None, cls=''):
    rows = rows or SP[name]
    h, w = len(rows), len(rows[0])
    g = [list(r) for r in rows]
    if outline:
        W2, H2 = w + 2, h + 2
        ng = [['.'] * W2 for _ in range(H2)]
        for y in range(h):
            for x in range(w):
                ng[y + 1][x + 1] = g[y][x]
        for y in range(H2):
            for x in range(W2):
                if ng[y][x] == '.':
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        xx, yy = x + dx, y + dy
                        if 0 <= xx < W2 and 0 <= yy < H2 and ng[yy][xx] not in ('.', 'K'):
                            ng[y][x] = 'K'
                            break
        g, w, h = ng, W2, H2
    out = []
    for y, row in enumerate(g):
        x = 0
        while x < w:
            c = row[x]
            if c == '.':
                x += 1
                continue
            x2 = x
            while x2 < w and row[x2] == c:
                x2 += 1
            col = P[c]
            fill = f'style="fill:{col}"' if col.startswith('var') else f'fill="{col}"'
            out.append(f'<rect x="{x}" y="{y}" width="{x2 - x}" height="1" {fill}/>')
            x = x2
    return (f'<svg class="sp {cls}" width="{w * s}" height="{h * s}" viewBox="0 0 {w} {h}" shape-rendering="crispEdges" '
            f'aria-hidden="true">' + ''.join(out) + '</svg>')

SEG = ['LOT', 'PERDU', 'TICKET', 'PERDU', 'LOT', 'PERDU', 'TICKET', 'PERDU']
SEGC = {'LOT': '#E8872F', 'PERDU': '#E3E9F8', 'TICKET': '#3B5CC4'}
ICON = {'LOT': 'coin', 'PERDU': 'croix', 'TICKET': 'ticket'}
INK = '#1B3A5C'

def wheel(rot=0.0, N=45, cs=7, R=22):
    c = (N - 1) / 2
    cells = {}
    for j in range(N):
        for i in range(N):
            dx, dy = i - c, j - c
            r = math.hypot(dx, dy)
            if r > R:
                continue
            a = math.degrees(math.atan2(dx, -dy)) % 360
            if r > R - 1.3:
                col = INK
            elif r > R - 4.0:
                col = '#FFFFFF'
                arc = a % 22.5
                arc = min(arc, 22.5 - arc)
                if abs(r - (R - 2.6)) < 0.7 and r * math.sin(math.radians(arc)) < 0.8:
                    col = '#F5B82E' if int(a // 22.5) % 2 else '#E8872F'
            elif r <= 3.4:
                col = '#FFFFFF' if r > 1.6 else INK
            else:
                aa = (a - rot) % 360
                seg = int(aa // 45)
                d = aa % 45
                dist = min(d, 45 - d)
                col = INK if r * math.sin(math.radians(dist)) < 0.75 else SEGC[SEG[seg]]
                if r > R - 5.0 and r <= R - 4.0:
                    col = INK
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
    for k, nom in enumerate(SEG):
        ang = math.radians(k * 45 + 22.5 + rot)
        rr = 12.5
        x = (c + rr * math.sin(ang)) * cs
        y = (c - rr * math.cos(ang)) * cs
        icons.append(f'<div class="ico" style="left:{x:.0f}px;top:{y:.0f}px">{sprite(ICON[nom], 4, True)}</div>')
    return f'<div class="roue-w" style="width:{N * cs}px;height:{N * cs}px">{svg}{"".join(icons)}</div>'

def stars_uri(seed=7):
    rnd = random.Random(seed)
    rects = []
    for _ in range(46):
        x, y = rnd.randrange(0, 390, 4), rnd.randrange(0, 844, 4)
        col = rnd.choice(('%23F3D3BC', '%23C9D5F5', '%23F3D3BC'))
        rects.append(f"<rect x='{x}' y='{y}' width='4' height='4' fill='{col}'/>")
    return ("url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='390' height='844' "
            "shape-rendering='crispEdges'>" + ''.join(rects) + "</svg>\")")

def qr(n=21, seed=3):
    rnd = random.Random(seed)
    g = [[rnd.random() < .5 for _ in range(n)] for _ in range(n)]
    def finder(ox, oy):
        for y in range(7):
            for x in range(7):
                g[oy + y][ox + x] = x in (0, 6) or y in (0, 6) or (2 <= x <= 4 and 2 <= y <= 4)
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7)
    rects = ''.join(f'<rect x="{x}" y="{y}" width="1" height="1"/>' for y in range(n) for x in range(n) if g[y][x])
    return (f'<svg width="{(n + 2) * 5}" height="{(n + 2) * 5}" viewBox="-1 -1 {n + 2} {n + 2}" shape-rendering="crispEdges" '
            f'role="img" aria-label="Emplacement du QR du ticket (exemple)"><rect x="-1" y="-1" width="{n + 2}" height="{n + 2}" fill="#fff"/>'
            f'<g fill="#1B3A5C">{rects}</g></svg>')
