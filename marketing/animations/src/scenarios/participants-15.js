/* V3 · Participants · coupe reseaux sociaux 15 s (Julie). Deroule resume
   en 4 etapes : flasher, jouer, ticket, lot. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran
  window.SCENARIO = {
    id: 'participants-15', titre: 'Flowin — Participants (15 s)', accent: '#E0218A', steps: 4,
    end: { mode: 'social', accroche: ['Joue chez tes', 'commerçants.'], cta: 'Cherche le QR Flowin', url: 'flowin-events.vercel.app', cta1: '#7C2D92', cta2: '#E0218A' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 1.5, draw: D.hook([[0, '#7C2D92'], [1, '#E0218A']], ['Un bon d’achat', 'à gagner en', '5 questions.'], 2, D.visuelBon, 'JEU GRATUIT') },
      { id: 'scan', label: '1. Le QR', dur: 2.5, step: 1, caption: ['Flashe le QR', 'chez ton commerçant.'], draw: function (g, t) { D.fete(g, t, { k: 1.4 }) } },
      { id: 'question', label: '2. Le quiz', dur: 2.5, step: 2, caption: ['Joue : 5 questions,', 'gratuit, sans appli.'], draw: SC('jeu', E.question, 'julie', { k: 1.3 }) },
      { id: 'billet', label: '3. Le ticket', dur: 2.5, step: 3, caption: ['Inscris-toi : ton', 'ticket pour le tirage.'], draw: SC('jeu', E.billet, 'julie', { happy: true, scroll: 40 }) },
      { id: 'retrait', label: '4. Le lot', dur: 2.5, step: 4, caption: ['Julie, tirée au sort,', 'retire ses 20 €.'], draw: function (g, t) { D.boutique(g, t, { retrait: true, k: 1.3 }) } },
      { id: 'fin', label: 'Fin', dur: 3.5, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
