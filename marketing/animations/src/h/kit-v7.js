/* Briques v7 « esprit Macadam » sans personnage : titres Archivo extra-large
   ultra-gras, chiffres en contour avec bande pastel décalée, pilules à
   contour fin, filets, vrai logo Flowin (« in » dégradé magenta -> or),
   bloc signature Flowin · ANIMATION · Plug & Play, macaron vitrine. */
(function () {
  var F = window.FH, K3 = window.K3, K5 = window.K5, C = F.C, INK = C.ink, MAG = C.mag, OR = C.gold, TEAL = C.teal
  var K7 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  var AR = 'font-family="ArchivoX" font-weight="900"'
  K7.BG = { blanc: '#FFFFFF', beurre: '#FDF6B2', rose: '#F9D5E5', menthe: '#D9F2EA', ciel: '#D7EEF9' }
  K7.PASTEL = { rose: '#F7B9D6', menthe: '#9FE3D6', ciel: '#B4DCF6', beurre: '#FBE67A' }
  // Charge la police Archivo avant le démarrage du moteur (fonts.ready l'attend).
  try { document.fonts.load('900 40px ArchivoX'); document.fonts.load('800 40px Manrope') } catch (e) {}

  // Mesure de texte (une fois les polices chargées), avec cache.
  var cache = {}
  K7.largeur = function (t, fam, w, size, ls) {
    var k = fam + w + t + (ls || 0)
    if (cache[k] === undefined) {
      var svg = document.getElementById('svg'), el = document.createElementNS('http://www.w3.org/2000/svg', 'text')
      el.setAttribute('font-family', fam); el.setAttribute('font-weight', w); el.setAttribute('font-size', '100')
      if (ls) el.setAttribute('letter-spacing', String(ls * 100))
      el.textContent = t; svg.appendChild(el); cache[k] = el.getComputedTextLength() / 100; svg.removeChild(el)
    }
    return cache[k] * size
  }
  // Titre : lignes Archivo de même taille, ajustée à la largeur utile.
  K7.titre = function (lignes, lt, o) {
    o = o || {}
    var maxW = o.largeur || 425, size = o.max || 70
    lignes.forEach(function (l) { size = Math.min(size, maxW / Math.max(0.01, K7.largeur(l, 'ArchivoX', 900, 1))) })
    size = Math.floor(size)
    var y = (o.y || 96) + size * 0.74, g = ''
    lignes.forEach(function (l, i) {
      var p = o.img0 ? 1 : F.easeOut(F.prog(lt, 0.1 + i * 0.1, 0.4))
      var col = o.mag === i ? MAG : INK
      g += '<text class="safe" data-cap="' + n1(0.72 * size) + '" x="30" y="' + n1(y + (1 - p) * 24) + '" ' + AR + ' font-size="' + size + '" fill="' + col + '" opacity="' + p.toFixed(3) + '">' + F.esc(l) + '</text>'
      y += size * 1.0
    })
    K7._bas = y - size * 0.26
    K7._taille = size
    return g
  }
  // Sous-titre Manrope + filet noir fin.
  K7.sous = function (lignes, lt, o) {
    o = o || {}
    var g = '', y = K7._bas + 40, p = o.img0 ? 1 : F.easeOut(F.prog(lt, 0.45, 0.4))
    ;[].concat(lignes || []).forEach(function (l, i) {
      g += '<text class="safe" x="30" y="' + n1(y + i * 30) + '" font-family="Manrope" font-weight="700" font-size="' + (o.size || 22) + '" fill="' + INK + '" opacity="' + p.toFixed(3) + '">' + F.esc(l) + '</text>'
    })
    y = lignes && [].concat(lignes).length ? y + ([].concat(lignes).length - 1) * 30 + 28 : K7._bas + 26
    var f = o.img0 ? 1 : F.easeInOut(F.prog(lt, 0.35, 0.6))
    g += '<path d="M30,' + n1(y) + ' L' + n1(30 + 420 * f) + ',' + n1(y) + '" stroke="' + INK + '" stroke-width="2"/>'
    K7._filet = y
    return g
  }
  // Chiffre en contour noir avec bande pastel décalée dessous.
  K7.contour = function (t, x, y, size, pastel, p, anchor) {
    var a = anchor ? ' text-anchor="' + anchor + '"' : '', d = size * 0.06
    return '<g opacity="' + Math.min(1, p * 1.5).toFixed(3) + '"><text x="' + n1(x + d) + '" y="' + n1(y + d) + '"' + a + ' ' + AR + ' font-size="' + size + '" fill="' + pastel + '">' + F.esc(t) + '</text>' +
      '<text class="safe" x="' + n1(x) + '" y="' + n1(y) + '"' + a + ' ' + AR + ' font-size="' + size + '" fill="none" stroke="' + INK + '" stroke-width="' + n1(Math.max(2.5, size * 0.025)) + '" stroke-linejoin="round">' + F.esc(t) + '</text></g>'
  }
  // Pilule à contour fin.
  K7.pilule = function (cx, cy, w, t, fill, p, txtCol) {
    if (p !== undefined && p <= 0) return ''
    var q = p === undefined ? 1 : p
    w = Math.max(w, K7.largeur(t, 'ArchivoX', 900, 16) + t.length * 1 + 34)
    return '<g opacity="' + Math.min(1, q * 1.5).toFixed(3) + '" transform="translate(' + n1(cx) + ',' + n1(cy + (1 - Math.min(1, q)) * 12) + ')"><rect x="' + n1(-w / 2) + '" y="-22" width="' + n1(w) + '" height="44" rx="22" fill="' + (fill || '#fff') + '" stroke="' + INK + '" stroke-width="2.2"/>' +
      '<text y="7" text-anchor="middle" ' + AR + ' font-size="16" letter-spacing="1" fill="' + (txtCol || INK) + '">' + F.esc(t) + '</text></g>'
  }
  // Vrai logo Flowin : « Flow » (encre ou blanc) + « in » dégradé magenta -> or.
  K7.logo = function (cx, y, size, sombre) {
    var ls = -0.03, wF = K7.largeur('Flow', 'Manrope', 800, size, ls), wI = K7.largeur('in', 'Manrope', 800, size, ls), x0 = cx - (wF + wI) / 2, gid = F.id('lg')
    return '<defs><linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="' + n1(x0 + wF) + '" y1="0" x2="' + n1(x0 + wF + wI) + '" y2="0"><stop offset="0" stop-color="' + MAG + '"/><stop offset="1" stop-color="' + OR + '"/></linearGradient></defs>' +
      '<text x="' + n1(x0) + '" y="' + n1(y) + '" font-family="Manrope" font-weight="800" font-size="' + size + '" letter-spacing="' + n1(ls * size) + '" fill="' + (sombre ? '#fff' : INK) + '">Flow</text>' +
      '<text x="' + n1(x0 + wF) + '" y="' + n1(y) + '" font-family="Manrope" font-weight="800" font-size="' + size + '" letter-spacing="' + n1(ls * size) + '" fill="url(#' + gid + ')">in</text>'
  }
  // Bloc signature (plaquette-nds.html : .logo + .ss-eyebrow + .ss-pill).
  K7.signature = function (cx, y, s, sombre) {
    s = s || 1
    return K7.logo(cx, y, 58 * s, sombre) +
      '<text x="' + n1(cx) + '" y="' + n1(y + 28 * s) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="' + n1(12 * s) + '" letter-spacing="' + n1(12 * s * 0.24) + '" fill="' + (sombre ? 'rgba(255,255,255,.6)' : 'rgba(21,12,28,.55)') + '">ANIMATION</text>' +
      K3.pill(cx, y + 62 * s, 38 * s, 'middle')
  }
  // Macaron vitrine Flowin : anneau dégradé, centre blanc, logo, texte
  // circulaire « FLASHEZ · JOUEZ · GAGNEZ », petit QR.
  K7.macaron = function (cx, cy, r, p, rot) {
    if (p !== undefined && p <= 0) return ''
    var q = p === undefined ? 1 : F.easeOut(Math.min(1, p)), gid = F.id('mg'), pid = F.id('mp'), s = 0.75 + 0.25 * q
    var fs = r * 0.135, rt = r * 0.86 - fs * 0.36, circ = 2 * Math.PI * rt
    var g = '<g opacity="' + Math.min(1, q * 1.4).toFixed(3) + '" transform="translate(' + n1(cx) + ',' + n1(cy) + ') rotate(' + (rot || 0) + ') scale(' + s.toFixed(3) + ')">'
    g += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + MAG + '"/><stop offset="1" stop-color="#7C2D92"/></linearGradient>' +
      '<path id="' + pid + '" d="M' + n1(-rt) + ',0 A' + n1(rt) + ',' + n1(rt) + ' 0 1 1 ' + n1(rt) + ',0 A' + n1(rt) + ',' + n1(rt) + ' 0 1 1 ' + n1(-rt) + ',0"/></defs>'
    g += '<circle cy="' + n1(r * 0.06) + '" r="' + n1(r) + '" fill="rgba(21,12,28,.16)"/>'
    g += '<circle r="' + n1(r) + '" fill="url(#' + gid + ')" stroke="' + INK + '" stroke-width="2.5"/>'
    g += '<text ' + AR + ' font-size="' + n1(fs) + '" fill="#fff"><textPath href="#' + pid + '" startOffset="0" textLength="' + n1(circ * 0.985) + '" lengthAdjust="spacing">FLASHEZ · JOUEZ · GAGNEZ · FLASHEZ · JOUEZ · GAGNEZ · </textPath></text>'
    g += '<circle r="' + n1(r * 0.71) + '" fill="#fff" stroke="' + INK + '" stroke-width="2"/>'
    g += K7.logo(0, -r * 0.16, r * 0.3)
    var qs = r * 0.4
    g += F.qr(-qs / 2, -r * 0.04, qs)
    return g + '</g>'
  }
  // Tache d'accent nette, sans coulure.
  K7.tache = function (cx, cy, r, col, seed, p) { return K5.tache(cx, cy, r, col, seed, p, { coulures: 0 }) }
  // Carte de contact (fiche) : contour fin, nom masqué, lignes.
  K7.fiche = function (x, y, w, rot, nom, etiquette, gris) {
    var h = w * 0.62, g = '<g transform="translate(' + n1(x) + ',' + n1(y) + ') rotate(' + (rot || 0) + ')">'
    g += '<rect x="' + n1(-w / 2 + 5) + '" y="' + n1(-h / 2 + 7) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="16" fill="rgba(21,12,28,.12)"/><rect x="' + n1(-w / 2) + '" y="' + n1(-h / 2) + '" width="' + n1(w) + '" height="' + n1(h) + '" rx="16" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>'
    g += '<circle cx="' + n1(-w / 2 + 34) + '" cy="' + n1(-h / 2 + 36) + '" r="16" fill="' + (gris ? '#E4E0E8' : K7.PASTEL.rose) + '" stroke="' + INK + '" stroke-width="2"/>'
    g += '<text x="' + n1(-w / 2 + 62) + '" y="' + n1(-h / 2 + 43) + '" font-family="Manrope" font-weight="800" font-size="20" fill="' + (gris ? '#9a92a3' : INK) + '">' + F.esc(nom) + '</text>'
    g += '<rect x="' + n1(-w / 2 + 22) + '" y="' + n1(-h / 2 + 70) + '" width="' + n1(w * 0.62) + '" height="9" rx="4.5" fill="#ECE8F0"/><rect x="' + n1(-w / 2 + 22) + '" y="' + n1(-h / 2 + 90) + '" width="' + n1(w * 0.42) + '" height="9" rx="4.5" fill="#ECE8F0"/>'
    if (etiquette) g += '<rect x="' + n1(w / 2 - 112) + '" y="' + n1(h / 2 - 40) + '" width="96" height="28" rx="14" fill="#fff" stroke="' + INK + '" stroke-width="1.8"/><text x="' + n1(w / 2 - 64) + '" y="' + n1(h / 2 - 21) + '" text-anchor="middle" ' + AR + ' font-size="11" letter-spacing="1" fill="' + INK + '">' + F.esc(etiquette) + '</text>'
    return g + '</g>'
  }
  window.K7 = K7
})()
