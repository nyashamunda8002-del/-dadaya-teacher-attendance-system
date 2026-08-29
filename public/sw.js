const CACHE_NAME = 'dadaya-attendance-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  '/icon.svg',
  '/dadaya-crest.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-caching assets error:', err);
      });
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (event) => {
  // Pass non-GET and API requests directly to network
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || fetchPromise;
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

// Handle direct message from client app to show notification through Service Worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Dadaya High School Attendance', {
        body: options?.body || 'Attendance notice',
        icon: options?.icon || '/pwa-192x192.png',
        badge: options?.badge || '/pwa-192x192.png',
        vibrate: options?.vibrate || [200, 100, 200, 100, 200],
        tag: options?.tag || `dadaya-${Date.now()}`,
        data: options?.data || { url: '/' },
        renotify: true,
        requireInteraction: false,
        actions: options?.actions || [
          { action: 'open', title: 'Open App' }
        ],
      })
    );
  }
});

// Handle Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'New Dadaya High School notification',
        icon: data.icon || '/pwa-192x192.png',
        badge: data.badge || '/pwa-192x192.png',
        vibrate: data.vibrate || [200, 100, 200, 100, 200],
        data: data.data || { url: '/' },
        tag: data.tag || `dadaya-push-${Date.now()}`,
        renotify: true,
        actions: [
          { action: 'open', title: 'Open App' }
        ],
      };
      event.waitUntil(self.registration.showNotification(data.title || 'Dadaya Attendance', options));
    } catch {
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('Dadaya Attendance', {
          body: text,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
          vibrate: [200, 100, 200],
          tag: `dadaya-push-${Date.now()}`,
          renotify: true,
        })
      );
    }
  }
});
