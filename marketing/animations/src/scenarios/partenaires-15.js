/* V3 · Commercants · coupe reseaux sociaux 15 s. Les legendes parlent au
   commercant (« vous », « votre boutique ») ; Sophie n est que l image.
   Deroule resume en 4 etapes : inscription + lot, station, chiffres, contacts. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'partenaires-15', titre: 'Flowin — Commerçants (15 s)', accent: '#E85D04', steps: 4,
    end: { mode: 'social', accroche: ['Animez votre boutique,', 'captez de nouveaux', 'clients.'], cta: 'Devenez partenaire', url: 'flowin-events.vercel.app', cta1: '#C2410C', cta2: '#FF8A14' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 1.5, draw: D.hook([[0, '#C2410C'], [1, '#FF8A14']], ['Fini la carte', 'de fidélité', 'papier.'], 0, D.visuelCarte, 'COMMERÇANTS') },
      { id: 'lot', label: '1. Inscription', dur: 2.5, step: 1, caption: ['Inscrivez-vous et', 'offrez un lot.'], draw: SC('rj', E.lot, 'sophie', { k: 1.6 }) },
      { id: 'fete', label: '2. La station', dur: 2.5, step: 2, caption: ['Votre boutique devient', 'une station de jeu.'], draw: function (g, t) { D.fete(g, t, { k: 1.4 }) } },
      { id: 'bilan', label: '3. Vos chiffres', dur: 2.5, step: 3, caption: ['Vos chiffres : ' + S.stJoueurs, 'joueurs, ' + S.stFlashs + ' flashs.'], draw: SC('pro', E.bilan, 'sophie', { happy: true, scroll: 30, k: 1.8 }) },
      { id: 'crm', label: '4. Vos contacts', dur: 2.5, step: 4, caption: [S.stJoueurs + ' contacts clients,', 'avec leur accord.'], draw: SC('pro', E.crm, 'sophie', { happy: true, k: 1.6, args: { n: S.stJoueurs, sous: 'joueurs de votre boutique' } }) },
      { id: 'fin', label: 'Fin', dur: 3.5, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
