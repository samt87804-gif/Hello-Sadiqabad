import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { attachPublicOffers, getDefaultOfferExpiryDate } from './offers';

describe('attachPublicOffers', () => {
  const today = '2026-11-14';
  const business = { id: 'business-1', name: 'Test Shop' };
  const offer = {
    id: 'offer-1',
    business_id: 'business-1',
    title: 'Weekend discount',
    status: 'active',
    valid_from: '2026-11-01',
    valid_to: '2026-11-30',
  };

  it('joins valid offers to their public business profile', () => {
    const result = attachPublicOffers([offer], [business], today);
    assert.equal(result.length, 1);
    assert.equal(result[0].business.name, 'Test Shop');
  });

  it('excludes expired, upcoming, paused, and orphaned offers', () => {
    const result = attachPublicOffers([
      offer,
      { ...offer, id: 'expired', valid_to: '2026-11-13' },
      { ...offer, id: 'upcoming', valid_from: '2026-11-15' },
      { ...offer, id: 'paused', status: 'paused' },
      { ...offer, id: 'orphaned', business_id: 'missing-business' },
    ], [business], today);
    assert.deepEqual(result.map((item) => item.id), ['offer-1']);
  });
});


describe('getDefaultOfferExpiryDate', () => {
  it('defaults to 30 calendar days after the Pakistan-local current date', () => {
    assert.equal(getDefaultOfferExpiryDate('2026-11-27'), '2026-12-27');
  });

  it('handles month boundaries and leap years', () => {
    assert.equal(getDefaultOfferExpiryDate('2026-12-20'), '2027-01-19');
    assert.equal(getDefaultOfferExpiryDate('2028-01-31'), '2028-03-01');
  });
});
