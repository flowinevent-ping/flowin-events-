/* V3 · Participants · coupe explicative 30 s (Julie). Deroule complet du
   parcours Quiz : QR, accueil, 5 questions, score, inscription, ticket,
   tirage, retrait du lot en boutique. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'participants-30', titre: 'Flowin — Participants (30 s)', accent: '#E0218A', steps: 8,
    end: { mode: 'qr', accroche: ['Joue chez tes', 'commerçants.'], scan: 'Scanne pour essayer le jeu', url: 'flowin-events.vercel.app' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 2.0, draw: D.hook([[0, '#7C2D92'], [1, '#E0218A']], ['Un bon d’achat', 'à gagner en', '5 questions.'], 2, D.visuelBon, 'JEU GRATUIT') },
      { id: 'scan', label: '1. Le QR', dur: 3.0, step: 1, caption: ['Flashe le QR', 'chez ton commerçant.'], draw: function (g, t) { D.fete(g, t, { k: 1.15 }) } },
      { id: 'accueil', label: '2. L’accueil', dur: 3.0, step: 2, caption: ['Les lots, les règles :', 'gratuit, sans appli.'], draw: SC('jeu', E.accueil, 'julie', { scroll: 0, scrollTo: 130, scrollAt: 1.3 }) },
      { id: 'question', label: '3. Le quiz', dur: 3.0, step: 3, caption: ['5 questions,', 'une à la fois.'], draw: SC('jeu', E.question, 'julie', { k: 1.1 }) },
      { id: 'score', label: '4. Le score', dur: 3.0, step: 4, caption: ['5/5 : sans faute,', 'ton ticket est acquis.'], draw: SC('jeu', E.score, 'julie', { happy: true }) },
      { id: 'compte', label: '5. L’inscription', dur: 3.0, step: 5, caption: ['Inscris-toi pour', 'recevoir ton ticket.'], draw: SC('jeu', E.compte, 'julie', { k: 1.2 }) },
      { id: 'billet', label: '6. Le ticket', dur: 3.0, step: 6, caption: ['Ticket ' + S.ticket + ',', 'tirage dimanche.'], draw: SC('jeu', E.billet, 'julie', { happy: true, scroll: 40 }) },
      { id: 'tirage', label: '7. Le tirage', dur: 3.0, step: 7, caption: ['Tirage au sort :', 'Julie gagne !'], draw: SC('pro', E.tirage, 'julie', { happy: true, k: 1.4 }) },
      { id: 'retrait', label: '8. Le lot', dur: 3.0, step: 8, caption: ['Elle retire ses 20 €', 'chez le commerçant.'], draw: function (g, t) { D.boutique(g, t, { retrait: true, k: 1.1 }) } },
      { id: 'fin', label: 'Fin', dur: 4.0, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
