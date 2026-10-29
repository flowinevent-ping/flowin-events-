/* V2 · Participants · coupe reseaux sociaux 15 s (Aminata). */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran
  window.SCENARIO = {
    id: 'participants-15', titre: 'Flowin — Participants (15 s)', accent: '#E0218A',
    end: { mode: 'social', accroche: ['Joue chez tes', 'commerçants.'], cta: 'Cherche le QR Flowin', url: 'flowin-events.vercel.app', cta1: '#7C2D92', cta2: '#E0218A' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 2.0, draw: D.hook([[0, '#7C2D92'], [1, '#E0218A']], ['Un bon d’achat', 'à gagner en', '5 questions.'], 2, D.visuelBon, 'JEU GRATUIT') },
      { id: 'scan', label: 'Le QR', dur: 2.5, caption: ['Flashe le QR', 'de la station.'], draw: function (g, t) { D.fete(g, t, { k: 1.4 }) } },
      { id: 'accueil', label: 'Gratuit', dur: 2.5, caption: ['Gratuit, sans appli,', 'sans achat.'], draw: SC('jeu', E.accueil, 'aminata', { scroll: 130 }) },
      { id: 'billet', label: 'Le ticket', dur: 2.5, caption: ['5/5 : ton ticket', 'pour le tirage.'], draw: SC('jeu', E.billet, 'aminata', { happy: true, scroll: 40 }) },
      { id: 'retrait', label: 'Le lot', dur: 2.5, caption: ['Tirée au sort, Aminata', 'gagne 20 € chez Mei.'], draw: function (g, t) { D.boutique(g, t, { retrait: true, k: 1.3 }) } },
      { id: 'fin', label: 'Fin', dur: 3.0, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
