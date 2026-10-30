/* Vidéo B — « Flowin à ton festival » (style H pastel, ~33 s).
   Ce qui est montré est vérifié dans le code : voir SCENARIOS.md. */
(function () {
  var F = window.FH, K = window.KH, C = F.C, INK = C.ink

  window.SCENARIO = {
    titre: 'Flowin à ton festival',
    sous: 'Le festival joue avec Flowin : repère les stations, suis la piste, joue et gagne.',
    end: { mode: 'qr' }, ring: INK,
    scenes: [
      {
        label: 'Ton festival joue avec Flowin', dur: 4.5, bg: C.lilac, mots: ['TON FESTIVAL', 'JOUE AVEC', 'FLOWIN.'],
        caption: 'Flowin : des jeux gratuits pour gagner des cadeaux.',
        desc: 'L’introduction : ce qu’est Flowin, en une ligne.',
        draw: function (lt, img0) {
          var g = F.mots(['TON FESTIVAL', 'JOUE AVEC', 'FLOWIN.'], lt, INK, img0 ? false : undefined)
          g += K.sous(['Flowin : des jeux gratuits', 'pour gagner des cadeaux.'], lt, { img0: img0, a: 0.5 })
          var s = 0.94 + 0.06 * F.easeOut(F.prog(lt, 0, 0.6))
          g += '<g transform="translate(240,' + (F._basSous + 160) + ') scale(' + s.toFixed(3) + ')">' + F.sticker(0, 0, 150, -6) + '</g>'
          g += F.flash(240, F._basSous + 160, lt, 1.3, 2)
          return g
        }
      },
      {
        label: 'Rends-toi au festival', dur: 4.5, bg: C.sky, mots: ['RENDS-TOI', 'AU FESTIVAL.'], from: [240, 600],
        caption: 'Regarde si Flowin y est.',
        desc: 'La scène, les fanions, le public (silhouettes pleines, sans visage).',
        draw: function (lt) {
          var g = F.mots(['RENDS-TOI', 'AU FESTIVAL.'], lt, INK)
          g += K.sous('Regarde si Flowin y est.', lt)
          g += K.festival(F._basSous + 30, lt)
          return g
        }
      },
      {
        label: 'Repère Flowin', dur: 4.5, bg: C.pink, mots: ['REPÈRE', 'FLOWIN.'], from: [240, 560],
        caption: 'Des stations sur le site et chez les commerçants partenaires.',
        desc: 'Les stations du festival (caisses, bars, stands) et celles des commerces partenaires.',
        draw: function (lt) {
          var g = F.mots(['REPÈRE', 'FLOWIN.'], lt, INK)
          g += K.sous(['Des stations sur le site', 'et chez les commerçants partenaires.'], lt)
          var top = F._basSous + 40
          g += F.sticker(150, top + 170, 160, -6)
          g += F.flash(150, top + 170, lt, 1.0, 2)
          ;['Caisses', 'Bars', 'Stands', 'Commerces'].forEach(function (t, k) {
            var p = F.easeOut(F.prog(lt, 0.8 + k * 0.3, 0.35)), y = top + 50 + k * 66
            g += '<g opacity="' + p.toFixed(3) + '" transform="translate(' + (300 + (1 - p) * 40) + ',' + y + ')"><rect width="150" height="50" rx="25" fill="#fff"/><text class="safe" x="75" y="32" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="19" fill="' + INK + '">' + t + '</text></g>'
          })
          return g
        }
      },
      {
        label: 'Suis la piste', dur: 5, bg: C.mint, mots: ['SUIS LA', 'PISTE.'], from: [150, 560],
        caption: 'Le plan, station par station.',
        desc: 'La carte du festival : un chemin pointillé relie les stations numérotées et les commerces.',
        draw: function (lt) {
          var g = F.mots(['SUIS LA', 'PISTE.'], lt, INK)
          g += K.sous('Le plan, station par station.', lt)
          g += K.plan(F._basSous + 50, lt, { piste: [0.6, 3.2], a: 0.6, pas: 0.5, nums: true, fest: 2 })
          return g
        }
      },
      {
        label: 'Joue et gagne', dur: 5, bg: C.butter, mots: ['JOUE ET', 'GAGNE.'], from: [240, 560],
        caption: 'Le quiz du festival, sur ton téléphone.',
        desc: 'Écran réel du quiz NDS : question 3/5, « Juillet » coché.',
        draw: function (lt) {
          var g = F.mots(['JOUE ET', 'GAGNE.'], lt, INK)
          g += K.sous('Le quiz du festival, sur ton téléphone.', lt)
          var ch = F.easeOut(F.prog(lt, 1.8, 0.35)), py = F._basSous + 220
          g += F.phone(240, py, 200, 360, 0, F.ecranQuiz(ch))
          var u = 184 / 240
          g += F.flash(240 - 92 + 206 * u, py - 172 + 242 * u, lt, 2.1, 2)
          return g
        }
      },
      {
        label: 'À gagner', dur: 5, bg: C.pink, mots: ['À GAGNER :'], from: [240, 560],
        caption: 'Places de concert, cadeaux, goodies, cadeaux chez tes commerçants.',
        desc: 'Les lots : places de concert (lot NDS), cadeaux, goodies, cadeaux des commerçants partenaires.',
        draw: function (lt) {
          var g = F.mots(['À GAGNER :'], lt, INK)
          g += K.cartes(F._basMots + 70, lt, [['Places de|concert', 'place'], ['Cadeaux', 'cadeau'], ['Goodies', 'goodies'], ['Cadeaux chez tes|commerçants', 'boutique']], 0.5, 0.45)
          return g
        }
      },
      {
        label: 'Fin', dur: 4.5, bg: C.lilac, from: [240, 560],
        caption: 'Rends-toi à ton festival.',
        desc: 'QR réel : il ouvre le jeu en aperçu (rien n’est enregistré). Signature et logo.',
        draw: function (lt) {
          var g = K.T(30, 170, 'Rends-toi à', { size: 44, w: 800, ls: -1.8 })
          g += K.T(30, 222, 'ton festival.', { size: 44, w: 800, ls: -1.8, fill: C.mag })
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
