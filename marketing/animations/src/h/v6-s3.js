/* s3-v6 — « Et vous, on installe Flowin quand ? » (60 s). Problème → solution
   → 01–04 → résultat → preuves chiffrées (sources à l'écran) → action.
   Visuels v4 (objets dessinés, vrais écrans), taches nettes v5, aucun picto. */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, K4 = window.K4, K5 = window.K5, K6 = window.K6, C = F.C, INK = C.ink, P = K3.P, MAG = C.mag
  var pop = K3.pop
  var NOM = 'Votre magasin', LOT = 'Bon d’achat 10 €'
  function n(x) { return (+x).toFixed(1) }

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
  // Lignes de texte fixes (scènes de preuve), sous le grand chiffre.
  function lignes(ls, y0, lt, a, max) { return F.mots(ls, lt - a, INK, undefined, y0, max) }

  window.SCENARIO = K3.film('s3-v6', {
    scenes: [
      { // 1. Le problème
        bg: P.rose, mots: ['1 CLIENT SUR 3', 'NE REVIENT PLUS.'], max: 110, petit: ['Et les passants ? Ils passent.'],
        draw: function (lt, img0) {
          var L = img0 ? 9 : lt, T = K3.titre(this, lt, img0), g = ''
          g += K6.chiffre('1/3', 240, 590, 250, MAG, C.gold, L, 0.5, 11)
          g += K6.source('Clients inactifs : 30 à 40 % en moyenne (e-marketing.fr)', L, 1.0)
          return g + T
        }
      },
      { // 2. La solution
        bg: P.menthe, mots: ['UNE ANIMATION', 'PLUG & PLAY.'], max: 120, petit: ['Le temps de coller une affiche.'], from: [240, 560],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40
          g += K5.tache(140, top + 180, 115, MAG, 12, F.prog(lt, 0.3, 1.3), { coulures: 1 })
          g += K5.tache(355, top + 210, 100, C.violet, 13, F.prog(lt, 0.6, 1.3), { coulures: 1 })
          var pa = pop(lt, 0.5, 0.5), pc = pop(lt, 0.9, 0.5), pm = pop(lt, 1.3, 0.5)
          g += K3.op(pa, K3.affiche(140, top + 180 + 30 * (1 - pa), 150, -4))
          g += K3.op(pc, K3.chevalet(345, top + 240 + 30 * (1 - pc), 104))
          g += K3.op(pm, K3.macaron(400, top + 90, 48, 1))
          g += K3.op(pop(lt, 1.8), K3.pill(240, top + 410, 58, 'middle'))
          return g + T
        }
      },
      { // 3. 01 · Ils flashent
        bg: P.ciel, mots: ['ILS FLASHENT.'], max: 120, y0: 232, petit: ['Sans appli.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = K6.etape('01', C.gold, lt, 21), y = F._basSous + 220
          g += K3.chevalet(160, y + 20, 160)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8))
          g += F.phone(520 - 160 * p, y, 150, 290, 8, F.ecranScan)
          g += F.flash(160, y, lt, 1.3, 3)
          return g + T
        }
      },
      { // 4. 02 · Ils jouent
        bg: P.lilas, mots: ['ILS JOUENT.'], max: 120, y0: 232, petit: ['Quiz, roue, tombola.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = K6.etape('02', C.teal, lt, 22), y = F._basSous + 220
          g += K5.tache(240, y - 10, 180, C.teal, 23, F.prog(lt, 0.3, 1.3), { coulures: 1 })
          g += F.phone(105, y + 20, 160, 300, -7, K3.ecranQuizC(NOM, pop(lt, 1.4, 0.35), { l1: 'Quel fruit est riche', l2: 'en vitamine C ?', o: ['Le kiwi', 'Le riz', 'Le pain', 'Le sucre'], ok: 0 }))
          g += F.phone(375, y + 20, 160, 300, 7, K3.ecranTombola(NOM))
          g += F.phone(240, y, 180, 340, 0, K3.ecranRoue(NOM, 900 * F.easeOut(F.prog(lt, 0.5, 3.0)), ['Bon -10 %', 'Perdu', 'Cadeau', 'Perdu', 'Bon 5 €', 'Perdu']))
          return g + T
        }
      },
      { // 5. 03 · Ils gagnent
        bg: P.beurre, mots: ['ILS GAGNENT.'], max: 120, y0: 232, petit: null, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = K6.etape('03', MAG, lt, 24), y = F._basSous + 260
          g += K5.tache(250, y - 60, 170, C.gold, 25, F.prog(lt, 0.2, 1.3), { coulures: 1 })
          g += F.phone(240, y, 220, 410, 0, lt < 1.8 ? K.ecranGain : K3.ecranBilletQR(LOT, NOM, 'Grand jeu'))
          g += F.flash(240, y, lt, 1.8, 2)
          return g + T
        }
      },
      { // 6. 04 · Ils reviennent
        bg: P.rose, mots: ['ILS REVIENNENT.'], max: 120, y0: 232, petit: ['Le lot se retire chez vous.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = K6.etape('04', C.violet, lt, 26), y = F._basSous + 230
          var pin = pop(lt, 0.2, 0.6)
          g += K3.op(pin, F.phone(125, y + 30, 150, 280, -6, K3.ecranBilletQR(LOT, NOM, 'Grand jeu')))
          g += F.flash(125, y + 20, lt, 1.0, 2)
          var e = lt < 1.6 ? 1 : 2
          g += F.phone(335, y, 200, 370, 4, K3.ecranRetrait(e, 4, NOM, LOT))
          return g + T
        }
      },
      { // 7. Le passage capté
        bg: P.menthe, mots: ['VOUS CAPTEZ', 'LE PASSAGE.'], max: 120, petit: ['Chaque joueur devient un contact,', 'avec son accord.'], petitSize: 22, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 220
          g += K5.tache(120, y + 120, 100, C.teal, 31, F.prog(lt, 0.2, 1.2), { coulures: 1 })
          g += F.phone(250, y, 230, 420, 0, K3.ecranCRM(F.prog(lt, 0.6, 2.4), F.prog(lt, 3.6, 0.2)))
          return g + T
        }
      },
      { // 8. Chaque support suivi (jauges, supports sans QR)
        bg: P.ciel, mots: ['CHAQUE SUPPORT,', 'SUIVI.'], max: 120, petit: ['Affiche, réseaux, campagnes :', 'en flashs et en joueurs.'], petitSize: 22, from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', top = F._basSous + 40, h = 690 - top - 100
          var j = [
            ['Affiche', 0.68, MAG, function (x, y) { return K3.affiche(x, y, 36, 0, { sansQR: true }) }],
            ['Réseaux', 0.86, C.violet, function (x, y) { return K4.pubReseau(x, y, 44, 0, true) }],
            ['Bus', 0.3, C.gold, function (x, y) { return K4.bus(x, y, 50, true) }],
            ['Set de table', 0.5, C.teal, function (x, y) { return K4.setTable(x, y, 70, 0, true) }]
          ]
          j.forEach(function (o, i) {
            var x = 42 + i * 108, v = K4.valeur(lt, 0.4 + i * 0.25, o[1], i)
            g += K4.grandeJauge(x, top, 72, h, v, o[0], o[2], o[3](x + 36, top + h + 36))
          })
          return g + T
        }
      },
      { // 9. Vos clients
        bg: P.lilas, mots: ['VOUS CONNAISSEZ', 'VOS CLIENTS.'], max: 120, petit: ['Âge, sexe, provenance, avis.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 230
          g += K5.tache(250, y - 30, 170, C.gold, 41, F.prog(lt, 0.2, 1.3), { coulures: 1 })
          g += F.phone(140, y, 200, 380, -4, K3.ecranStats(F.prog(lt, 0.4, 1.6)))
          g += F.phone(355, y + 20, 180, 340, 5, ecranBonusC(pop(lt, 2.2, 0.35)))
          return g + T
        }
      },
      { // 10. Le téléphone
        bg: P.beurre, mots: ['TOUT DEPUIS', 'VOTRE TÉLÉPHONE.'], max: 120, petit: ['Lots, tirage, billets.'], from: [240, 600],
        draw: function (lt) {
          var T = K3.titre(this, lt), g = '', y = F._basSous + 225
          g += K5.tache(340, y - 60, 140, MAG, 51, F.prog(lt, 0.2, 1.2), { coulures: 1 })
          var e = lt < 1.2 ? 0 : lt < 2.4 ? 1 : 2
          g += F.phone(240, y, 230, 420, 0, K3.ecranTirage(e, LOT))
          return g + T
        }
      },
      { // 11. Preuve : flashs
        bg: P.menthe, mots: ['FLASHS EN', '10 JOURS.'], from: [240, 520],
        draw: function (lt, img0) {
          var g = K6.chiffre('2 449', 240, 300, 150, C.teal, C.gold, lt, 0.2, 61, { largeur: 420 })
          g += lignes(['FLASHS EN', '10 JOURS.'], 470, lt, 0.7, 100)
          g += K6.source('Source : Nuits du Sud 2026, Vence (données Flowin)', lt, 1.2)
          return g
        }
      },
      { // 12. Preuve : contacts
        bg: P.rose, mots: ['DES JOUEURS INSCRITS', 'ACCEPTENT D’ÊTRE', 'RECONTACTÉS.'], from: [240, 520],
        draw: function (lt) {
          var g = K6.chiffre('55 %', 240, 310, 190, MAG, C.violet, lt, 0.2, 71, { largeur: 400 })
          g += lignes(['DES JOUEURS INSCRITS', 'ACCEPTENT D’ÊTRE', 'RECONTACTÉS.'], 480, lt, 0.7, 72)
          g += K6.source('Source : Nuits du Sud 2026, Vence (données Flowin)', lt, 1.2)
          return g
        }
      },
      { // 13. Le réflexe QR
        bg: P.ciel, mots: ['DES FRANÇAIS', 'FLASHENT DÉJÀ', 'DES QR CODES.'], from: [240, 520],
        draw: function (lt) {
          var g = K6.chiffre('6/10', 240, 310, 200, C.gold, C.teal, lt, 0.2, 81, { largeur: 380 })
          g += lignes(['DES FRANÇAIS', 'FLASHENT DÉJÀ', 'DES QR CODES.'], 480, lt, 0.7, 84)
          g += K6.source('Source : M6 Publicité, étude Résonance', lt, 1.2)
          return g
        }
      },
      { // 14. Fin
        bg: P.beurre, mots: ['ET VOUS, ON', 'INSTALLE FLOWIN', 'QUAND ?'], max: 96, petit: ['Commandez votre macaron.'], from: [240, 560],
        draw: function (lt, img0) {
          var T = K3.titre(this, lt, img0), g = '', y = F._basSous + 36
          g += K5.tache(440, y + 180, 56, MAG, 91, img0 ? 1 : F.prog(lt, 0.3, 1.2), { coulures: 1 })
          g += K5.tache(55, y + 50, 44, C.teal, 92, img0 ? 1 : F.prog(lt, 0.5, 1.2), { coulures: 1 })
          g += K5.carteQR(240, y, 130, img0 ? 1 : pop(lt, 0.4, 0.5))
          g += K3.op(img0 ? 1 : pop(lt, 0.9, 0.5), K3.signature(240, y + 306, 1))
          return g + T
        }
      }
    ]
  })
})()
