import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBusinessVCard } from './format';

test('buildBusinessVCard outputs valid vCard 3.0 with escaped special characters', () => {
  const vcf = buildBusinessVCard(
    {
      name_en: 'Al-Madina Mart, Sadiqabad; Wholesale',
      phone_primary: '+923008671234',
      phone_secondary: '0685741000',
      whatsapp: '+923008679999',
      email: 'info@almadina.pk',
      website_url: 'https://almadina.pk',
      address_en: 'Shop 12, Rail Bazaar, Sadiqabad',
      slug: 'al-madina-mart',
    },
    'https://hellosadiqabad.com'
  );

  assert.ok(vcf.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n'));
  assert.ok(vcf.includes('FN:Al-Madina Mart\\, Sadiqabad\\; Wholesale'));
  assert.ok(vcf.includes('TEL;TYPE=WORK,VOICE:+923008671234'));
  assert.ok(vcf.includes('TEL;TYPE=CELL:+923008679999'));
  assert.ok(vcf.includes('EMAIL;TYPE=WORK:info@almadina.pk'));
  assert.ok(vcf.includes('URL:https://hellosadiqabad.com/business/al-madina-mart'));
  assert.ok(vcf.endsWith('END:VCARD'));
});

import { isSafeGoogleMapsUrl } from './format';

test('Google Maps links accept supported HTTPS Google hosts', () => {
  assert.equal(isSafeGoogleMapsUrl('https://www.google.com/maps/place/Sadiqabad'), true);
  assert.equal(isSafeGoogleMapsUrl('https://maps.app.goo.gl/abc123'), true);
  assert.equal(isSafeGoogleMapsUrl('https://goo.gl/maps/abc123'), true);
});

test('Google Maps links reject insecure and lookalike hosts', () => {
  assert.equal(isSafeGoogleMapsUrl('http://www.google.com/maps'), false);
  assert.equal(isSafeGoogleMapsUrl('https://google.com.evil.example/maps'), false);
  assert.equal(isSafeGoogleMapsUrl('https://google.com@evil.example/maps'), false);
  assert.equal(isSafeGoogleMapsUrl('javascript:alert(1)'), false);
  assert.equal(isSafeGoogleMapsUrl('not a URL'), false);
  assert.equal(isSafeGoogleMapsUrl(null), false);
});
