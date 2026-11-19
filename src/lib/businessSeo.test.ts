import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBusinessJsonLd,
  buildBusinessSeoMetadata,
  safeBusinessImageUrl,
  serializeBusinessJsonLd,
} from './businessSeo';

const business = {
  name_en: 'Al-Madina Medical Store',
  name_ur: 'المدینہ میڈیکل اسٹور',
  slug: 'al-madina-medical-store',
  description_en: 'Medicines, health products and pharmacy services in Sadiqabad.',
  logo_url: 'https://images.example.test/logo.webp',
  cover_url: 'https://images.example.test/cover.webp',
  address_en: 'Main Bazar, Sadiqabad',
  phone_primary: '03001234567',
};

test('business SEO metadata uses the requested title pattern and cover image first', () => {
  const metadata = buildBusinessSeoMetadata(business);
  assert.equal(metadata.title, 'Al-Madina Medical Store — Sadiqabad | Hello Sadiqabad');
  assert.equal(metadata.canonicalUrl, 'https://hellosadiqabad.com/business/al-madina-medical-store');
  assert.equal(metadata.image, 'https://images.example.test/cover.webp');
  assert.match(metadata.description, /Medicines, health products/);
});

test('business SEO metadata falls back safely when description and images are absent', () => {
  const metadata = buildBusinessSeoMetadata({
    name_en: 'Example Shop',
    slug: 'example-shop',
    description_en: null,
    description_ur: null,
    logo_url: 'http://insecure.example/logo.png',
    cover_url: null,
  });
  assert.match(metadata.description, /available contact details, location, opening hours/);
  assert.equal(metadata.image, 'https://hellosadiqabad.com/site-logo.png');
});

test('custom SEO title and description are preserved with a site brand suffix', () => {
  const metadata = buildBusinessSeoMetadata({
    ...business,
    meta_title_en: 'Al-Madina Pharmacy',
    meta_description_en: 'Custom verified description.',
  });
  assert.equal(metadata.title, 'Al-Madina Pharmacy | Hello Sadiqabad');
  assert.equal(metadata.description, 'Custom verified description.');
});

test('unsafe image URLs are rejected', () => {
  assert.equal(safeBusinessImageUrl('javascript:alert(1)'), null);
  assert.equal(safeBusinessImageUrl('http://example.test/image.png'), null);
  assert.equal(safeBusinessImageUrl('https://user:pass@example.test/image.png'), null);
  assert.equal(safeBusinessImageUrl('https://example.test/image.png'), 'https://example.test/image.png');
});

test('business JSON-LD contains factual directory details without fabricated ratings or coordinates', () => {
  const metadata = buildBusinessSeoMetadata(business);
  const jsonLd = buildBusinessJsonLd(business, metadata);
  const graph = jsonLd['@graph'] as Array<Record<string, unknown>>;
  const localBusiness = graph[0];
  assert.equal(localBusiness['@type'], 'LocalBusiness');
  assert.equal(localBusiness.name, 'Al-Madina Medical Store');
  assert.equal(localBusiness.telephone, '+923001234567');
  assert.deepEqual(localBusiness.address, {
    '@type': 'PostalAddress',
    streetAddress: 'Main Bazar, Sadiqabad',
    addressLocality: 'Sadiqabad',
    addressRegion: 'Punjab',
    addressCountry: 'PK',
  });
  assert.equal('aggregateRating' in localBusiness, false);
  assert.equal('geo' in localBusiness, false);
});

test('JSON-LD serialization escapes HTML-sensitive characters', () => {
  const serialized = serializeBusinessJsonLd({ description: '</script><script>alert(1)</script>' });
  assert.ok(!serialized.includes('</script>'));
  assert.ok(serialized.includes('\\u003c/script\\u003e'));
});
