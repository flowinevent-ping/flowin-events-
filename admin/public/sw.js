/* Flowin NDS — service worker CHIRURGICAL.
   Dormant tant qu'aucune page ne l'enregistre (voir ENABLE_SW dans NDS2026Client.tsx).
   Principe zéro-risque :
   - cache UNIQUEMENT l'immuable (/_next/static/*, hashé) + les médias statiques (logos, polices, images) ;
   - HTML / navigations => réseau natif (jamais servir une app périmée) ;
   - Supabase / cross-origin => jamais intercepté ;
   - écritures (POST) => jamais touchées.
   KILL-SWITCH : passer KILL=true (puis déployer) => le SW se désinstalle seul et vide ses caches. */
const CACHE = 'flowin-nds-v1';
const KILL = false;

self.addEventListener('install', () => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    if (KILL) {
      try { await self.registration.unregister(); } catch (_) {}
      try { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); } catch (_) {}
      try { const cs = await self.clients.matchAll(); cs.forEach((c) => c.navigate(c.url)); } catch (_) {}
      return;
    }
    try { const ks = await caches.keys(); await Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))); } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

function isCacheableAsset(url) {
  if (url.origin !== self.location.origin) return false;
  if (url.pathname.startsWith('/_next/static/')) return true;
  return /\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|ttf|otf|css|js)$/i.test(url.pathname);
}

self.addEventListener('fetch', (e) => {
  if (KILL) return;
  const req = e.request;
  if (req.method !== 'GET') return;                 // jamais les écritures
  let url;
  try { url = new URL(req.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;  // jamais Supabase / cross-origin
  if (req.mode === 'navigate') return;              // HTML : réseau natif, jamais de version périmée servie
  if (!isCacheableAsset(url)) return;
  // stale-while-revalidate sur l'immuable + médias
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (res && res.status === 200) { cache.put(req, res.clone()).catch(() => {}); }
      return res;
    }).catch(() => cached);
    return cached || network;
  })());
});
