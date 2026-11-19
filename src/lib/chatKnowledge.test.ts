import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicKnowledgeContext, mapPublicBusinessSearchResult, resolvePublicDirectoryFilters } from '../../functions/_shared/chatKnowledge.js';

test('maps every supplied public knowledge source to canonical visitor links', () => {
  const context = buildPublicKnowledgeContext({
    categories: [{ id: 'cat-1', name_en: 'Hospitals', name_ur: 'ہسپتال', slug: 'hospitals', parent_id: null, synonyms: ['clinic'] }],
    areas: [{ id: 'area-1', name_en: 'Model Town', name_ur: 'ماڈل ٹاؤن', slug: 'model-town' }],
    emergency_contacts: [{ name_en: 'Rescue', phone: '1122', is_active: true }],
    local_authorities: [{ name_en: 'Municipal Office', authority_type: 'government', phone: '123' }],
    authority_profiles: [{ slug: 'public-profile', name_en: 'Public Person', show_contact: false, show_bio: true, bio_en: 'Public biography', phone: 'private-phone', email: 'private@example.com' }],
    news_articles: [{ slug: 'local-update', title_en: 'Local update', content_en: 'Full published article' }],
    pages: [{ slug: 'about', title_en: 'About', body_md_en: 'Published page body' }],
    business_products: [{ name_en: 'Product', business: { name_en: 'Shop', slug: 'shop' } }],
    offers: [{ title: 'Offer', business: { name_en: 'Shop', slug: 'shop' } }],
    announcements: [{ title_en: 'Notice', body_en: 'Current notice' }],
    site_settings: [{ key: 'site_name', value: 'Hello Sadiqabad' }],
    source_status: { categories: 'loaded' },
  });

  assert.equal(context.categories[0].url, 'https://hellosadiqabad.com/category/hospitals');
  assert.equal(context.areas[0].url, 'https://hellosadiqabad.com/area/model-town');
  assert.equal(context.news[0].url, 'https://hellosadiqabad.com/news/local-update');
  assert.equal(context.website_pages[0].url, 'https://hellosadiqabad.com/about');
  assert.equal(context.products[0].business.url, 'https://hellosadiqabad.com/business/shop');
  assert.equal(context.authority_profiles[0].phone, null);
  assert.equal(context.authority_profiles[0].email, null);
  assert.equal(context.authority_profiles[0].biography, 'Public biography');
  assert.deepEqual(context.source_status, { categories: 'loaded' });
});

test('does not synthesize missing public records or profile contact fields', () => {
  const context = buildPublicKnowledgeContext({
    categories: [],
    areas: [],
    authority_profiles: [{ slug: 'profile', name_en: 'Profile', show_contact: false, phone: 'not-public', email: 'not-public@example.com' }],
  });
  assert.deepEqual(context.categories, []);
  assert.deepEqual(context.areas, []);
  assert.equal(context.authority_profiles[0].phone, null);
  assert.equal(context.authority_profiles[0].email, null);
});

test('resolves category and area filters from English, Urdu and synonyms', () => {
  const filters = resolvePublicDirectoryFilters(
    'hospitals in Model Town',
    [{ name_en: 'Healthcare', name_ur: 'صحت', slug: 'healthcare', synonyms: ['hospitals', 'clinics'] }],
    [{ name_en: 'Model Town', name_ur: 'ماڈل ٹاؤن', slug: 'model-town' }],
  );
  assert.deepEqual(filters, { category: 'healthcare', area: 'model-town' });

  const urduFilters = resolvePublicDirectoryFilters(
    'صحت ماڈل ٹاؤن',
    [{ name_en: 'Healthcare', name_ur: 'صحت', slug: 'healthcare', synonyms: [] }],
    [{ name_en: 'Model Town', name_ur: 'ماڈل ٹاؤن', slug: 'model-town' }],
  );
  assert.deepEqual(urduFilters, { category: 'healthcare', area: 'model-town' });
});

test('matches locality variants with punctuation and the city suffix', () => {
  const filters = resolvePublicDirectoryFilters(
    'businesses in Hussainabad',
    [],
    [{ name_en: ', Hussainabad, Sadiqabad', name_ur: 'حسین آباد', slug: 'hussainabad-sadiqabad' }],
  );
  assert.deepEqual(filters, { category: null, area: 'hussainabad-sadiqabad' });
});

test('keeps only pre-redacted public owner profile fields and omits internal IDs', () => {
  const context = buildPublicKnowledgeContext({
    owner_public_profile_directory: [
      { owner_id: 'internal-uuid', display_name: 'Public Owner', photo_url: 'https://hellosadiqabad.com/public.jpg', phone: null, email: 'public@example.com' },
      { owner_id: 'hidden-uuid', display_name: null, photo_url: null, phone: null, email: null },
    ],
  });
  assert.deepEqual(context.public_owner_profiles, [{
    display_name: 'Public Owner',
    photo_url: 'https://hellosadiqabad.com/public.jpg',
    phone: null,
    email: 'public@example.com',
  }]);
  assert.equal('owner_id' in context.public_owner_profiles[0], false);
});

test('business context respects plan-gated public fields and never invents coordinates', () => {
  const free = mapPublicBusinessSearchResult({
    slug: 'sample-shop',
    name_en: 'Sample Shop',
    plan_code: 'free',
    plan_expires_at: null,
    whatsapp: '03001234567',
    facebook_url: 'https://facebook.com/sample',
    gallery_urls: ['https://hellosadiqabad.com/gallery.jpg'],
    video_urls: ['https://youtube.com/watch?v=sample'],
    lat: null,
    lng: null,
    phone_primary: '03001112222',
    website_url: 'https://example.com',
  });
  assert.equal(free.whatsapp, null);
  assert.equal(free.social_links, null);
  assert.deepEqual(free.gallery_urls, []);
  assert.deepEqual(free.video_urls, []);
  assert.equal(free.latitude, null);
  assert.equal(free.longitude, null);
  assert.equal(free.directions_url, null);
  assert.equal(free.phone, '03001112222');
  assert.equal(free.website, 'https://example.com');

  const premium = mapPublicBusinessSearchResult({
    slug: 'premium-shop',
    name_en: 'Premium Shop',
    plan_code: 'premium',
    plan_expires_at: new Date(Date.now() + 86400000).toISOString(),
    whatsapp: '03001234567',
    facebook_url: 'https://facebook.com/sample',
    gallery_urls: ['https://hellosadiqabad.com/gallery.jpg'],
    video_urls: ['https://youtube.com/watch?v=sample'],
    lat: 28.3,
    lng: 69.7,
  });
  assert.equal(premium.whatsapp, '03001234567');
  assert.equal(premium.social_links.facebook, 'https://facebook.com/sample');
  assert.equal(premium.gallery_urls.length, 1);
  assert.equal(premium.video_urls.length, 1);
  assert.match(premium.directions_url, /28.3,69.7/);
});
