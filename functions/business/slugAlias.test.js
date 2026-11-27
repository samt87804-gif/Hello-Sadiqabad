import assert from 'node:assert/strict';
import test from 'node:test';
import { onRequest } from './[slug].js';

const uuid = '055024dd-006c-474b-bc16-c40357caf895';
const currentBusiness = {
  name_en: 'Five STAR HOTEL PRODUTION UNIT TILLU ROAD', name_ur: null,
  slug: 'five-star-hotel-prodution-unit-tillu-road-xik', description_en: 'Published business profile',
  description_ur: null, logo_url: null, cover_url: null, address_en: 'Tillu Road',
  phone_primary: '03000000000', meta_title_en: null, meta_description_en: null,
};
function makeContext(fetchImpl, slug = 'five-star-hotel-prodution-unit-tillu-road') {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  return {
    context: {
      request: new Request('https://hellosadiqabad.com/business/' + slug, { headers: { 'user-agent': 'Googlebot' } }),
      env: { VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test-key' },
      params: { slug },
      next: async () => new Response('<!doctype html><html><head></head><body>Business</body></html>', { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } }),
    },
    restore: () => { globalThis.fetch = originalFetch; },
  };
}
function aliasFetch(published = true) {
  return async (input) => {
    const url = new URL(String(input));
    if (url.pathname === '/rest/v1/businesses' && url.searchParams.has('slug')) return Response.json([]);
    if (url.pathname === '/data/businesses/index.json') return Response.json({ chunks: [{ file: 'businesses-001.json', count: 1 }] });
    if (url.pathname === '/data/businesses/businesses-001.json') return Response.json({ businesses: [{ slug: 'five-star-hotel-prodution-unit-tillu-road', databaseId: uuid }] });
    if (url.pathname === '/rest/v1/businesses' && url.searchParams.get('id') === 'eq.' + uuid) return Response.json(published ? [currentBusiness] : []);
    throw new Error('Unexpected request: ' + url.toString());
  };
}
test('crawler requests for a verified legacy slug redirect to the current canonical URL', async () => {
  const { context, restore } = makeContext(aliasFetch());
  try {
    const response = await onRequest(context);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://hellosadiqabad.com/business/five-star-hotel-prodution-unit-tillu-road-xik');
  } finally { restore(); }
});
test('legacy aliases do not expose listings that are no longer published', async () => {
  const { context, restore } = makeContext(aliasFetch(false));
  try {
    const response = await onRequest(context);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Business listing not found/);
  } finally { restore(); }
});


const inspireUuid = '0d14d4af-6434-4b3c-aec3-3de0bb669a51';
const inspireBusiness = {
  name_en: 'THE INSPIRE BUSINESS ACADEMY SADIQABAD', name_ur: null,
  slug: 'the-inspire-business-academy-sadiqabad-1h0',
  description_en: 'Digital skills and computer training in Sadiqabad.',
  description_ur: null, logo_url: null, cover_url: null,
  address_en: 'Near Shimla Point, Mehraban, Sadiqabad',
  phone_primary: '03093534289', meta_title_en: null, meta_description_en: null,
};
function inspireAliasFetch(published = true) {
  return async (input) => {
    const url = new URL(String(input));
    if (url.pathname === '/rest/v1/businesses' && url.searchParams.has('slug')) return Response.json([]);
    if (url.pathname === '/data/businesses/index.json') return Response.json({ chunks: [] });
    if (url.pathname === '/rest/v1/businesses' && url.searchParams.get('id') === 'eq.' + inspireUuid) {
      return Response.json(published ? [inspireBusiness] : []);
    }
    throw new Error('Unexpected request: ' + url.toString());
  };
}
test('crawler redirects the verified Inspire legacy URL to its live canonical slug', async () => {
  const { context, restore } = makeContext(inspireAliasFetch(), 'the-inspire-business-academy-sadiqabad-4x0');
  try {
    const response = await onRequest(context);
    assert.equal(response.status, 301);
    assert.equal(response.headers.get('location'), 'https://hellosadiqabad.com/business/the-inspire-business-academy-sadiqabad-1h0');
  } finally { restore(); }
});
test('the verified Inspire legacy URL does not resolve when its business is unpublished', async () => {
  const { context, restore } = makeContext(inspireAliasFetch(false), 'the-inspire-business-academy-sadiqabad-4x0');
  try {
    const response = await onRequest(context);
    assert.equal(response.status, 404);
    assert.match(await response.text(), /Business listing not found/);
  } finally { restore(); }
});
