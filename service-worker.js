const CACHE_NAME = 'pcache-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Instalacao e cache inicial
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Ativacao - limpeza de caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

// Fetch - respondendo do cache quando possível (network-first para HTML)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Para navegação (HTML) — network first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(resp => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return resp;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Para outros recursos — cache first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
