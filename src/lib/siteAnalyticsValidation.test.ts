import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateSiteAnalyticsEnvelope } from '../../supabase/functions/_shared/siteAnalyticsValidation';

const uuid = '550e8400-e29b-41d4-a716-446655440000';
function event(overrides: Record<string, unknown> = {}) {
  return {
    event_id: uuid,
    visitor_id: '550e8400-e29b-41d4-a716-446655440001',
    session_id: '550e8400-e29b-41d4-a716-446655440002',
    event_name: 'page_view',
    page_path: '/',
    ...overrides,
  };
}

describe('Site analytics collector envelope validation', () => {
  it('accepts a minimal page view and normalizes optional fields', () => {
    const result = validateSiteAnalyticsEnvelope(event());
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.eventName, 'page_view');
      assert.equal(result.value.activeSeconds, 0);
      assert.equal(result.value.resultsCount, null);
      assert.equal(result.value.entityType, null);
      assert.equal(result.value.entityId, null);
    }
  });

  it('rejects unknown fields, including accidental personal-data fields', () => {
    for (const key of ['email', 'phone', 'name', 'ip_address', 'user_id', 'raw_query']) {
      const result = validateSiteAnalyticsEnvelope(event({ [key]: 'must-not-be-collected' }));
      assert.equal(result.ok, false, key);
    }
  });

  it('rejects invalid event names and malformed pseudonymous identifiers', () => {
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'custom_event' })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_id: 'bad' })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ visitor_id: null })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ session_id: 'not-a-uuid' })).ok, false);
  });

  it('enforces bounded engagement duration and search result counts', () => {
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'engagement', active_seconds: 0 })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'engagement', active_seconds: 31 })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'engagement', active_seconds: 3 })).ok, true);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'search_summary' })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'search_summary', results_count: -1 })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'search_summary', results_count: 100001 })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ event_name: 'search_summary', results_count: 0 })).ok, true);
  });

  it('accepts only supported content references', () => {
    assert.equal(validateSiteAnalyticsEnvelope(event({ entity_type: 'business', entity_id: uuid })).ok, true);
    assert.equal(validateSiteAnalyticsEnvelope(event({ entity_type: 'user', entity_id: uuid })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ entity_id: uuid })).ok, false);
    assert.equal(validateSiteAnalyticsEnvelope(event({ entity_type: 'business', entity_id: 'invalid' })).ok, false);
  });
});
