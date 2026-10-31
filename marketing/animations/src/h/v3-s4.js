/* s4 — « Le festival passe par votre boutique » (commerçants, super event, 36 s).
   Affiche réelle : station NDS 32 x 45 avec bandeau « Nos partenaires ». */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop

  function reseau(lt, cx, cy, top, a0) {
    var g = '', pts = [[80, top + 30, 'pain'], [400, top + 30, 'fleur'], [440, cy + 20, 'livre'], [60, cy + 30, 'soin'], [130, 740, 'cadeau'], [360, 740, 'boutique']]
    pts.forEach(function (s, k) {
      var p = pop(lt, a0 + k * 0.22, 0.3)
      g += '<path d="M' + s[0] + ',' + s[1] + ' L' + cx + ',' + cy + '" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="6 7" opacity="' + (0.5 * p).toFixed(3) + '"/>'
      g += K3.point(s[0], s[1], p, s[2])
    })
    return g
  }

  window.SCENARIO = K3.film('s4', {
    scenes: [
      { // Accroche
        bg: P.lilas, mots: ['LE FESTIVAL', 'PASSE PAR VOTRE', 'BOUTIQUE.'], max: 104,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0), y = F._basSous + 120
          g += K.scene(80, y + 40, 1, 1.6)
          var p = img0 ? 1 : F.easeInOut(F.prog(lt, 0.3, 1.6)), cols = [C.mag, '#fff', INK, C.gold]
          g += '<path d="M90,' + y + ' Q240,' + (y + 90) + ' 380,' + (y + 30) + '" stroke="' + INK + '" stroke-width="2" fill="none" stroke-dasharray="' + (360 * p).toFixed(0) + ' 999"/>'
          for (var k = 0; k < 9; k++) {
            var t = (k + 0.5) / 9
            if (t > p) break
            var x = (1 - t) * (1 - t) * 90 + 2 * (1 - t) * t * 240 + t * t * 380, yy = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + 90) + t * t * (y + 30)
            g += '<path d="M' + (x - 12).toFixed(1) + ',' + yy.toFixed(1) + ' L' + (x + 12).toFixed(1) + ',' + yy.toFixed(1) + ' L' + x.toFixed(1) + ',' + (yy + 26).toFixed(1) + ' Z" fill="' + cols[k % 4] + '"/>'
          }
          g += K3.vitrine(250, y + 60, 200, 250, { nom: 'VOTRE BOUTIQUE', icone: 'boutique', col: C.gold, macaron: img0 ? 1 : pop(lt, 1.9, 0.4) })
          return g
        }
      },
      { // Le super event
        bg: P.beurre, mots: ['UN SUPER', 'EVENT :'], max: 110, petit: ['Un même jeu, le festival', 'et les commerces.'], from: [410, 520],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 50, cx = 240, cy = (top + 752) / 2
          g += reseau(lt, cx, cy, top, 0.8)
          var pc = pop(lt, 0.4, 0.4)
          g += K3.op(pc, K3.at(cx, cy, 0.7 + 0.3 * pc, K.scene(0, -50, 1, 1.1) + K3.rect(-96, 0, 192, 60, 30, INK) + '<text y="40" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="24" fill="#fff">SUPER <tspan fill="' + C.mag + '">EVENT</tspan></text>'))
          return g
        }
      },
      { // Station de jeu
        bg: P.rose, mots: ['DEVENEZ', 'STATION DE JEU.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 40
          g += K3.vitrine(50, top, 380, 360, { nom: 'VOTRE BOUTIQUE', icone: 'boutique', col: C.gold })
          var p = pop(lt, 0.5, 0.5)
          g += K3.op(p, K3.at(150, top + 230, 0.7 + 0.3 * p, F.sticker(0, 0, 130, -4)))
          g += F.flash(150, top + 230, lt, 1.0, 2)
          return g
        }
      },
      { // L'affiche
        bg: P.menthe, mots: ['VOTRE NOM', 'SUR L’AFFICHE.'], from: [150, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 30, h = 752 - top, w = h / 1.406
          var z = 1 + 0.55 * F.easeInOut(F.prog(lt, 1.0, 1.4))
          g += K3.zoom('afficheStation', 240 - w / 2, top, w, h, 1.406, 0.5, 0.5 + 0.31 * F.easeInOut(F.prog(lt, 1.0, 1.4)), z)
          var pl = pop(lt, 2.5, 0.4)
          g += K3.op(pl, K3.rect(240 - w / 2 - 6, top + h * 0.5 - 52, w + 12, 104, 16, 'none', { stroke: C.mag, sw: 5 }))
          return g
        }
      },
      { // Plus de tout
        bg: P.ciel, mots: ['+ DE VUES.', '+ DE PASSAGES.', '+ D’ÉCHANGES.'], max: 84, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 60, h = 700 - top
          ;[['Vues', C.mag], ['Passages', INK], ['Échanges', C.violet]].forEach(function (j, i) {
            var p = F.easeOut(F.prog(lt, 0.5 + i * 0.6, 1.0)) * (0.55 + 0.15 * i)
            g += K3.jauge(70 + i * 135, top, 70, h, p, j[0], j[1])
          })
          return g
        }
      },
      { // Vos lots
        bg: P.lilas, mots: ['PRÉSENTEZ', 'VOS LOTS.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y0 = F._basSous + 60
          g += K3.lot(30, y0, 420, 'Un cadeau', 'Ex. : un produit de la boutique', 'cadeau', pop(lt, 0.4))
          g += K3.lot(30, y0 + 130, 420, 'Une remise après achat', '-15 % dès 30 € d’achat', 'remise', pop(lt, 1.2))
          var pc = pop(lt, 1.9)
          g += K3.op(pc, K3.rect(60, y0 + 240, 390, 76, 14, '#fff', { op: 0.7 }) + K3.txt(78, y0 + 270, 'Conditions affichées sur le billet :', 16, { w: 700, fill: '#6b6174' }) + K3.txt(78, y0 + 298, 'valable une fois, jusqu’à la date fixée.', 16, { w: 700, fill: '#6b6174' }))
          return g
        }
      },
      { // Le gagnant vient
        bg: P.beurre, mots: ['LE GAGNANT', 'VIENT CHEZ VOUS.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 40
          var pts = [[80, top + 340], [80, top + 200], [250, top + 200], [250, top + 70], [400, top + 70]]
          g += K.plan(top, lt, { piste: [0.6, 2.0], a: 9, pts: pts })
          g += K3.point(400, top + 70, pop(lt, 2.6, 0.4), 'boutique') + F.flash(400, top + 70, lt, 2.6, 2)
          var pb = pop(lt, 0.1, 0.5)
          g += K3.op(pb, F.phone(110, top + 330, 120, 230, -6, K3.ecranBilletQR('-15 % dès 30 €', 'Votre boutique', 'Grand jeu')))
          return g
        }
      },
      { // Vos chiffres
        bg: P.rose, mots: ['VOS CHIFFRES', 'EN DIRECT.'], from: [400, 520],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 270, 250, 460, 0, K3.ecranTrafic(F.easeOut(F.prog(lt, 0.4, 2.2)), [['Direct — QR sur place', 0.9], ['Réseaux · facebook', 0.5], ['Parrainage', 0.3]]))
          return g
        }
      },
      { // Fin
        bg: P.lilas, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Rejoignez un', 'super event.']) }
      }
    ]
  })
})()
