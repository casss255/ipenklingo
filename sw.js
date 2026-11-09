// Ganti angka versi ini setiap kali index.html diubah agar HP mengambil versi baru.
const VERSION = 'lingo-v4';
// Several apps share this origin (casss255.github.io), so only touch caches that belong to this one.
const PREFIX = 'lingo-';
const SHELL = [
  './', './index.html', './style.css', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png',
  './util.js', './icons.js', './courses-en.js', './courses-zh.js', './courses.js', './judge.js', './lesson.js',
  './state.js', './speech.js', './views.js', './app.js',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' }))))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Halaman: coba internet dulu (supaya update langsung masuk), kalau offline pakai cache.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy)); return res;
    }).catch(() => caches.match('./index.html', { cacheName: VERSION })));
    return;
  }
  // Font Google dan file lain: pakai cache dulu, simpan saat pertama kali diambil.
  if (url.origin === location.origin || url.host.endsWith('googleapis.com') || url.host.endsWith('gstatic.com')) {
    e.respondWith(caches.match(req, { cacheName: VERSION }).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
      return res;
    })));
  }
});
