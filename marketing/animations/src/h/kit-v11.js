/* Briques v11 : charte landing sans vert. Encre #1B3A5C, bleu #3B5CC4
   dominant, violet #7A4FE0 (pilule Plug & Play, bandes des grands chiffres,
   barres), fuchsia #E0368C en touche ponctuelle (badge NOUVEAU, « TOP »),
   papier #F4F6F9 / blanc. Jamais de fond sombre. K11.charte() = K10.charte()
   puis teal -> violet. Vitrine de boutique mode / déco (plus de pains). */
(function () {
  var F = window.FH, K3 = window.K3, K10 = window.K10
  var K11 = {}
  var n1 = function (x) { return (+x).toFixed(1) }
  var INK = '#1B3A5C', BLUE = '#3B5CC4', VIOLET = '#7A4FE0', FUCHSIA = '#E0368C', PAPER = '#F4F6F9', MUT = '#5a6b80', LINE = '#DCE3EC'
  K11.C = { ink: INK, blue: BLUE, violet: VIOLET, fuchsia: FUCHSIA, paper: PAPER, mut: MUT, line: LINE, bleuClair: '#8FB3F0', violetClair: '#B9A4F2' }
  K11.PA = { bleu: '#C9D6F5', violet: '#DCD0F7', ciel: '#DCE6F7' }
  var MAP = [
    ['#00B4A0', VIOLET], ['rgba(0,180,160,', 'rgba(122,79,224,'], ['#B3EBE3', K11.PA.violet], ['#F2FBF9', '#F4F0FD'],
    ['#E3BFA4', K11.PA.ciel], ['#D4B48C', K11.PA.bleu]
  ]
  var RE = MAP.map(function (m) { return [new RegExp(m[0].replace(/[()]/g, '\\$&'), 'gi'), m[1]] })
  K11.charte = function (s) {
    s = K10.charte(s)
    for (var i = 0; i < RE.length; i++) s = s.replace(RE[i][0], RE[i][1])
    return s
  }
  function r(x, y, w, h, rr, fill, o) { return K3.rect(x, y, w, h, rr, fill, o) }

  // Vitrine de boutique (repère de la devanture v9 : 380 px de large).
  K11.vitrine = function () {
    var g = '<path d="M30,172 L120,172" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>'
    // T-shirt et robe sur cintres
    g += '<path d="M52,172 L52,178 M96,172 L96,178" stroke="' + INK + '" stroke-width="2"/>'
    g += '<path d="M36,188 L45,180 L59,180 L68,188 L74,200 L66,204 L64,198 L64,238 L40,238 L40,198 L38,204 L30,200 Z" fill="' + K11.PA.bleu + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>'
    g += '<path d="M88,180 L104,180 L107,198 L118,242 L74,242 L85,198 Z" fill="' + K11.PA.violet + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/><path d="M86,200 L106,200" stroke="' + VIOLET + '" stroke-width="3"/>'
    // Sac, vase, pile de pulls sur l'étagère
    g += '<path d="M42,280 Q52,262 62,280" fill="none" stroke="' + INK + '" stroke-width="2.5"/>' + r(34, 278, 36, 22, 4, BLUE, { stroke: INK, sw: 2 })
    g += '<path d="M96,300 Q86,286 92,276 L94,268 L102,268 L104,276 Q110,286 100,300 Z" fill="' + VIOLET + '" stroke="' + INK + '" stroke-width="2"/>'
    g += '<path d="M98,268 Q96,254 104,246 M98,268 Q104,256 112,256" stroke="' + INK + '" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="104" cy="245" r="4" fill="' + FUCHSIA + '"/><circle cx="113" cy="255" r="3.5" fill="' + BLUE + '"/>'
    g += r(188, 288, 40, 12, 3, '#8FB3F0', { stroke: INK, sw: 1.8 }) + r(191, 276, 34, 12, 3, K11.PA.violet, { stroke: INK, sw: 1.8 })
    // Socle sous l'étagère
    g += r(40, 312, 60, 22, 4, '#fff', { stroke: INK, sw: 2 }) + r(150, 316, 70, 18, 4, '#fff', { stroke: INK, sw: 2 })
    return g
  }

  // Écran de reporting (carte large) : valeurs d'illustration.
  K11.rapport = function (x, y, w, h, p) {
    var g = r(x + 4, y + 8, w, h, 22, 'rgba(27,58,92,.10)') + r(x, y, w, h, 22, '#fff', { stroke: LINE, sw: 2 })
    g += K3.txt(x + 22, y + 38, 'Rapport de campagne', 20, { fill: INK }) + K3.txt(x + 22, y + 60, 'Soldes d’été · Boutique Exemple', 13, { w: 700, fill: MUT })
    g += r(x + w - 96, y + 22, 74, 26, 13, PAPER, { stroke: LINE, sw: 1.5 }) + K3.txt(x + w - 59, y + 40, 'Export', 12, { anchor: 'middle', fill: BLUE })
    var k = F.easeOut(F.clamp(p, 0, 1)), kp = [['flashs', 1240, BLUE], ['joueurs', 860, VIOLET], ['opt-in', 520, BLUE]], tw = (w - 44 - 16) / 3
    kp.forEach(function (c, i) {
      var tx = x + 22 + i * (tw + 8), v = Math.round(c[1] * k), s = v >= 1000 ? Math.floor(v / 1000) + ' ' + String(v % 1000 + 1000).slice(1) : String(v)
      g += r(tx, y + 76, tw, 64, 14, PAPER) + K3.txt(tx + 14, y + 106, s, 22, { fill: c[2] }) + K3.txt(tx + 14, y + 128, c[0], 12, { w: 700, fill: MUT })
    })
    g += K3.txt(x + 22, y + 166, 'PAR SUPPORT', 11, { fill: MUT, ls: 1.2 })
    var sup = [['Vitrine', 0.82], ['Réseaux', 0.66], ['Campagne', 0.5], ['Caisse', 0.38]]
    sup.forEach(function (s, i) {
      var yy = y + 176 + i * 30, bw = (w - 150) * s[1] * F.easeOut(F.clamp(p * 1.4 - i * 0.12, 0, 1))
      g += K3.txt(x + 22, yy + 17, s[0], 13, { w: 700, fill: INK }) + r(x + 112, yy + 6, w - 150, 14, 7, '#EEF2F8') + r(x + 112, yy + 6, bw, 14, 7, i === 0 ? VIOLET : BLUE)
    })
    g += K3.txt(x + w / 2, y + h - 16, 'Valeurs d’illustration', 11, { anchor: 'middle', w: 700, fill: MUT })
    return g
  }
  window.K11 = K11
})()
