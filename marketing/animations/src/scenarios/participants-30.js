/* V2 · Participants · coupe explicative 30 s (Aminata). */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'participants-30', titre: 'Flowin — Participants (30 s)', accent: '#E0218A',
    end: { mode: 'qr', accroche: ['Joue chez tes', 'commerçants.'], scan: 'Scanne pour essayer le jeu', url: 'flowin-events.vercel.app' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 3.0, draw: D.hook([[0, '#7C2D92'], [1, '#E0218A']], ['Un bon d’achat', 'à gagner en', '5 questions.'], 2, D.visuelBon, 'JEU GRATUIT') },
      { id: 'scan', label: 'Le QR', dur: 3.2, caption: ['Aminata flashe le QR', 'd’une station.'], draw: function (g, t) { D.fete(g, t, { k: 1.1 }) } },
      { id: 'accueil', label: 'Gratuit', dur: 3.2, caption: ['Le jeu s’ouvre :', 'gratuit, sans appli.'], draw: SC('jeu', E.accueil, 'aminata', { scroll: 130 }) },
      { id: 'question', label: 'Le quiz', dur: 3.2, caption: ['5 questions,', 'une à la fois.'], draw: SC('jeu', E.question, 'aminata') },
      { id: 'score', label: 'Le score', dur: 3.2, caption: ['Sans faute :', 'son ticket est acquis.'], draw: SC('jeu', E.score, 'aminata', { happy: true }) },
      { id: 'billet', label: 'Le ticket', dur: 3.2, caption: ['Ticket ' + S.ticket, 'Tirage dimanche.'], draw: SC('jeu', E.billet, 'aminata', { happy: true, scroll: 40 }) },
      { id: 'partenaires', label: 'Les commerces', dur: 3.2, caption: ['Elle découvre les', 'commerces partenaires.'], draw: SC('jeu', E.partenaires, 'aminata') },
      { id: 'retrait', label: 'Le lot', dur: 3.2, caption: ['Tirée au sort, elle', 'gagne 20 € chez Mei.'], draw: function (g, t) { D.boutique(g, t, { retrait: true }) } },
      { id: 'fin', label: 'Fin', dur: 4.6, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
