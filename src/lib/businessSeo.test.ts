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
  assert.match(metadata.description, /available contact details, location/);
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

test('fallback SEO metadata uses verified category and area for concise local intent', () => {
  const metadata = buildBusinessSeoMetadata({
    name_en: 'Example Academy',
    slug: 'example-academy',
    description_en: 'Computer courses and practical training.',
    category: { name_en: 'Academy' },
    area: { name_en: 'Mahar Abad' },
  });
  assert.match(metadata.title, /Academy in Mahar Abad, Sadiqabad/);
  assert.match(metadata.description, /Example Academy, listed under Academy in Mahar Abad, Sadiqabad/);
  assert.match(metadata.description, /Computer courses and practical training/);
});

test('fallback SEO metadata avoids repeating identical category and area labels', () => {
  const metadata = buildBusinessSeoMetadata({
    name_en: 'Sakhawat Traders',
    slug: 'sakhawat-traders',
    category: { name_en: 'Ghalla Mandi' },
    area: { name_en: 'Ghalla Mandi' },
  });
  assert.match(metadata.title, /Ghalla Mandi, Sadiqabad/);
  assert.doesNotMatch(metadata.title, /Ghalla Mandi in Ghalla Mandi/);
  assert.match(metadata.description, /listed under Ghalla Mandi, Sadiqabad/);
  assert.doesNotMatch(metadata.description, /Ghalla Mandi in Ghalla Mandi/);
});

test('custom SEO description remains authoritative over generated fallback copy', () => {
  const metadata = buildBusinessSeoMetadata({
    ...business,
    meta_description_en: 'Owner-approved SEO description.',
    category: { name_en: 'Pharmacy' },
    area: { name_en: 'Main Bazar' },
  });
  assert.equal(metadata.description, 'Owner-approved SEO description.');
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
  assert.equal('telephone' in localBusiness, true);
  assert.equal('geo' in localBusiness, false);
});

test('JSON-LD serialization escapes HTML-sensitive characters', () => {
  const serialized = serializeBusinessJsonLd({ description: '</script><script>alert(1)</script>' });
  assert.ok(!serialized.includes('</script>'));
  assert.ok(serialized.includes('\\u003c/script\\u003e'));
});
