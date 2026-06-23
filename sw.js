const CACHE_PREFIX = 'origin-retail';
const CACHE_VERSION = 'v2';
const STATIC_CACHE = `${CACHE_PREFIX}-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `${CACHE_PREFIX}-dynamic-${CACHE_VERSION}`;
const API_CACHE = `${CACHE_PREFIX}-api-${CACHE_VERSION}`;

// Fichiers à mettre en cache immédiatement à l'installation
const PRECACHE_ASSETS = [
  '/app.html',
  '/offline.html',
  '/assets/app.css',
  '/assets/app.js',
  '/assets/lib/chart.umd.min.js',
  '/assets/lib/fontawesome-all.min.css',
  '/assets/lib/google-fonts-inter.css',
  '/manifest.json'
];

// Extensions statiques → CacheFirst
const STATIC_EXTENSIONS = /\.(css|js|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|ico|webp|avif)$/i;

// === INSTALL : pré-cache des assets essentiels ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url)
        )
      );
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// === ACTIVATE : nettoyage des anciens caches ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      const validPrefixes = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE];
      return Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && !validPrefixes.includes(key))
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// === FETCH : stratégies de cache intelligentes ===
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non GET
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // === Stratégie 1 : API → NetworkFirst avec fallback cache ===
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithCache(request, API_CACHE));
    return;
  }

  // === Stratégie 2 : Assets statiques → CacheFirst (CSS, JS, fonts, images) ===
  if (STATIC_EXTENSIONS.test(url.pathname) || url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
    return;
  }

  // === Stratégie 3 : Navigation HTML → NetworkFirst avec offline page ===
  if (request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    event.respondWith(networkFirstWithOffline(request, DYNAMIC_CACHE));
    return;
  }

  // === Stratégie 4 : Tout le reste → NetworkFirst ===
  event.respondWith(networkFirstWithCache(request, DYNAMIC_CACHE));
});

// ═══ STRATÉGIES ═══

// CacheFirst : sert le cache d'abord, met à jour en arrière-plan
async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    // Mise à jour silencieuse en arrière-plan
    fetch(request).then((response) => {
      if (response.ok) {
        caches.open(cacheName).then((cache) => cache.put(request, response.clone()));
      }
    }).catch(() => {});
    return cached;
  }
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(request, clone);
    }
    return response;
  } catch {
    return new Response('', { status: 503, statusText: 'Service Unavailable' });
  }
}

// NetworkFirst : tente le réseau, fallback sur cache
async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response(JSON.stringify({ ok: false, offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// NetworkFirst pour navigation : fallback sur /offline.html
async function networkFirstWithOffline(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(cacheName);
      await cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

// === SYNC : synchronisation en arrière-plan ===
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-erp-data') {
    event.waitUntil(syncErpData());
  }
});

async function syncErpData() {
  try {
    const clients = await self.clients.matchAll({ type: 'window' });
    clients.forEach(client => {
      client.postMessage({ type: 'SYNC_TRIGGERED', timestamp: Date.now() });
    });
  } catch (err) {
    console.warn('[SW] Sync error:', err.message);
  }
}

// === PUSH NOTIFICATIONS (préparé pour le futur - nécessite icônes PNG réelles) ===
/*
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'Nouvelle notification Origin Retail',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url || '/app.html' },
    tag: data.tag || 'origin-retail',
    renotify: true
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Origin Retail OS', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/app.html';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      const existingClient = windowClients.find((c) => c.url.includes(url));
      if (existingClient) return existingClient.focus();
      return clients.openWindow(url);
    })
  );
});
*/
