import { buildSitemapXml, filterIndexableTaxonomy } from '../src/lib/sitemap.ts';

const SITE_ORIGIN = 'https://hellosadiqabad.com';
const PAGE_SIZE = 1000;
const MAX_PAGES = 20;
const SAFE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const STATIC_PAGE_SLUGS = new Set(['about', 'advertise', 'contact', 'terms', 'privacy', 'listing-terms', 'refund-policy', 'faq']);

function xmlResponse(xml) {
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function errorResponse() {
  return new Response('Sitemap is temporarily unavailable. Please retry later.', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'Retry-After': '300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

async function fetchPublicRows(baseUrl, publicKey, table, select, filters = {}, order = 'id.asc') {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(baseUrl + '/rest/v1/' + table);
    url.searchParams.set('select', select);
    url.searchParams.set('order', order);
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('offset', String(page * PAGE_SIZE));
    for (const [key, value] of Object.entries(filters)) url.searchParams.set(key, value);

    const response = await fetch(url, {
      headers: {
        apikey: publicKey,
        Authorization: 'Bearer ' + publicKey,
        Accept: 'application/json',
      },
    });
    if (!response.ok) throw new Error('Public sitemap read failed for ' + table + ' (' + response.status + ').');

    const batch = await response.json();
    if (!Array.isArray(batch)) throw new Error('Invalid sitemap response for ' + table + '.');
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) return rows;
  }
  throw new Error('Sitemap dataset limit exceeded for ' + table + '.');
}

function isCurrentAnnouncement(row, now) {
  const starts = !row.start_date || Date.parse(row.start_date) <= now;
  const ends = !row.end_date || Date.parse(row.end_date) >= now;
  return starts && ends;
}

function addSlugEntries(entries, rows, prefix) {
  for (const row of rows) {
    if (typeof row.slug !== 'string' || !SAFE_SLUG.test(row.slug)) continue;
    entries.push({ path: prefix + '/' + row.slug, lastModified: row.updated_at || row.published_at || null });
  }
}

export async function onRequestGet({ request, env }) {
  const cacheKey = new Request(SITE_ORIGIN + '/sitemap.xml?v=4');
  try {
    const cached = await caches.default.match(cacheKey);
    if (cached) return cached;
  } catch {
    // Continue with live public reads when edge caching is unavailable.
  }

  const baseUrl = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const publicKey = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!baseUrl.startsWith('https://') || !publicKey) return errorResponse();

  try {
    const now = new Date();
    const nowIso = now.toISOString();
    const today = nowIso.slice(0, 10);

    // Public publishable key + existing anon/RLS policies only.
    // Never query private owner-profile base tables, admin, draft, or moderation records.
    // Only the redacted owner_public_profile_directory view is eligible.
    const [
      categories, areas, businesses, news, pages, authorityProfiles, ownerProfiles,
      localAuthorities, emergencyContacts, offers, announcements, governmentJobs, governmentSchemes,
    ] = await Promise.all([
      fetchPublicRows(baseUrl, publicKey, 'categories', 'id,slug,updated_at', { is_active: 'eq.true' }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'areas', 'id,slug,updated_at', { is_active: 'eq.true' }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'businesses', 'slug,updated_at,category_id,area_id', { status: 'eq.published' }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'news_articles', 'slug,published_at,updated_at', { status: 'eq.published', published_at: 'lte.' + nowIso }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'pages', 'slug,updated_at', { is_published: 'eq.true' }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'authority_profiles', 'slug,updated_at', { is_active: 'eq.true' }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'owner_public_profile_directory', 'owner_id', {}, 'owner_id.asc'),
      fetchPublicRows(baseUrl, publicKey, 'local_authorities', 'id,updated_at', { is_active: 'eq.true' }),
      fetchPublicRows(baseUrl, publicKey, 'emergency_contacts', 'id,category,updated_at', { is_active: 'eq.true' }),
      fetchPublicRows(baseUrl, publicKey, 'offers', 'id,valid_from,valid_to,updated_at', { status: 'eq.active', valid_from: 'lte.' + today, valid_to: 'gte.' + today }),
      fetchPublicRows(baseUrl, publicKey, 'announcements', 'id,start_date,end_date,updated_at', { is_active: 'eq.true' }),
      fetchPublicRows(baseUrl, publicKey, 'government_jobs', 'slug,published_at,updated_at,status', { status: 'in.(published,closed,expired)', published_at: 'lte.' + nowIso }, 'slug.asc'),
      fetchPublicRows(baseUrl, publicKey, 'government_schemes', 'slug,published_at,updated_at,status', { status: 'eq.published', published_at: 'lte.' + nowIso }, 'slug.asc'),
    ]);

    const activeAnnouncements = announcements.filter((row) => isCurrentAnnouncement(row, now.getTime()));
    const indexableTaxonomy = filterIndexableTaxonomy(categories, areas, businesses, 3);
    const entries = [{ path: '/' }];

    if (indexableTaxonomy.categories.length > 0) entries.push({ path: '/categories' });
    if (indexableTaxonomy.areas.length > 0 || businesses.length > 0) entries.push({ path: '/map' });
    if (emergencyContacts.length > 0) entries.push({ path: '/emergency' });
    if (emergencyContacts.some((row) => String(row.category).toLowerCase() === 'government')) {
      entries.push({ path: '/government-helplines' });
    }
    if (localAuthorities.length > 0) entries.push({ path: '/local-authorities' });
    if (offers.length > 0) entries.push({ path: '/offers' });
    if (activeAnnouncements.length > 0) entries.push({ path: '/announcements' });
    if (news.length > 0) entries.push({ path: '/news' });
    if (governmentJobs.length > 0) entries.push({ path: '/government-jobs' });
    if (governmentSchemes.length > 0) entries.push({ path: '/government-schemes' });
    if (authorityProfiles.length > 0) entries.push({ path: '/authority-profiles' });

    addSlugEntries(entries, indexableTaxonomy.categories, '/category');
    addSlugEntries(entries, indexableTaxonomy.areas, '/area');
    addSlugEntries(entries, businesses, '/business');
    addSlugEntries(entries, news, '/news');
    addSlugEntries(entries, governmentJobs, '/government-jobs');
    addSlugEntries(entries, governmentSchemes, '/government-schemes');
    addSlugEntries(entries, authorityProfiles, '/authority-profiles');
    for (const profile of ownerProfiles) {
      if (typeof profile.owner_id === 'string' && SAFE_UUID.test(profile.owner_id)) {
        entries.push({ path: '/owner-profile/' + profile.owner_id });
      }
    }

    for (const page of pages) {
      if (typeof page.slug === 'string' && STATIC_PAGE_SLUGS.has(page.slug)) {
        entries.push({ path: '/' + page.slug, lastModified: page.updated_at || null });
      }
    }

    const response = xmlResponse(buildSitemapXml(entries, SITE_ORIGIN));
    try {
      await caches.default.put(cacheKey, response.clone());
    } catch {
      // Caching is optional; sitemap remains accurate without it.
    }
    return response;
  } catch (error) {
    console.error('[Hello Sadiqabad sitemap] Generation failed.', error);
    return errorResponse();
  }
}
