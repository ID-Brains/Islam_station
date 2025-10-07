// Minimal service worker for Islam Station
// Generated to satisfy registration and provide a basic offline fallback.

const CACHE_NAME = 'islam-station-static-v1';
const OFFLINE_URL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        OFFLINE_URL,
      ]).catch(() => {/* ignore */});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Optionally cache GET requests for same-origin
        if (event.request.method === 'GET' && response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(OFFLINE_URL)))
  );
});
