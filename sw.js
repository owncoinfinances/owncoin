/* OWNCOIN · service worker
   - La app (index.html) se pide primero a la red, para recibir siempre la versión más nueva;
     sin conexión se usa la copia guardada.
   - Librerías y tipografías se guardan al primer uso y luego se sirven al instante.
   - Nunca se guarda nada de api.github.com: tus datos no pasan por esta caché. */
const CACHE = 'owncoin-8.2';
const CORE = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'api.github.com') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); }
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  const cacheable = url.origin === self.location.origin ||
    /(^|\.)cdnjs\.cloudflare\.com$/.test(url.hostname) || /^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
