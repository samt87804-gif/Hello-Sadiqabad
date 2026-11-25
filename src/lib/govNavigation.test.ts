import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GOV_SECTIONS } from './govNavigation';

describe('Gov landing directory links', () => {
  it('contains the four approved existing public directories exactly once', () => {
    assert.deepEqual(GOV_SECTIONS.map((section) => section.to), [
      '/government-jobs',
      '/government-schemes',
      '/local-authorities',
      '/authority-profiles',
    ]);
    assert.equal(new Set(GOV_SECTIONS.map((section) => section.to)).size, 4);
  });

  it('provides English and Urdu labels and descriptions for every card', () => {
    for (const section of GOV_SECTIONS) {
      assert.ok(section.titleEn.trim());
      assert.ok(section.titleUr.trim());
      assert.ok(section.descriptionEn.trim());
      assert.ok(section.descriptionUr.trim());
    }
  });
});
