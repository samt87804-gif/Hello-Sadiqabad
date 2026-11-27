import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessSlugAliasMap, resolveBusinessBySlug, VERIFIED_LEGACY_BUSINESS_SLUGS } from './businessSlugAliases';

const published = [
  { id: 'business-1', slug: 'old-cafe-abc' },
  { id: 'business-2', slug: 'old-clinic-def' },
];

test('maps a historical snapshot slug to its current published business slug', () => {
  const aliases = buildBusinessSlugAliasMap([{ slug: 'old-cafe', databaseId: 'business-1' }], published);
  assert.equal(aliases.get('old-cafe'), 'old-cafe-abc');
  assert.equal(resolveBusinessBySlug(published, 'old-cafe', aliases)?.id, 'business-1');
});

test('does not resolve aliases without a currently published database row', () => {
  const aliases = buildBusinessSlugAliasMap([{ slug: 'hidden-business', databaseId: 'not-published' }], published);
  assert.equal(aliases.has('hidden-business'), false);
  assert.equal(resolveBusinessBySlug(published, 'hidden-business', aliases), null);
});

test('ignores ambiguous legacy slugs that point to multiple published businesses', () => {
  const aliases = buildBusinessSlugAliasMap([
    { slug: 'shared-old-slug', databaseId: 'business-1' },
    { slug: 'shared-old-slug', databaseId: 'business-2' },
  ], published);
  assert.equal(aliases.has('shared-old-slug'), false);
});

test('current canonical slug takes precedence over a conflicting historical alias', () => {
  const businesses = [{ id: 'canonical-owner', slug: 'shared-slug' }, { id: 'legacy-target', slug: 'new-slug' }];
  assert.equal(resolveBusinessBySlug(businesses, 'shared-slug', new Map([['shared-slug', 'new-slug']]))?.id, 'canonical-owner');
});

test('does not return an alias target absent from the published collection', () => {
  assert.equal(resolveBusinessBySlug(published, 'old-slug', new Map([['old-slug', 'removed-slug']])), null);
});


test('resolves the verified Inspire legacy URL only to its currently published business ID', () => {
  const liveBusiness = [{ id: '0d14d4af-6434-4b3c-aec3-3de0bb669a51', slug: 'the-inspire-business-academy-sadiqabad-1h0' }];
  const aliases = buildBusinessSlugAliasMap(VERIFIED_LEGACY_BUSINESS_SLUGS, liveBusiness);
  assert.equal(aliases.get('the-inspire-business-academy-sadiqabad-4x0'), 'the-inspire-business-academy-sadiqabad-1h0');
  assert.equal(resolveBusinessBySlug(liveBusiness, 'the-inspire-business-academy-sadiqabad-4x0', aliases)?.id, liveBusiness[0].id);
  assert.equal(buildBusinessSlugAliasMap(VERIFIED_LEGACY_BUSINESS_SLUGS, []).has('the-inspire-business-academy-sadiqabad-4x0'), false);
});
