// webapp/src/frontend/public/service-worker.ts

const CACHE_NAME = 'multi-go-app-cache-v1';
const ASSET_CACHE_NAME = 'multi-go-app-assets-cache-v1'; // Separate cache for assets

// List of essential URLs for the app shell
const appShellUrls = [
  '/',
  '/index.html',
  '/vite.svg', // Example from Vite default
];

// List of common static assets to cache
const staticAssetUrls = [
  '/assets/index.css', // Example CSS
  '/assets/App.css',   // Example CSS
  // Add common font paths
  '/@fontsource/roboto/300.css',
  '/@fontsource/roboto/400.css',
  '/@fontsource/roboto/500.css',
  '/@fontsource/roboto/700.css',
  '/@fontsource/roboto/300.woff2',
  '/@fontsource/roboto/400.woff2',
  '/@fontsource/roboto/500.woff2',
  '/@fontsource/roboto/700.woff2',
  // Add other essential static assets (e.g., icons, images) here
  // '/icons/icon-192x192.png',
  // '/icons/icon-512x512.png',
];

// Combine all URLs to be cached during installation
const allUrlsToCache = [...appShellUrls, ...staticAssetUrls];


self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell...');
      return cache.addAll(allUrlsToCache);
    }).then(() => {
      console.log('[Service Worker] App shell and static assets cached.');
      // You might want to explicitly cache the manifest here if it's not part of allUrlsToCache
      // return caches.open(CACHE_NAME).then(cache => cache.add('/manifest.webmanifest'));
    })
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Ensure the service worker controls the client immediately
  // This might not be needed if `skipWaiting()` is handled elsewhere or not desired.
  // return self.clients.claim();
});

self.addEventListener('fetch', (event: FetchEvent) => {
  // For navigation requests (HTML, main page), use cache-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match(event.request).then(response => {
        // Try to serve from cache first
        return response || fetch(event.request).then(networkResponse => {
          // If not in cache, fetch from network and cache the response
          // Important: Do not cache responses for failed requests or error pages unless intended
          if (networkResponse.ok) {
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            });
          }
          return networkResponse; // Return the network response even if not cached (e.g., error pages)
        }).catch(error => {
          console.error('[Service Worker] Network request failed:', error);
          // Fallback for network errors
          return caches.match('/offline.html') || new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
    );
  } else if (event.request.method === 'GET') { // For other GET requests (assets, API calls)
    event.respondWith(
      caches.open(ASSET_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('[Service Worker] Cache hit for asset:', event.request.url);
            return cachedResponse;
          }
          // If not in asset cache, try network
          return fetch(event.request).then(networkResponse => {
            // Cache the successful response for future use
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(error => {
            console.error('[Service Worker] Asset fetch failed:', error);
            // Fallback if asset fetch fails (e.g., return a placeholder image or error page)
            return new Response('Asset not found', { status: 404, statusText: 'Not Found' });
          });
        });
      })
    );
  }
  // For non-GET requests (POST, PUT, DELETE, etc.), always go to the network.
  // You might want to implement specific strategies for API calls (e.g., network-first for data).
  // This is handled in the next task.
});

console.log('[Service Worker] Service worker loaded.');

