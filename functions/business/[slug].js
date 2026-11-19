import {
  buildBusinessJsonLd,
  buildBusinessSeoMetadata,
  serializeBusinessJsonLd,
} from '../../src/lib/businessSeo.ts';

const SITE_ORIGIN = 'https://hellosadiqabad.com';
const FALLBACK_IMAGE = SITE_ORIGIN + '/site-logo.png';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CRAWLER = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterest|googlebot|google-inspectiontool|googleother|bingbot|skypeuripreview/i;
const MAX_HTML_BYTES = 2_000_000;

function isCrawler(userAgent) {
  return CRAWLER.test(String(userAgent || ''));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function setMeta(html, attribute, name, value) {
  const pattern = new RegExp('<meta\\b(?=[^>]*\\b' + attribute + '\\s*=\\s*["\\x27]' + name + '["\\x27])[^>]*>', 'i');
  const tag = '<meta ' + attribute + '="' + escapeHtml(name) + '" content="' + escapeHtml(value) + '" />';
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\/head>/i, tag + '\n</head>');
}

function setCanonical(html, url) {
  const tag = '<link rel="canonical" href="' + escapeHtml(url) + '" />';
  const pattern = /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\/head>/i, tag + '\n</head>');
}

function injectBusinessMetadata(html, business) {
  const metadata = buildBusinessSeoMetadata(business, SITE_ORIGIN);
  let output = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(metadata.title) + '</title>')
    : html.replace(/<head[^>]*>/i, (head) => head + '<title>' + escapeHtml(metadata.title) + '</title>');

  const tags = [
    ['name', 'description', metadata.description],
    ['name', 'robots', 'index,follow,max-image-preview:large'],
    ['property', 'og:title', metadata.title],
    ['property', 'og:description', metadata.description],
    ['property', 'og:type', 'website'],
    ['property', 'og:site_name', 'Hello Sadiqabad'],
    ['property', 'og:url', metadata.canonicalUrl],
    ['property', 'og:image', metadata.image || FALLBACK_IMAGE],
    ['property', 'og:image:alt', metadata.imageAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', metadata.title],
    ['name', 'twitter:description', metadata.description],
    ['name', 'twitter:image', metadata.image || FALLBACK_IMAGE],
    ['name', 'twitter:image:alt', metadata.imageAlt],
  ];
  for (const [attribute, name, value] of tags) output = setMeta(output, attribute, name, value);
  output = setCanonical(output, metadata.canonicalUrl);

  const jsonLd = serializeBusinessJsonLd(buildBusinessJsonLd(business, metadata, SITE_ORIGIN));
  const script = '<script id="hs-business-json-ld" type="application/ld+json">' + jsonLd + '</script>';
  const existingJsonLd = /<script\b(?=[^>]*\bid=["']hs-business-json-ld["'])[^>]*>[\s\S]*?<\/script>/i;
  output = existingJsonLd.test(output)
    ? output.replace(existingJsonLd, script)
    : output.replace(/<\/head>/i, script + '\n</head>');
  return output;
}

function notFoundResponse() {
  const html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>Business not found | Hello Sadiqabad</title></head><body><main><h1>Business listing not found</h1><p>This business profile is unavailable or is not published.</p><a href="/">Hello Sadiqabad</a></main></body></html>';
  return new Response(html, {
    status: 404,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=60',
      'X-Robots-Tag': 'noindex, follow',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function fetchPublishedBusiness(env, slug) {
  const baseUrl = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const publicKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!baseUrl.startsWith('https://') || !publicKey) return null;

  const url = new URL(baseUrl + '/rest/v1/businesses');
  url.searchParams.set(
    'select',
    'name_en,name_ur,slug,description_en,description_ur,logo_url,cover_url,address_en,phone_primary,meta_title_en,meta_description_en'
  );
  url.searchParams.set('slug', 'eq.' + slug);
  url.searchParams.set('status', 'eq.published');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      apikey: publicKey,
      Authorization: 'Bearer ' + publicKey,
      Accept: 'application/json',
    },
  });
  if (!response.ok) throw new Error('Published business metadata request failed (' + response.status + ').');
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET' || !isCrawler(request.headers.get('user-agent'))) return context.next();

  const slug = String(params.slug || '');
  if (!SAFE_SLUG.test(slug)) return notFoundResponse();

  let business;
  try {
    business = await fetchPublishedBusiness(env, slug);
  } catch (error) {
    console.error('[Hello Sadiqabad business SEO] Public metadata lookup failed.', error);
    return context.next();
  }
  if (!business) return notFoundResponse();

  const page = await context.next();
  if (!page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;

  try {
    const html = await page.clone().text();
    if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) return page;
    const transformed = injectBusinessMetadata(html, business);
    const headers = new Headers(page.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    headers.set('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(transformed, {
      status: page.status,
      statusText: page.statusText,
      headers,
    });
  } catch (error) {
    console.error('[Hello Sadiqabad business SEO] HTML metadata injection failed.', error);
    return page;
  }
}
