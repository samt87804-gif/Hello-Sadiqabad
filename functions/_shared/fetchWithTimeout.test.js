import assert from 'node:assert/strict';
import test from 'node:test';
import { fetchWithTimeout } from './fetchWithTimeout.js';

test('fetchWithTimeout aborts an upstream request at its configured deadline', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (_input, { signal }) => new Promise((_, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  try {
    await assert.rejects(fetchWithTimeout('https://upstream.example.test', {}, 10), { name: 'TimeoutError' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('fetchWithTimeout preserves caller cancellation', async () => {
  const originalFetch = globalThis.fetch;
  const controller = new AbortController();
  globalThis.fetch = (_input, { signal }) => new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  try {
    const pending = fetchWithTimeout('https://upstream.example.test', { signal: controller.signal }, 1000);
    controller.abort(new DOMException('Cancelled by caller', 'AbortError'));
    await assert.rejects(pending, { name: 'AbortError' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
