/* s6 — « Votre festival, partout en ville » (organisateurs de festivals, 40 s). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop

  // Sondage anonyme (questions bonus « sondage / RSE » du quiz NDS, sans bonne réponse).
  function ecranSondage(choix) {
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + F.entete(u, 'SONDAGE · ANONYME')
      g += K3.txt(14 * u, 118 * u, 'Comment es-tu venu', 17 * u, { fill: '#fff' }) + K3.txt(14 * u, 140 * u, 'au festival ?', 17 * u, { fill: '#fff' })
      ;['À pied ou à vélo', 'En navette', 'En voiture'].forEach(function (o, k) {
        var y = (166 + k * 50) * u, ok = k === 0 ? choix : 0
        g += K3.rect(14 * u, y, 212 * u, 40 * u, 12 * u, ok ? 'rgba(245,161,0,' + (0.25 * ok).toFixed(3) + ')' : 'rgba(255,255,255,.05)', { stroke: ok > 0.5 ? C.gold : 'rgba(255,255,255,.14)', sw: 1.5 * u })
        g += K3.txt(28 * u, y + 25 * u, o, 13 * u, { w: 600, fill: '#fff' })
      })
      g += K3.txt(120 * u, 340 * u, 'Réponses anonymes', 10 * u, { anchor: 'middle', w: 700, fill: 'rgba(255,255,255,.5)' })
      return g
    }
  }

  window.SCENARIO = K3.film('s6', {
    scenes: [
      { // Accroche
        bg: P.beurre, mots: ['VOTRE FESTIVAL,', 'PARTOUT', 'EN VILLE.'], max: 110,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0), cy = F._basSous + 230, cx = 240
          var pts = [[60, cy - 150, 'pain'], [420, cy - 150, 'fleur'], [40, cy + 60, 'livre'], [440, cy + 60, 'soin'], [110, cy + 220, 'cadeau'], [370, cy + 220, 'boutique']]
          pts.forEach(function (s, k) {
            var p = img0 ? 1 : F.easeOut(F.prog(lt, 0.6 + k * 0.2, 0.6))
            g += '<path d="M' + cx + ',' + cy + ' L' + (cx + (s[0] - cx) * p).toFixed(1) + ',' + (cy + (s[1] - cy) * p).toFixed(1) + '" stroke="' + C.gold + '" stroke-width="16" stroke-linecap="round" opacity=".55"/>'
            g += K3.point(s[0], s[1], img0 ? 1 : pop(lt, 1.1 + k * 0.2, 0.3), s[2])
          })
          g += K.scene(cx, cy, 1, 1.8)
          return g
        }
      },
      { // Le lien
        bg: P.lilas, mots: ['FLOWIN, VOTRE', 'LIEN DE', 'DIFFUSION.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 40, cy = (top + 752) / 2
          var noeuds = [[90, top + 50, 'scene', 'Festival'], [390, top + 50, 'boutique', 'Commerces'], [90, 720, 'cadeau', 'Partenaires'], [390, 720, 'quiz', 'Joueurs']]
          noeuds.forEach(function (n, k) {
            var p = pop(lt, 0.6 + k * 0.3, 0.35)
            g += '<path d="M' + n[0] + ',' + n[1] + ' L240,' + cy + '" stroke="' + INK + '" stroke-width="3" stroke-dasharray="7 7" opacity="' + (0.6 * p).toFixed(3) + '"/>'
            g += K3.op(p, (n[2] === 'scene' ? K.scene(n[0], n[1], 1, 1) : K3.point(n[0], n[1], 1, n[2])) + '<text class="safe" x="' + n[0] + '" y="' + (n[1] + 62) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="20" fill="' + INK + '">' + n[3] + '</text>')
          })
          var pc = pop(lt, 0.3, 0.4)
          g += K3.op(pc, K3.at(240, cy, 0.7 + 0.3 * pc, K3.rect(-90, -40, 180, 80, 40, '#fff') + F.logo(0, 14, 40, INK, 'middle')))
          g += F.flash(240, cy, lt, 1.8, 2)
          return g
        }
      },
      { // Les relais
        bg: P.ciel, mots: ['CHAQUE STATION', 'EST UN RELAIS.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 140
          ;[['Affiche', 'boutique'], ['Réseaux', 'vote'], ['Clients', 'cadeau']].forEach(function (r, i) {
            var x = 22 + i * 150, p = pop(lt, 0.5 + i * 0.5, 0.4)
            g += K3.vitrine(x, y, 134, 190, { nom: 'STATION', icone: ['pain', 'fleur', 'livre'][i], col: C.gold, macaron: p })
            g += F.flash(x + 67, y + 100, lt, 0.5 + i * 0.5, 2)
            g += K3.op(p, K3.at(x + 67, y + 270, 1, K3.rect(-62, -26, 124, 52, 26, INK) + '<text class="safe" y="8" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="20" fill="#fff">' + r[0] + '</text>'))
          })
          g += '<rect x="0" y="' + (y + 190) + '" width="540" height="14" fill="' + INK + '"/>'
          return g
        }
      },
      { // Visibilité
        bg: P.rose, mots: ['+ DE VISIBILITÉ.', '+ DE FRÉQUENTATION.'], max: 90, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 70, h = 690 - top
          g += K3.jauge(120, top, 80, h, F.easeOut(F.prog(lt, 0.5, 1.2)) * 0.7, 'Visibilité', C.mag)
          g += K3.jauge(280, top, 80, h, F.easeOut(F.prog(lt, 1.0, 1.2)) * 0.62, 'Fréquentation', INK)
          return g
        }
      },
      { // Animer
        bg: P.menthe, mots: ['ANIMEZ CHAQUE', 'PASSAGE.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), py = F._basSous + 220
          g += F.phone(180, py, 190, 360, -3, F.ecranQuiz(pop(lt, 1.2, 0.3)))
          ;['Caisses', 'Bars', 'Stands'].forEach(function (t, k) {
            var p = pop(lt, 0.4 + k * 0.35, 0.35), y = py - 110 + k * 80
            g += K3.op(p, K3.at(380 + (1 - p) * 40, y, 1, K3.rect(-64, -25, 128, 50, 25, '#fff') + '<text class="safe" y="8" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="20" fill="' + INK + '">' + t + '</text>'))
          })
          return g
        }
      },
      { // Sensibiliser
        bg: P.beurre, mots: ['SENSIBILISEZ.'], max: 110, from: [180, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 240
          g += F.phone(140, y, 190, 360, -4, ecranSondage(pop(lt, 0.5, 0.3)))
          g += F.phone(355, y + 20, 190, 360, 4, K3.ecranResultats(F.prog(lt, 0.9, 1.4), 'Venu au festival…', ['À pied ou à vélo', 'En navette', 'En voiture'], [0.46, 0.21, 0.33]))
          return g
        }
      },
      { // Mesurer
        bg: P.lilas, mots: ['MESUREZ', 'LE PASSAGE.'], max: 110, from: [355, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 260, 250, 460, 0, K3.ecranTrafic(F.easeOut(F.prog(lt, 0.3, 2.0)), [['Caisse 1', 0.9], ['Bar 1', 0.7], ['Stand 2', 0.45]], 'VOS STATIONS'))
          return g
        }
      },
      { // Personas
        bg: P.ciel, mots: ['CONNAISSEZ', 'VOTRE PUBLIC.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 260, 250, 460, 0, K3.ecranStats(F.prog(lt, 0.3, 1.8)))
          return g
        }
      },
      { // Le fichier
        bg: P.rose, mots: ['DÉVELOPPEZ', 'VOTRE FICHIER.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 260, 250, 460, 0, K3.ecranCRM(F.prog(lt, 0.4, 2.0), 0))
          return g
        }
      },
      { // Interagir
        bg: P.menthe, mots: ['INTERAGISSEZ', 'EN DIRECT.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 240
          var e = lt < 0.9 ? 0 : lt < 1.8 ? 1 : 2
          g += F.phone(150, y, 200, 370, -4, K3.ecranTirage(e, 'Places de concert'))
          var pe = pop(lt, 2.0, 0.5)
          g += K3.op(pe, F.phone(360, y + 20, 180, 340, 5, K3.ecranEmail('Places de concert', pop(lt, 2.4, 0.4))))
          g += F.flash(360, y + 20, lt, 2.0, 2)
          return g
        }
      },
      { // Fin
        bg: P.beurre, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Devenez un', 'super event.']) }
      }
    ]
  })
})()
