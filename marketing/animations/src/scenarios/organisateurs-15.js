/* V2 · Organisateurs · coupe reseaux sociaux 15 s (Hugo). Un pro ne cree pas
   de super event : il le demande a Flowin, qui le cree ; les commerces le rejoignent. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran
  window.SCENARIO = {
    id: 'organisateurs-15', titre: 'Flowin — Organisateurs (15 s)', accent: '#2563EB',
    end: { mode: 'social', accroche: ['Un super event', 'pour votre ville.'], cta: 'Créez votre compte pro', url: 'flowin-events.vercel.app' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 2.0, draw: D.hook([[0, '#1D4ED8'], [1, '#0EA5E9']], ['163 contacts', 'récoltés en', 'un week-end.'], 0, D.visuelContacts, 'SUPER EVENT') },
      { id: 'demande', label: 'La demande', dur: 2.5, caption: ['Hugo demande son', 'super event à Flowin.'], draw: SC('pro', E.queFaire, 'hugo') },
      { id: 'stations', label: 'Les stations', dur: 2.5, caption: ['Chaque commerce', 'devient une station.'], draw: function (g, t) { D.fete(g, t, { autres: true, k: 1.4 }) } },
      { id: 'direct', label: 'En direct', dur: 2.5, caption: ['En direct :', '214 parties.'], draw: SC('pro', E.mesOps, 'hugo', { k: 1.8 }) },
      { id: 'crm', label: 'Les contacts', dur: 2.5, caption: ['Après la fête :', '163 contacts gardés.'], draw: SC('pro', E.crm, 'hugo', { happy: true, k: 1.6 }) },
      { id: 'fin', label: 'Fin', dur: 3.0, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
