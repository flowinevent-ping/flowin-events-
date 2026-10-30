/* Participants — style H « typo + vrais écrans » (~41 s).
   Scénario de Romain : guide du « comment ça marche ». Chaque élément montré
   existe dans le code (voir SCENARIOS.md, section style H). */
(function () {
  var F = window.FH, C = F.C
  function sous(t, lt, a, col) { return F.texte(30, F._basMots + 38, t, { size: 24, w: 700, fill: col || 'rgba(255,255,255,.85)', op: F.easeOut(F.prog(lt, a || 0.45, 0.4)) }) }

  window.SCENARIO = {
    titre: 'Flowin — comment jouer',
    sous: 'Le guide du participant : on flashe, on joue, on gagne, dans chaque commerce et au festival.',
    end: { mode: 'qr' },
    scenes: [
      {
        label: 'Accroche', dur: 3.5, bg: C.mag, mots: ['TA VILLE', 'JOUE.'],
        caption: 'Festival + commerces, un seul jeu.',
        desc: 'Image 0 lisible : le mot géant pose la promesse, le sticker montre l’objet à chercher.',
        draw: function (lt, img0) {
          var g = F.mots(['TA VILLE', 'JOUE.'], lt, '#fff', img0 ? false : undefined)
          g += sous('Festival + commerces, un seul jeu.', lt, img0 ? -1 : 0.4)
          var s = 0.94 + 0.06 * F.easeOut(F.prog(lt, 0, 0.6))
          g += '<g transform="translate(240,610) scale(' + s.toFixed(3) + ')">' + F.sticker(0, 0, 196, -6) + '</g>'
          g += F.flash(240, 610, lt, 1.2, 2)
          return g
        }
      },
      {
        label: 'Cherche', dur: 4, bg: C.ink, mots: ['CHERCHE.'], from: [240, 610],
        caption: 'Dans chaque commerce Flowin.',
        desc: 'Une vitrine, le sticker « Station de jeu » collé dessus : c’est là qu’on joue.',
        draw: function (lt) {
          var g = F.mots(['CHERCHE.'], lt, '#fff')
          g += sous('Dans chaque commerce Flowin.', lt)
          // vitrine : cadre fin + reflets
          g += '<rect x="44" y="300" width="400" height="450" rx="10" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.28)" stroke-width="3"/>'
          g += '<path d="M244,300 L244,750" stroke="rgba(255,255,255,.18)" stroke-width="3"/>'
          g += '<path d="M70,420 L150,330 M86,452 L176,352 M300,700 L410,580" stroke="rgba(255,255,255,.08)" stroke-width="10" stroke-linecap="round"/>'
          var p = F.easeOut(F.prog(lt, 0.6, 0.5)), s = 0.7 + 0.3 * p
          g += '<g opacity="' + p.toFixed(3) + '" transform="translate(330,540) scale(' + s.toFixed(3) + ')">' + F.sticker(0, 0, 160, -6) + '</g>'
          g += F.flash(330, 540, lt, 1.2, 2)
          return g
        }
      },
      {
        label: 'Flashe', dur: 4, bg: C.mag, mots: ['FLASHE.'], from: [330, 540],
        caption: 'Sans appli. Sans téléchargement.',
        desc: 'Le téléphone vise le QR : l’appareil photo suffit, le jeu s’ouvre dans le navigateur.',
        draw: function (lt) {
          var g = F.mots(['FLASHE.'], lt, '#fff')
          g += sous('Sans appli. Sans téléchargement.', lt)
          g += F.sticker(170, 600, 180, -5)
          g += F.flash(170, 600, lt, 1.5, 3)
          var p = F.easeOut(F.prog(lt, 0.3, 0.8)), x = 520 - 175 * p
          g += F.phone(x, 500, 150, 300, 10, F.ecranScan)
          return g
        }
      },
      {
        label: 'Un jeu par commerce', dur: 5, bg: C.violet, mots: ['À CHAQUE', 'PASSAGE,', 'JOUE.'], from: [170, 600],
        caption: 'Quiz + bonus, roue, tombola, vote.',
        desc: 'Les quatre jeux de la plateforme, un par commerce : chaque passage est une occasion de jouer.',
        draw: function (lt) {
          var g = F.mots(['À CHAQUE', 'PASSAGE,', 'JOUE.'], lt, '#fff')
          var y0 = F._basMots + 14
          var cartes = [['Quiz + bonus', 'quiz'], ['Roue', 'roue'], ['Tombola', 'tombola'], ['Vote', 'vote']]
          cartes.forEach(function (c, k) {
            var x = 30 + (k % 2) * 214, y = y0 + Math.floor(k / 2) * 150, p = F.easeOut(F.prog(lt, 0.7 + k * 0.4, 0.45))
            if (p <= 0) return
            g += '<g opacity="' + p.toFixed(3) + '" transform="translate(' + (x + (1 - p) * 60) + ',' + y + ')">'
            g += '<rect width="200" height="136" rx="18" fill="#fff"/>'
            g += icone(c[1], 40, 44)
            g += '<text class="safe" x="20" y="116" font-family="Manrope" font-weight="800" font-size="' + (c[0].length > 8 ? 24 : 28) + '" fill="' + C.ink + '">' + c[0] + '</text></g>'
            if (p > 0 && p < 1) g += ''
          })
          var k = Math.floor(F.clamp((lt - 0.7) / 0.4, 0, 3.99))
          if (lt > 0.9) g += F.flash(30 + (k % 2) * 214 + 100, y0 + Math.floor(k / 2) * 150 + 68, lt, 0.9 + k * 0.4, 1)
          return g
        }
      },
      {
        label: 'Joue', dur: 6, bg: C.ink, mots: ['JOUE.'], from: [240, 560],
        caption: '5 questions, puis des bonus.',
        desc: 'Le vrai quiz du festival : question 3/5, « Juillet » coché. Puis les questions bonus.',
        draw: function (lt) {
          var g = F.mots(['JOUE.'], lt, '#fff')
          g += sous('5 questions, puis des bonus.', lt)
          var bonus = lt > 3.4, choix = F.easeOut(F.prog(lt, 1.5, 0.35)), ch2 = F.easeOut(F.prog(lt, 4.6, 0.35))
          g += F.phone(240, 560, 230, 450, 0, bonus ? F.ecranBonus(ch2) : F.ecranQuiz(choix))
          // anneau sur la bonne réponse (option 2)
          var u = 214 / 240
          if (!bonus) g += F.flash(240 - 107 + 206 * u, 560 - 217 + 242 * u, lt, 1.8, 2)
          else g += F.flash(240, 560, lt, 3.4, 1)
          return g
        }
      },
      {
        label: 'Gagne', dur: 4.5, bg: C.gold, mots: ['GAGNE.'], from: [240, 560],
        caption: 'Un ticket pour le tirage au sort.',
        desc: 'Le ticket réel sort du téléphone : un numéro, un tirage au sort.',
        draw: function (lt) {
          var g = F.mots(['GAGNE.'], lt, C.ink)
          g += sous('Un ticket pour le tirage au sort.', lt, 0.45, C.ink)
          g += F.phone(240, 650, 170, 340, 0, F.ecranScore)
          var p = F.easeOut(F.prog(lt, 0.7, 0.9)), y = 640 - 210 * p, s = 0.5 + 0.5 * p
          g += '<g opacity="' + F.clamp(p * 3, 0, 1).toFixed(3) + '" transform="translate(240,' + y.toFixed(1) + ') scale(' + s.toFixed(3) + ')">' + F.ticket(0, 0, 340, -4 * p, C.gold) + '</g>'
          g += F.flash(240, 430, lt, 1.6, 2)
          return g
        }
      },
      {
        label: 'Garde-le', dur: 4.5, bg: C.teal, mots: ['GARDE-LE.'], from: [240, 430],
        caption: 'Ajoute Flowin à ton écran d’accueil.',
        desc: 'Depuis le navigateur, « Ajouter à l’écran d’accueil » : Flowin s’ouvre comme une appli, sans téléchargement.',
        draw: function (lt) {
          var g = F.mots(['GARDE-LE.'], lt, '#fff')
          g += sous('Ajoute Flowin à ton écran d’accueil.', lt, 0.45, '#fff')
          var p = F.easeInOut(F.prog(lt, 0.9, 0.9))
          var cible = [0, 0]
          g += F.phone(240, 570, 250, 420, 0, function (sw, sh) {
            var o = '<rect width="' + sw + '" height="' + sh + '" fill="#0E3B37"/>'
            var cw = 44, gap = (sw - 4 * cw) / 5
            for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) {
              var x = gap + c * (cw + gap), y = 40 + r * 70
              if (r === 1 && c === 2) { cible = [x, y]; continue }
              o += '<rect x="' + x + '" y="' + y + '" width="' + cw + '" height="' + cw + '" rx="11" fill="rgba(255,255,255,.16)"/>'
            }
            var x0 = cible[0] + 120, y0 = cible[1] - 120, x = x0 + (cible[0] - x0) * p, y = y0 + (cible[1] - y0) * p, s = 1.8 - 0.8 * p
            o += '<g transform="translate(' + (x + cw / 2) + ',' + (y + cw / 2) + ') scale(' + s.toFixed(3) + ')" opacity="' + F.clamp(F.prog(lt, 0.7, 0.3), 0, 1).toFixed(3) + '">'
            o += '<rect x="' + (-cw / 2) + '" y="' + (-cw / 2) + '" width="' + cw + '" height="' + cw + '" rx="11" fill="' + C.ink + '"/>'
            o += '<text x="0" y="5" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" fill="' + C.mag + '" letter-spacing="-.6">in</text></g>'
            if (p >= 1) o += '<text x="' + (cible[0] + cw / 2) + '" y="' + (cible[1] + cw + 13) + '" text-anchor="middle" font-family="Manrope" font-weight="700" font-size="11" fill="#fff">Flowin</text>'
            return o
          })
          g += F.flash(240 - 117 + cible[0] + 22, 570 - 202 + cible[1] + 22, lt, 1.8, 2)
          return g
        }
      },
      {
        label: 'Continue', dur: 5, bg: C.ink, mots: ['CONTINUE.'], from: [240, 520],
        caption: 'Commerces et festival : le même jeu.',
        desc: 'Le plan de la ville s’allume boutique par boutique, puis la scène du festival : tout est relié.',
        draw: function (lt) {
          var g = F.mots(['CONTINUE.'], lt, '#fff')
          g += sous('Commerces et festival : le même jeu.', lt)
          var rues = 'M30,420 L450,420 M30,560 L450,560 M30,700 L450,700 M120,330 L120,760 M360,330 L360,760'
          g += '<path d="' + rues + '" stroke="rgba(255,255,255,.14)" stroke-width="14" stroke-linecap="round"/>'
          var fest = [240, 560], shops = [[70, 380], [190, 380], [410, 470], [70, 640], [300, 740], [410, 640]]
          shops.forEach(function (s, k) {
            var p = F.easeOut(F.prog(lt, 0.7 + k * 0.32, 0.3))
            g += '<path d="M' + s[0] + ',' + s[1] + ' L' + fest[0] + ',' + fest[1] + '" stroke="#fff" stroke-width="2" stroke-dasharray="6 7" opacity="' + (0.45 * F.prog(lt, 2.9, 0.5)).toFixed(3) + '"/>'
            g += '<rect x="' + (s[0] - 18) + '" y="' + (s[1] - 18) + '" width="36" height="36" rx="9" fill="' + (p > 0 ? C.mag : 'rgba(255,255,255,.15)') + '" opacity="' + (0.35 + 0.65 * p).toFixed(3) + '"/>'
            g += F.flash(s[0], s[1], lt, 0.7 + k * 0.32, 1)
          })
          var pf = F.easeOut(F.prog(lt, 2.8, 0.5))
          g += '<circle cx="' + fest[0] + '" cy="' + fest[1] + '" r="' + (30 + 16 * pf).toFixed(1) + '" fill="' + (pf > 0 ? C.gold : 'rgba(255,255,255,.15)') + '"/>'
          g += '<path d="M' + (fest[0] - 22) + ',' + (fest[1] + 4) + ' Q' + fest[0] + ',' + (fest[1] - 24) + ' ' + (fest[0] + 22) + ',' + (fest[1] + 4) + ' Z" fill="' + C.ink + '" opacity="' + pf.toFixed(3) + '"/>'
          g += '<text class="safe" x="' + fest[0] + '" y="' + (fest[1] + 74) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="18" letter-spacing="2" fill="' + C.gold + '" opacity="' + pf.toFixed(3) + '">FESTIVAL</text>'
          g += F.flash(fest[0], fest[1], lt, 2.8, 3)
          return g
        }
      },
      {
        label: 'Fin', dur: 4.5, bg: C.ink, from: [240, 560],
        caption: 'Culture + commerces. Un seul jeu.',
        desc: 'QR réel : il ouvre le jeu en aperçu (rien n’est enregistré). Logo et signature.',
        draw: function (lt) {
          var g = F.texte(30, 160, 'Culture + commerces.', { size: 40, w: 800, ls: -1.6 })
          g += F.texte(30, 210, 'Un seul jeu.', { size: 40, w: 800, ls: -1.6, fill: C.mag })
          g += F.qr(150, 270, 190)
          g += F.flash(245, 365, lt, 0.2, 2)
          g += F.texte(245, 525, 'Scanne pour essayer le jeu', { size: 19, w: 700, anchor: 'middle', fill: 'rgba(255,255,255,.75)' })
          g += F.texte(245, 610, 'Flashez. Jouez. Gagnez.', { size: 32, w: 800, anchor: 'middle', ls: -1.2 })
          g += '<g class="safe">' + F.logo(245, 712, 70, '#fff', 'middle') + '</g>'
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
