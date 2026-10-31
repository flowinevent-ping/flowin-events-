/* s3-v8 — « Installez Flowin dès maintenant » (73,5 s). Charte claire :
   blanc, blanc cassé, menthe, ciel ; accents teal et orange ; encre.
   Aucun fuchsia (sauf le « in » du logo), aucun fond sombre. */
(function () {
  var F = window.FH, K3 = window.K3, K7 = window.K7, K8 = window.K8, C = F.C, INK = C.ink, TEAL = C.teal
  var BG = K8.BG, PA = K8.PA, KC = K8.C
  var pop = K3.pop, NOM = 'Votre magasin', LOT = 'Bon d’achat 10 €'
  K8.chartePro()
  C.violet = TEAL
  // Une seule taille de titre pour tous les écrans (harmonie).
  var TAILLE = 44
  var T = function (l, lt, o) { o = o || {}; o.max = TAILLE; return K8.titre(l, lt, o) }
  function etape(num, pastel, lt) { return K7.contour(num, 30, 190, 104, pastel, F.easeOut(F.prog(lt, 0.05, 0.4))) }
  function source(t, lt) { return '<text class="safe" x="30" y="756" font-family="Manrope" font-weight="700" font-size="16" fill="rgba(21,12,28,.6)" opacity="' + F.easeOut(F.prog(lt, 1.0, 0.4)).toFixed(3) + '">' + F.esc(t) + '</text>' }
  function grand(t, cx, y, size, pastel, lt) { var p = F.easeOut(F.prog(lt, 0.1, 0.5)); return '<g transform="translate(' + cx + ',' + y + ') scale(' + (0.85 + 0.15 * p).toFixed(3) + ')">' + K7.contour(t, 0, 0, size, pastel, p, 'middle') + '</g>' }
  function fleche(x1, x2, y, p) {
    if (p <= 0) return ''
    var x = x1 + (x2 - x1) * Math.min(1, p)
    return '<path d="M' + x1 + ',' + y + ' L' + x.toFixed(1) + ',' + y + '" stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"/>' + (p >= 1 ? '<path d="M' + (x2 - 9) + ',' + (y - 7) + ' L' + x2 + ',' + y + ' L' + (x2 - 9) + ',' + (y + 7) + '" stroke="' + INK + '" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '')
  }

  window.SCENARIO = K3.film('s3-v8', {
    scenes: [
      { // 1. Réveiller le fichier
        bg: BG.blanc,
        draw: function (lt, img0) {
          var L = img0 ? 9 : lt, g = T(['ET SI ON', 'RÉVEILLAIT', 'VOTRE', 'FICHIER', 'CLIENT ?'], lt, { img0: img0, mag: 1 }) + K7.sous(null, lt, { img0: img0 })
          var y = K7._filet + 170, eveil = F.prog(L, 1.6, 0.6) > 0.5
          g += K7.tache(340, y - 10, 120, PA.menthe, 3, F.prog(L, 0.3, 1.0))
          g += K3.op(pop(L, 0.3), K8.fiche(240, y + 54, 330, -6, 'M•••• D.', '', !eveil))
          g += K3.op(pop(L, 0.5), K8.fiche(262, y + 16, 330, 3, 'S•••• L.', '', !eveil))
          g += K3.op(pop(L, 0.7), K8.fiche(232, y - 22, 330, -2, 'A•••• B.', eveil ? 'ACTIF' : 'EN SOMMEIL', !eveil))
          if (eveil) g += F.flash(232, y - 22, L, 1.9, 2)
          return g
        }
      },
      { // 2. Capter le flux
        bg: BG.menthe, from: [232, 560],
        draw: function (lt) {
          var g = T(['ET SI ON', 'CAPTAIT', 'LE FLUX', 'QUI PASSE ?'], lt, { mag: 1 }) + K7.sous(null, lt)
          var y = K7._filet + 175
          // Le flux : rubans doux qui défilent devant le macaron.
          for (var k = 0; k < 3; k++) {
            var yy = y - 60 + k * 60, off = (-lt * 80 + k * 30) % 60
            g += '<path d="M0,' + yy + ' C160,' + (yy - 30) + ' 320,' + (yy + 30) + ' 540,' + yy + '" fill="none" stroke="#fff" stroke-width="16" stroke-linecap="round" stroke-dasharray="34 26" stroke-dashoffset="' + off.toFixed(1) + '" opacity=".9"/>'
          }
          g += K8.macaron(330, y, 104, pop(lt, 0.4, 0.5), -6)
          return g
        }
      },
      { // 3. Passage -> contacts (schéma)
        bg: BG.blanc, from: [330, 560],
        draw: function (lt) {
          var g = T(['LE JEU', 'TRANSFORME', 'LE PASSAGE', 'EN', 'CONTACTS.'], lt, { mag: 4 }) + K7.sous(null, lt)
          var y = K7._filet + 180, cols = [PA.ciel, PA.menthe, PA.peche, PA.ciel]
          for (var i = 0; i < 4; i++) {
            var tt = lt * 0.5 + i * 0.25, ph = tt % 1, x = -20 + ph * 150
            var op = ph < 0.1 ? ph / 0.1 : ph > 0.85 ? (1 - ph) / 0.15 : 1
            if (lt > 0.3) g += '<g opacity="' + op.toFixed(3) + '">' + K8.passant(x, y + 72, 1.05, cols[i], lt, i) + '</g>'
          }
          g += fleche(140, 164, y, F.prog(lt, 0.6, 0.4))
          g += K8.phone(240, y, 140, 270, 0, K8.quiz(NOM, pop(lt, 1.6, 0.3)))
          g += fleche(318, 342, y, F.prog(lt, 1.2, 0.4))
          var n = Math.min(4, Math.floor(F.clamp(lt - 1.4, 0, 9) / 0.6))
          for (var c = 0; c < n; c++) g += K8.fiche(408, y + 30 - c * 20, 120, [-4, 3, -2, 4][c], ['M•••• D.', 'S•••• L.', 'A•••• B.', 'K•••• R.'][c], '', false).replace(/font-size="20"/g, 'font-size="13"')
          if (n > 0) g += K8.pilule(408, y + 115, '+' + n + ' CONTACT' + (n > 1 ? 'S' : ''), 1)
          return g
        }
      },
      { // 4. Plug & Play (macaron grand)
        bg: BG.ciel, from: [415, 560],
        draw: function (lt) {
          var g = T(['UNE', 'ANIMATION', 'PLUG & PLAY.'], lt, { mag: 2 }) + K7.sous(['Le temps de coller un macaron.'], lt)
          var y = K7._filet + 190
          g += K3.op(pop(lt, 0.8), K3.affiche(400, y - 40, 110, 6))
          g += K3.op(pop(lt, 1.1), K3.chevalet(410, y + 100, 74))
          g += K8.macaron(185, y + 10, 145, pop(lt, 0.3, 0.5), -8)
          return g
        }
      },
      { // 5. 01 Ils flashent
        bg: BG.blanc, from: [185, 600],
        draw: function (lt) {
          var g = etape('01', PA.menthe, lt) + T(['ILS', 'FLASHENT.'], lt, { y: 214 }) + K7.sous(['Sans appli.'], lt)
          var y = K7._filet + 175
          g += K8.macaron(150, y, 100, 1, -6)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8))
          g += K8.phone(530 - 170 * p, y, 160, 310, 6, K8.scan)
          g += F.flash(150, y, lt, 1.3, 2)
          return g
        }
      },
      { // 6. 02 Ils jouent
        bg: BG.casse, from: [360, 600],
        draw: function (lt) {
          var g = etape('02', PA.ciel, lt) + T(['ILS', 'JOUENT.'], lt, { y: 214 }) + K7.sous(null, lt)
          var y = K7._filet + 210
          g += K7.tache(330, y - 80, 110, PA.menthe, 6, F.prog(lt, 0.2, 1.0))
          g += K8.phone(240, y, 210, 390, 0, K8.score)
          return g
        }
      },
      { // 7. 03 Ils gagnent
        bg: BG.menthe, from: [240, 600],
        draw: function (lt) {
          var g = etape('03', PA.peche, lt) + T(['ILS', 'GAGNENT.'], lt, { y: 214 }) + K7.sous(null, lt)
          var y = K7._filet + 210
          g += K8.phone(240, y, 210, 390, 0, lt < 1.9 ? K8.gain(NOM, LOT) : K8.billet(LOT, NOM))
          g += F.flash(240, y, lt, 1.9, 2)
          return g
        }
      },
      { // 8. 04 Ils reviennent
        bg: BG.blanc, from: [240, 600],
        draw: function (lt) {
          var g = etape('04', PA.menthe, lt) + T(['ILS', 'REVIENNENT.'], lt, { y: 214 }) + K7.sous(['Le lot se retire chez vous.'], lt)
          var y = K7._filet + 185
          g += K3.op(pop(lt, 0.2, 0.5), K8.phone(125, y + 30, 150, 280, -6, K8.billet(LOT, NOM)))
          g += F.flash(125, y + 20, lt, 1.0, 2)
          g += K8.phone(335, y, 200, 370, 4, K8.retrait(lt < 1.6 ? 1 : 2, 4, NOM, LOT))
          return g
        }
      },
      { // 9. Les jeux (une seule scène, quiz au centre)
        bg: BG.ciel, from: [335, 600],
        draw: function (lt) {
          var g = T(['QUIZ,', 'ROUE,', 'TOMBOLA.'], lt, { mag: 0 }) + K7.sous(['Le quiz sonde et crée du lien.'], lt)
          var y = K7._filet + 200
          g += K3.op(pop(lt, 0.5, 0.5), K8.phone(100, y + 25, 150, 290, -8, K8.roue(NOM, 600 * F.easeOut(F.prog(lt, 0.6, 3.0)))))
          g += K3.op(pop(lt, 0.7, 0.5), K8.phone(380, y + 25, 150, 290, 8, K8.tombola(NOM)))
          g += K3.op(pop(lt, 0.3, 0.5), K8.phone(240, y, 196, 380, 0, K8.quiz(NOM, pop(lt, 1.8, 0.35))))
          return g
        }
      },
      { // 10. L'équaliseur : supports illustrés reliés aux barres
        bg: BG.blanc, from: [240, 560],
        draw: function (lt) {
          var g = T(['CHAQUE', 'SUPPORT,', 'MESURÉ.'], lt, { mag: 2 })
          var vy = K7._bas + 76, top = vy + 86, bas = 700, h = bas - top, gid = F.id('eq')
          g += '<defs>' + K8.degradeOr(gid, true) + '</defs>'
          for (var k = 1; k < 4; k++) g += '<path d="M30,' + (bas - h * k / 4).toFixed(1) + ' L450,' + (bas - h * k / 4).toFixed(1) + '" stroke="' + INK + '" stroke-width="1" opacity=".12"/>'
          var b = [['affiche', 'AFFICHE', 0.7, TEAL], ['reseaux', 'RÉSEAUX', 0.9, 'url(#' + gid + ')'], ['flyer', 'FLYER', 0.45, KC.ciel], ['campagne', 'CAMPAGNE', 0.62, KC.menthe]]
          b.forEach(function (o, i) {
            var cx = 84 + i * 108, w = 76, x = cx - w / 2, pv = pop(lt, 0.3 + i * 0.15, 0.4)
            g += K8.vignette(o[0], cx, vy, 94, pv)
            if (pv > 0) g += '<path d="M' + cx + ',' + (vy + 48) + ' L' + cx + ',' + top + '" stroke="' + INK + '" stroke-width="2" opacity="' + pv.toFixed(3) + '"/>'
            var v = K3 && window.K4 ? window.K4.valeur(lt, 0.9 + i * 0.25, o[2], i) : o[2], hh = h * v
            g += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="16" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>'
            if (hh > 14) g += '<rect x="' + (x + 6) + '" y="' + (bas - hh + 6).toFixed(1) + '" width="' + (w - 12) + '" height="' + (hh - 12).toFixed(1) + '" rx="11" fill="' + o[3] + '"/>'
            g += '<text class="safe" x="' + cx + '" y="' + (bas + 34) + '" text-anchor="middle" font-family="ArchivoX" font-weight="900" font-size="13" letter-spacing=".6" fill="' + INK + '" opacity="' + pv.toFixed(3) + '">' + o[1] + '</text>'
          })
          return g
        }
      },
      { // 11. Votre image
        bg: BG.menthe, from: [192, 600],
        draw: function (lt) {
          var g = T(['RENFORCEZ', 'VOTRE', 'IMAGE.'], lt, { mag: 2 })
          var y0 = K7._bas + 40
          g += '<path d="M30,' + y0 + ' L450,' + y0 + '" stroke="' + INK + '" stroke-width="2" opacity="' + F.easeOut(F.prog(lt, 0.3, 0.4)).toFixed(3) + '"/>'
          ;[['1', PA.ciel, 'Faites jouer.'], ['2', '#fff', 'Faites-vous', 'connaître.'], ['3', PA.peche, 'Faites revenir.']].forEach(function (r, i) {
            var a = 0.5 + i * 0.5, y = y0 + i * 125, p = F.easeOut(F.prog(lt, a, 0.4))
            g += K7.contour(r[0], 34, y + 104, 100, r[1], p)
            g += K3.op(p, '<text class="safe" x="140" y="' + (r[3] ? y + 58 : y + 76) + '" font-family="ArchivoX" font-weight="900" font-size="30" fill="' + INK + '">' + r[2] + '</text>' + (r[3] ? '<text class="safe" x="140" y="' + (y + 94) + '" font-family="ArchivoX" font-weight="900" font-size="30" fill="' + INK + '">' + r[3] + '</text>' : ''))
            g += '<path d="M30,' + (y + 125) + ' L450,' + (y + 125) + '" stroke="' + INK + '" stroke-width="2" opacity="' + p.toFixed(3) + '"/>'
          })
          return g
        }
      },
      { // 12. Vos clients
        bg: BG.blanc, from: [240, 600],
        draw: function (lt) {
          var g = T(['VOUS', 'CONNAISSEZ', 'VOS CLIENTS.'], lt, { mag: 2 }) + K7.sous(['Âge, sexe, provenance, avis.'], lt)
          var y = K7._filet + 195
          g += K7.tache(110, y + 120, 90, PA.ciel, 12, F.prog(lt, 0.2, 1.0))
          g += K8.phone(245, y, 220, 400, 0, K8.stats(F.prog(lt, 0.4, 1.8)))
          return g
        }
      },
      { // 13. Le téléphone
        bg: BG.ciel, from: [245, 600],
        draw: function (lt) {
          var g = T(['TOUT DEPUIS', 'VOTRE', 'TÉLÉPHONE.'], lt, { mag: 2 }) + K7.sous(['Lots, tirage, billets.'], lt)
          var y = K7._filet + 195
          g += K7.tache(350, y - 70, 100, '#fff', 13, F.prog(lt, 0.2, 1.0))
          g += K8.phone(240, y, 220, 400, 0, K8.tirage(lt < 1.2 ? 0 : lt < 2.4 ? 1 : 2, LOT))
          return g
        }
      },
      { // 14. 55 %
        bg: BG.menthe, from: [240, 520],
        draw: function (lt) {
          var g = grand('55 %', 240, 380, 150, '#fff', lt)
          g += T(['DES JOUEURS', 'SOUHAITENT', 'GARDER', 'LE CONTACT.'], lt - 0.4, { y: 450, mag: 3 })
          g += source('Source : Nuits du Sud 2026', lt)
          return g
        }
      },
      { // 15. 70 %
        bg: BG.ciel, from: [240, 520],
        draw: function (lt) {
          var g = grand('70 %', 240, 390, 150, '#fff', lt)
          g += T(['D’OPT-IN', 'SUR', 'L’ÉVÉNEMENT', 'LOCAL.'], lt - 0.4, { y: 460, mag: 2 })
          g += source('Source : Données Flowin', lt)
          return g
        }
      },
      { // 16. Fin
        bg: BG.blanc, from: [240, 520],
        draw: function (lt, img0) {
          var g = T(['INSTALLEZ', 'FLOWIN DÈS', 'MAINTENANT.'], lt, { img0: img0, mag: 1 })
          var y = K7._bas + 40
          g += K5card(250, y, img0 ? 1 : pop(lt, 0.3, 0.5))
          g += K8.macaron(82, y + 372, 62, img0 ? 1 : pop(lt, 0.6, 0.5), -10)
          g += K3.op(img0 ? 1 : pop(lt, 0.9, 0.5), K7.signature(250, y + 410, 1))
          return g
        }
      }
    ]
  })
  function K5card(cx, y, p) { return window.K5.carteQR(cx, y, 196, p) }
})()
