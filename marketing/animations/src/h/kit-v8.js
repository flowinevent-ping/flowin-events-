/* Briques v8 : charte claire sans fuchsia ni fond sombre. Fonds blanc,
   blanc cassé, menthe, bleu ciel ; accents teal et orange (dégradé de la
   pilule Plug & Play) ; texte encre. Seul le « in » du logo garde son
   dégradé magenta -> or. Téléphones blancs à contour fin, écrans clairs. */
(function () {
  var F = window.FH, K3 = window.K3, K7 = window.K7, C = F.C, INK = C.ink, TEAL = C.teal
  var K8 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  var OR1 = '#F5A100', OR2 = '#EC5B45', GRIS = '#F6F7F5', TRAIT = '#DCE3E0', MUT = 'rgba(21,12,28,.55)'
  K8.BG = { blanc: '#FFFFFF', casse: '#F6F7F5', menthe: '#D9F2EA', ciel: '#D7EEF9' }
  K8.PA = { menthe: '#9FE3D6', ciel: '#B4DCF6', peche: '#FFD3A8' }
  K8.C = { teal: TEAL, or1: OR1, or2: OR2, ciel: '#5BB8E8', menthe: '#7DD8C6' }
  var AR = 'font-family="ArchivoX" font-weight="900"'
  function t(x, y, s, size, o) { return K3.txt(x, y, s, size, o) }
  function r(x, y, w, h, rr, fill, o) { return K3.rect(x, y, w, h, rr, fill, o) }
  function degradeOr(id, vertical) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (vertical ? 0 : 1) + '" y2="' + (vertical ? 1 : 1) + '"><stop offset="0" stop-color="' + OR1 + '"/><stop offset="1" stop-color="' + OR2 + '"/></linearGradient>' }
  K8.degradeOr = degradeOr

  // Titre : comme K7.titre, mot mis en valeur en teal (jamais de rose).
  K8.titre = function (lignes, lt, o) { return K7.titre(lignes, lt, o).replace(/#E0218A/g, TEAL) }
  // Pilule : fond blanc, contour fin teal ou encre.
  K8.pilule = function (cx, cy, txt, p, contour) {
    if (p !== undefined && p <= 0) return ''
    var q = p === undefined ? 1 : Math.min(1, p), w = K7.largeur(txt, 'ArchivoX', 900, 14) + txt.length + 34
    return '<g opacity="' + Math.min(1, q * 1.5).toFixed(3) + '" transform="translate(' + n1(cx) + ',' + n1(cy + (1 - q) * 10) + ')"><rect x="' + n1(-w / 2) + '" y="-19" width="' + n1(w) + '" height="38" rx="19" fill="#fff" stroke="' + (contour || TEAL) + '" stroke-width="2"/>' +
      '<text y="5.5" text-anchor="middle" ' + AR + ' font-size="14" letter-spacing="1" fill="' + INK + '">' + F.esc(txt) + '</text></g>'
  }
  // Macaron : anneau teal -> orange (le logo central garde son « in »).
  K8.macaron = function (cx, cy, rr, p, rot) {
    return K7.macaron(cx, cy, rr, p, rot).replace(/<linearGradient id="(mg\d+)"[^>]*>.*?<\/linearGradient>/, function (m, id) {
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + TEAL + '"/><stop offset=".44" stop-color="' + TEAL + '"/><stop offset=".56" stop-color="' + OR1 + '"/><stop offset="1" stop-color="' + OR2 + '"/></linearGradient>'
    })
  }
  // Fiche contact (gris = endormie ; sinon pastille menthe).
  K8.fiche = function (x, y, w, rot, nom, etiq, gris) { return K7.fiche(x, y, w, rot, nom, etiq, gris).replace(/#F7B9D6/g, K8.PA.menthe) }
  // Téléphone blanc à contour fin.
  K8.phone = function (x, y, w, h, rot, ecran) {
    var cid = F.id('k8'), m = 7, sw = w - 2 * m, sh = h - 2 * m, rr = w * 0.15
    return '<g transform="translate(' + n1(x) + ',' + n1(y) + ') rotate(' + (rot || 0) + ')">' +
      '<rect x="' + n1(-w / 2 + 4) + '" y="' + n1(-h / 2 + 8) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(rr) + '" fill="rgba(21,12,28,.10)"/>' +
      '<rect x="' + n1(-w / 2) + '" y="' + n1(-h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="' + n1(rr) + '" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>' +
      '<g transform="translate(' + n1(-sw / 2) + ',' + n1(-sh / 2) + ')"><clipPath id="' + cid + '"><rect width="' + n1(sw) + '" height="' + n1(sh) + '" rx="' + n1(rr - m) + '"/></clipPath><g clip-path="url(#' + cid + ')">' + ecran(sw, sh) + '</g>' +
      '<rect width="' + n1(sw) + '" height="' + n1(sh) + '" rx="' + n1(rr - m) + '" fill="none" stroke="' + TRAIT + '" stroke-width="1"/></g>' +
      '<rect x="' + n1(-w * 0.12) + '" y="' + n1(-h / 2 + 3) + '" width="' + n1(w * 0.24) + '" height="4" rx="2" fill="' + INK + '" opacity=".25"/></g>'
  }

  /* ── Écrans joueur clairs (mêmes contenus que les vrais écrans) ── */
  K8.entete = function (u, nom, tag) {
    var bid = F.id('b8')
    return '<defs>' + degradeOr(bid) + '</defs>' + r(0, 0, 240 * u, 70 * u, 0, '#fff') + '<path d="M0,' + 70 * u + ' L' + 240 * u + ',' + 70 * u + '" stroke="' + TRAIT + '" stroke-width="' + u + '"/>' +
      r(14 * u, 26 * u, 30 * u, 30 * u, 10 * u, 'url(#' + bid + ')') + t(29 * u, 46 * u, nom.charAt(0), 15 * u, { anchor: 'middle', fill: '#fff' }) +
      t(52 * u, 40 * u, nom, 13.5 * u, {}) + t(52 * u, 53 * u, tag, 8 * u, { fill: MUT, ls: 0.6 * u })
  }
  function fond(sw, sh) { return r(0, 0, sw, sh, 0, '#fff') }
  K8.quiz = function (nom, choix, q) {
    q = q || { l1: 'Quel fruit est riche', l2: 'en vitamine C ?', o: ['Le kiwi', 'Le riz', 'Le pain', 'Le sucre'], ok: 0 }
    return function (sw, sh) {
      var u = sw / 240, g = fond(sw, sh) + K8.entete(u, nom, 'QUIZ · JEU GRATUIT')
      g += t(14 * u, 96 * u, '2 / 5', 10.5 * u, { w: 700, fill: MUT }) + r(44 * u, 91 * u, 182 * u, 4 * u, 2 * u, '#E6ECEA') + r(44 * u, 91 * u, 73 * u, 4 * u, 2 * u, TEAL)
      g += t(14 * u, 128 * u, q.l1, 17 * u, {}) + t(14 * u, 150 * u, q.l2, 17 * u, {})
      q.o.forEach(function (o, k) {
        var y = (172 + k * 50) * u, ok = k === q.ok ? choix : 0
        g += r(14 * u, y, 212 * u, 40 * u, 12 * u, ok ? 'rgba(0,180,160,' + (0.14 * ok).toFixed(3) + ')' : GRIS, { stroke: ok > 0.5 ? TEAL : TRAIT, sw: 1.5 * u })
        g += t(28 * u, y + 25 * u, o, 13 * u, { w: 700 })
        if (ok > 0) g += K3.op(ok, K3.check(206 * u, y + 20 * u, 10 * u, TEAL))
      })
      return g
    }
  }
  K8.roue = function (nom, angle) {
    var segs = ['Bon -10 %', 'Perdu', 'Cadeau', 'Perdu', 'Bon 5 €', 'Perdu'], cols = [TEAL, '#fff', OR1, '#fff', '#5BB8E8', '#fff']
    return function (sw, sh) {
      var u = sw / 240, g = fond(sw, sh) + K8.entete(u, nom, 'ROUE · JEU GRATUIT'), cx = 120 * u, cy = 200 * u, R = 88 * u, n = 6
      g += '<g transform="rotate(' + n1(angle) + ' ' + n1(cx) + ' ' + n1(cy) + ')">'
      for (var i = 0; i < n; i++) {
        var a1 = i * 2 * Math.PI / n - Math.PI / 2, a2 = a1 + 2 * Math.PI / n, am = (a1 + a2) / 2, tx = cx + R * 0.62 * Math.cos(am), ty = cy + R * 0.62 * Math.sin(am)
        g += '<path d="M' + n1(cx) + ',' + n1(cy) + ' L' + n1(cx + R * Math.cos(a1)) + ',' + n1(cy + R * Math.sin(a1)) + ' A' + n1(R) + ',' + n1(R) + ' 0 0 1 ' + n1(cx + R * Math.cos(a2)) + ',' + n1(cy + R * Math.sin(a2)) + ' Z" fill="' + cols[i] + '" stroke="' + INK + '" stroke-width="' + n1(1.2 * u) + '"/>'
        g += '<text x="' + n1(tx) + '" y="' + n1(ty + 4 * u) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + n1(10 * u) + '" fill="' + (cols[i] === '#fff' ? INK : '#fff') + '" transform="rotate(' + n1(am * 180 / Math.PI + 90) + ' ' + n1(tx) + ' ' + n1(ty) + ')">' + segs[i] + '</text>'
      }
      g += '</g><circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="' + n1(R) + '" fill="none" stroke="' + INK + '" stroke-width="' + n1(2 * u) + '"/><circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="' + n1(13 * u) + '" fill="#fff" stroke="' + INK + '" stroke-width="' + n1(1.5 * u) + '"/>'
      g += '<path d="M' + n1(cx - 10 * u) + ',' + n1(cy - R - 10 * u) + ' L' + n1(cx + 10 * u) + ',' + n1(cy - R - 10 * u) + ' L' + n1(cx) + ',' + n1(cy - R + 10 * u) + ' Z" fill="' + INK + '"/>'
      g += r(30 * u, 318 * u, 180 * u, 40 * u, 20 * u, TEAL) + t(120 * u, 343 * u, 'Faire tourner la roue', 12.5 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }
  K8.tombola = function (nom) {
    return function (sw, sh) {
      var u = sw / 240, g = fond(sw, sh) + K8.entete(u, nom, 'TOMBOLA · JEU GRATUIT')
      g += K3.check(120 * u, 140 * u, 30 * u, TEAL) + t(120 * u, 205 * u, 'Tu es dans la course !', 17 * u, { anchor: 'middle' })
      g += t(120 * u, 226 * u, 'Ton numéro de tombola a été enregistré', 9.5 * u, { anchor: 'middle', w: 600, fill: MUT })
      g += r(26 * u, 246 * u, 188 * u, 70 * u, 14 * u, GRIS, { stroke: TRAIT, sw: u }) + t(120 * u, 270 * u, 'Ton ticket tombola', 12 * u, { anchor: 'middle' }) + t(120 * u, 300 * u, 'TB-0427', 20 * u, { anchor: 'middle', fill: OR2, ls: 2 * u })
      return g
    }
  }
  K8.score = function (sw, sh) {
    return fond(sw, sh) + t(sw / 2, sh * 0.36, 'TON SCORE', sw * 0.05, { anchor: 'middle', fill: MUT, ls: sw * 0.006 }) +
      t(sw / 2, sh * 0.52, '5/5', sw * 0.26, { anchor: 'middle' }) + t(sw / 2, sh * 0.6, 'Ticket acquis.', sw * 0.065, { anchor: 'middle', fill: TEAL }) +
      r(sw * 0.2, sh * 0.68, sw * 0.6, sh * 0.075, sh * 0.037, '#fff', { stroke: TEAL, sw: 2 }) + t(sw / 2, sh * 0.728, '+1 ticket au tirage', sw * 0.055, { anchor: 'middle' })
  }
  K8.gain = function (nom, lot) {
    return function (sw, sh) {
      var u = sw / 240, g = fond(sw, sh) + K8.entete(u, nom, 'ROUE · JEU GRATUIT'), gid = F.id('g8')
      g += '<defs>' + degradeOr(gid) + '</defs><circle cx="' + sw / 2 + '" cy="' + 140 * u + '" r="' + 32 * u + '" fill="url(#' + gid + ')"/>' + '<path d="M' + (sw / 2 - 13 * u) + ',' + 140 * u + ' L' + (sw / 2 - 3 * u) + ',' + 150 * u + ' L' + (sw / 2 + 15 * u) + ',' + 130 * u + '" stroke="#fff" stroke-width="' + 6 * u + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      g += t(sw / 2, 210 * u, 'Tu as gagné !', 22 * u, { anchor: 'middle' })
      g += r(22 * u, 232 * u, 196 * u, 58 * u, 14 * u, GRIS, { stroke: TRAIT, sw: u }) + t(sw / 2, 258 * u, lot, 15 * u, { anchor: 'middle' }) + t(sw / 2, 278 * u, nom, 10 * u, { anchor: 'middle', w: 600, fill: MUT })
      g += r(22 * u, 306 * u, 196 * u, 40 * u, 20 * u, TEAL) + t(sw / 2, 331 * u, 'Voir mon billet', 13 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }
  K8.billet = function (lot, commerce) {
    return function (sw, sh) {
      var u = sw / 240, g = r(0, 0, sw, sh, 0, GRIS) + r(10 * u, 30 * u, 220 * u, 340 * u, 18 * u, '#fff', { stroke: TRAIT, sw: u })
      g += '<path d="M' + 10 * u + ',' + 48 * u + ' Q' + 10 * u + ',' + 30 * u + ' ' + 28 * u + ',' + 30 * u + ' L' + 212 * u + ',' + 30 * u + ' Q' + 230 * u + ',' + 30 * u + ' ' + 230 * u + ',' + 48 * u + ' L' + 230 * u + ',' + 84 * u + ' L' + 10 * u + ',' + 84 * u + ' Z" fill="' + TEAL + '"/>'
      g += t(24 * u, 55 * u, 'GRAND JEU', 8.5 * u, { fill: '#fff', ls: 1.6 * u }) + t(24 * u, 69 * u, 'ÉDITION 2026', 8.5 * u, { fill: 'rgba(255,255,255,.8)', ls: 1.6 * u })
      g += r(10 * u, 84 * u, 220 * u, 4 * u, 0, OR1)
      g += t(120 * u, 108 * u, 'COMMERCE PARTENAIRE', 7.5 * u, { anchor: 'middle', fill: MUT, ls: 1.4 * u }) + t(120 * u, 126 * u, commerce, 14 * u, { anchor: 'middle' }) + t(120 * u, 156 * u, lot, 13 * u, { anchor: 'middle', fill: TEAL })
      var q = 110 * u
      g += F.qr(120 * u - q / 2, 176 * u, q) + t(120 * u, 318 * u, 'PQ-2026-4128', 12 * u, { anchor: 'middle', ls: 1.2 * u }) + t(120 * u, 338 * u, 'Le commerçant scanne ce code pour valider', 8 * u, { anchor: 'middle', w: 600, fill: MUT })
      return g
    }
  }
  K8.scan = function (sw, sh) {
    var q = sw * 0.56, qx = (sw - q) / 2, qy = sh * 0.3, c = sw * 0.12, m = 20, x0 = qx - m, y0 = qy - m, x1 = qx + q + m, y1 = qy + q + m
    return r(0, 0, sw, sh, 0, '#EEF3F1') + F.qr(qx, qy, q) +
      '<path d="M' + x0 + ',' + (y0 + c) + ' L' + x0 + ',' + y0 + ' L' + (x0 + c) + ',' + y0 + ' M' + (x1 - c) + ',' + y0 + ' L' + x1 + ',' + y0 + ' L' + x1 + ',' + (y0 + c) + ' M' + x1 + ',' + (y1 - c) + ' L' + x1 + ',' + y1 + ' L' + (x1 - c) + ',' + y1 + ' M' + (x0 + c) + ',' + y1 + ' L' + x0 + ',' + y1 + ' L' + x0 + ',' + (y1 - c) + '" stroke="' + TEAL + '" stroke-width="' + sw * 0.025 + '" fill="none" stroke-linecap="round"/>' +
      r(sw * 0.14, sh * 0.8, sw * 0.72, sh * 0.07, sh * 0.035, '#fff', { stroke: TEAL, sw: 2 }) + t(sw / 2, sh * 0.845, 'Station de jeu détectée', sw * 0.056, { anchor: 'middle' })
  }
  // Écrans pro clairs : en-tête blanc, logo Flowin, accents teal.
  // (couleurs pro réglées par le scénario v8 : K8.chartePro())
  K8.chartePro = function () { K3.PRO.fond = GRIS; K3.PRO.acc = TEAL; K3.PRO.acc2 = '#5BB8E8'; K3.PRO.or = OR1 }
  K8.proFond = function (sw, sh, u, titre, sous) {
    var g = r(0, 0, sw, sh, 0, GRIS) + r(0, 0, sw, 58 * u, 0, '#fff') + '<path d="M0,' + 58 * u + ' L' + sw + ',' + 58 * u + '" stroke="' + TRAIT + '" stroke-width="' + u + '"/>'
    g += K7.logo(40 * u, 40 * u, 15 * u) + t(70 * u, 40 * u, 'Pro', 11 * u, { fill: TEAL })
    g += t(14 * u, 86 * u, titre, 15 * u, {})
    if (sous) g += t(14 * u, 100 * u, sous, 8.5 * u, { w: 600, fill: MUT })
    return g
  }
  // Écran statistiques sans fuchsia ni violet (couleurs remplacées).
  K8.stats = function (p, mode) {
    var f = K3.ecranStats(p, mode)
    return function (sw, sh) { var pf = K3.proFond; K3.proFond = K8.proFond; var s = f(sw, sh); K3.proFond = pf; return s.replace(/#E0218A/g, OR1).replace(/#7C3AED/g, '#7DD8C6') }
  }
  K8.tirage = function (e, lot) {
    var f = K3.ecranTirage(e, lot)
    return function (sw, sh) { var pf = K3.proFond; K3.proFond = K8.proFond; var s = f(sw, sh); K3.proFond = pf; return s }
  }
  K8.retrait = function (e, code, commerce, lot) {
    var f = K3.ecranRetrait(e, code, commerce, lot)
    return function (sw, sh) { return f(sw, sh).replace(/#f2edf7/g, GRIS).replace(/#7C2D92/gi, TEAL).replace(/#E0218A/g, TEAL) }
  }

  /* ── Vignettes de supports (objets dessinés, palette claire) ── */
  function carte(w, h, inner) { return r(-w / 2 + 3, -h / 2 + 5, w, h, 14, 'rgba(21,12,28,.08)') + r(-w / 2, -h / 2, w, h, 14, '#fff', { stroke: INK, sw: 2 }) + inner }
  K8.vignette = function (k, x, y, w, p) {
    if (p <= 0) return ''
    var h = w * 1.05, g = '', gid = F.id('v8')
    if (k === 'affiche') {
      g = carte(w, h, r(-w * 0.3, -h * 0.36, w * 0.6, h * 0.72, 4, K8.BG.menthe, { stroke: INK, sw: 1.6 }) + r(-w * 0.3, -h * 0.36, w * 0.6, h * 0.2, 4, TEAL) +
        t(0, -h * 0.22, 'JEU', w * 0.12, { anchor: 'middle', fill: '#fff' }) + r(-w * 0.14, -h * 0.08, w * 0.28, w * 0.28, 3, '#fff', { stroke: INK, sw: 1.2 }) + r(-w * 0.2, h * 0.24, w * 0.4, h * 0.05, 2, INK, { op: 0.25 }) +
        '<circle cx="' + n1(-w * 0.3) + '" cy="' + n1(-h * 0.36) + '" r="3" fill="' + INK + '"/><circle cx="' + n1(w * 0.3) + '" cy="' + n1(-h * 0.36) + '" r="3" fill="' + INK + '"/>')
    } else if (k === 'reseaux') {
      g = carte(w, h, '<circle cx="' + n1(-w * 0.28) + '" cy="' + n1(-h * 0.33) + '" r="' + n1(w * 0.08) + '" fill="' + TEAL + '"/>' + r(-w * 0.16, -h * 0.37, w * 0.4, h * 0.05, 2, INK, { op: 0.7 }) +
        r(-w * 0.38, -h * 0.22, w * 0.76, h * 0.42, 6, K8.BG.ciel) + '<circle cx="' + n1(w * 0.12) + '" cy="' + n1(-h * 0.06) + '" r="' + n1(w * 0.1) + '" fill="#fff"/>' +
        '<path d="M' + n1(-w * 0.38) + ',' + n1(h * 0.14) + ' L' + n1(-w * 0.12) + ',' + n1(-h * 0.06) + ' L' + n1(w * 0.06) + ',' + n1(h * 0.1) + ' L' + n1(w * 0.18) + ',' + n1(h * 0.02) + ' L' + n1(w * 0.38) + ',' + n1(h * 0.2) + ' L' + n1(-w * 0.38) + ',' + n1(h * 0.2) + ' Z" fill="#5BB8E8"/>' +
        '<path d="M' + n1(-w * 0.3) + ',' + n1(h * 0.33) + ' c-5,-5 -12,0 -6,6 l6,6 l6,-6 c6,-6 -1,-11 -6,-6 Z" fill="' + OR2 + '"/>' + r(-w * 0.14, h * 0.3, w * 0.42, h * 0.05, 2, INK, { op: 0.25 }))
    } else if (k === 'flyer') {
      g = '<g transform="rotate(-6)">' + carte(w * 0.8, h, '<defs>' + degradeOr(gid, true) + '</defs>' + r(-w * 0.32, -h * 0.42, w * 0.64, h * 0.34, 6, 'url(#' + gid + ')') + t(0, -h * 0.2, '-20 %', w * 0.16, { anchor: 'middle', fill: '#fff' }) +
        r(-w * 0.28, h * 0.0, w * 0.56, h * 0.05, 2, INK, { op: 0.6 }) + r(-w * 0.28, h * 0.1, w * 0.42, h * 0.05, 2, INK, { op: 0.25 }) + r(-w * 0.28, h * 0.2, w * 0.5, h * 0.05, 2, INK, { op: 0.25 }) + r(-w * 0.28, h * 0.31, w * 0.3, h * 0.07, 3, TEAL)) + '</g>'
    } else {
      // campagne : bus vu de côté avec panneau publicitaire
      var bw = w * 0.92, bh = w * 0.5
      g = r(-bw / 2, -bh / 2, bw, bh, 12, '#fff', { stroke: INK, sw: 2 }) + r(-bw / 2 + 6, -bh / 2 + 6, bw * 0.3, bh * 0.32, 4, K8.BG.ciel, { stroke: INK, sw: 1.2 }) +
        r(-bw * 0.12, -bh / 2 + 6, bw * 0.56, bh * 0.56, 5, '#fff', { stroke: TEAL, sw: 2 }) + t(bw * 0.16, -bh * 0.04, 'VOTRE PUB', bw * 0.09, { anchor: 'middle', fill: TEAL }) +
        '<circle cx="' + n1(-bw * 0.28) + '" cy="' + n1(bh / 2) + '" r="' + n1(bh * 0.18) + '" fill="#fff" stroke="' + INK + '" stroke-width="2"/><circle cx="' + n1(bw * 0.28) + '" cy="' + n1(bh / 2) + '" r="' + n1(bh * 0.18) + '" fill="#fff" stroke="' + INK + '" stroke-width="2"/>'
    }
    var q = F.easeOut(Math.min(1, p))
    return '<g opacity="' + Math.min(1, q * 1.4).toFixed(3) + '" transform="translate(' + n1(x) + ',' + n1(y + (1 - q) * 14) + ')">' + g + '</g>'
  }
  // Passant stylisé : capsule pastel à contour fin, sans visage.
  K8.passant = function (x, y, s, col, lt, ph) {
    var b = Math.abs(Math.sin(lt * 7 + ph)) * 3
    return '<g transform="translate(' + n1(x) + ',' + n1(y - b) + ') scale(' + s + ')"><rect x="-17" y="-58" width="34" height="58" rx="17" fill="' + col + '" stroke="' + INK + '" stroke-width="2.2"/><circle cy="-72" r="12" fill="' + col + '" stroke="' + INK + '" stroke-width="2.2"/></g>'
  }
  window.K8 = K8
})()
