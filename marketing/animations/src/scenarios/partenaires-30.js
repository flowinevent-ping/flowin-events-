/* V3 · Commercants · coupe explicative 30 s. Les legendes parlent au
   commercant (« vous », « votre boutique ») ; Sophie n est que l image.
   Deroule complet : inscription en 4 etapes (commerce, contact, lot,
   validation Flowin), QR en boutique, les clients jouent, chiffres,
   contacts, retrait du lot en caisse. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'partenaires-30', titre: 'Flowin — Commerçants (30 s)', accent: '#E85D04', steps: 8,
    end: { mode: 'qr', accroche: ['Animez votre boutique,', 'captez de nouveaux', 'clients.'], scan: 'Scannez : devenir partenaire', url: 'flowin-events.vercel.app/pro/inscription' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 2.0, draw: D.hook([[0, '#C2410C'], [1, '#FF8A14']], ['Fini la carte', 'de fidélité', 'papier.'], 0, D.visuelCarte, 'COMMERÇANTS') },
      { id: 'rejoindre', label: '1. Inscription', dur: 3.0, step: 1, caption: ['Inscrivez votre', 'boutique en 4 étapes.'], draw: SC('rj', E.rejoindre, 'sophie', { scroll: 30 }) },
      { id: 'lot', label: '2. Votre lot', dur: 3.0, step: 2, caption: ['Vous offrez un lot :', 'bon d’achat de 20 €.'], draw: SC('rj', E.lot, 'sophie', { k: 1.3 }) },
      { id: 'demande', label: '3. Validation', dur: 3.0, step: 3, caption: ['Validé sous 24–48 h :', 'votre QR à afficher.'], draw: SC('rj', E.demande, 'sophie', { happy: true, scroll: 36 }) },
      { id: 'fete', label: '4. La station', dur: 3.0, step: 4, caption: ['Votre boutique devient', 'une station de jeu.'], draw: function (g, t) { D.fete(g, t, { k: 1.15 }) } },
      { id: 'vitrine', label: '5. Vos clients jouent', dur: 3.0, step: 5, caption: ['Vos clients jouent', 'et vous découvrent.'], draw: SC('jeu', E.partenaires, 'julie') },
      { id: 'bilan', label: '6. Vos chiffres', dur: 3.0, step: 6, caption: ['Vos chiffres : ' + S.stJoueurs, 'joueurs, ' + S.stFlashs + ' flashs.'], draw: SC('pro', E.bilan, 'sophie', { happy: true, scroll: 30, k: 1.4 }) },
      { id: 'crm', label: '7. Vos contacts', dur: 3.0, step: 7, caption: [S.stJoueurs + ' contacts clients,', 'avec leur accord.'], draw: SC('pro', E.crm, 'sophie', { happy: true, k: 1.2, args: { n: S.stJoueurs, sous: 'joueurs de votre boutique' } }) },
      { id: 'caisse', label: '8. Le retrait', dur: 3.0, step: 8, caption: ['Le gagnant du tirage', 'vient chez vous.'], draw: SC('pro', E.validation, 'sophie', { happy: true, scroll: 50, k: 1.5 }) },
      { id: 'fin', label: 'Fin', dur: 4.0, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
