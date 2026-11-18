import assert from 'node:assert/strict';
import test from 'node:test';
import { getOfflineImageCacheUrl, getOfflineImageDisplayUrl } from './offlineImages';

const origin = 'https://hellosadiqabad.com';

test('allows public images from the existing Supabase public bucket', () => {
  const url = 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/site-media/admin/banner.webp';
  const cached = getOfflineImageCacheUrl(url, origin);
  assert.ok(cached);
  assert.equal(new URL(cached).origin, origin);
  assert.equal(new URL(cached).pathname, '/image');
  assert.equal(new URL(cached).searchParams.get('url'), url);
  assert.equal(getOfflineImageDisplayUrl(url, origin), cached);
});

test('rejects other Supabase buckets and hosts', () => {
  assert.equal(
    getOfflineImageCacheUrl('https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/private/file.webp', origin),
    null
  );
  assert.equal(
    getOfflineImageCacheUrl('https://example.com/image.webp', origin),
    null
  );
});

test('routes existing Google-hosted images through the same-origin image proxy', () => {
  const source = 'https://lh3.googleusercontent.com/example-photo';
  const result = getOfflineImageCacheUrl(source, origin);
  assert.ok(result);
  const parsed = new URL(result);
  assert.equal(parsed.origin, origin);
  assert.equal(parsed.pathname, '/image');
  assert.equal(parsed.searchParams.get('url'), source);
});

test('rejects insecure image URLs', () => {
  assert.equal(
    getOfflineImageCacheUrl('http://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/file.webp', origin),
    null
  );
});


test('does not proxy Supabase URLs outside the public Hello Sadiqabad bucket', () => {
  const url = 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/private/file.webp';
  assert.equal(getOfflineImageDisplayUrl(url, origin), url);
  assert.equal(getOfflineImageCacheUrl(url, origin), null);
});

test('keeps unsupported external image hosts unchanged for display', () => {
  const url = 'https://example.com/category.webp';
  assert.equal(getOfflineImageDisplayUrl(url, origin), url);
});
