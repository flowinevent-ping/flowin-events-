/* V2 · Partenaires · coupe reseaux sociaux 15 s (Mei). */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'partenaires-15', titre: 'Flowin — Partenaires (15 s)', accent: '#E85D04',
    end: { mode: 'social', accroche: ['Animez votre boutique,', 'captez de nouveaux', 'clients.'], cta: 'Devenez partenaire', url: 'flowin-events.vercel.app', cta1: '#C2410C', cta2: '#FF8A14' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 2.0, draw: D.hook([[0, '#C2410C'], [1, '#FF8A14']], ['Fini la carte', 'de fidélité', 'papier.'], 0, D.visuelCarte, 'COMMERÇANTS') },
      { id: 'rejoindre', label: 'Rejoindre', dur: 2.5, caption: ['Mei rejoint le super', 'event en 4 étapes.'], draw: SC('rj', E.rejoindre, 'mei', { scroll: 30 }) },
      { id: 'lot', label: 'Son lot', dur: 2.5, caption: ['Elle offre un bon', 'd’achat de 20 €.'], draw: SC('rj', E.lot, 'mei', { k: 1.6 }) },
      { id: 'fete', label: 'Les joueurs', dur: 2.5, caption: ['Les joueurs flashent', 'le QR de sa boutique.'], draw: function (g, t) { D.fete(g, t, { k: 1.4 }) } },
      { id: 'bilan', label: 'Ses chiffres', dur: 2.5, caption: [S.stJoueurs + ' joueurs, ' + S.stFlashs + ' flashs', 'de son QR.'], draw: SC('pro', E.bilan, 'mei', { happy: true, scroll: 30, k: 1.8 }) },
      { id: 'fin', label: 'Fin', dur: 3.0, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
