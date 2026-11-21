/* V3 · Organisateurs · coupe reseaux sociaux 15 s (Hugo). Deroule resume
   en 4 etapes : demande + creation par Flowin, stations, direct, contacts. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran
  window.SCENARIO = {
    id: 'organisateurs-15', titre: 'Flowin — Organisateurs (15 s)', accent: '#1D4ED8', steps: 4,
    end: { mode: 'social', accroche: ['Un super event', 'pour votre ville.'], cta: 'Créez votre compte pro', url: 'flowin-events.vercel.app' },
    scenes: [
      { id: 'hook', label: 'Accroche', dur: 1.5, draw: D.hook([[0, '#1D4ED8'], [1, '#0EA5E9']], ['163 contacts', 'récoltés en', 'un week-end.'], 0, D.visuelContacts, 'SUPER EVENT') },
      { id: 'demande', label: '1. La demande', dur: 2.5, step: 1, caption: ['Hugo demande, Flowin', 'crée le super event.'], draw: SC('pro', E.queFaire, 'hugo', { k: 1.2 }) },
      { id: 'stations', label: '2. Les stations', dur: 2.5, step: 2, caption: ['Chaque commerce', 'devient une station.'], draw: function (g, t) { D.fete(g, t, { autres: true, k: 1.4 }) } },
      { id: 'direct', label: '3. En direct', dur: 2.5, step: 3, caption: ['En direct :', '214 parties mesurées.'], draw: SC('pro', E.mesOps, 'hugo', { k: 1.8 }) },
      { id: 'crm', label: '4. Les contacts', dur: 2.5, step: 4, caption: ['Après le tirage :', '163 contacts gardés.'], draw: SC('pro', E.crm, 'hugo', { happy: true, k: 1.6 }) },
      { id: 'fin', label: 'Fin', dur: 3.5, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
