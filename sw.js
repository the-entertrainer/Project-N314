const CACHE_NAME = 'niftyintel-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './css/output.css',
  './js/app.js',
  './js/auth.js',
  './js/state.js',
  './js/data/nifty500.js',
  './js/data/lotSizes.js',
  './js/engines/mathEngine.js',
  './js/engines/scoringEngine.js',
  './js/engines/rationaleEngine.js',
  './js/engines/fnoEngine.js',
  './js/engines/niftyEngine.js',
  './js/fetchers/yahooFetcher.js',
  './js/fetchers/geminiFetcher.js',
  './js/fetchers/fnoFetcher.js',
  './js/sections/screenerSection.js',
  './js/sections/longTermSection.js',
  './js/sections/postMarketSection.js',
  './js/sections/strategySection.js',
  './js/sections/fnoSection.js',
  './js/sections/watchlistSection.js',
  './js/ui/uiManager.js',
  './js/ui/tableRenderer.js',
  './js/ui/chartRenderer.js',
  './js/ui/excelExporter.js',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(e => console.warn('SW cache partial:', e)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Network-first for API calls
  if (url.hostname.includes('yahoo') || url.hostname.includes('googleapis') || url.hostname.includes('corsproxy')) {
    event.respondWith(
      fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return response;
      });
    })
  );
});
