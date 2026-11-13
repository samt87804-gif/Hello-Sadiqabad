import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  formatPkPhoneDisplay,
  isValidHttpsUrl,
  normalizePkPhone,
} from './phone';

test('normalizes Pakistani mobile and landline numbers to +92 format', () => {
  assert.equal(normalizePkPhone('0300-8671234'), '+923008671234');
  assert.equal(normalizePkPhone('0092 301 7778899'), '+923017778899');
  assert.equal(normalizePkPhone('+923029991122'), '+923029991122');
  assert.equal(normalizePkPhone('1122'), '1122');
});

test('formats local display numbers cleanly', () => {
  assert.equal(formatPkPhoneDisplay('+923008671234'), '0300-8671234');
  assert.equal(formatPkPhoneDisplay('0685741234'), '068-5741234');
});

test('builds tel and WhatsApp URLs correctly', () => {
  assert.equal(buildTelUrl('0300-8671234'), 'tel:+923008671234');
  assert.equal(buildWhatsAppUrl('0300-8671234'), 'https://wa.me/923008671234');
});

test('validates HTTPS URLs strictly and rejects HTTP or oversized URLs', () => {
  assert.equal(isValidHttpsUrl('https://hellosadiqabad.com/logo.png'), true);
  assert.equal(isValidHttpsUrl('http://hellosadiqabad.com/logo.png'), false);
  assert.equal(isValidHttpsUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpsUrl('https://example.com/' + 'a'.repeat(500)), false);
});
