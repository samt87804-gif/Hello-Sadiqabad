// v4 is the active shell cache namespace. Older shell caches are retained so
// an already-open tab or a rollback can still use its fingerprinted assets.
const CACHE_NAME = 'hs-sadiqabad-shell-v4';
const MEDIA_CACHE_NAME = 'hs-sadiqabad-public-media-v1';
const SUPABASE_MEDIA_HOST = 'efwohfzqitevkuybnyif.supabase.co';
const SUPABASE_MEDIA_PREFIX = '/storage/v1/object/public/Hello%20Sadiqabad/';
const APP_SHELL_URL = '/';
const OFFLINE_URL = '/offline.html';
const PRECACHE_MANIFEST_URL = '/offline-precache.json';
const PRECACHE_CONCURRENCY = 4;

// Keep the emergency fallback, SPA entry document and fingerprinted route assets
// available. The build generates a manifest from the actual Vite output; this avoids
// guessing chunk names and supports public deep links after the first offline visit.
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(OFFLINE_URL).catch(() => undefined);
    await cache.add(APP_SHELL_URL).catch(() => undefined);

    // Pre-cache every fingerprinted JS/CSS bundle emitted by this build. These are
    // application assets only (not API responses or user data). Failures are
    // best-effort so a constrained device can still install the emergency shell.
    try {
      const manifestResponse = await fetch(PRECACHE_MANIFEST_URL, { cache: 'no-store' });
      if (manifestResponse.ok) {
        await cache.put(PRECACHE_MANIFEST_URL, manifestResponse.clone()).catch(() => undefined);
        const manifest = await manifestResponse.json();
        const assets = Array.isArray(manifest)
          ? manifest.filter((path) => typeof path === 'string' && /^\/assets\/.+-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(path))
          : [];
        for (let index = 0; index < assets.length; index += PRECACHE_CONCURRENCY) {
          const batch = assets.slice(index, index + PRECACHE_CONCURRENCY);
          await Promise.allSettled(batch.map((path) => cache.add(path)));
        }
      }
    } catch {
      // Keep installation resilient; missing chunks will still use normal network fetches.
    }
  })());
  // Deliberately do not call skipWaiting(): an existing tab may still depend
  // on the previous deployment's runtime and hashed chunks.
});

self.addEventListener('activate', (event) => {
  // Deliberately retain older app-shell caches. Deleting them during activation
  // can break a still-open document or a rollback that references old chunks.
  // A later storage-management phase can prune caches after client-use checks.
  event.waitUntil(Promise.resolve());
  // Deliberately do not call clients.claim(): let the new worker take control
  // through the browser's normal navigation lifecycle.
});

function isFingerprintAsset(url, request) {
  if (!url.pathname.startsWith('/assets/')) return false;
  if (request.destination !== 'script' && request.destination !== 'style') return false;
  return /-[A-Za-z0-9_-]{6,}\.(?:js|css)$/.test(url.pathname);
}

async function networkFirstNavigation(request, url) {
  try {
    const response = await fetch(request, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    // An HTTP 5xx means the origin failed, not that the visitor lost internet.
    // Prefer the cached app shell so an online visitor is not told they are offline.
    if (response.status >= 500) {
      try {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(APP_SHELL_URL)) || response;
      } catch {
        return response;
      }
    }
    return response;
  } catch {
    // Show the dedicated offline page only when the network request actually
    // rejects or times out. Other app routes can resolve through the cached shell.
    try {
      const cache = await caches.open(CACHE_NAME);
      if (url.pathname === '/offline' || url.pathname === '/offline/' || url.pathname === OFFLINE_URL) {
        return (await cache.match(OFFLINE_URL)) || Response.error();
      }
      return (await cache.match(APP_SHELL_URL)) ||
        (await cache.match(OFFLINE_URL)) ||
        Response.error();
    } catch {
      return Response.error();
    }
  }
}

async function cachePublicMedia(request) {
  const cache = await caches.open(MEDIA_CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const contentType = (response.headers.get('content-type') || '').toLowerCase();
  if (response.ok && contentType.startsWith('image/')) {
    await cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function cacheFingerprintAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    await cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Cache only public image URLs from the known public Storage bucket and the
  // existing same-origin Google image proxy. Never intercept private Storage paths.
  const isPublicStorageImage = url.protocol === 'https:' &&
    url.hostname === SUPABASE_MEDIA_HOST &&
    url.pathname.startsWith(SUPABASE_MEDIA_PREFIX);
  const isPublicImageProxy = url.origin === self.location.origin && url.pathname === '/image';
  const isPublicSameOriginImage = url.origin === self.location.origin &&
    /\.(?:avif|gif|jpe?g|png|svg|webp|ico)$/i.test(url.pathname);
  if (isPublicStorageImage || isPublicImageProxy || isPublicSameOriginImage) {
    event.respondWith(cachePublicMedia(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  // Never intercept API/function calls, auth traffic, or non-fingerprinted
  // assets. In particular, Supabase POST/function submissions remain network-only.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/functions/') ||
    url.hostname.endsWith('.supabase.co')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request, url));
    return;
  }

  if (isFingerprintAsset(url, request)) {
    event.respondWith(cacheFingerprintAsset(request));
  }
});
