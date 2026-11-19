import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicKnowledgeContext, resolvePublicDirectoryFilters } from '../../functions/_shared/chatKnowledge.js';

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
