/* ARETE service worker: makes the app work offline.
   After changing any file, bump VERSION so phones fetch the new copy.
   Update flow: a new version installs in the background and waits. The page
   shows "New version available"; tapping it sends SKIP_WAITING, the new worker
   takes over and the page reloads once. */
const VERSION = 'arete-v8.5.0';
const SHELL = ['./', 'index.html', 'css/app.css', 'css/hud.css', 'css/arete.css', 'js/hud.js', 'fonts/chakra-petch-latin-500-normal.woff2', 'fonts/chakra-petch-latin-600-normal.woff2', 'fonts/chakra-petch-latin-700-normal.woff2', 'fonts/barlow-latin-400-normal.woff2', 'fonts/barlow-latin-500-normal.woff2', 'fonts/barlow-latin-600-normal.woff2', 'js/figures.js', 'js/exercises.js', 'js/program.js', 'js/diet.js', 'js/foods_mh.js', 'js/foods_indb.js', 'js/foods.js', 'js/mind.js', 'js/wealth.js', 'js/mission.js', 'js/codex.js', 'js/app.js', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/favicon.svg'];

// Cache each file on its own so one missing file can't block an update.
// cache:'reload' skips the browser's HTTP cache, so the new version never
// stores stale copies of the old files.
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u =>
    fetch(new Request(u, { cache: 'reload' }))
      .then(r => { if (r.ok) return c.put(u, r); })
      .catch(() => {}))))
    // Pages from before v7.1 have no update banner, so take over at once
    // when upgrading from an old 'hunter-' cache. Later updates wait for a tap.
    .then(() => caches.keys())
    .then(keys => { if (!keys.some(k => k.startsWith('arete-') && k !== VERSION)) return self.skipWaiting(); }));
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // App files: cache first, fall back to network, then to the cached home page
  e.respondWith(caches.match(req, { ignoreSearch: true })
    .then(hit => hit || fetch(req).then(r => {
      if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return r;
    }))
    .catch(() => caches.match('index.html')));
});

// Tapping a reminder notification opens the app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) { if ('focus' in c) return c.focus(); }
    return self.clients.openWindow('./');
  }));
});
