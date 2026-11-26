import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequestGet } from './image.js';

async function withImageMocks(fetchImpl, cacheImpl, run) {
  const originalFetch = globalThis.fetch;
  const originalCaches = globalThis.caches;
  globalThis.fetch = fetchImpl;
  globalThis.caches = { default: { match: async () => null, put: async () => undefined, ...cacheImpl } };
  try { await run(); } finally {
    globalThis.fetch = originalFetch;
    if (originalCaches === undefined) delete globalThis.caches;
    else globalThis.caches = originalCaches;
  }
}

const request = () => ({ request: new Request('https://hellosadiqabad.com/image?url=' + encodeURIComponent('https://lh3.googleusercontent.com/test-photo')) });

test('image proxy returns upstream image content as 200', async () => {
  await withImageMocks(async () => new Response('image-bytes', { status: 200, headers: { 'content-type': 'image/webp' } }), {}, async () => {
    const response = await onRequestGet(request());
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/webp');
    assert.equal(await response.text(), 'image-bytes');
  });
});

test('image proxy returns a 200 SVG placeholder when the upstream image is missing', async () => {
  await withImageMocks(async () => new Response('not found', { status: 404 }), {}, async () => {
    const response = await onRequestGet(request());
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^image\/svg\+xml/);
    assert.match(await response.text(), /Image unavailable/);
  });
});

test('image proxy returns a placeholder when upstream fetch times out', async () => {
  await withImageMocks(async () => { throw new DOMException('Timed out', 'TimeoutError'); }, {}, async () => {
    const response = await onRequestGet(request());
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^image\/svg\+xml/);
  });
});

test('image proxy still returns fallback if edge cache write fails', async () => {
  await withImageMocks(async () => new Response('missing', { status: 404 }), { put: async () => { throw new Error('cache unavailable'); } }, async () => {
    const response = await onRequestGet(request());
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type') || '', /^image\/svg\+xml/);
  });
});
