/* s2 — « Chaque commerce, une occasion de gagner » (clients des commerces, 36 s).
   Commerces fictifs ; écrans réels (roue, billet, retrait lot.html). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop

  function rue(lt, y, macarons, noms) {
    var g = '<rect x="0" y="' + (y + 190) + '" width="540" height="18" fill="' + INK + '"/>'
    noms.forEach(function (n, i) {
      var m = macarons ? pop(lt, macarons[0] + i * macarons[1], 0.35) : undefined
      g += K3.vitrine(22 + i * 150, y, 134, 190, { nom: n[0], icone: n[1], col: n[2] })
      if (m !== undefined) { g += K3.macaron(22 + i * 150 + 67, y + 100, 22, m); g += F.flash(22 + i * 150 + 67, y + 100, lt, macarons[0] + i * macarons[1], 1) }
    })
    return g
  }
  var NOMS = [['BOULANGERIE', 'pain', C.gold], ['FLEURISTE', 'fleur', C.mag], ['LIBRAIRIE', 'livre', C.violet]]

  window.SCENARIO = K3.film('s2', {
    scenes: [
      { // Accroche
        bg: P.ciel, mots: ['TA RUE', 'CACHE DES', 'CADEAUX.'], max: 110,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0)
          g += K3.at(-24, F._basSous + 90, 1.1, rue(img0 ? 99 : lt, 0, [0.6, 0.55], NOMS))
          return g
        }
      },
      { // Le macaron
        bg: P.beurre, mots: ['REPÈRE LE', 'MACARON', 'FLOWIN.'], max: 110, from: [390, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 190
          g += K3.rect(40, y - 160, 400, 330, 10, '#EAF6FB', { stroke: INK, sw: 4 }) + '<path d="M80,' + (y - 130) + ' L140,' + (y - 70) + ' M100,' + (y - 140) + ' L180,' + (y - 60) + '" stroke="#fff" stroke-width="10" stroke-linecap="round"/>'
          var p = pop(lt, 0.3, 0.6)
          g += K3.macaron(240, y, 90 + 20 * p, p)
          return g
        }
      },
      { // Flashe
        bg: P.menthe, mots: ['FLASHE.', 'C’EST GRATUIT.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 190
          g += K3.macaron(150, y, 90, 1)
          var p = F.easeOut(F.prog(lt, 0.1, 0.7))
          g += F.phone(520 - 160 * p, y + 10, 150, 290, 8, F.ecranScan)
          g += F.flash(150, y, lt, 1.0, 3)
          return g
        }
      },
      { // Chaque commerçant a son jeu
        bg: P.rose, mots: ['CHAQUE', 'COMMERÇANT', 'A SON JEU.'], max: 104, from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 50
          g += rue(lt, y, null, NOMS)
          ;[['Quiz', 'quiz'], ['Roue', 'roue'], ['Tombola', 'tombola']].forEach(function (j, i) {
            var p = pop(lt, 0.6 + i * 0.5, 0.4), x = 22 + i * 150 + 67
            if (p <= 0) return
            g += K3.at(x, y + 310 + 20 * (1 - p), 1.15 * (0.7 + 0.3 * p), K3.rect(-62, -52, 124, 104, 18, '#fff') + K3.icone(j[1], 0, -12) + K3.txt(0, 38, j[0], 20, { anchor: 'middle' }))
          })
          return g
        }
      },
      { // La révélation
        bg: P.lilas, mots: ['GAGNÉ ?', 'DÉCOUVRE-LE', 'TOUT DE SUITE.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 70
          var vignette = function (x, a, fond, l1, l2, col) {
            var p = F.easeInOut(F.prog(lt, a, 0.9))
            var gg = K3.rect(x, y, 200, 300, 18, fond) + K3.txt(x + 100, y + 145, l1, l2 ? 26 : 36, { anchor: 'middle', fill: col }) + (l2 ? K3.txt(x + 100, y + 177, l2, 26, { anchor: 'middle', fill: col }) : '')
            // Couverture qui se décolle depuis le coin.
            if (p < 1) gg += '<g transform="translate(' + (x + 200) + ',' + y + ') rotate(' + (-70 * p).toFixed(1) + ') translate(' + (-200) + ',0)" opacity="' + (1 - p * 0.6).toFixed(2) + '">' + K3.rect(0, 0, 200, 300, 18, INK) + F.logo(100, 156, 40, '#fff', 'middle') + K3.txt(100, 195, 'DÉCOLLE-MOI', 14, { anchor: 'middle', fill: 'rgba(255,255,255,.6)', ls: 1.5 }) + '</g>'
            return gg
          }
          g += vignette(28, 0.5, C.gold, 'GAGNÉ !', '', '#fff')
          g += vignette(252, 1.4, '#fff', 'Ticket pour', 'le tirage', C.violet)
          g += F.flash(128, y + 120, lt, 1.3, 2)
          return g
        }
      },
      { // Une occasion de gagner
        bg: P.ciel, mots: ['CHAQUE COMMERCE,', 'UNE OCCASION', 'DE GAGNER.'], max: 100, from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 40, h = 752 - top
          var rues = 'M30,' + (top + h * 0.3) + ' L450,' + (top + h * 0.3) + ' M30,' + (top + h * 0.75) + ' L450,' + (top + h * 0.75) + ' M150,' + top + ' L150,752 M330,' + top + ' L330,752'
          g += '<path d="' + rues + '" stroke="#fff" stroke-width="18" stroke-linecap="round"/>'
          var pts = [[70, top + h * 0.12, 'pain'], [240, top + h * 0.16, 'fleur'], [410, top + h * 0.1, 'livre'], [80, top + h * 0.52, 'cadeau'], [240, top + h * 0.55, 'boutique'], [410, top + h * 0.5, 'soin'], [100, top + h * 0.93, 'massage'], [390, top + h * 0.92, 'remise']]
          pts.forEach(function (s, i) { var a = 0.5 + i * 0.35; g += K3.point(s[0], s[1], pop(lt, a, 0.3), s[2]) + F.flash(s[0], s[1], lt, a, 1) })
          return g
        }
      },
      { // Les cadeaux
        bg: P.beurre, mots: ['DES CADEAUX', 'PRÈS DE', 'CHEZ TOI.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y0 = F._basSous + 36
          ;[['Bon d’achat', 'remise'], ['Soin capillaire', 'soin'], ['Massage', 'massage'], ['Produit offert', 'cadeau']].forEach(function (c, i) {
            g += K3.lot(30, y0 + i * 92, 420, c[0], '', c[1], pop(lt, 0.5 + i * 0.5, 0.45))
          })
          g += K3.txt(30, 762, 'Lots donnés à titre d’exemple, selon le commerce.', 15, { w: 700, fill: 'rgba(21,12,28,.6)', op: pop(lt, 2.6) })
          return g
        }
      },
      { // Le retrait
        bg: P.menthe, mots: ['MONTRE TON', 'BILLET.', 'REPARS AVEC.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 220
          var pin = pop(lt, 0.1, 0.6)
          g += K3.op(pin, F.phone(130 - 30 * (1 - pin), y, 160, 300, -6, K3.ecranBilletQR('Bon d’achat 20 €', 'Fleuriste du quartier', 'Jeu des commerçants')))
          g += F.flash(130, y - 10, lt, 1.0, 2)
          var e = lt < 1.6 ? 1 : 2
          g += F.phone(340, y - 10, 200, 370, 4, K3.ecranRetrait(e, 4, 'Fleuriste du quartier', 'Bon d’achat 20 €'))
          if (e === 2) g += F.flash(340, y - 40, lt, 1.6, 2)
          return g
        }
      },
      { // Découvre
        bg: P.rose, mots: ['ET DÉCOUVRE', 'TES COMMERCES.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += K.plan(F._basSous + 50, lt, { piste: [0.4, 2.6], a: 0.4, pas: 0.45, nums: true })
          return g
        }
      },
      { // Fin
        bg: P.ciel, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Joue chez tes', 'commerçants !']) }
      }
    ]
  })
})()
