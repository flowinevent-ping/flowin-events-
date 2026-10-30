/* Participants — style H « typo + vrais écrans » : le guide du joueur en
   4 étapes (~38 s). Chaque élément montré existe dans le code (voir
   SCENARIOS.md, section style H). Pas de condition d'achat, pas de cumul
   de tickets promis, pas de durée inventée. */
(function () {
  var F = window.FH, C = F.C, Y0 = 172
  function sous(t, lt, a, col, size) { return F.texte(30, F._basMots + 38, t, { size: size || 24, w: 700, fill: col || 'rgba(255,255,255,.85)', op: F.easeOut(F.prog(lt, a === undefined ? 0.45 : a, 0.4)) }) }
  // Pastille de numéro : cercle blanc, chiffre encre.
  function pastille(n, lt) {
    var p = F.easeOut(F.prog(lt, 0.05, 0.3)), s = 0.6 + 0.4 * p
    return '<g opacity="' + p.toFixed(3) + '" transform="translate(56,128) scale(' + s.toFixed(3) + ')"><circle r="26" fill="#fff"/><text y="11" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="31" fill="' + C.ink + '">' + n + '</text></g>'
  }
  // Barre « Étape n/4 », discrète, sous la zone sûre.
  function progres(n, col) {
    var g = '<text x="30" y="858" font-family="Manrope" font-weight="800" font-size="14" letter-spacing="1.6" fill="' + col + '" opacity=".75">ÉTAPE ' + n + '/4</text>'
    for (var k = 0; k < 4; k++) g += '<rect x="' + (140 + k * 62) + '" y="848" width="54" height="6" rx="3" fill="' + col + '" opacity="' + (k < n ? 0.9 : 0.25) + '"/>'
    return g
  }
  var LOTS = 'Bons d’achat, lots, places de concert.'

  window.SCENARIO = {
    titre: 'Comment on joue avec Flowin',
    sous: 'Le guide du joueur en 4 étapes.',
    end: { mode: 'qr' },
    scenes: [
      {
        label: 'Accroche', dur: 3, bg: C.mag, mots: ['COMMENT', 'ON JOUE ?'],
        caption: 'Flowin, le jeu de tes commerçants et de ton festival.',
        desc: 'Image 0 lisible : la question que se pose le joueur, et l’objet à repérer (le sticker).',
        draw: function (lt, img0) {
          var g = F.mots(['COMMENT', 'ON JOUE ?'], lt, '#fff', img0 ? false : undefined)
          g += F.texte(30, F._basMots + 36, 'Flowin, le jeu de tes commerçants', { size: 23, w: 700, fill: 'rgba(255,255,255,.88)', op: img0 ? 1 : F.easeOut(F.prog(lt, 0.4, 0.4)) })
          g += F.texte(30, F._basMots + 66, 'et de ton festival.', { size: 23, w: 700, fill: 'rgba(255,255,255,.88)', op: img0 ? 1 : F.easeOut(F.prog(lt, 0.4, 0.4)) })
          var s = 0.94 + 0.06 * F.easeOut(F.prog(lt, 0, 0.6))
          g += '<g transform="translate(240,600) scale(' + s.toFixed(3) + ')">' + F.sticker(0, 0, 180, -6) + '</g>'
          g += F.flash(240, 600, lt, 1.2, 2)
          return g
        }
      },
      {
        label: 'Étape 1 — Va chez tes commerçants', dur: 4.5, bg: C.ink, mots: ['VA CHEZ TES', 'COMMERÇANTS.'], from: [240, 600],
        caption: 'Repère le QR Flowin en caisse.',
        desc: 'Une vitrine, le sticker « Station de jeu » : c’est là qu’on joue.',
        draw: function (lt) {
          var g = pastille(1, lt) + F.mots(['VA CHEZ TES', 'COMMERÇANTS.'], lt, '#fff', undefined, Y0)
          g += sous('Repère le QR Flowin en caisse.', lt)
          var top = F._basMots + 74
          g += '<rect x="44" y="' + top + '" width="400" height="' + (752 - top) + '" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.28)" stroke-width="3"/>'
          g += '<path d="M244,' + top + ' L244,752" stroke="rgba(255,255,255,.18)" stroke-width="3"/>'
          g += '<path d="M70,' + (top + 90) + ' L140,' + (top + 20) + ' M300,720 L410,610" stroke="rgba(255,255,255,.08)" stroke-width="10" stroke-linecap="round"/>'
          var p = F.easeOut(F.prog(lt, 0.6, 0.5)), s = 0.7 + 0.3 * p, sy = (top + 752) / 2
          g += '<g opacity="' + p.toFixed(3) + '" transform="translate(330,' + sy + ') scale(' + s.toFixed(3) + ')">' + F.sticker(0, 0, 150, -6) + '</g>'
          g += F.flash(330, sy, lt, 1.2, 2)
          return g + progres(1, '#fff')
        }
      },
      {
        label: 'Étape 2 — Flashe le QR', dur: 4, bg: C.mag, mots: ['FLASHE', 'LE QR.'], from: [330, 590],
        caption: 'Avec ton téléphone. Rien à installer.',
        desc: 'Le téléphone vise le QR : l’appareil photo suffit, le jeu s’ouvre dans le navigateur.',
        draw: function (lt) {
          var g = pastille(2, lt) + F.mots(['FLASHE', 'LE QR.'], lt, '#fff', undefined, Y0)
          g += sous('Avec ton téléphone. Rien à installer.', lt)
          g += F.sticker(160, 640, 170, -5)
          g += F.flash(160, 640, lt, 1.5, 3)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8)), x = 520 - 170 * p
          g += F.phone(x, 610, 140, 280, 10, F.ecranScan)
          return g + progres(2, '#fff')
        }
      },
      {
        label: 'Étape 3 — Joue au jeu du commerce', dur: 5, bg: C.violet, mots: ['JOUE AU JEU', 'DU COMMERCE.'], from: [160, 640],
        caption: 'Chaque commerce a son jeu.',
        desc: 'Les quatre jeux de la plateforme : quiz + bonus, roue, tombola, vote. Chaque commerce choisit le sien.',
        draw: function (lt) {
          var g = pastille(3, lt) + F.mots(['JOUE AU JEU', 'DU COMMERCE.'], lt, '#fff', undefined, Y0)
          g += sous('Chaque commerce a son jeu.', lt)
          var y0 = F._basMots + 70
          var cartes = [['Quiz + bonus', 'quiz'], ['Roue', 'roue'], ['Tombola', 'tombola'], ['Vote', 'vote']]
          cartes.forEach(function (c, k) {
            var x = 30 + (k % 2) * 214, y = y0 + Math.floor(k / 2) * 148, p = F.easeOut(F.prog(lt, 0.8 + k * 0.4, 0.45))
            if (p <= 0) return
            g += '<g opacity="' + p.toFixed(3) + '" transform="translate(' + (x + (1 - p) * 60) + ',' + y + ')">'
            g += '<rect width="200" height="134" rx="18" fill="#fff"/>' + icone(c[1], 40, 44)
            g += '<text class="safe" x="20" y="114" font-family="Manrope" font-weight="800" font-size="' + (c[0].length > 8 ? 24 : 28) + '" fill="' + C.ink + '">' + c[0] + '</text></g>'
          })
          var k = Math.floor(F.clamp((lt - 0.8) / 0.4, 0, 3.99))
          if (lt > 1) g += F.flash(30 + (k % 2) * 214 + 100, y0 + Math.floor(k / 2) * 148 + 67, lt, 1 + k * 0.4, 1)
          return g + progres(3, '#fff')
        }
      },
      {
        label: 'Le quiz', dur: 4, bg: C.ink, mots: ['5 QUESTIONS.'], from: [240, 560],
        caption: 'Le vrai quiz du festival.',
        desc: 'Écran réel du quiz NDS : question 3/5, « Juillet » coché.',
        draw: function (lt) {
          var g = F.mots(['5 QUESTIONS.'], lt, '#fff')
          g += sous('Le vrai quiz du festival.', lt)
          var choix = F.easeOut(F.prog(lt, 1.4, 0.35))
          g += F.phone(240, 555, 230, 440, 0, F.ecranQuiz(choix))
          var u = 214 / 240
          g += F.flash(240 - 107 + 206 * u, 555 - 212 + 242 * u, lt, 1.7, 2)
          return g + progres(3, '#fff')
        }
      },
      {
        label: 'Étape 4 — Tente de gagner', dur: 4.5, bg: C.gold, mots: ['TENTE DE', 'GAGNER.'], from: [240, 560],
        caption: LOTS,
        desc: 'Le ticket réel sort du téléphone : un numéro pour le tirage au sort. Lots attestés : bons d’achat offerts par les commerçants, places de concert (NDS).',
        draw: function (lt) {
          var g = pastille(4, lt) + F.mots(['TENTE DE', 'GAGNER.'], lt, C.ink, undefined, Y0)
          g += sous(LOTS, lt, 0.45, C.ink, 21)
          g += F.phone(240, 690, 150, 290, 0, F.ecranScore)
          var p = F.easeOut(F.prog(lt, 0.7, 0.9)), y = 680 - 120 * p, s = 0.5 + 0.5 * p
          g += '<g opacity="' + F.clamp(p * 3, 0, 1).toFixed(3) + '" transform="translate(240,' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')">' + F.ticket(0, 0, 320, -4 * p, C.gold) + '</g>'
          g += F.flash(240, 560, lt, 1.6, 2)
          return g + progres(4, C.ink)
        }
      },
      {
        label: 'Astuce — Flowin sur ton écran d’accueil', dur: 4.5, bg: C.teal, mots: ['FLOWIN SUR TON', 'ÉCRAN D’ACCUEIL.'], from: [240, 560],
        caption: 'Pour rejouer en un geste.',
        desc: 'Depuis le navigateur, « Ajouter à l’écran d’accueil » : Flowin s’ouvre comme une appli, sans téléchargement.',
        draw: function (lt) {
          var g = '<g opacity="' + F.easeOut(F.prog(lt, 0.05, 0.3)).toFixed(3) + '"><rect x="30" y="108" width="118" height="38" rx="19" fill="#fff"/><text x="89" y="133" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="16" letter-spacing="2" fill="' + C.ink + '">ASTUCE</text></g>'
          g += F.mots(['FLOWIN SUR TON', 'ÉCRAN D’ACCUEIL.'], lt, '#fff', undefined, Y0)
          g += sous('Pour rejouer en un geste.', lt, 0.45, '#fff')
          var p = F.easeInOut(F.prog(lt, 0.9, 0.9)), cible = [0, 0], py = Math.max(600, F._basMots + 290)
          g += F.phone(240, py, 230, 380, 0, function (sw, sh) {
            var o = '<rect width="' + sw + '" height="' + sh + '" fill="#0E3B37"/>'
            var cw = 42, gap = (sw - 4 * cw) / 5
            for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) {
              var x = gap + c * (cw + gap), y = 36 + r * 64
              if (r === 1 && c === 2) { cible = [x, y]; continue }
              o += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + cw + '" rx="11" fill="rgba(255,255,255,.16)"/>'
            }
            var x0 = cible[0] + 110, y0 = cible[1] - 110, x = x0 + (cible[0] - x0) * p, y = y0 + (cible[1] - y0) * p, s = 1.8 - 0.8 * p
            o += '<g transform="translate(' + (x + cw / 2) + ',' + (y + cw / 2) + ') scale(' + s.toFixed(3) + ')" opacity="' + F.clamp(F.prog(lt, 0.7, 0.3), 0, 1).toFixed(3) + '">'
            o += '<rect x="' + (-cw / 2) + '" y="' + (-cw / 2) + '" width="' + cw + '" height="' + cw + '" rx="11" fill="' + C.ink + '"/>'
            o += '<text x="0" y="6" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="' + C.mag + '" letter-spacing="-.6">in</text></g>'
            if (p >= 1) o += '<text x="' + (cible[0] + cw / 2) + '" y="' + (cible[1] + cw + 13) + '" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="11" fill="#fff">Flowin</text>'
            return o
          })
          g += F.flash(240 - 107 + cible[0] + 21, py - 182 + cible[1] + 21, lt, 1.8, 2)
          return g
        }
      },
      {
        label: 'Au festival aussi', dur: 4.5, bg: C.ink, mots: ['AU FESTIVAL', 'AUSSI.'], from: [240, 520],
        caption: 'Culture et commerces : un seul jeu.',
        desc: 'Le plan de la ville s’allume boutique par boutique, puis la scène du festival : tout est relié.',
        draw: function (lt) {
          var g = F.mots(['AU FESTIVAL', 'AUSSI.'], lt, '#fff')
          g += sous('Culture et commerces : un seul jeu.', lt)
          var t0 = F._basMots + 100
          var rues = 'M30,' + (t0 + 40) + ' L450,' + (t0 + 40) + ' M30,' + (t0 + 170) + ' L450,' + (t0 + 170) + ' M30,' + (t0 + 300) + ' L450,' + (t0 + 300) + ' M120,' + t0 + ' L120,760 M360,' + t0 + ' L360,760'
          g += '<path d="' + rues + '" stroke="rgba(255,255,255,.14)" stroke-width="14" stroke-linecap="round"/>'
          var fest = [240, t0 + 170], shops = [[70, t0 + 10], [190, t0 + 10], [410, t0 + 90], [70, t0 + 250], [300, t0 + 330], [410, t0 + 250]]
          shops.forEach(function (s, k) {
            var p = F.easeOut(F.prog(lt, 0.7 + k * 0.3, 0.3))
            g += '<path d="M' + s[0] + ',' + s[1] + ' L' + fest[0] + ',' + fest[1] + '" stroke="#fff" stroke-width="2" stroke-dasharray="6 7" opacity="' + (0.45 * F.prog(lt, 2.7, 0.5)).toFixed(3) + '"/>'
            g += '<rect x="' + (s[0] - 18) + '" y="' + (s[1] - 18) + '" width="36" height="36" rx="9" fill="' + (p > 0 ? C.mag : 'rgba(255,255,255,.15)') + '" opacity="' + (0.35 + 0.65 * p).toFixed(3) + '"/>'
            g += F.flash(s[0], s[1], lt, 0.7 + k * 0.3, 1)
          })
          var pf = F.easeOut(F.prog(lt, 2.6, 0.5))
          g += '<circle cx="' + fest[0] + '" cy="' + fest[1] + '" r="' + (30 + 16 * pf).toFixed(1) + '" fill="' + (pf > 0 ? C.gold : 'rgba(255,255,255,.15)') + '"/>'
          g += '<path d="M' + (fest[0] - 22) + ',' + (fest[1] + 4) + ' Q' + fest[0] + ',' + (fest[1] - 24) + ' ' + (fest[0] + 22) + ',' + (fest[1] + 4) + ' Z" fill="' + C.ink + '" opacity="' + pf.toFixed(3) + '"/>'
          g += '<text class="safe" x="' + fest[0] + '" y="' + (fest[1] + 74) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" letter-spacing="2" fill="' + C.gold + '" opacity="' + pf.toFixed(3) + '">FESTIVAL</text>'
          g += F.flash(fest[0], fest[1], lt, 2.6, 3)
          return g
        }
      },
      {
        label: 'Fin', dur: 4.5, bg: C.ink, from: [240, 560],
        caption: 'Joue chez tes commerçants.',
        desc: 'QR réel : il ouvre le jeu en aperçu (rien n’est enregistré). Signature et logo.',
        draw: function (lt) {
          var g = F.texte(30, 170, 'Joue chez tes', { size: 44, w: 800, ls: -1.8 })
          g += F.texte(30, 222, 'commerçants.', { size: 44, w: 800, ls: -1.8, fill: C.mag })
          g += F.qr(150, 280, 190)
          g += F.flash(245, 375, lt, 0.2, 2)
          g += F.texte(245, 535, 'Scanne pour essayer le jeu', { size: 19, w: 700, anchor: 'middle', fill: 'rgba(255,255,255,.75)' })
          g += F.texte(245, 615, 'Flashez. Jouez. Gagnez.', { size: 32, w: 800, anchor: 'middle', ls: -1.2 })
          g += F.logo(245, 712, 70, '#fff', 'middle')
          return g
        }
      }
    ]
  }
  function icone(k, x, y) {
    var ink = C.ink
    if (k === 'quiz') return '<circle cx="' + x + '" cy="' + y + '" r="24" fill="' + C.mag + '"/><text x="' + x + '" y="' + (y + 10) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="28" fill="#fff">?</text><rect x="' + (x + 34) + '" y="' + (y - 12) + '" width="58" height="24" rx="12" fill="' + C.gold + '"/><text x="' + (x + 63) + '" y="' + (y + 5) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="12" fill="' + ink + '">+ BONUS</text>'
    if (k === 'roue') {
      var g = '', cols = [C.mag, C.gold, C.violet, C.teal]
      for (var i = 0; i < 8; i++) { var a1 = i * Math.PI / 4, a2 = a1 + Math.PI / 4; g += '<path d="M' + x + ',' + y + ' L' + (x + 24 * Math.cos(a1)).toFixed(1) + ',' + (y + 24 * Math.sin(a1)).toFixed(1) + ' A24,24 0 0 1 ' + (x + 24 * Math.cos(a2)).toFixed(1) + ',' + (y + 24 * Math.sin(a2)).toFixed(1) + ' Z" fill="' + cols[i % 4] + '"/>' }
      return g + '<circle cx="' + x + '" cy="' + y + '" r="6" fill="#fff"/><path d="M' + (x - 6) + ',' + (y - 30) + ' L' + (x + 6) + ',' + (y - 30) + ' L' + x + ',' + (y - 20) + ' Z" fill="' + ink + '"/>'
    }
    if (k === 'tombola') return '<g transform="translate(' + x + ',' + y + ') rotate(-8)"><rect x="-28" y="-17" width="56" height="34" rx="6" fill="' + C.gold + '"/><circle cx="-28" cy="0" r="6" fill="#fff"/><circle cx="28" cy="0" r="6" fill="#fff"/><path d="M-10,-13 L-10,13" stroke="#fff" stroke-width="2" stroke-dasharray="3 3"/><text x="9" y="5" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="13" fill="' + ink + '">N°</text></g>'
    return '<rect x="' + (x - 24) + '" y="' + (y - 18) + '" width="10" height="36" rx="4" fill="' + C.teal + '" opacity=".45"/><rect x="' + (x - 8) + '" y="' + (y - 30) + '" width="10" height="48" rx="4" fill="' + C.teal + '"/><rect x="' + (x + 8) + '" y="' + (y - 8) + '" width="10" height="26" rx="4" fill="' + C.teal + '" opacity=".45"/><circle cx="' + (x + 36) + '" cy="' + (y - 18) + '" r="11" fill="' + C.teal + '"/><path d="M' + (x + 31) + ',' + (y - 18) + ' L' + (x + 35) + ',' + (y - 14) + ' L' + (x + 41) + ',' + (y - 22) + '" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
  }
})()
