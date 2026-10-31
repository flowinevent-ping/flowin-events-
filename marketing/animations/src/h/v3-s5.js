/* s5 — « Le jeu de toute votre rue » (associations, organisateurs, 36 s). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop
  var ICO = ['pain', 'fleur', 'livre', 'soin', 'cadeau', 'boutique', 'massage', 'remise']

  window.SCENARIO = K3.film('s5', {
    scenes: [
      { // Accroche
        bg: P.menthe, mots: ['RASSEMBLEZ', 'TOUTE LA RUE.'], max: 110,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0), top = F._basSous + 60
          var pts = [[80, top + 40], [230, top + 10], [400, top + 60], [110, top + 200], [300, top + 180], [420, top + 300], [70, top + 360], [250, top + 360]]
          var p = img0 ? 1 : F.easeInOut(F.prog(lt, 0.6, 2.2)), tot = pts.length - 1
          for (var i = 0; i < tot; i++) {
            var q = F.clamp(p * tot - i, 0, 1)
            if (q > 0) g += '<path d="M' + pts[i][0] + ',' + pts[i][1] + ' L' + (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * q).toFixed(1) + ',' + (pts[i][1] + (pts[i + 1][1] - pts[i][1]) * q).toFixed(1) + '" stroke="' + C.mag + '" stroke-width="5" stroke-linecap="round"/>'
          }
          pts.forEach(function (s, i) { g += K3.point(s[0], s[1], F.clamp(p * tot - i + 1, 0, 1), ICO[i]) })
          return g
        }
      },
      { // Fédérer
        bg: P.ciel, mots: ['UN OUTIL', 'POUR FÉDÉRER.'], from: [250, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 60
          var pc = pop(lt, 0.2, 0.4)
          g += K3.op(pc, K3.rect(40, top, 400, 330, 24, '#fff') + K3.txt(240, top + 50, 'UN MÊME JEU', 26, { anchor: 'middle', ls: 1 }) + F.logo(240, top + 300, 44, INK, 'middle'))
          ICO.forEach(function (ic, i) {
            var p = F.easeOut(F.prog(lt, 0.6 + i * 0.18, 0.5)), tx = 100 + (i % 4) * 93, ty = top + 120 + Math.floor(i / 4) * 100
            var fx = i % 2 ? 560 : -60, fy = top + 40 + i * 50
            g += K3.point(fx + (tx - fx) * p, fy + (ty - fy) * p, p, ic)
          })
          return g
        }
      },
      { // Un thème, une date
        bg: P.beurre, mots: ['UN THÈME.', 'UNE DATE.'], max: 110, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 90
          ;[[30, 0, 'PRINTEMPS', '★', 'Fête des', 'commerces', 0.5], [175, 50, 'DATE CLÉ', '★', 'Anniversaire', '', 1.1], [320, 0, 'DÉCEMBRE', '25', 'Noël', '', 1.7]].forEach(function (c) {
            var p = pop(lt, c[6])
            g += K3.calendrier(c[0], c[1] + top, 130, c[2], c[3], '', p)
            g += '<text class="safe" x="' + (c[0] + 65) + '" y="' + (top + c[1] + 175) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="21" fill="' + INK + '" opacity="' + p.toFixed(3) + '">' + c[4] + '</text>'
            if (c[5]) g += '<text class="safe" x="' + (c[0] + 65) + '" y="' + (top + c[1] + 201) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="21" fill="' + INK + '" opacity="' + p.toFixed(3) + '">' + c[5] + '</text>'
          })
          return g
        }
      },
      { // Plug & Play
        bg: P.rose, mots: ['PLUG & PLAY.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), base = 640
          ;[['A5', 100, 0.5], ['A4', 140, 0.9], ['A3', 190, 1.3]].forEach(function (a, i) {
            var p = pop(lt, a[2], 0.5), x = [95, 225, 375][i]
            g += K3.op(p, K3.affiche(x, base - a[1] * 0.7 - 40 * (1 - p), a[1], [-4, 2, 5][i]))
            g += K3.op(p, '<text class="safe" x="' + x + '" y="' + (base + 50) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="26" fill="' + INK + '">' + a[0] + '</text>')
          })
          g += K3.op(pop(lt, 2.0), K3.pill(240, 750, 44, 'middle'))
          return g
        }
      },
      { // Sonder
        bg: P.lilas, mots: ['SONDEZ.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 230
          g += F.phone(140, y, 190, 360, -4, K3.ecranVote('Fête des commerces', pop(lt, 0.5, 0.3)))
          g += F.phone(355, y + 20, 190, 360, 4, K3.ecranResultats(F.prog(lt, 0.9, 1.4), 'Votre animation préférée ?', ['Marché de nuit', 'Fête des commerces', 'Concours de vitrines'], [0.52, 0.31, 0.17]))
          return g
        }
      },
      { // Mesurer
        bg: P.menthe, mots: ['MESUREZ.'], max: 120, from: [355, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 250, 240, 440, 0, K3.ecranStats(F.prog(lt, 0.3, 1.6), 'jours'))
          return g
        }
      },
      { // Origine
        bg: P.ciel, mots: ['SACHEZ D’OÙ', 'ILS VIENNENT.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 250, 240, 440, 0, K3.ecranStats(F.prog(lt, 0.4, 1.8), 'cp'))
          return g
        }
      },
      { // Sur un an
        bg: P.beurre, mots: ['UNE OPÉRATION', 'LISIBLE', 'SUR UN AN.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 120
          var p = F.easeInOut(F.prog(lt, 0.4, 2.2)), mois = 'JFMAMJJASOND'
          g += '<path d="M40,' + y + ' L' + (40 + 400 * p).toFixed(1) + ',' + y + '" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>'
          for (var m = 0; m < 12; m++) {
            var x = 50 + m * 34.5, on = p * 12 > m
            g += '<circle cx="' + x.toFixed(1) + '" cy="' + y + '" r="6" fill="' + (on ? INK : 'rgba(21,12,28,.2)') + '"/>' + K3.txt(x, y + 32, mois[m], 16, { anchor: 'middle', op: on ? 1 : 0.3 })
          }
          ;[[3, 'Printemps'], [5, 'Fête'], [8, 'Rentrée'], [11, 'Noël']].forEach(function (t, i) {
            var x = 50 + t[0] * 34.5, q = pop(lt, 0.4 + 2.2 * t[0] / 12, 0.3)
            g += K3.op(q, '<path d="M' + x + ',' + (y - 12) + ' L' + x + ',' + (y - 50 - (i % 2) * 34) + '" stroke="' + C.mag + '" stroke-width="3"/><circle cx="' + x + '" cy="' + y + '" r="11" fill="' + C.mag + '"/>' + K3.txt(x, y - 58 - (i % 2) * 34, t[1], 17, { anchor: i === 3 ? 'end' : 'middle', fill: C.mag }))
          })
          var pb = pop(lt, 2.8, 0.5)
          g += K3.op(pb, K3.rect(60, y + 80, 360, 170, 20, '#fff') + K3.txt(84, y + 120, 'BILAN DE L’ANNÉE', 16, { fill: '#6b6174', ls: 1 }) +
            K3.txt(84, y + 160, 'Parties, joueurs, commerces,', 20, {}) + K3.txt(84, y + 190, 'origine des clients :', 20, {}) + K3.txt(84, y + 220, 'tout est au même endroit.', 20, { fill: C.mag }))
          return g
        }
      },
      { // Fin
        bg: P.menthe, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Créez votre', 'super event.']) }
      }
    ]
  })
})()
