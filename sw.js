/* LEINAF-PRO v2.0 — service worker
   Guarda una copia de la app en el teléfono para que abra sin señal.
   Solo almacena los archivos de la app; nunca toca ni envía los datos del inventario. */
const CACHE = 'leinaf-pro-v2.0.1';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('leinaf-pro-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la copia guardada (abre al instante y sin señal); si hay señal, se actualiza en segundo plano.
// Solo la raíz de la app se sirve como index.html; cualquier otra página (por ejemplo una consola) se pide tal cual.
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  const scope = new URL(self.registration.scope).pathname;
  const isApp = url.pathname === scope || url.pathname === scope + 'index.html';
  if (req.mode === 'navigate' && !isApp) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const key = isApp ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    const update = fetch(req).then(res => { if (res && res.ok) cache.put(key, res.clone()); return res; }).catch(() => null);
    return cached || (await update) || new Response('Sin conexión', { status: 503 });
  }));
});
