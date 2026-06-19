#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Génère les visuels NDS 2026 (Flowin) :
  - 3 visuels réseaux/print  : carré 1080x1080, story 1080x1920, Forex 700x700 (PNG)
  - Forex print              : 700x700 (PDF)
  - 9 QR codes par station   : un PNG par point de jeu

Palette : navy #0a1020 · bleu #5B79E0 · or #F5B544 · magenta #E5006D · teal #2FD89E
Wordmark Flowin : "Flow" blanc + "in" teal #00B4A0
QR visuels sociaux  -> https://flowin-events.vercel.app/nds
QR stations         -> https://flowin-events.vercel.app/parcours/nds2026?ev=<id>

Mise en page : ancrage par le bas (logo/titre en haut, QR + bandeau + wordmark
ancrés depuis le bas) => aucun chevauchement possible.
Dépendances : cairosvg, segno, pillow
"""
import base64, io, os
import cairosvg
import segno

ROOT      = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
LOGO_PATH = os.path.join(ROOT, 'admin', 'public', 'nds', 'logo_nds_blanc_hd.png')
OUT_VIS   = os.path.join(ROOT, 'admin', 'public', 'nds', 'visuels')
OUT_QR    = os.path.join(ROOT, 'admin', 'public', 'nds', 'qr')
os.makedirs(OUT_VIS, exist_ok=True)
os.makedirs(OUT_QR, exist_ok=True)

NAVY, BLEU, OR, MAGENTA, TEAL = '#0a1020', '#5B79E0', '#F5B544', '#E5006D', '#2FD89E'
WORDMARK_TEAL = '#00B4A0'
FONT = 'DejaVu Sans, Arial, sans-serif'

SITE       = 'https://flowin-events.vercel.app'
URL_SOCIAL = SITE + '/nds'
URL_EV     = SITE + '/parcours/nds2026?ev='

STATIONS = [
    ('ev-nds-caisse-1',   'Caisse 1'),
    ('ev-nds-caisse-2',   'Caisse 2'),
    ('ev-nds-caisse-3',   'Caisse 3'),
    ('ev-nds-bar-1',      'Bar 1'),
    ('ev-nds-bar-2',      'Bar 2'),
    ('ev-nds-ecrans',     'Ecran'),
    ('ev-nds-tablette-1', 'Tablette 1'),
    ('ev-nds-tablette-2', 'Tablette 2'),
    ('ev-nds-tablette-3', 'Tablette 3'),
]

LOGO_B64 = base64.b64encode(open(LOGO_PATH, 'rb').read()).decode('ascii')
LOGO_RATIO = 528.0 / 1263.0

CFG = {
    #            logo  title  sub   subL qr    qr_bottom band   wm     wm_bottom pill   title_txt
    'carre': dict(logo=0.42, title=0.062, sub=0.027, subL=2, qr=0.27, qr_bottom=0.840, band=False, wm=0.032, wm_bottom=0.955, pill=True),
    'story': dict(logo=0.54, title=0.078, sub=0.032, subL=2, qr=0.40, qr_bottom=0.800, band=False, wm=0.036, wm_bottom=0.950, pill=True),
    'forex': dict(logo=0.44, title=0.062, sub=0.026, subL=1, qr=0.26, qr_bottom=0.640, band=True,  wm=0.030, wm_bottom=0.965, pill=False),
}


def qr_data_uri(url, dark=NAVY, light='#ffffff', scale=12, border=2):
    qr = segno.make(url, error='m')
    buf = io.BytesIO()
    qr.save(buf, kind='png', scale=scale, border=border, dark=dark, light=light)
    return 'data:image/png;base64,' + base64.b64encode(buf.getvalue()).decode('ascii')


def esc(s):
    return s.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')


def text(x, y, s, size, fill='#ffffff', weight='normal', anchor='middle', ls=None):
    extra = (' letter-spacing="%g"' % ls) if ls is not None else ''
    return ('<text x="%g" y="%g" font-family="%s" font-weight="%s" font-size="%g" '
            'fill="%s" text-anchor="%s"%s>%s</text>'
            % (x, y, FONT, weight, size, fill, anchor, extra, esc(s)))


def wordmark_centered(cx, baseline, size):
    approx = len('Flowin') * size * 0.60
    x = cx - approx / 2.0
    return ('<text x="%g" y="%g" font-family="%s" font-weight="bold" font-size="%g">'
            '<tspan fill="#ffffff">Flow</tspan><tspan fill="%s">in</tspan></text>'
            % (x, baseline, FONT, size, WORDMARK_TEAL))


def pill(cx, y, txt, fs, fill=OR, color=NAVY):
    w = len(txt) * fs * 0.64 + fs * 1.8
    return ('<g><rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="%s"/>%s</g>'
            % (cx - w / 2.0, y, w, fs * 1.95, fs * 0.97, fill,
               text(cx, y + fs * 1.34, txt, fs, fill=color, weight='bold', ls=1.5)))


def bg(w, h):
    return (
        '<defs>'
        '<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#0c1430"/><stop offset="1" stop-color="%s"/></linearGradient>'
        '<radialGradient id="h1" cx="0.16" cy="0.10" r="0.55"><stop offset="0" stop-color="%s" stop-opacity="0.55"/><stop offset="1" stop-color="%s" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="h2" cx="0.88" cy="0.92" r="0.6"><stop offset="0" stop-color="%s" stop-opacity="0.5"/><stop offset="1" stop-color="%s" stop-opacity="0"/></radialGradient>'
        '<radialGradient id="h3" cx="0.85" cy="0.08" r="0.45"><stop offset="0" stop-color="%s" stop-opacity="0.32"/><stop offset="1" stop-color="%s" stop-opacity="0"/></radialGradient>'
        '</defs>'
        '<rect width="%g" height="%g" fill="url(#bg)"/>'
        '<rect width="%g" height="%g" fill="url(#h1)"/>'
        '<rect width="%g" height="%g" fill="url(#h2)"/>'
        '<rect width="%g" height="%g" fill="url(#h3)"/>'
        % (NAVY, MAGENTA, MAGENTA, BLEU, BLEU, OR, OR, w, h, w, h, w, h, w, h))


def build_visual(variant, w, h):
    c = CFG[variant]
    cx = w / 2.0
    s = ['<svg xmlns="http://www.w3.org/2000/svg" width="%g" height="%g" viewBox="0 0 %g %g">' % (w, h, w, h)]
    s.append(bg(w, h))

    # ── Flux haut -> bas : logo, pill, titre, sous-titre ──────────────────
    logo_w = w * c['logo']; logo_h = logo_w * LOGO_RATIO
    logo_top = h * 0.065
    s.append('<image x="%g" y="%g" width="%g" height="%g" href="data:image/png;base64,%s"/>'
             % (cx - logo_w / 2.0, logo_top, logo_w, logo_h, LOGO_B64))
    cursor = logo_top + logo_h

    if c['pill']:
        py = cursor + h * 0.028
        s.append(pill(cx, py, 'TICKETS À GAGNER', w * 0.020))
        cursor = py + w * 0.020 * 1.95

    title_size = w * c['title']
    cursor += h * 0.045
    s.append(text(cx, cursor + title_size * 0.80, 'Flashe. Joue. Gagne.', title_size, fill='#ffffff', weight='bold'))
    cursor += title_size * 1.10

    sub_size = w * c['sub']
    if c['subL'] == 2:
        for ln in ['Réponds au quiz et tente de gagner', 'tes places pour le concert de ce soir.']:
            s.append(text(cx, cursor + sub_size * 0.85, ln, sub_size, fill='#c8d2f0'))
            cursor += sub_size * 1.45
    elif c['subL'] == 1:
        s.append(text(cx, cursor + sub_size * 0.85, 'Réponds au quiz, gagne tes places du soir.', sub_size, fill='#c8d2f0'))
        cursor += sub_size * 1.45
    card_top_start = cursor + h * 0.025

    # ── Bas (ancrage) : wordmark, puis bandeau partenaires (Forex) ────────
    wm_size = w * c['wm']
    wm_baseline = h * c['wm_bottom']
    s.append(wordmark_centered(cx, wm_baseline, wm_size))

    if c['band']:
        n = 6
        gap = w * 0.018
        margin = w * 0.055
        slot_w = (w - margin * 2 - gap * (n - 1)) / n
        slot_h = h * 0.075
        band_bottom = wm_baseline - wm_size - h * 0.030
        band_top = band_bottom - slot_h
        s.append(text(cx, band_top - h * 0.018, 'NOS PARTENAIRES', w * 0.017, fill=TEAL, weight='bold', ls=2))
        for i in range(n):
            sx = margin + i * (slot_w + gap)
            s.append('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="#ffffff" fill-opacity="0.07" '
                     'stroke="%s" stroke-opacity="0.5" stroke-dasharray="4 4"/>'
                     % (sx, band_top, slot_w, slot_h, slot_w * 0.10, BLEU))
            s.append(text(sx + slot_w / 2.0, band_top + slot_h / 2.0 + w * 0.007,
                          'Votre logo ici', w * 0.0125, fill='#9fb0d8'))
        ceiling = band_top - h * 0.045
    else:
        ceiling = wm_baseline - wm_size * 1.4

    # ── QR auto-dimensionné pour tenir entre le texte et le plafond ───────
    qr_size = w * c['qr']
    avail = ceiling - card_top_start
    need = qr_size * 1.47          # carte (1.22) + label_gap (0.05) + label (0.20)
    if need > avail:
        qr_size = max(w * 0.18, avail / 1.47)
        need = qr_size * 1.47
    card_top = card_top_start + max(0.0, (avail - need) * 0.5)   # centré dans l'espace restant
    pad = qr_size * 0.11
    card = qr_size + pad * 2
    s.append('<rect x="%g" y="%g" width="%g" height="%g" rx="%g" fill="#ffffff"/>'
             % (cx - card / 2.0, card_top, card, card, qr_size * 0.10))
    s.append('<image x="%g" y="%g" width="%g" height="%g" href="%s"/>'
             % (cx - qr_size / 2.0, card_top + pad, qr_size, qr_size, qr_data_uri(URL_SOCIAL)))
    s.append(text(cx, card_top + card + qr_size * 0.05 + qr_size * 0.20 * 0.78,
                  'Scanne-moi', qr_size * 0.135, fill='#ffffff', weight='bold'))

    s.append('</svg>')
    return ''.join(s)


def main():
    produced = []
    specs = [('carre', 1080, 1080, 'carre_1080x1080.png'),
             ('story', 1080, 1920, 'story_1080x1920.png'),
             ('forex', 700, 700, 'forex_700x700.png')]
    for variant, w, h, fname in specs:
        svg = build_visual(variant, w, h)
        out = os.path.join(OUT_VIS, fname)
        cairosvg.svg2png(bytestring=svg.encode('utf-8'), output_width=w, output_height=h, write_to=out)
        produced.append(out)
        if variant == 'forex':
            pdf = os.path.join(OUT_VIS, 'forex_700x700_print.pdf')
            cairosvg.svg2pdf(bytestring=svg.encode('utf-8'), write_to=pdf)
            produced.append(pdf)

    for ev_id, label in STATIONS:
        qr = segno.make(URL_EV + ev_id, error='m')
        out = os.path.join(OUT_QR, 'qr_' + ev_id.replace('ev-nds-', '') + '.png')
        qr.save(out, kind='png', scale=16, border=3, dark=NAVY, light='#ffffff')
        produced.append(out)

    print('Généré %d fichiers :' % len(produced))
    for p in produced:
        print('  ' + os.path.relpath(p, ROOT))


if __name__ == '__main__':
    main()
