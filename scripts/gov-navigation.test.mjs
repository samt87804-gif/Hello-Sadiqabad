import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const sections = read('../src/lib/govNavigation.ts');
const page = read('../src/pages/Gov.tsx');
const app = read('../src/App.tsx');
const sitemap = read('../functions/sitemap.xml.js');

test('Gov landing links to the four existing directory routes exactly once', () => {
  const routes = [...sections.matchAll(/to: '([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(routes, [
    '/government-jobs',
    '/government-schemes',
    '/local-authorities',
    '/authority-profiles',
  ]);
  assert.equal(new Set(routes).size, 4);
});

test('each Gov card has English and Urdu titles and descriptions', () => {
  const blocks = sections.split(/\n  \},\n/);
  for (const route of ['/government-jobs', '/government-schemes', '/local-authorities', '/authority-profiles']) {
    const block = blocks.find((item) => item.includes(`to: '${route}'`));
    assert.ok(block, `missing section for ${route}`);
    for (const field of ['titleEn', 'titleUr', 'descriptionEn', 'descriptionUr']) {
      assert.match(block, new RegExp(`${field}: '[^']+'`), `${route} missing ${field}`);
    }
  }
});

test('Gov landing is routed publicly, renders section links and sets canonical SEO', () => {
  assert.match(app, /<Route path="\/gov" element={<Gov \/>} \/>/);
  assert.match(page, /GOV_SECTIONS\.map/);
  assert.match(page, /canonicalPath: '\/gov'/);
  assert.match(page, /aria-label={title}/);
});

test('Gov landing remains included in public sitemap', () => {
  assert.match(sitemap, /const entries = \[\{ path: '\/' \}, \{ path: '\/gov' \}\]/);
});
