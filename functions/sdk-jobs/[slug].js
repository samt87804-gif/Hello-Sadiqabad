import { fetchWithTimeout } from '../_shared/fetchWithTimeout.js';

const SITE_ORIGIN = 'https://hellosadiqabad.com';
const FALLBACK_IMAGE = SITE_ORIGIN + '/site-logo.png';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOCIAL_CRAWLER = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterest|googlebot|google-inspectiontool|googleother|bingbot|skypeuripreview/i;
const MAX_HTML_BYTES = 2_000_000;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function cleanDescription(value) {
  const text = String(value || '').replace(/<[^>]*>/g, ' ').replace(/[\s\u00a0]+/g, ' ').trim();
  return text.slice(0, 200);
}

function safeImage(value) {
  try {
    const url = new URL(String(value || ''));
    return url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
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

function employmentType(value) {
  return ({
    'full-time': 'FULL_TIME', 'part-time': 'PART_TIME', contract: 'CONTRACTOR',
    temporary: 'TEMPORARY', internship: 'INTERN', apprenticeship: 'INTERN',
  })[String(value || '').toLowerCase()] || 'OTHER';
}

function buildMetadata(html, job, canonicalUrl) {
  const title = (job.title_en || job.title_ur || 'Local Job') + ' — SDK Jobs | Hello Sadiqabad';
  const description = cleanDescription(job.summary_en || job.summary_ur) || 'A reviewed local vacancy on Hello Sadiqabad SDK Jobs.';
  const image = safeImage(job.image_url) || FALLBACK_IMAGE;
  const location = job.work_location_en || job.area_name_en || 'Sadiqabad';
  let output = /<title>[\s\S]*?<\/title>/i.test(html)
    ? html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>')
    : html.replace(/<head[^>]*>/i, (head) => head + '<title>' + escapeHtml(title) + '</title>');
  const tags = [
    ['name', 'description', description],
    ['name', 'robots', 'index,follow,max-image-preview:large'],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:type', 'article'],
    ['property', 'og:site_name', 'Hello Sadiqabad'],
    ['property', 'og:url', canonicalUrl],
    ['property', 'og:image', image],
    ['property', 'og:image:alt', job.title_en || job.title_ur || 'Local job poster'],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
  ];
  for (const [attribute, name, value] of tags) output = setMeta(output, attribute, name, value);
  output = setCanonical(output, canonicalUrl);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title_en || job.title_ur || 'Local vacancy',
    description: [job.summary_en, job.description_en, job.qualifications_en, job.experience_en].filter(Boolean).join('\n\n'),
    datePosted: job.published_at,
    ...(job.closing_date ? { validThrough: job.closing_date + 'T23:59:59+05:00' } : {}),
    employmentType: employmentType(job.job_type),
    hiringOrganization: { '@type': 'Organization', name: 'Confidential local employer' },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: location, addressRegion: 'Punjab', addressCountry: 'PK' },
    },
    image,
  };
  const jsonText = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const script = '<script id="hs-sdk-job-json-ld" type="application/ld+json">' + jsonText + '</script>';
  const existing = /<script\b(?=[^>]*\bid=["']hs-sdk-job-json-ld["'])[^>]*>[\s\S]*?<\/script>/i;
  output = existing.test(output) ? output.replace(existing, script) : output.replace(/<\/head>/i, script + '\n</head>');
  return output;
}

function notFoundResponse() {
  return new Response('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><title>Local job not found | Hello Sadiqabad</title></head><body><main><h1>Local job not found</h1><p>This vacancy is unavailable or is no longer published.</p><a href="/sdk-jobs">Browse SDK Jobs</a></main></body></html>', {
    status: 404,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=0, s-maxage=60', 'X-Robots-Tag': 'noindex, follow', 'X-Content-Type-Options': 'nosniff' },
  });
}

async function fetchPublishedJob(env, slug) {
  const baseUrl = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const publicKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!baseUrl.startsWith('https://') || !publicKey) throw new Error('Public Supabase configuration is unavailable.');
  const url = new URL(baseUrl + '/rest/v1/sdk_jobs_public');
  url.searchParams.set('select', 'slug,title_en,title_ur,summary_en,summary_ur,description_en,qualifications_en,experience_en,job_type,work_location_en,area_name_en,image_url,published_at,closing_date');
  url.searchParams.set('slug', 'eq.' + slug);
  url.searchParams.set('limit', '1');
  const response = await fetchWithTimeout(url, {
    headers: { apikey: publicKey, Authorization: 'Bearer ' + publicKey, Accept: 'application/json' },
  }, 8000);
  if (!response.ok) throw new Error('Published SDK Jobs metadata request failed (' + response.status + ').');
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET' || !SOCIAL_CRAWLER.test(String(request.headers.get('user-agent') || ''))) return context.next();
  const slug = String(params.slug || '');
  if (!SAFE_SLUG.test(slug)) return notFoundResponse();

  let job;
  try {
    job = await fetchPublishedJob(env, slug);
  } catch (error) {
    console.error('[Hello Sadiqabad SDK Jobs social preview] Public projection lookup failed.', error);
    return context.next();
  }
  if (!job) return notFoundResponse();

  const page = await context.next();
  if (!page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;
  try {
    const html = await page.clone().text();
    if (new TextEncoder().encode(html).byteLength > MAX_HTML_BYTES) return page;
    const canonicalUrl = SITE_ORIGIN + '/sdk-jobs/' + job.slug;
    const transformed = buildMetadata(html, job, canonicalUrl);
    const headers = new Headers(page.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    headers.set('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(transformed, { status: page.status, statusText: page.statusText, headers });
  } catch (error) {
    console.error('[Hello Sadiqabad SDK Jobs social preview] HTML metadata injection failed.', error);
    return page;
  }
}
