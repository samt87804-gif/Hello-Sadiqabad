import test from 'node:test';
import assert from 'node:assert/strict';
import { onRequest as jobDetailPreview } from '../functions/sdk-jobs/[slug].js';
import { onRequest as jobsListingPreview } from '../functions/sdk-jobs/index.js';

const job = {
  slug: 'sample-vacancy',
  title_en: 'Customer Support Assistant',
  title_ur: 'کسٹمر سپورٹ اسسٹنٹ',
  summary_en: 'A local full-time vacancy.',
  summary_ur: null,
  description_en: 'Provide customer support and maintain records.',
  qualifications_en: 'Intermediate or equivalent.',
  experience_en: 'Fresh candidates may apply.',
  job_type: 'Full-time',
  work_location_en: 'Main Market',
  area_name_en: 'Model Town',
  image_url: 'https://example.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/sdk-jobs/sample-vacancy/poster.webp',
  published_at: '2026-11-25T10:00:00.000Z',
  closing_date: '2026-12-15',
};

function htmlResponse() {
  return new Response('<!doctype html><html><head><title>Hello Sadiqabad</title><meta property="og:title" content="Old title"></head><body>SPA</body></html>', {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

test('SDK Jobs social preview uses only the published public projection and never emits employer identity', async () => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  globalThis.fetch = async (url) => {
    requestedUrl = new URL(String(url));
    return new Response(JSON.stringify([job]), { headers: { 'content-type': 'application/json' } });
  };
  try {
    const response = await jobDetailPreview({
      request: new Request('https://hellosadiqabad.com/sdk-jobs/sample-vacancy', { headers: { 'user-agent': 'WhatsApp/2.26' } }),
      env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test-key' },
      params: { slug: 'sample-vacancy' },
      next: async () => htmlResponse(),
    });
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /og:title/);
    assert.match(html, /Customer Support Assistant — SDK Jobs/);
    assert.match(html, /og:image/);
    assert.match(html, /sdk-jobs\/sample-vacancy/);
    assert.match(html, /Confidential local employer/);
    assert.match(html, /JobPosting/);
    assert.doesNotMatch(html, /employer_owner_id|source_business_id|owner_feedback|pending_media_path|owner@example\.com|03001234567/);
    const selected = requestedUrl.searchParams.get('select') || '';
    assert.match(selected, /title_en/);
    assert.match(selected, /image_url/);
    assert.doesNotMatch(selected, /employer_owner_id|source_business_id|owner_feedback|pending_media_path|phone|email|business_name/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('SDK Jobs social preview returns a noindex 404 for a job absent from the public projection', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('[]', { headers: { 'content-type': 'application/json' } });
  try {
    const response = await jobDetailPreview({
      request: new Request('https://hellosadiqabad.com/sdk-jobs/not-published', { headers: { 'user-agent': 'facebookexternalhit/1.1' } }),
      env: { VITE_SUPABASE_URL: 'https://example.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'public-test-key' },
      params: { slug: 'not-published' },
      next: async () => htmlResponse(),
    });
    assert.equal(response.status, 404);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, follow');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('non-crawler SDK Jobs requests pass through without a metadata lookup', async () => {
  const originalFetch = globalThis.fetch;
  let called = false;
  globalThis.fetch = async () => { called = true; throw new Error('fetch should not run'); };
  try {
    const response = await jobDetailPreview({
      request: new Request('https://hellosadiqabad.com/sdk-jobs/sample-vacancy', { headers: { 'user-agent': 'Mozilla/5.0' } }),
      env: {},
      params: { slug: 'sample-vacancy' },
      next: async () => htmlResponse(),
    });
    assert.equal(response.status, 200);
    assert.equal(called, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('SDK Jobs listing social preview has a privacy-safe static title and canonical URL', async () => {
  const response = await jobsListingPreview({
    request: new Request('https://hellosadiqabad.com/sdk-jobs', { headers: { 'user-agent': 'WhatsApp/2.26' } }),
    next: async () => htmlResponse(),
  });
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(html, /SDK Jobs — Local Vacancies in Sadiqabad/);
  assert.match(html, /https:\/\/hellosadiqabad\.com\/sdk-jobs/);
  assert.doesNotMatch(html, /owner@example\.com|03001234567|source_business_id|employer_owner_id/);
});
