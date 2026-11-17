import assert from 'node:assert/strict';
import test from 'node:test';
import type { OfflineArea, OfflineBusiness, OfflineCategory, OfflineEmergencyContact } from './offlineDirectory';
import {
  offlineAreaToRow,
  offlineBusinessToPublicView,
  offlineCategoryToRow,
  offlineEmergencyContactToRow,
} from './offlineDirectoryAdapters';

const category: OfflineCategory = {
  id: 'cat-1', name_en: 'Food', name_ur: 'کھانا', slug: 'food', parent_id: null,
  icon: 'Store', color: '#000000', sort_order: 1, synonyms: ['restaurant'],
};
const area: OfflineArea = { id: 'area-1', name_en: 'City Centre', name_ur: 'مرکز', slug: 'city-centre' };
const business: OfflineBusiness = {
  id: 'business-1', name_en: 'Example Restaurant', name_ur: null, slug: 'example-restaurant',
  category_id: category.id, area_id: area.id, address_en: 'Main Road', address_ur: null,
  landmark_en: null, landmark_ur: null, lat: 28.3, lng: 70.1, phone_primary: '03001234567',
  phone_secondary: null, whatsapp: null, website_url: null, facebook_url: null, instagram_url: null,
  youtube_url: null, tiktok_url: null, description_en: null, description_ur: null,
  services_en: [], services_ur: [], logo_url: null, cover_url: null, gallery_urls: [], video_urls: [],
  opening_hours: null, is_open_24h: false, home_delivery: false, established_year: null,
  status: 'published', plan_code: 'free', is_verified: false, is_featured: false, tags: [],
  meta_title_en: null, meta_description_en: null, rating_avg: null, rating_count: 0,
  created_at: '2026-11-17T00:00:00.000Z', updated_at: '2026-11-17T00:00:00.000Z',
  category, area, active_offers: [], approved_reviews: [],
};
const emergency: OfflineEmergencyContact = {
  id: 'emergency-1', name_en: 'Rescue', name_ur: 'ریسکیو', phone: '1122',
  category: 'emergency', icon: 'phone', sort_order: 1, description_en: null,
  description_ur: null, whatsapp: null, source_url: null, verified_at: null,
};

test('offline business adapter restores public directory shape without private account fields', () => {
  const result = offlineBusinessToPublicView(business);
  assert.equal(result.name_en, 'Example Restaurant');
  assert.equal(result.phone_normalized, '03001234567');
  assert.equal(result.category?.slug, 'food');
  assert.equal(result.area?.slug, 'city-centre');
  assert.equal(result.owner_id, null);
  assert.equal(result.email, null);
  assert.equal(result.source, 'offline_snapshot');
});

test('offline category and area adapters mark snapshot rows active', () => {
  assert.equal(offlineCategoryToRow(category).is_active, true);
  assert.equal(offlineAreaToRow(area).is_active, true);
});

test('offline emergency adapter restores only the public contact shape', () => {
  const result = offlineEmergencyContactToRow(emergency);
  assert.equal(result.phone, '1122');
  assert.equal(result.is_active, true);
  assert.equal(result.city_id, '');
});
