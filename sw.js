/* E-Rank Quest service worker: makes the app work offline.
   After changing any file, bump VERSION so phones fetch the new copy. */
const VERSION = 'erank-v1.0.0';
const SHELL = ['./', 'index.html', 'css/app.css', 'js/app.js', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
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
  // Google Fonts: serve from cache, refresh in the background
  if (url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com')) {
    e.respondWith(caches.open(VERSION + '-fonts').then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin !== location.origin) return;
  // App files: cache first, fall back to network, then to the cached home page
  e.respondWith(caches.match(req, { ignoreSearch: true })
    .then(hit => hit || fetch(req).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); return r;
    }))
    .catch(() => caches.match('index.html')));
});
