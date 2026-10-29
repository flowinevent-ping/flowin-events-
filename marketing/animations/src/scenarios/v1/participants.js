/* Video « Participants » : Aminata joue a la Fete du Lac. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'participants', titre: 'Flowin — Participants', accent: '#E0218A',
    end: { accroche: ['Jouez gratuitement,', 'sans achat obligatoire.'], scan: 'Scannez pour essayer le jeu', url: 'flowin-events.vercel.app/parcours/quiz' },
    scenes: [
      { id: 'scan', label: 'Le QR de la station', dur: 4.1, caption: ['À la Fête du Lac, Aminata', 'flashe le QR d’une station.'], draw: function (g, t) { D.fete(g, t) } },
      { id: 'accueil', label: 'Le jeu s’ouvre', dur: 4.1, caption: ['Rien à installer : le jeu', 's’ouvre dans le navigateur.'], draw: SC('jeu', E.accueil, 'aminata') },
      { id: 'question', label: 'Le quiz', dur: 4.1, caption: ['Cinq questions,', 'une réponse à la fois.'], draw: SC('jeu', E.question, 'aminata') },
      { id: 'score', label: 'Le score', dur: 4.1, caption: ['Sans faute : son ticket', 'pour le tirage est acquis.'], draw: SC('jeu', E.score, 'aminata', { happy: true }) },
      { id: 'compte', label: 'Le compte', dur: 4.1, caption: ['Elle crée son compte une fois.', 'Ses données ne sont pas vendues.'], draw: SC('jeu', E.compte, 'aminata') },
      { id: 'billet', label: 'Le ticket', dur: 4.1, caption: ['Son ticket : ' + S.ticket + '.', 'Tirage dimanche 14 juin.'], draw: SC('jeu', E.billet, 'aminata', { happy: true }) },
      { id: 'partenaires', label: 'Les partenaires', dur: 4.1, caption: ['Elle découvre les commerces', 'partenaires de la fête.'], draw: SC('jeu', E.partenaires, 'aminata') },
      { id: 'retrait', label: 'Le lot', dur: 4.1, caption: ['Tirée au sort, elle retire', 'son bon d’achat chez Mei.'], draw: function (g, t) { D.boutique(g, t, { retrait: true }) } },
      { id: 'fin', label: 'Fin', dur: 4.3, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
