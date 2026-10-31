/* s9 — « Votre animation en quelques étapes » (tuto pro, 30 s).
   Écrans calqués sur le parcours de création unique
   (components/creation/ParcoursCreation.tsx, branche feat/parcours-creation-unique) :
   Que voulez-vous faire ? → 1 Votre animation → 2 Jeu → 3 Lots → 4 Diffusion & QR. */
(function () {
  var F = window.FH, K = window.KH, K3 = window.K3, C = F.C, INK = C.ink, P = K3.P
  var pop = K3.pop

  window.SCENARIO = K3.film('s9', {
    scenes: [
      { // Accroche
        bg: P.ciel, mots: ['VOTRE ANIMATION', 'EN QUELQUES', 'ÉTAPES.'], max: 104,
        draw: function (lt, img0) {
          var g = K3.titre(this, lt, img0)
          g += F.phone(240, F._basSous + 240, 230, 430, 0, K3.ecranChoix(img0 ? 0 : F.prog(lt, 2.2, 0.4)))
          return g
        }
      },
      { // Le jeu
        bg: P.menthe, mots: ['CHOISISSEZ', 'VOTRE JEU.'], from: [240, 560],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          var sel = lt < 1.2 ? -1 : lt < 1.9 ? 1 : lt < 2.6 ? 2 : 0
          g += F.phone(240, F._basSous + 260, 240, 450, 0, K3.ecranJeu(sel))
          return g
        }
      },
      { // Les lots
        bg: P.beurre, mots: ['AJOUTEZ', 'VOS LOTS.'], max: 120, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt)
          g += F.phone(240, F._basSous + 260, 240, 450, 0, K3.ecranLots(F.prog(lt, 0.4, 3.2)))
          return g
        }
      },
      { // Le QR
        bg: P.lilas, mots: ['VOTRE QR ET', 'VOS AFFICHES', 'SONT PRÊTS.'], max: 104, from: [240, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), y = F._basSous + 240
          g += F.phone(175, y, 220, 410, -3, K3.ecranQRs(F.prog(lt, 0.4, 1.6)))
          var pa = pop(lt, 2.2, 0.5)
          g += K3.op(pa, K3.affiche(375, y + 20 + 40 * (1 - pa), 150, 5))
          g += K3.op(pa, '<text class="safe" x="375" y="' + (y + 160) + '" text-anchor="middle" font-family="Manrope" font-weight="800" font-size="22" fill="' + INK + '">Affiche A4</text>')
          g += F.flash(375, y + 20, lt, 2.4, 2)
          return g
        }
      },
      { // Collez
        bg: P.rose, mots: ['COLLEZ.', 'C’EST PARTI.'], from: [375, 600],
        draw: function (lt) {
          var g = K3.titre(this, lt), top = F._basSous + 60
          g += K3.vitrine(40, top, 300, 320, { nom: 'VOTRE BOUTIQUE', icone: 'boutique', col: C.gold })
          var pa = pop(lt, 0.3, 0.6)
          g += K3.op(pa, K3.affiche(40 + 300 * 0.33, top + 320 * 0.64 - 40 * (1 - pa), 110, -2))
          var x = 640 - 230 * F.easeOut(F.prog(lt, 1.3, 1.2))
          g += K3.perso(x, 760, 1.25, { tel: lt > 2.7 })
          if (lt > 2.7) g += F.flash(x + 60, 610, lt, 2.8, 3)
          return g
        }
      },
      { // Fin
        bg: P.menthe, from: [240, 560],
        draw: function (lt, img0) { return K3.fin(lt, img0, ['Flowin.', 'Plug & Play.']) }
      }
    ]
  })
})()
