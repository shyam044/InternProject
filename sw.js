const CACHE_NAME = 'document-vault-v2';
const PRECACHE_URLS = [
  '/', 
  '/index.html',
  '/manifest.json',
  '/sw.js',
  '/Screenshot 2025-12-31 022232.png'
  // add any CSS/JS files here if you split them out
];

// Install - cache app shell
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

// Fetch - cache-first for assets, network-first for navigation (so updates show)
self.addEventListener('fetch', event => {
  const request = event.request;

  // navigation requests -> try network then cache fallback (ensures app updates if online)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        // optionally update cache with latest html
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put('/', copy));
        return response;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // For images and other static assets -> cache-first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        // Put a copy in cache
        return caches.open(CACHE_NAME).then(cache => {
          // Avoid caching opaque responses for cross-origin requests
          try { cache.put(request, response.clone()); } catch(e) {}
          return response;
        });
      }).catch(() => {
        // optional: return a fallback image for failed images
        if (request.destination === 'image') {
          return caches.match('/Screenshot 2025-12-31 022232.png');
        }
      });
    })
  );
});