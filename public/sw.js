// Reuse v3 cache namespace: the currently deployed v3 worker deletes every
// cache except this exact key on activation. Keeping it makes rollback compatible.
const CACHE_NAME = 'hs-sadiqabad-shell-v3';
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
    return await fetch(request, { cache: 'no-store' });
  } catch {
    // Preserve the dedicated emergency page at /offline. Other app routes can
    // use the cached SPA entry document, allowing React Router to resolve them.
    const cache = await caches.open(CACHE_NAME);
    if (url.pathname === '/offline' || url.pathname === '/offline/') {
      return (await cache.match(OFFLINE_URL)) || Response.error();
    }
    return (await cache.match(APP_SHELL_URL)) ||
      (await cache.match(OFFLINE_URL)) ||
      Response.error();
  }
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
