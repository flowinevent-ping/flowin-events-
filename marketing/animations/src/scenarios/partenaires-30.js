/* V2 · Partenaires · coupe explicative 30 s (Mei). */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'partenaires-30', titre: 'Flowin — Partenaires (30 s)', accent: '#E85D04',
    end: { mode: 'qr', accroche: ['Animez votre boutique,', 'captez de nouveaux', 'clients.'], scan: 'Scannez : devenir partenaire', url: 'flowin-events.vercel.app/pro/inscription' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 3.0, draw: D.hook([[0, '#C2410C'], [1, '#FF8A14']], ['Fini la carte', 'de fidélité', 'papier.'], 0, D.visuelCarte, 'COMMERÇANTS') },
      { id: 'rejoindre', label: 'Rejoindre', dur: 3.2, caption: ['Mei rejoint le super', 'event en 4 étapes.'], draw: SC('rj', E.rejoindre, 'mei', { scroll: 30 }) },
      { id: 'lot', label: 'Son lot', dur: 3.2, caption: ['Elle offre un bon', 'd’achat de 20 €.'], draw: SC('rj', E.lot, 'mei', { k: 1.2 }) },
      { id: 'demande', label: 'Validation', dur: 3.2, caption: ['Validée par Flowin', 'sous 24 à 48 h.'], draw: SC('rj', E.demande, 'mei', { happy: true, scroll: 20 }) },
      { id: 'fete', label: 'Les joueurs', dur: 3.2, caption: ['Les joueurs flashent', 'le QR de sa boutique.'], draw: function (g, t) { D.fete(g, t, { k: 1.1 }) } },
      { id: 'vitrine', label: 'Nos partenaires', dur: 3.2, caption: ['Sa boutique dans', '« Nos partenaires ».'], draw: SC('jeu', E.partenaires, 'aminata') },
      { id: 'bilan', label: 'Ses chiffres', dur: 3.2, caption: [S.stJoueurs + ' joueurs, ' + S.stFlashs + ' flashs', 'de son QR.'], draw: SC('pro', E.bilan, 'mei', { happy: true, scroll: 30, k: 1.3 }) },
      { id: 'caisse', label: 'Le retrait', dur: 3.2, caption: ['Lot retiré chez Mei :', 'billet validé.'], draw: SC('pro', E.validation, 'mei', { happy: true, scroll: 50, k: 1.4 }) },
      { id: 'fin', label: 'Fin', dur: 4.6, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
