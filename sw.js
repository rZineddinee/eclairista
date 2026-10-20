// Éclairista app: works offline after the first visit.
// Bump VERSION whenever you change the site so phones download the new files.
var VERSION = 'eclairista-v6';
var CORE = [
  './', './index.html', './nosotros.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './icons/favicon-32.png',
  './images/boite.jpg', './images/cafe.jpg', './images/pantone.jpg', './images/trio.jpg',
  './images/p-caramel.jpg', './images/p-citron.jpg', './images/p-ferrero.jpg', './images/p-fraise.jpg',
  './images/p-nutella.jpg', './images/p-pistache.jpg', './images/p-raffaello.jpg', './images/p-snickers.jpg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  // Pages: try the network first so customers see the latest menu, fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
    }));
    return;
  }
  // Photos, icons, fonts, 3D library: serve the saved copy instantly, refresh it in the background.
  e.respondWith(caches.match(req).then(function (cached) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return cached; });
    return cached || net;
  }));
});
