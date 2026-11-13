import test from 'node:test';
import assert from 'node:assert/strict';
import { effectivePlanCode, filterAndRankBusinesses } from './searchFilter';
import type { AreaRow, CategoryRow, PlanRow } from '../types/database';
import type { BusinessPublicView } from '../types/directory';

const categories: CategoryRow[] = [
  {
    id: 'cat-health',
    name_en: 'Healthcare & Hospitals',
    name_ur: 'صحت اور ہسپتال',
    slug: 'healthcare',
    parent_id: null,
    icon: 'HeartPulse',
    color: '#006948',
    sort_order: 1,
    synonyms: ['dawai', 'doctar', 'hospital', 'clinic'],
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const areas: AreaRow[] = [
  {
    id: 'area-rail',
    city_id: 'city-1',
    name_en: 'Rail Bazaar',
    name_ur: 'ریل بازار',
    slug: 'rail-bazaar',
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const plans: PlanRow[] = [
  {
    id: 'p-free',
    code: 'free',
    name_en: 'Free',
    name_ur: 'مفت',
    limits: { gallery: 0, max_photos: 0, videos: 0, max_videos: 0, social_links: 0, offers: 0, search_priority: 1 },
    features: { whatsapp: false, cover: false, gallery: false, videos: false, social_links: false, offers: false, inquiry: false, verified_badge: false, qr: false, analytics_full: false },
    price_note: 'Free forever',
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'p-premium',
    code: 'premium',
    name_en: 'Premium',
    name_ur: 'پریمیم',
    limits: { gallery: 15, max_photos: 15, videos: 3, max_videos: 3, social_links: 999, offers: 10, search_priority: 3 },
    features: { whatsapp: true, cover: true, gallery: true, videos: true, social_links: true, offers: true, inquiry: true, verified_badge: true, qr: true, analytics_full: true },
    price_note: 'Contact team',
    is_active: true,
    sort_order: 3,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const sampleBusinesses: BusinessPublicView[] = [
  {
    id: 'b1',
    city_id: 'city-1',
    owner_id: null,
    name_en: 'Basic Clinic',
    name_ur: 'بیسک کلینک',
    slug: 'basic-clinic',
    category_id: 'cat-health',
    area_id: 'area-rail',
    address_en: 'Rail Bazaar',
    address_ur: null,
    landmark_en: null,
    landmark_ur: null,
    lat: 28.3062,
    lng: 70.1308,
    phone_primary: '03001111111',
    phone_secondary: null,
    phone_normalized: '+923001111111',
    whatsapp: null,
    email: null,
    website_url: null,
    facebook_url: null,
    instagram_url: null,
    youtube_url: null,
    tiktok_url: null,
    description_en: 'General clinic',
    description_ur: null,
    services_en: [],
    services_ur: [],
    logo_url: null,
    cover_url: null,
    owner_name: null,
    owner_photo_url: null,
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
    tags: ['doctar'],
    meta_title_en: null,
    meta_description_en: null,
    rating_avg: 4.9,
    rating_count: 10,
    view_count: 10,
    call_count: 2,
    whatsapp_count: 0,
    source: 'manual',
    created_by: null,
    assigned_to: null,
    published_at: '2026-01-01T00:00:00Z',
    claimed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'b2',
    city_id: 'city-1',
    owner_id: null,
    name_en: 'City Hospital',
    name_ur: 'سٹی ہسپتال',
    slug: 'city-hospital',
    category_id: 'cat-health',
    area_id: 'area-rail',
    address_en: 'Rail Bazaar',
    address_ur: null,
    landmark_en: null,
    landmark_ur: null,
    lat: 28.31,
    lng: 70.135,
    phone_primary: '03002222222',
    phone_secondary: null,
    phone_normalized: '+923002222222',
    whatsapp: '03002222222',
    email: null,
    website_url: null,
    facebook_url: null,
    instagram_url: null,
    youtube_url: null,
    tiktok_url: null,
    description_en: '24 hour emergency hospital',
    description_ur: null,
    services_en: ['Emergency'],
    services_ur: [],
    logo_url: null,
    cover_url: null,
    owner_name: null,
    owner_photo_url: null,
    gallery_urls: [],
    video_urls: [],
    opening_hours: null,
    is_open_24h: true,
    home_delivery: false,
    established_year: null,
    status: 'published',
    rejection_reason: null,
    plan_code: 'premium',
    plan_expires_at: '2027-01-01T00:00:00Z',
    is_verified: true,
    is_featured: true,
    tags: ['dawai'],
    meta_title_en: null,
    meta_description_en: null,
    rating_avg: 4.5,
    rating_count: 50,
    view_count: 100,
    call_count: 20,
    whatsapp_count: 15,
    source: 'manual',
    created_by: null,
    assigned_to: null,
    published_at: '2026-01-02T00:00:00Z',
    claimed_at: null,
    created_at: '2026-01-02T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
  },
];

test('effectivePlanCode downgrades expired plans to free', () => {
  assert.equal(effectivePlanCode('premium', '2020-01-01T00:00:00Z', new Date('2026-11-13T00:00:00Z')), 'free');
  assert.equal(effectivePlanCode('premium', '2027-01-01T00:00:00Z', new Date('2026-11-13T00:00:00Z')), 'premium');
});

test('matches Roman Urdu synonyms and ranks premium plan above free on relevance', () => {
  const results = filterAndRankBusinesses(
    sampleBusinesses,
    categories,
    areas,
    plans,
    { q: 'dawai', sort: 'relevance' },
    null,
    new Date('2026-11-13T10:00:00+05:00')
  );
  assert.equal(results.length, 2);
  assert.equal(results[0].slug, 'city-hospital');
});

test('filters by open_now and verified', () => {
  const results = filterAndRankBusinesses(
    sampleBusinesses,
    categories,
    areas,
    plans,
    { open: true, verified: true },
    null,
    new Date('2026-11-13T10:00:00+05:00')
  );
  assert.equal(results.length, 1);
  assert.equal(results[0].slug, 'city-hospital');
});
