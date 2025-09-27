// ---- version & cache names ----
// We derive CACHE_NAME at install time from /version.txt so each release gets a fresh cache.
const CACHE_NAME_BASE = 'et-static-images';
let RUNTIME_CACHE_NAME = `${CACHE_NAME_BASE}-dev`; // default until we learn real version

// Resolve runtime cache name from /version.txt (no-store to avoid SW caching loops)
async function resolveRuntimeCacheName() {
  try {
    const resp = await fetch('/version.txt', { cache: 'no-store' });
    if (!resp.ok) throw new Error('version fetch failed');
    const verRaw = (await resp.text()).trim();
    const ver = verRaw.replace(/[^a-zA-Z0-9._-]/g, '') || 'dev';
    return `${CACHE_NAME_BASE}-${ver}`;
  } catch {
    return `${CACHE_NAME_BASE}-dev`;
  }
}

// NOTE: Do NOT precache '/' (HTML shell). Allow it to come from the network so the app updates without clearing cookies/cache.
const PRECACHE_URLS = [
  '/favicon.ico',
];

// ---- SW lifecycle: skip waiting & claim ----
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    RUNTIME_CACHE_NAME = await resolveRuntimeCacheName();
    const cache = await caches.open(RUNTIME_CACHE_NAME);
    try { await cache.addAll(PRECACHE_URLS); } catch { }
    // Activate new SW immediately to prevent "stuck old version" issues
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    // Ensure RUNTIME_CACHE_NAME is resolved in case of fresh activation reload
    if (!RUNTIME_CACHE_NAME || RUNTIME_CACHE_NAME === `${CACHE_NAME_BASE}-dev`) {
      RUNTIME_CACHE_NAME = await resolveRuntimeCacheName();
    }
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => {
      const isOurCache = k.startsWith(CACHE_NAME_BASE + '-');
      if (isOurCache && k !== RUNTIME_CACHE_NAME) {
        return caches.delete(k);
      }
      return Promise.resolve();
    }));
    await self.clients.claim();
    // Inform any open pages that a new version is active (optional UI hook)
    const clientsList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const client of clientsList) {
      client.postMessage({ type: 'SW_ACTIVATED', cache: RUNTIME_CACHE_NAME });
    }
  })());
});

// ---- Runtime caching for images in /public ----
// Strategy: cache-first for same-origin images (fast offline), then fall back to network.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Never cache navigations/HTML; always let them go to network
  const accept = req.headers.get('accept') || '';
  const isNavigate = req.mode === 'navigate' || accept.includes('text/html');
  if (isNavigate) return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Cache only same-origin images (things under /images, /icons, etc. served from /public)
  const isImage = req.destination === 'image'
    || url.pathname.startsWith('/images/')
    || url.pathname.startsWith('/icons/');

  if (sameOrigin && isImage) {
    event.respondWith(
      caches.open(RUNTIME_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(req, { ignoreVary: true });
        if (cached) return cached;
        try {
          const resp = await fetch(req, { cache: 'no-cache' });
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }
  // Otherwise, fall through to network
});