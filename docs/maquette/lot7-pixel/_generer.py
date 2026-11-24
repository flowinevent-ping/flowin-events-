# Genere les maquettes du lot 7 (charte claire Flowin), deux directions : A sobre-arcade, B audacieuse.
# Aucun personnage ni mascotte : formes, envahisseurs geometriques, pieces, etoiles, coeurs, coffres, jauges, pixels.
# Maquette seulement. Lancer : python3 _generer.py puis python3 _captures.py
import os
from _sprites import sprite as sp, stars_uri, qr
from _extra import band, burst, onde, wheel2

D = os.path.dirname(os.path.abspath(__file__))
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">'
open(f'{D}/lot7.css', 'w').write(open(f'{D}/_css.css').read().replace('__STARS__', stars_uri()) + open(f'{D}/_css2.css').read())

def page(titre, lead, corps, note=''):
    n = ('<div class="note">' + note + '</div>') if note else ''
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{titre}</title>{FONTS}<link rel="stylesheet" href="lot7.css"></head><body><div class="page" id="page">'
            f'<h1>{titre}</h1><p class="lead">{lead}</p>{corps}{n}</div></body></html>')

def col(png, titre, txt, ecran):
    marque = 'data-png="' + png + '" '
    ecran = ecran.replace('class="tel', marque + 'class="tel', 1) if 'class="tel' in ecran else ecran.replace('class="pro"', marque + 'class="pro"', 1)
    return '<div class="col"><div class="cap"><b>' + titre + '</b>' + txt + '</div>' + ecran + '</div>'

ACC = '--a:#BE123C;--a2:#9F1239;--al:#FFF1F2;--ab:#FECDD3'   # exemple : logo de commerce rouge framboise

def tel(v, inner, style="", h=92):
    st = f' style="{style}"' if style else ''
    return f'<div class="tel t{v}"{st}>{band(h, force=1.0)}{inner}</div>'

BANDH = 92

# ---------- briques ----------
def cartouche(nom='NOOK CAFÉ'):
    return f'<div class="cart"><div class="logo">{sp("cup", 3, False)}</div><div class="nom">{nom}<small>Logo du commerce</small></div></div>'
def son():
    return f'<div class="snd" role="button" aria-label="Couper le son">{sp("son", 4, False)}</div>'
def entete():
    return f'<div class="top">{cartouche()}{son()}</div>'
def vies(n, tot=3, s=3):
    return f'<div class="vies" aria-label="{n} vies sur {tot}">' + ''.join(sp('heart' if i < n else 'heartv', s) for i in range(tot)) + '</div>'
def prog(done, cur, tot=5):
    cases = ''.join('<i class="ok"></i>' if i < done else ('<i class="cur"></i>' if i == cur else '<i></i>') for i in range(tot))
    return f'<div class="prog">{cases}<span>{cur + 1}/{tot}</span></div>'
def chrono(pct, sec):
    n = 15; on = round(n * pct / 100)
    cl = 'v' if pct > 60 else ('j' if pct > 30 else 'r')
    return f'<div class="chrono" role="img" aria-label="{sec} secondes restantes">' + ''.join(f'<i class="{cl if i < on else ""}"></i>' for i in range(n)) + f'<b>{sec:02d} s</b></div>'
def hud(v, nv, score, done, cur, pct, sec):
    if v == 'A':
        sc = f'<div class="score"><small>SCORE</small><b>{score:04d}</b></div>'
        top = f'<div class="hud">{vies(nv)}{sc}</div>'
    else:
        top = f'<div class="hud">{vies(nv, 3, 4)}<div class="plate"><small>SCORE</small>{score:04d}</div></div>'
    return top + prog(done, cur) + chrono(pct, sec)

QPLAIN = 'Quelle boisson se prépare avec du lait mousseux ?'
def qtexte(typed=1.0):
    if typed >= 1:
        return 'Quelle boisson se prépare avec du <span class="k">lait mousseux</span> ?'
    return QPLAIN[:int(len(QPLAIN) * typed)] + '<i class="cur"></i>'
REPS = [('A', 'Espresso'), ('B', 'Cappuccino'), ('C', 'Ristretto'), ('D', 'Americano')]
GLY = {'A': 'f_carre', 'B': 'f_rond', 'C': 'f_tri', 'D': 'f_los'}

def qbox(v, tag, tagc, typed=1.0, extra='', style=''):
    contenu = f'<span class="tag {tagc}" style="margin-bottom:12px">{tag}</span><br>{qtexte(typed)}{extra}'
    if v == 'A':
        return f'<div class="q box" style="position:relative;{style}">{contenu}</div>'
    return f'<div class="stpw" style="margin-top:18px;position:relative"><div class="stp" style="{style}"><div class="in q" style="margin-top:0">{contenu}</div></div></div>'

def reps(v, etats, vis=4, bursts=None, press=None):
    out = []
    for k, ((l, t), e) in enumerate(zip(REPS, etats)):
        hid = ' hid' if k >= vis else ''
        pc = ' press' if press == k else ''
        pts = bursts[k] if bursts and k in bursts else ''
        if v == 'A':
            ic = {'ok': sp('coche', 4, False), 'ko': sp('croix', 4, False)}.get(e, '')
            out.append(f'<div class="rep {e}{hid}{pc}" style="--i:{k}" role="button"><span class="l">{l}</span><span class="t">{t}</span>{ic}{pts}</div>')
        else:
            ic = {'ok': sp('coche_g', 4, False), 'ko': sp('croix', 4, False)}.get(e, sp(GLY[l], 4, False))
            out.append(f'<div class="tile {e}{hid}{pc}" style="--i:{k}" role="button"><div class="stpw"><div class="stp"><div class="in"><div class="gl"><span class="ltr">{l}</span>{ic}</div><div class="nm">{t}</div></div></div></div>{pts}</div>')
    return ('<div class="reps">' if v == 'A' else '<div class="tiles">') + ''.join(out) + '</div>'

def scene(v, etat='idle', colonne=1, y=None):
    s = 4 if v == 'A' else 5
    y = y or (674 if v == 'A' else 690)
    w = 48 if v == 'A' else 56
    ligne = []
    for k in range(5):
        if etat == 'tir' and k == colonne:
            ligne.append(f'<div style="width:{w}px">{sp("boom", s)}</div>')
        else:
            nom = ('inv1', 'inv2', 'inv3')[k % 3] if v == 'B' else ('inv1' if k % 2 == 0 else 'inv2')
            ligne.append(f'<div style="width:{w}px">{sp(nom, s)}</div>')
    yy = y + (22 if etat == 'rate' else 0)
    cx = 28 + (334 / 5) * (colonne + .5)
    tir = f'<div class="tir" style="left:{cx - 4:.0f}px;top:{yy + 46}px;height:{778 - yy - 46 - 40}px"></div>' if etat == 'tir' else ''
    return (f'<div class="inv" style="top:{yy}px">{"".join(ligne)}</div>{tir}'
            f'<div class="abs" style="left:{cx - 27:.0f}px;bottom:30px">{sp("ship", 5)}</div><div class="sol"></div>')

# ---------- quiz ----------
def q_depart(v):
    if v == 'A':
        formation = ''.join('<div style="display:flex;justify-content:center;gap:22px;margin-top:14px">' + ''.join(sp(n, 5) for n in ligne) + '</div>' for ligne in (['inv2'] * 4, ['inv1'] * 4, ['inv2'] * 4))
        return tel(v, f'<div class="pad">{entete()}</div><div class="center" style="margin-top:22px"><span class="tag j">Quiz du jour</span></div>'
          f'<div class="big center" style="font-size:36px;margin-top:20px">QUIZ</div><div class="center" style="font-size:19px;font-weight:800;margin-top:12px">5 questions · 3 vies</div>'
          f'<div class="abs" style="left:0;right:0;top:300px">{formation}</div>'
          f'<div class="abs" style="left:16px;right:16px;top:586px"><div class="btn" role="button">Jouer</div></div>'
          f'<div class="abs" style="left:168px;bottom:30px">{sp("ship", 5)}</div><div class="sol"></div>')
    rangs = ''.join('<div style="display:flex;justify-content:center;gap:14px;margin-top:10px">' + ''.join(sp(n, 5) for n in ligne) + '</div>'
                    for ligne in (['inv3', 'inv2', 'inv3', 'inv2', 'inv3'], ['inv2', 'inv1', 'inv2', 'inv1', 'inv2'], ['inv1', 'inv3', 'inv1', 'inv3', 'inv1']))
    return tel(v, f'<div class="pad">{entete()}</div>'
      f'<div class="big center" style="font-size:44px;margin-top:34px;text-shadow:4px 4px 0 var(--ab)">QUIZ</div>'
      f'<div class="center" style="margin-top:16px"><span class="tag j">5 questions · 3 vies</span></div>'
      f'<div class="stpw abs" style="left:24px;right:24px;top:318px"><div class="stp"><div class="in" style="padding:6px 0 16px">{rangs}</div></div></div>'
      f'<div class="abs" style="left:16px;right:16px;top:586px"><div class="btn" role="button">Jouer</div></div>'
      f'<div class="center big blink abs" style="left:0;right:0;top:668px;font-size:13px;color:var(--muted)">APPUYEZ POUR JOUER<i class="cur" style="margin-left:6px"></i></div><div class="sol"></div>')

def q_question(v, vis=4, typed=1.0, etats=None, style=''):
    etats = etats or ['n'] * 4
    return tel(v, f'<div class="pad">{entete()}{hud(v, 3, 200, 1, 1, 80, 12)}{qbox(v, "Question 2", "j", typed)}{reps(v, etats, vis)}</div>' + scene(v), style)

def q_bonne(v, phase=3):
    """phase 0 : appui ; 1 : petit eclatement ; 2 : grand eclatement ; 3 : etat final."""
    rmax = {1: 22, 2: 56, 3: 70}.get(phase, 0)
    pts = ''
    if rmax:
        pts = burst(300 if v == 'A' else 86, 30 if v == 'A' else 58, 24 if phase > 1 else 14, rmax, seed=phase)
    etats = ['dim', 'ok', 'dim', 'dim'] if phase >= 1 else ['n'] * 4
    plus = f'<div class="float" style="right:{34 if v == "A" else 44}px;top:{214 if v == "A" else 246}px">+100</div>' if phase >= 2 else ''
    sc = 300 if phase >= 2 else 200
    return tel(v, f'<div class="pad">{entete()}{hud(v, 3, sc, 2 if phase >= 2 else 1, 1, 80, 12)}{qbox(v, "Bonne réponse" if phase >= 1 else "Question 2", "m" if phase >= 1 else "j")}'
               f'{reps(v, etats, 4, {1: pts}, press=1 if phase == 0 else None)}</div>{plus}' + scene(v, 'tir' if phase >= 2 else 'idle'))

def q_mauvaise(v):
    return tel(v, f'<div class="pad">{entete()}{hud(v, 2, 200, 1, 1, 45, 7)}{qbox(v, "Raté · une vie en moins", "r")}{reps(v, ["ko", "ok", "dim", "dim"])}</div>' + scene(v, 'rate'))

def meter(n):
    return '<div class="meter">' + ''.join(f'<i class="{"on" if k < n else ""}">x{k + 1}</i>' for k in range(3)) + '</div>'

def q_combo(v, n=3):
    g = ''.join(sp('star', 3) for _ in range(min(n, 3)))
    inner = (f'<div style="display:flex;justify-content:center;align-items:center;gap:10px"><span style="display:flex;gap:2px">{g}</span>'
             f'<span class="big" style="font-size:24px"><span class="k">COMBO</span> x{n}</span></div>{meter(n)}'
             f'<div class="center" style="font-size:18px;font-weight:800;color:var(--ok);margin-top:10px">Points x{n} · +{n * 100}</div>')
    ondes = burst(14, 70, 10, 34, seed=3) + burst(344, 70, 10, 34, seed=8) if v == 'B' and n == 3 else ''
    if v == 'A':
        bx = f'<div class="q box" style="text-align:center;border-color:var(--a);padding:14px 12px 14px">{inner}</div>'
    else:
        bx = f'<div class="stpw" style="margin-top:18px;position:relative">{ondes}<div class="stp" style="background:var(--a)"><div class="in q" style="margin-top:0;text-align:center;padding:14px 12px">{inner}</div></div></div>'
    return tel(v, f'<div class="pad">{entete()}{hud(v, 3, 900, 3, 3, 70, 10)}{bx}{reps(v, ["dim", "ok", "dim", "dim"])}</div>' + scene(v, 'tir', 3))

def q_bonus(v):
    deco = f'{sp("candy", 6)}{sp("chest", 8)}{sp("star", 6)}'
    if v == 'A':
        boite = f'<div class="q box" style="margin-top:20px">Un cappuccino se prépare avec du <span class="k">lait</span> ?</div>'
        btn = '<div style="display:flex;gap:12px;margin-top:16px"><div class="rep" style="justify-content:center;font-size:20px">Vrai</div><div class="rep" style="justify-content:center;font-size:20px">Faux</div></div>'
    else:
        boite = '<div class="stpw" style="margin-top:20px"><div class="stp"><div class="in q" style="margin-top:0">Un cappuccino se prépare avec du <span class="k">lait</span> ?</div></div></div>'
        btn = ('<div class="tiles"><div class="tile"><div class="stpw"><div class="stp"><div class="in"><div class="gl"><span class="ltr">V</span>' + sp('f_rond', 4, False) + '</div><div class="nm">Vrai</div></div></div></div></div>'
               '<div class="tile"><div class="stpw"><div class="stp"><div class="in"><div class="gl"><span class="ltr">F</span>' + sp('f_carre', 4, False) + '</div><div class="nm">Faux</div></div></div></div></div></div>')
    return tel(v, f'<div class="pad">{entete()}<div class="center" style="margin-top:20px"><span class="tag j">Niveau bonus</span></div>'
               f'<div class="center big" style="font-size:20px;margin-top:18px">1 TICKET<br><span class="k">À GAGNER</span></div>'
               f'<div style="display:flex;justify-content:center;gap:26px;align-items:flex-end;margin-top:18px;position:relative">{deco}{burst(195, 70, 16, 120, seed=5) if v == "B" else ""}</div>{boite}{btn}</div>'
               f'<div class="abs" style="left:168px;bottom:30px">{sp("ship", 5)}</div><div class="sol"></div>')

def q_fin(v):
    lignes = [('1', 'ZOE', '1200'), ('2', 'VOUS', '0900'), ('3', 'MAX', '0700')]
    coin = f'<div class="coin-line blink" style="margin-top:20px">{sp("coin", 4)}INSERT COIN</div>'
    if v == 'A':
        t = ''.join(f'<tr class="{"me" if n == "VOUS" else ""}"><td>{r}.</td><td>{n}</td><td>{s}</td></tr>' for r, n, s in lignes)
        corps = (f'<div class="big center" style="font-size:24px;margin-top:12px">FIN DU <span class="k">QUIZ</span></div>'
                 f'<div class="box center" style="margin:18px 16px 0;padding:14px"><div style="font-size:15px;color:var(--muted);font-weight:800">VOTRE SCORE</div><div class="big" style="font-size:36px;margin-top:8px;color:var(--a)">0900</div>'
                 f'<div style="display:flex;justify-content:center;gap:8px;margin-top:10px">{sp("coin", 4)}{sp("coin", 4)}{sp("coin", 4)}{sp("coin", 4)}{sp("coin", 4)}</div></div>'
                 f'<div class="box" style="margin:16px 16px 0;padding:12px 14px"><div class="px" style="font-size:13px;color:var(--a)">HIGH SCORE <span style="color:var(--muted);font-family:inherit;font-size:13px;font-weight:700">exemple</span></div><table class="hs">{t}</table></div>{coin}'
                 f'<div class="center" style="font-size:16px;font-weight:700;color:var(--muted);margin-top:8px">Prochain quiz : demain</div>')
    else:
        corps = (f'<div class="big center" style="font-size:22px;margin-top:10px">FIN DU <span class="k">QUIZ</span></div>'
                 f'<div class="stpw" style="margin:16px 16px 0"><div class="stp" style="background:var(--a)"><div class="in center" style="padding:14px 8px 14px;position:relative">{burst(60, 40, 8, 40, seed=2)}{burst(310, 40, 8, 40, seed=4)}'
                 f'<div style="font-size:14px;font-weight:800;color:var(--muted)">VOTRE SCORE</div><div class="big" style="font-size:42px;margin-top:8px;color:var(--a)">0900</div>'
                 f'<div style="display:flex;justify-content:center;gap:8px;margin-top:10px">{sp("star", 4)}{sp("star", 5)}{sp("star", 4)}</div></div></div></div>'
                 f'<div class="px" style="font-size:13px;margin:18px 16px 0;color:var(--a)">HIGH SCORE <span style="color:var(--muted);font-family:inherit;font-weight:700">exemple</span></div>'
                 f'<div class="podium" style="margin:8px 16px 0"><div class="me" style="height:84px">2<br><small>VOUS 0900</small></div><div style="height:110px">1<br><small>ZOE 1200</small></div><div style="height:64px">3<br><small>MAX 0700</small></div></div>'
                 f'<div class="slot"><div class="fente"><i></i></div><div class="blink" style="display:flex;gap:10px;align-items:center;font-family:var(--pix);font-size:15px;color:var(--a)">{sp("coin", 4)}INSERT COIN</div></div>'
                 f'<div class="center" style="font-size:16px;font-weight:700;color:var(--muted);margin-top:8px">Prochain quiz : demain</div>')
    return tel(v, f'<div class="pad">{entete()}</div>{corps}<div style="position:absolute;left:16px;right:16px;top:716px"><div class="btn" role="button">Continuer</div></div><div class="sol"></div>')

# ---------- roue ----------
def r_ecran(v, rot, bas, titre='TOURNE LA <span class="k">ROUE</span>', lit=None, extra=''):
    fs = 17 if v == 'A' else 20
    rays = '<div class="rays" style="top:104px"></div>' if v == 'B' else ''
    ps = 6 if v == 'A' else 8
    return tel(v, f'<div class="pad">{entete()}</div><div class="big center" style="font-size:{fs}px;margin-top:6px">{titre}</div>{rays}'
               f'<div style="position:relative;margin-top:{26 if v == "A" else 30}px"><div class="pointer" style="top:-{22 if v == "A" else 30}px">{sp("aiguille", ps)}</div>{wheel2(rot, lit, v)}{extra}</div>' + bas)

def legende():
    return f'<div class="leg"><span class="tag">{sp("coin", 3, False)} Lot</span><span class="tag">{sp("croix", 3, False)} Perdu</span><span class="tag">{sp("ticket", 3, False)} Ticket</span></div>'

def r_pret(v, style=''):
    bas = (legende() + f'<div class="box" style="margin:14px 16px 0;padding:10px 14px;font-size:17px;font-weight:800;line-height:1.3"><span class="tag j" style="margin-bottom:8px">Lot du jour</span><br>Un café offert pour un bagel acheté</div>'
           f'<div style="position:absolute;left:16px;right:16px;top:752px"><div class="btn" role="button">Lancer la roue</div></div>')
    h = r_ecran(v, 0, bas)
    return h.replace('class="tel', 'style="' + style + '" class="tel', 1) if style else h

def r_tourne(v, lit=None, rot=-57):
    bas = (legende() + f'<div class="center big" style="margin-top:18px;font-size:14px;color:var(--a)">ÇA TOURNE...</div>'
           f'<div style="position:absolute;left:16px;right:16px;top:752px"><div class="btn ghost" role="button" aria-disabled="true">Lancer la roue</div></div>')
    return r_ecran(v, rot, bas, lit=lit)

def feuille(v, titre, texte, btn, petit, pts=''):
    return f'<div class="sheet">{pts}<h2>{titre}</h2><p>{texte}</p><div class="sm">{petit}</div><div style="margin-top:16px">{btn}</div></div>'

def r_res(v, kind):
    rot = {'lot': -22.5, 'perdu': -67.5, 'ticket': -112.5}[kind]
    lit = None
    pts = burst(195, -26, 18, 56, seed=9) if kind != 'perdu' else ''
    if kind == 'lot':
        f = feuille(v, '<span style="color:var(--ok)">GAGNÉ !</span>', 'Un café offert pour un bagel acheté', '<div class="btn" role="button">Voir mon ticket</div>', sp('ticket', 4) + 'Rangé dans Mes lots', pts)
        t = '<span class="k">LOT</span> GAGNÉ'
    elif kind == 'perdu':
        f = feuille(v, 'PERDU', 'Pas de lot cette fois.', '<div class="btn sec" role="button">Continuer</div>', sp('croix', 4) + 'Merci d’avoir joué')
        t = 'PAS DE <span class="k">CHANCE</span>'
    else:
        f = feuille(v, '<span style="color:var(--bleu)">TICKET !</span>', '1 ticket pour le prochain tirage', '<div class="btn" role="button">Mes tickets</div>', sp('ticket', 4) + 'Gardé dans votre profil', pts)
        t = '<span class="k">TICKET</span> GAGNÉ'
    return r_ecran(v, rot, f, t, lit=lit)

def t_ticket(v, pct=100):
    conf = ''.join(f'<div class="conf" style="left:{x}px;top:{y}px;background:{c}"></div>' for x, y, c in
                   ((24, 120, '#F5B82E'), (350, 150, '#3B5CC4'), (60, 580, '#E8872F'), (330, 600, '#15803D'), (40, 330, '#3B5CC4'), (352, 380, '#F5B82E'), (300, 110, '#E8872F'), (20, 220, '#15803D'), (360, 270, '#E8872F')))
    cut = f' style="clip-path:inset(0 0 {100 - pct}% 0);animation:none"' if pct < 100 else ''
    tete = f'<div class="bt"><div class="bl">{sp("cup", 3, False)}</div><div class="bm"><small>Votre lot chez</small><b>Nook Café</b></div><span class="bv">1 ticket</span></div>'
    corps = (f'<div class="bc"><div class="lot">Un café offert pour un bagel acheté</div><span class="cs">{sp("coche", 2, False)} Sans limite de validité</span></div>'
             f'<div class="perf"></div><div class="qr">{qr()}<div style="font-size:15px;font-weight:800;line-height:1.35">À montrer en caisse<br><span style="font-weight:600;color:var(--muted)">QR : exemple<br>Code : [à générer]</span></div></div>')
    if v == 'A':
        tk = f'<div class="tk"{cut}>{tete}{corps}</div>'
    else:
        cs_ = f';clip-path:inset(0 0 {100 - pct}% 0);animation:none' if pct < 100 else ''
        tk = f'<div class="stpw" style="margin:20px 22px 0"><div class="stp" style="background:var(--a)"><div class="in tk" style="margin:0;border:0;box-shadow:none;background:#fff{cs_}">{tete}{corps}</div></div></div>'
    fente = f'<div class="abs" style="left:14px;right:14px;top:126px;height:10px;background:var(--ink);z-index:3"></div>' if v == 'B' else ''
    return tel(v, f'{conf}<div class="pad">{entete()}</div>'
               f'<div style="display:flex;justify-content:center;align-items:center;gap:14px;margin-top:8px">{sp("star", 4)}<span class="big" style="font-size:17px">TICKET <span class="k">GAGNÉ</span></span>{sp("star", 4)}</div>{fente}{tk}'
               f'<div style="position:absolute;left:16px;right:16px;top:640px;display:flex;flex-direction:column;gap:12px"><div class="btn" role="button">Mes lots</div><div class="btn sec" role="button" style="font-size:16px">En faire profiter un ami</div></div>')

# ---------- choix du style (pro) ----------
def cls_apercu():
    return ('<div class="cls"><div class="lg"><i>' + sp('cup', 3, False) + '</i>Nook Café</div><div class="pb"><b></b></div>'
            '<div class="qq">Quelle boisson se prépare avec du lait mousseux ?</div><span class="aa">Espresso</span><span class="aa">Cappuccino</span><span class="aa">Ristretto</span><span class="aa">Americano</span></div>')

def choix(actif, toast):
    coche = '<svg width=16 height=16 viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg>'
    def carte(cle, nom, desc, ap):
        on = actif == cle
        return (f'<div class="cc {"on" if on else ""}" role="radio" aria-checked="{"true" if on else "false"}"><div class="thumb"><div>{ap}</div></div>'
                f'<div style="flex:1"><div class="nm">{nom}</div><div class="ds">{desc}</div></div><span class="rd">{coche if on else ""}</span></div>')
    t = ('<div class="toast"><svg width=22 height=22 viewBox="0 0 24 24" fill="none" stroke="#5CE6A8" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L19 7"/></svg>Style enregistré. Il s’applique au quiz et à la roue.</div>' if toast else '')
    return (f'<div class="pro"><div style="padding:16px"><div style="font-size:14px;color:#3B5CC4;font-weight:700">Mon jeu</div><h2 style="margin-top:4px">Style du jeu</h2><div class="sub">Quiz et roue. Un toucher suffit.</div>'
            f'<div style="display:flex;flex-direction:column;gap:14px;margin-top:18px">'
            + carte('classique', 'Classique', 'Le style Flowin, sobre et clair.', cls_apercu())
            + carte('pixel', 'Pixel', 'Envahisseurs, pièces et sons 8 bits. Le joueur peut couper le son.', q_question('A'))
            + '</div><div style="margin-top:14px;font-size:14px;color:#4A5F7A;line-height:1.4">Votre logo et vos couleurs restent dans les deux styles. Changeable à tout moment.</div></div>' + t + '</div>')

# ---------- pages ----------
def row(cols): return '<div class="row">' + ''.join(cols) + '</div>'

def page_quiz(v, nom, titre, lead):
    c = [col(f'lot7-{v}-quiz-1-depart', '1. Départ', 'Titre pixel, formation d’envahisseurs, bouton pastille.', q_depart(v)),
         col(f'lot7-{v}-quiz-2-question', '2. Question', 'Texte tapé avec curseur, réponses qui entrent en cascade, jauges.', q_question(v)),
         col(f'lot7-{v}-quiz-3-bonne', '3. Bonne réponse', 'Éclatement de pixels sur la bonne case, tir, +100.', q_bonne(v)),
         col(f'lot7-{v}-quiz-4-mauvaise', '4. Mauvaise réponse', 'Croix en plus du rouge, une vie en moins, la bonne réponse montrée, la rangée descend.', q_mauvaise(v)),
         col(f'lot7-{v}-quiz-5-combo', '5. Série COMBO x3', 'Jauge de combo qui monte x1, x2, x3.', q_combo(v)),
         col(f'lot7-{v}-quiz-6-bonus', '6. Écran bonus', '1 ticket bonus. Bonbon, coffre, étoile (inspiration gourmande, aucune marque).', q_bonus(v)),
         col(f'lot7-{v}-quiz-7-fin', '7. Fin : score arcade', 'HIGH SCORE (exemple) et INSERT COIN clignotant.', q_fin(v))]
    if v == 'A':
        c.append(col('lot7-A-quiz-8-accent-commerce', '8. Accent du commerce', 'Logo à dominante rouge framboise : tout l’accent suit (exemple).', q_question('A', style=ACC)))
    return page(titre, lead, row(c))

def page_roue(v, titre, lead):
    c = [col(f'lot7-{v}-roue-1-pret', '1. Roue prête', 'Roue en pixels, aiguille, légende icône + mot, lot du jour.', r_pret(v)),
         col(f'lot7-{v}-roue-2-tourne', '2. La roue tourne', 'Les cases s’allument une à une pendant la rotation.', r_tourne(v, lit=[6, 7, 0] if v == 'B' else None)),
         col(f'lot7-{v}-roue-3-lot', '3. Résultat : lot immédiat', 'Case gagnante allumée, éclatement de pixels.', r_res(v, 'lot')),
         col(f'lot7-{v}-roue-4-perdu', '4. Résultat : perdu', 'Message court.', r_res(v, 'perdu')),
         col(f'lot7-{v}-roue-5-ticket', '5. Résultat : case ticket', '1 ticket pour le prochain tirage (case autorisée, décision du 24/11).', r_res(v, 'ticket')),
         col(f'lot7-{v}-roue-6-ticket-gagne', '6. Ticket gagné', 'Ticket imprimé pixel par pixel (en-tête logo, perforation, QR exemple).', t_ticket(v))]
    if v == 'A':
        c.append(col('lot7-A-roue-7-accent-commerce', '7. Accent du commerce', 'Roue aux couleurs d’un commerce (exemple).', r_pret('A', ACC)))
    return page(titre, lead, row(c))

def frame(ecran, label):
    return f'<div><div class="fr"><div class="fi">{ecran}</div></div><div class="fr-l">{label}</div></div>'

def strip(png, titre, desc, frames):
    return (f'<div class="sq-t">{titre}</div><div class="sq-d">{desc}</div>'
            f'<div class="strip" data-png="{png}">' + ''.join(frame(e, l) for e, l in frames) + '</div>')

def page_seq():
    s1 = strip('lot7-5-seq-1-cascade', '1. Entrée en cascade', 'La question se tape avec un curseur, puis les réponses glissent une à une (0,12 s d’écart, par paliers).',
               [(q_question('A', 0, .35), '0,3 s : texte tapé'), (q_question('A', 1), '0,8 s : réponse A'), (q_question('A', 2), '0,9 s : A, B'), (q_question('A', 4), '1,2 s : prêt à jouer')])
    s2 = strip('lot7-5-seq-2-eclatement', '2. Éclatement de pixels sur la bonne réponse', 'Appui, puis des carrés de 4 et 8 px partent de la case, le score passe de 0200 à 0300 et +100 monte.',
               [(q_bonne('A', 0), 'Appui'), (q_bonne('A', 1), '0,2 s : étincelles'), (q_bonne('A', 2), '0,4 s : éclatement + tir'), (q_bonne('A', 3), '0,8 s : état final')])
    s3 = strip('lot7-5-seq-3-combo', '3. Le combo qui monte', 'La jauge s’allume case par case ; à x3 la direction B ajoute des ondes carrées.',
               [(q_combo('A', 1), 'x1'), (q_combo('A', 2), 'x2'), (q_combo('A', 3), 'x3'), (q_combo('B', 3), 'x3, direction B')])
    s4 = strip('lot7-5-seq-4-roue', '4. La roue qui s’illumine case par case', 'Pendant la rotation chaque case passe à la couleur pleine au passage de l’aiguille, les autres s’éteignent. Tick sonore à chaque case.',
               [(r_tourne('B', [6], -135), 'case 7'), (r_tourne('B', [6, 7], -90), 'cases 7 et 8'), (r_tourne('B', [7, 0], -45), 'cases 8 et 1'), (r_res('B', 'lot'), 'arrêt : case 1')])
    s5 = strip('lot7-5-seq-5-ticket', '5. Le ticket qui s’imprime pixel par pixel', 'Le ticket sort d’une fente, ligne par ligne (12 paliers en 2,4 s). Son : tick de roue en boucle courte.',
               [(t_ticket('B', 25), '25 %'), (t_ticket('B', 50), '50 %'), (t_ticket('B', 75), '75 %'), (t_ticket('B', 100), 'imprimé')])
    return page('Lot 7 : séquences d’états (mouvement par paliers)', 'Les maquettes HTML jouent ces animations quand le mouvement n’est pas réduit ; avec « mouvement réduit », seul l’état final s’affiche. Toutes en steps(), jamais lissées.',
                s1 + s2 + s3 + s4 + s5)

def page_choix():
    c = [col('lot7-3-choix-1-classique', 'A. Classique actif', 'Écran du pro dans la charte Flowin. Deux cartes, un toucher.', choix('classique', False)),
         col('lot7-3-choix-2-pixel', 'B. Après un toucher sur Pixel', 'Appliqué tout de suite, confirmation, rien à valider.', choix('pixel', True))]
    return page('Lot 7 : choix du style pour le pro (390 px)', 'À placer dans le configurateur, volet « Jeu » (lot 3-4). Défaut : Classique. La vignette Pixel montre la direction retenue (ici A).', row(c))

def page_planche():
    def sw(h, nom, role): return f'<div><i style="background:{h}"></i><span><b>{nom}</b> {h}<br>{role}</span></div>'
    pal = ''.join([sw('#B5471E', 'Orange Flowin', 'accent par défaut'), sw('#D2631F', 'Orange 2', 'fin du dégradé'), sw('#E8872F', 'Orange clair', 'case Lot, tramage'),
                   sw('#3B5CC4', 'Bleu animation', 'envahisseurs, case Ticket'), sw('#1B3A5C', 'Encre', 'texte, contours'), sw('#15803D', 'Vert OK', 'bonne réponse'),
                   sw('#C2410C', 'Rouge Flowin', 'mauvaise réponse'), sw('#DC2626', 'Rouge vie', 'coeurs, croix (à valider)'), sw('#F5B82E', 'Jaune', 'pièces, lampes'),
                   sw('#FFF4EA', 'Orange pâle', 'bandeaux, étiquettes'), sw('#E3E9F8', 'Bleu pâle', 'case Perdu'), sw('#FFFDFA', 'Fond', 'étoiles #F3D3BC, #C9D5F5')])
    spr = '<div class="demo" style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;width:480px">' + ''.join(sp(n, 6) for n in ('inv1', 'inv2', 'inv3', 'ship', 'boom', 'coin', 'heart', 'heartv', 'star', 'ticket', 'cup', 'candy', 'chest', 'croix', 'f_carre', 'f_rond', 'f_tri', 'f_los')) + '</div>'
    corps = (f'<div class="part"><h2>Palette (charte Flowin, rien de violet)</h2><div class="sw">{pal}</div></div>'
             f'<div class="part"><h2>Sprites : formes et envahisseurs géométriques, pas de personnage</h2>{spr}</div>'
             f'<div class="part"><h2>Détails communs</h2><div class="demo" style="width:700px;font-size:16px;line-height:1.5"><b>Tramage (dithering de Bayer 4 x 4)</b> en bandeau d’en-tête et en rayons derrière la roue. <b>Lignes de balayage</b> : 2 px sur 4, 3,5 % d’opacité. <b>Ombre dure</b> 4 px. <b>Coins en escalier</b> (direction B). <b>Curseur</b> carré qui clignote.</div></div>')
    return page('Lot 7 : planche de style pixel, charte Flowin', 'Grille 4 px. Contour 2 px (4 px en B), ombre dure 4 px sans flou. Police pixel pour les titres et les chiffres de score seulement.', corps)

old = open(f'{D}/variante-sombre/_generer.py').read()
a = old.index("SONS_HTML = r'''") + len("SONS_HTML = r'''")
SONS_HTML = old[a:old.index("'''", a)].replace('__FONTS__', FONTS)

def ecrire(nom, html):
    open(f'{D}/{nom}', 'w').write(html)

ecrire('lot7-0-style.html', page_planche())
ecrire('lot7-A-quiz.html', page_quiz('A', 'x', 'Lot 7, direction A (sobre-arcade) : quiz (390 px)', 'Cartes blanches, contour 2 px, envahisseurs sur fond clair. Textes et scores marqués exemple.'))
ecrire('lot7-A-roue.html', page_roue('A', 'Lot 7, direction A (sobre-arcade) : roue et ticket (390 px)', 'Roue de 315 px, cases lisibles par icône et légende.'))
ecrire('lot7-B-quiz.html', page_quiz('B', 'x', 'Lot 7, direction B (audacieuse) : quiz (390 px)', 'Coins en escalier, bandeau tramé orange, réponses en grandes tuiles à forme, plaque de score, podium arcade.'))
ecrire('lot7-B-roue.html', page_roue('B', 'Lot 7, direction B (audacieuse) : roue et ticket (390 px)', 'Rayons tramés derrière la roue, cases à motifs (pleine, rayée, damier), lampes, ticket imprimé en escalier.'))
ecrire('lot7-5-sequences.html', page_seq())
ecrire('lot7-3-choix-style.html', page_choix())
ecrire('lot7-4-sons.html', SONS_HTML)
print('ok')
