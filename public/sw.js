/**
 * SkyStage PWA Service Worker
 * Comprehensive offline functionality for the drone show platform
 */

const CACHE_NAME = 'skystage-v1.2.0';
const OFFLINE_URL = '/offline.html';

// Critical resources to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/assets/logos/skystage-logo.svg',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  '/assets/icons/apple-touch-icon.png'
];

// Dynamic cache strategies
const CACHE_STRATEGIES = {
  // Cache first for static assets
  CACHE_FIRST: [
    /\.(?:css|js|png|jpg|jpeg|svg|webp|gif|ico|woff|woff2|ttf|otf)$/,
    /\/assets\//,
    /\/formations\/thumbnails\//,
    /\/formations\/videos\//
  ],

  // Network first for API calls and dynamic content
  NETWORK_FIRST: [
    /\/api\//,
    /\/admin/,
    /\/discover/,
    /\/help/
  ],

  // Stale while revalidate for pages
  STALE_WHILE_REVALIDATE: [
    /\/$/,
    /\/book-show/,
    /\/show-builder/,
    /\/login/,
    /\/signup/
  ]
};

// Formation data cache
const FORMATION_CACHE = 'formations-data-v1';
const API_CACHE = 'api-cache-v1';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    (async () => {
      try {
        // Open cache and add static resources
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Caching static resources...');

        // Cache critical resources
        await cache.addAll(STATIC_CACHE_URLS);

        // Skip waiting to activate immediately
        self.skipWaiting();
        console.log('[SW] Service worker installed successfully');
      } catch (error) {
        console.error('[SW] Installation failed:', error);
      }
    })()
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(cacheName =>
              cacheName.startsWith('skystage-') &&
              cacheName !== CACHE_NAME &&
              cacheName !== FORMATION_CACHE &&
              cacheName !== API_CACHE
            )
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );

        // Take control of all pages
        await self.clients.claim();
        console.log('[SW] Service worker activated');
      } catch (error) {
        console.error('[SW] Activation failed:', error);
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except for known CDNs)
  if (url.origin !== self.location.origin && !isTrustedOrigin(url.origin)) {
    return;
  }

  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Special handling for formation data API
    if (pathname.startsWith('/api/formations')) {
      return handleFormationAPI(request);
    }

    // Special handling for admin dashboard API
    if (pathname.startsWith('/api/admin/dashboard')) {
      return handleAdminAPI(request);
    }

    // Apply cache strategy based on URL pattern
    if (matchesPatterns(pathname, CACHE_STRATEGIES.CACHE_FIRST)) {
      return cacheFirst(request);
    }

    if (matchesPatterns(pathname, CACHE_STRATEGIES.NETWORK_FIRST)) {
      return networkFirst(request);
    }

    if (matchesPatterns(pathname, CACHE_STRATEGIES.STALE_WHILE_REVALIDATE)) {
      return staleWhileRevalidate(request);
    }

    // Default to network first
    return networkFirst(request);

  } catch (error) {
    console.error('[SW] Fetch error:', error);
    return handleOfflineResponse(request);
  }
}

// Cache-first strategy (for static assets)
async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    return handleOfflineResponse(request);
  }
}

// Network-first strategy (for API calls)
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // Cache successful API responses
    if (networkResponse.status === 200 && request.url.includes('/api/')) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache for API calls
    if (request.url.includes('/api/')) {
      const cache = await caches.open(API_CACHE);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    return handleOfflineResponse(request);
  }
}

// Stale-while-revalidate strategy (for pages)
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Always try to fetch from network in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.status === 200) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => null);

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }

  // Otherwise wait for network
  try {
    return await fetchPromise || handleOfflineResponse(request);
  } catch (error) {
    return handleOfflineResponse(request);
  }
}

// Special handling for formation data
async function handleFormationAPI(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.status === 200) {
      // Cache formation data with special TTL
      const cache = await caches.open(FORMATION_CACHE);
      const response = networkResponse.clone();

      // Add timestamp to cached response
      const responseWithTimestamp = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...response.headers,
          'sw-cached-at': Date.now().toString()
        }
      });

      cache.put(request, responseWithTimestamp);
    }

    return networkResponse;
  } catch (error) {
    // Return cached formation data if network fails
    const cache = await caches.open(FORMATION_CACHE);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline formation data
    return new Response(JSON.stringify({
      success: true,
      data: [],
      offline: true,
      message: 'Offline mode - Limited formation data available'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Special handling for admin API
async function handleAdminAPI(request) {
  try {
    return await fetch(request);
  } catch (error) {
    // Return mock admin data when offline
    return new Response(JSON.stringify({
      success: true,
      data: {
        overview: {
          total_users: 12,
          total_organizations: 3,
          total_formations: 74,
          total_bookings: 8,
          total_sync_jobs: 2
        },
        users: {
          total: 12,
          new_this_week: 3,
          new_this_month: 8,
          by_type: [
            { user_type: 'customer', count: 6 },
            { user_type: 'operator', count: 4 },
            { user_type: 'admin', count: 2 }
          ]
        },
        formations: {
          total: 74,
          by_category: [
            { category: 'Wedding', count: 25 },
            { category: 'Epic', count: 20 },
            { category: 'Christmas', count: 15 }
          ],
          most_popular: [
            { id: '1', name: 'Beating Heart', downloads: 4792, rating: 4.8 }
          ]
        },
        bookings: {
          total: 8,
          pending: 3,
          by_status: [
            { status: 'pending', count: 3 },
            { status: 'confirmed', count: 4 }
          ]
        },
        activity: {
          recent_events: [],
          daily_active_users: 28
        },
        offline: true
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handle offline responses
async function handleOfflineResponse(request) {
  const url = new URL(request.url);

  // For navigation requests, return offline page
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAME);
    const offlineResponse = await cache.match(OFFLINE_URL);
    return offlineResponse || new Response('Offline', { status: 503 });
  }

  // For API requests, return appropriate offline response
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Network unavailable',
      offline: true,
      message: 'This feature requires an internet connection'
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // For assets, return a placeholder or cached version
  return new Response('Resource unavailable offline', { status: 503 });
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);

  if (event.tag === 'formation-sync') {
    event.waitUntil(syncFormations());
  }

  if (event.tag === 'user-actions') {
    event.waitUntil(syncUserActions());
  }
});

async function syncFormations() {
  try {
    console.log('[SW] Syncing cached formation data...');
    // Implement formation sync logic
    // This would sync any cached formation actions when back online
  } catch (error) {
    console.error('[SW] Formation sync failed:', error);
  }
}

async function syncUserActions() {
  try {
    console.log('[SW] Syncing user actions...');
    // Implement user action sync logic
    // This would sync bookings, favorites, etc. when back online
  } catch (error) {
    console.error('[SW] User action sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');

  const options = {
    body: 'New formations available in SkyStage!',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore',
        icon: '/assets/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/assets/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SkyStage Update', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');

  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/discover')
    );
  }
});

// Utility functions
function matchesPatterns(pathname, patterns) {
  return patterns.some(pattern => {
    if (pattern instanceof RegExp) {
      return pattern.test(pathname);
    }
    return pathname.includes(pattern);
  });
}

function isTrustedOrigin(origin) {
  const trustedOrigins = [
    'https://www.skystage.com',
    'https://cdnjs.cloudflare.com',
    'https://cdn.jsdelivr.net'
  ];
  return trustedOrigins.includes(origin);
}

console.log('[SW] Service worker script loaded');
