/* Briques partagées des vidéos participants style H (palette pastel) :
   textes encre, pastilles d'étape, plan de ville, écrans de gain et de
   billet, scène de festival, cartes de jeux et de lots. */
(function () {
  var F = window.FH, C = F.C, INK = C.ink
  var K = {}
  K.T = function (x, y, t, o) { o = o || {}; o.fill = o.fill || INK; return F.texte(x, y, t, o) }
  // Petit texte sous les mots géants (une ou deux lignes).
  K.sous = function (lignes, lt, o) {
    o = o || {}
    var g = '', op = o.img0 ? 1 : F.easeOut(F.prog(lt, o.a === undefined ? 0.5 : o.a, 0.4))
    ;[].concat(lignes).forEach(function (l, i) { g += K.T(30, F._basMots + 36 + i * 30, l, { size: o.size || 23, w: 700, op: op, fill: o.fill }) })
    F._basSous = F._basMots + 36 + ([].concat(lignes).length - 1) * 30
    return g
  }
  K.pastille = function (n, lt) {
    var p = F.easeOut(F.prog(lt, 0.05, 0.3)), s = 0.6 + 0.4 * p
    return '<g opacity="' + p.toFixed(3) + '" transform="translate(56,128) scale(' + s.toFixed(3) + ')"><circle r="26" fill="' + INK + '"/><text y="11" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="31" fill="#fff">' + n + '</text></g>'
  }
  K.etiquette = function (t, lt) {
    var p = F.easeOut(F.prog(lt, 0.05, 0.3)), w = 26 + t.length * 11.5
    return '<g opacity="' + p.toFixed(3) + '"><rect x="30" y="108" width="' + w + '" height="38" rx="19" fill="' + INK + '"/><text x="' + (30 + w / 2) + '" y="133" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="16" letter-spacing="2" fill="#fff">' + t + '</text></g>'
  }
  K.progres = function (n, N) {
    var g = '<text x="30" y="858" font-family="Manrope" font-weight="800" font-size="14" letter-spacing="1.6" fill="' + INK + '" opacity=".7">ÉTAPE ' + n + '/' + N + '</text>', w = 248 / N
    for (var k = 0; k < N; k++) g += '<rect x="' + (140 + k * w) + '" y="848" width="' + (w - 8) + '" height="6" rx="3" fill="' + INK + '" opacity="' + (k < n ? 0.85 : 0.18) + '"/>'
    return g
  }
  // Pastille de station (carré encre avec motif QR) qui apparaît.
  K.station = function (x, y, p, s) {
    s = s || 1
    if (p <= 0) return '<rect x="' + (x - 16 * s) + '" y="' + (y - 16 * s) + '" width="' + 32 * s + '" height="' + 32 * s + '" rx="' + 9 * s + '" fill="' + INK + '" opacity=".14"/>'
    var k = 0.6 + 0.4 * p
    return '<g transform="translate(' + x + ',' + y + ') scale(' + (k * s).toFixed(3) + ')" opacity="' + p.toFixed(3) + '"><rect x="-18" y="-18" width="36" height="36" rx="10" fill="' + INK + '"/>' +
      '<rect x="-10" y="-10" width="8" height="8" fill="#fff"/><rect x="2" y="-10" width="8" height="8" fill="#fff"/><rect x="-10" y="2" width="8" height="8" fill="#fff"/><rect x="4" y="4" width="4" height="4" fill="#fff"/></g>'
  }
  K.scene = function (x, y, p, s) {
    s = s || 1
    return '<g transform="translate(' + x + ',' + y + ') scale(' + s + ')" opacity="' + (0.25 + 0.75 * p).toFixed(3) + '"><circle r="' + (30 + 10 * p) + '" fill="' + (p > 0 ? C.mag : INK) + '"' + (p > 0 ? '' : ' opacity=".18"') + '/>' +
      '<path d="M-22,6 Q0,-22 22,6 Z" fill="#fff" opacity="' + p.toFixed(3) + '"/></g>'
  }
  // Plan de ville : rues blanches, stations et (option) scène, (option) piste pointillée.
  K.plan = function (top, lt, o) {
    o = o || {}
    var g = '', bot = 752, h = bot - top
    var ys = [top + h * 0.18, top + h * 0.52, top + h * 0.86], xs = [110, 250, 380]
    var rues = ''
    ys.forEach(function (y) { rues += 'M30,' + y.toFixed(0) + ' L450,' + y.toFixed(0) + ' ' })
    xs.forEach(function (x) { rues += 'M' + x + ',' + top + ' L' + x + ',' + bot + ' ' })
    g += '<path d="' + rues + '" stroke="#fff" stroke-width="16" stroke-linecap="round" opacity=".85"/>'
    var pts = o.pts || [[66, top + h * 0.34], [180, top + h * 0.08], [320, top + h * 0.34], [420, top + h * 0.68], [190, top + h * 0.7], [320, top + h * 0.97]]
    if (o.piste) {
      var tot = 0, seg = []
      for (var i = 1; i < pts.length; i++) { var d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push(d); tot += d }
      var lim = tot * F.prog(lt, o.piste[0], o.piste[1]), acc = 0
      for (var j = 0; j < seg.length; j++) for (var u = 0; u < seg[j]; u += 15) {
        if (acc + u > lim) break
        var f = u / seg[j]
        g += '<circle cx="' + (pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f).toFixed(1) + '" cy="' + (pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f).toFixed(1) + '" r="3.6" fill="' + C.mag + '"/>'
      }
      for (var q = 0; q < seg.length; q++) acc += seg[q]
    }
    pts.forEach(function (s, k) {
      var a = (o.a || 0.7) + k * (o.pas || 0.3), p = F.easeOut(F.prog(lt, a, 0.3))
      if (o.fest && k === o.fest) g += K.scene(s[0], s[1], p)
      else g += K.station(s[0], s[1], p)
      g += F.flash(s[0], s[1], lt, a, 1)
      if (o.nums && p > 0) g += '<text x="' + (s[0] + 22) + '" y="' + (s[1] - 14) + '" font-family="Manrope" font-weight="800" font-size="15" fill="' + INK + '" opacity="' + p.toFixed(3) + '">' + (k + 1) + '</text>'
    })
    return g
  }
  // Écran « Tu as gagné ! » (gain immédiat : roue en mode immédiat, règle de gain).
  K.ecranGain = function (sw, sh) {
    var u = sw / 240
    return F.degradeQuiz(sw, sh) + F.entete(u, 'ROUE · STATION DE JEU') +
      '<circle cx="' + sw / 2 + '" cy="' + 150 * u + '" r="' + 34 * u + '" fill="' + C.gold + '"/><path d="M' + (sw / 2 - 14 * u) + ',' + 150 * u + ' L' + (sw / 2 - 3 * u) + ',' + 161 * u + ' L' + (sw / 2 + 16 * u) + ',' + 139 * u + '" stroke="#fff" stroke-width="' + 6 * u + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<text x="' + sw / 2 + '" y="' + 222 * u + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + 22 * u + '" fill="#fff">Tu as gagné !</text>' +
      '<rect x="' + 22 * u + '" y="' + 242 * u + '" width="' + 196 * u + '" height="' + 58 * u + '" rx="' + 14 * u + '" fill="rgba(255,255,255,.1)" stroke="rgba(255,255,255,.2)" stroke-width="' + u + '"/>' +
      '<text x="' + sw / 2 + '" y="' + 268 * u + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + 15 * u + '" fill="#fff">Bon d’achat 20 €</text>' +
      '<text x="' + sw / 2 + '" y="' + 288 * u + '" text-anchor="middle" font-family="Manrope" font-weight="600" font-size="' + 10 * u + '" fill="rgba(255,255,255,.6)">Boulangerie Les Tilleuls</text>' +
      '<rect x="' + 22 * u + '" y="' + 316 * u + '" width="' + 196 * u + '" height="' + 40 * u + '" rx="' + 20 * u + '" fill="#fff"/>' +
      '<text x="' + sw / 2 + '" y="' + 341 * u + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + 13 * u + '" fill="' + C.violet + '">Voir mon billet</text>'
  }
  // Billet de retrait (public/lot.html) : présenté au commerçant, validé avec son code.
  K.ecranBillet = function (valide) {
    return function (sw, sh) {
      var u = sw / 240, g = '<rect width="' + sw + '" height="' + sh + '" fill="#f2edf7"/>'
      g += '<rect x="' + 12 * u + '" y="' + 28 * u + '" width="' + 216 * u + '" height="' + 300 * u + '" rx="' + 18 * u + '" fill="#fff"/>'
      g += '<path d="M' + 12 * u + ',' + 46 * u + ' Q' + 12 * u + ',' + 28 * u + ' ' + 30 * u + ',' + 28 * u + ' L' + 210 * u + ',' + 28 * u + ' Q' + 228 * u + ',' + 28 * u + ' ' + 228 * u + ',' + 46 * u + ' L' + 228 * u + ',' + 96 * u + ' L' + 12 * u + ',' + 96 * u + ' Z" fill="#5f1f74"/>'
      g += '<text x="' + 26 * u + '" y="' + 56 * u + '" font-family="Manrope" font-weight="800" font-size="' + 8.5 * u + '" letter-spacing="' + 0.8 * u + '" fill="rgba(255,255,255,.65)">COMMERCE PARTENAIRE</text>'
      g += '<text x="' + 26 * u + '" y="' + 78 * u + '" font-family="Manrope" font-weight="800" font-size="' + 15 * u + '" fill="#fff">Boulangerie Les Tilleuls</text>'
      g += '<rect x="' + 26 * u + '" y="' + 108 * u + '" width="' + (valide ? 92 : 84) * u + '" height="' + 20 * u + '" rx="' + 10 * u + '" fill="' + (valide ? '#e5f7ee' : '#f6eefb') + '"/>'
      g += '<text x="' + 36 * u + '" y="' + 122 * u + '" font-family="Manrope" font-weight="800" font-size="' + 9.5 * u + '" fill="' + (valide ? '#12A87B' : C.violet) + '">' + (valide ? 'Retrait validé' : 'Billet valable') + '</text>'
      g += '<text x="' + 26 * u + '" y="' + 152 * u + '" font-family="Manrope" font-weight="700" font-size="' + 9 * u + '" fill="#9d8fab">Bon cadeau</text>'
      g += '<text x="' + 26 * u + '" y="' + 172 * u + '" font-family="Manrope" font-weight="800" font-size="' + 17 * u + '" fill="' + INK + '">Bon d’achat 20 €</text>'
      g += '<text x="' + 26 * u + '" y="' + 202 * u + '" font-family="Manrope" font-weight="700" font-size="' + 9 * u + '" fill="#9d8fab">N° de billet</text>'
      g += '<text x="' + 26 * u + '" y="' + 220 * u + '" font-family="Manrope" font-weight="800" font-size="' + 13 * u + '" fill="' + INK + '">PQ-2026-4128</text>'
      g += '<path d="M' + 26 * u + ',' + 240 * u + ' L' + 214 * u + ',' + 240 * u + '" stroke="#e4dee9" stroke-width="' + 1.4 * u + '" stroke-dasharray="' + 5 * u + ' ' + 4 * u + '"/>'
      g += '<text x="' + 26 * u + '" y="' + 266 * u + '" font-family="Manrope" font-weight="700" font-size="' + 10 * u + '" fill="#4a4058">' + (valide ? 'Le lot peut être remis au client.' : 'Présentez ce billet au commerce.') + '</text>'
      if (valide) g += '<circle cx="' + 120 * u + '" cy="' + 400 * u + '" r="' + 28 * u + '" fill="#12A87B"/><path d="M' + 107 * u + ',' + 400 * u + ' L' + 117 * u + ',' + 410 * u + ' L' + 134 * u + ',' + 391 * u + '" stroke="#fff" stroke-width="' + 6 * u + '" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
      return g
    }
  }
  // Scène de festival : fanions, scène, silhouettes pleines sans visage.
  K.festival = function (top, lt) {
    var g = '', cols = [C.mag, '#fff', INK, C.gold]
    g += '<path d="M30,' + (top + 10) + ' Q240,' + (top + 70) + ' 450,' + (top + 10) + '" stroke="' + INK + '" stroke-width="2" fill="none"/>'
    for (var k = 0; k < 10; k++) {
      var t = (k + 0.5) / 10, x = 30 + 420 * t, y = top + 10 + 120 * t * (1 - t) * 1.0
      g += '<path d="M' + (x - 14) + ',' + (y - 1) + ' L' + (x + 14) + ',' + (y + 1) + ' L' + x + ',' + (y + 30) + ' Z" fill="' + cols[k % 4] + '"/>'
    }
    var sy = top + 110
    g += '<path d="M70,' + (sy + 200) + ' L70,' + (sy + 40) + ' Q240,' + (sy - 30) + ' 410,' + (sy + 40) + ' L410,' + (sy + 200) + ' Z" fill="' + INK + '"/>'
    g += '<rect x="96" y="' + (sy + 120) + '" width="288" height="80" fill="#fff" opacity=".12"/>'
    for (var b = 0; b < 3; b++) g += '<path d="M' + (150 + b * 90) + ',' + (sy + 50) + ' L' + (130 + b * 90) + ',' + (sy + 200) + ' L' + (170 + b * 90) + ',' + (sy + 200) + ' Z" fill="' + C.gold + '" opacity="' + (0.25 + 0.15 * Math.sin(lt * 3 + b)).toFixed(3) + '"/>'
    for (var p = 0; p < 7; p++) {
      var px = 50 + p * 66, ph = 56 + (p % 3) * 12, py = sy + 270, bob = Math.sin(lt * 4 + p) * 4
      g += '<g transform="translate(' + px + ',' + (py + bob).toFixed(1) + ')" fill="' + INK + '"><circle cy="' + (-ph) + '" r="17"/><path d="M-28,10 Q-28,' + (-ph + 22) + ' 0,' + (-ph + 22) + ' Q28,' + (-ph + 22) + ' 28,10 Z"/></g>'
      if (p % 3 === 1) g += '<path d="M' + (px + 20) + ',' + (py - ph + 20 + bob) + ' L' + (px + 34) + ',' + (py - ph - 22 + bob) + '" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/>'
    }
    return g
  }
  // Cartes blanches (jeux, lots) en grille 2 x 2.
  K.cartes = function (y0, lt, items, a, pas) {
    var g = ''
    items.forEach(function (c, k) {
      var x = 30 + (k % 2) * 214, y = y0 + Math.floor(k / 2) * 146, p = F.easeOut(F.prog(lt, a + k * pas, 0.45))
      if (p <= 0) return
      g += '<g opacity="' + p.toFixed(3) + '" transform="translate(' + (x + (1 - p) * 50) + ',' + y + ')"><rect width="200" height="132" rx="18" fill="#fff"/>' + K.icone(c[1], 40, 44)
      var lignes = c[0].split('|')
      lignes.forEach(function (l, i) { g += '<text class="safe" x="20" y="' + (lignes.length > 1 ? 94 + i * 24 : 112) + '" font-family="Manrope" font-weight="800" font-size="' + (lignes.length > 1 ? 20 : 25) + '" fill="' + INK + '">' + l + '</text>' })
      g += '</g>'
    })
    return g
  }
  K.icone = function (k, x, y) {
    if (k === 'quiz') return '<circle cx="' + x + '" cy="' + y + '" r="24" fill="' + C.mag + '"/><text x="' + x + '" y="' + (y + 10) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="28" fill="#fff">?</text>'
    if (k === 'roue') {
      var g = '', cols = [C.mag, C.gold, C.lilac, C.mint]
      for (var i = 0; i < 8; i++) { var a1 = i * Math.PI / 4, a2 = a1 + Math.PI / 4; g += '<path d="M' + x + ',' + y + ' L' + (x + 24 * Math.cos(a1)).toFixed(1) + ',' + (y + 24 * Math.sin(a1)).toFixed(1) + ' A24,24 0 0 1 ' + (x + 24 * Math.cos(a2)).toFixed(1) + ',' + (y + 24 * Math.sin(a2)).toFixed(1) + ' Z" fill="' + cols[i % 4] + '"/>' }
      return g + '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#fff"/><path d="M' + (x - 6) + ',' + (y - 30) + ' L' + (x + 6) + ',' + (y - 30) + ' L' + x + ',' + (y - 20) + ' Z" fill="' + INK + '"/>'
    }
    if (k === 'tombola' || k === 'place') return '<g transform="translate(' + x + ',' + y + ') rotate(-8)"><rect x="-28" y="-17" width="56" height="34" rx="6" fill="' + (k === 'place' ? C.mag : C.gold) + '"/><circle cx="-28" cy="0" r="6" fill="#fff"/><circle cx="28" cy="0" r="6" fill="#fff"/><path d="M-10,-13 L-10,13" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/></g>'
    if (k === 'vote') return '<rect x="' + (x - 24) + '" y="' + (y - 18) + '" width="10" height="36" rx="4" fill="' + C.teal + '" opacity=".45"/><rect x="' + (x - 8) + '" y="' + (y - 30) + '" width="10" height="48" rx="4" fill="' + C.teal + '"/><rect x="' + (x + 8) + '" y="' + (y - 8) + '" width="10" height="26" rx="4" fill="' + C.teal + '" opacity=".45"/>'
    if (k === 'cadeau') return '<rect x="' + (x - 22) + '" y="' + (y - 10) + '" width="44" height="30" rx="4" fill="' + C.gold + '"/><rect x="' + (x - 26) + '" y="' + (y - 20) + '" width="52" height="12" rx="3" fill="' + C.mag + '"/><rect x="' + (x - 4) + '" y="' + (y - 20) + '" width="8" height="40" fill="#fff"/>'
    if (k === 'goodies') return '<path d="M' + (x - 22) + ',' + (y - 12) + ' L' + (x + 22) + ',' + (y - 12) + ' L' + (x + 18) + ',' + (y + 24) + ' L' + (x - 18) + ',' + (y + 24) + ' Z" fill="' + C.lilac + '"/><path d="M' + (x - 10) + ',' + (y - 12) + ' Q' + (x - 10) + ',' + (y - 30) + ' ' + x + ',' + (y - 30) + ' Q' + (x + 10) + ',' + (y - 30) + ' ' + (x + 10) + ',' + (y - 12) + '" stroke="' + INK + '" stroke-width="3" fill="none"/><text x="' + x + '" y="' + (y + 12) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="13" fill="' + C.mag + '">in</text>'
    if (k === 'boutique') return '<rect x="' + (x - 22) + '" y="' + (y - 6) + '" width="44" height="30" rx="3" fill="' + C.sky + '"/><path d="M' + (x - 26) + ',' + (y - 6) + ' L' + (x - 20) + ',' + (y - 22) + ' L' + (x + 20) + ',' + (y - 22) + ' L' + (x + 26) + ',' + (y - 6) + ' Z" fill="' + C.mag + '"/><rect x="' + (x - 6) + '" y="' + (y + 6) + '" width="12" height="18" fill="' + INK + '"/>'
    return ''
  }
  window.KH = K
})()
