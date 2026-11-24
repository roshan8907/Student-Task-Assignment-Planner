const STATIC_CACHE = 'student-planner-static-v3';
const DYNAMIC_CACHE = 'student-planner-dynamic-v3';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
];

// Install Event: Pre-cache static application shell resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate Event: Clean up outdated caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

/**
 * Fetch Event: Multi-Strategy Caching Architecture
 *
 * 1. Network First (No Cache Storage) for Private Student Data (/api):
 *    All private academic mutations and student queries are processed via network.
 *    Client-side offline storage is exclusively managed by IndexedDB to guarantee
 *    strict multi-tenant isolation and prevent cross-user data leakage.
 *
 * 2. Cache First for Core App Shell & Static Assets:
 *    Images, icons, manifests, and static shell files are served from Cache Storage.
 *
 * 3. Stale While Revalidate for Built Frontend Bundles (assets/*.js, assets/*.css):
 *    Serves cached version immediately for instant render while fetching the latest
 *    build in the background and updating the dynamic cache.
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Strategy 1: Network Only for authenticated private API requests
  if (url.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return;
  }

  // Strategy 3: Stale While Revalidate for dynamic scripts and stylesheets
  if (url.pathname.includes('/assets/') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
    event.respondWith(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.match(event.request).then((cachedResponse) => {
          const fetchPromise = fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);

          return cachedResponse || fetchPromise;
        });
      })
    );
    return;
  }

  // Strategy 2: Cache First (with Offline Navigation Fallback) for Static Assets & Shell
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback for HTML navigation
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});

// Push Event: Handle incoming Web Push notifications from VAPID backend
self.addEventListener('push', (event) => {
  let data = {
    title: 'Student Planner Notification',
    body: 'You have upcoming assignment deadlines or study tasks!',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: '/' },
  };

  if (event.data) {
    try {
      data = Object.assign(data, event.data.json());
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon.svg',
    badge: data.badge || '/icon.svg',
    vibrate: [100, 50, 100],
    data: data.data || { url: '/' },
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification Click: Focus existing window or open app to target deep-link
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.indexOf(targetUrl) !== -1 && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
