const CACHE_VERSION = 'v1';
const STATIC_CACHE = `docket-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `docket-dynamic-${CACHE_VERSION}`;

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/dashboard',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Routes that should always go network-first (API calls, auth)
const NETWORK_FIRST_PATTERNS = [
  /^\/api\//,
  /clerk/,
  /\.clerk\./,
  /vercel/,
];

// Routes that return HTML pages (stale-while-revalidate)
const HTML_PATTERNS = [
  /\/dashboard/,
  /\/receipts/,
  /\/settings/,
  /\/exports/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Non-fatal: some assets may not be available offline at install time
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin and known CDN requests
  if (url.origin !== location.origin && !url.hostname.includes('vercel')) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Network-first for API and auth routes
  if (NETWORK_FIRST_PATTERNS.some((p) => p.test(url.pathname + url.search))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Stale-while-revalidate for navigations
  if (request.mode === 'navigate' || HTML_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Cache-first for static assets (_next/static, fonts, images)
  if (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.ico') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: network with dynamic cache fallback
  event.respondWith(networkFirst(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || fetchPromise || new Response('Offline — please reconnect', {
    status: 503,
    headers: { 'Content-Type': 'text/plain' },
  });
}
