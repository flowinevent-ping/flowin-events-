/* s3-v5 — « Et si vous pouviez mesurer votre pub ? » (55 s). Textes du client
   (films-v5.js) ; taches nettes, pastilles, cadran, vrais écrans, carte QR. */
(function () {
  var F = window.FH, K3 = window.K3, K4 = window.K4, K5 = window.K5, C = F.C, INK = C.ink, P = K3.P, MAG = C.mag
  var pop = K3.pop
  var NOM = 'Votre magasin'
  function fin(T, g) { return g + T }

  // Question bonus d'un commerce (écran « BONUS 1/2 » du quiz).
  function ecranBonusC(choix) {
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + K3.entete(u, NOM, 'QUESTIONS BONUS')
      g += K3.rect(14 * u, 80 * u, 64 * u, 20 * u, 10 * u, C.gold) + K3.txt(46 * u, 94 * u, 'BONUS 1/2', 10 * u, { anchor: 'middle' })
      g += K3.txt(14 * u, 128 * u, 'Comment nous', 17 * u, { fill: '#fff' }) + K3.txt(14 * u, 150 * u, 'as-tu connus ?', 17 * u, { fill: '#fff' })
      ;['Affiche', 'Réseaux sociaux', 'Bouche à oreille'].forEach(function (o, k) {
        var y = (172 + k * 50) * u, ok = k === 1 ? choix : 0
        g += K3.rect(14 * u, y, 212 * u, 40 * u, 12 * u, ok ? 'rgba(245,161,0,' + (0.25 * ok).toFixed(3) + ')' : 'rgba(255,255,255,.05)', { stroke: ok > 0.5 ? C.gold : 'rgba(255,255,255,.14)', sw: 1.5 * u })
        g += K3.txt(28 * u, y + 25 * u, o, 13 * u, { w: 600, fill: '#fff' })
      })
      return g
    }
  }
  function etiquette(x, y, t, p) {
    return K3.op(p, K3.rect(x - 86, y - 22, 172, 34, 17, '#fff') + '<text class="safe" x="' + x + '" y="' + (y + 1) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="' + INK + '">' + t + '</text>')
  }

  window.SCENARIO = K3.film('s3-v5', {
    scenes: [
      { // 1. Mesurer
        bg: P.rose, mots: ['ET SI VOUS', 'POUVIEZ MESURER', 'VOTRE PUB ?'], max: 100, petit: ['L’impact de chaque', 'action marketing.'],
        draw: function (lt, img0) {
          var T = K3.titre(this, lt, img0), g = '', cy = F._basSous + 330
          g += K5.tache(240, cy - 70, 200, C.gold, 7, img0 ? 1 : F.prog(lt, 0.3, 1.4))
          g += '<path d="M60,' + cy + ' A180,180 0 0 1 420,' + cy + ' Z" fill="#fff"/>'
          g += K5.cadran(240, cy, 170, img0 ? 0.82 : K5.hesite(lt, 0.8, 0.82, 4.5))
          return fin(T, g)
        }
      },
      { // 2. Plug & Play
        bg: P.menthe, mots: ['UNE SOLUTION', 'PLUG & PLAY.'], max: 120, petit: ['Une affiche, un macaron :', 'c’est parti.'], from: [240, 560],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40
          g += K5.tache(150, top + 170, 120, MAG, 12, F.prog(lt, 0.3, 1.3))
          g += K5.tache(350, top + 230, 100, C.violet, 13, F.prog(lt, 0.7, 1.3))
          var pa = pop(lt, 0.6, 0.5), pc = pop(lt, 1.0, 0.5)
          g += K3.op(pa, K3.affiche(150, top + 170 + 30 * (1 - pa), 150, -4))
          g += K3.op(pc, K3.chevalet(350, top + 230 + 30 * (1 - pc), 110))
          g += K3.op(pop(lt, 1.6), K3.pill(240, top + 400, 58, 'middle'))
          return fin(T, g)
        }
      },
      { // 3. On trace
        bg: P.ciel, mots: ['ON TRACE VOTRE', 'COMMUNICATION.'], petit: ['Affiches, réseaux, campagnes…', 'et un rapport simple.'], from: [240, 640],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40, cx = 240, cy = top + 215
          var sup = [
            [100, top + 70, function () { return K4.bus(0, 0, 110, true) }],
            [385, top + 70, function () { return K4.setTable(0, 0, 150, 4, true) }],
            [100, top + 370, function () { return K4.pubReseau(0, 0, 105, -4, true) }],
            [385, top + 370, function () { return K3.affiche(0, 0, 95, 3, { sansQR: true }) }]
          ]
          sup.forEach(function (s, i) {
            var l = F.easeInOut(F.prog(lt, 1.3 + i * 0.25, 0.8))
            if (l > 0) g += '<path d="M' + s[0] + ',' + s[1] + ' L' + n(s[0] + (cx - s[0]) * l) + ',' + n(s[1] + (cy - s[1]) * l) + '" stroke="' + INK + '" stroke-width="4" stroke-dasharray="2 10" stroke-linecap="round"/>'
          })
          sup.forEach(function (s, i) { var q = pop(lt, 0.4 + i * 0.2, 0.45); g += K3.op(q, K3.at(s[0], s[1] + 20 * (1 - q), 1, s[2]())) })
          var pr = pop(lt, 2.3, 0.5)
          g += K3.op(pr, K3.at(cx, cy, 0.8 + 0.2 * pr, K3.rect(-82, -96, 164, 192, 22, 'rgba(21,12,28,.14)') + K3.rect(-86, -102, 164, 192, 22, '#fff') +
            K3.at(-4, -48, 1, K5.picto('rapport', 1)) + K3.txt(-4, 10, 'Rapport', 22, { anchor: 'middle' }) +
            K3.rect(-60, 30, 112, 8, 4, C.teal) + K3.rect(-60, 46, 80, 8, 4, C.gold) + K3.rect(-60, 62, 98, 8, 4, MAG)))
          return fin(T, g)
        }
      },
      { // 4. La mesure (jauges conservées)
        bg: P.menthe, mots: ['CHAQUE PUB,', 'MESURÉE.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40, h = 690 - top - 100
          var j = [
            ['Bus', 0.28, C.gold, function (x, y) { return K4.bus(x, y, 50, true) }],
            ['Set de table', 0.52, C.teal, function (x, y) { return K4.setTable(x, y, 70, 0, true) }],
            ['Réseaux', 0.86, C.violet, function (x, y) { return K4.pubReseau(x, y, 44, 0, true) }],
            ['Affiche', 0.68, MAG, function (x, y) { return K3.affiche(x, y, 36, 0, { sansQR: true }) }]
          ]
          j.forEach(function (o, i) {
            var x = 42 + i * 108, v = K4.valeur(lt, 0.4 + i * 0.25, o[1], i)
            g += K4.grandeJauge(x, top, 72, h, v, o[0], o[2], o[3](x + 36, top + h + 36))
          })
          var pw = pop(lt, 3.4, 0.4)
          g += K3.op(pw, K3.at(42 + 2 * 108 + 36, top + h * 0.14 - 26, 0.8 + 0.2 * pw, K3.rect(-40, -18, 80, 36, 18, INK) + K3.txt(0, 7, 'TOP', 18, { anchor: 'middle', fill: '#fff' })))
          return fin(T, g)
        }
      },
      { // 5. L'animation
        bg: P.lilas, mots: ['CHOISISSEZ VOTRE', 'ANIMATION.'], petit: ['Quiz, roue, tombola.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 230
          g += K5.tache(240, y - 10, 190, C.teal, 21, F.prog(lt, 0.2, 1.4))
          g += F.phone(105, y + 20, 160, 300, -7, K3.ecranQuizC(NOM, pop(lt, 1.4, 0.35), { l1: 'Quel fruit est riche', l2: 'en vitamine C ?', o: ['Le kiwi', 'Le riz', 'Le pain', 'Le sucre'], ok: 0 }))
          g += F.phone(375, y + 20, 160, 300, 7, K3.ecranTombola(NOM))
          g += F.phone(240, y, 180, 340, 0, K3.ecranRoue(NOM, 900 * F.easeOut(F.prog(lt, 0.5, 3.0)), ['Bon -10 %', 'Perdu', 'Cadeau', 'Perdu', 'Bon 5 €', 'Perdu']))
          return fin(T, g)
        }
      },
      { // 6. La marque
        bg: P.beurre, mots: ['RENFORCEZ', 'VOTRE MARQUE.'], petit: ['Faites jouer. Faites-vous connaître.', 'Faites-les revenir.'], petitSize: 22, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 90
          ;[['jouer', MAG, 'Faites jouer.'], ['connaitre', C.gold, 'Faites-vous', 'connaître.'], ['revenir', C.teal, 'Faites-les', 'revenir.']].forEach(function (r, i) {
            var a = 0.4 + i * 0.7, y = top + i * 140
            g += K5.tache(100, y, 66, r[1], 31 + i, F.prog(lt, a, 1.2), { coulures: 1 })
            g += K5.pastille(100, y, 44, K5.picto(r[0], 1), pop(lt, a + 0.2, 0.4))
            var q = pop(lt, a + 0.3, 0.4)
            g += K3.op(q, '<text class="safe" x="190" y="' + (r[3] ? y - 4 : y + 12) + '" font-family="Manrope" font-weight="800" font-size="34" letter-spacing="-1.2" fill="' + INK + '">' + r[2] + '</text>' + (r[3] ? '<text class="safe" x="190" y="' + (y + 34) + '" font-family="Manrope" font-weight="800" font-size="34" letter-spacing="-1.2" fill="' + INK + '">' + r[3] + '</text>' : ''))
          })
          return fin(T, g)
        }
      },
      { // 7. Les lots
        bg: P.rose, mots: ['VOS LOTS,', 'VOS LEVIERS.'], max: 120, petit: ['Écouler un stock, lancer une', 'nouveauté, une remise après achat.'], petitSize: 22, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y0 = F._basSous + 60
          ;[['Écouler un stock', 'Un produit de saison offert', 'cadeau', C.gold], ['Lancer une nouveauté', 'À découvrir en premier', 'fleur', C.violet], ['Remise après achat', '-10 % dès 20 € d’achat', 'remise', C.teal]].forEach(function (l, i) {
            var a = 0.4 + i * 0.6
            g += K5.tache(440, y0 + i * 130 + 40, 56, l[3], 41 + i, F.prog(lt, a, 1.1), { coulures: 1 })
            g += K3.lot(30, y0 + i * 130, 400, l[0], l[1], l[2], pop(lt, a + 0.1, 0.45))
          })
          return fin(T, g)
        }
      },
      { // 8. Vos clients
        bg: P.ciel, mots: ['CONNAISSEZ', 'VOS CLIENTS.'], petit: ['Âge, sexe, provenance… et leur avis', 'grâce aux questions bonus.'], petitSize: 21, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 230
          g += K5.tache(250, y - 30, 170, C.gold, 51, F.prog(lt, 0.2, 1.3))
          g += F.phone(140, y, 200, 380, -4, K3.ecranStats(F.prog(lt, 0.4, 1.6)))
          g += F.phone(355, y + 20, 180, 340, 5, ecranBonusC(pop(lt, 2.2, 0.35)))
          return fin(T, g)
        }
      },
      { // 9. Le fichier
        bg: P.lilas, mots: ['UN FICHIER', 'CLIENT QUI', 'GRANDIT.'], max: 100, petit: ['Des contacts avec leur accord,', 'prêts à relancer.'], petitSize: 22, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 220
          g += K5.tache(120, y + 120, 100, C.teal, 61, F.prog(lt, 0.2, 1.2))
          g += F.phone(250, y, 230, 420, 0, K3.ecranCRM(F.prog(lt, 0.6, 2.4), F.prog(lt, 3.4, 0.2)))
          return fin(T, g)
        }
      },
      { // 10. La gestion
        bg: P.menthe, mots: ['UNE GESTION SIMPLE,', 'AVEC UN TÉLÉPHONE.'], petit: ['Tirage en un clic, billets et stock', 'automatiques. Le gagnant revient,', 'vous scannez.'], petitSize: 21, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 210
          g += K5.tache(330, y - 40, 150, MAG, 71, F.prog(lt, 0.2, 1.3))
          var pin = pop(lt, 0.3, 0.6)
          g += K3.op(pin, F.phone(125, y + 30, 150, 280, -6, K3.ecranBilletQR('Bon d’achat 10 €', NOM, 'Grand jeu')))
          var e = lt < 2.2 ? 1 : 2
          g += F.phone(335, y, 200, 370, 4, K3.ecranRetrait(e, 4, NOM, 'Bon d’achat 10 €'))
          return fin(T, g)
        }
      },
      { // 11. Tout-en-un
        bg: P.rose, mots: ['TOUT-EN-UN.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 110, mots = ''
          ;[['ANIMATION', MAG], ['FICHIER CLIENT', C.teal], ['MESURE', C.gold]].forEach(function (m, i) {
            var a = 0.3 + i * 0.6, y = top + i * 130
            g += K5.tache(240 + (i - 1) * 50, y - 16, 88, m[1], 81 + i, F.prog(lt, a, 1.2), { coulures: i === 1 ? 2 : 1 })
            mots += K3.op(pop(lt, a + 0.15, 0.4), '<text class="safe" x="240" y="' + (y + 2) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="46" letter-spacing="-1.8" fill="' + INK + '">' + m[0] + '</text>')
          })
          g += mots + K3.op(pop(lt, 2.2), K3.pill(240, top + 420, 58, 'middle'))
          return fin(T, g)
        }
      },
      { // 12. Fin
        bg: P.beurre, mots: ['INSTALLEZ', 'FLOWIN.'], max: 120, petit: ['Le temps de coller une affiche.'], from: [240, 560],
        draw: function (lt, img0) {
          var T = K3.titre(this, lt, img0), g = '', y = F._basSous + 40
          g += K5.tache(440, y + 200, 60, MAG, 91, img0 ? 1 : F.prog(lt, 0.3, 1.2), { coulures: 1 })
          g += K5.tache(55, y + 50, 48, C.teal, 92, img0 ? 1 : F.prog(lt, 0.5, 1.2), { coulures: 1 })
          g += K5.carteQR(240, y, 150, img0 ? 1 : pop(lt, 0.4, 0.5))
          g += K3.op(img0 ? 1 : pop(lt, 0.9, 0.5), K3.signature(240, y + 336, 1))
          return fin(T, g)
        }
      }
    ]
  })
  function n(x) { return (+x).toFixed(1) }
})()
