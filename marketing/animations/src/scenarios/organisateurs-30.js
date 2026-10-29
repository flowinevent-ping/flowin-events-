/* V2 · Organisateurs · coupe explicative 30 s (Hugo). */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran
  window.SCENARIO = {
    id: 'organisateurs-30', titre: 'Flowin — Organisateurs (30 s)', accent: '#2563EB',
    end: { mode: 'qr', accroche: ['Un super event', 'pour votre ville.'], scan: 'Scannez : compte pro', url: 'flowin-events.vercel.app/pro/inscription' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 3.0, draw: D.hook([[0, '#1D4ED8'], [1, '#0EA5E9']], ['163 contacts', 'récoltés en', 'un week-end.'], 0, D.visuelContacts, 'SUPER EVENT') },
      { id: 'demande', label: 'La demande', dur: 3.2, caption: ['Hugo demande son', 'super event à Flowin.'], draw: SC('pro', E.queFaire, 'hugo') },
      { id: 'creation', label: 'Flowin le crée', dur: 3.2, caption: ['Flowin le crée :', 'un jeu, un tirage.'], draw: SC('pro', E.mesOps, 'hugo', { args: { aVenir: true, parties: 0 } }) },
      { id: 'stations', label: 'Les stations', dur: 3.2, caption: ['Chaque commerce', 'devient une station.'], draw: function (g, t) { D.fete(g, t, { autres: true, k: 1.1 }) } },
      { id: 'direct', label: 'En direct', dur: 3.2, caption: ['En direct :', '214 parties.'], draw: SC('pro', E.mesOps, 'hugo', { k: 1.3 }) },
      { id: 'tirage', label: 'Le tirage', dur: 3.2, caption: ['Dimanche, le tirage', 'au sort en un clic.'], draw: SC('pro', E.tirage, 'hugo', { k: 1.6 }) },
      { id: 'envoi', label: 'Le billet', dur: 3.2, caption: ['Le billet du gagnant', 'part par email.'], draw: SC('pro', E.envoi, 'hugo', { happy: true }) },
      { id: 'crm', label: 'Les contacts', dur: 3.2, caption: ['Après la fête :', '163 contacts gardés.'], draw: SC('pro', E.crm, 'hugo', { happy: true, k: 1.2 }) },
      { id: 'fin', label: 'Fin', dur: 4.6, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
