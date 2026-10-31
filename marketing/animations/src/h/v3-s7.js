/* s7 — « Votre marque au cœur du jeu » (sponsors, 25 s). « VOTRE MARQUE » est
   un emplacement générique : aucune vraie marque. Pack Sponsor officiel :
   présence sur tous les supports et stations, bandeau défilant de l'app,
   lot mis en jeu (bon-commande-nds). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop
  var MQ = C.violet

  // Quiz NDS avec le bandeau partenaires défilant (dock au-dessus de la nav).
  function quizBandeau(lt) {
    return function (sw, sh) {
      var u = sw / 240, g = F.ecranQuiz(1)(sw, sh), by = sh - 44 * u, off = (lt * 60 * u) % (120 * u)
      g += K3.rect(0, by, sw, 44 * u, 0, '#fff')
      for (var i = -1; i < 4; i++) {
        var x = i * 120 * u - off + 10 * u
        g += K3.rect(x, by + 8 * u, 100 * u, 28 * u, 8 * u, '#fff', { stroke: MQ, sw: 1.4 * u }) + '<circle cx="' + (x + 16 * u).toFixed(1) + '" cy="' + (by + 22 * u).toFixed(1) + '" r="' + (7 * u).toFixed(1) + '" fill="' + MQ + '"/>' + K3.txt(x + 60 * u, by + 26 * u, 'VOTRE MARQUE', 8.5 * u, { anchor: 'middle', fill: MQ })
      }
      return g
    }
  }

  window.SCENARIO = K3.film('s7', {
    scenes: [
      { // Accroche
        bg: P.lilas, mots: ['VOTRE MARQUE', 'AU CŒUR', 'DU JEU.'], max: 110,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0), cx = 240, cy = F._basSous + 220
          ;['quiz', 'roue', 'tombola', 'cadeau', 'place', 'vote'].forEach(function (ic, i) {
            var a = i * Math.PI / 3 + lt * 0.4, p = img0 ? 1 : pop(lt, 0.3 + i * 0.12, 0.4)
            g += K3.op(p, K3.at(cx + 170 * Math.cos(a), cy + 150 * Math.sin(a), 1, '<circle r="40" fill="#fff"/>' + K3.at(0, 0, 0.9, K3.icone(ic, 0, 0))))
          })
          var pm = img0 ? 1 : pop(lt, 0.8, 0.5)
          g += K3.op(pm, K3.marque(cx, cy, 230 * (0.8 + 0.2 * pm), MQ))
          return g
        }
      },
      { // Partout
        bg: P.rose, mots: ['SUR TOUTES', 'LES STATIONS.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 230
          ;[[95, -6, 0.4], [240, 2, 0.8], [385, 6, 1.2]].forEach(function (a) {
            var p = pop(lt, a[2], 0.45)
            g += K3.op(p, K3.affiche(a[0], y + 30 * (1 - p), 145, a[1], { marque: true, marqueCol: MQ }))
            g += F.flash(a[0], y + 100, lt, a[2] + 0.3, 1)
          })
          g += K3.op(pop(lt, 1.8), K3.txt(240, y + 190, 'Affiches · stations · supports', 22, { anchor: 'middle' }))
          return g
        }
      },
      { // Le bandeau
        bg: P.menthe, mots: ['DANS CHAQUE', 'PARTIE.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 250, 240, 440, 0, quizBandeau(lt))
          g += K3.op(pop(lt, 1.0), K3.at(410, F._basSous + 420, 1, K3.rect(-56, -20, 112, 40, 20, INK) + K3.txt(0, 7, 'Bandeau', 18, { anchor: 'middle', fill: '#fff' })))
          return g
        }
      },
      { // Le lot RSE
        bg: P.beurre, mots: ['UN LOT À', 'VOTRE NOM.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 80
          var p = pop(lt, 0.4, 0.5)
          g += K3.op(p, K3.at(240, y + 150 + 30 * (1 - p), 1, K3.rect(-200, -150, 400, 300, 24, '#fff') + K3.at(0, -70, 2, K3.icone('cadeau', 0, 0)) + K3.txt(0, 30, 'Lot offert par', 24, { anchor: 'middle', w: 700, fill: '#6b6174' })))
          g += K3.op(pop(lt, 1.0), K3.marque(240, y + 250, 260, MQ))
          g += F.flash(240, y + 250, lt, 1.0, 2)
          return g
        }
      },
      { // Moment heureux
        bg: P.lilas, mots: ['ASSOCIÉE À UN', 'MOMENT', 'HEUREUX.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), base = 740
          var j = Math.abs(Math.sin(lt * 4)) * 14
          g += '<g fill="' + INK + '" transform="translate(150,' + (base - j).toFixed(1) + ') scale(1.5)"><circle cy="-112" r="22"/><path d="M-34,0 L-34,-58 Q-34,-84 0,-84 Q34,-84 34,-58 L34,0 Z"/><path d="M-26,-76 L-48,-130 M26,-76 L48,-130" stroke="' + INK + '" stroke-width="14" stroke-linecap="round"/></g>'
          for (var k = 0; k < 18; k++) {
            var a = k * 2.4, r = 40 + ((k * 37) % 110) + lt * 30, x = 150 + r * Math.cos(a), y = base - 230 + r * Math.sin(a) * 0.7 + lt * 20
            g += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="10" height="16" rx="2" fill="' + [C.mag, C.gold, C.teal, MQ][k % 4] + '" transform="rotate(' + (k * 40 + lt * 90).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>'
          }
          g += F.phone(360, base - 170, 150, 280, 6, K.ecranGain)
          g += K3.op(pop(lt, 1.2), K3.marque(360, base + 10, 200, MQ))
          return g
        }
      },
      { // Fin
        bg: P.rose, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Devenez sponsor', 'du super event.']) }
      }
    ]
  })
})()
