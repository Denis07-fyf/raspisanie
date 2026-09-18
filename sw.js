const CACHE_NAME = 'raspisanie-v5-gaps';
const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './assets/index-BzV3BJk3.js',
  './assets/index-DWRmhtTD.css',
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Запросы к Supabase не проводим через офлайн-кэш приложения.
  if (url.origin !== self.location.origin) return;

  const updateCache = fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      void caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  });

  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('./index.html').then(cached => {
        if (cached) {
          event.waitUntil(updateCache.catch(() => undefined));
          return cached;
        }
        return updateCache.catch(() => caches.match('./index.html'));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        event.waitUntil(updateCache.catch(() => undefined));
        return cached;
      }
      return updateCache;
    })
  );
});
