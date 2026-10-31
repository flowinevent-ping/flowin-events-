/* s3-v4 — « Vous saurez enfin quelle pub vous rapporte des clients » (51 s).
   Nouveau style : peinture qui déborde, grands chiffres peints, objets et
   vrais écrans, aucun personnage, aucune façade. Plans de 4 à 5,5 s. */
(function () {
  var F = window.FH, K3 = window.K3, K4 = window.K4, C = F.C, INK = C.ink, P = K3.P, MAG = C.mag
  var pop = K3.pop
  var NOM = 'Votre magasin'

  window.SCENARIO = K3.film('s3-v4', {
    scenes: [
      { // La question
        bg: P.rose, mots: ['VOTRE PUB', 'MARCHE ?'], max: 120, petit: ['Bus, affiche, Facebook…', 'impossible à savoir.'],
        draw: function (lt, img0) {
          var L = img0 ? 9 : lt, T = K3.titre(this, lt, img0), g = '', top = F._basSous + 30
          g += K4.chiffre('?', 315, top + 370, 360, MAG, C.gold, L, 0.5, 5)
          g += K3.op(pop(L, 1.2), K4.bus(95, top + 90, 120))
          g += K3.op(pop(L, 1.5), K4.pubReseau(95, top + 330, 110, -6))
          return g + T
        }
      },
      { // Pour qui
        bg: P.menthe, mots: ['SUPERMARCHÉ.', 'AUTO-ÉCOLE.', 'GARAGE.'], max: 100, petit: ['Les commerces qui', 'veulent du monde.'], from: [300, 560],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 190
          ;[['caddie', C.teal, 'Supermarché'], ['auto', C.violet, 'Auto-école'], ['garage', C.gold, 'Garage']].forEach(function (c, i) {
            var a = 0.6 + i * 0.6, x = 90 + i * 150, q = pop(lt, a + 0.2, 0.4)
            g += K4.tache(x, y, 78, c[1], 11 + i * 4, F.prog(lt, a, 1.4), 0.5)
            g += K3.op(q, '<circle cx="' + x + '" cy="' + y + '" r="52" fill="#fff"/>' + K4.picto(c[0], x, y, 1))
            g += K3.op(q, '<text class="safe" x="' + x + '" y="' + (y + 175) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="21" fill="' + INK + '">' + c[2] + '</text>')
          })
          return g + T
        }
      },
      { // Jour 1 : Plug & Play
        bg: P.beurre, mots: ['ON BRANCHE,', 'ON JOUE.'], max: 120, petit: ['Un QR, une affiche.', 'Rien à installer.'], from: [240, 560],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40
          g += K4.chiffre('1', 125, top + 340, 300, MAG, C.violet, lt, 0.3, 21)
          g += K3.op(pop(lt, 0.3), K3.rect(60, top + 6, 120, 52, 26, INK) + K3.txt(120, top + 42, 'JOUR', 30, { anchor: 'middle', ls: 2, fill: '#fff' }))
          var pa = pop(lt, 1.2, 0.5), pc = pop(lt, 1.6, 0.5)
          g += K3.op(pa, K3.affiche(350, top + 130 + 30 * (1 - pa), 130, 4))
          g += K3.op(pc, K3.chevalet(330, top + 300 + 30 * (1 - pc), 96))
          g += K3.op(pop(lt, 2.2), K3.pill(240, top + 420, 52, 'middle'))
          return g + T
        }
      },
      { // Un QR par support
        bg: P.ciel, mots: ['UN QR PAR', 'SUPPORT.'], max: 90, petit: ['Chaque pub a son propre QR.'], from: [240, 640],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y1 = F._basSous + 120, y2 = y1 + 215
          var it = [
            [125, y1, function () { return K4.bus(0, 0, 130) }, 'Arrière de bus', C.gold],
            [355, y1, function () { return K4.setTable(0, 0, 180, -4) }, 'Set de table', C.teal],
            [125, y2, function () { return K4.pubReseau(0, -10, 120, -4) }, 'Pub Facebook', C.violet],
            [355, y2, function () { return K4.afficheCaisse(0, -10, 110, 3) }, 'Affiche en caisse', MAG]
          ]
          it.forEach(function (o, i) {
            var a = 0.5 + i * 0.7, q = pop(lt, a + 0.1, 0.45)
            g += K4.tache(o[0], o[1], 70, o[4], 31 + i, F.prog(lt, a, 1.2) * 0.9, 0.35)
            g += K3.op(q, K3.at(o[0], o[1] + 20 * (1 - q), 1, o[2]()))
            g += K3.op(q, K3.rect(o[0] - 88, o[1] + 82, 176, 32, 16, '#fff') + '<text class="safe" x="' + o[0] + '" y="' + (o[1] + 104) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="' + INK + '">' + o[3] + '</text>')
          })
          return g + T
        }
      },
      { // Vos clients jouent
        bg: P.lilas, mots: ['VOS CLIENTS', 'JOUENT.'], max: 120, petit: ['Quiz, roue, tombola.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 230
          g += K4.tache(240, y - 20, 170, C.teal, 41, F.prog(lt, 0.2, 1.4) * 0.9)
          g += F.phone(150, y, 190, 360, -5, K3.ecranQuizC(NOM, pop(lt, 1.6, 0.35), { l1: 'Quel fruit est riche', l2: 'en vitamine C ?', o: ['Le kiwi', 'Le riz', 'Le pain', 'Le sucre'], ok: 0 }))
          g += F.phone(345, y + 20, 190, 360, 5, K3.ecranRoue(NOM, 900 * F.easeOut(F.prog(lt, 0.6, 3.0)), ['Bon -10 %', 'Perdu', 'Cadeau', 'Perdu', 'Bon 5 €', 'Perdu']))
          return g + T
        }
      },
      { // Jour 7
        bg: P.rose, mots: ['VOUS', 'MESUREZ.'], max: 130, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 30
          g += K4.chiffre('7', 240, top + 420, 380, C.gold, MAG, lt, 0.3, 57)
          g += K3.op(pop(lt, 0.3), K3.rect(165, top + 4, 150, 60, 30, INK) + K3.txt(240, top + 46, 'JOUR', 36, { anchor: 'middle', ls: 3, fill: '#fff' }))
          return g + T
        }
      },
      { // La mesure
        bg: P.menthe, mots: ['CHAQUE PUB,', 'MESURÉE.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40, h = 690 - top - 100
          var j = [
            ['Bus', 0.28, C.gold, function (x, y) { return K4.bus(x, y, 58) }],
            ['Set de table', 0.52, C.teal, function (x, y) { return K4.setTable(x, y, 84) }],
            ['Facebook', 0.86, C.violet, function (x, y) { return K4.pubReseau(x, y, 50) }],
            ['Caisse', 0.68, MAG, function (x, y) { return K3.affiche(x, y, 40, 0) }]
          ]
          j.forEach(function (o, i) {
            var x = 42 + i * 108, v = K4.valeur(lt, 0.4 + i * 0.25, o[1], i)
            g += K4.grandeJauge(x, top, 72, h, v, o[0], o[2], o[3](x + 36, top + h + 36))
          })
          g += K4.tache(42 + 2 * 108 + 36, top + h * (1 - 0.86), 46, C.violet, 61, F.prog(lt, 3.4, 1.2), 0.3)
          return g + T
        }
      },
      { // Ce qui rapporte
        bg: P.beurre, mots: ['VOUS SAUREZ', 'ENFIN'], max: 110, petit: ['quelle pub vous rapporte', 'des clients.'], from: [300, 520],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 225
          g += K4.tache(380, y - 120, 90, MAG, 71, F.prog(lt, 0.2, 1.2) * 0.8)
          g += F.phone(240, y, 230, 420, 0, K3.ecranTrafic(F.easeOut(F.prog(lt, 0.5, 2.4)), [['pub-arriere-bus', 0.3], ['set-de-table', 0.55], ['post-facebook', 0.85], ['affiche-caisse', 0.7]]))
          return g + T
        }
      },
      { // Le fichier client
        bg: P.lilas, mots: ['UN FICHIER', 'CLIENT QUI', 'GRANDIT.'], max: 100, petit: ['Avec leur accord. Prêt à relancer.'], petitSize: 22, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 220
          g += K4.tache(110, y + 140, 90, C.teal, 81, F.prog(lt, 0.2, 1.2) * 0.8)
          g += F.phone(240, y, 230, 420, 0, K3.ecranCRM(F.prog(lt, 0.6, 2.4), F.prog(lt, 3.4, 0.2)))
          return g + T
        }
      },
      { // Tout-en-un
        bg: P.ciel, mots: ['TOUT-EN-UN.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 120
          var mots = ''
          ;[['ANIMATION', MAG], ['FICHIER CLIENT', C.teal], ['MESURE', C.gold]].forEach(function (m, i) {
            var a = 0.4 + i * 0.7, y = top + i * 150, q = pop(lt, a + 0.15, 0.4)
            g += K4.tache(240 + (i - 1) * 40, y - 16, 95, m[1], 91 + i, F.prog(lt, a, 1.3), 0.4)
            mots += K3.op(q, '<text class="safe" x="240" y="' + (y + 2) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="46" letter-spacing="-1.8" fill="' + INK + '">' + m[0] + '</text>')
          })
          g += mots
          return g + T
        }
      },
      { // Fin
        bg: P.menthe, from: [240, 560],
        draw: function (lt, img0) {
          var g = K4.tache(430, 150, 70, MAG, 101, img0 ? 1 : F.prog(lt, 0.2, 1.2)) + K4.tache(60, 800, 60, C.gold, 103, img0 ? 1 : F.prog(lt, 0.5, 1.2))
          return g + K3.fin(lt, img0, ['Installez', 'Flowin.'], { size: 56 })
        }
      }
    ]
  })
})()
