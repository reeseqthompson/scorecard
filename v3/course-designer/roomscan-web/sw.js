self.addEventListener('install', (e) => {
  e.waitUntil(caches.open('roomscan-web-v1').then(cache => cache.addAll([
    './', './index.html', './style.css', './geometry.js', './export.js', './manifest.webmanifest'
  ])));
});
self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});
