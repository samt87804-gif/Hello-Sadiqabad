import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemapXml } from './sitemap';

test('buildSitemapXml emits canonical XML locations and valid lastmod dates', () => {
  const xml = buildSitemapXml([
    { path: '/', lastModified: '2026-11-17T12:30:00.000Z' },
    { path: '/business/al-madina-mart', lastModified: '2026-11-16T10:00:00.000Z' },
  ]);

  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://hellosadiqabad.com/</loc>'));
  assert.ok(xml.includes('<loc>https://hellosadiqabad.com/business/al-madina-mart</loc>'));
  assert.ok(xml.includes('<lastmod>2026-11-17</lastmod>'));
});

test('buildSitemapXml rejects external URLs, query variants and fragments', () => {
  const xml = buildSitemapXml([
    { path: '//evil.example/path' },
    { path: 'https://evil.example/path' },
    { path: '/search?q=doctor' },
    { path: '/business/example#reviews' },
    { path: '/business/safe-listing' },
  ]);

  assert.ok(xml.includes('https://hellosadiqabad.com/business/safe-listing'));
  assert.ok(!xml.includes('evil.example'));
  assert.ok(!xml.includes('/search?'));
  assert.ok(!xml.includes('#reviews'));
});

test('buildSitemapXml de-duplicates paths and omits invalid lastmod values', () => {
  const xml = buildSitemapXml([
    { path: '/news/community-update', lastModified: 'not-a-date' },
    { path: '/news/community-update', lastModified: '2026-11-15T00:00:00Z' },
    { path: '/news/community-update', lastModified: '2026-11-16T00:00:00Z' },
  ]);

  assert.equal(xml.split('<loc>https://hellosadiqabad.com/news/community-update</loc>').length - 1, 1);
  assert.ok(xml.includes('<lastmod>2026-11-16</lastmod>'));
});

test('filterIndexableTaxonomy excludes empty categories and thin areas', async () => {
  const { filterIndexableTaxonomy } = await import('./sitemap');
  const categories = [{ id: 'cat-a' }, { id: 'cat-empty' }];
  const areas = [{ id: 'area-a' }, { id: 'area-b' }, { id: 'area-thin' }];
  const businesses = [
    { category_id: 'cat-a', area_id: 'area-a' },
    { category_id: 'cat-a', area_id: 'area-a' },
    { category_id: 'cat-a', area_id: 'area-a' },
    { category_id: 'cat-a', area_id: 'area-b' },
    { category_id: 'cat-a', area_id: 'area-b' },
    { category_id: 'cat-a', area_id: 'area-b' },
    { category_id: 'cat-a', area_id: 'area-thin' },
  ];

  const filtered = filterIndexableTaxonomy(categories, areas, businesses);
  assert.deepEqual(filtered.categories.map((item) => item.id), ['cat-a']);
  assert.deepEqual(filtered.areas.map((item) => item.id), ['area-a', 'area-b']);
});
