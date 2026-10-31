/* s3-v9 — « Installez Flowin dès maintenant » (74 s). Palette A « Soleil du
   Sud » : crème et blanc en alternance, brun-encre, corail, orange.
   Une idée par écran ; même titre (Archivo 44) sur tous les écrans de texte.
   Toute la sortie passe par K9.chaud() (aucun noir plein, aucun gris froid). */
(function () {
  var F = window.FH, K3 = window.K3, K7 = window.K7, K8 = window.K8, K9 = window.K9
  var KC = K9.C, PA = K9.PA, BG = K9.BG, INK = KC.ink, CORAIL = KC.corail
  var pop = K3.pop, NOM = 'Boulangerie Exemple', LOT = 'Bon d’achat 10 €'
  K9.charte()
  var TAILLE = 44
  var T = function (l, lt, o) { o = o || {}; o.max = TAILLE; return K9.titre(l, lt, o) }
  function etape(num, pastel, lt) { return K7.contour(num, 30, 190, 104, pastel, F.easeOut(F.prog(lt, 0.05, 0.4))) }
  function source(t, lt) { return '<text class="safe" x="30" y="756" font-family="Manrope" font-weight="700" font-size="16" fill="' + KC.mut + '" opacity="' + F.easeOut(F.prog(lt, 1.0, 0.4)).toFixed(3) + '">' + F.esc(t) + '</text>' }
  function demi(x, y, s, inner) { return '<g transform="translate(' + x.toFixed(1) + ',' + y.toFixed(1) + ') scale(' + s + ')">' + inner + '</g>' }
  function trottoir(y) { return '<rect x="0" y="' + y + '" width="540" height="' + (960 - y) + '" fill="#FBE6D4"/><path d="M0,' + y + ' L540,' + y + '" stroke="' + INK + '" stroke-width="2.5"/>' }

  var sc = K3.film('s3-v9', {
    ring: CORAIL,
    scenes: [
      { // 1. Le fichier client se réveille
        bg: BG.blanc,
        draw: function (lt, img0) {
          var L = img0 ? 9 : lt, g = T(['ET SI ON', 'RÉVEILLAIT', 'VOTRE', 'FICHIER', 'CLIENT ?'], lt, { img0: img0, mag: 1 }) + K9.sous(null, lt, { img0: img0 })
          var y = K7._filet + 222, e = F.prog(L, 1.7, 1.0)
          g += K7.tache(330, y - 120, 100, PA.corail, 3, F.prog(L, 1.7, 0.8))
          g += K9.phone(220, y, 230, 420, 0, K9.ecranFichier(e))
          if (e <= 0) g += K9.zzz(352, y - 150, L, 1)
          g += F.flash(220, y - 150, L, 1.7, 2)
          return g
        }
      },
      { // 2. Le flux qui passe devant la vitrine
        bg: BG.creme, from: [220, 560],
        draw: function (lt) {
          var g = T(['ET SI ON', 'CAPTAIT', 'LE FLUX', 'QUI PASSE ?'], lt, { mag: 1 }) + K9.sous(null, lt)
          var y0 = K7._filet + 36, w = 380, G = K9.devantureGeo(80, y0, w)
          g += trottoir(G.sol)
          g += K9.devanture(80, y0, w, { macP: pop(lt, 0.5, 0.5) })
          for (var k = 0; k < 5; k++) {
            var x = ((lt * 95 + k * 150) % 750) - 90, tn = K9.TENUES[k]
            g += K9.passant(x, G.sol + 66 + (k % 2) * 14, 0.95, tn[0], tn[1], lt * 7 + k)
          }
          return g
        }
      },
      { // 3. Passants -> flash -> jeu -> fiches contact
        bg: BG.blanc, from: [300, 560],
        draw: function (lt) {
          var g = T(['LE JEU', 'TRANSFORME', 'LE PASSAGE', 'EN', 'CONTACTS.'], lt, { mag: 4 }) + K9.sous(null, lt)
          var y0 = K7._filet + 20, w = 300, G = K9.devantureGeo(18, y0, w), sol = G.sol + 58, mx = G.mac[0], my = G.mac[1]
          g += trottoir(G.sol)
          g += K9.devanture(18, y0, w, {})
          var noms = ['M•••• D.', 'S•••• L.', 'A•••• B.'], av = [PA.corail, PA.or, PA.teal], posee = 0, fly = ''
          for (var k = 0; k < 3; k++) {
            var a = 0.3 + k * 1.5, tl = lt - a, tn = K9.TENUES[k], xs = mx + 6
            if (tl < 0) continue
            var x, arret = false, op = 1, phone = false
            if (tl < 0.8) x = -40 + (xs + 40) * (tl / 0.8)
            else if (tl < 1.6) { x = xs; arret = true; phone = tl > 0.85 }
            else { var q = F.clamp((tl - 1.6) / 0.6, 0, 1); x = xs + (G.porte - xs) * q; op = 1 - F.clamp((q - 0.55) / 0.45, 0, 1) }
            if (op > 0) g += '<g opacity="' + op.toFixed(3) + '">' + K9.passant(x, sol, 0.95, tn[0], tn[1], lt * 7 + k, { arret: arret, phone: phone }) + '</g>'
            if (tl > 0.9 && tl < 1.6) {
              g += F.flash(mx, my, lt, a + 0.9, 1)
              var bp = F.easeOut(F.prog(tl, 0.95, 0.2)), ok = tl > 1.3
              g += '<g opacity="' + bp.toFixed(3) + '" transform="translate(' + (x + 44).toFixed(1) + ',' + (sol - 160).toFixed(1) + ')"><circle r="17" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>' +
                (ok ? '<path d="M-7,0 L-2,5 L8,-5" stroke="' + CORAIL + '" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' : '<text y="7" text-anchor="middle" font-family="ArchivoX" font-weight="900" font-size="19" fill="' + CORAIL + '">?</text>') + '</g>'
            }
            // La fiche part du joueur et rejoint la pile
            var f = F.prog(tl, 1.35, 0.55), sx = 392, sy = 712 - k * 28
            if (f >= 1) posee++
            else if (f > 0) { var e2 = F.easeInOut(f); fly += demi(x + 40 + (sx - x - 40) * e2, sol - 150 + (sy - sol + 150) * e2 - Math.sin(f * Math.PI) * 60, 0.25 + 0.25 * e2, K9.fiche(0, 0, 300, 0, noms[k], av[k])) }
          }
          for (var c = 0; c < posee; c++) g += demi(392, 712 - c * 28, 0.5, K9.fiche(0, 0, 300, [-4, 3, -2][c], noms[c], av[c]))
          g += fly
          if (posee > 0) g += K9.pilule(392, 712 - (posee - 1) * 28 - 78, '+' + posee + ' CONTACT' + (posee > 1 ? 'S' : ''), 1)
          return g
        }
      },
      { // 4. Plug & Play : grand macaron, affiche assortie
        bg: BG.creme, from: [386, 640],
        draw: function (lt) {
          var g = T(['UNE', 'ANIMATION', 'PLUG & PLAY.'], lt, { mag: 2 }) + K9.sous(['Le temps de coller un macaron.'], lt)
          var y = K7._filet + 205
          g += K3.op(pop(lt, 0.9, 0.5), K9.affiche(382, y + 10, 148, 5))
          g += K9.macaron(170, y, 128, pop(lt, 0.3, 0.6), -8 + 8 * F.easeOut(F.prog(lt, 0.3, 0.8)))
          return g
        }
      },
      { // 5. 01 Ils flashent
        bg: BG.blanc, from: [170, 560],
        draw: function (lt) {
          var g = etape('01', PA.corail, lt) + T(['ILS', 'FLASHENT.'], lt, { y: 214 }) + K9.sous(['Sans appli.'], lt)
          var y = K7._filet + 185
          g += K9.macaron(140, y, 100, 1, -6)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8))
          g += K9.phone(540 - 180 * p, y, 160, 310, 6, K8.scan)
          g += F.flash(140, y, lt, 1.3, 2)
          return g
        }
      },
      { // 6. 02 Ils jouent : quiz au nom du commerce
        bg: BG.creme, from: [360, 600],
        draw: function (lt) {
          var g = etape('02', PA.or, lt) + T(['ILS', 'JOUENT.'], lt, { y: 214 }) + K9.sous(['Un quiz à votre nom.'], lt)
          var y = K7._filet + 225
          g += K7.tache(355, y - 120, 100, PA.or, 6, F.prog(lt, 0.2, 1.0))
          g += K9.phone(240, y, 230, 420, 0, K9.quiz(NOM, pop(lt, 1.9, 0.35)))
          return g
        }
      },
      { // 7. 03 Ils gagnent
        bg: BG.blanc, from: [240, 600],
        draw: function (lt) {
          var g = etape('03', PA.peche, lt) + T(['ILS', 'GAGNENT.'], lt, { y: 214 }) + K9.sous(null, lt)
          var y = K7._filet + 230
          g += K9.phone(240, y, 230, 420, 0, lt < 2.1 ? K9.gain(NOM, LOT) : K8.billet(LOT, NOM))
          g += F.flash(240, y, lt, 2.1, 2)
          return g
        }
      },
      { // 8. 04 Ils reviennent
        bg: BG.creme, from: [240, 600],
        draw: function (lt) {
          var g = etape('04', PA.corail, lt) + T(['ILS', 'REVIENNENT.'], lt, { y: 214 }) + K9.sous(['Le lot se retire chez vous.'], lt)
          var y = K7._filet + 195
          g += K3.op(pop(lt, 0.2, 0.5), K9.phone(125, y + 30, 150, 280, -6, K8.billet(LOT, NOM)))
          g += F.flash(125, y + 20, lt, 1.0, 2)
          g += K9.phone(335, y, 200, 370, 4, K8.retrait(lt < 1.8 ? 1 : 2, 4, NOM, LOT))
          return g
        }
      },
      { // 9. Les jeux
        bg: BG.blanc, from: [335, 600],
        draw: function (lt) {
          var g = T(['QUIZ,', 'ROUE,', 'TOMBOLA.'], lt, { mag: 0 }) + K9.sous(['Animer et garder le lien.'], lt)
          var y = K7._filet + 210
          g += K3.op(pop(lt, 0.5, 0.5), K9.phone(100, y + 25, 150, 290, -8, K8.roue(NOM, 600 * F.easeOut(F.prog(lt, 0.6, 3.0)))))
          g += K3.op(pop(lt, 0.7, 0.5), K9.phone(380, y + 25, 150, 290, 8, K8.tombola(NOM)))
          g += K3.op(pop(lt, 0.3, 0.5), K9.phone(240, y, 196, 380, 0, K9.quiz(NOM, pop(lt, 1.8, 0.35))))
          return g
        }
      },
      { // 10. L'équaliseur : quatre supports bien différents
        bg: BG.creme, from: [240, 560],
        draw: function (lt) {
          var g = T(['CHAQUE', 'SUPPORT,', 'MESURÉ.'], lt, { mag: 2 })
          var vy = K7._bas + 96, top = vy + 76, bas = 696, h = bas - top
          for (var k = 1; k < 4; k++) g += '<path d="M30,' + (bas - h * k / 4).toFixed(1) + ' L452,' + (bas - h * k / 4).toFixed(1) + '" stroke="' + KC.line + '" stroke-width="1.5"/>'
          var b = [['affiche', 'AFFICHE', 0.7, CORAIL], ['flyer', 'FLYER', 0.45, KC.or1], ['reseaux', 'RÉSEAUX', 0.9, KC.teal], ['campagne', 'CAMPAGNE', 0.62, KC.prune]]
          b.forEach(function (o, i) {
            var cx = 78 + i * 106, w = 72, x = cx - w / 2, pv = pop(lt, 0.3 + i * 0.15, 0.4)
            g += K9.vignette(o[0], cx, vy, 104, pv)
            var v = window.K4.valeur(lt, 0.9 + i * 0.25, o[2], i), hh = h * v
            g += '<rect x="' + x + '" y="' + top + '" width="' + w + '" height="' + h + '" rx="16" fill="#fff" stroke="' + INK + '" stroke-width="2.2"/>'
            if (hh > 14) g += '<rect x="' + (x + 6) + '" y="' + (bas - hh + 6).toFixed(1) + '" width="' + (w - 12) + '" height="' + (hh - 12).toFixed(1) + '" rx="11" fill="' + o[3] + '"/>'
            g += '<text class="safe" x="' + cx + '" y="' + (bas + 34) + '" text-anchor="middle" font-family="ArchivoX" font-weight="900" font-size="13" letter-spacing=".4" fill="' + INK + '" opacity="' + pv.toFixed(3) + '">' + o[1] + '</text>'
          })
          return g
        }
      },
      { // 11. Faites jouer. Gardez le contact. Faites revenir.
        bg: BG.blanc, from: [240, 560],
        draw: function (lt) {
          var lignes = [['1', 'FAITES', 'JOUER.', PA.corail], ['2', 'GARDEZ LE', 'CONTACT.', PA.or], ['3', 'FAITES', 'REVENIR.', PA.prune]], g = ''
          var size = TAILLE
          lignes.forEach(function (l) { size = Math.min(size, 305 / K7.largeur(l[1], 'ArchivoX', 900, 1), 305 / K7.largeur(l[2], 'ArchivoX', 900, 1)) })
          size = Math.floor(size)
          var y0 = 150, H = 160
          g += '<path d="M30,' + y0 + ' L452,' + y0 + '" stroke="' + KC.line + '" stroke-width="3" opacity="' + F.easeOut(F.prog(lt, 0.1, 0.4)).toFixed(3) + '"/>'
          lignes.forEach(function (l, i) {
            var y = y0 + i * H, p = F.easeOut(F.prog(lt, 0.2 + i * 0.6, 0.45))
            g += K7.contour(l[0], 36, y + 122, 118, l[3], p)
            g += K3.op(p, '<text class="safe" data-cap="' + (0.72 * size).toFixed(1) + '" x="146" y="' + (y + 68 + (1 - p) * 16).toFixed(1) + '" font-family="ArchivoX" font-weight="900" font-size="' + size + '" fill="' + INK + '">' + l[1] + '</text>' +
              '<text class="safe" data-cap="' + (0.72 * size).toFixed(1) + '" x="146" y="' + (y + 68 + size + (1 - p) * 16).toFixed(1) + '" font-family="ArchivoX" font-weight="900" font-size="' + size + '" fill="' + CORAIL + '">' + l[2] + '</text>')
            g += '<path d="M30,' + (y + H) + ' L452,' + (y + H) + '" stroke="' + KC.line + '" stroke-width="3" opacity="' + p.toFixed(3) + '"/>'
          })
          return g
        }
      },
      { // 12. Vos clients (sans sous-titre)
        bg: BG.creme, from: [240, 600],
        draw: function (lt) {
          var g = T(['VOUS', 'CONNAISSEZ', 'VOS CLIENTS.'], lt, { mag: 2 }) + K9.sous(null, lt)
          var y = K7._filet + 232
          g += K7.tache(110, y + 130, 90, PA.peche, 12, F.prog(lt, 0.2, 1.0))
          g += K9.phone(245, y, 230, 420, 0, K8.stats(F.prog(lt, 0.4, 1.8)))
          return g
        }
      },
      { // 13. Le téléphone
        bg: BG.blanc, from: [245, 600],
        draw: function (lt) {
          var g = T(['TOUT DEPUIS', 'VOTRE', 'TÉLÉPHONE.'], lt, { mag: 2 }) + K9.sous(['Lots, tirage, billets.'], lt)
          var y = K7._filet + 215
          g += K7.tache(355, y - 90, 100, PA.corail, 13, F.prog(lt, 0.2, 1.0))
          g += K9.phone(240, y, 220, 400, 0, K8.tirage(lt < 1.2 ? 0 : lt < 2.4 ? 1 : 2, LOT))
          return g
        }
      },
      { // 14. 55 %
        bg: BG.creme, from: [240, 520],
        draw: function (lt) {
          var g = K9.grand('55 %', 240, 380, 150, lt)
          g += T(['DES JOUEURS', 'SOUHAITENT', 'GARDER', 'LE CONTACT.'], lt - 0.4, { y: 450, mag: 3 })
          g += source('Source : Nuits du Sud 2026', lt)
          return g
        }
      },
      { // 15. 70 %
        bg: BG.blanc, from: [240, 520],
        draw: function (lt) {
          var g = K9.grand('70 %', 240, 390, 150, lt)
          g += T(['D’OPT-IN', 'SUR', 'L’ÉVÉNEMENT', 'LOCAL.'], lt - 0.4, { y: 460, mag: 2 })
          g += source('Source : Données Flowin', lt)
          return g
        }
      },
      { // 16. Fin : carte QR des offres, grand macaron, signature
        bg: BG.creme, from: [240, 520],
        draw: function (lt, img0) {
          var g = T(['INSTALLEZ', 'FLOWIN DÈS', 'MAINTENANT.'], lt, { img0: img0, mag: 1 })
          var y = K7._bas + 44
          g += K9.carteQR(158, y, 180, img0 ? 1 : pop(lt, 0.3, 0.5))
          g += K9.macaron(368, y + 140, 92, img0 ? 1 : pop(lt, 0.6, 0.5), -10)
          g += K3.op(img0 ? 1 : pop(lt, 0.9, 0.5), K7.signature(250, y + 372, 1))
          return g
        }
      }
    ]
  })
  // Réchauffage de toute la sortie (encre, gris, accents v8 -> palette A).
  sc.scenes.forEach(function (s) { var d = s.draw; s.draw = function (lt, img0) { return K9.chaud(d(lt, img0)) } })
  window.SCENARIO = sc
})()
