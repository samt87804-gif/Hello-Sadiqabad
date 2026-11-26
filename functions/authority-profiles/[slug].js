import { fetchWithTimeout } from '../_shared/fetchWithTimeout.js';

const SITE_ORIGIN = 'https://hellosadiqabad.com';
const FALLBACK_IMAGE = SITE_ORIGIN + '/site-logo.png';
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SOCIAL_CRAWLER = /facebookexternalhit|facebot|whatsapp|twitterbot|linkedinbot|slackbot|discordbot|telegrambot|pinterest|googlebot|bingbot/i;

function isSocialCrawler(userAgent) {
  return SOCIAL_CRAWLER.test(String(userAgent || ''));
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}

function cleanDescription(value, fallback) {
  const text = String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_>#~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
  const pattern = new RegExp("<meta\\b(?=[^>]*\\b" + attribute + "\\s*=\\s*[\"']" + name + "[\"'])[^>]*>", 'i');
  const tag = '<meta ' + attribute + '="' + escapeHtml(name) + '" content="' + escapeHtml(value) + '" />';
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace(/<\/head>/i, tag + '\n</head>');
}

function buildSocialHtml(html, { title, description, url, image, imageAlt, type, publishedAt }) {
  let output = html.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>');
  const tags = [
    ['name', 'description', description],
    ['property', 'og:title', title],
    ['property', 'og:description', description],
    ['property', 'og:type', type],
    ['property', 'og:site_name', 'Hello Sadiqabad'],
    ['property', 'og:url', url],
    ['property', 'og:image', image],
    ['property', 'og:image:alt', imageAlt],
    ['name', 'twitter:card', 'summary_large_image'],
    ['name', 'twitter:title', title],
    ['name', 'twitter:description', description],
    ['name', 'twitter:image', image],
    ['name', 'twitter:image:alt', imageAlt],
  ];
  for (const [attribute, name, value] of tags) output = setMeta(output, attribute, name, value);
  if (publishedAt) output = setMeta(output, 'property', 'article:published_time', publishedAt);

  const canonicalTag = '<link rel="canonical" href="' + escapeHtml(url) + '" />';
  const canonicalPattern = /<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/i;
  output = canonicalPattern.test(output)
    ? output.replace(canonicalPattern, canonicalTag)
    : output.replace(/<\/head>/i, canonicalTag + '\n</head>');
  return output;
}

async function fetchAuthorityProfile(env, slug) {
  const baseUrl = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const publicKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!baseUrl.startsWith('https://') || !publicKey) return null;

  const url = new URL(baseUrl + '/rest/v1/authority_profiles');
  url.searchParams.set('select', 'slug,name_en,name_ur,designation_en,designation_ur,bio_en,bio_ur,authority_en,show_bio,show_authority,photo_url');
  url.searchParams.set('slug', 'eq.' + slug);
  url.searchParams.set('is_active', 'eq.true');
  url.searchParams.set('limit', '1');

  const response = await fetchWithTimeout(url, {
    headers: { apikey: publicKey, Authorization: 'Bearer ' + publicKey, Accept: 'application/json' },
  }, 8000);
  if (!response.ok) throw new Error('Authority profile metadata request failed (' + response.status + ').');
  const rows = await response.json();
  return Array.isArray(rows) ? rows[0] || null : null;
}

export async function onRequest(context) {
  const { request, env, params } = context;
  if (request.method !== 'GET' || !isSocialCrawler(request.headers.get('user-agent'))) return context.next();

  const slug = String(params.slug || '');
  if (!SAFE_SLUG.test(slug)) return context.next();

  let profile;
  try {
    profile = await fetchAuthorityProfile(env, slug);
  } catch (error) {
    console.error('[Hello Sadiqabad authority social preview] Public metadata lookup failed.', error);
    return context.next();
  }
  if (!profile) return context.next();

  const page = await context.next();
  if (!page.ok || !(page.headers.get('content-type') || '').includes('text/html')) return page;

  try {
    const image = safeImage(profile.photo_url) || FALLBACK_IMAGE;
    const designation = profile.designation_en || profile.designation_ur || '';
    const title = (profile.name_en || profile.name_ur || 'Sadiqabad Authority Profile') + (designation ? ' — ' + designation : '') + ' | Hello Sadiqabad';
    const visibleDescription = profile.show_bio ? (profile.bio_en || profile.bio_ur) : profile.show_authority ? (profile.authority_en || profile.authority_ur) : designation;
    const description = cleanDescription(visibleDescription, 'Public representative and authority profile from Sadiqabad.');
    const canonicalUrl = SITE_ORIGIN + '/authority-profiles/' + profile.slug;
    const html = buildSocialHtml(await page.text(), {
      title, description, url: canonicalUrl, image,
      imageAlt: profile.name_en || profile.name_ur || 'Sadiqabad authority profile',
      type: 'profile', publishedAt: null,
    });
    const headers = new Headers(page.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.delete('etag');
    headers.set('cache-control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
    return new Response(html, { status: page.status, statusText: page.statusText, headers });
  } catch (error) {
    console.error('[Hello Sadiqabad authority social preview] HTML metadata injection failed.', error);
    return page;
  }
}
