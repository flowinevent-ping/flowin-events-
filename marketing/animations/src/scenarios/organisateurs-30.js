/* V3 · Organisateurs · coupe explicative 30 s (Hugo). Deroule complet :
   demande a Flowin, creation par Flowin, stations, direct, tirage, billet,
   contacts. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran
  window.SCENARIO = {
    id: 'organisateurs-30', titre: 'Flowin — Organisateurs (30 s)', accent: '#1D4ED8', steps: 7,
    end: { mode: 'qr', accroche: ['Un super event', 'pour votre ville.'], scan: 'Scannez : compte pro', url: 'flowin-events.vercel.app/pro/inscription' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 2.0, draw: D.hook([[0, '#1D4ED8'], [1, '#0EA5E9']], ['163 contacts', 'récoltés en', 'un week-end.'], 0, D.visuelContacts, 'SUPER EVENT') },
      { id: 'demande', label: '1. La demande', dur: 3.4, step: 1, caption: ['Hugo demande son', 'super event à Flowin.'], draw: SC('pro', E.queFaire, 'hugo') },
      { id: 'creation', label: '2. Flowin le crée', dur: 3.4, step: 2, caption: ['Flowin le crée :', 'jeu, tirage, QR.'], draw: SC('pro', E.mesOps, 'hugo', { args: { aVenir: true, parties: 0 } }) },
      { id: 'stations', label: '3. Les stations', dur: 3.4, step: 3, caption: ['Chaque commerce', 'devient une station.'], draw: function (g, t) { D.fete(g, t, { autres: true, k: 1.1 }) } },
      { id: 'direct', label: '4. En direct', dur: 3.4, step: 4, caption: ['En direct :', '214 parties mesurées.'], draw: SC('pro', E.mesOps, 'hugo', { k: 1.3 }) },
      { id: 'tirage', label: '5. Le tirage', dur: 3.4, step: 5, caption: ['Dimanche : tirage', 'au sort en un clic.'], draw: SC('pro', E.tirage, 'hugo', { k: 1.5 }) },
      { id: 'envoi', label: '6. Le billet', dur: 3.4, step: 6, caption: ['Le billet part', 'par email au gagnant.'], draw: SC('pro', E.envoi, 'hugo', { happy: true }) },
      { id: 'crm', label: '7. Les contacts', dur: 3.4, step: 7, caption: ['163 contacts gardés,', 'à relancer.'], draw: SC('pro', E.crm, 'hugo', { happy: true, k: 1.2 }) },
      { id: 'fin', label: 'Fin', dur: 4.2, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
