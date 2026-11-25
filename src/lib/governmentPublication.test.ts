import test from 'node:test';
import assert from 'node:assert/strict';
import { getGovernmentPublicationErrors } from './governmentPublication';

const complete = {
  titleUr: 'سرکاری پروگرام',
  summaryEn: 'An official programme summary with enough detail.',
  summaryUr: 'یہ ایک سرکاری پروگرام کی مکمل تفصیل ہے۔',
  imageUrl: 'https://hellosadiqabad.com/storage/v1/object/public/Hello%20Sadiqabad/government-schemes/admin/poster.webp',
  sourceName: 'Official Government Department',
  sourceUrl: 'https://www.punjab.gov.pk/',
  verifiedAt: '2026-11-25T12:00:00+05:00',
};

test('government content publication passes with bilingual verified content and poster', () => {
  assert.deepEqual(getGovernmentPublicationErrors(complete), []);
});

test('government content publication requires Urdu title and summary', () => {
  const errors = getGovernmentPublicationErrors({ ...complete, titleUr: '', summaryUr: '' });
  assert.ok(errors.some((error) => error.includes('Urdu title')));
  assert.ok(errors.some((error) => error.includes('Urdu summary')));
});

test('government content publication requires an official poster and verified HTTPS source', () => {
  const errors = getGovernmentPublicationErrors({ ...complete, imageUrl: null, sourceUrl: 'http://example.com' });
  assert.ok(errors.some((error) => error.includes('poster image')));
  assert.ok(errors.some((error) => error.includes('official HTTPS source')));
});

test('government content publication requires meaningful English and Urdu summaries', () => {
  const errors = getGovernmentPublicationErrors({ ...complete, summaryEn: 'Too short', summaryUr: 'مختصر' });
  assert.ok(errors.some((error) => error.includes('English summary')));
  assert.ok(errors.some((error) => error.includes('Urdu summary')));
});
