import assert from 'node:assert/strict';
import test from 'node:test';
import {
  submitPublicInquiry,
  submitPublicReview,
  submitPublicSuggestion,
  trackAdImpression,
  trackBusinessEvent,
} from './api';

test('public writes and telemetry are not queued or marked successful while offline', async () => {
  const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  const originalOnlineDescriptor = Object.getOwnPropertyDescriptor(navigator, 'onLine');
  const originalSessionStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  let sessionStorageWrites = 0;

  Object.defineProperty(navigator, 'onLine', { configurable: true, value: false });
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem: () => null,
      setItem: () => { sessionStorageWrites += 1; },
      removeItem: () => undefined,
    },
  });

  try {
    const [review, inquiry, suggestion] = await Promise.all([
      submitPublicReview({
        business_id: 'business-test',
        author_name: 'Offline Test',
        rating: 5,
        comment: 'This must not be sent.',
      }),
      submitPublicInquiry({
        business_id: 'business-test',
        name: 'Offline Test',
        phone: '03000000000',
        message: 'This must not be sent.',
      }),
      submitPublicSuggestion({
        type: 'correction',
        business_id: 'business-test',
        payload: { note: 'This must not be saved.' },
      }),
    ]);

    for (const result of [review, inquiry, suggestion]) {
      assert.equal(result.ok, false);
      assert.match(result.error ?? '', /not been sent or saved/i);
    }

    await trackBusinessEvent('business-test', 'view');
    await trackAdImpression('ad-test');
    assert.equal(sessionStorageWrites, 0);
  } finally {
    if (originalOnlineDescriptor) {
      Object.defineProperty(navigator, 'onLine', originalOnlineDescriptor);
    } else {
      delete (navigator as unknown as { onLine?: boolean }).onLine;
    }
    if (originalSessionStorageDescriptor) {
      Object.defineProperty(globalThis, 'sessionStorage', originalSessionStorageDescriptor);
    } else {
      delete (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage;
    }
    if (originalNavigatorDescriptor) {
      Object.defineProperty(globalThis, 'navigator', originalNavigatorDescriptor);
    }
  }
});
