const CACHE_NAME = 'n314-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/app.js',
  './js/auth.js',
  './js/apiFetcher.js',
  './js/mathEngine.js',
  './js/aiController.js',
  './js/uiManager.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (
    event.request.url.includes('alphavantage.co') ||
    event.request.url.includes('generativelanguage.googleapis.com')
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Network error', { status: 503 });
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
