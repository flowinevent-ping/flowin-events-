/* Histoire commune aux trois videos : memes personnages, memes chiffres,
   meme lot, memes ecrans. Tous les libelles d ecran viennent du code de
   l application (voir SCENARIOS.md, section audit). */
(function () {
  'use strict'
  var F = window.FL, COL = F.COL, T = F.T, R = F.R, C = F.C, P = F.P, G = F.G

  var STORY = {
    event: 'Fête du Lac', ville: 'Belrive', shop: 'Boulangerie Les Tilleuls',
    pseudo: 'Lune_42', ticket: 'PQ-2026-4128', lot: 'Bon d’achat 20 €',
    tirage: 'Tirage dimanche 14 juin', stations: 6,
    parties: 214, joueurs: 163, stFlashs: 96, stParties: 58, stJoueurs: 51
  }
  var CAST = {
    julie: { skin: '#6B4226', hair: '#1b1210', hairStyle: 'bun', shirt: '#E0218A', shirt2: '#fff' },
    hugo: { skin: '#F2CBA8', hair: '#7a4b2a', hairStyle: 'short', shirt: '#2563EB', shirt2: '#fff' },
    sophie: { skin: '#E6B48A', hair: '#141014', hairStyle: 'ponytail', shirt: '#00B4A0', shirt2: '#fff', tie: '#F59E0B' }
  }

  /* ---------- Ecrans joueur (charte des parcours : fond prune) ---------- */
  function fondJeu(g, w, h) {
    R(g, 0, 0, w, h, 0, F.grad('fj' + F.gid(), [[0, COL.jeu1], [1, COL.jeu2]]))
    F.statusBar(g, w, true)
  }
  function iconQuiz(g, cx, cy, r) {
    R(g, cx - r, cy - r, 2 * r, 2 * r, r * 0.45, F.grad('iq' + F.gid(), [[0, COL.magenta], [1, COL.prune]], 1, 1))
    C(g, cx, cy, r * 0.55, 'none', { stroke: '#fff', 'stroke-width': r * 0.12 })
    T(g, cx, cy + r * 0.25, '?', { size: r * 0.75, w: 800, anchor: 'middle' })
  }
  function hero(g, w) {
    iconQuiz(g, 42, 68, 22)
    T(g, 74, 64, STORY.event, { size: 20, w: 800, maxW: w - 90 })
    T(g, 74, 84, STORY.ville, { size: 12, w: 600, fill: 'rgba(255,255,255,.6)', maxW: w - 90 })
  }

  function ecranAccueil(g, w, h, t) {
    fondJeu(g, w, h)
    hero(g, w)
    R(g, 16, 112, w - 32, 82, 16, '#fff')
    T(g, w / 2, 134, 'À GAGNER', { size: 11, w: 800, fill: COL.prune, anchor: 'middle', ls: 1.6 })
    R(g, 30, 146, 36, 36, 10, COL.magenta)
    R(g, 39, 157, 18, 14, 3, 'none', { stroke: '#fff', 'stroke-width': 2 })
    T(g, 78, 162, STORY.lot, { size: 16, w: 800, fill: '#1c1024', maxW: w - 110 })
    T(g, 78, 180, STORY.shop, { size: 11.5, w: 700, fill: COL.orange, maxW: w - 110 })
    T(g, w / 2, 228, 'Comment jouer ?', { size: 15, w: 800, anchor: 'middle' })
    R(g, 16, 240, w - 32, 112, 16, '#fff')
    ;[['Flashe le QR code', 'À la station'], ['Réponds au quiz', 'Gagne ton ticket']].forEach(function (s, i) {
      var y = 258 + i * 50
      R(g, 30, y, 30, 30, 9, COL.magenta)
      T(g, 45, y + 20, String(i + 1), { size: 13, w: 800, anchor: 'middle' })
      T(g, 72, y + 14, s[0], { size: 13.5, w: 800, fill: '#1c1024', maxW: w - 100 })
      T(g, 72, y + 30, s[1], { size: 11.5, w: 600, fill: '#7a6f85', maxW: w - 100 })
    })
    R(g, 16, 372, w - 32, 34, 10, 'rgba(168,85,247,.14)', { stroke: 'rgba(168,85,247,.35)', 'stroke-width': 1 })
    T(g, w / 2, 394, STORY.tirage, { size: 12.5, w: 700, fill: 'rgba(255,255,255,.85)', anchor: 'middle', maxW: w - 50 })
    F.btn(g, 16, h - 140, w - 32, 50, 'Jouer gratuitement →', { size: 16 })
    T(g, w / 2, h - 72, 'Jeu gratuit · Sans achat obligatoire', { size: 11, w: 600, fill: 'rgba(255,255,255,.5)', anchor: 'middle', maxW: w - 40 })
    T(g, w / 2, h - 32, 'Propulsé par Flowin', { size: 10.5, w: 700, fill: 'rgba(255,255,255,.4)', anchor: 'middle' })
    F.tap(g, w / 2, h - 115, t, 3.4)
  }

  function ecranQuestion(g, w, h, t) {
    fondJeu(g, w, h)
    T(g, 18, 62, 'Question 3/5', { size: 13, w: 700, fill: 'rgba(255,255,255,.55)' })
    R(g, 18, 76, w - 36, 5, 3, 'rgba(255,255,255,.12)')
    R(g, 18, 76, (w - 36) * 0.6, 5, 3, COL.magenta)
    T(g, w / 2, 130, 'Combien d’arches compte', { size: 18, w: 800, anchor: 'middle', maxW: w - 30 })
    T(g, w / 2, 156, 'le vieux pont de Belrive ?', { size: 18, w: 800, anchor: 'middle', maxW: w - 30 })
    var opts = ['3 arches', '5 arches', '7 arches', '9 arches']
    var choisi = t > 2.2
    opts.forEach(function (o, i) {
      var y = 196 + i * 62
      var bon = i === 1
      var fill = choisi && bon ? 'rgba(22,163,74,.22)' : 'rgba(255,255,255,.06)'
      var stroke = choisi && bon ? '#16a34a' : 'rgba(255,255,255,.18)'
      R(g, 18, y, w - 36, 50, 14, fill, { stroke: stroke, 'stroke-width': 1.6 })
      T(g, 36, y + 31, ['A', 'B', 'C', 'D'][i], { size: 14, w: 800, fill: 'rgba(255,255,255,.45)' })
      T(g, 60, y + 31, o, { size: 15, w: 700, maxW: w - 110 })
      if (choisi && bon) F.check(g, w - 44, y + 25, 11, '#16a34a')
    })
    F.tap(g, w / 2, 196 + 62 + 25, t, 1.9)
  }

  function ecranScore(g, w, h, t) {
    fondJeu(g, w, h)
    if (t > 1.5) confetti(g, w, t - 1.5)
    T(g, w / 2, 190, 'TON SCORE', { size: 13, w: 800, fill: 'rgba(255,255,255,.5)', anchor: 'middle', ls: 1.5 })
    var n = Math.min(5, Math.floor(F.prog(t, 0.3, 1.2) * 5 + 0.0001))
    var sg = G(g, 'translate(' + w / 2 + ',258) scale(' + (0.9 + 0.1 * F.easeOut(F.prog(t, 0.3, 0.5))) + ')')
    T(sg, 0, 0, n + '/5', { size: 54, w: 800, anchor: 'middle' })
    T(g, w / 2, 310, 'Sans faute !', { size: 15, w: 700, fill: 'rgba(255,255,255,.8)', anchor: 'middle', op: F.prog(t, 1.4, 0.4) })
    T(g, w / 2, 332, 'Ton ticket est acquis.', { size: 15, w: 700, fill: 'rgba(255,255,255,.8)', anchor: 'middle', op: F.prog(t, 1.4, 0.4) })
    F.btn(g, 16, h - 120, w - 32, 50, 'Continuer →', { size: 16 })
  }
  function confetti(g, w, t) {
    var cols = [COL.magenta, COL.amber, COL.teal, '#fff', COL.violet]
    for (var i = 0; i < 26; i++) {
      var x = (i * 53) % w + Math.sin(t * 3 + i) * 8
      var y = -10 + ((t * (90 + (i % 5) * 18)) + i * 37) % 520
      R(g, x, y, 6, 10, 2, cols[i % cols.length], { transform: 'rotate(' + ((t * 180 + i * 40) % 360) + ' ' + (x + 3) + ' ' + (y + 5) + ')' })
    }
  }

  function ecranCompte(g, w, h, t) {
    fondJeu(g, w, h)
    T(g, 18, 66, 'Crée ton compte', { size: 21, w: 800, maxW: w - 30 })
    T(g, 18, 86, 'Score : 5/5 · ' + STORY.event, { size: 12, w: 600, fill: 'rgba(255,255,255,.55)', maxW: w - 30 })
    var champs = [['Prénom *', 'Nom *'], ['Email *'], ['Téléphone *']]
    var y = 108, k = 0
    champs.forEach(function (row) {
      var cw = (w - 36 - (row.length - 1) * 10) / row.length
      row.forEach(function (lbl, i) {
        var x = 18 + i * (cw + 10)
        T(g, x, y + 12, lbl, { size: 11.5, w: 700, fill: 'rgba(255,255,255,.6)', maxW: cw })
        R(g, x, y + 20, cw, 38, 10, 'rgba(255,255,255,.07)', { stroke: 'rgba(255,255,255,.18)', 'stroke-width': 1 })
        var fill = F.prog(t, 0.4 + k * 0.35, 0.3)
        var dots = Math.round(fill * (row.length > 1 ? 5 : 9))
        for (var d = 0; d < dots; d++) C(g, x + 16 + d * 11, y + 39, 3.4, 'rgba(255,255,255,.85)')
        k++
      })
      y += 70
    })
    R(g, 18, y + 4, 20, 20, 6, COL.magenta)
    P(g, 'M23 ' + (y + 14) + ' l4 4 l8 -8', 'none', { stroke: '#fff', 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    ;['J’accepte que mes coordonnées soient utilisées', 'pour ce jeu. Traitées et utilisées par Flowin,', 'mes données ne sont ni vendues ni échangées,', 'en respect avec la loi RGPD.'].forEach(function (l, i) {
      T(g, 46, y + 17 + i * 15, l, { size: 10, w: 600, fill: 'rgba(255,255,255,.62)', maxW: w - 62 })
    })
    F.btn(g, 16, h - 110, w - 32, 50, 'Valider →', { size: 16 })
    F.tap(g, w / 2, h - 85, t, 3.2)
  }

  function ecranBillet(g, w, h, t) {
    fondJeu(g, w, h)
    T(g, w / 2, 150, 'Bravo ! Score : 5/5', { size: 21, w: 800, anchor: 'middle', maxW: w - 30 })
    T(g, w / 2, 174, STORY.event, { size: 13, w: 600, fill: 'rgba(255,255,255,.55)', anchor: 'middle' })
    var p = F.easeOut(F.prog(t, 0.3, 0.6))
    var cg = G(g, 'translate(0,' + ((1 - p) * 30).toFixed(1) + ')', p)
    R(cg, 18, 200, w - 36, 110, 16, 'rgba(255,255,255,.07)', { stroke: 'rgba(255,255,255,.14)', 'stroke-width': 1 })
    R(cg, 18, 200, w - 36, 5, 2, COL.magenta)
    T(cg, w / 2, 228, 'TON TICKET', { size: 10.5, w: 800, fill: 'rgba(255,255,255,.45)', anchor: 'middle', ls: 1.5 })
    T(cg, w / 2, 266, STORY.ticket, { size: 25, w: 800, anchor: 'middle', ls: 1, maxW: w - 60 })
    T(cg, w / 2, 292, STORY.tirage, { size: 12, w: 600, fill: 'rgba(255,255,255,.55)', anchor: 'middle' })
    F.btn(g, 18, 334, w - 36, 44, 'Découvrir nos partenaires', { fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.3)', size: 13.5 })
    F.btn(g, 18, 388, w - 36, 44, 'Parraine un ami & gagne un ticket', { fill: 'rgba(255,255,255,.04)', stroke: 'rgba(255,255,255,.3)', size: 13 })
    F.btn(g, 18, 446, w - 36, 46, 'Mon compte & mes gains', { fill: '#fff', color: '#0B6E50', size: 14 })
    F.btn(g, 18, 502, w - 36, 42, 'Retour à l’opération', { fill: 'rgba(255,255,255,.02)', stroke: 'rgba(255,255,255,.3)', size: 13 })
  }

  function avatarCommerce(g, cx, cy, r, lettre, col) {
    C(g, cx, cy, r, col)
    T(g, cx, cy + r * 0.36, lettre, { size: r, w: 800, anchor: 'middle' })
  }
  function ecranPartenaires(g, w, h, t) {
    fondJeu(g, w, h)
    T(g, 18, 66, 'Nos partenaires', { size: 21, w: 800 })
    T(g, 18, 86, STORY.event, { size: 12, w: 600, fill: 'rgba(255,255,255,.55)' })
    var noms = [[STORY.shop, COL.orange, 'B'], ['Café du Port', COL.teal, 'C'], ['Fleurs de Rive', COL.violet, 'F'], ['Librairie Page 9', COL.blue, 'L'], ['Épicerie Saveurs', COL.amber, 'É'], ['Vélos du Lac', COL.magenta, 'V']]
    var cw = (w - 46) / 2
    noms.forEach(function (n, i) {
      var x = 18 + (i % 2) * (cw + 10), y = 104 + Math.floor(i / 2) * 118
      var on = i === 0 && t > 1.2
      R(g, x, y, cw, 106, 14, on ? 'rgba(224,33,138,.16)' : 'rgba(255,255,255,.06)', { stroke: on ? COL.magenta : 'rgba(255,255,255,.12)', 'stroke-width': on ? 2 : 1 })
      avatarCommerce(g, x + cw / 2, y + 38, 24, n[2], n[1])
      var mots = n[0].split(' ')
      var l1 = mots.slice(0, Math.ceil(mots.length / 2)).join(' '), l2 = mots.slice(Math.ceil(mots.length / 2)).join(' ')
      T(g, x + cw / 2, y + 80, l1, { size: 11.5, w: 800, anchor: 'middle', maxW: cw - 12 })
      if (l2) T(g, x + cw / 2, y + 95, l2, { size: 11.5, w: 800, anchor: 'middle', maxW: cw - 12 })
    })
    F.tap(g, 18 + cw / 2, 150, t, 0.9)
  }

  /* ---------- Ecrans espace pro (charte pro : fond clair, bleu) ---------- */
  function fondPro(g, w, h, titre, sous) {
    R(g, 0, 0, w, h, 0, COL.proFond)
    F.statusBar(g, w, false)
    R(g, 0, 30, w, 40, 0, '#0F1E33')
    C(g, 20, 50, 4, '#fff')
    var tx = F.E('text', { x: 30, y: 56, 'font-family': 'Manrope, sans-serif', 'font-size': 16, 'font-weight': 800, fill: '#fff' }, g)
    tx.textContent = 'Flow'; var ts = F.E('tspan', { fill: '#6F8CF0' }, tx); ts.textContent = 'in'
    T(g, 86, 56, 'PRO', { size: 10, w: 800, fill: 'rgba(255,255,255,.6)', ls: 1.4 })
    if (titre) T(g, 16, 104, titre, { size: 20, w: 800, fill: COL.proTexte, maxW: w - 30 })
    if (sous) T(g, 16, 124, sous, { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 30 })
  }
  function carte(g, x, y, w, h) { R(g, x, y + 2, w, h, 14, 'rgba(28,16,36,.05)'); return R(g, x, y, w, h, 14, '#fff', { stroke: COL.proBord, 'stroke-width': 1 }) }

  function ecranNouvelleOp(g, w, h, t) {
    fondPro(g, w, h, 'Nouvelle opération', 'Créer ou rejoindre')
    var cartes = [
      ['Créer une animation', 'Chez vous : un jeu, vos lots,', 'gain immédiat ou tirage au sort.', COL.pro],
      ['Rejoindre un super event', 'Devenez une station d’un festival', 'ou d’une opération de commerçants.', COL.orange],
      ['Créer un super event', 'Festival, association, groupement :', 'plusieurs commerces, un même jeu.', COL.orange]
    ]
    cartes.forEach(function (c, i) {
      var y = 144 + i * 120
      var on = i === 2 && t > 2.4
      carte(g, 14, y, w - 28, 106)
      if (on) R(g, 14, y, w - 28, 106, 14, 'none', { stroke: COL.orange, 'stroke-width': 2.4 })
      R(g, 28, y + 16, 34, 34, 10, c[3])
      if (i === 2) P(g, 'M45 ' + (y + 22) + ' l4 8 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 l9 -1 z', '#fff')
      else if (i === 1) { R(g, 36, y + 28, 18, 12, 3, '#fff') }
      else { C(g, 45, y + 33, 8, 'none', { stroke: '#fff', 'stroke-width': 3 }) }
      T(g, 74, y + 39, c[0], { size: 14.5, w: 800, fill: COL.proTexte, maxW: w - 104 })
      T(g, 28, y + 72, c[1], { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 56 })
      T(g, 28, y + 89, c[2], { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 56 })
    })
    F.tap(g, w / 2, 144 + 240 + 50, t, 2.2)
  }

  /* « Que voulez-vous faire ? » : maquette « Parcours Pro Flowin » (cartes a
     halo, charte pro). Un pro ne cree pas de super event : il en integre un,
     ou demande a Flowin de le creer. */
  function ecranQueFaire(g, w, h, t) {
    fondPro(g, w, h, 'Que voulez-vous faire ?', 'Créer ou rejoindre')
    var cartes = [
      { l: ['Créer mon animation'], s: 'Chez vous : un jeu, vos lots.', c: '#1D4ED8', ic: 'anim' },
      { l: ['Intégrer un super event'], s: 'Le jeu est déjà choisi.', c: '#C2410C', ic: 'pin' },
      { l: ['Demander la création d’un', 'super event à Flowin'], s: 'Flowin le crée pour vous.', c: '#C2410C', ic: 'star' }
    ]
    var y = 144
    cartes.forEach(function (c, i) {
      var ch = c.l.length > 1 ? 118 : 96
      var on = i === 2 && t > 1.1
      carte(g, 14, y, w - 28, ch)
      R(g, 14, y, w - 28, 4, 2, c.c)
      if (on) R(g, 14, y, w - 28, ch, 14, c.c + '12', { stroke: c.c, 'stroke-width': 2.4 })
      var envoye = on && t > 1.5
      C(g, 44, y + 40, 20, envoye ? '#16a34a' : on ? c.c : c.c + '22')
      var ic = on ? '#fff' : c.c
      if (envoye) F.check(g, 44, y + 40, 20, '#16a34a')
      else if (c.ic === 'anim') { R(g, 32, y + 32, 24, 16, 5, 'none', { stroke: ic, 'stroke-width': 2.2 }); C(g, 39, y + 40, 2, ic); C(g, 49, y + 40, 2, ic) }
      else if (c.ic === 'pin') { P(g, 'M44 ' + (y + 54) + ' c-8 -9 -11 -13 -11 -18 a11 11 0 1 1 22 0 c0 5 -3 9 -11 18 z', 'none', { stroke: ic, 'stroke-width': 2.2 }); C(g, 44, y + 36, 3.5, ic) }
      else P(g, 'M44 ' + (y + 27) + ' l3.8 8 l8.6 1 l-6.4 5.8 l1.8 8.6 l-7.8 -4.4 l-7.8 4.4 l1.8 -8.6 l-6.4 -5.8 l8.6 -1 z', ic)
      c.l.forEach(function (l, k) { T(g, 76, y + 38 + k * 20, l, { size: 14.5, w: 800, fill: COL.proTexte, maxW: w - 104 }) })
      T(g, 76, y + 38 + c.l.length * 20 + 6, c.s, { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 104 })
      y += ch + 12
    })
    F.tap(g, w / 2, 144 + 96 + 12 + 96 + 12 + 50, t, 0.8)
  }

  function ligneRecap(g, w, y, k, v) {
    T(g, 28, y, k, { size: 12.5, w: 600, fill: COL.proMut })
    T(g, w - 28, y, v, { size: 13.5, w: 800, fill: COL.proTexte, anchor: 'end', maxW: w - 140 })
    R(g, 28, y + 12, w - 56, 1, 0, COL.proBord)
  }
  function ecranCreerSE(g, w, h, t) {
    fondPro(g, w, h, 'Créer un super event', 'Diffusion & récap')
    T(g, 16, 160, 'Récapitulatif', { size: 15, w: 800, fill: COL.proTexte })
    carte(g, 14, 172, w - 28, 214)
    ;[['Opération', 'Créer un super event'], ['Nom', STORY.event], ['Dates', '13 – 14 juin'], ['Jeu', 'Quiz'], ['Diffusion', 'QR imprimé']].forEach(function (r, i) { ligneRecap(g, w, 206 + i * 40, r[0], r[1]) })
    var envoi = t > 2.6
    F.btn(g, 14, 404, w - 28, 50, envoi ? 'Enregistrement…' : 'Créer le super event', { fill: F.grad(F.gid(), [[0, COL.rj2], [1, COL.rj]], 1, 0), size: 15 })
    F.tap(g, w / 2, 429, t, 2.4)
  }

  function chip(g, x, y, label, col) {
    var n = T(g, 0, 0, label, { size: 11, w: 800, fill: col })
    var lw = n.getComputedTextLength(); n.parentNode.removeChild(n)
    R(g, x, y, lw + 18, 24, 12, '#fff', { stroke: COL.proBord, 'stroke-width': 1.2 })
    T(g, x + 9, y + 16, label, { size: 11, w: 800, fill: col })
    return lw + 18
  }
  function ecranMesOps(g, w, h, t, o) {
    o = o || {}
    fondPro(g, w, h, 'Mes opérations', 'En cours, à venir, passées — par mois.')
    var x = 14
    ;['Toutes', 'Animations', 'Super events'].forEach(function (l, i) {
      var n = T(g, 0, 0, l, { size: 11.5, w: 800 }); var lw = n.getComputedTextLength(); n.parentNode.removeChild(n)
      R(g, x, 140, lw + 18, 28, 14, i === 0 ? COL.pro : '#fff', i ? { stroke: COL.proBord, 'stroke-width': 1.2 } : null)
      T(g, x + 9, 159, l, { size: 11.5, w: 800, fill: i === 0 ? '#fff' : COL.pro })
      x += lw + 24
    })
    T(g, 14, 200, o.aVenir ? 'À venir' : 'En cours', { size: 15, w: 800, fill: COL.proTexte })
    T(g, o.aVenir ? 78 : 84, 200, '1', { size: 12, w: 700, fill: COL.proMut })
    carte(g, 14, 214, w - 28, 192)
    C(g, 36, 238, 11, COL.orange)
    P(g, 'M36 231 l2 5 l5 0.5 l-4 3.5 l1.3 5 l-4.3 -2.8 l-4.3 2.8 l1.3 -5 l-4 -3.5 l5 -0.5 z', '#fff')
    T(g, 54, 243, STORY.event, { size: 15, w: 800, fill: COL.proTexte, maxW: w - 150 })
    if (o.aVenir) T(g, w - 26, 242, '13 – 14 juin', { size: 10.5, w: 700, fill: COL.pro, anchor: 'end' })
    else {
      C(g, w - 84, 238, 4, '#16a34a', { opacity: 0.6 + 0.4 * Math.abs(Math.sin(t * 3)) })
      T(g, w - 26, 242, 'en cours', { size: 10.5, w: 700, fill: '#16a34a', anchor: 'end' })
    }
    T(g, 28, 264, 'Super event · Quiz · ' + STORY.stations + ' stations', { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 56 })
    var parties = o.parties !== undefined ? o.parties : Math.round(STORY.parties * F.easeOut(F.prog(t, 0.4, 2.4)))
    var stats = [[String(parties), 'parties'], [String(o.gagnants || 0), 'gagnants'], [String(o.remettre || 0), 'à remettre']]
    var sx = 28
    stats.forEach(function (s) {
      T(g, sx, 298, s[0], { size: 17, w: 800, fill: COL.orange })
      var n = T(g, 0, 0, s[0], { size: 17, w: 800 }); var lw = n.getComputedTextLength(); n.parentNode.removeChild(n)
      T(g, sx + lw + 3, 298, s[1], { size: 10.5, w: 600, fill: COL.proMut })
      var n2 = T(g, 0, 0, s[1], { size: 10.5, w: 600 }); var lw2 = n2.getComputedTextLength(); n2.parentNode.removeChild(n2)
      sx += lw + lw2 + 11
    })
    var cx = 28
    ;['Lots', 'Gagnants', 'CRM'].forEach(function (c) { cx += chip(g, cx, 318, c, COL.orange) + 6 })
    cx = 28
    ;['Trafic', 'Bons'].forEach(function (c) { cx += chip(g, cx, 350, c, COL.orange) + 6 })
  }

  function ecranTirage(g, w, h, t) {
    fondPro(g, w, h, 'Mes super data', 'CRM, gagnants et trafic de toutes vos opérations.')
    var x = 14
    ;['CRM', 'Gagnants & tirage', 'Trafic'].forEach(function (l, i) {
      var n = T(g, 0, 0, l, { size: 11.5, w: 800 }); var lw = n.getComputedTextLength(); n.parentNode.removeChild(n)
      R(g, x, 140, lw + 22, 28, 10, i === 1 ? COL.pro : '#fff', i !== 1 ? { stroke: COL.proBord, 'stroke-width': 1.2 } : null)
      T(g, x + 11, 159, l, { size: 11.5, w: 800, fill: i === 1 ? '#fff' : COL.proTexte })
      x += lw + 30
    })
    carte(g, 14, 184, w - 28, 260)
    T(g, 28, 214, 'Tirage au sort', { size: 16, w: 800, fill: COL.proTexte })
    T(g, 28, 234, STORY.event + ' · ' + STORY.lot, { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 56 })
    F.btn(g, 28, 250, w - 56, 42, 'Lancer le tirage', { fill: COL.pro, size: 14 })
    F.tap(g, w / 2, 271, t, 1.2)
    if (t > 1.6) {
      var spin = t < 2.6
      var p = F.easeOut(F.prog(t, 1.6, 0.4))
      var gg = G(g, null, p)
      R(gg, 28, 310, w - 56, 116, 12, '#F6F8FF', { stroke: '#D6E0FB', 'stroke-width': 1 })
      T(gg, 42, 334, 'Gagnant proposé', { size: 11.5, w: 800, fill: COL.pro })
      var pseudos = ['Soleil_7', 'Brume_19', 'Pic_33', STORY.pseudo]
      var ps = spin ? pseudos[Math.floor(t * 12) % pseudos.length] : STORY.pseudo
      T(gg, 42, 364, ps, { size: 20, w: 800, fill: COL.proTexte })
      T(gg, 42, 386, spin ? '…' : 'Ticket ' + STORY.ticket, { size: 12.5, w: 700, fill: COL.proMut })
      T(gg, 42, 410, spin ? '' : 'Lot : ' + STORY.lot, { size: 12, w: 700, fill: COL.orange })
    }
  }

  function ecranEnvoi(g, w, h, t) {
    fondPro(g, w, h, 'Tirage au sort', STORY.event)
    carte(g, 14, 140, w - 28, 120)
    T(g, 28, 166, 'Gagnant proposé', { size: 11.5, w: 800, fill: COL.pro })
    T(g, 28, 196, STORY.pseudo, { size: 20, w: 800, fill: COL.proTexte })
    T(g, 28, 218, 'Ticket ' + STORY.ticket, { size: 12.5, w: 700, fill: COL.proMut })
    T(g, 28, 242, 'Lot : ' + STORY.lot, { size: 12, w: 700, fill: COL.orange, maxW: w - 56 })
    F.btn(g, 14, 280, w - 28, 46, 'Confirmer et envoyer le billet', { fill: COL.pro, size: 14 })
    F.tap(g, w / 2, 303, t, 1.0)
    if (t > 1.5) {
      var p = F.easeOut(F.prog(t, 1.5, 0.4))
      var cg = G(g, null, p)
      R(cg, 14, 344, w - 28, 56, 12, '#E7F8F1', { stroke: '#9ADBC2', 'stroke-width': 1 })
      F.check(cg, 38, 372, 12, '#0F9E73')
      T(cg, 58, 368, 'Billet envoyé par email', { size: 13, w: 800, fill: '#0B6E50', maxW: w - 80 })
      T(cg, 58, 386, 'au gagnant.', { size: 13, w: 800, fill: '#0B6E50' })
      var ep = F.prog(t, 1.9, 1.2)
      var ex = F.lerp(w / 2, w + 40, F.easeInOut(ep)), ey = F.lerp(470, 430, ep)
      var mg = G(cg, 'translate(' + ex + ',' + ey + ')', 1 - ep * 0.3)
      R(mg, -34, -22, 68, 44, 6, '#fff', { stroke: COL.pro, 'stroke-width': 2.4 })
      P(mg, 'M-34 -22 L0 4 L34 -22', 'none', { stroke: COL.pro, 'stroke-width': 2.4, 'stroke-linejoin': 'round' })
    }
  }

  function ecranCRM(g, w, h, t, o) {
    fondPro(g, w, h, 'Mes super data', 'CRM, gagnants et trafic de toutes vos opérations.')
    var x = 14
    ;['CRM', 'Gagnants & tirage', 'Trafic'].forEach(function (l, i) {
      var n = T(g, 0, 0, l, { size: 11.5, w: 800 }); var lw = n.getComputedTextLength(); n.parentNode.removeChild(n)
      R(g, x, 140, lw + 22, 28, 10, i === 0 ? COL.pro : '#fff', i !== 0 ? { stroke: COL.proBord, 'stroke-width': 1.2 } : null)
      T(g, x + 11, 159, l, { size: 11.5, w: 800, fill: i === 0 ? '#fff' : COL.proTexte })
      x += lw + 30
    })
    o = o || {}
    var n = Math.round((o.n || STORY.joueurs) * F.easeOut(F.prog(t, 0.3, 1.6)))
    carte(g, 14, 184, w - 28, 74)
    T(g, 28, 226, String(n), { size: 30, w: 800, fill: COL.pro })
    T(g, 100, 214, 'contacts', { size: 13, w: 800, fill: COL.proTexte })
    T(g, 100, 232, o.sous || 'joueurs de la ' + STORY.event, { size: 11.5, w: 600, fill: COL.proMut, maxW: w - 130 })
    var lignes = [[STORY.pseudo, 'Gagnant'], ['Soleil_7', '2 parties'], ['Brume_19', '1 partie'], ['Pic_33', '3 parties'], ['Vague_5', '1 partie']]
    carte(g, 14, 272, w - 28, 248)
    lignes.forEach(function (l, i) {
      var y = 304 + i * 46
      var a = F.prog(t, 0.8 + i * 0.18, 0.3)
      var lg = G(g, null, a)
      C(lg, 38, y - 5, 13, ['#E9E2F7', '#DCEBFF', '#E2F6EF', '#FFF0DC', '#F7E1EC'][i])
      T(lg, 60, y, l[0], { size: 13.5, w: 800, fill: COL.proTexte })
      T(lg, w - 30, y, l[1], { size: 11.5, w: 700, fill: i === 0 ? COL.orange : COL.proMut, anchor: 'end' })
      if (i < 4) R(lg, 28, y + 18, w - 56, 1, 0, COL.proBord)
    })
  }

  function ecranBilan(g, w, h, t) {
    fondPro(g, w, h, null, null)
    T(g, 16, 100, 'MA PARTICIPATION · BILAN', { size: 11, w: 800, fill: COL.orange, ls: 1.2 })
    T(g, 16, 126, STORY.event, { size: 21, w: 800, fill: COL.proTexte })
    T(g, 16, 160, 'Mes stations', { size: 15, w: 800, fill: COL.proTexte })
    carte(g, 14, 172, w - 28, 196)
    var cols = [['Joueurs', STORY.stJoueurs], ['Parties', STORY.stParties], ['Flashs QR', STORY.stFlashs]]
    T(g, 28, 200, 'Station', { size: 11, w: 800, fill: COL.proMut })
    T(g, 28, 228, STORY.shop, { size: 13.5, w: 800, fill: COL.proTexte, maxW: w - 56 })
    R(g, 28, 244, w - 56, 1, 0, COL.proBord)
    var cw = (w - 56) / 3
    cols.forEach(function (c, i) {
      var x = 28 + i * cw
      var v = Math.round(c[1] * F.easeOut(F.prog(t, 0.4 + i * 0.25, 1.4)))
      T(g, x + cw / 2, 300, String(v), { size: 30, w: 800, fill: COL.orange, anchor: 'middle' })
      T(g, x + cw / 2, 326, c[0], { size: 12, w: 700, fill: COL.proMut, anchor: 'middle', maxW: cw - 6 })
    })
    T(g, 16, 404, 'Gagnants & tirage', { size: 15, w: 800, fill: COL.proTexte })
    carte(g, 14, 416, w - 28, 76)
    T(g, 28, 444, 'Tirage global mutualisé.', { size: 12.5, w: 700, fill: COL.proTexte, maxW: w - 56 })
    T(g, 28, 470, 'Ouvrir le tirage →', { size: 13, w: 800, fill: COL.pro })
  }

  function ecranValidation(g, w, h, t) {
    fondPro(g, w, h, 'Gagnants & tirage', STORY.event)
    carte(g, 14, 140, w - 28, 112)
    T(g, 28, 168, STORY.pseudo, { size: 17, w: 800, fill: COL.proTexte })
    T(g, w - 28, 168, 'À retirer', { size: 11.5, w: 800, fill: COL.orange, anchor: 'end' })
    T(g, 28, 190, 'Ticket ' + STORY.ticket, { size: 12, w: 700, fill: COL.proMut })
    T(g, 28, 210, 'Lot : ' + STORY.lot, { size: 12, w: 700, fill: COL.proMut, maxW: w - 56 })
    T(g, 28, 236, 'Voir le billet ↗', { size: 12, w: 800, fill: COL.pro })
    T(g, 16, 288, 'Validation en caisse', { size: 15, w: 800, fill: COL.proTexte })
    carte(g, 14, 300, w - 28, 120)
    T(g, 28, 326, 'Code PIN du commerce', { size: 11.5, w: 700, fill: COL.proMut })
    R(g, 28, 336, w - 56, 38, 10, COL.champ || '#faf7fd', { stroke: '#e7def0', 'stroke-width': 1.2 })
    var nd = Math.min(4, Math.floor(F.prog(t, 0.3, 1.0) * 4 + 0.001))
    for (var i = 0; i < nd; i++) C(g, 48 + i * 18, 355, 4.5, COL.proTexte)
    F.btn(g, 28, 382, w - 56, 32, 'Valider le billet', { fill: COL.pro, size: 13 })
    F.tap(g, w / 2, 398, t, 1.6)
    if (t > 2.0) {
      var p = F.easeOut(F.prog(t, 2.0, 0.4))
      var cg = G(g, null, p)
      R(cg, 14, 438, w - 28, 62, 12, '#E7F8F1', { stroke: '#9ADBC2', 'stroke-width': 1 })
      F.check(cg, 38, 469, 12, '#0F9E73')
      T(cg, 58, 464, 'Billet validé. Le lot est', { size: 13, w: 800, fill: '#0B6E50', maxW: w - 80 })
      T(cg, 58, 482, 'décompté du stock.', { size: 13, w: 800, fill: '#0B6E50' })
    }
  }

  /* ---------- Ecrans « Devenez commerce partenaire » (charte orange) ---------- */
  function fondRj(g, w, h, hauteur) {
    R(g, 0, 0, w, h, 0, '#F7F4F1')
    R(g, 0, 0, w, hauteur || 210, 0, F.grad('rj' + F.gid(), [[0, COL.rj2], [1, COL.rj]], 1, 1))
    C(g, w - 20, 40, 70, 'rgba(255,255,255,.12)')
    F.statusBar(g, w, true)
    C(g, 22, 54, 4, '#fff')
    T(g, 32, 60, 'Flowin', { size: 15, w: 800 })
  }
  function ecranRejoindre(g, w, h, t) {
    fondRj(g, w, h, 236)
    T(g, 18, 96, 'DEVENEZ COMMERCE PARTENAIRE', { size: 10.5, w: 800, ls: 1, maxW: w - 30 })
    T(g, 18, 132, STORY.event, { size: 27, w: 800, maxW: w - 30 })
    T(g, 18, 160, 'Animez votre boutique, captez de', { size: 12, w: 600, op: 0.92, maxW: w - 30 })
    T(g, 18, 177, 'nouveaux clients et offrez-leur', { size: 12, w: 600, op: 0.92, maxW: w - 30 })
    T(g, 18, 194, 'une chance de gagner.', { size: 12, w: 600, op: 0.92, maxW: w - 30 })
    R(g, 14, 226, w - 28, 276, 18, '#fff', { stroke: '#efe7df', 'stroke-width': 1 })
    R(g, w / 2 - 26, 246, 52, 52, 15, F.grad('rjb' + F.gid(), [[0, COL.rj2], [1, COL.rj]], 1, 1))
    R(g, w / 2 - 12, 264, 24, 18, 3, 'none', { stroke: '#fff', 'stroke-width': 2.6 })
    P(g, 'M' + (w / 2 - 15) + ' 265 L' + (w / 2) + ' 255 L' + (w / 2 + 15) + ' 265', 'none', { stroke: '#fff', 'stroke-width': 2.6, 'stroke-linejoin': 'round' })
    T(g, w / 2, 328, 'Rejoindre en 4 étapes', { size: 18, w: 800, fill: '#1c1024', anchor: 'middle' })
    T(g, w / 2, 352, 'Votre commerce, votre contact,', { size: 12, w: 600, fill: '#8a7e93', anchor: 'middle', maxW: w - 50 })
    T(g, w / 2, 370, 'votre lot pour le tirage.', { size: 12, w: 600, fill: '#8a7e93', anchor: 'middle', maxW: w - 50 })
    F.btn(g, 30, 396, w - 60, 46, 'Commencer', { fill: F.grad('rjc' + F.gid(), [[0, COL.rj2], [1, COL.rj]], 1, 0), size: 15 })
    T(g, w / 2, 470, 'Validé par l’équipe Flowin sous 24–48h', { size: 11, w: 600, fill: '#8a7e93', anchor: 'middle', maxW: w - 50 })
    F.tap(g, w / 2, 419, t, 3.0)
  }
  function ecranLot(g, w, h, t) {
    fondRj(g, w, h, 120)
    T(g, 18, 100, STORY.event, { size: 18, w: 800 })
    R(g, 14, 124, w - 28, 400, 18, '#fff', { stroke: '#efe7df', 'stroke-width': 1 })
    for (var i = 0; i < 4; i++) R(g, 28 + i * ((w - 56) / 4), 142, (w - 56) / 4 - 6, 5, 3, i <= 2 ? COL.rj : '#eadfd5')
    T(g, 28, 180, 'Votre lot pour le tirage', { size: 17, w: 800, fill: '#1c1024', maxW: w - 56 })
    T(g, 28, 200, 'Jeu choisi par l’organisateur,', { size: 11.5, w: 600, fill: '#8a7e93', maxW: w - 56 })
    T(g, 28, 216, 'gagnants désignés par tirage au sort.', { size: 11.5, w: 600, fill: '#8a7e93', maxW: w - 56 })
    T(g, 28, 248, 'Lot offert', { size: 12, w: 800, fill: '#1c1024' })
    R(g, 28, 258, w - 56, 42, 12, '#faf7fd', { stroke: '#e7def0', 'stroke-width': 1.2 })
    var txt = STORY.lot, nch = Math.round(F.prog(t, 0.4, 1.4) * txt.length)
    T(g, 42, 285, txt.slice(0, nch) + (nch < txt.length && Math.floor(t * 4) % 2 ? '|' : ''), { size: 14.5, w: 700, fill: '#1c1024', maxW: w - 80 })
    T(g, 28, 330, 'Quantité', { size: 12, w: 800, fill: '#1c1024' })
    R(g, 28, 340, 90, 42, 12, '#faf7fd', { stroke: '#e7def0', 'stroke-width': 1.2 })
    T(g, 46, 367, t > 2 ? '1' : '', { size: 14.5, w: 700, fill: '#1c1024' })
    T(g, 28, 412, 'Conditions d’utilisation', { size: 12, w: 800, fill: '#1c1024' })
    R(g, 28, 422, w - 56, 42, 12, '#faf7fd', { stroke: '#e7def0', 'stroke-width': 1.2 })
    T(g, 42, 448, t > 2.4 ? 'Valable en boutique' : '', { size: 13, w: 600, fill: '#1c1024', maxW: w - 80 })
    F.btn(g, 28, 476, w - 56, 38, 'Continuer', { fill: COL.rj, size: 14 })
  }
  function ecranDemande(g, w, h, t) {
    fondRj(g, w, h, 200)
    var p = F.easeOut(F.prog(t, 0.2, 0.5))
    C(g, w / 2, 112, 30 * p, 'rgba(255,255,255,.2)')
    if (p > 0.5) P(g, 'M' + (w / 2 - 12) + ' 112 l8 8 l16 -16', 'none', { stroke: '#fff', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' })
    T(g, w / 2, 176, 'Demande envoyée !', { size: 22, w: 800, anchor: 'middle' })
    R(g, 14, 214, w - 28, 290, 18, '#fff', { stroke: '#efe7df', 'stroke-width': 1 })
    ;['Merci Sophie ! La demande de', STORY.shop, 'pour l’opération ' + STORY.event, 'est enregistrée.'].forEach(function (l, i) {
      T(g, 28, 246 + i * 20, l, { size: 13, w: i === 1 ? 800 : 600, fill: '#1c1024', maxW: w - 56 })
    })
    R(g, 28, 336, w - 56, 140, 12, 'rgba(194,65,12,.07)')
    ;['Nous validons votre commerce', 'sous 24–48h. Votre QR à afficher', 'en boutique et votre tableau de', 'bord seront activés à ce', 'moment-là.'].forEach(function (l, i) {
      T(g, 40, 362 + i * 22, l, { size: 12.5, w: i === 1 || i === 2 || i === 3 ? 700 : 600, fill: '#3a2a20', maxW: w - 80 })
    })
  }

  window.STORY = STORY
  window.CAST = CAST
  window.ECRANS = {
    accueil: ecranAccueil, question: ecranQuestion, score: ecranScore, compte: ecranCompte, billet: ecranBillet,
    partenaires: ecranPartenaires, nouvelleOp: ecranNouvelleOp, queFaire: ecranQueFaire, creerSE: ecranCreerSE, mesOps: ecranMesOps,
    tirage: ecranTirage, envoi: ecranEnvoi, crm: ecranCRM, bilan: ecranBilan, validation: ecranValidation,
    rejoindre: ecranRejoindre, lot: ecranLot, demande: ecranDemande
  }

  /* Gabarits de scene partages. */
  window.SCENE = {
    /* Telephone en grand a droite, personnage en buste a gauche. */
    /* V2 (reseaux sociaux) : telephone centre dans la colonne sure
       (x 96-436), sous la legende ; le bas passe sous un voile, au-dela
       duquel TikTok / Reels posent leurs boutons. opts.scroll remonte
       l ecran (comme un defilement) pour garder l essentiel visible. */
    ecran: function (theme, ecran, perso, opts) {
      opts = opts || {}
      var fondVoile = { jeu: '#1d0c29', pro: '#F1EFF8', rj: '#FFF3E8' }[theme] || '#0E1B30'
      return function (g, t) {
        F.bgSoft(g, theme)
        var p = F.easeOut(F.prog(t, 0, 0.4))
        var pg = G(g, 'translate(0,' + ((1 - p) * 30).toFixed(1) + ')', p)
        F.phone(pg, 96, 252, 340, 700, function (sg, w, h) {
          var z = 1.12
          var sc = opts.scroll || 0
          if (opts.scrollTo !== undefined) sc = F.lerp(sc, opts.scrollTo, F.easeInOut(F.prog(t, opts.scrollAt || 1.2, 0.6)))
          ecran(G(sg, 'scale(' + z + ') translate(0,' + (-sc) + ')'), w / z, h / z, t * (opts.k || 1), opts.args)
          /* Ecran defile : la barre d etat reste en place par-dessus, comme
             sur un vrai telephone (sinon des lettres coupees sous l encoche). */
          if (sc) {
            var b = { jeu: ['#2a1036', true], pro: ['#f2edf7', false], rj: ['#FB7D13', true] }[theme] || ['#fff', false]
            R(sg, 0, 0, w, 40, 0, b[0])
            F.statusBar(sg, w, b[1])
          }
        })
        F.veil(g, fondVoile)
        if (perso) F.person(g, 62, 812, 0.66, CAST[perso], opts.pose || 'phone', t, { happy: opts.happy })
      }
    }
  }
})()
