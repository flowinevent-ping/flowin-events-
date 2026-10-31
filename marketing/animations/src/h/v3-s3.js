/* s3 — « La semaine où la boutique de Claire a changé » (commerçants, 44 s).
   Claire et sa boutique sont fictives. Écrans : voir SCENARIOS.md (v3). */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var BOUT = 'Les Fleurs de Claire'
  var pop = K3.pop

  window.SCENARIO = K3.film('s3', {
    scenes: [
      { // Lundi
        bg: P.rose, mots: ['LUNDI.', 'LA BOUTIQUE', 'EST CALME.'], max: 100,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0)
          g += K3.vitrine(70, 430, 340, 290, { nom: BOUT.toUpperCase(), icone: 'fleur', col: '#fff' })
          g += '<rect x="40" y="716" width="400" height="14" rx="4" fill="' + INK + '"/>'
          g += K3.fidelite(330, 690, 130, -8)
          return g
        }
      },
      { // Le kit
        bg: P.menthe, mots: ['LE KIT FLOWIN', 'ARRIVE.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var o = pop(lt, 0.2, 0.5)
          g += K3.boite(240, 640, 300, o)
          g += K3.op(pop(lt, 0.6), K3.at(150, 470 + 30 * (1 - pop(lt, 0.6)), 1, K3.affiche(0, 0, 110, -8)))
          g += K3.op(pop(lt, 0.8), K3.at(260, 500 + 30 * (1 - pop(lt, 0.8)), 1, K3.chevalet(0, 0, 100)))
          g += K3.op(pop(lt, 1.0), K3.macaron(370, 470, 48, 1))
          g += K3.op(pop(lt, 1.3), K3.pill(240, 760, 44, 'middle'))
          return g
        }
      },
      { // On colle
        bg: P.ciel, mots: ['ON COLLE.', 'C’EST TOUT.'], from: [240, 640],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var top = 380
          g += K3.vitrine(60, top, 360, 300, { nom: BOUT.toUpperCase(), icone: 'fleur', col: '#fff' })
          var pa = pop(lt, 0.4, 0.6)
          g += K3.op(pa, K3.affiche(60 + 360 * 0.33, top + 300 * 0.64 - 40 * (1 - pa), 120, -2 + 6 * (1 - pa)))
          g += F.flash(60 + 360 * 0.33, top + 190, lt, 1.0, 1)
          g += '<rect x="30" y="716" width="420" height="14" rx="4" fill="' + INK + '"/>'
          var pc = pop(lt, 1.3, 0.5)
          g += K3.op(pc, K3.chevalet(370, 716 - 62 - 30 * (1 - pc), 98))
          g += F.flash(370, 660, lt, 1.8, 1)
          g += K3.op(pop(lt, 2.2), K3.check(400, 420, 26))
          return g
        }
      },
      { // Mardi
        bg: P.lilas, mots: ['MARDI. ELLE', 'LE DIT SUR', 'SES RÉSEAUX.'], max: 96, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var p1 = pop(lt, 0.3, 0.5), p2 = pop(lt, 0.8, 0.5)
          g += K3.op(p1, K3.post(170, 590 + 30 * (1 - p1), 220, BOUT, -5))
          g += K3.op(p2, F.phone(370, 600 + 30 * (1 - p2), 150, 290, 7, function (sw, sh) {
            return '<rect width="' + sw + '" height="' + sh + '" fill="' + C.mag + '"/>' + K3.txt(sw / 2, sh * 0.2, 'STORY', 14, { anchor: 'middle', fill: '#fff', ls: 2 }) +
              K3.txt(sw / 2, sh * 0.36, 'On joue', 22, { anchor: 'middle', fill: '#fff' }) + K3.txt(sw / 2, sh * 0.45, 'chez nous !', 22, { anchor: 'middle', fill: '#fff' }) + F.qr(sw * 0.25, sh * 0.53, sw * 0.5)
          }))
          g += F.flash(370, 640, lt, 1.4, 2)
          return g
        }
      },
      { // Les passants
        bg: P.beurre, mots: ['LES PASSANTS', 'S’ARRÊTENT.'], from: [370, 620],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += K3.vitrine(40, 360, 300, 300, { nom: 'LES FLEURS', icone: 'fleur', col: '#fff', affiche: true, macaron: 1 })
          var arr = function (a, x0, x1) { return x1 + (x0 - x1) * (1 - F.easeOut(F.prog(lt, a, 0.9))) }
          g += K3.perso(arr(0.1, 600, 400), 750, 1.15, { sac: true })
          g += K3.perso(arr(0.35, 640, 300), 750, 1.25, { tel: lt > 1.3 })
          g += K3.perso(arr(0.6, 700, 175), 750, 1.1, {})
          if (lt > 1.3) g += F.flash(368, 590, lt, 1.4, 3)
          return g
        }
      },
      { // Ils jouent
        bg: P.rose, mots: ['ILS JOUENT.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var ch = pop(lt, 1.2, 0.35)
          g += F.phone(150, 560, 190, 360, -5, K3.ecranQuizC(BOUT, ch))
          var ang = 720 * F.easeOut(F.prog(lt, 0.3, 2.0))
          g += F.phone(345, 590, 190, 360, 5, K3.ecranRoue(BOUT, ang))
          return g
        }
      },
      { // Les lots
        bg: P.menthe, mots: ['SES LOTS,', 'SES OBJECTIFS.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt), y0 = F._basSous + 50
          g += K3.lot(30, y0, 420, 'Écouler un stock', 'Un bouquet de saison offert', 'fleur', pop(lt, 0.5))
          g += K3.lot(30, y0 + 116, 420, 'Lancer une nouveauté', 'La composition du mois', 'cadeau', pop(lt, 1.1))
          g += K3.lot(30, y0 + 232, 420, 'Remise après achat', '-10 % dès 20 € d’achat', 'remise', pop(lt, 1.7))
          return g
        }
      },
      { // Dimanche
        bg: P.ciel, mots: ['DIMANCHE.', 'TIRAGE EN', 'UN CLIC.'], max: 96, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var e = lt < 1.2 ? 0 : lt < 2.3 ? 1 : 2
          g += F.phone(240, F._basSous + 240, 220, 410, 0, K3.ecranTirage(e, 'Bouquet de saison'))
          if (e === 2) g += F.flash(240, 560, lt, 2.3, 2)
          return g
        }
      },
      { // Le gagnant revient
        bg: P.beurre, mots: ['UN FLASH =', 'UN NOUVEAU', 'CLIENT.'], max: 100, from: [240, 620],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var pin = pop(lt, 0.1, 0.7)
          g += K3.op(pin, F.phone(130 - 30 * (1 - pin), 600, 160, 300, -6, K3.ecranBilletQR('Bouquet de saison', BOUT, 'Grand jeu')))
          g += F.flash(130, 590, lt, 1.0, 2)
          var e = lt < 1.4 ? 1 : 2
          g += F.phone(340, 590, 200, 370, 4, K3.ecranRetrait(e, 4, BOUT, 'Bouquet de saison'))
          if (e === 2) g += F.flash(340, 560, lt, 1.4, 2)
          return g
        }
      },
      { // Le bilan
        bg: P.lilas, mots: ['ELLE SAIT CE', 'QUI MARCHE.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 270, 250, 460, 0, K3.ecranTrafic(F.easeOut(F.prog(lt, 0.4, 2.2))))
          return g
        }
      },
      { // La relance
        bg: P.menthe, mots: ['ELLE RELANCE', 'SES CLIENTS.'], from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var sel = F.prog(lt, 0.6, 1.2), env = F.prog(lt, 2.1, 0.2)
          g += F.phone(240, F._basSous + 270, 250, 460, 0, K3.ecranCRM(sel, env))
          return g
        }
      },
      { // Animation = visibilité
        bg: P.rose, mots: ['ANIMATION', '= COMMUNICATION', '= VISIBILITÉ.'], y0: 200, from: [240, 480],
        draw: function (lt) {
          var g = F.mots(['ANIMATION'], lt, INK, undefined, 200, 110)
          var y1 = F._basMots
          if (lt > 0.8) g += F.mots(['= COMMUNICATION'], lt - 0.8, INK, undefined, y1 + 20, 110)
          var y2 = y1 + 20 + 70
          if (lt > 1.6) g += F.mots(['= VISIBILITÉ.'], lt - 1.6, C.mag, undefined, y2 + 20, 110)
          g += F.flash(240, 700, lt, 2.0, 3)
          return g
        }
      },
      { // Fin
        bg: P.menthe, from: [240, 480],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Et vous ?', 'Installez Flowin.']) }
      }
    ]
  })
})()
