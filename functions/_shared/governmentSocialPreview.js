const SITE_ORIGIN = 'https://hellosadiqabad.com';
const FALLBACK_IMAGE = SITE_ORIGIN + '/site-logo.png';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOCIAL_CRAWLER = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterest|googlebot|google-inspectiontool|googleother|bingbot|skypeuripreview/i;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function cleanDescription(value, fallback) {
  const text = String(value || '').replace(/<[^>]*>/g, ' ').replace(/[\s\u00a0]+/g, ' ').trim();
  return (text || fallback).slice(0, 200);
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
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\\/head>/i, tag + '\\n</head>');
}

function setCanonical(html, url) {
  const tag = '<link rel="canonical" href="' + escapeHtml(url) + '" />';
  const pattern = /<link\\b(?=[^>]*\\brel\\s*=\\s*["']canonical["'])[^>]*>/i;
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\\/head>/i, tag + '\\n</head>');
}

function buildSocialHtml(html, content) {
  const title = content.title + ' — Hello Sadiqabad';
  let output = /<title>[\\s\\S]*?<\\/title>/i.test(html)
    ? html.replace(/<title>[\\s\\S]*?<\\/title>/i, '<title>' + escapeHtml(title) + '</title>')
    : html.replace(/<head[^>]*>/i, (head) => head + '<title>' + escapeHtml(title) + '</title>');
  const tags = [
    ['name', 'description', content.description],
    ['name', 'robots', 'index,follow,max-image-preview:large'],
    ['property', 'og:title', title],
    ['property', 'og:description', content.description],
    ['property', 'og:type', 'article'],
    ['property', 'og:site_name', 'Hello Sadiqabad'],
    ['property', 'og:url', content.url],
    ['property', 'og:image', content.image],
    ['property', 'og:image:alt', content.imageAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', content.description],
    ['name', 'twitter:image', content.image],
    ['name', 'twitter:image:alt', content.imageAlt],
  ];
  for (const [attribute, name, value] of tags) output = setMeta(output, attribute, name, value);
  return setCanonical(output, content.url);
}

async function fetchPublishedContent(env, config, slug) {
  const baseUrl = String(env.VITE_SUPABASE_URL || '').replace(/\\/+$/, '');
  const publicKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!baseUrl.startsWith('https://') || !publicKey) return null;

  const url = new URL(baseUrl + '/rest/v1/' + config.table);
  url.searchParams.set('select', config.select);
  url.searchParams.set('slug', 'eq.' + slug);
  url.searchParams.set('status', config.statusFilter);
  url.searchParams.set('published_at', 'lte.' + new Date().toISOString());
  url.searchParams.set('limit', '1');
  const response = await fetch(url, {
    headers: { apikey: publicKey, Authorization: 'Bearer ' + publicKey, Accept: 'application/json' },
  });
  if (!response.ok) throw new Error('Government social metadata request failed (' + response.status + ').');
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function onRequestGovernmentSocialPreview(context, config) {
  const { request, env, params } = context;
  if (request.method !== 'GET' || !SOCIAL_CRAWLER.test(String(request.headers.get('user-agent') || ''))) return context.next();
  const slug = String(params.slug || '');
  if (!SAFE_SLUG.test(slug)) return context.next();

  let record;
  try {
    record = await fetchPublishedContent(env, config, slug);
  } catch (error) {
    console.error('[Hello Sadiqabad government social preview] Public metadata lookup failed.', error);
    return context.next();
  }
  if (!record) return context.next();

  const page = await context.next();
  if (!page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;
  try {
    const content = config.toContent(record);
    const html = buildSocialHtml(await page.text(), {
      ...content,
      url: SITE_ORIGIN + config.pathPrefix + record.slug,
      image: safeImage(record.image_url) || FALLBACK_IMAGE,
    });
    const headers = new Headers(page.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    headers.set('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(html, { status: page.status, statusText: page.statusText, headers });
  } catch (error) {
    console.error('[Hello Sadiqabad government social preview] HTML metadata injection failed.', error);
    return page;
  }
}
