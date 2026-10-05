/* Dhikr Garden Grower — service worker.
   Caches the app shell with relative URLs so the app works from any subpath
   (e.g. https://user.github.io/repo/). Scope is the worker's own directory. */
'use strict';

var CACHE = 'dhikr-garden-v1';
var SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'content/data.js',
  'manifest.webmanifest',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      // addAll is all-or-nothing per batch; add individually so one missing
      // file (e.g. content/data.js not yet written) can't fail the install.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () { /* tolerate missing */ });
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE) return caches.delete(k);
        return null;
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // cache-first for same-origin requests only (fonts stay network)
  if (url.origin !== self.location.origin) return;
  event.respondWith(
    caches.match(req, { ignoreSearch: false }).then(function (hit) {
      if (hit) return hit;
      return fetch(req).then(function (res) {
        // opportunistically cache successful same-origin GETs
        if (res && res.ok) {
          var copy = res.clone();
          caches.open(CACHE).then(function (cache) { cache.put(req, copy); }).catch(function () {});
        }
        return res;
      }).catch(function () {
        // offline + not cached: fall back to the shell for navigations
        if (req.mode === 'navigate') return caches.match('index.html');
        return new Response('', { status: 504, statusText: 'offline' });
      });
    })
  );
});
