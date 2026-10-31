/* s8 — « Gagné : simple pour le client, simple pour le commerce » (20 s).
   Email gagnant, billet (billets-partenaires.html), validation (lot.html). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop
  var LOT = 'Bon d’achat 20 €', BOUT = 'Fleuriste du quartier'

  window.SCENARIO = K3.film('s8', {
    scenes: [
      { // Gagné
        bg: P.menthe, mots: ['TU AS', 'GAGNÉ !'], max: 130,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0)
          g += F.phone(240, F._basSous + 250, 230, 430, 0, K3.ecranEmail(LOT, img0 ? 1 : pop(lt, 0.6, 0.5)))
          g += F.flash(240, F._basSous + 150, lt, 0.6, 2)
          return g
        }
      },
      { // Le billet
        bg: P.beurre, mots: ['TON BILLET', 'EST SUR TON', 'TÉLÉPHONE.'], max: 104, from: [240, 640],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 240, 220, 410, 0, K3.ecranBilletQR(LOT, BOUT, 'Grand jeu'))
          return g
        }
      },
      { // En boutique
        bg: P.rose, mots: ['TU LE MONTRES.', 'IL LE SCANNE.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 30, mid = (top + 760) / 2
          g += '<rect x="0" y="' + top + '" width="540" height="' + (mid - top) + '" fill="#fff" opacity=".35"/>'
          g += '<path d="M0,' + mid + ' L540,' + mid + '" stroke="' + INK + '" stroke-width="4"/>'
          // Haut : le client montre son billet.
          g += K3.perso(120, mid - 10, 1.0, { tel: true })
          g += F.phone(300, (top + mid) / 2, 100, 190, -4, K3.ecranBilletQR(LOT, BOUT, 'Grand jeu'))
          g += K3.txt(470, top + 40, 'CLIENT', 18, { anchor: 'end', ls: 1.5, fill: 'rgba(21,12,28,.6)' })
          // Bas : le commerçant scanne.
          var p = pop(lt, 1.0, 0.6)
          g += K3.perso(380, 760, 1.0, { tel: true })
          g += F.phone(200, (mid + 760) / 2, 100, 190, 4, F.ecranScan)
          g += F.flash(200, (mid + 760) / 2, lt, 1.4, 2)
          g += K3.txt(30, mid + 40, 'COMMERÇANT', 18, { ls: 1.5, fill: 'rgba(21,12,28,.6)', op: 0.4 + 0.6 * p })
          return g
        }
      },
      { // Côté commerce
        bg: P.lilas, mots: ['UN TÉLÉPHONE', 'SUFFIT.'], from: [200, 640],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var code = Math.min(4, Math.floor(F.prog(lt, 0.4, 1.0) * 5)), e = lt < 1.9 ? 0 : 1
          g += F.phone(240, F._basSous + 250, 230, 430, 0, K3.ecranRetrait(e, code, BOUT, LOT))
          return g
        }
      },
      { // Validé
        bg: P.menthe, mots: ['RETRAIT', 'VALIDÉ.'], max: 130, from: [240, 640],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 230
          g += F.phone(150, y, 190, 360, -3, K3.ecranRetrait(2, 4, BOUT, LOT))
          g += F.flash(150, y - 60, lt, 0.2, 2)
          var p = F.easeInOut(F.prog(lt, 1.0, 1.4))
          g += K3.at(430 - 110 * p, y + 120 - 60 * Math.sin(Math.PI * p), 1.6, K3.icone('cadeau', 0, 0))
          g += K3.op(pop(lt, 2.4), K3.txt(270, y + 220, 'Un billet, une seule fois.', 24, { anchor: 'middle' }))
          return g
        }
      },
      { // Fin
        bg: P.beurre, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Récupère', 'ton cadeau !']) }
      }
    ]
  })
})()
