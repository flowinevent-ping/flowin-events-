/* Briques v9 : palette A « Soleil du Sud ». Fonds crème #FFF6EC et blanc
   en alternance, texte brun-encre #3B2418, filets #F3D9C4, accent corail
   #F26B4F, orange #F5A100 (dégradé #F5A100 -> #EC5B45 réservé à la pilule
   Plug & Play et aux grands chiffres), prune #8E3B6E rare, teal #13A89E
   secondaire. Aucun fuchsia (sauf le « in » du logo), aucun noir plein.
   K9.chaud() réchauffe la sortie des briques v3 à v8 (encre, gris, teal,
   menthe, ciel, lilas -> palette A) ; K9.charte() règle les écrans pro et
   ne doit être appelé que par le scénario v9. */
(function () {
  var F = window.FH, K3 = window.K3, K7 = window.K7, K8 = window.K8, C = F.C
  var K9 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  var INK = '#3B2418', CORAIL = '#F26B4F', OR1 = '#F5A100', OR2 = '#EC5B45', PRUNE = '#8E3B6E', TEAL = '#13A89E'
  var LINE = '#F3D9C4', CREME = '#FFF6EC', MUT = '#8A6F60'
  K9.C = { ink: INK, corail: CORAIL, or1: OR1, or2: OR2, prune: PRUNE, teal: TEAL, line: LINE, creme: CREME, mut: MUT }
  K9.BG = { creme: CREME, blanc: '#FFFFFF' }
  // Teintes claires (bandes décalées, taches, avatars).
  K9.PA = { corail: '#FBC7B8', or: '#FFD89A', prune: '#E9C6DA', teal: '#BDE8E2', peche: '#FFE3CC' }
  var AR = 'font-family="ArchivoX" font-weight="900"'
  function t(x, y, s, size, o) { return K3.txt(x, y, s, size, o) }
  function r(x, y, w, h, rr, fill, o) { return K3.rect(x, y, w, h, rr, fill, o) }
  function circ(cx, cy, rr, fill, o) { o = o || {}; return '<circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="' + n1(rr) + '" fill="' + fill + '"' + (o.stroke ? ' stroke="' + o.stroke + '" stroke-width="' + (o.sw || 2) + '"' : '') + (o.op !== undefined ? ' opacity="' + (+o.op).toFixed(3) + '"' : '') + '/>' }
  K9.circ = circ

  /* ── Réchauffage de la sortie des briques précédentes ── */
  var MAP = [
    ['#150C1C', INK], ['rgba(21,12,28,', 'rgba(59,36,24,'], ['#0B0710', INK], ['#1c1024', INK],
    ['#00B4A0', CORAIL], ['rgba(0,180,160,', 'rgba(242,107,79,'], ['#5BB8E8', TEAL], ['#7DD8C6', '#D9A0C2'],
    ['#9FE3D6', K9.PA.corail], ['#B4DCF6', K9.PA.or], ['#F7B9D6', K9.PA.corail], ['#D9F2EA', CREME], ['#D7EEF9', CREME],
    ['#F6F7F5', CREME], ['#DCE3E0', LINE], ['#E6ECEA', '#F7E6D8'], ['#EEF3F1', CREME],
    ['#f2edf7', CREME], ['#faf7fc', '#FFFAF4'], ['#e4dcec', LINE], ['#efeaf4', LINE], ['#e7def0', LINE], ['#e4dee9', LINE],
    ['#cdbfd8', '#F9CDBF'], ['#c9d6f5', '#F9CDBF'], ['#eef4ff', '#FFF1EA'], ['#7c7389', MUT], ['#8d8499', MUT], ['#8a7e93', MUT], ['#9d8fab', MUT],
    ['#6b6174', '#7A5E50'], ['#eee8f3', '#F7EBDD'], ['#E4E0E8', '#EFE3D8'], ['#9a92a3', '#A89080'], ['#ECE8F0', '#F5E9DE'], ['#F4F0F8', CREME],
    ['#1e9e6a', TEAL], ['rgba(30,158,106,', 'rgba(19,168,158,'], ['#7C3AED', '#D9A0C2'], ['#7C2D92', PRUNE], ['#2563EB', CORAIL], ['#0EA5E9', TEAL]
  ]
  var RE = MAP.map(function (m) { return [new RegExp(m[0].replace(/[()]/g, '\\$&'), 'gi'), m[1]] })
  K9.chaud = function (s) { for (var i = 0; i < RE.length; i++) s = s.replace(RE[i][0], RE[i][1]); return s }

  // Écrans pro et en-têtes joueur aux couleurs v9 (appelé par v9-s3.js seulement).
  K9.charte = function () {
    var P = K3.PRO
    P.fond = CREME; P.bord = LINE; P.texte = INK; P.mut = MUT; P.acc = CORAIL; P.acc2 = TEAL; P.or = OR1; P.vio = PRUNE; P.ok = TEAL
    C.violet = CORAIL
    K8.entete = K9.entete
  }

  /* ── Typographie ── */
  K9.titre = function (lignes, lt, o) { return K7.titre(lignes, lt, o).replace(/#E0218A/g, CORAIL) }
  K9.sous = function (lignes, lt, o) {
    return K7.sous(lignes, lt, o).replace(/stroke="#150C1C" stroke-width="2"\/>/, 'stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>')
  }
  K9.pilule = function (cx, cy, txt, p) { return K8.pilule(cx, cy, txt, p, CORAIL) }
  // Grand chiffre en contour, bande décalée en dégradé orange -> corail.
  K9.grand = function (txt, cx, y, size, lt) {
    var p = F.easeOut(F.prog(lt, 0.1, 0.5)), gid = F.id('gd')
    return '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + OR1 + '"/><stop offset="1" stop-color="' + OR2 + '"/></linearGradient></defs>' +
      '<g transform="translate(' + cx + ',' + y + ') scale(' + (0.85 + 0.15 * p).toFixed(3) + ')">' + K7.contour(txt, 0, 0, size, 'url(#' + gid + ')', p, 'middle') + '</g>'
  }

  /* ── Macaron, fiches, téléphone ── */
  K9.macaron = function (cx, cy, rr, p, rot) {
    return K7.macaron(cx, cy, rr, p, rot).replace(/<linearGradient id="(mg\d+)"[^>]*>.*?<\/linearGradient>/, function (m, id) {
      return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + CORAIL + '"/><stop offset="1" stop-color="' + OR1 + '"/></linearGradient>'
    })
  }
  K9.fiche = function (x, y, w, rot, nom, avatar) { return K7.fiche(x, y, w, rot, nom, '', false).replace(/#F7B9D6/g, avatar || K9.PA.corail) }
  K9.phone = function (x, y, w, h, rot, ecran) { return K8.phone(x, y, w, h, rot, ecran) }

  /* ── Écrans joueur ── */
  K9.entete = function (u, nom, tag) {
    return r(0, 0, 240 * u, 70 * u, 0, '#fff') + '<path d="M0,' + 70 * u + ' L' + 240 * u + ',' + 70 * u + '" stroke="' + LINE + '" stroke-width="' + u + '"/>' +
      r(14 * u, 26 * u, 30 * u, 30 * u, 10 * u, CORAIL) + t(29 * u, 46 * u, nom.charAt(0), 15 * u, { anchor: 'middle', fill: '#fff' }) +
      t(52 * u, 40 * u, nom, 13.5 * u, { fill: INK }) + t(52 * u, 53 * u, tag, 8 * u, { fill: MUT, ls: 0.6 * u })
  }
  // Quiz personnalisé au nom du commerce.
  K9.quiz = function (nom, choix, q) {
    q = q || { l1: 'Quelle farine pour', l2: 'la tradition ?', o: ['T45', 'T65', 'T110', 'T150'], ok: 1 }
    return function (sw, sh) {
      var u = sw / 240, g = r(0, 0, sw, sh, 0, '#fff') + K9.entete(u, nom, 'QUIZ · JEU GRATUIT')
      g += t(14 * u, 94 * u, '2 / 5', 10.5 * u, { w: 700, fill: MUT }) + r(44 * u, 89 * u, 182 * u, 4 * u, 2 * u, '#F7E6D8') + r(44 * u, 89 * u, 73 * u, 4 * u, 2 * u, CORAIL)
      g += r(14 * u, 104 * u, 108 * u, 18 * u, 9 * u, K9.PA.peche) + t(68 * u, 116.5 * u, 'QUESTION MAISON', 7.5 * u, { anchor: 'middle', fill: OR2, ls: 0.8 * u })
      g += t(14 * u, 144 * u, q.l1, 16.5 * u, { fill: INK }) + t(14 * u, 165 * u, q.l2, 16.5 * u, { fill: INK })
      q.o.forEach(function (o, k) {
        var y = (182 + k * 46) * u, ok = k === q.ok ? choix : 0
        g += r(14 * u, y, 212 * u, 38 * u, 12 * u, ok ? 'rgba(242,107,79,' + (0.14 * ok).toFixed(3) + ')' : CREME, { stroke: ok > 0.5 ? CORAIL : LINE, sw: 1.5 * u })
        g += t(28 * u, y + 24 * u, o, 13 * u, { w: 800, fill: INK })
        if (ok > 0) g += K3.op(ok, K3.check(206 * u, y + 19 * u, 10 * u, CORAIL))
      })
      return g
    }
  }
  K9.gain = function (nom, lot) {
    return function (sw, sh) {
      var u = sw / 240, g = r(0, 0, sw, sh, 0, '#fff') + K9.entete(u, nom, 'QUIZ · JEU GRATUIT')
      g += circ(sw / 2, 140 * u, 32 * u, CORAIL) + '<path d="M' + n1(sw / 2 - 13 * u) + ',' + n1(140 * u) + ' L' + n1(sw / 2 - 3 * u) + ',' + n1(150 * u) + ' L' + n1(sw / 2 + 15 * u) + ',' + n1(130 * u) + '" stroke="#fff" stroke-width="' + n1(6 * u) + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      g += t(sw / 2, 210 * u, 'Tu as gagné !', 22 * u, { anchor: 'middle', fill: INK })
      g += r(22 * u, 232 * u, 196 * u, 58 * u, 14 * u, CREME, { stroke: LINE, sw: u }) + t(sw / 2, 258 * u, lot, 15 * u, { anchor: 'middle', fill: INK }) + t(sw / 2, 278 * u, nom, 10 * u, { anchor: 'middle', w: 600, fill: MUT })
      g += r(22 * u, 306 * u, 196 * u, 40 * u, 20 * u, CORAIL) + t(sw / 2, 331 * u, 'Voir mon billet', 13 * u, { anchor: 'middle', fill: '#fff' })
      return g
    }
  }
  // Fichier client : p = 0 en sommeil, 1 actif (l'onde réveille ligne à ligne).
  K9.ecranFichier = function (p) {
    var noms = ['M•••• D.', 'S•••• L.', 'A•••• B.', 'K•••• R.', 'C•••• M.'], av = [K9.PA.corail, K9.PA.or, K9.PA.teal, K9.PA.prune, K9.PA.corail]
    return function (sw, sh) {
      var u = sw / 240, g = r(0, 0, sw, sh, 0, '#fff')
      g += r(0, 0, sw, 106 * u, 0, CREME) + '<path d="M0,' + n1(106 * u) + ' L' + n1(sw) + ',' + n1(106 * u) + '" stroke="' + LINE + '" stroke-width="' + n1(u) + '"/>'
      g += t(16 * u, 48 * u, 'Mes clients', 19 * u, { fill: INK }) + t(16 * u, 64 * u, 'Fichier client', 9 * u, { w: 700, fill: MUT })
      var on = p >= 0.5, pw = on ? 92 * u : 128 * u
      g += r(16 * u, 74 * u, pw, 24 * u, 12 * u, on ? CORAIL : '#EFE3D8') + t(16 * u + pw / 2, 90.5 * u, on ? 'ACTIF' : 'EN SOMMEIL', 10.5 * u, { anchor: 'middle', fill: on ? '#fff' : MUT, ls: 1.2 * u })
      noms.forEach(function (n, i) {
        var y = (122 + i * 52) * u, e = F.clamp(p * 1.6 - i * 0.12, 0, 1), a = e > 0.5
        g += r(12 * u, y, 216 * u, 44 * u, 12 * u, a ? '#fff' : '#FBF5EF', { stroke: a ? LINE : '#F2E8DE', sw: u })
        g += circ(34 * u, y + 22 * u, 13 * u, a ? av[i] : '#EFE3D8')
        g += t(56 * u, y + 19 * u, n, 12 * u, { fill: a ? INK : '#B9A698' })
        g += t(56 * u, y + 34 * u, a ? 'Vient de jouer' : 'Aucune visite depuis 8 mois', 8.5 * u, { w: 700, fill: a ? CORAIL : '#C7B6A9' })
        if (a) g += circ(212 * u, y + 22 * u, 5 * u, CORAIL)
      })
      return g
    }
  }
  // Petits « z » de sommeil.
  K9.zzz = function (x, y, lt, op) {
    var g = ''
    for (var k = 0; k < 3; k++) {
      var ph = (lt * 0.6 + k / 3) % 1
      g += '<text x="' + n1(x + ph * 26) + '" y="' + n1(y - ph * 60) + '" ' + AR + ' font-size="' + n1(18 + k * 6) + '" fill="' + MUT + '" opacity="' + ((1 - ph) * op).toFixed(3) + '">z</text>'
    }
    return g
  }

  /* ── Le lieu : devanture et passants ── */
  // Devanture : (x, y) = coin haut gauche, largeur w (hauteur 0,92 w).
  K9.devanture = function (x, y, w, o) {
    o = o || {}
    var h = w * 0.92, s = w / 380, g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') scale(' + s.toFixed(4) + ')">'
    // Façade
    g += r(4, 8, 380, 350, 10, 'rgba(59,36,24,.08)') + r(0, 0, 380, 350, 10, '#fff', { stroke: INK, sw: 3 })
    // Enseigne
    g += r(16, 14, 348, 52, 8, CREME, { stroke: INK, sw: 2.5 }) + t(190, 50, o.nom || 'BOULANGERIE EXEMPLE', o.nomSize || 17, { anchor: 'middle', fill: INK, ls: 2 }).replace('font-family="Manrope" font-weight="800"', AR)
    // Store à rayures festonné
    var sy = 78, sh = 44, n = 10, bw = 380 / n
    for (var i = 0; i < n; i++) {
      var col = i % 2 ? '#fff' : CORAIL
      g += '<path d="M' + n1(i * bw) + ',' + sy + ' L' + n1((i + 1) * bw) + ',' + sy + ' L' + n1((i + 1) * bw) + ',' + (sy + sh) + ' A' + n1(bw / 2) + ',' + n1(bw / 2.4) + ' 0 0 1 ' + n1(i * bw) + ',' + (sy + sh) + ' Z" fill="' + col + '" stroke="' + INK + '" stroke-width="2"/>'
    }
    // Vitrine
    g += r(18, 150, 222, 190, 6, '#FFF1E2', { stroke: INK, sw: 2.5 })
    g += '<path d="M30,166 L70,166 M30,176 L52,176" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
    g += '<path d="M30,300 L228,300" stroke="' + INK + '" stroke-width="2.5"/>'
    // Pains en vitrine
    ;[[62, 288, 26, -10], [112, 290, 30, 8], [170, 288, 26, -6]].forEach(function (b) {
      g += '<g transform="translate(' + b[0] + ',' + b[1] + ') rotate(' + b[3] + ')"><ellipse rx="' + b[2] + '" ry="' + n1(b[2] * 0.42) + '" fill="#E6A25C" stroke="' + INK + '" stroke-width="2"/><path d="M' + n1(-b[2] * 0.5) + ',-3 l6,6 M-3,-4 l6,6 M' + n1(b[2] * 0.4) + ',-3 l6,6" stroke="#FFE3CC" stroke-width="2.5" stroke-linecap="round"/></g>'
    })
    // Porte
    g += r(262, 150, 100, 200, 6, K9.PA.peche, { stroke: INK, sw: 2.5 }) + r(278, 166, 68, 84, 5, '#FFF1E2', { stroke: INK, sw: 2 }) + circ(348, 262, 5, INK)
    g += t(312, 300, 'OUVERT', 13, { anchor: 'middle', fill: CORAIL, ls: 1.5 })
    g += '</g>'
    // Macaron collé sur la vitrine (coordonnées écran)
    if (o.macaron !== false) g += K9.macaron(x + 176 * s, y + 222 * s, (o.macR || 50) * s, o.macP === undefined ? 1 : o.macP, -8)
    return g
  }
  K9.devantureGeo = function (x, y, w) { var s = w / 380; return { s: s, sol: y + 350 * s, mac: [x + 176 * s, y + 222 * s], porte: x + 312 * s } }
  // Passant : silhouette simple sans visage, pieds en (x, y).
  K9.passant = function (x, y, s, col, tete, phase, o) {
    o = o || {}
    var marche = o.arret ? 0 : 1, a = Math.sin(phase) * 22 * marche, b = Math.abs(Math.sin(phase)) * 2.5 * marche
    var g = '<g transform="translate(' + n1(x) + ',' + n1(y - b) + ') scale(' + (o.dir === -1 ? -s : s).toFixed(3) + ',' + s.toFixed(3) + ')">'
    g += '<ellipse cx="0" cy="' + n1(b / s) + '" rx="20" ry="4" fill="rgba(59,36,24,.12)"/>'
    // Jambes
    g += '<g transform="rotate(' + n1(a) + ' 0 -44)"><rect x="-6" y="-46" width="11" height="46" rx="5.5" fill="' + INK + '"/></g>'
    g += '<g transform="rotate(' + n1(-a) + ' 0 -44)"><rect x="-5" y="-46" width="11" height="46" rx="5.5" fill="' + INK + '"/></g>'
    // Bras arrière
    if (!o.phone) g += '<g transform="rotate(' + n1(-a * 0.8) + ' 0 -88)"><rect x="-5" y="-90" width="10" height="44" rx="5" fill="' + col + '" stroke="' + INK + '" stroke-width="2"/></g>'
    // Corps
    g += '<path d="M-19,-40 L-17,-84 Q-17,-96 -5,-96 L5,-96 Q17,-96 17,-84 L19,-40 Q19,-36 15,-36 L-15,-36 Q-19,-36 -19,-40 Z" fill="' + col + '" stroke="' + INK + '" stroke-width="2.2"/>'
    // Bras avant (ou bras levé tenant le téléphone)
    if (o.phone) g += '<path d="M6,-86 L30,-98" stroke="' + col + '" stroke-width="10" stroke-linecap="round"/><path d="M6,-86 L30,-98" stroke="' + INK + '" stroke-width="2" stroke-linecap="round" opacity="0"/>' +
      '<g transform="translate(34,-104) rotate(-10)"><rect x="-8" y="-14" width="16" height="28" rx="4" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/><rect x="-5" y="-10" width="10" height="17" rx="2" fill="' + K9.PA.corail + '"/></g>'
    else g += '<g transform="rotate(' + n1(a * 0.8) + ' 0 -88)"><rect x="-5" y="-90" width="10" height="44" rx="5" fill="' + col + '" stroke="' + INK + '" stroke-width="2"/></g>'
    // Tête
    g += '<circle cy="-111" r="13" fill="' + tete + '" stroke="' + INK + '" stroke-width="2.2"/>'
    return g + '</g>'
  }
  K9.TENUES = [[CORAIL, '#6B4232'], [TEAL, '#3B2418'], [OR1, '#A0623F'], [PRUNE, '#8E5A3C'], ['#E89A6B', '#5A3A2A']]

  /* ── Affiche « JOUEZ ICI » (palette A, assortie au macaron) ── */
  K9.affiche = function (x, y, w, rot) {
    var h = w * 1.41, g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') rotate(' + (rot || 0) + ')">'
    g += r(-w / 2 + 5, -h / 2 + 8, w, h, w * 0.05, 'rgba(59,36,24,.12)') + r(-w / 2, -h / 2, w, h, w * 0.05, CREME, { stroke: INK, sw: Math.max(1.5, w * 0.014) })
    // En-tête corail, soleil orange
    var hb = h * 0.3, cid = F.id('af')
    g += '<clipPath id="' + cid + '"><rect x="' + n1(-w / 2) + '" y="' + n1(-h / 2) + '" width="' + n1(w) + '" height="' + n1(hb) + '" rx="' + n1(w * 0.05) + '"/></clipPath>'
    g += '<g clip-path="url(#' + cid + ')">' + r(-w / 2, -h / 2, w, hb + w * 0.05, 0, CORAIL) + circ(w * 0.36, -h / 2 + hb * 0.15, w * 0.24, OR1) + '</g>'
    g += '<path d="M' + n1(-w / 2) + ',' + n1(-h / 2 + hb) + ' L' + n1(w / 2) + ',' + n1(-h / 2 + hb) + '" stroke="' + INK + '" stroke-width="' + n1(Math.max(1.5, w * 0.014)) + '"/>'
    g += '<text x="' + n1(-w * 0.4) + '" y="' + n1(-h / 2 + hb * 0.46) + '" ' + AR + ' font-size="' + n1(w * 0.19) + '" fill="#fff">JOUEZ</text>'
    g += '<text x="' + n1(-w * 0.4) + '" y="' + n1(-h / 2 + hb * 0.86) + '" ' + AR + ' font-size="' + n1(w * 0.19) + '" fill="' + K9.PA.peche + '">ICI !</text>'
    // Macaron au centre
    g += K9.macaron(0, -h / 2 + hb + w * 0.37, w * 0.3, 1, 0)
    g += t(0, h * 0.28, 'Flashez · jouez · gagnez', w * 0.068, { anchor: 'middle', fill: INK })
    g += t(0, h * 0.345, 'Jeu gratuit, sans achat', w * 0.05, { anchor: 'middle', w: 700, fill: MUT })
    g += r(-w / 2 + w * 0.08, h * 0.39, w * 0.84, w * 0.012, 0, LINE)
    g += K7.logo(0, h * 0.465, w * 0.11)
    return g + '</g>'
  }

  /* ── Vignettes des supports (chacune sur un fond crème) ── */
  function socle(w, h) { return r(-w / 2, -h / 2, w, h, 16, CREME, { stroke: LINE, sw: 2 }) }
  K9.vignette = function (k, x, y, w, p) {
    if (p <= 0) return ''
    var h = w * 1.06, g = socle(w, h)
    if (k === 'affiche') {
      // Mur de briques, grande affiche scotchée
      var cid = F.id('mur'), mur = ''
      for (var j = 0; j < 7; j++) {
        var yy = -h / 2 + j * h / 7
        mur += '<path d="M' + n1(-w / 2) + ',' + n1(yy) + ' L' + n1(w / 2) + ',' + n1(yy) + '" stroke="#EBC4A6" stroke-width="1.5"/>'
        for (var i2 = 0; i2 < 4; i2++) { var xx = -w / 2 + (i2 + (j % 2 ? 0.5 : 0)) * w / 3.5; mur += '<path d="M' + n1(xx) + ',' + n1(yy) + ' L' + n1(xx) + ',' + n1(yy + h / 7) + '" stroke="#EBC4A6" stroke-width="1.5"/>' }
      }
      g = '<clipPath id="' + cid + '"><rect x="' + n1(-w / 2) + '" y="' + n1(-h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="16"/></clipPath>' +
        r(-w / 2, -h / 2, w, h, 16, '#F8DCC6') + '<g clip-path="url(#' + cid + ')">' + mur + '</g>' + r(-w / 2, -h / 2, w, h, 16, 'none', { stroke: LINE, sw: 2 })
      g += K9.affiche(0, 2, w * 0.6, -2)
      g += '<rect x="' + n1(-w * 0.3) + '" y="' + n1(-h * 0.4) + '" width="' + n1(w * 0.18) + '" height="' + n1(w * 0.06) + '" fill="rgba(255,246,236,.85)" transform="rotate(-30 ' + n1(-w * 0.22) + ' ' + n1(-h * 0.37) + ')"/>'
      g += '<rect x="' + n1(w * 0.14) + '" y="' + n1(-h * 0.4) + '" width="' + n1(w * 0.18) + '" height="' + n1(w * 0.06) + '" fill="rgba(255,246,236,.85)" transform="rotate(30 ' + n1(w * 0.22) + ' ' + n1(-h * 0.37) + ')"/>'
    } else if (k === 'flyer') {
      // Petit flyer tenu en main
      g += '<g transform="rotate(-8)">' + r(-w * 0.27, -h * 0.4, w * 0.54, h * 0.66, 6, '#fff', { stroke: INK, sw: 2 }) + r(-w * 0.27, -h * 0.4, w * 0.54, h * 0.24, 6, CORAIL) + r(-w * 0.27, -h * 0.22, w * 0.54, h * 0.06, 0, CORAIL) +
        t(0, -h * 0.215, '-20 %', w * 0.17, { anchor: 'middle', fill: '#fff' }).replace('font-family="Manrope" font-weight="800"', AR) +
        r(-w * 0.19, -h * 0.08, w * 0.38, h * 0.04, 2, INK, { op: 0.55 }) + r(-w * 0.19, -h * 0.01, w * 0.28, h * 0.04, 2, INK, { op: 0.25 }) +
        r(-w * 0.19, h * 0.07, w * 0.14, w * 0.14, 2, INK, { op: 0.8 }) + r(-w * 0.16, h * 0.1, w * 0.08, w * 0.08, 1, '#fff') + r(w * 0.0, h * 0.09, w * 0.18, h * 0.04, 2, OR1) + '</g>'
      // Main (paume + pouce) en bas
      g += '<path d="M' + n1(-w * 0.34) + ',' + n1(h * 0.5) + ' L' + n1(-w * 0.3) + ',' + n1(h * 0.22) + ' Q' + n1(-w * 0.28) + ',' + n1(h * 0.12) + ' ' + n1(-w * 0.16) + ',' + n1(h * 0.12) + ' L' + n1(w * 0.18) + ',' + n1(h * 0.12) + ' Q' + n1(w * 0.3) + ',' + n1(h * 0.14) + ' ' + n1(w * 0.3) + ',' + n1(h * 0.28) + ' L' + n1(w * 0.3) + ',' + n1(h * 0.5) + ' Z" fill="#E9B68E" stroke="' + INK + '" stroke-width="2"/>'
      g += '<path d="M' + n1(-w * 0.22) + ',' + n1(h * 0.2) + ' Q' + n1(-w * 0.26) + ',' + n1(h * 0.02) + ' ' + n1(-w * 0.14) + ',' + n1(-h * 0.02) + ' Q' + n1(-w * 0.06) + ',' + n1(0) + ' ' + n1(-w * 0.08) + ',' + n1(h * 0.1) + ' L' + n1(-w * 0.1) + ',' + n1(h * 0.2) + ' Z" fill="#E9B68E" stroke="' + INK + '" stroke-width="2"/>'
      g += '<path d="M' + n1(w * 0.02) + ',' + n1(h * 0.24) + ' L' + n1(w * 0.22) + ',' + n1(h * 0.24) + ' M' + n1(w * 0.02) + ',' + n1(h * 0.33) + ' L' + n1(w * 0.22) + ',' + n1(h * 0.33) + '" stroke="' + INK + '" stroke-width="1.6" opacity=".35" stroke-linecap="round"/>'
    } else if (k === 'reseaux') {
      // Post dans un téléphone
      var pw = w * 0.56, ph2 = h * 0.86
      g += r(-pw / 2 + 3, -ph2 / 2 + 5, pw, ph2, pw * 0.16, 'rgba(59,36,24,.10)') + r(-pw / 2, -ph2 / 2, pw, ph2, pw * 0.16, '#fff', { stroke: INK, sw: 2.2 })
      var x0 = -pw / 2 + 6, w0 = pw - 12, y0 = -ph2 / 2 + 14
      g += circ(x0 + 8, y0 + 8, 7, 'none', { stroke: CORAIL, sw: 2 }) + circ(x0 + 8, y0 + 8, 4.5, OR1) + r(x0 + 19, y0 + 5, w0 * 0.5, 5, 2.5, INK, { op: 0.6 })
      var iy = y0 + 22, ih = w0
      g += r(x0, iy, w0, ih, 3, K9.PA.peche) + circ(x0 + w0 * 0.68, iy + ih * 0.34, w0 * 0.15, OR1)
      g += '<path d="M' + n1(x0) + ',' + n1(iy + ih * 0.8) + ' Q' + n1(x0 + w0 * 0.3) + ',' + n1(iy + ih * 0.45) + ' ' + n1(x0 + w0 * 0.55) + ',' + n1(iy + ih * 0.72) + ' Q' + n1(x0 + w0 * 0.78) + ',' + n1(iy + ih * 0.55) + ' ' + n1(x0 + w0) + ',' + n1(iy + ih * 0.7) + ' L' + n1(x0 + w0) + ',' + n1(iy + ih) + ' L' + n1(x0) + ',' + n1(iy + ih) + ' Z" fill="' + CORAIL + '"/>'
      var by = iy + ih + 12
      g += '<path d="M' + n1(x0 + 8) + ',' + n1(by + 4) + ' c-4,-5 -10,-1 -6,4 l6,6 l6,-6 c4,-5 -2,-9 -6,-4 Z" fill="' + CORAIL + '"/>'
      g += '<path d="M' + n1(x0 + 24) + ',' + n1(by - 2) + ' h12 a3,3 0 0 1 3,3 v6 a3,3 0 0 1 -3,3 h-7 l-4,3 v-3 h-1 a3,3 0 0 1 -3,-3 v-6 a3,3 0 0 1 3,-3 Z" fill="none" stroke="' + INK + '" stroke-width="1.6"/>'
      g += r(x0, by + 16, w0 * 0.8, 4.5, 2, INK, { op: 0.25 }) + r(x0, by + 25, w0 * 0.55, 4.5, 2, INK, { op: 0.25 })
    } else {
      // Bus avec visuel publicitaire
      var bw = w * 0.94, bh = w * 0.56, bx = -bw / 2, byy = -bh / 2 - 4
      g += '<path d="M' + n1(-w / 2 + 6) + ',' + n1(bh / 2 + 14) + ' L' + n1(w / 2 - 6) + ',' + n1(bh / 2 + 14) + '" stroke="' + LINE + '" stroke-width="3" stroke-linecap="round"/>'
      g += r(bx + 3, byy + 5, bw, bh, 10, 'rgba(59,36,24,.10)') + r(bx, byy, bw, bh, 10, '#fff', { stroke: INK, sw: 2.2 })
      for (var wi = 0; wi < 5; wi++) g += r(bx + 6 + wi * (bw - 12) / 5, byy + 6, (bw - 12) / 5 - 4, bh * 0.24, 3, K9.PA.peche, { stroke: INK, sw: 1.2 })
      g += r(bx + 6, byy + bh * 0.38, bw * 0.72, bh * 0.5, 4, CORAIL) + t(bx + 6 + bw * 0.36, byy + bh * 0.62, 'JOUEZ', bw * 0.13, { anchor: 'middle', fill: '#fff' }).replace('font-family="Manrope" font-weight="800"', AR) +
        t(bx + 6 + bw * 0.36, byy + bh * 0.8, 'ICI !', bw * 0.12, { anchor: 'middle', fill: K9.PA.peche }).replace('font-family="Manrope" font-weight="800"', AR)
      g += r(bx + bw * 0.8, byy + bh * 0.38, bw * 0.15, bh * 0.56, 3, K9.PA.peche, { stroke: INK, sw: 1.2 })
      g += circ(bx + bw * 0.24, byy + bh, bh * 0.15, INK) + circ(bx + bw * 0.24, byy + bh, bh * 0.06, CREME) + circ(bx + bw * 0.76, byy + bh, bh * 0.15, INK) + circ(bx + bw * 0.76, byy + bh, bh * 0.06, CREME)
    }
    var q = F.easeOut(Math.min(1, p))
    return '<g opacity="' + Math.min(1, q * 1.4).toFixed(3) + '" transform="translate(' + n1(x) + ',' + n1(y + (1 - q) * 14) + ')">' + g + '</g>'
  }

  /* ── Fin ── */
  K9.carteQR = function (cx, y, taille, p) {
    var w = taille + 56, h = taille + 100, x = cx - w / 2
    return K3.op(p, r(x + 4, y + 10, w, h, 26, 'rgba(59,36,24,.12)') + r(x, y, w, h, 26, '#fff', { stroke: LINE, sw: 2 }) + F.qr(cx - taille / 2, y + 28, taille, INK) +
      t(cx, y + taille + 64, 'Scannez pour', 19, { anchor: 'middle', fill: INK }) + t(cx, y + taille + 86, 'voir les offres', 19, { anchor: 'middle', fill: CORAIL }))
  }
  window.K9 = K9
})()
