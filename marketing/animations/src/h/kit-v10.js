/* Briques v10 : charte de la landing (admin/app/landing/LandingClient.tsx).
   Encre #1B3A5C, bleu #3B5CC4, teal #00B4A0, papier #F4F6F9, blanc, texte
   secondaire #5a6b80. Police de la landing (pile système) : Roboto intégrée
   (500/700/900) pour un rendu identique en headless. Logo « Flow » encre +
   « in » bleu. Aucun orange, corail, crème, pêche, prune ni fuchsia.
   Les scènes v10 reprennent les dessins v9 : K10.charte() convertit leur
   sortie (palette A -> charte landing, Archivo/Manrope -> Roboto). */
(function () {
  var F = window.FH, K3 = window.K3, K7 = window.K7, K9 = window.K9
  var K10 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  var INK = '#1B3A5C', BLUE = '#3B5CC4', TEAL = '#00B4A0', PAPER = '#F4F6F9', MUT = '#5a6b80', LINE = '#DCE3EC'
  K10.C = { ink: INK, blue: BLUE, teal: TEAL, paper: PAPER, mut: MUT, line: LINE, bleuClair: '#8FB3F0' }
  K10.BG = { papier: PAPER, blanc: '#FFFFFF' }
  K10.PA = { bleu: '#C9D6F5', teal: '#B3EBE3', ciel: '#DCE6F7', brume: '#E3EBF8' }
  try { document.fonts.load('900 40px Roboto'); document.fonts.load('700 40px Roboto'); document.fonts.load('500 40px Roboto') } catch (e) {}

  // Palette A (v9) -> charte landing. Appliqué après K9.chaud().
  var MAP = [
    ['#3B2418', INK], ['rgba(59,36,24,', 'rgba(27,58,92,'], ['#F26B4F', BLUE], ['rgba(242,107,79,', 'rgba(59,92,196,'],
    ['#F5A100', TEAL], ['#EC5B45', TEAL], ['#F5B544', TEAL], ['#13A89E', TEAL], ['rgba(19,168,158,', 'rgba(0,180,160,'],
    ['#8E3B6E', INK], ['#D9A0C2', '#8FB3F0'], ['#E89A6B', '#8FB3F0'],
    ['#FFF6EC', PAPER], ['#F3D9C4', LINE], ['#8A6F60', MUT], ['#7A5E50', MUT],
    ['#FBC7B8', K10.PA.bleu], ['#FFD89A', K10.PA.teal], ['#E9C6DA', K10.PA.ciel], ['#BDE8E2', K10.PA.teal], ['#FFE3CC', K10.PA.brume],
    ['#EBC4A6', '#CBD6E4'], ['#F8DCC6', '#E6ECF3'], ['#E6A25C', '#D4B48C'], ['#FFF1E2', '#EAF1FA'], ['#FBE6D4', '#E6ECF3'],
    ['#F5E9DE', '#E9EEF5'], ['#F7EBDD', '#E9EEF5'], ['#EFE3D8', '#E3E9F1'], ['#FBF5EF', '#F7F9FC'], ['#F2E8DE', '#E6ECF3'],
    ['#B9A698', '#A3B0C2'], ['#C7B6A9', '#B3BECC'], ['#F7E6D8', '#E6ECF3'], ['#F9CDBF', '#C9D6F5'], ['#FFFAF4', '#F9FBFD'],
    ['#A89080', '#A3B0C2'], ['#E9B68E', '#E3BFA4'], ['rgba(255,246,236,', 'rgba(255,255,255,'],
    ['#6B4232', '#2E4D73'], ['#A0623F', '#5a6b80'], ['#8E5A3C', '#3B4F6B'], ['#5A3A2A', '#1B3A5C'],
    ['font-family="ArchivoX"', 'font-family="Roboto"'], ['font-family="Manrope"', 'font-family="Roboto"']
  ]
  var RE = MAP.map(function (m) { return [new RegExp(m[0].replace(/[()]/g, '\\$&'), 'gi'), m[1]] })
  K10.charte = function (s) {
    // Logo : « in » bleu plein (dégradé magenta -> or remplacé).
    s = s.replace(/stop-color="#E0218A"\/><stop offset="1" stop-color="#F5A100"/g, 'stop-color="' + BLUE + '"/><stop offset="1" stop-color="' + BLUE + '"')
    // Le teal de la charte (#00B4A0) serait pris pour le teal v8 par K9.chaud : on le protège.
    s = s.replace(/#00B4A0/gi, '#00B4A1').replace(/rgba\(0,180,160,/g, 'rgba(0,180,161,')
    s = K9.chaud(s)
    s = s.replace(/#00B4A1/g, TEAL).replace(/rgba\(0,180,161,/g, 'rgba(0,180,160,')
    for (var i = 0; i < RE.length; i++) s = s.replace(RE[i][0], RE[i][1])
    return s
  }

  // Titre : Roboto 900, lignes de même taille ajustées à 425 px, mot(s) en bleu.
  K10.titre = function (lignes, lt, o) {
    o = o || {}
    var maxW = o.largeur || 425, size = o.max || 48, ls = -0.01
    lignes.forEach(function (l) { size = Math.min(size, maxW / Math.max(0.01, K7.largeur(l, 'Roboto', 900, 1, ls))) })
    size = Math.floor(size)
    var y = (o.y || 96) + size * 0.72, g = '', mags = [].concat(o.mag === undefined ? [] : o.mag)
    lignes.forEach(function (l, i) {
      var p = o.img0 ? 1 : F.easeOut(F.prog(lt, 0.1 + i * 0.1, 0.4))
      g += '<text class="safe" data-cap="' + n1(0.71 * size) + '" x="30" y="' + n1(y + (1 - p) * 24) + '" font-family="Roboto" font-weight="900" font-size="' + size + '" letter-spacing="' + n1(ls * size) + '" fill="' + (mags.indexOf(i) >= 0 ? BLUE : INK) + '" opacity="' + p.toFixed(3) + '">' + F.esc(l) + '</text>'
      y += size * 1.0
    })
    K7._bas = y - size * 0.28
    K7._taille = size
    return g
  }

  // Fichier client qui se remplit : nouveaux contacts en tête (p 0 -> 1).
  K10.ecranNouveaux = function (p) {
    var anciens = ['M•••• D.', 'S•••• L.', 'A•••• B.'], neufs = ['L•••• P.', 'N•••• T.', 'E•••• R.'], av = ['#C9D6F5', '#B3EBE3', '#DCE6F7']
    return function (sw, sh) {
      var u = sw / 240, g = K3.rect(0, 0, sw, sh, 0, '#fff')
      g += K3.rect(0, 0, sw, 106 * u, 0, PAPER) + '<path d="M0,' + n1(106 * u) + ' L' + n1(sw) + ',' + n1(106 * u) + '" stroke="' + LINE + '" stroke-width="' + n1(u) + '"/>'
      g += K3.txt(16 * u, 48 * u, 'Mes clients', 19 * u, { fill: INK }) + K3.txt(16 * u, 64 * u, 'Fichier client', 9 * u, { w: 700, fill: MUT })
      var n = Math.min(3, Math.floor(F.clamp(p, 0, 1) * 3.999))
      g += K3.rect(16 * u, 74 * u, 150 * u, 24 * u, 12 * u, TEAL) + K3.txt(91 * u, 90.5 * u, '+' + n + ' NOUVEAU' + (n > 1 ? 'X' : ''), 10.5 * u, { anchor: 'middle', fill: '#fff', ls: 1.2 * u })
      // Lignes : les nouveaux poussent les anciens vers le bas.
      var liste = []
      for (var k = n - 1; k >= 0; k--) liste.push([neufs[k], true, av[k]])
      anciens.forEach(function (a) { liste.push([a, false, '#E3E9F1']) })
      var glis = F.clamp(p * 3.999 - n, 0, 1)
      liste.slice(0, 5).forEach(function (l, i) {
        var y = (122 + i * 52) * u, neuf = l[1], ap = neuf && i === 0 ? F.easeOut(F.clamp(glis * 3, 0, 1)) : 1
        g += '<g opacity="' + ap.toFixed(3) + '" transform="translate(0,' + n1((1 - ap) * -20 * u) + ')">'
        g += K3.rect(12 * u, y, 216 * u, 44 * u, 12 * u, neuf ? '#F2FBF9' : '#fff', { stroke: neuf ? TEAL : LINE, sw: u })
        g += '<circle cx="' + n1(34 * u) + '" cy="' + n1(y + 22 * u) + '" r="' + n1(13 * u) + '" fill="' + l[2] + '"/>'
        g += K3.txt(56 * u, y + 19 * u, l[0], 12 * u, { fill: INK })
        g += K3.txt(56 * u, y + 34 * u, neuf ? 'A joué au quiz · opt-in' : 'Client fidèle', 8.5 * u, { w: 700, fill: neuf ? TEAL : MUT })
        if (neuf) g += K3.rect(166 * u, y + 13 * u, 52 * u, 18 * u, 9 * u, TEAL) + K3.txt(192 * u, y + 25.5 * u, 'NOUVEAU', 7 * u, { anchor: 'middle', fill: '#fff', ls: 0.5 * u })
        g += '</g>'
      })
      return g
    }
  }

  // Carte QR carrée (fin) : QR + libellé sur deux lignes, dans un carré.
  K10.carteQR = function (cx, y, c, p) {
    var x = cx - c / 2, q = c * 0.66
    return K3.op(p, K3.rect(x + 4, y + 8, c, c, 24, 'rgba(27,58,92,.10)') + K3.rect(x, y, c, c, 24, '#fff', { stroke: LINE, sw: 2 }) + F.qr(cx - q / 2, y + c * 0.08, q, INK) +
      K3.txt(cx, y + c * 0.85, 'Scannez pour', c * 0.075, { anchor: 'middle', fill: INK }) + K3.txt(cx, y + c * 0.935, 'voir les offres', c * 0.075, { anchor: 'middle', fill: BLUE }))
  }
  // Logo de la landing : « Flow » encre + « in » bleu, mesuré en Roboto.
  K10.logo = function (cx, y, size, sombre) {
    var ls = -0.02, wF = K7.largeur('Flow', 'Roboto', 900, size, ls), wI = K7.largeur('in', 'Roboto', 900, size, ls), x0 = cx - (wF + wI) / 2
    return '<text x="' + n1(x0) + '" y="' + n1(y) + '" font-family="Roboto" font-weight="900" font-size="' + n1(size) + '" letter-spacing="' + n1(ls * size) + '" fill="' + (sombre ? '#fff' : INK) + '">Flow<tspan fill="' + BLUE + '">in</tspan></text>'
  }
  window.K10 = K10
})()
