/* Briques v4 (retours client) : peinture qui déborde, grands chiffres peints,
   supports de communication avec QR tracé, pictos de cibles, jauges de mesure
   animées. Aucun personnage, aucune façade. Couleurs Flowin : magenta, or,
   violet, teal + pastels. */
(function () {
  var F = window.FH, K3 = window.K3, C = F.C, INK = C.ink, MAG = C.mag
  var K4 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  K4.COL = { mag: MAG, or: C.gold, violet: C.violet, teal: C.teal }
  // Pseudo-aléatoire déterministe (même image à chaque rendu).
  function rnd(seed) { var s = seed * 9301 + 49297; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280 } }

  // Tache de peinture : éclat central, lobes, coulures qui descendent,
  // gouttelettes projetées. p = 0..1 (impact puis coulures).
  K4.tache = function (cx, cy, r, col, seed, p, coul) {
    if (p <= 0) return ''
    var R = rnd(seed || 1), imp = F.easeOut(F.clamp(p / 0.35, 0, 1)), cou = F.easeOut(F.clamp((p - 0.2) / 0.8, 0, 1))
    var g = '<g transform="translate(' + n1(cx) + ',' + n1(cy) + ')" fill="' + col + '">'
    var rr = r * (0.3 + 0.7 * imp)
    g += '<circle r="' + n1(rr * 0.78) + '"/>'
    // Bord irrégulier : quelques gros lobes décentrés.
    for (var i = 0; i < 6; i++) {
      var a = i / 6 * Math.PI * 2 + R() * 0.9, d = rr * (0.35 + R() * 0.3), lr = rr * (0.3 + R() * 0.25)
      g += '<circle cx="' + n1(d * Math.cos(a)) + '" cy="' + n1(d * Math.sin(a)) + '" r="' + n1(lr) + '"/>'
    }
    // Projections en pointe (éclaboussures), terminées par une goutte.
    for (var k2 = 0; k2 < 9; k2++) {
      var b2 = R() * Math.PI * 2, len = rr * (0.95 + R() * 0.45), wd = rr * (0.08 + R() * 0.08)
      var ex = len * Math.cos(b2), ey = len * Math.sin(b2), px = -Math.sin(b2) * wd, py = Math.cos(b2) * wd
      g += '<path d="M' + n1(px * 2) + ',' + n1(py * 2) + ' L' + n1(ex) + ',' + n1(ey) + ' L' + n1(-px * 2) + ',' + n1(-py * 2) + ' Z"/><circle cx="' + n1(ex * 1.08) + '" cy="' + n1(ey * 1.08) + '" r="' + n1(wd * 0.9) + '"/>'
    }
    // Coulures (vers le bas).
    for (var k = 0; k < 5; k++) {
      var x = (R() - 0.5) * rr * 1.3, w = r * (0.06 + R() * 0.07), L = r * (0.4 + R() * 0.9) * cou * (coul === undefined ? 1 : coul), y0 = Math.sqrt(Math.max(0, rr * rr * 0.7 - x * x))
      if (L > 1) g += '<rect x="' + n1(x - w / 2) + '" y="' + n1(y0 - w) + '" width="' + n1(w) + '" height="' + n1(L + w) + '" rx="' + n1(w / 2) + '"/><circle cx="' + n1(x) + '" cy="' + n1(y0 + L) + '" r="' + n1(w * 0.75) + '"/>'
    }
    // Gouttelettes projetées.
    for (var j = 0; j < 14; j++) {
      var b = R() * Math.PI * 2, e = rr * (1.05 + R() * 0.75) * (0.6 + 0.4 * imp), dr = r * (0.02 + R() * 0.05)
      g += '<circle cx="' + n1(e * Math.cos(b)) + '" cy="' + n1(e * Math.sin(b)) + '" r="' + n1(dr) + '"/>'
    }
    return g + '</g>'
  }
  // Grand chiffre (ou mot court) peint : deux taches superposées + texte.
  K4.chiffre = function (txt, cx, cy, size, col1, col2, lt, a, seed) {
    var p = F.prog(lt, a, 1.6)
    var g = K4.tache(cx + size * 0.12, cy - size * 0.28, size * 0.62, col2, (seed || 3) + 7, p * 1.1)
    g += K4.tache(cx - size * 0.05, cy - size * 0.36, size * 0.5, col1, seed || 3, p)
    var q = F.easeOut(F.prog(lt, a + 0.15, 0.4)), s = 0.6 + 0.4 * q
    g += '<g opacity="' + q.toFixed(3) + '" transform="translate(' + n1(cx) + ',' + n1(cy) + ') scale(' + s.toFixed(3) + ')"><text text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + size + '" letter-spacing="' + n1(-0.05 * size) + '" fill="' + INK + '">' + F.esc(txt) + '</text></g>'
    return g
  }
  // Petit QR « tracé » (pastille encre + motif) pour les supports.
  K4.miniQR = function (x, y, s) {
    return '<g transform="translate(' + n1(x) + ',' + n1(y) + ')">' + K3.rect(-s / 2 - 4, -s / 2 - 4, s + 8, s + 8, 6, '#fff') + F.qr(-s / 2, -s / 2, s) + '</g>'
  }
  // Supports de communication (dessins d'objets, sans personnage).
  K4.bus = function (x, y, w, sansQR) {
    var h = w * 1.0, g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ')">'
    g += K3.rect(-w / 2, -h / 2, w, h * 0.92, w * 0.12, C.gold) + K3.rect(-w * 0.4, -h * 0.42, w * 0.8, h * 0.24, w * 0.05, '#2A2230')
    g += K3.rect(-w * 0.42, -h * 0.12, w * 0.84, h * 0.4, w * 0.04, '#fff') + K3.txt(-w * 0.36, h * 0.03, 'VOTRE', w * 0.085, { fill: INK }) + K3.txt(-w * 0.36, h * 0.13, 'PUB', w * 0.085, { fill: INK }) + K3.txt(-w * 0.36, h * 0.22, 'Jouez →', w * 0.065, { w: 700, fill: MAG })
    g += sansQR ? K3.rect(w * 0.06, -h * 0.06, w * 0.32, h * 0.3, w * 0.04, MAG) + K3.txt(w * 0.22, h * 0.13, '%', w * 0.18, { anchor: 'middle', fill: '#fff' }) : K4.miniQR(w * 0.22, h * 0.08, w * 0.26)
    g += '<circle cx="' + n1(-w * 0.36) + '" cy="' + n1(h * 0.36) + '" r="' + n1(w * 0.05) + '" fill="#fff"/><circle cx="' + n1(w * 0.36) + '" cy="' + n1(h * 0.36) + '" r="' + n1(w * 0.05) + '" fill="#fff"/>'
    g += K3.rect(-w * 0.44, h * 0.42, w * 0.18, h * 0.12, w * 0.03, INK) + K3.rect(w * 0.26, h * 0.42, w * 0.18, h * 0.12, w * 0.03, INK)
    return g + '</g>'
  }
  K4.setTable = function (x, y, w, rot, sansQR) {
    var h = w * 0.68, g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') rotate(' + (rot || 0) + ')">'
    g += K3.rect(-w / 2 + 4, -h / 2 + 6, w, h, 8, 'rgba(0,0,0,.15)') + K3.rect(-w / 2, -h / 2, w, h, 8, '#fff')
    g += '<circle cx="' + n1(-w * 0.08) + '" cy="0" r="' + n1(h * 0.3) + '" fill="none" stroke="#e4dcec" stroke-width="' + n1(w * 0.02) + '"/><circle cx="' + n1(-w * 0.08) + '" cy="0" r="' + n1(h * 0.2) + '" fill="none" stroke="#efe9f4" stroke-width="' + n1(w * 0.012) + '"/>'
    g += K3.rect(-w * 0.4, -h * 0.25, w * 0.025, h * 0.5, 2, '#cfc4da') + K3.rect(w * 0.18, -h * 0.25, w * 0.025, h * 0.5, 2, '#cfc4da')
    g += sansQR ? K3.txt(w * 0.34, -h * 0.02, 'Menu', w * 0.07, { anchor: 'middle', fill: INK }) + K3.txt(w * 0.34, h * 0.14, 'du jour', w * 0.06, { anchor: 'middle', w: 700, fill: MAG }) : K4.miniQR(w * 0.34, -h * 0.12, w * 0.17) + K3.txt(w * 0.34, h * 0.22, 'Jouez !', w * 0.065, { anchor: 'middle', fill: MAG })
    return g + '</g>'
  }
  K4.pubReseau = function (x, y, w, rot, sansQR) {
    var h = w * 1.25, g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') rotate(' + (rot || 0) + ')">'
    g += K3.rect(-w / 2 + 4, -h / 2 + 6, w, h, 12, 'rgba(0,0,0,.15)') + K3.rect(-w / 2, -h / 2, w, h, 12, '#fff')
    g += '<circle cx="' + n1(-w / 2 + 18) + '" cy="' + n1(-h / 2 + 18) + '" r="9" fill="' + C.violet + '"/>' + K3.txt(-w / 2 + 32, -h / 2 + 16, 'Votre commerce', w * 0.07, {}) + K3.txt(-w / 2 + 32, -h / 2 + 28, 'Sponsorisé', w * 0.055, { w: 700, fill: '#8a7e93' })
    g += K3.rect(-w / 2 + 8, -h / 2 + 40, w - 16, h * 0.56, 8, '#F9D5E5') + K3.txt(0, -h / 2 + 40 + h * 0.2, sansQR ? 'NOUVEAU' : 'JEU GRATUIT', w * 0.11, { anchor: 'middle' })
    g += sansQR ? K3.txt(0, -h / 2 + 40 + h * 0.42, '-20 %', w * 0.16, { anchor: 'middle', fill: MAG }) : K4.miniQR(0, -h / 2 + 40 + h * 0.37, w * 0.24)
    g += K3.rect(-w / 2 + 8, h / 2 - 30, w - 16, 22, 11, '#3B5CC4') + K3.txt(0, h / 2 - 15, 'En savoir plus', w * 0.06, { anchor: 'middle', fill: '#fff' })
    return g + '</g>'
  }
  K4.afficheCaisse = function (x, y, w, rot) { return K3.affiche(x, y, w, rot || 0) }
  // Pictos des cibles (objets, pas de personnes).
  K4.picto = function (k, x, y, s) {
    var g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') scale(' + (s || 1) + ')">'
    if (k === 'caddie') g += '<path d="M-38,-26 L-26,-26 L-16,16 L28,16 L36,-14 L-22,-14" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="-10" cy="30" r="7" fill="' + INK + '"/><circle cx="22" cy="30" r="7" fill="' + INK + '"/><rect x="-14" y="-10" width="14" height="18" rx="3" fill="' + MAG + '"/><rect x="4" y="-8" width="16" height="16" rx="3" fill="' + C.teal + '"/>'
    if (k === 'auto') g += '<path d="M-42,12 L-42,-2 L-30,-6 L-18,-24 L18,-24 L30,-6 L42,-2 L42,12 Z" fill="' + C.violet + '"/><rect x="-14" y="-20" width="28" height="13" rx="3" fill="#fff" opacity=".8"/><circle cx="-24" cy="14" r="9" fill="' + INK + '"/><circle cx="24" cy="14" r="9" fill="' + INK + '"/><rect x="-11" y="-46" width="22" height="22" rx="4" fill="#fff" stroke="' + INK + '" stroke-width="3"/><text y="-28" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="' + MAG + '">L</text>'
    if (k === 'garage') g += '<path d="M-30,30 L14,-14" stroke="' + INK + '" stroke-width="12" stroke-linecap="round"/><path d="M8,-30 A20,20 0 1 0 30,-8 L18,-10 L12,-24 Z" fill="' + INK + '"/><circle cx="-26" cy="26" r="4" fill="#fff"/>'
    return g + '</g>'
  }
  // Jauge verticale animée : monte, hésite, se pose sur `cible`.
  K4.valeur = function (lt, a, cible, seed) {
    var t = lt - a
    if (t <= 0) return 0
    var mont = F.easeOut(F.clamp(t / 0.9, 0, 1)), osc = Math.sin(t * (4 + seed)) * 0.22 * Math.exp(-t * 1.1)
    return F.clamp(cible * mont + osc * mont, 0.02, 1)
  }
  K4.grandeJauge = function (x, top, w, h, v, label, col, picto) {
    var hh = h * v
    var g = K3.rect(x, top, w, h, w / 2, '#fff', { op: 0.7 }) + K3.rect(x, top + h - hh, w, hh, w / 2, col)
    g += '<path d="M' + n1(x - 10) + ',' + n1(top + h - hh) + ' L' + n1(x + w + 10) + ',' + n1(top + h - hh) + '" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>'
    g += picto + '<text class="safe" x="' + n1(x + w / 2) + '" y="' + n1(top + h + 90) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="16" fill="' + INK + '">' + F.esc(label) + '</text>'
    return g
  }
  window.K4 = K4
})()
