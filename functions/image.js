import { fetchWithTimeout } from './_shared/fetchWithTimeout.js';

const ALLOWED_IMAGE_HOST = /(^|\.)googleusercontent\.com$/i;
const SUPABASE_STORAGE_HOST = "efwohfzqitevkuybnyif.supabase.co";
const SUPABASE_PUBLIC_BUCKET_PREFIX = "/storage/v1/object/public/Hello%20Sadiqabad/";

function imagePlaceholder() {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400" role="img" aria-label="Image unavailable"><rect width="640" height="400" fill="#f1f5f9"/><g fill="none" stroke="#64748b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"><rect x="220" y="105" width="200" height="150" rx="18"/><circle cx="275" cy="155" r="16"/><path d="m238 232 58-55 40 36 28-25 38 44"/></g><text x="320" y="315" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#475569">Image unavailable</text><text x="320" y="348" text-anchor="middle" font-family="Arial,sans-serif" font-size="17" fill="#64748b">Hello Sadiqabad</text></svg>';
  return new Response(svg, { status: 200, headers: {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  }});
}

export async function onRequestGet({request}) {
  const requestUrl = new URL(request.url), source = requestUrl.searchParams.get("url");
  if (!source) return new Response("Missing image URL", { status: 400 });
  let imageUrl;
  try { imageUrl = new URL(source); } catch { return new Response("Invalid image URL", { status: 400 }); }
  const isGoogleImage = ALLOWED_IMAGE_HOST.test(imageUrl.hostname);
  const isSupabasePublicImage = imageUrl.hostname === SUPABASE_STORAGE_HOST && imageUrl.pathname.startsWith(SUPABASE_PUBLIC_BUCKET_PREFIX);
  if (imageUrl.protocol !== "https:" || (!isGoogleImage && !isSupabasePublicImage)) return new Response("Image host is not allowed", { status: 403 });

  const cacheKey = new Request(requestUrl.origin + requestUrl.pathname + "?url=" + encodeURIComponent(imageUrl.toString()));
  try {
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;
  } catch {
    // Keep image delivery working if the edge cache is unavailable.
  }

  let upstream;
  try {
    upstream = await fetchWithTimeout(imageUrl.toString(), {
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.google.com/maps/",
        "User-Agent": "Mozilla/5.0 (compatible; HelloSadiqabadImageProxy/1.0)",
      },
      cf: { cacheEverything: true, cacheTtl: 604800 },
    }, 8000);
  } catch {
    const placeholder = imagePlaceholder();
    try { await caches.default.put(cacheKey, placeholder.clone()); } catch { /* best-effort cache */ }
    return placeholder;
  }

  const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
  if (!upstream.ok || !contentType.startsWith("image/")) {
    const placeholder = imagePlaceholder();
    try { await caches.default.put(cacheKey, placeholder.clone()); } catch { /* best-effort cache */ }
    return placeholder;
  }

  const response = new Response(upstream.body, { status: 200, headers: {
    "Content-Type": contentType,
    "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
    "Access-Control-Allow-Origin": "*",
    "X-Content-Type-Options": "nosniff",
  }});
  try { await caches.default.put(cacheKey, response.clone()); } catch { /* best-effort cache */ }
  return response;
}
