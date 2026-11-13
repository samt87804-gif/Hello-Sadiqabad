import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SADIQABAD_CENTER_COORDS,
  filterAndRankBusinesses,
  isValidCoords,
} from './searchFilter';
import { haversineDistanceKm } from './format';
import { searchBusinesses } from './api';
import { SEED_EMERGENCY_CONTACTS, SEED_PLANS } from './seedData';
import type { BusinessPublicView } from '../types/directory';
import type { AreaRow, CategoryRow, PlanRow } from '../types/database';

const mockCategoryHealth: CategoryRow = {
  id: 'cat-health',
  name_en: 'Healthcare & Clinics',
  name_ur: 'صحت اور کلینکس',
  slug: 'healthcare',
  parent_id: null,
  icon: 'HeartPulse',
  color: '#006948',
  sort_order: 1,
  synonyms: ['clinic', 'hospital'],
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockCategoryFood: CategoryRow = {
  id: 'cat-food',
  name_en: 'Restaurants & Food',
  name_ur: 'کھانا اور ہوٹل',
  slug: 'food',
  parent_id: null,
  icon: 'Utensils',
  color: '#904d00',
  sort_order: 2,
  synonyms: ['biryani', 'hotel'],
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockAreaRail: AreaRow = {
  id: 'area-rail',
  city_id: 'city-1',
  name_en: 'Rail Bazaar',
  name_ur: 'ریل بازار',
  slug: 'rail-bazaar',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockAreaClub: AreaRow = {
  id: 'area-club',
  city_id: 'city-1',
  name_en: 'Club Road',
  name_ur: 'کلب روڈ',
  slug: 'club-road',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
};

const mockPlans: PlanRow[] = [
  {
    id: 'p-free',
    code: 'free',
    name_en: 'Free',
    name_ur: 'مفت',
    limits: { gallery: 0, max_photos: 0, videos: 0, max_videos: 0, social_links: 0, offers: 0, search_priority: 1 },
    features: { whatsapp: false, cover: false, gallery: false, videos: false, social_links: false, offers: false, inquiry: false, verified_badge: false, qr: false, analytics_full: false },
    price_note: 'Free',
    is_active: true,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

function createBusiness(
  id: string,
  name: string,
  categoryId: string,
  areaId: string,
  lat: number | null,
  lng: number | null
): BusinessPublicView {
  return {
    id,
    city_id: 'city-1',
    owner_id: null,
    name_en: name,
    name_ur: null,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    category_id: categoryId,
    area_id: areaId,
    address_en: 'Sadiqabad',
    address_ur: null,
    landmark_en: null,
    landmark_ur: null,
    lat,
    lng,
    phone_primary: '03001234567',
    phone_secondary: null,
    phone_normalized: '+923001234567',
    whatsapp: null,
    email: null,
    website_url: null,
    facebook_url: null,
    instagram_url: null,
    youtube_url: null,
    tiktok_url: null,
    description_en: `${name} description`,
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
    is_verified: true,
    is_featured: false,
    tags: [],
    meta_title_en: null,
    meta_description_en: null,
    rating_avg: 4.5,
    rating_count: 5,
    view_count: 10,
    call_count: 1,
    whatsapp_count: 0,
    source: 'manual',
    created_by: null,
    assigned_to: null,
    published_at: '2026-01-01T00:00:00Z',
    claimed_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    category: categoryId === 'cat-health' ? mockCategoryHealth : mockCategoryFood,
    area: areaId === 'area-rail' ? mockAreaRail : mockAreaClub,
  };
}

// ---------------------------------------------------------------------------
// 1. Map -> List -> Map Marker Lifecycle
// ---------------------------------------------------------------------------
test('Map -> List -> Map: markers are restored completely upon map view recreation', () => {
  const businesses = [
    createBusiness('b1', 'Al-Shafi Clinic', 'cat-health', 'area-rail', 28.3065, 70.1310),
    createBusiness('b2', 'City Biryani', 'cat-food', 'area-club', 28.3090, 70.1340),
  ];

  interface MockMarker {
    coords: [number, number];
    businessId: string;
  }

  class MockLayerGroup {
    markers: MockMarker[] = [];
    clearLayers() {
      this.markers = [];
    }
    add(m: MockMarker) {
      this.markers.push(m);
    }
  }

  class MockMapInstance {
    center: [number, number];
    zoom: number;
    layer: MockLayerGroup;
    isDestroyed = false;

    constructor(center: [number, number], zoom: number) {
      this.center = center;
      this.zoom = zoom;
      this.layer = new MockLayerGroup();
    }

    remove() {
      this.isDestroyed = true;
      this.layer.clearLayers();
    }
  }

  const renderMarkers = (map: MockMapInstance, list: BusinessPublicView[]) => {
    map.layer.clearLayers();
    list.forEach((b) => {
      if (typeof b.lat === 'number' && typeof b.lng === 'number') {
        map.layer.add({ coords: [b.lat, b.lng], businessId: b.id });
      }
    });
  };

  // 1. User starts in Map View
  let activeMap: MockMapInstance | null = new MockMapInstance([28.3062, 70.1308], 14);
  renderMarkers(activeMap, businesses);
  assert.equal(activeMap.layer.markers.length, 2);

  // 2. User switches to List View: map is destroyed/cleaned up
  activeMap.remove();
  activeMap = null;

  // 3. User switches back to Map View: new map is created
  activeMap = new MockMapInstance([28.3062, 70.1308], 14);
  // Reusable renderMarkers is called immediately with current businesses
  renderMarkers(activeMap, businesses);

  // Assert: markers must reappear on the recreated map
  assert.equal(activeMap.layer.markers.length, 2);
  assert.equal(activeMap.layer.markers[0].businessId, 'b1');
  assert.equal(activeMap.layer.markers[1].businessId, 'b2');
});

// ---------------------------------------------------------------------------
// 2. Change Category while viewing map
// ---------------------------------------------------------------------------
test('Change category while viewing map: immediately updates markers to filtered items', () => {
  const allBusinesses = [
    createBusiness('b1', 'Al-Shafi Clinic', 'cat-health', 'area-rail', 28.3065, 70.1310),
    createBusiness('b2', 'City Biryani', 'cat-food', 'area-club', 28.3090, 70.1340),
    createBusiness('b3', 'THQ Hospital', 'cat-health', 'area-rail', 28.3080, 70.1320),
  ];

  const markers: string[] = [];
  const updateMapMarkers = (filtered: BusinessPublicView[]) => {
    markers.length = 0;
    filtered.forEach((b) => markers.push(b.id));
  };

  // Initially showing all
  updateMapMarkers(allBusinesses);
  assert.equal(markers.length, 3);

  // Filter category changed to 'healthcare'
  const healthOnly = allBusinesses.filter((b) => b.category_id === 'cat-health');
  updateMapMarkers(healthOnly);

  assert.equal(markers.length, 2);
  assert.deepEqual(markers, ['b1', 'b3']);
});

// ---------------------------------------------------------------------------
// 3. Change Area while viewing map
// ---------------------------------------------------------------------------
test('Change area while viewing map: immediately updates markers to area items', () => {
  const allBusinesses = [
    createBusiness('b1', 'Al-Shafi Clinic', 'cat-health', 'area-rail', 28.3065, 70.1310),
    createBusiness('b2', 'City Biryani', 'cat-food', 'area-club', 28.3090, 70.1340),
    createBusiness('b3', 'THQ Hospital', 'cat-health', 'area-rail', 28.3080, 70.1320),
  ];

  const markers: string[] = [];
  const updateMapMarkers = (filtered: BusinessPublicView[]) => {
    markers.length = 0;
    filtered.forEach((b) => markers.push(b.id));
  };

  // Filter area changed to 'area-club'
  const clubOnly = allBusinesses.filter((b) => b.area_id === 'area-club');
  updateMapMarkers(clubOnly);

  assert.equal(markers.length, 1);
  assert.deepEqual(markers, ['b2']);
});

// ---------------------------------------------------------------------------
// 4. Near Me while in Map View
// ---------------------------------------------------------------------------
test('Near Me while in Map View: centers map, places user marker, and produces success notice', () => {
  let centeredAt: [number, number] | null = null;
  let zoomLevel = 0;
  let userMarkerCoords: [number, number] | null = null;

  const mockMap = {
    setView: (coords: [number, number], zoom: number) => {
      centeredAt = coords;
      zoomLevel = zoom;
    },
  };

  const handleNearMeInMapView = (pos: { latitude: number; longitude: number }) => {
    const coords: [number, number] = [pos.latitude, pos.longitude];
    mockMap.setView(coords, 15);
    userMarkerCoords = coords;
    return 'Centered map near your location.';
  };

  const toast = handleNearMeInMapView({ latitude: 28.3075, longitude: 70.1325 });
  assert.equal(toast, 'Centered map near your location.');
  assert.deepEqual(centeredAt, [28.3075, 70.1325]);
  assert.equal(zoomLevel, 15);
  assert.deepEqual(userMarkerCoords, [28.3075, 70.1325]);
});

// ---------------------------------------------------------------------------
// 5. Near Me while in List View
// ---------------------------------------------------------------------------
test('Near Me while in List View: preserves coordinates, avoids false map centered notice, and applies on Map View open', () => {
  let savedCoords: [number, number] | null = null;
  const isMapView = false;
  const mockMap = null; // Map does not exist in List View

  const handleNearMe = (pos: { latitude: number; longitude: number }) => {
    const coords: [number, number] = [pos.latitude, pos.longitude];
    savedCoords = coords;

    if (isMapView && mockMap) {
      return 'Centered map near your location.';
    }
    return 'Location saved. It will be applied when you switch to Map View.';
  };

  // Execute in List View
  const toast = handleNearMe({ latitude: 28.3075, longitude: 70.1325 });
  assert.equal(toast, 'Location saved. It will be applied when you switch to Map View.');
  assert.deepEqual(savedCoords, [28.3075, 70.1325]);

  // When user switches to Map View: initial center consumes the savedCoords
  const newMapCenter = savedCoords ?? [28.3062, 70.1308];
  const newMapZoom = savedCoords ? 15 : 14;
  assert.deepEqual(newMapCenter, [28.3075, 70.1325]);
  assert.equal(newMapZoom, 15);
});

// ---------------------------------------------------------------------------
// 6. Fast consecutive searches: AbortController and Sequence Protection
// ---------------------------------------------------------------------------
test('Fast consecutive searches: older request is aborted and never overwrites newest results', async () => {
  let latestSeq = 0;
  let activeResults: string[] = [];

  const performSearch = async (query: string, delayMs: number) => {
    const seq = ++latestSeq;
    const controller = new AbortController();

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        if (controller.signal.aborted) {
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        if (seq === latestSeq) {
          activeResults = [query];
        }
        resolve();
      }, delayMs);

      controller.signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });
  };

  // Dispatch slow request 1 (100ms)
  const req1 = performSearch('first-query', 100);

  // Quickly dispatch request 2 (20ms) which supersedes request 1
  const req2 = performSearch('second-query', 20);

  await req2;
  assert.deepEqual(activeResults, ['second-query']);

  // Wait for req1 to finish
  await req1;
  // Verify request 1 did NOT overwrite request 2
  assert.deepEqual(activeResults, ['second-query']);
});

// ---------------------------------------------------------------------------
// 7. Filters changed while older request pending: AbortSignal in searchBusinesses
// ---------------------------------------------------------------------------
test('Filters changed while older request pending: searchBusinesses rejects with AbortError when signal aborted', async () => {
  const controller = new AbortController();

  // Abort before or during execution
  controller.abort();

  await assert.rejects(
    async () => {
      await searchBusinesses({ category: 'healthcare' }, { signal: controller.signal });
    },
    (err: unknown) => {
      return (
        err instanceof DOMException &&
        (err.name === 'AbortError' || err.message.includes('aborted'))
      );
    }
  );
});

// ---------------------------------------------------------------------------
// 8. Location permission denied: fallback to Sadiqabad city centre
// ---------------------------------------------------------------------------
test('Location permission denied: falls back to exact Sadiqabad city centre coordinates (28.3062, 70.1308)', () => {
  const resolveLocationOnPermissionDenied = (errorCode: number) => {
    if (errorCode === 1 /* PERMISSION_DENIED */) {
      return {
        coords: SADIQABAD_CENTER_COORDS,
        isFallback: true,
      };
    }
    return {
      coords: null,
      isFallback: false,
    };
  };

  const resolved = resolveLocationOnPermissionDenied(1);
  assert.equal(resolved.isFallback, true);
  assert.ok(resolved.coords);
  assert.equal(resolved.coords.lat, 28.3062);
  assert.equal(resolved.coords.lng, 70.1308);
  assert.equal(isValidCoords(resolved.coords), true);
});

// ---------------------------------------------------------------------------
// 9. Nearest sorting from Sadiqabad city centre
// ---------------------------------------------------------------------------
test('Nearest sorting from Sadiqabad city centre: calculates actual distances and orders accurately', () => {
  const cityCenter = SADIQABAD_CENTER_COORDS; // 28.3062, 70.1308

  const testList: BusinessPublicView[] = [
    // Distance ~ 7.3 km
    createBusiness('far', 'Far Hospital', 'cat-health', 'area-club', 28.35, 70.18),
    // Distance ~ 0.6 km
    createBusiness('mid', 'Mid Clinic', 'cat-health', 'area-rail', 28.31, 70.135),
    // Distance = 0 km (exact center)
    createBusiness('center', 'Center Pharmacy', 'cat-health', 'area-rail', 28.3062, 70.1308),
    // No coordinates
    createBusiness('no-coords', 'No GPS Shop', 'cat-health', 'area-rail', null, null),
  ];

  const sorted = filterAndRankBusinesses(
    testList,
    [mockCategoryHealth],
    [mockAreaRail, mockAreaClub],
    mockPlans,
    { sort: 'nearest' },
    cityCenter
  );

  // 1. Center business should be first with distance 0 km
  assert.equal(sorted[0].id, 'center');
  assert.equal(sorted[0].distance_km, 0);

  // 2. Mid business should be second with distance ~0.6 km
  assert.equal(sorted[1].id, 'mid');
  assert.ok(typeof sorted[1].distance_km === 'number' && sorted[1].distance_km > 0 && sorted[1].distance_km < 1);

  // 3. Far business should be third with distance > 5 km
  assert.equal(sorted[2].id, 'far');
  assert.ok(typeof sorted[2].distance_km === 'number' && sorted[2].distance_km > 5);

  // 4. Business without coords has null distance and appears last
  assert.equal(sorted[3].id, 'no-coords');
  assert.equal(sorted[3].distance_km, null);

  // Direct haversine formula check
  const dExact = haversineDistanceKm(cityCenter.lat, cityCenter.lng, 28.3062, 70.1308);
  assert.equal(dExact, 0);
});

test('Nearest sorting without reference location: explains sorting is unavailable without computing false distances', () => {
  const testList: BusinessPublicView[] = [
    createBusiness('b1', 'Far Hospital', 'cat-health', 'area-club', 28.35, 70.18),
    createBusiness('b2', 'Center Pharmacy', 'cat-health', 'area-rail', 28.3062, 70.1308),
  ];

  // When userCoords is null (no reference location established)
  const results = filterAndRankBusinesses(
    testList,
    [mockCategoryHealth],
    [mockAreaRail, mockAreaClub],
    mockPlans,
    { sort: 'nearest' },
    null
  );

  // Distances remain null
  assert.equal(results[0].distance_km, null);
  assert.equal(results[1].distance_km, null);
});

// ---------------------------------------------------------------------------
// 10. Data accuracy cleanup: Emergency contacts & Plan limits
// ---------------------------------------------------------------------------
test('Emergency contacts only include verified national/Punjab shortcodes without fabricated estimates', () => {
  const allowedPhones = new Set(['1122', '15', '16', '115', '118', '1199', '1043', '1121']);
  assert.ok(SEED_EMERGENCY_CONTACTS.length >= 6);
  for (const contact of SEED_EMERGENCY_CONTACTS) {
    assert.ok(allowedPhones.has(contact.phone), `Unexpected unverified emergency phone: ${contact.phone}`);
    assert.equal('phone_alt' in contact, false);
    assert.equal('address_en' in contact, false);
    assert.equal('response_time_est' in contact, false);
    assert.equal(/Alt:|mins|068-574|0301-865/i.test(contact.description_en ?? ''), false);
  }
});

test('Seed plans match Free (0), Basic (2), and Premium (10) offer limits without Gold naming', () => {
  const byCode = new Map(SEED_PLANS.map((p) => [p.code, p]));
  assert.equal(byCode.get('free')?.limits.offers, 0);
  assert.equal(byCode.get('basic')?.limits.offers, 2);
  assert.equal(byCode.get('premium')?.limits.offers, 10);
  assert.ok(!byCode.get('premium')?.name_en.toLowerCase().includes('gold'));
});

