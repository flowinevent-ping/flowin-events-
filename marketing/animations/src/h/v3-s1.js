/* s1 — « Flowin, le jeu de ton festival » (festivaliers, 36 s).
   Écrans réels du quiz Nuits du Sud ; affiche station réelle (kit digital). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop

  window.SCENARIO = K3.film('s1', {
    scenes: [
      { // Accroche
        bg: P.beurre, mots: ['CE SOIR,', 'TU JOUES', 'AUSSI.'], max: 104,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0)
          g += K.festival(F._basSous + 20, lt)
          var p = img0 ? 1 : pop(lt, 1.1, 0.4)
          g += '<rect x="356" y="' + (F._basSous + 120) + '" width="96" height="70" rx="8" fill="#fff" stroke="' + INK + '" stroke-width="3"/>' + K3.txt(404, F._basSous + 140, 'CAISSE', 13, { anchor: 'middle' })
          g += K3.macaron(404, F._basSous + 168, 20, p)
          g += F.flash(404, F._basSous + 168, lt, 1.2, 2)
          return g
        }
      },
      { // Flowin
        bg: P.rose, mots: ['FLOWIN,', 'C’EST QUOI ?'], from: [404, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var p = pop(lt, 0.5, 0.5)
          g += K3.op(p, F.logo(240, 560, 130 * (0.85 + 0.15 * p), INK, 'middle'))
          g += K3.op(pop(lt, 1.0), K3.pill(240, 650, 56, 'middle'))
          g += F.flash(240, 520, lt, 0.6, 2)
          return g
        }
      },
      { // Le principe
        bg: P.lilas, mots: ['UN FLASH.', 'UN JEU.', 'UN CADEAU.'], max: 100, from: [240, 520],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 200
          ;[['flash', 0.5, 'Flash'], ['quiz', 1.2, 'Jeu'], ['cadeau', 1.9, 'Cadeau']].forEach(function (c, i) {
            var p = pop(lt, c[1], 0.35), x = 95 + i * 145
            if (p <= 0) return
            g += K3.op(p, '<text class="safe" x="' + x + '" y="' + (y + 120) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="28" fill="' + INK + '">' + c[2] + '</text>')
            g += K3.at(x, y, (0.6 + 0.4 * p) * 1.2, '<circle r="58" fill="#fff"/>' + (c[0] === 'flash' ? '<rect x="-24" y="-24" width="48" height="48" rx="8" fill="' + INK + '"/><rect x="-14" y="-14" width="11" height="11" fill="#fff"/><rect x="3" y="-14" width="11" height="11" fill="#fff"/><rect x="-14" y="3" width="11" height="11" fill="#fff"/><rect x="6" y="6" width="6" height="6" fill="#fff"/>' : K3.at(0, 0, 1.3, K3.icone(c[0], 0, 0))))
            g += F.flash(x, y, lt, c[1], 1)
          })
          return g
        }
      },
      { // Le téléphone
        bg: P.menthe, mots: ['TON TÉLÉPHONE', 'SUFFIT.'], from: [240, 520],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 210
          g += F.sticker(150, y, 160, -5)
          var p = F.easeOut(F.prog(lt, 0.2, 0.8))
          g += F.phone(520 - 170 * p, y - 20, 150, 290, 8, F.ecranScan)
          g += F.flash(150, y, lt, 1.2, 3)
          return g
        }
      },
      { // Les stations
        bg: P.ciel, mots: ['REPÈRE LES', 'STATIONS DE JEU.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 40
          g += K.plan(top, lt, { a: 0.3, pas: 0.18 })
          var h = 752 - top
          ;[['Caisses', 66, top + h * 0.34], ['Bars', 320, top + h * 0.34], ['Stands', 190, top + h * 0.7]].forEach(function (s, i) {
            var p = pop(lt, 0.5 + i * 0.2, 0.3)
            g += K3.op(p, K3.rect(s[1] - 40, s[2] + 22, 80, 26, 13, INK) + K3.txt(s[1], s[2] + 40, s[0], 14, { anchor: 'middle', fill: '#fff' }))
          })
          var pa = pop(lt, 1.4, 0.5)
          if (pa > 0) g += '<rect x="0" y="' + top + '" width="540" height="' + (760 - top) + '" fill="' + P.ciel + '" opacity="' + (0.7 * pa).toFixed(3) + '"/>' + K3.at(130, top + 10 + 30 * (1 - pa), 1, K3.img('afficheStation', 0, 0, 230, 323, { r: 8 }), 4 - 4 * pa)
          g += F.flash(245, top + 170, lt, 1.6, 2)
          return g
        }
      },
      { // Les jeux
        bg: P.rose, mots: ['QUIZ.', 'ROULETTE.', 'TOMBOLA.'], max: 96, from: [350, 500],
        draw: function (lt) {
          var g = K3.titre(this, lt), y0 = F._basSous + 40
          ;[['Quiz + bonus', 'quiz'], ['Spin roulette', 'roue'], ['Tombola', 'tombola']].forEach(function (c, i) {
            var a = 0.4 + i * 0.5, p = F.prog(lt, a, 0.5), sx = Math.abs(Math.cos(Math.PI * (1 - p) / 2 * 1)), face = p > 0.5
            if (p <= 0) return
            var y = y0 + 20 + i * 130, inner = face ? K3.rect(-210, -54, 420, 108, 20, '#fff') + K3.at(-150, 0, 1.3, K3.icone(c[1], 0, 0)) + K3.txt(-90, 12, c[0], 34, {}) : K3.rect(-210, -54, 420, 108, 20, INK) + F.logo(0, 14, 40, '#fff', 'middle')
            g += '<g transform="translate(240,' + (y + 54) + ') scale(' + Math.max(0.02, sx).toFixed(3) + ',1)">' + inner + '</g>'
          })
          return g
        }
      },
      { // Le quiz
        bg: P.beurre, mots: ['RÉPONDS.', 'GAGNE DES', 'TICKETS.'], max: 100, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), py = F._basSous + 215
          var bonus = lt > 1.8
          if (!bonus) g += F.phone(240, py, 200, 370, 0, F.ecranQuiz(pop(lt, 0.6, 0.35)))
          else g += F.phone(240, py, 200, 370, 0, F.ecranBonus(pop(lt, 2.4, 0.35)))
          g += F.flash(240, py, lt, 1.8, 2)
          var pt = pop(lt, 0.9, 0.4)
          g += K3.op(pt * (bonus ? 0 : 1), K3.at(390, py - 120, 0.5 + 0.5 * pt, K3.rect(-44, -22, 88, 44, 22, C.mag) + K3.txt(0, 8, '+1 ticket', 18, { anchor: 'middle', fill: '#fff' })))
          return g
        }
      },
      { // Les cadeaux
        bg: P.lilas, mots: ['À GAGNER :'], petitSize: 23, petit: ['Places de concert, pass VIP,', 'lots des commerçants.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y0 = F._basSous + 44
          var fall = function (a) { return pop(lt, a, 0.45) }
          g += K3.at(0, 20, 1, K3.lot(30, y0, 420, 'Places de concert', 'Au festival', 'place', fall(0.8)))
          g += K3.at(0, 20, 1, K3.lot(30, y0 + 125, 420, 'Pass VIP', 'Pour vivre le festival', 'vip', fall(1.4)))
          g += K3.at(0, 20, 1, K3.lot(30, y0 + 250, 420, 'Lots des commerçants', 'Chez les partenaires', 'boutique', fall(2.0)))
          g += K3.txt(30, 760, 'Lots donnés à titre d’exemple, selon l’événement.', 15, { w: 700, fill: 'rgba(21,12,28,.6)', op: fall(2.4) })
          return g
        }
      },
      { // Le gain
        bg: P.menthe, mots: ['LE BILLET ARRIVE', 'SUR TON', 'TÉLÉPHONE.'], max: 100, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), py = F._basSous + 225
          var ecr = lt < 1.3 ? F.ecranScore : lt < 2.8 ? K3.ecranEmail('Places de concert', pop(lt, 1.6, 0.4)) : K3.ecranBilletQR('Places de concert', 'Festival Nuits du Sud', 'Grand jeu')
          g += F.phone(240, py, 210, 390, 0, ecr)
          g += F.flash(240, py, lt, 1.3, 1) + F.flash(240, py, lt, 2.8, 2)
          return g
        }
      },
      { // Fin
        bg: P.beurre, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Flashe une station.', 'Réponds au quiz.', 'Et gagne !']) }
      }
    ]
  })
})()
