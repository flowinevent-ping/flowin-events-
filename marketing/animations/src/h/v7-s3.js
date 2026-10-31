/* s3-v7 — « Installez Flowin dès maintenant » (72 s). Direction « esprit
   Macadam » sans personnage : titres Archivo, chiffres en contour, pilules,
   filets, fonds blanc / beurre / pastels, une image forte par écran.
   Palette Flowin uniquement : les fonds violets des écrans sont remplacés. */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, K4 = window.K4, K5 = window.K5, K7 = window.K7
  var C = F.C, INK = C.ink, MAG = C.mag, OR = C.gold, TEAL = C.teal, BG = K7.BG, PA = K7.PASTEL
  var pop = K3.pop, NOM = 'Votre magasin', LOT = 'Bon d’achat 10 €'

  // Palette Flowin dans les écrans : fond encre, accents magenta / teal.
  F.degradeQuiz = function (sw, sh) { return '<rect width="' + sw + '" height="' + sh + '" fill="' + INK + '"/>' }
  C.violet = MAG
  K3.PRO.acc = MAG; K3.PRO.acc2 = TEAL
  var REMP = [[/#5f1f74/gi, INK], [/#0F1E33/g, INK], [/#7C3AED/gi, PA.menthe], [/#7C2D92/gi, MAG], [/#3B5CC4/gi, TEAL], [/#6e2785/gi, INK]]
  var phoneOrig = F.phone
  F.phone = function (x, y, w, h, rot, ecran) {
    return phoneOrig(x, y, w, h, rot, function (sw, sh) { var s = ecran(sw, sh); REMP.forEach(function (r) { s = s.replace(r[0], r[1]) }); return s })
  }

  function ecranBonusC(choix) {
    return function (sw, sh) {
      var u = sw / 240, g = F.degradeQuiz(sw, sh) + K3.entete(u, NOM, 'QUESTIONS BONUS')
      g += K3.rect(14 * u, 80 * u, 64 * u, 20 * u, 10 * u, OR) + K3.txt(46 * u, 94 * u, 'BONUS 1/2', 10 * u, { anchor: 'middle' })
      g += K3.txt(14 * u, 128 * u, 'Comment nous', 17 * u, { fill: '#fff' }) + K3.txt(14 * u, 150 * u, 'as-tu connus ?', 17 * u, { fill: '#fff' })
      ;['Affiche', 'Réseaux sociaux', 'Bouche à oreille'].forEach(function (o, k) {
        var y = (172 + k * 50) * u, ok = k === 1 ? choix : 0
        g += K3.rect(14 * u, y, 212 * u, 40 * u, 12 * u, ok ? 'rgba(245,161,0,' + (0.25 * ok).toFixed(3) + ')' : 'rgba(255,255,255,.05)', { stroke: ok > 0.5 ? OR : 'rgba(255,255,255,.14)', sw: 1.5 * u })
        g += K3.txt(28 * u, y + 25 * u, o, 13 * u, { w: 600, fill: '#fff' })
      })
      g += K3.txt(120 * u, 345 * u, 'Pas de bonne réponse : ton avis compte.', 9 * u, { anchor: 'middle', w: 700, fill: 'rgba(255,255,255,.5)' })
      return g
    }
  }
  var QUIZ = { l1: 'Quel fruit est riche', l2: 'en vitamine C ?', o: ['Le kiwi', 'Le riz', 'Le pain', 'Le sucre'], ok: 0 }
  function etape(num, pastel, lt) { return K7.contour(num, 30, 190, 104, pastel, F.easeOut(F.prog(lt, 0.05, 0.4))) }
  function grand(t, cx, y, size, pastel, lt) { var p = F.easeOut(F.prog(lt, 0.1, 0.5)); return '<g transform="translate(' + cx + ',' + y + ') scale(' + (0.85 + 0.15 * p).toFixed(3) + ')">' + K7.contour(t, 0, 0, size, pastel, p, 'middle') + '</g>' }
  function source(t, lt) { return '<text class="safe" x="30" y="756" font-family="Manrope" font-weight="700" font-size="16" fill="rgba(21,12,28,.6)" opacity="' + F.easeOut(F.prog(lt, 1.0, 0.4)).toFixed(3) + '">' + F.esc(t) + '</text>' }

  window.SCENARIO = K3.film('s3-v7', {
    scenes: [
      { // 1. Le fichier dort
        bg: BG.blanc,
        draw: function (lt, img0) {
          var g = K7.titre(['VOTRE', 'FICHIER', 'CLIENT', 'DORT.'], lt, { img0: img0, max: 80, mag: 3 }) + K7.sous(['Et chaque jour, des passants', 'vous échappent.'], lt, { img0: img0 })
          var y = K7._filet + 150, L = img0 ? 9 : lt
          g += K7.tache(330, y + 10, 120, PA.ciel, 3, F.prog(L, 0.3, 1.0))
          g += K3.op(pop(L, 0.4), K7.fiche(240, y + 50, 330, -6, 'M•••• D.', '', true))
          g += K3.op(pop(L, 0.6), K7.fiche(262, y + 14, 330, 3, 'S•••• L.', '', true))
          g += K3.op(pop(L, 0.8), K7.fiche(232, y - 22, 330, -2, 'A•••• B.', 'INACTIF', true))
          return g
        }
      },
      { // 2. Capter le flux
        bg: BG.beurre, from: [240, 600],
        draw: function (lt) {
          var g = K7.titre(['FLOWIN', 'CAPTE', 'LE FLUX.'], lt, { max: 82, mag: 0 }) + K7.sous(['Le jeu transforme le passage', 'en contacts.'], lt)
          var cy = K7._filet + 150, mx = 230
          for (var k = 0; k < 5; k++) {
            var yy = cy - 80 + k * 40, off = (-lt * 60 + k * 13) % 26
            g += '<path d="M0,' + yy + ' C80,' + yy + ' 120,' + cy + ' ' + (mx - 60) + ',' + cy + '" fill="none" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="3 10" stroke-dashoffset="' + off.toFixed(1) + '" stroke-linecap="round"/>'
          }
          g += K7.macaron(mx, cy, 92, pop(lt, 0.2, 0.5), -6)
          ;[0, 1, 2].forEach(function (i) { g += K7.pilule(410, cy - 70 + i * 70, 128, '+1 CONTACT', [PA.rose, PA.menthe, PA.ciel][i], pop(lt, 1.0 + i * 0.5, 0.4)) })
          return g
        }
      },
      { // 3. Mesurer l'impact
        bg: BG.blanc, from: [240, 600],
        draw: function (lt) {
          var g = K7.titre(['ET MESURE', 'L’IMPACT', 'DE VOS', 'ACTIONS.'], lt, { max: 78, mag: 1 }) + K7.sous(['Affiche, réseaux, flyers, campagnes.'], lt)
          var y0 = K7._filet + 70, px = 360, py = K7._filet + 175
          var s = [['AFFICHE', PA.rose], ['RÉSEAUX', PA.beurre], ['FLYER', PA.menthe], ['CAMPAGNE', PA.ciel]]
          s.forEach(function (o, i) {
            var y = y0 + i * 72, l = F.easeInOut(F.prog(lt, 1.0 + i * 0.2, 0.6))
            if (l > 0) g += '<path d="M156,' + y + ' L' + (156 + (px - 85 - 156) * l).toFixed(1) + ',' + (y + (py - y) * l).toFixed(1) + '" stroke="' + INK + '" stroke-width="2"/>'
            g += K7.pilule(92, y, 128, o[0], o[1], pop(lt, 0.4 + i * 0.15, 0.4))
          })
          g += F.phone(px, py, 170, 330, 0, K3.ecranTrafic(F.easeOut(F.prog(lt, 1.4, 2.0)), [['affiche', 0.7], ['reseaux', 0.9], ['flyer', 0.45], ['campagne', 0.6]]))
          return g
        }
      },
      { // 4. L'équaliseur (scène phare)
        bg: BG.menthe, from: [360, 600],
        draw: function (lt) {
          var g = K7.titre(['CHAQUE', 'SUPPORT,', 'MESURÉ.'], lt, { max: 64, mag: 2 })
          var top = K7._bas + 50, bas = 690, h = bas - top
          for (var k = 1; k < 4; k++) g += '<path d="M30,' + (bas - h * k / 4).toFixed(1) + ' L450,' + (bas - h * k / 4).toFixed(1) + '" stroke="' + INK + '" stroke-width="1" opacity=".18"/>'
          var b = [['AFFICHE', 0.72, MAG], ['RÉSEAUX', 0.9, OR], ['FLYER', 0.45, TEAL], ['CAMPAGNE', 0.6, '#5BB8E8']]
          b.forEach(function (o, i) {
            var x = 40 + i * 105, w = 84, v = K4.valeur(lt, 0.5 + i * 0.25, o[1], i), hh = h * v
            g += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="18" fill="#fff" stroke="' + INK + '" stroke-width="2.5"/>'
            if (hh > 4) g += '<rect x="' + (x + 6) + '" y="' + (bas - hh + 6).toFixed(1) + '" width="' + (w - 12) + '" height="' + Math.max(0, hh - 12).toFixed(1) + '" rx="13" fill="' + o[2] + '"/>'
            g += K3.op(pop(lt, 0.3 + i * 0.1, 0.4), '<text class="safe" x="' + (x + w / 2) + '" y="' + (bas + 38) + '" text-anchor="middle" font-family="ArchivoX" font-weight="900" font-size="13" letter-spacing=".5" fill="' + INK + '">' + o[0] + '</text>')
          })
          var pw = pop(lt, 3.6, 0.4)
          g += K7.pilule(40 + 105 + 42, top + h * 0.1 - 30, 70, 'TOP', INK, pw, '#fff')
          return g
        }
      },
      { // 5. Plug & Play
        bg: BG.beurre, from: [240, 600],
        draw: function (lt) {
          var g = K7.titre(['UNE', 'ANIMATION', 'PLUG & PLAY.'], lt, { max: 80, mag: 2 }) + K7.sous(['Le temps de coller un macaron.'], lt)
          var y = K7._filet + 160
          g += K3.op(pop(lt, 0.7), K3.affiche(375, y - 10, 130, 5))
          g += K3.op(pop(lt, 1.0), K3.chevalet(395, y + 110, 80))
          g += K7.macaron(170, y + 20, 112, pop(lt, 0.3, 0.5), -8)
          return g
        }
      },
      { // 6. 01 Ils flashent
        bg: BG.blanc, from: [170, 600],
        draw: function (lt) {
          var g = etape('01', PA.rose, lt) + K7.titre(['ILS', 'FLASHENT.'], lt, { y: 214, max: 70 }) + K7.sous(['Sans appli.'], lt)
          var y = K7._filet + 170
          g += K7.macaron(150, y, 100, 1, -6)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8))
          g += F.phone(530 - 170 * p, y, 160, 310, 6, F.ecranScan)
          g += F.flash(150, y, lt, 1.3, 2)
          return g
        }
      },
      { // 7. 02 Ils jouent (le quiz d'abord)
        bg: BG.rose, from: [360, 600],
        draw: function (lt) {
          var g = etape('02', PA.menthe, lt) + K7.titre(['ILS', 'JOUENT.'], lt, { y: 214, max: 70 }) + K7.sous(['Quiz, roue, tombola.'], lt)
          var y = K7._filet + 185
          g += K7.tache(190, y, 150, '#fff', 7, F.prog(lt, 0.2, 1.0))
          g += F.phone(180, y, 190, 360, -3, K3.ecranQuizC(NOM, pop(lt, 1.6, 0.35), QUIZ))
          g += K7.pilule(395, y - 70, 120, 'QUIZ', INK, pop(lt, 0.6, 0.4), '#fff')
          g += K7.pilule(395, y, 120, 'ROUE', '#fff', pop(lt, 0.8, 0.4))
          g += K7.pilule(395, y + 70, 120, 'TOMBOLA', '#fff', pop(lt, 1.0, 0.4))
          return g
        }
      },
      { // 8. Le quiz qui sonde
        bg: BG.ciel, from: [180, 600],
        draw: function (lt) {
          var g = K7.titre(['LE QUIZ', 'QUI SONDE,', 'CRÉE DU', 'LIEN.'], lt, { max: 78, mag: 3 }) + K7.sous(['Questions, avis, sondage.'], lt)
          var y = K7._filet + 180
          g += K7.tache(300, y - 40, 130, PA.beurre, 9, F.prog(lt, 0.2, 1.0))
          g += F.phone(200, y, 200, 370, -3, ecranBonusC(pop(lt, 1.8, 0.35)))
          g += K7.pilule(395, y - 40, 110, 'AVIS', '#fff', pop(lt, 0.8, 0.4))
          g += K7.pilule(395, y + 30, 110, 'SONDAGE', PA.beurre, pop(lt, 1.1, 0.4))
          return g
        }
      },
      { // 9. 03 Ils gagnent
        bg: BG.beurre, from: [200, 600],
        draw: function (lt) {
          var g = etape('03', PA.ciel, lt) + K7.titre(['ILS', 'GAGNENT.'], lt, { y: 214, max: 70 })
          var y = K7._bas + 260
          g += K7.tache(250, y - 40, 150, PA.rose, 11, F.prog(lt, 0.2, 1.0))
          g += F.phone(240, y, 210, 390, 0, lt < 1.8 ? K.ecranGain : K3.ecranBilletQR(LOT, NOM, 'Grand jeu'))
          g += F.flash(240, y, lt, 1.8, 2)
          return g
        }
      },
      { // 10. 04 Ils reviennent
        bg: BG.blanc, from: [240, 600],
        draw: function (lt) {
          var g = etape('04', PA.beurre, lt) + K7.titre(['ILS', 'REVIENNENT.'], lt, { y: 214, max: 70 }) + K7.sous(['Le lot se retire chez vous.'], lt)
          var y = K7._filet + 180
          g += K3.op(pop(lt, 0.2, 0.5), F.phone(125, y + 30, 150, 280, -6, K3.ecranBilletQR(LOT, NOM, 'Grand jeu')))
          g += F.flash(125, y + 20, lt, 1.0, 2)
          g += F.phone(335, y, 200, 370, 4, K3.ecranRetrait(lt < 1.6 ? 1 : 2, 4, NOM, LOT))
          return g
        }
      },
      { // 11. Votre image : trois raisons numérotées
        bg: BG.beurre, from: [335, 600],
        draw: function (lt) {
          var g = K7.titre(['RENFORCEZ', 'VOTRE', 'IMAGE.'], lt, { max: 80, mag: 2 })
          var y0 = K7._bas + 40
          g += '<path d="M30,' + y0 + ' L450,' + y0 + '" stroke="' + INK + '" stroke-width="2" opacity="' + F.easeOut(F.prog(lt, 0.3, 0.4)).toFixed(3) + '"/>'
          ;[['1', PA.ciel, 'Faites jouer.'], ['2', PA.menthe, 'Faites-vous', 'connaître.'], ['3', PA.rose, 'Faites revenir.']].forEach(function (r, i) {
            var a = 0.5 + i * 0.5, y = y0 + i * 130, p = F.easeOut(F.prog(lt, a, 0.4))
            g += K7.contour(r[0], 34, y + 108, 108, r[1], p)
            var t = '<text class="safe" x="140" y="' + (r[3] ? y + 60 : y + 78) + '" font-family="ArchivoX" font-weight="900" font-size="30" fill="' + INK + '">' + r[2] + '</text>' + (r[3] ? '<text class="safe" x="140" y="' + (y + 96) + '" font-family="ArchivoX" font-weight="900" font-size="30" fill="' + INK + '">' + r[3] + '</text>' : '')
            g += K3.op(p, t)
            g += '<path d="M30,' + (y + 130) + ' L450,' + (y + 130) + '" stroke="' + INK + '" stroke-width="2" opacity="' + p.toFixed(3) + '"/>'
          })
          return g
        }
      },
      { // 12. Vos clients
        bg: BG.rose, from: [240, 600],
        draw: function (lt) {
          var g = K7.titre(['VOUS', 'CONNAISSEZ', 'VOS CLIENTS.'], lt, { max: 80 }) + K7.sous(['Âge, sexe, provenance, avis.'], lt)
          var y = K7._filet + 180
          g += F.phone(150, y, 200, 370, -4, K3.ecranStats(F.prog(lt, 0.4, 1.6)))
          g += F.phone(360, y + 20, 170, 320, 5, ecranBonusC(pop(lt, 2.2, 0.35)))
          return g
        }
      },
      { // 13. Le téléphone
        bg: BG.blanc, from: [240, 600],
        draw: function (lt) {
          var g = K7.titre(['TOUT', 'DEPUIS VOTRE', 'TÉLÉPHONE.'], lt, { max: 80 }) + K7.sous(['Lots, tirage, billets.'], lt)
          var y = K7._filet + 185
          g += K7.tache(330, y - 60, 120, PA.menthe, 13, F.prog(lt, 0.2, 1.0))
          g += F.phone(240, y, 200, 370, 0, K3.ecranTirage(lt < 1.2 ? 0 : lt < 2.4 ? 1 : 2, LOT))
          return g
        }
      },
      { // 14. 55 %
        bg: BG.menthe, from: [240, 520],
        draw: function (lt) {
          var g = grand('55 %', 240, 380, 150, PA.rose, lt)
          g += K7.titre(['DES JOUEURS', 'SOUHAITENT', 'GARDER', 'LE CONTACT.'], lt - 0.4, { y: 450, max: 54 })
          g += source('Dernier événement : Nuits du Sud 2026', lt)
          return g
        }
      },
      { // 15. 70 %
        bg: BG.ciel, from: [240, 520],
        draw: function (lt) {
          var g = grand('70 %', 240, 390, 150, PA.beurre, lt)
          g += K7.titre(['D’OPT-IN SUR', 'L’ÉVÉNEMENT', 'LOCAL.'], lt - 0.4, { y: 460, max: 58 })
          g += source('Données Flowin', lt)
          return g
        }
      },
      { // 16. Moins de 3 € par jour
        bg: BG.beurre, from: [240, 520],
        draw: function (lt) {
          var g = '<text class="safe" x="30" y="240" font-family="ArchivoX" font-weight="900" font-size="56" fill="' + INK + '" opacity="' + F.easeOut(F.prog(lt, 0.1, 0.4)).toFixed(3) + '">– DE</text>'
          g += grand('3 €', 240, 460, 220, PA.menthe, lt)
          g += K7.titre(['PAR JOUR.'], lt - 0.4, { y: 520, max: 80 })
          g += source('Abonnement annuel', lt)
          return g
        }
      },
      { // 17. Fin
        bg: BG.blanc, from: [240, 520],
        draw: function (lt, img0) {
          var g = K7.titre(['INSTALLEZ', 'FLOWIN DÈS', 'MAINTENANT.'], lt, { img0: img0, max: 80, mag: 2 })
          var y = K7._bas + 34
          g += K5.carteQR(275, y, 130, img0 ? 1 : pop(lt, 0.3, 0.5))
          g += K7.macaron(96, y + 214, 60, img0 ? 1 : pop(lt, 0.6, 0.5), -10)
          g += K3.op(img0 ? 1 : pop(lt, 0.9, 0.5), K7.signature(240, y + 316, 0.95))
          return g
        }
      }
    ]
  })
})()
