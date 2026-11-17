export const OFFLINE_MEDIA_CACHE_NAME = 'hs-sadiqabad-public-media-v1';

const SUPABASE_STORAGE_HOST = 'efwohfzqitevkuybnyif.supabase.co';
const SUPABASE_PUBLIC_BUCKET_PREFIX = '/storage/v1/object/public/Hello%20Sadiqabad/';
const GOOGLE_IMAGE_HOST = /(^|\.)googleusercontent\.com$/i;

export function getOfflineImageCacheUrl(value: string, siteOrigin: string): string | null {
  try {
    const source = new URL(value, siteOrigin);
    if (source.protocol !== 'https:') return null;

    if (
      source.hostname === SUPABASE_STORAGE_HOST &&
      source.pathname.startsWith(SUPABASE_PUBLIC_BUCKET_PREFIX)
    ) {
      return source.toString();
    }

    if (GOOGLE_IMAGE_HOST.test(source.hostname)) {
      const proxy = new URL('/image', siteOrigin);
      proxy.searchParams.set('url', source.toString());
      return proxy.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export async function cacheOfflineImages(
  values: string[],
  signal: AbortSignal,
  onProgress?: (completed: number, total: number) => void
): Promise<{ total: number; downloaded: number; alreadyCached: number; skipped: number; bytes: number }> {
  if (typeof caches === 'undefined') {
    return { total: 0, downloaded: 0, alreadyCached: 0, skipped: values.length, bytes: 0 };
  }

  const urls = [...new Set(values
    .map((value) => getOfflineImageCacheUrl(value, window.location.origin))
    .filter((value): value is string => Boolean(value)))];
  let cache: Cache;
  try {
    cache = await caches.open(OFFLINE_MEDIA_CACHE_NAME);
  } catch {
    return { total: urls.length, downloaded: 0, alreadyCached: 0, skipped: urls.length, bytes: 0 };
  }
  let nextIndex = 0;
  let downloaded = 0;
  let alreadyCached = 0;
  let skipped = 0;
  let bytes = 0;
  let completed = 0;

  const worker = async () => {
    while (true) {
      if (signal.aborted) throw new DOMException('Image download cancelled.', 'AbortError');
      const index = nextIndex++;
      if (index >= urls.length) return;
      const url = urls[index];
      const request = new Request(url, { mode: 'cors', credentials: 'omit' });
      try {
        const existing = await cache.match(request);
        if (existing) {
          alreadyCached += 1;
        } else {
          const response = await fetch(request, { signal });
          const contentType = (response.headers.get('content-type') ?? '').toLowerCase();
          if (!response.ok || !contentType.startsWith('image/')) {
            skipped += 1;
          } else {
            await cache.put(request, response.clone());
            downloaded += 1;
            bytes += Number(response.headers.get('content-length') ?? 0);
          }
        }
      } catch (error) {
        if (signal.aborted || (error instanceof DOMException && error.name === 'AbortError')) throw error;
        skipped += 1;
      } finally {
        completed += 1;
        onProgress?.(completed, urls.length);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(4, Math.max(1, urls.length)) }, () => worker()));
  return { total: urls.length, downloaded, alreadyCached, skipped, bytes };
}
