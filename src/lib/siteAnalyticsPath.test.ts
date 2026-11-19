import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifySiteAnalyticsPath } from '../../supabase/functions/_shared/siteAnalyticsPath';

describe('Site analytics public route allowlist', () => {
  it('classifies supported static and content routes', () => {
    assert.deepEqual(classifySiteAnalyticsPath('/'), { path: '/', pageType: 'home' });
    assert.deepEqual(classifySiteAnalyticsPath('/business/example-shop'), { path: '/business/example-shop', pageType: 'business' });
    assert.deepEqual(classifySiteAnalyticsPath('/news/local-update'), { path: '/news/local-update', pageType: 'news' });
    assert.deepEqual(classifySiteAnalyticsPath('/area/model-town'), { path: '/area/model-town', pageType: 'area' });
  });

  it('excludes private, authentication and unrecognized application routes', () => {
    for (const path of ['/admin', '/admin/analytics', '/owner', '/owner/dashboard', '/login', '/auth/callback', '/api/chat', '/unknown']) {
      assert.equal(classifySiteAnalyticsPath(path), null, path);
    }
  });

  it('rejects query strings, fragments, absolute URLs, traversal and malformed paths', () => {
    for (const path of ['/search?q=phone', '/news/story#comments', 'https://hellosadiqabad.com/', '//example.com/path', '/business/../admin', '/business/UpperCase', '/', '']) {
      if (path === '/') continue;
      assert.equal(classifySiteAnalyticsPath(path), null, path);
    }
    assert.equal(classifySiteAnalyticsPath(null), null);
    assert.equal(classifySiteAnalyticsPath('/'.padEnd(514, 'a')), null);
  });
});
