import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPublicKnowledgeContext, mapPublicBusinessSearchResult, resolveChatKnowledgeQuery, resolvePublicDirectoryFilters, selectRelevantPublicKnowledge } from '../../functions/_shared/chatKnowledge.js';

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
  }, 'https://hellosadiqabad.com', 'show social links, photos, videos and map directions');
  assert.equal(premium.whatsapp, '03001234567');
  assert.equal(premium.social_links!.facebook, 'https://facebook.com/sample');
  assert.equal(premium.gallery_urls.length, 1);
  assert.equal(premium.video_urls.length, 1);
  assert.match(premium.directions_url!, /28.3,69.7/);
});

test('selects compact knowledge for ordinary questions and expands only the requested sources', () => {
  const context = {
    categories: [{ name: 'Restaurants', slug: 'restaurants' }],
    areas: Array.from({ length: 80 }, (_, i) => ({ name: `Area ${i}`, slug: `area-${i}`, url: `https://hellosadiqabad.com/area/area-${i}` })),
    government_helplines: [{ name: 'Rescue', phone: '1122' }],
    local_authorities: [{ name: 'Municipal Office', type: 'government', directory_url: '/local-authorities', phone: '123' }],
    authority_profiles: [{ name: 'Public Official', designation: 'Officer', url: '/authority-profiles/public-official', biography: 'Long bio' }],
    public_owner_profiles: [{ display_name: 'Public Owner', email: 'public@example.com' }],
    news: [{ title: 'Road update', excerpt: 'A road update', content: 'Full article body', url: '/news/road-update' }],
    website_pages: [{ title: 'FAQ', slug: 'faq', url: '/faq', content: 'Detailed FAQ answer', content_ur: 'اردو جواب' }],
    products: [{ name: 'Product', business: { name: 'Shop' }, description: 'Long product description' }],
    offers: [{ title: 'Offer', description: 'Long offer description' }],
    announcements: [{ title: 'Notice', body: 'Long notice body' }],
    public_site_information: [{ key: 'site_name', value: 'Hello Sadiqabad' }],
    source_status: { categories: 'loaded' },
  };

  const general = selectRelevantPublicKnowledge(context, 'Assalam o Alaikum');
  assert.equal(general.areas.length, 8);
  assert.equal(general.areas_total_count, 80);
  assert.equal(general.website_pages[0].content, undefined);
  assert.equal(general.news[0].content, undefined);
  assert.deepEqual(general.public_owner_profiles, []);
  assert.equal(general.local_authorities[0].phone, undefined);

  const areaList = selectRelevantPublicKnowledge(context, 'List all areas of Sadiqabad');
  assert.equal(areaList.areas.length, 80);
  assert.equal(areaList.areas[0].name, 'Area 0');

  const newsQuery = selectRelevantPublicKnowledge(context, 'Latest news kya hai?');
  assert.equal(newsQuery.news[0].content, 'Full article body');

  const siteQuery = selectRelevantPublicKnowledge(context, 'How do I use the FAQ on the website?');
  assert.equal(siteQuery.website_pages[0].content, 'Detailed FAQ answer');

  const ownerQuery = selectRelevantPublicKnowledge(context, 'Public owner profile details');
  assert.equal(ownerQuery.public_owner_profiles[0].display_name, 'Public Owner');
});

test('recognizes Roman Urdu knowledge intents', () => {
  const context = {
    categories: [],
    areas: [{ name: 'Model Town', slug: 'model-town', url: '/area/model-town' }],
    government_helplines: [],
    local_authorities: [{ name: 'Municipal Office', phone: '123' }],
    authority_profiles: [{ name: 'Public Official', biography: 'Biography' }],
    public_owner_profiles: [{ display_name: 'Public Owner' }],
    news: [{ title: 'Local news', content: 'Full local news body' }],
    website_pages: [{ title: 'Add Business', slug: 'add-business', url: '/add-business', content: 'How to add your business' }],
    products: [],
    offers: [],
    announcements: [],
    public_site_information: [],
    source_status: {},
  };

  assert.equal(selectRelevantPublicKnowledge(context, 'Sadiqabad ke ilaqay kon kon se hain').areas.length, 1);
  assert.equal(selectRelevantPublicKnowledge(context, 'aaj ki taza khabrain batao').news[0].content, 'Full local news body');
  assert.equal(selectRelevantPublicKnowledge(context, 'sarkari daftar ka number').local_authorities[0].phone, '123');
  assert.equal(selectRelevantPublicKnowledge(context, 'business kaise add karun?').website_pages[0].content, 'How to add your business');
  assert.equal(selectRelevantPublicKnowledge(context, 'maalik ki public profile').public_owner_profiles[0].display_name, 'Public Owner');
});

test('separates category intent from locality names sharing generic words', () => {
  const filters = resolvePublicDirectoryFilters(
    'restaurants in Ghalla Mandi',
    [
      { name_en: 'Ghalla Mandi', slug: 'ghalla-mandi', synonyms: [] },
      { name_en: 'Restaurants', slug: 'restaurants', synonyms: ['restaurant', 'food'] },
    ],
    [
      { name_en: 'Anaj Mandi', slug: 'anaj-mandi' },
      { name_en: 'Ghalla Mandi', slug: 'ghalla-mandi' },
    ],
  );
  assert.deepEqual(filters, { category: 'restaurants', area: 'ghalla-mandi' });
});

test('keeps the original subject when resolving follow-up questions', () => {
  assert.equal(
    resolveChatKnowledgeQuery([
      { role: 'user', content: 'Al-Buraq School Academy ka phone number batao' },
      { role: 'assistant', content: 'Al-Buraq School Academy...' },
      { role: 'user', content: 'aur iska address?' },
    ]),
    'Al-Buraq School Academy ka phone number batao aur iska address?',
  );

  assert.equal(
    resolveChatKnowledgeQuery([
      { role: 'user', content: 'restaurants in Ghalla Mandi' },
      { role: 'assistant', content: 'Yeh businesses milay...' },
      { role: 'user', content: 'aur phone number?' },
      { role: 'assistant', content: 'Kis business ka number chahiye?' },
      { role: 'user', content: 'opening hours bhi batao' },
    ]),
    'restaurants in Ghalla Mandi opening hours bhi batao',
  );
});

test('does not carry stale context into a new unrelated question', () => {
  assert.equal(
    resolveChatKnowledgeQuery([
      { role: 'user', content: 'hospitals in Model Town' },
      { role: 'assistant', content: 'Hospitals...' },
      { role: 'user', content: 'Sadiqabad ki latest news batao' },
    ]),
    'Sadiqabad ki latest news batao',
  );
});
