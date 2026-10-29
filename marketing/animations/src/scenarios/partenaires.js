/* Video « Partenaires » : Mei, boulangere, devient station de la fete. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'partenaires', titre: 'Flowin — Partenaires', accent: '#E85D04',
    end: { accroche: ['Animez votre boutique,', 'captez de nouveaux clients.'], scan: 'Scannez pour devenir partenaire', url: 'flowin-events.vercel.app/pro/inscription' },
    scenes: [
      { id: 'mei', label: 'Mei', dur: 3.9, caption: ['Mei tient la Boulangerie', 'Les Tilleuls, à Belrive.'], draw: function (g, t) { D.boutique(g, t, { enseigne: true }) } },
      { id: 'rejoindre', label: 'Rejoindre', dur: 3.9, caption: ['Elle rejoint la Fête du Lac', 'en 4 étapes.'], draw: SC('rj', E.rejoindre, 'mei') },
      { id: 'lot', label: 'Son offre', dur: 3.9, caption: ['Son offre : un bon d’achat', 'de 20 € pour le tirage.'], draw: SC('rj', E.lot, 'mei') },
      { id: 'demande', label: 'Validation', dur: 3.9, caption: ['Sa demande part chez Flowin,', 'validée sous 24 à 48 h.'], draw: SC('rj', E.demande, 'mei', { happy: true }) },
      { id: 'fete', label: 'La fête', dur: 3.9, caption: ['Pendant la fête, les joueurs', 'flashent le QR de sa station.'], draw: function (g, t) { D.fete(g, t) } },
      { id: 'vitrine', label: 'Nos partenaires', dur: 3.9, caption: ['Sa boutique apparaît dans', '« Nos partenaires ».'], draw: SC('jeu', E.partenaires, 'aminata') },
      { id: 'bilan', label: 'Ses chiffres', dur: 3.9, caption: ['Elle mesure sa station :', S.stFlashs + ' flashs QR, ' + S.stParties + ' parties.'], draw: SC('pro', E.bilan, 'mei', { happy: true }) },
      { id: 'caisse', label: 'Le retrait', dur: 3.9, caption: ['Aminata, tirée au sort, retire', 'son lot : billet validé en caisse.'], draw: SC('pro', E.validation, 'mei', { happy: true }) },
      { id: 'fin', label: 'Fin', dur: 4.3, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
