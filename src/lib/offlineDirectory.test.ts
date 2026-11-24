import assert from 'node:assert/strict';
import test from 'node:test';
import type { BusinessPublicView } from '../types/directory';
import {
  OFFLINE_DIRECTORY_SCHEMA_VERSION,
  toOfflineBusiness,
  toOfflineCategory,
  validateOfflineDirectorySnapshot,
  type OfflineDirectorySnapshot,
} from './offlineDirectory';

function createBusiness(overrides: Record<string, unknown> = {}): BusinessPublicView {
  return {
    id: 'business-1',
    owner_id: 'private-owner-id',
    created_by: 'private-creator-id',
    updated_by: 'private-updater-id',
    assigned_to: 'private-assignee-id',
    claimed_at: '2026-11-01T00:00:00.000Z',
    email: 'private@example.com',
    name_en: 'Example Store',
    name_ur: 'مثالی دکان',
    slug: 'example-store',
    category_id: 'category-1',
    area_id: 'area-1',
    address_en: 'Main Road',
    address_ur: null,
    landmark_en: null,
    landmark_ur: null,
    lat: 28.3,
    lng: 70.1,
    phone_primary: '03001234567',
    phone_secondary: null,
    phone_normalized: '03001234567',
    whatsapp: null,
    website_url: null,
    facebook_url: null,
    instagram_url: null,
    youtube_url: null,
    tiktok_url: null,
    description_en: 'Public description',
    description_ur: null,
    services_en: ['Retail'],
    services_ur: [],
    logo_url: null,
    cover_url: null,
    gallery_urls: [],
    video_urls: [],
    opening_hours: null,
    is_open_24h: false,
    home_delivery: false,
    established_year: null,
    status: 'published',
    rejection_reason: null,
    plan_code: 'free',
    plan_expires_at: null,
    is_verified: false,
    is_featured: false,
    tags: ['Retail'],
    meta_title_en: null,
    meta_description_en: null,
    rating_avg: null,
    rating_count: 0,
    view_count: 0,
    call_count: 0,
    whatsapp_count: 0,
    source: 'test',
    published_at: '2026-11-01T00:00:00.000Z',
    created_at: '2026-11-01T00:00:00.000Z',
    updated_at: '2026-11-01T00:00:00.000Z',
    category: null,
    area: null,
    plan: null,
    active_offers: [],
    approved_reviews: [],
    ...overrides,
  } as unknown as BusinessPublicView;
}

function createSnapshot(): OfflineDirectorySnapshot {
  return {
    schema_version: OFFLINE_DIRECTORY_SCHEMA_VERSION,
    downloaded_at: '2026-11-17T12:00:00.000Z',
    businesses: [toOfflineBusiness(createBusiness())],
    categories: [],
    areas: [],
    emergency_contacts: [],
  };
}

test('offline business mapper keeps public fields and strips owner and account fields', () => {
  const business = toOfflineBusiness(createBusiness());
  assert.equal(business.id, 'business-1');
  assert.equal(business.name_en, 'Example Store');
  assert.equal(business.phone_primary, '03001234567');
  assert.equal('owner_id' in business, false);
  assert.equal('created_by' in business, false);
  assert.equal('updated_by' in business, false);
  assert.equal('assigned_to' in business, false);
  assert.equal('claimed_at' in business, false);
  assert.equal('email' in business, false);
  assert.equal('rejection_reason' in business, false);
  assert.equal('view_count' in business, false);
});

test('a complete core public snapshot passes validation', () => {
  assert.equal(validateOfflineDirectorySnapshot(createSnapshot()), true);
});

test('snapshot validation rejects unknown schema versions', () => {
  const snapshot = createSnapshot();
  snapshot.schema_version = OFFLINE_DIRECTORY_SCHEMA_VERSION + 1;
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('snapshot validation rejects private fields even if a caller tries to add them', () => {
  const snapshot = createSnapshot();
  (snapshot.businesses[0] as unknown as Record<string, unknown>).owner_id = 'private-owner-id';
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('snapshot validation rejects duplicate business identifiers', () => {
  const snapshot = createSnapshot();
  snapshot.businesses.push({ ...snapshot.businesses[0] });
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('snapshot validation rejects unpublished businesses', () => {
  const snapshot = createSnapshot();
  (snapshot.businesses[0] as unknown as { status: string }).status = 'draft';
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('unpublished businesses cannot be mapped into the offline package', () => {
  assert.throws(
    () => toOfflineBusiness(createBusiness({ status: 'draft' })),
    /Only published businesses/
  );
});

test('inactive categories cannot be mapped into the offline package', () => {
  assert.throws(
    () => toOfflineCategory({
      id: 'category-1',
      name_en: 'Private draft category',
      name_ur: '',
      slug: 'private-draft-category',
      parent_id: null,
      icon: 'Store',
      color: '#000000',
      sort_order: 1,
      synonyms: [],
      is_active: false,
      created_at: '',
      updated_at: '',
    }),
    /Only active public categories/
  );
});


test('snapshot validation rejects malformed nested public rows', () => {
  const snapshot = createSnapshot();
  (snapshot.businesses[0] as unknown as { services_en: unknown }).services_en = 'not-an-array';
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('snapshot validation rejects an offer attached to another business', () => {
  const snapshot = createSnapshot();
  snapshot.businesses[0].active_offers.push({
    id: 'offer-1',
    business_id: 'another-business',
    title: 'Public offer',
    description: null,
    image_url: null,
    valid_from: '2026-11-01',
    valid_to: '2026-11-30',
  });
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('snapshot validation rejects malformed emergency contact records', () => {
  const snapshot = createSnapshot();
  (snapshot.emergency_contacts as unknown[]).push({
    id: 'contact-1',
    name_en: 'Emergency',
    name_ur: 'ایمرجنسی',
    phone: 1122,
    category: 'rescue',
    icon: 'phone',
    sort_order: 1,
    description_en: null,
    description_ur: null,
    whatsapp: null,
    source_url: null,
    verified_at: null,
  });
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});

test('snapshot validation rejects nested private fields in public content', () => {
  const snapshot = createSnapshot();
  (snapshot.businesses[0].approved_reviews as unknown as Record<string, unknown>[]).push({
    id: 'review-1',
    business_id: 'business-1',
    author_name: 'Public visitor',
    rating: 5,
    comment: 'Good',
    owner_reply: null,
    owner_reply_at: null,
    created_at: '2026-11-17T12:00:00.000Z',
    email: 'private@example.com',
  });
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});


test('offline snapshot preserves public category and helpline image URL mappings', () => {
  const snapshot = createSnapshot();
  snapshot.directory_image_urls = {
    categories: { showroom: 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/showroom.webp' },
    areas: {},
    helplines: { 'helpline-1122': 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/1122.webp' },
    businesses: {}, offers: {}, ads: {},
  };
  assert.equal(validateOfflineDirectorySnapshot(snapshot), true);
});

test('offline snapshot rejects non-HTTPS directory image mappings', () => {
  const snapshot = createSnapshot();
  snapshot.directory_image_urls = { categories: { showroom: 'http://example.com/showroom.webp' }, areas: {}, helplines: {}, businesses: {}, offers: {}, ads: {} };
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});


test('validates the complete public content package without internal account fields', () => {
  const snapshot = createSnapshot();
  snapshot.content_version = 'public-v1';
  snapshot.public_settings = {
    site_name: 'Hello Sadiqabad',
    contact_phone: '03001234567',
    contact_whatsapp: '03001234567',
    public_contact_email: 'public@example.com',
    social_links: {},
    default_language: 'en',
    ads_enabled: true,
    maintenance_mode: false,
  };
  snapshot.public_content = {
    news_articles: [{ id: 'news-1', slug: 'public-news' }],
    announcements: [{ id: 'announcement-1' }],
    local_authorities: [{ id: 'authority-1', public_email: 'office@example.com' }],
    authority_profiles: [{ id: 'profile-1', contact_email: null }],
    government_jobs: [{ id: 'job-1', slug: 'public-job' }],
    government_schemes: [{ id: 'scheme-1', slug: 'public-scheme' }],
    pages: [{ id: 'page-1', slug: 'about' }],
    business_products: [{ id: 'product-1', business_id: 'business-1' }],
    active_ads: [{ id: 'ad-1', business_id: 'business-1' }],
  };
  assert.equal(validateOfflineDirectorySnapshot(snapshot), true);
});

test('rejects private email and creator fields inside downloaded public content', () => {
  const snapshot = createSnapshot();
  snapshot.public_content = {
    news_articles: [{ id: 'news-1', created_by: 'private-user' }],
    announcements: [],
    local_authorities: [],
    authority_profiles: [],
    government_jobs: [],
    government_schemes: [],
    pages: [],
    business_products: [],
    active_ads: [],
  };
  assert.equal(validateOfflineDirectorySnapshot(snapshot), false);
});
