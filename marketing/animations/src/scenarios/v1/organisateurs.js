/* Video « Organisateurs » : Hugo cree et pilote la Fete du Lac. */
(function () {
  var D = window.DECOR, E = window.ECRANS, SC = window.SCENE.ecran, S = window.STORY
  window.SCENARIO = {
    id: 'organisateurs', titre: 'Flowin — Organisateurs', accent: '#2563EB',
    end: { accroche: ['Animez votre lieu,', 'créez du lien.'], scan: 'Scannez pour créer votre compte pro', url: 'flowin-events.vercel.app/pro/inscription' },
    scenes: [
      { id: 'hugo', label: 'Hugo', dur: 3.9, caption: ['Hugo organise la Fête du Lac', 'avec les commerçants de Belrive.'], draw: function (g, t) { D.bureau(g, t) } },
      { id: 'nouvelle', label: 'Nouvelle opération', dur: 3.9, caption: ['Dans son espace pro :', '« Créer un super event ».'], draw: SC('pro', E.nouvelleOp, 'hugo') },
      { id: 'creer', label: 'Le super event', dur: 3.9, caption: ['Un même jeu et un tirage', 'au sort pour toute la fête.'], draw: SC('pro', E.creerSE, 'hugo') },
      { id: 'stations', label: 'Les stations', dur: 3.9, caption: ['Les commerçants de Belrive', 'deviennent des stations de jeu.'], draw: function (g, t) { D.fete(g, t, { autres: true }) } },
      { id: 'direct', label: 'Suivi en direct', dur: 3.9, caption: ['Pendant la fête, il suit', 'les parties en direct.'], draw: SC('pro', E.mesOps, 'hugo') },
      { id: 'tirage', label: 'Le tirage', dur: 3.9, caption: ['Dimanche soir, il lance', 'le tirage au sort.'], draw: SC('pro', E.tirage, 'hugo') },
      { id: 'envoi', label: 'Le billet', dur: 3.9, caption: ['Le billet du gagnant', 'part par email.'], draw: SC('pro', E.envoi, 'hugo', { happy: true }) },
      { id: 'crm', label: 'Les résultats', dur: 3.9, caption: ['Après la fête, il garde', 'ses contacts et ses chiffres.'], draw: SC('pro', E.crm, 'hugo', { happy: true }) },
      { id: 'fin', label: 'Fin', dur: 4.3, draw: function (g, t) { D.fin(g, t, window.SCENARIO) } }
    ]
  }
})()
