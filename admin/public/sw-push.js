/* Flowin : service worker des RAPPELS (Web Push) du joueur, 24/11/2026.
   Volontairement séparé de /sw.js (cache des médias) : ici AUCUN cache, AUCUN fetch intercepté,
   donc aucun effet sur l'affichage des pages. Il ne fait que deux choses :
   1. afficher la notification reçue (titre et texte courts, sans donnée sensible) ;
   2. au clic, ouvrir /moi (ou la page indiquée, toujours sur ce site). */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = {}; }
  var titre = d.titre || 'Flowin';
  var opts = {
    body: d.corps || 'Ouvre Flowin pour voir ton lot.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: d.tag || 'flowin-rappel',
    data: { url: d.url || '/moi' },
  };
  e.waitUntil(self.registration.showNotification(titre, opts));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var cible = '/moi';
  try {
    var u = new URL((e.notification.data && e.notification.data.url) || '/moi', self.location.origin);
    if (u.origin === self.location.origin) cible = u.pathname + u.search;
  } catch (_) { /* reste sur /moi */ }
  e.waitUntil((async function () {
    var liste = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (var i = 0; i < liste.length; i++) {
      var c = liste[i];
      if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) {
        try { await c.navigate(cible); } catch (_) { /* */ }
        return c.focus();
      }
    }
    return self.clients.openWindow(cible);
  })());
});
