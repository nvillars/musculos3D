// Service Worker for Anatomical 3D Viewer
// Production-ready offline functionality and intelligent caching

const VERSION = '1.0.0';
const CACHE_NAME = `anatomical-viewer-v${VERSION}`;
const STATIC_CACHE_NAME = `anatomical-static-v${VERSION}`;
const DYNAMIC_CACHE_NAME = `anatomical-dynamic-v${VERSION}`;
const API_CACHE_NAME = `anatomical-api-v${VERSION}`;
const MODELS_CACHE_NAME = `anatomical-models-v${VERSION}`;


/** ---- Added constants for cache aging/limits ---- */
const MAX_CACHE_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const MAX_STATIC_CACHE_SIZE = 100;             // cap static cache entries
const MAX_DYNAMIC_CACHE_SIZE = 200;            // cap dynamic cache entries

// Files to cache immediately (critical resources)
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Critical resources that should be cached on install
const CRITICAL_RESOURCES = [
  // Will be populated dynamically with webpack-generated assets
];

// Runtime cache configurations
const CACHE_STRATEGIES = {
  static: {
    strategy: 'CacheFirst',
    maxAge: 365 * 24 * 60 * 60, // 1 year
    maxEntries: 100
  },
  dynamic: {
    strategy: 'StaleWhileRevalidate',
    maxAge: 7 * 24 * 60 * 60, // 1 week
    maxEntries: 200
  },
  api: {
    strategy: 'NetworkFirst',
    maxAge: 5 * 60, // 5 minutes
    maxEntries: 50,
    networkTimeout: 3000
  },
  models: {
    strategy: 'CacheFirst',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    maxEntries: 50
  }
};

// Files to cache on demand (non-critical resources)
const DYNAMIC_CACHE_PATTERNS = [
  /\/assets\//,
  /\/models\//,
  /\/textures\//,
  /\.glb$/,
  /\.gltf$/,
  /\.jpg$/,
  /\.png$/,
  /\.webp$/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\//,
  /\/proxy\//
];

// Cache size limits and performance settings
const CACHE_LIMITS = {
  static: { maxEntries: 100, maxAgeSeconds: 365 * 24 * 60 * 60 },
  dynamic: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
  api: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
  models: { maxEntries: 50, maxAgeSeconds: 30 * 24 * 60 * 60 }
};

// Performance monitoring
const PERFORMANCE_METRICS = {
  cacheHits: 0,
  cacheMisses: 0,
  networkRequests: 0,
  offlineRequests: 0
};

self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('anatomical-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  
  try {
    // Network-first strategy for API calls
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
        url.pathname.includes('.js') || 
        url.pathname.includes('.css')) {
      return await cacheFirst(request, STATIC_CACHE_NAME);
    }
    
    // Stale-while-revalidate for dynamic content
    if (DYNAMIC_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname))) {
      return await staleWhileRevalidate(request, DYNAMIC_CACHE_NAME);
    }
    
    // Default: network-first with cache fallback
    return await networkFirst(request);
    
  } catch (error) {
    console.error('Fetch handler error:', error);
    
    // Try to serve from cache as last resort
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await caches.match('/offline.html') || 
             new Response('Offline - Please check your connection', {
               status: 503,
               statusText: 'Service Unavailable'
             });
    }
    
    throw error;
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await putWithTimestamp(cache, request, networkResponse);
      await limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function cacheFirst(request, cacheName = STATIC_CACHE_NAME) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    if (cachedResponse.type === 'opaque') {
      return cachedResponse;
    }
    const ts = Number(cachedResponse.headers.get('sw-cached-at') || 0);
    if (ts && (Date.now() - ts) < MAX_CACHE_AGE) {
      return cachedResponse;
    }
    // else: stale, continue to network
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await putWithTimestamp(cache, request, networkResponse);
      await limitCacheSize(cacheName, MAX_STATIC_CACHE_SIZE);
    }
    return networkResponse;
  } catch (error) {
    if (cachedResponse) return cachedResponse;
    throw error;
  }
}

async function staleWhileRevalidate(request, cacheName = DYNAMIC_CACHE_NAME) {
  const cachedResponse = await caches.match(request);

  const networkPromise = fetch(request).then(async networkResponse => {
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      await putWithTimestamp(cache, request, networkResponse);
      await limitCacheSize(cacheName, MAX_DYNAMIC_CACHE_SIZE);
    }
    return networkResponse;
  }).catch(error => {
    console.warn('Background fetch failed:', error);
  });

  if (cachedResponse) {
    return cachedResponse;
  }

  return await networkPromise;
}


/** Stamp responses with a timestamp header so we can compute freshness. */
async function putWithTimestamp(cache, request, response) {
  try {
    const headers = new Headers(response.headers);
    headers.set('sw-cached-at', String(Date.now()));
    const body = await response.clone().blob();
    const cached = new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
    await cache.put(request, cached);
  } catch (e) {
    // Fallback: if cloning fails for some reason, put original response
    await cache.put(request, response);
  }
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxSize) {
    // Remove oldest entries
    const keysToDelete = keys.slice(0, keys.length - maxSize);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Handle background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  // For example, sync cached user actions when back online
  console.log('Background sync triggered');
}

// Handle push notifications (if needed in future)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      }
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Provide cache statistics for debugging
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    clearAllCaches().then(success => {
      event.ports[0].postMessage({ success });
    });
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      count: keys.length,
      urls: keys.map(key => key.url)
    };
  }
  
  return stats;
}

async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    return true;
  } catch (error) {
    console.error('Failed to clear caches:', error);
    return false;
  }
}