/* Briques v5 (retours client sur la v4) : taches de peinture nettes et
   « finies » (contour vectoriel lisse, une ou deux coulures franches, trois
   gouttes), pastilles rondes à picto, cadran de mesure, carte QR de fin. */
(function () {
  var F = window.FH, K3 = window.K3, C = F.C, INK = C.ink, MAG = C.mag
  var K5 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  function rnd(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280 } }

  // Courbe fermée lisse (Catmull-Rom -> Bézier) passant par des points.
  function lisse(pts) {
    var n = pts.length, d = 'M' + n1(pts[0][0]) + ',' + n1(pts[0][1])
    for (var i = 0; i < n; i++) {
      var p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]
      d += ' C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ',' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + n1(p2[0] - (p3[0] - p1[0]) / 6) + ',' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n1(p2[0]) + ',' + n1(p2[1])
    }
    return d + 'Z'
  }
  K5.lisse = lisse
  // Tache nette : contour lisse à 10 points, coulures franches, 3 gouttes.
  K5.tache = function (cx, cy, r, col, seed, p, o) {
    if (p <= 0) return ''
    o = o || {}
    var R = rnd(seed || 1), imp = F.easeOut(F.clamp(p / 0.4, 0, 1)), cou = F.easeInOut(F.clamp((p - 0.25) / 0.75, 0, 1))
    var rr = r * (0.55 + 0.45 * imp), N = 8, pts = []
    for (var i = 0; i < N; i++) {
      var a = i / N * Math.PI * 2, k = 0.9 + R() * 0.18
      pts.push([Math.cos(a) * rr * k, Math.sin(a) * rr * k])
    }
    var g = '<g transform="translate(' + n1(cx) + ',' + n1(cy) + ')" fill="' + col + '"><path d="' + lisse(pts) + '"/>'
    var nc = o.coulures === undefined ? 2 : o.coulures
    for (var c = 0; c < nc; c++) {
      var x = (c === 0 ? -0.35 : 0.3) * rr + (R() - 0.5) * rr * 0.15, w = rr * (0.14 + R() * 0.05), L = rr * (0.45 + R() * 0.35) * cou
      var y0 = Math.sqrt(Math.max(0, rr * rr * 0.8 - x * x)) - w * 0.6
      if (L > 1) g += '<rect x="' + n1(x - w / 2) + '" y="' + n1(y0) + '" width="' + n1(w) + '" height="' + n1(L + w / 2) + '" rx="' + n1(w / 2) + '"/>'
    }
    var gs = [[1.25, -0.6], [1.2, 0.5], [-1.22, -0.35]]
    gs.forEach(function (q, j) {
      var a = q[1] + (R() - 0.5) * 0.3, d = rr * q[0], dr = rr * (0.07 + 0.04 * j) * imp
      g += '<circle cx="' + n1(Math.cos(a) * d * (q[0] < 0 ? -1 : 1)) + '" cy="' + n1(Math.sin(a) * d) + '" r="' + n1(dr) + '"/>'
    })
    return g + '</g>'
  }
  // Pastille ronde : ombre douce, fond blanc, contour fin, picto centré.
  K5.pastille = function (x, y, r, inner, p) {
    var q = p === undefined ? 1 : p
    if (q <= 0) return ''
    var s = 0.7 + 0.3 * F.easeOut(q)
    return '<g opacity="' + Math.min(1, q * 2).toFixed(3) + '" transform="translate(' + n1(x) + ',' + n1(y) + ') scale(' + s.toFixed(3) + ')">' +
      '<circle cy="5" r="' + n1(r) + '" fill="rgba(21,12,28,.14)"/><circle r="' + n1(r) + '" fill="#fff" stroke="rgba(21,12,28,.18)" stroke-width="1.5"/>' + inner + '</g>'
  }
  // Valeur qui monte, hésite puis se fixe.
  K5.hesite = function (lt, a, cible, f) {
    var t = lt - a
    if (t <= 0) return 0
    var m = F.easeOut(F.clamp(t / 0.8, 0, 1))
    return F.clamp(cible * m + Math.sin(t * (f || 5)) * 0.25 * Math.exp(-t * 0.9) * m, 0, 1)
  }
  // Cadran de mesure (demi-cercle) : zones teal / or / magenta, aiguille.
  K5.cadran = function (cx, cy, r, v) {
    var g = '', zones = [[C.teal, 0, 0.34], [C.gold, 0.34, 0.67], [MAG, 0.67, 1]], ep = r * 0.22
    zones.forEach(function (z) {
      var a1 = Math.PI * (1 + z[1]) + 0.02, a2 = Math.PI * (1 + z[2]) - 0.02, rm = r - ep / 2
      g += '<path d="M' + n1(cx + rm * Math.cos(a1)) + ',' + n1(cy + rm * Math.sin(a1)) + ' A' + n1(rm) + ',' + n1(rm) + ' 0 0 1 ' + n1(cx + rm * Math.cos(a2)) + ',' + n1(cy + rm * Math.sin(a2)) + '" stroke="' + z[0] + '" stroke-width="' + n1(ep) + '" fill="none" stroke-linecap="butt"/>'
    })
    for (var k = 0; k <= 10; k++) {
      var a = Math.PI * (1 + k / 10), r1 = r - ep - 8, r2 = r - ep - (k % 5 ? 18 : 28)
      g += '<path d="M' + n1(cx + r1 * Math.cos(a)) + ',' + n1(cy + r1 * Math.sin(a)) + ' L' + n1(cx + r2 * Math.cos(a)) + ',' + n1(cy + r2 * Math.sin(a)) + '" stroke="' + INK + '" stroke-width="' + (k % 5 ? 3 : 5) + '" stroke-linecap="round"/>'
    }
    var an = Math.PI * (1 + v), L = r - ep - 14
    g += '<path d="M' + n1(cx - 9 * Math.sin(an)) + ',' + n1(cy + 9 * Math.cos(an)) + ' L' + n1(cx + L * Math.cos(an)) + ',' + n1(cy + L * Math.sin(an)) + ' L' + n1(cx + 9 * Math.sin(an)) + ',' + n1(cy - 9 * Math.cos(an)) + ' Z" fill="' + INK + '"/>'
    g += '<circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="18" fill="' + INK + '"/><circle cx="' + n1(cx) + '" cy="' + n1(cy) + '" r="7" fill="#fff"/>'
    return g
  }
  // Carte QR de fin : cadre blanc arrondi, ombre, libellé.
  K5.carteQR = function (cx, y, taille, p) {
    var w = Math.max(taille + 56, 250), h = taille + 104, x = cx - w / 2
    return K3.op(p, K3.rect(x + 4, y + 10, w, h, 26, 'rgba(21,12,28,.14)') + K3.rect(x, y, w, h, 26, '#fff') + F.qr(cx - taille / 2, y + 28, taille) +
      K3.txt(cx, y + taille + 78, 'Scannez pour essayer', 20, { anchor: 'middle', fill: INK }))
  }
  // Petits pictos au trait (dans les pastilles).
  K5.picto = function (k, s) {
    s = s || 1
    var g = '<g transform="scale(' + s + ')">'
    if (k === 'jouer') g += '<circle r="24" fill="' + MAG + '"/><text y="10" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="28" fill="#fff">?</text>'
    if (k === 'connaitre') g += '<path d="M-24,-8 L-6,-8 L18,-22 L18,22 L-6,8 L-24,8 Z" fill="' + C.gold + '"/><rect x="-16" y="8" width="9" height="16" rx="3" fill="' + C.gold + '"/><path d="M24,-10 Q32,0 24,10" stroke="' + INK + '" stroke-width="4" fill="none" stroke-linecap="round"/>'
    if (k === 'revenir') g += '<path d="M14,-18 A22,22 0 1 1 -20,-8" stroke="' + C.teal + '" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M-30,-20 L-20,-6 L-8,-18 Z" fill="' + C.teal + '"/>'
    if (k === 'rapport') g += '<rect x="-20" y="-24" width="40" height="48" rx="6" fill="' + C.violet + '"/><rect x="-12" y="4" width="6" height="12" fill="#fff"/><rect x="-3" y="-4" width="6" height="20" fill="#fff"/><rect x="6" y="-12" width="6" height="28" fill="#fff"/>'
    return g + '</g>'
  }
  window.K5 = K5
})()
