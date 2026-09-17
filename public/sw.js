// Dadaya High School Staff Clocking System - Offline-First Service Worker
const CACHE_NAME = 'dadaya-staff-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon.svg',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/dadaya-crest.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

// Precache critical shell assets on install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use allSettled so external or transient assets don't fail the whole cache
      await Promise.allSettled(
        STATIC_ASSETS.map(async (url) => {
          try {
            const response = await fetch(url, { cache: 'reload' });
            if (response.status === 200 || response.type === 'opaque') {
              await cache.put(url, response);
            }
          } catch (e) {
            console.warn('Precache skip for:', url, e);
          }
        })
      );
    })
  );
  self.skipWaiting();
});

// Clean up previous cache generations on activate & claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Interceptor: Full Offline-First Architecture
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignore non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Pass API requests directly to network (AppContext handles offline fallback with localStorage)
  if (request.url.includes('/api/')) {
    return;
  }

  // 1. Navigation Requests (e.g. visiting / or /?view=home or refreshing the page)
  // Network first with instant fallback to cached /index.html
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Device is offline: Serve cached single-page application shell
          const cachedIndex =
            (await caches.match('/index.html')) ||
            (await caches.match('/')) ||
            (await caches.match(request, { ignoreSearch: true }));

          if (cachedIndex) {
            return cachedIndex;
          }

          // Fallback if not found
          return new Response(
            '<!doctype html><html><head><meta charset="utf-8"><title>Dadaya Staff Clocking</title></head><body style="font-family:sans-serif;text-align:center;padding:2rem;"><h2>Dadaya High Staff Clocking</h2><p>Offline mode is loading...</p><button onclick="location.reload()">Reload</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Static Assets (Scripts, CSS, Images, Fonts, Leaflet tiles/scripts)
  // Strategy: Stale-While-Revalidate / Cache-First
  event.respondWith(
    caches.match(request, { ignoreSearch: false }).then(async (cachedResponse) => {
      // If found in cache, return immediately (fast & works 100% offline!)
      if (cachedResponse) {
        // In background, refresh cache from network if online
        fetch(request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              (networkResponse.status === 200 || networkResponse.type === 'opaque')
            ) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
          })
          .catch(() => {
            // Offline - ignore background refresh error
          });

        return cachedResponse;
      }

      // If not in cache, fetch from network
      try {
        const networkResponse = await fetch(request);
        if (
          networkResponse &&
          (networkResponse.status === 200 || networkResponse.type === 'opaque')
        ) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      } catch (fetchErr) {
        // Network failed & not in exact cache: try matching ignoring query params
        const looseMatch = await caches.match(request, { ignoreSearch: true });
        if (looseMatch) {
          return looseMatch;
        }

        // If it was a script or HTML request, fallback to /index.html
        if (request.destination === 'script' || request.destination === 'style') {
          const fallback = await caches.match(request.url.split('?')[0]);
          if (fallback) return fallback;
        }

        // Return a clean error or empty response
        return new Response('', { status: 408, statusText: 'Offline' });
      }
    })
  );
});

// Handle Phone Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle Push Notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'New Dadaya High School notification',
        icon: data.icon || '/pwa-192x192.png',
        badge: data.badge || '/pwa-192x192.png',
        vibrate: [200, 100, 200],
        data: data.data || { url: '/' },
      };
      event.waitUntil(
        self.registration.showNotification(
          data.title || 'Dadaya Staff Clocking',
          options
        )
      );
    } catch {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('Dadaya Staff Clocking', {
          body: text,
          icon: '/pwa-192x192.png',
        })
      );
    }
  }
});
