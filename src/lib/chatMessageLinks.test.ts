import test from 'node:test';
import assert from 'node:assert/strict';
import { parseChatMessageContent } from './chatMessageLinks';

test('turns canonical directory URLs into safe clickable link parts', () => {
  assert.deepEqual(
    parseChatMessageContent('Business details: https://hellosadiqabad.com/business/sample-shop.'),
    [
      { type: 'text', value: 'Business details: ' },
      { type: 'link', label: 'https://hellosadiqabad.com/business/sample-shop', url: 'https://hellosadiqabad.com/business/sample-shop' },
      { type: 'text', value: '.' },
    ],
  );
});

test('supports model-generated Markdown links', () => {
  assert.deepEqual(
    parseChatMessageContent('[Al-Buraq School](https://hellosadiqabad.com/business/al-buraq-school)'),
    [{ type: 'link', label: 'Al-Buraq School', url: 'https://hellosadiqabad.com/business/al-buraq-school' }],
  );
});

test('does not convert unsafe or non-HTTP schemes into links', () => {
  assert.deepEqual(
    parseChatMessageContent('javascript:alert(1) and ftp://example.com/file'),
    [{ type: 'text', value: 'javascript:alert(1) and ftp://example.com/file' }],
  );
});
