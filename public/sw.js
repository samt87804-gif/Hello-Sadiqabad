const CACHE_NAME = 'hs-sadiqabad-shell-v3';
const OFFLINE_URL = '/offline.html';

// Only cache the offline fallback. HTML and hashed JS/CSS assets must always
// be requested from the current deployment to avoid stale chunk references.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.add(OFFLINE_URL))
      .catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Never intercept Vite's fingerprinted assets, API calls, or function calls.
  if (
    url.pathname.startsWith('/assets/') ||
    url.hostname.endsWith('.supabase.co') ||
    url.pathname.startsWith('/functions/')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store' }).catch(async () => {
        return (await caches.match(OFFLINE_URL)) || Response.error();
      })
    );
  }
});
