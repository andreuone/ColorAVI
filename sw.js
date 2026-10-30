// Offline support: use the network when available (so updates show up right away),
// fall back to the cached copy when offline or the network is too slow.
// Bump CACHE when the file list changes so old copies are dropped.
const CACHE = 'colorear-v14';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
const TIMEOUT_MS = 3000;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const fresh = fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok) cache.put(e.request, res.clone());
      return res;
    });
    const timeout = new Promise((_, rej) => setTimeout(rej, TIMEOUT_MS));
    try {
      return await Promise.race([fresh, timeout]);
    } catch {
      return (await cache.match(e.request, { ignoreSearch: true })) || fresh;
    }
  }));
});
