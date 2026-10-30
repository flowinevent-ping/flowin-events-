/* Vidéo A — « Flowin chez tes commerçants » (style H pastel, 44 s).
   Ce qui est montré est vérifié dans le code : voir SCENARIOS.md. */
(function () {
  var F = window.FH, K = window.KH, C = F.C, INK = C.ink, Y0 = 172, N = 5

  window.SCENARIO = {
    titre: 'Flowin chez tes commerçants',
    sous: 'Ce qu’est Flowin, puis comment jouer et récupérer ses cadeaux, étape par étape.',
    end: { mode: 'qr' }, ring: INK,
    scenes: [
      {
        label: 'C’est quoi Flowin ?', dur: 4.5, bg: C.butter, mots: ['C’EST QUOI', 'FLOWIN ?'],
        caption: 'Des jeux gratuits chez tes commerçants. Des cadeaux à gagner.',
        desc: 'L’introduction : Flowin en deux phrases, et le logo.',
        draw: function (lt, img0) {
          var g = F.mots(['C’EST QUOI', 'FLOWIN ?'], lt, INK, img0 ? false : undefined)
          g += K.sous(['Des jeux gratuits', 'chez tes commerçants.', 'Des cadeaux à gagner.'], lt, { img0: img0, a: 0.5, size: 26 })
          var p = img0 ? 1 : F.easeOut(F.prog(lt, 0.9, 0.5))
          g += '<g opacity="' + p.toFixed(3) + '">' + F.logo(240, 640, 104, INK, 'middle') + '</g>'
          g += F.flash(240, 610, lt, 1.3, 2)
          return g
        }
      },
      {
        label: 'Étape 1 — Trouve les stations', dur: 4.5, bg: C.sky, mots: ['TROUVE LES', 'STATIONS DE JEU.'], from: [240, 570],
        caption: 'Sur la carte Flowin, près de chez toi.',
        desc: 'Le plan de la ville : chaque pastille est une station de jeu (carte des stations dans l’appli).',
        draw: function (lt) {
          var g = K.pastille(1, lt) + F.mots(['TROUVE LES', 'STATIONS DE JEU.'], lt, INK, undefined, Y0)
          g += K.sous('Sur la carte Flowin, près de chez toi.', lt)
          g += K.plan(F._basSous + 46, lt, { a: 0.8, pas: 0.32 })
          return g + K.progres(1, N)
        }
      },
      {
        label: 'Étape 2 — Entre chez ton commerçant', dur: 4, bg: C.pink, mots: ['ENTRE CHEZ TON', 'COMMERÇANT.'], from: [320, 520],
        caption: 'Repère le sticker en caisse.',
        desc: 'Une vitrine, le sticker « Station de jeu » posé en caisse.',
        draw: function (lt) {
          var g = K.pastille(2, lt) + F.mots(['ENTRE CHEZ TON', 'COMMERÇANT.'], lt, INK, undefined, Y0)
          g += K.sous('Repère le sticker en caisse.', lt)
          var top = F._basSous + 46
          g += '<rect x="44" y="' + top + '" width="400" height="' + (752 - top) + '" rx="12" fill="#fff" opacity=".35" stroke="' + INK + '" stroke-width="3"/>'
          g += '<path d="M244,' + top + ' L244,752" stroke="' + INK + '" stroke-width="3" opacity=".5"/>'
          var p = F.easeOut(F.prog(lt, 0.6, 0.5)), s = 0.7 + 0.3 * p, sy = (top + 752) / 2
          g += '<g opacity="' + p.toFixed(3) + '" transform="translate(330,' + sy + ') scale(' + s.toFixed(3) + ')">' + F.sticker(0, 0, 150, -6) + '</g>'
          g += F.flash(330, sy, lt, 1.2, 2)
          return g + K.progres(2, N)
        }
      },
      {
        label: 'Étape 3 — Flashe le QR', dur: 4, bg: C.mint, mots: ['FLASHE', 'LE QR.'], from: [330, 590],
        caption: 'Avec ton téléphone. Rien à installer.',
        desc: 'Le téléphone vise le QR : l’appareil photo suffit, le jeu s’ouvre dans le navigateur.',
        draw: function (lt) {
          var g = K.pastille(3, lt) + F.mots(['FLASHE', 'LE QR.'], lt, INK, undefined, Y0)
          g += K.sous('Avec ton téléphone. Rien à installer.', lt)
          g += F.sticker(160, 640, 170, -5)
          g += F.flash(160, 640, lt, 1.5, 3)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8))
          g += F.phone(520 - 170 * p, 610, 140, 280, 10, F.ecranScan)
          return g + K.progres(3, N)
        }
      },
      {
        label: 'Étape 4 — Joue', dur: 6, bg: C.lilac, mots: ['JOUE.'], from: [160, 640],
        caption: 'Quiz, roue, tombola, vote : chaque commerce a son jeu.',
        desc: 'Les quatre jeux de la plateforme, puis un aperçu du quiz (question 3/5, « Juillet » coché).',
        draw: function (lt) {
          var g = K.pastille(4, lt) + F.mots(['JOUE.'], lt, INK, undefined, Y0)
          g += K.sous(['Quiz, roue, tombola, vote :', 'chaque commerce a son jeu.'], lt)
          var y0 = F._basSous + 40, sortie = F.easeInOut(F.prog(lt, 3.0, 0.5))
          if (sortie < 1) g += '<g opacity="' + (1 - sortie).toFixed(3) + '" transform="translate(' + (-80 * sortie).toFixed(1) + ',0)">' + K.cartes(y0, lt, [['Quiz', 'quiz'], ['Roue', 'roue'], ['Tombola', 'tombola'], ['Vote', 'vote']], 0.7, 0.35) + '</g>'
          if (sortie > 0) {
            var ch = F.easeOut(F.prog(lt, 4.4, 0.35))
            g += '<g opacity="' + sortie.toFixed(3) + '">' + F.phone(240 + 60 * (1 - sortie), y0 + 190, 200, 380, 0, F.ecranQuiz(ch)) + '</g>'
            var u = 184 / 240
            g += F.flash(240 - 92 + 206 * u, y0 + 190 - 182 + 242 * u, lt, 4.7, 2)
          }
          return g + K.progres(4, N)
        }
      },
      {
        label: 'Gain immédiat', dur: 4.5, bg: C.butter, mots: ['GAGNÉ TOUT', 'DE SUITE !'], from: [240, 560],
        caption: 'Selon le jeu : lot gagné sur place…',
        desc: 'Issue 1 : gain immédiat (roue en mode « immédiat », règle de gain du quiz). L’écran affiche le lot et « Voir mon billet ».',
        draw: function (lt) {
          var g = F.mots(['GAGNÉ TOUT', 'DE SUITE !'], lt, INK)
          g += K.sous('Selon le jeu : lot gagné sur place…', lt)
          var p = F.easeOut(F.prog(lt, 0.4, 0.6))
          g += F.phone(240, 790 - 210 * p, 210, 390, 0, K.ecranGain)
          g += F.flash(240, 460, lt, 1.2, 2)
          return g
        }
      },
      {
        label: 'Ou le tirage au sort', dur: 4.5, bg: C.sky, mots: ['OU TU ES DANS', 'LE TIRAGE.'], from: [240, 520],
        caption: '…ou un ticket pour le tirage au sort.',
        desc: 'Issue 2 : un ticket pour le tirage au sort (tombola, roue en mode « tirage », quiz sans faute).',
        draw: function (lt) {
          var g = F.mots(['OU TU ES DANS', 'LE TIRAGE.'], lt, INK)
          g += K.sous('…ou un ticket pour le tirage au sort.', lt)
          var p = F.easeOut(F.prog(lt, 0.6, 0.9)), y = 640 - 120 * p, s = 0.5 + 0.5 * p
          g += F.phone(240, 690, 150, 290, 0, F.ecranScore)
          g += '<g opacity="' + F.clamp(p * 3, 0, 1).toFixed(3) + '" transform="translate(240,' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')">' + F.ticket(0, 0, 320, -4 * p, C.sky) + '</g>'
          g += F.flash(240, 520, lt, 1.5, 2)
          return g
        }
      },
      {
        label: 'Étape 5 — Récupère ton cadeau', dur: 4.5, bg: C.mint, mots: ['RÉCUPÈRE', 'TON CADEAU.'], from: [240, 520],
        caption: 'Montre ton billet en boutique.',
        desc: 'Le billet de retrait : le joueur le présente, le commerçant le valide avec son code professionnel (« Retrait validé »).',
        draw: function (lt) {
          var g = K.pastille(5, lt) + F.mots(['RÉCUPÈRE', 'TON CADEAU.'], lt, INK, undefined, Y0)
          g += K.sous('Montre ton billet en boutique.', lt)
          var v = lt > 2.6
          g += F.phone(240, F._basSous + 236, 220, 400, 0, K.ecranBillet(v))
          g += F.flash(240, F._basSous + 236, lt, 2.6, 2)
          return g + K.progres(5, N)
        }
      },
      {
        label: 'Les super events', dur: 4.5, bg: C.lilac, mots: ['DÉCOUVRE LES', 'SUPER EVENTS.'], from: [240, 560],
        caption: 'Plusieurs commerces, un même jeu. Des cadeaux chez chacun.',
        desc: 'Un super event relie plusieurs commerces autour d’un même jeu ; chaque commerce participant devient une station.',
        draw: function (lt) {
          var g = F.mots(['DÉCOUVRE LES', 'SUPER EVENTS.'], lt, INK)
          g += K.sous(['Plusieurs commerces, un même jeu.', 'Des cadeaux chez chacun.'], lt)
          var top = F._basSous + 50, cx = 240, cy = (top + 752) / 2
          var pts = [[80, top + 30], [400, top + 30], [440, cy + 30], [70, cy + 40], [130, 740], [360, 740]]
          pts.forEach(function (s, k) {
            var p = F.easeOut(F.prog(lt, 0.7 + k * 0.25, 0.3))
            g += '<path d="M' + s[0] + ',' + s[1] + ' L' + cx + ',' + cy + '" stroke="' + INK + '" stroke-width="2.5" stroke-dasharray="6 7" opacity="' + (0.5 * p).toFixed(3) + '"/>'
            g += K.station(s[0], s[1], p)
          })
          var pc = F.easeOut(F.prog(lt, 2.4, 0.4))
          g += '<g opacity="' + pc.toFixed(3) + '" transform="translate(' + cx + ',' + cy + ') scale(' + (0.7 + 0.3 * pc).toFixed(3) + ')"><rect x="-96" y="-34" width="192" height="68" rx="34" fill="' + INK + '"/><text y="9" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="24" letter-spacing="-.6" fill="#fff">SUPER <tspan fill="' + C.mag + '">EVENT</tspan></text></g>'
          g += F.flash(cx, cy, lt, 2.4, 2)
          return g
        }
      },
      {
        label: 'Fin', dur: 4, bg: C.butter, from: [240, 560],
        caption: 'Joue chez tes commerçants.',
        desc: 'QR réel : il ouvre le jeu en aperçu (rien n’est enregistré). Signature et logo.',
        draw: function (lt) {
          var g = K.T(30, 170, 'Joue chez tes', { size: 44, w: 800, ls: -1.8 })
          g += K.T(30, 222, 'commerçants.', { size: 44, w: 800, ls: -1.8, fill: C.mag })
          g += F.qr(150, 280, 190)
          g += F.flash(245, 375, lt, 0.2, 2)
          g += K.T(245, 535, 'Scanne pour essayer le jeu', { size: 19, w: 700, anchor: 'middle', fill: 'rgba(21,12,28,.7)' })
          g += K.T(245, 615, 'Flashez. Jouez. Gagnez.', { size: 32, w: 800, anchor: 'middle', ls: -1.2 })
          g += F.logo(245, 712, 70, INK, 'middle')
          return g
        }
      }
    ]
  }
})()
