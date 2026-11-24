# Genere les maquettes HTML du lot 7 (pixel arcade). Lancer : python3 _generer.py puis python3 _captures.py
# Maquette seulement : aucun code applicatif. Donnees marquees "exemple" fictives.
import os
from _sprites import sprite as sp, wheel, stars_uri, qr

D = os.path.dirname(os.path.abspath(__file__))
FONTS = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Silkscreen:wght@400;700&display=swap" rel="stylesheet">'
open(f'{D}/lot7.css', 'w').write(open(f'{D}/_css.css').read().replace('__STARS__', stars_uri()))

def page(titre, lead, corps, note=''):
    return (f'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'
            f'<title>{titre}</title>{FONTS}<link rel="stylesheet" href="lot7.css"></head><body><div class="page" id="page">'
            f'<h1>{titre}</h1><p class="lead">{lead}</p>{corps}{("<div class=note>" + note + "</div>") if note else ""}</div></body></html>')

def col(png, titre, txt, ecran):
    marque = 'data-png="' + png + '" '
    if 'class="tel' in ecran:
        ecran = ecran.replace('class="tel', marque + 'class="tel', 1)
    else:
        ecran = ecran.replace('class="pro"', marque + 'class="pro"', 1)
    return '<div class="col"><div class="cap"><b>' + titre + '</b>' + txt + '</div>' + ecran + '</div>'

# ---------- briques ----------
def cartouche(nom='NOOK CAFE'):
    return (f'<div class="cart"><div class="logo">{sp("cup", 3, False)}</div><div class="nom">{nom}<small>logo du commerce</small></div></div>')
def son(muet=False):
    return f'<div class="snd" role="button" aria-label="{"Remettre le son" if muet else "Couper le son"}">{sp("muet" if muet else "son", 4, False)}</div>'
def entete(muet=False):
    return f'<div class="top">{cartouche()}{son(muet)}</div>'
def vies(n, tot=3):
    return '<div class="vies" aria-label="%d vies sur %d">' % (n, tot) + ''.join(sp('heart' if i < n else 'heartv', 3) for i in range(tot)) + '</div>'
def prog(done, cur, tot=5):
    cases = ''.join('<i class="ok"></i>' if i < done else ('<i class="cur"></i>' if i == cur else '<i></i>') for i in range(tot))
    return f'<div class="prog">{cases}<span>{cur + 1 if cur is not None else tot}/{tot}</span></div>'
def chrono(pct, sec):
    n = 15; on = round(n * pct / 100)
    cl = 'v' if pct > 60 else ('j' if pct > 30 else 'r')
    return '<div class="chrono" role="img" aria-label="%d secondes restantes">' % sec + ''.join(f'<i class="{cl if i < on else ""}"></i>' for i in range(n)) + f'<b>{sec:02d} S</b></div>'
def hud(v, score, done, cur, pct, sec, mult=''):
    return (f'<div class="hud">{vies(v)}<div class="score"><small>SCORE</small>{score:04d}{mult}</div></div>{prog(done, cur)}{chrono(pct, sec)}')
def rep(l, txt, etat='n'):
    ic = {'ok': sp('coche', 4, False), 'ko': sp('croix', 4, False)}.get(etat, '')
    return f'<div class="rep {etat}" role="button"><span class="l">{l}</span><span class="t">{txt}</span>{ic}</div>'
def sol(hero=True, coins=2):
    c = ''.join(f'<div class="bob">{sp("coin", 4)}</div>' for _ in range(coins))
    return f'<div class="scene"><div>{sp("hero", 6) if hero else ""}</div><div style="display:flex;gap:14px;padding-bottom:40px">{c}</div></div><div class="sol"></div>'

QTXT = 'Quelle boisson se prépare avec du <span class="k">lait mousseux</span> ?'
REPS = [('A', 'Espresso'), ('B', 'Cappuccino'), ('C', 'Ristretto'), ('D', 'Americano')]
def reps(etats):
    return '<div class="reps">' + ''.join(rep(l, t, e) for (l, t), e in zip(REPS, etats)) + '</div>'

def tel(inner, extra=''):
    return f'<div class="tel {extra}">{inner}</div>'

# ---------- ecrans quiz ----------
def q_depart(extra=''):
    return tel(f'<div class="pad">{entete()}</div>'
      f'<div class="center" style="margin-top:26px"><span class="tag j">QUIZ DU JOUR</span></div>'
      f'<div class="big center" style="font-size:34px;margin-top:22px">QUIZ<br><span class="k">ARCADE</span></div>'
      f'<div class="box" style="margin:30px 16px 0;padding:14px 16px;font-size:18px;font-weight:700;display:flex;justify-content:space-around;align-items:center">'
      f'<span style="display:flex;gap:8px;align-items:center">{sp("heart", 3)}x3</span><span style="display:flex;gap:8px;align-items:center">{sp("coin", 3)}x5</span><span>15 S</span></div>'
      f'<div style="margin:18px 16px 0;font-size:18px;font-weight:700;text-align:center;color:var(--gris)">5 questions. 3 vies.</div>'
      f'<div style="position:absolute;left:16px;right:16px;top:586px"><div class="btn" role="button">JOUER</div></div>'
      f'<div class="abs" style="left:0;right:0;top:446px;display:flex;justify-content:center">{sp("chest", 8)}</div>' + sol(True, 0), extra)

def q_question(extra=''):
    return tel(f'<div class="pad">{entete()}{hud(3, 200, 1, 1, 80, 12)}<div class="q box"><span class="tag j" style="margin-bottom:12px">QUESTION 2</span><br>{QTXT}</div>{reps(["n"]*4)}</div>' + sol(), extra)

def q_bonne():
    return tel(f'<div class="pad">{entete()}{hud(3, 300, 2, 1, 80, 12)}<div class="q box"><span class="tag m" style="margin-bottom:12px">BONNE REPONSE</span><br>{QTXT}</div>{reps(["dim","ok","dim","dim"])}</div>'
               f'<div class="float" style="right:36px;top:216px">+100</div>' + sol())

def q_mauvaise():
    return tel(f'<div class="pad">{entete()}{hud(2, 200, 1, 1, 45, 7)}<div class="q box shake"><span class="tag r" style="margin-bottom:12px">RATE · -1 VIE</span><br>{QTXT}</div>{reps(["ko","ok","dim","dim"])}</div>'
               f'<div class="abs" style="left:16px;right:16px;top:726px;font-size:16px;font-weight:700;color:var(--gris);text-align:center">La bonne réponse : Cappuccino</div>' + sol(False, 0))

def q_combo():
    return tel(f'<div class="pad">{entete()}{hud(3, 900, 3, 3, 70, 10, "")}'
               f'<div class="q box center" style="border-color:var(--accent);padding:14px 12px 16px">'
               f'<div style="display:flex;justify-content:center;gap:10px;margin-bottom:12px">{sp("star", 4)}{sp("star", 5)}{sp("star", 4)}</div>'
               f'<div class="big" style="font-size:32px"><span class="k">COMBO</span> x3</div>'
               f'<div style="font-size:18px;font-weight:700;color:var(--menthe);margin-top:12px">Points x3 · +300</div></div>{reps(["dim","ok","dim","dim"])}</div>' + sol())

def q_bonus():
    return tel(f'<div class="pad">{entete()}<div class="center" style="margin-top:22px"><span class="tag j blink">NIVEAU BONUS</span></div>'
               f'<div class="center big" style="font-size:20px;margin-top:20px">1 TICKET<br><span class="k">A GAGNER</span></div>'
               f'<div style="display:flex;justify-content:center;margin-top:20px">{sp("chest", 8)}</div>'
               f'<div class="q box" style="margin-top:22px">Un cappuccino se prépare avec du <span class="k">lait</span> ?</div>'
               f'<div style="display:flex;gap:12px;margin-top:16px"><div class="rep" style="justify-content:center;font-family:var(--pix);font-size:16px">VRAI</div><div class="rep" style="justify-content:center;font-family:var(--pix);font-size:16px">FAUX</div></div></div>' + sol(True, 1))

def q_fin():
    lignes = [('1', 'ZOE', '1200'), ('2', 'VOUS', '0900'), ('3', 'MAX', '0700')]
    t = ''.join(f'<tr class="{"me" if n=="VOUS" else ""}"><td>{r}.</td><td>{n}</td><td>{s}</td></tr>' for r, n, s in lignes)
    return tel(f'<div class="pad">{entete()}</div>'
               f'<div class="big center" style="font-size:26px;margin-top:14px">FIN DU<br><span class="k">QUIZ</span></div>'
               f'<div class="box center" style="margin:20px 16px 0;padding:16px"><div style="font-size:15px;color:var(--gris);font-weight:700">VOTRE SCORE</div>'
               f'<div class="big" style="font-size:38px;margin-top:8px;color:var(--accent)">0900</div>'
               f'<div style="display:flex;justify-content:center;gap:8px;margin-top:10px">{sp("coin", 4)}{sp("coin", 4)}{sp("coin", 4)}{sp("coin", 4)}{sp("coin", 4)}</div></div>'
               f'<div class="box" style="margin:16px 16px 0;padding:12px 14px"><div class="big" style="font-size:14px;color:var(--accent)">HIGH SCORE <span style="color:var(--gris);font-family:var(--sil);font-size:13px">exemple</span></div><table class="hs">{t}</table></div>'
               f'<div class="coin-line blink" style="margin-top:22px">{sp("coin", 4)}INSERT COIN</div>'
               f'<div class="center" style="font-size:16px;font-weight:700;color:var(--gris);margin-top:8px">Prochain quiz : demain</div>'
               f'<div style="position:absolute;left:16px;right:16px;top:716px"><div class="btn" role="button">CONTINUER</div></div>')

# ---------- ecrans roue ----------
def r_ecran(rot, corps_bas, fleche=True, titre='TOURNE LA <span class="k">ROUE</span>', muet=False):
    return tel(f'<div class="pad">{entete(muet)}</div><div class="big center" style="font-size:19px;margin-top:6px">{titre}</div>'
               f'<div style="position:relative;margin-top:24px">'
               f'<div class="pointer" style="top:-20px">{sp("aiguille", 6)}</div>{wheel(rot)}</div>' + corps_bas)

def legende():
    return (f'<div class="leg"><span class="tag">{sp("coin", 3, False)} LOT</span><span class="tag">{sp("croix", 3, False)} PERDU</span><span class="tag">{sp("ticket", 3, False)} TICKET</span></div>')

def r_pret():
    bas = (legende() + f'<div class="box" style="margin:14px 16px 0;padding:10px 14px;font-size:16px;font-weight:700;line-height:1.3"><span class="tag j" style="font-size:13px;margin-bottom:8px">LOT DU JOUR</span><br>Un café offert pour un bagel acheté</div>'
           f'<div style="position:absolute;left:16px;right:16px;top:752px"><div class="btn" role="button">LANCER LA ROUE</div></div>')
    return r_ecran(0, bas)

def r_tourne():
    bas = (legende() + f'<div class="center" style="margin-top:16px;font-family:var(--pix);font-size:16px;color:var(--accent)">ÇA TOURNE...</div>'
           f'<div style="position:absolute;left:16px;right:16px;top:752px"><div class="btn ghost" role="button" aria-disabled="true">LANCER LA ROUE</div></div>')
    return r_ecran(-57, bas)

def feuille(titre, texte, btns, extra=''):
    return f'<div class="sheet"><h2>{titre}</h2><p>{texte}</p>{extra}<div style="display:flex;flex-direction:column;gap:12px;margin-top:16px">{btns}</div></div>'

def r_lot():
    f = feuille(f'<span style="color:var(--accent)">GAGNE !</span>', 'Un café offert pour un bagel acheté',
                '<div class="btn" role="button">VOIR MON TICKET</div>',
                f'<div style="display:flex;gap:10px;margin-top:12px;align-items:center">{sp("ticket", 4)}<span style="font-size:16px;font-weight:700;color:var(--gris)">Rangé dans Mes lots</span></div>')
    return r_ecran(-22.5, f, titre='<span class="k">LOT</span> GAGNE')

def r_perdu():
    f = feuille('PERDU', 'Pas de lot cette fois.', '<div class="btn sec" role="button">CONTINUER</div>',
                f'<div style="display:flex;gap:10px;margin-top:12px;align-items:center">{sp("croix", 4)}<span style="font-size:16px;font-weight:700;color:var(--gris)">Merci d’avoir joué</span></div>')
    return r_ecran(-67.5, f, titre='PAS DE <span class="k">CHANCE</span>')

def r_ticket():
    f = feuille(f'<span style="color:var(--menthe)">TICKET !</span>', '1 ticket pour le prochain tirage',
                '<div class="btn" role="button">MES TICKETS</div>',
                f'<div style="display:flex;gap:10px;margin-top:12px;align-items:center">{sp("ticket", 4)}<span style="font-size:16px;font-weight:700;color:var(--gris)">Gardé dans votre profil</span></div>')
    return r_ecran(-112.5, f, titre='<span class="k">TICKET</span> GAGNE')

def t_ticket():
    return tel(f'<div class="pad">{entete()}</div><div class="big center" style="font-size:20px;margin-top:6px">TICKET <span class="k">GAGNE</span></div>'
               f'<div style="margin:22px 22px 0" class="tk"><h3>NOOK CAFE</h3><div class="lot">Un café offert pour un bagel acheté</div><div class="cond">Sans limite de validité</div>'
               f'<div class="perf"></div><div style="display:flex;gap:14px;align-items:center">{qr()}<div style="font-size:15px;font-weight:700;line-height:1.3">À montrer en caisse<br><span style="font-weight:400;color:#2A3566">QR : exemple<br>Code : [à générer]</span></div></div></div>'
               f'<div style="position:absolute;left:16px;right:16px;top:640px;display:flex;flex-direction:column;gap:12px"><div class="btn" role="button">MES LOTS</div><div class="btn ghost" role="button">EN FAIRE PROFITER UN AMI</div></div>'
               f'<div class="abs" style="left:24px;top:608px">{sp("star", 3)}</div>')

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
            + carte('pixel', 'Pixel arcade', 'Jeu rétro, sons 8 bits que le joueur peut couper.', q_question())
            + f'</div><div style="margin-top:14px;font-size:14px;color:#4A5F7A;line-height:1.4">Votre logo reste visible dans les deux styles. Changeable à tout moment.</div></div>{t}</div>')

# ---------- pages ----------
def ensemble_quiz():
    cols = [
        col('lot7-1-quiz-1-depart', '1. Départ', 'Logo du commerce dans le cartouche. Un seul gros bouton.', q_depart()),
        col('lot7-1-quiz-2-question', '2. Question', 'Vies, score, 5 cases à cocher, chrono pixel. Texte révélé lettre à lettre.', q_question()),
        col('lot7-1-quiz-3-bonne', '3. Bonne réponse', 'Case verte avec coche, +100, son de réussite.', q_bonne()),
        col('lot7-1-quiz-4-mauvaise', '4. Mauvaise réponse', 'Case rouge avec croix (pas la couleur seule), une vie en moins, bonne réponse montrée.', q_mauvaise()),
        col('lot7-1-quiz-5-combo', '5. Série COMBO x3', 'Bandeau au centre, points multipliés. Disparaît seul.', q_combo()),
        col('lot7-1-quiz-6-bonus', '6. Écran bonus', '1 ticket bonus à gagner, question courte, deux gros boutons.', q_bonus()),
        col('lot7-1-quiz-7-fin', '7. Fin : score arcade', 'HIGH SCORE (exemple) et INSERT COIN clignotant.', q_fin()),
        col('lot7-1-quiz-8-variante-aubergine', '8. Variante fond aubergine', 'Même écran 2, fond aubergine. Voir LISEZMOI : écartée car violette.', q_question('aub')),
        col('lot7-1-quiz-9-accent-commerce', '9. Accent aux couleurs du commerce', 'L’accent (mots clés, bouton) prend la couleur du commerçant : ici un orange exemple.', q_question().replace('class="tel ', 'style="--accent:#FF9A52" class="tel ', 1)),
    ]
    return page('Lot 7 : quiz pixel arcade (390 px)', 'Variante à part du style Classique. Fond bleu nuit, police pixel, sprites 16 bits, sons 8 bits. Maquette seulement : textes et scores marqués exemple.',
                '<div class="row">' + ''.join(cols) + '</div>')

def ensemble_roue():
    cols = [
        col('lot7-2-roue-1-pret', '1. Roue prête', 'Roue en pixels, aiguille rouge, légende icône + mot, lot du jour.', r_pret()),
        col('lot7-2-roue-2-tourne', '2. La roue tourne', 'Rotation par paliers, un tick par case. Bouton inactif.', r_tourne()),
        col('lot7-2-roue-3-lot', '3. Résultat : lot immédiat', 'Feuille du bas, lot en clair, rangé dans Mes lots.', r_lot()),
        col('lot7-2-roue-4-perdu', '4. Résultat : perdu', 'Message court, pas de blâme.', r_perdu()),
        col('lot7-2-roue-5-ticket', '5. Résultat : case ticket', '1 ticket pour le prochain tirage (case autorisée, décision 24/11).', r_ticket()),
        col('lot7-2-roue-6-ticket-gagne', '6. Écran ticket gagné', 'Ticket crème à perforation, lot, conditions, QR (exemple).', t_ticket()),
    ]
    return page('Lot 7 : roue de la fortune pixel arcade (390 px)', 'La roue est dessinée case par case (grille 7 px). Les icônes restent droites. Les cases ne sont jamais reconnues par la couleur seule : icône et légende.',
                '<div class="row">' + ''.join(cols) + '</div>')

def page_choix():
    cols = [col('lot7-3-choix-1-classique', 'A. Classique actif', 'Écran du pro dans la charte Flowin. Deux cartes, un toucher.', choix('classique', False)),
            col('lot7-3-choix-2-pixel', 'B. Après un toucher sur Pixel arcade', 'Appliqué tout de suite, message de confirmation, rien à valider.', choix('pixel', True))]
    return page('Lot 7 : choix du style pour le pro (390 px)', 'À placer dans le configurateur, volet « Jeu » (lot 3-4), à côté du choix du type de jeu. Défaut : Classique.', '<div class="row">' + ''.join(cols) + '</div>')

def page_planche():
    def sw(h, nom, role, c): return f'<div><i style="background:{h}"></i><span><b>{nom}</b> {h}<br>{role}<br>{c}</span></div>'
    pal = (sw('#0B1230', 'Bleu nuit', 'fond principal', 'teinte 229°, bleu') + sw('#16214F', 'Nuit 2', 'panneaux, réponses', 'crème dessus : 13,6') +
           sw('#24336E', 'Nuit 3', 'cases vides, sol', 'décor, pas de texte') + sw('#05081A', 'Noir pixel', 'contours, ombres dures', '') +
           sw('#F7F1DC', 'Crème', 'texte, contour 2 px', 'sur fond : 16,2') + sw('#FFD23F', 'Jaune', 'accent, mot clé, bouton', 'sur fond : 12,7') +
           sw('#5CE6A8', 'Menthe', 'bonne réponse, ticket', 'sur fond : 11,7') + sw('#FF6B6B', 'Rouge', 'erreur, vie, aiguille', 'sur fond : 6,6') +
           sw('#A9B4E0', 'Gris bleu', 'texte secondaire', 'sur fond : 9,0') + sw('#3B5CC4', 'Bleu Flowin', 'bouton secondaire', 'crème dessus : 5,3') +
           sw('#26122B', 'Aubergine (variante)', 'fond de la référence', 'teinte 283°, violet : écarté'))
    bt = (f'<div class="demo"><div style="width:340px;display:flex;flex-direction:column;gap:14px"><div class="btn">JOUER</div><div class="btn sec">CONTINUER</div><div class="btn ghost">LANCER LA ROUE</div>'
          f'<div><span class="tag">ETIQUETTE</span> <span class="tag m">BONNE</span> <span class="tag r">RATE</span> <span class="tag j">BONUS</span></div>'
          f'{rep("A", "Réponse", "n")}{rep("B", "Bonne réponse", "ok")}{rep("C", "Mauvaise réponse", "ko")}</div></div>')
    jauges = (f'<div class="demo"><div style="width:340px"><div class="hud" style="margin-top:0">{vies(2)}<div class="score"><small>SCORE</small>0900</div></div>{prog(2, 2)}{chrono(80, 12)}{chrono(45, 7)}{chrono(15, 2)}</div></div>')
    sprites = ('<div class="demo" style="display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap;width:360px">' + ''.join(sp(n, 6) for n in ('hero', 'coin', 'heart', 'heartv', 'star', 'ticket', 'cup', 'chest', 'croix', 'aiguille')) + '</div>')
    fonds = ('<div class="demo" style="width:330px;height:150px"><div class="big" style="font-size:18px">Bleu nuit<br><span class="k">retenu</span></div></div> <div class="demo aub" style="width:330px;height:150px"><div class="big" style="font-size:18px">Aubergine<br><span class="k">écarté</span></div></div>')
    typo = ('<div class="demo" style="width:700px"><div class="big" style="font-size:28px">Press Start 2P : <span class="k">titres</span></div>'
            '<div style="font-family:var(--pix);font-size:14px;margin-top:14px">SCORE 0900 · COMBO x3 · éèà</div>'
            '<div style="font-size:21px;font-weight:700;margin-top:14px">Silkscreen gras : questions et réponses, 18 à 21 px</div>'
            '<div style="font-size:16px;margin-top:8px;color:var(--gris)">Silkscreen : textes secondaires, 13 px au minimum</div></div>')
    grille = ('<div class="grid4" style="display:inline-block;padding:12px"><div style="display:flex;gap:16px;align-items:flex-end">' + sp('hero', 4) + sp('coin', 4) +
              '<div class="rep" style="width:200px;min-height:60px"><span class="l">A</span><span class="t">60 px</span></div></div></div>')
    corps = (f'<div class="part"><h2>Palette (hex) et contrastes sur le fond bleu nuit</h2><div class="sw">{pal}</div></div>'
             f'<div class="part"><h2>Polices</h2>{typo}</div>'
             f'<div class="part"><h2>Boutons, étiquettes, réponses (contour 2 px, ombre dure 4 px, cibles ≥ 44 px)</h2>{bt}</div>'
             f'<div class="part"><h2>Jauges : vies, score, cases à cocher, chrono (vert, jaune, rouge)</h2>{jauges}</div>'
             f'<div class="part"><h2>Sprites (SVG pixel, 1 case = 1 rect, grille 4 px)</h2>{sprites}</div>'
             f'<div class="part"><h2>Fond : bleu nuit contre aubergine</h2>{fonds}</div>'
             f'<div class="part"><h2>Grille 4 px</h2>{grille}</div>')
    return page('Lot 7 : planche de style pixel arcade', 'Tout est multiple de 4 px. Contour 2 px, ombre dure 4 px sans flou, coins carrés, aucun dégradé.', corps)

SONS_HTML = r'''<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lot 7 : écoute des sons 8 bits</title>__FONTS__<link rel="stylesheet" href="lot7.css">
<style>.b{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}.b button{min-height:48px;padding:0 18px;border:2px solid #05081A;background:#FFD23F;font:700 15px system-ui;border-radius:0;box-shadow:4px 4px 0 #05081A;cursor:pointer}
.b button:focus-visible{outline:4px solid #3B5CC4}#etat{font-size:15px;margin:8px 0}table{border-collapse:collapse;background:#fff;font-size:14px;margin-top:14px}td,th{border:1px solid #D5DBEA;padding:6px 10px;text-align:left}</style></head><body><div class="page">
<h1>Lot 7 : écoute des sons 8 bits</h1><p class="lead">Chaque son est fabriqué à la volée par le navigateur (Web Audio), sans fichier. Page d’écoute pour Romain : cliquer sur un bouton. Aucun code d’application.</p>
<div class="b"><button data-s="demarrage">Démarrage</button><button data-s="piece">Pièce</button><button data-s="bonne">Bonne réponse</button><button data-s="erreur">Erreur</button><button data-s="combo">Combo</button><button data-s="tick">Tick de roue</button><button data-s="roue">Roue complète (20 ticks)</button><button data-s="perdu">Perdu</button><button data-s="jackpot">Jackpot</button></div>
<div class="b"><button id="coupe" aria-pressed="false">Couper le son</button></div><div id="etat" role="status">Son activé. Volume maximal 0,2.</div>
<table><tr><th>Son</th><th>Forme</th><th>Notes (Hz)</th><th>Durée</th></tr>
<tr><td>Démarrage</td><td>carrée</td><td>523 · 659 · 784 · 1047</td><td>4 x 90 ms, dernière 260 ms</td></tr>
<tr><td>Pièce</td><td>carrée</td><td>988 puis 1319</td><td>70 ms puis 300 ms (décroît)</td></tr>
<tr><td>Bonne réponse</td><td>carrée</td><td>659 · 784 · 1047</td><td>80 + 80 + 220 ms</td></tr>
<tr><td>Erreur</td><td>triangle</td><td>220 vers 110 (glissé)</td><td>380 ms</td></tr>
<tr><td>Combo</td><td>carrée</td><td>784 · 1047 · 1319 · 1568</td><td>4 x 60 ms, dernière 240 ms</td></tr>
<tr><td>Tick de roue</td><td>triangle</td><td>880</td><td>30 ms, de plus en plus espacé</td></tr>
<tr><td>Perdu</td><td>triangle</td><td>392 · 330 · 262</td><td>3 x 160 ms</td></tr>
<tr><td>Jackpot</td><td>carrée (+ accord)</td><td>523 à 1568, puis accord 1047 + 1319 + 1568</td><td>≈ 1,5 s</td></tr></table></div>
<script>
var ctx=null,coupe=false;
function ac(){if(!ctx){var C=window.AudioContext||window.webkitAudioContext;ctx=new C();}if(ctx.state==='suspended'){ctx.resume();}return ctx;}
function note(f,t0,d,type,vol,f2){var c=ac(),o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t0);
 if(f2){o.frequency.linearRampToValueAtTime(f2,t0+d);}
 g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol||0.2,t0+0.005);g.gain.setValueAtTime(vol||0.2,t0+d*0.7);g.gain.linearRampToValueAtTime(0.0001,t0+d);
 o.connect(g);g.connect(c.destination);o.start(t0);o.stop(t0+d+0.02);}
function seq(list,type,vol){var t=ac().currentTime+0.02;for(var i=0;i<list.length;i++){note(list[i][0],t,list[i][1],type,vol);t+=list[i][1];}}
var S={
 demarrage:function(){seq([[523.25,.09],[659.25,.09],[783.99,.09],[1046.5,.26]],'square');},
 piece:function(){seq([[987.77,.07],[1318.51,.3]],'square');},
 bonne:function(){seq([[659.25,.08],[783.99,.08],[1046.5,.22]],'square');},
 erreur:function(){note(220,ac().currentTime+0.02,.38,'triangle',.2,110);},
 combo:function(){seq([[783.99,.06],[1046.5,.06],[1318.51,.06],[1567.98,.24]],'square');},
 tick:function(){note(880,ac().currentTime+0.02,.03,'triangle',.2);},
 roue:function(){var t=ac().currentTime+0.02,gap=0.06;for(var i=0;i<20;i++){note(880,t,.03,'triangle',.2);t+=gap;gap=gap*1.16;}},
 perdu:function(){seq([[392,.16],[329.63,.16],[261.63,.3]],'triangle');},
 jackpot:function(){var t=ac().currentTime+0.02,n=[523.25,659.25,783.99,1046.5,1318.51,1567.98],i;for(i=0;i<n.length;i++){note(n[i],t,.07,'square',.18);t+=.07;}
  for(i=0;i<2;i++){note(1046.5,t,.18,'square',.1);note(1318.51,t,.18,'square',.1);note(1567.98,t,.18,'square',.1);t+=.22;}
  note(1046.5,t,.5,'square',.1);note(1318.51,t,.5,'square',.1);note(1567.98,t,.5,'square',.1);}
};
var bs=document.querySelectorAll('[data-s]');
for(var i=0;i<bs.length;i++){bs[i].addEventListener('click',function(){if(coupe){return;}S[this.getAttribute('data-s')]();});}
document.getElementById('coupe').addEventListener('click',function(){coupe=!coupe;this.setAttribute('aria-pressed',coupe);this.textContent=coupe?'Remettre le son':'Couper le son';document.getElementById('etat').textContent=coupe?'Son coupé.':'Son activé. Volume maximal 0,2.';});
</script></body></html>'''

def ecrire(nom, html):
    open(f'{D}/{nom}', 'w').write(html)

ecrire('lot7-0-style.html', page_planche())
ecrire('lot7-1-quiz.html', ensemble_quiz())
ecrire('lot7-2-roue.html', ensemble_roue())
ecrire('lot7-3-choix-style.html', page_choix())
ecrire('lot7-4-sons.html', SONS_HTML.replace('__FONTS__', FONTS))
print('ok')
