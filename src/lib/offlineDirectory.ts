import type { BusinessPublicView } from '../types/directory';
import type { BusinessRow, CategoryRow, AreaRow, EmergencyContactRow, OfferRow, ReviewRow } from '../types/database';

export const OFFLINE_DIRECTORY_SCHEMA_VERSION = 1;
const DATABASE_NAME = 'hello-sadiqabad-offline';
const DATABASE_VERSION = 1;
const SNAPSHOT_STORE = 'snapshots';
const META_STORE = 'metadata';
const ACTIVE_SNAPSHOT_KEY = 'active-snapshot';

export interface OfflineCategory {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  parent_id: string | null;
  icon: string;
  color: string;
  sort_order: number;
  synonyms: string[];
}

export interface OfflineArea {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
}

export interface OfflineOffer {
  id: string;
  business_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  valid_from: string;
  valid_to: string;
}

export interface OfflineReview {
  id: string;
  business_id: string;
  author_name: string;
  rating: number;
  comment: string;
  owner_reply: string | null;
  owner_reply_at: string | null;
  created_at: string;
}

export interface OfflineBusiness {
  id: string;
  name_en: string;
  name_ur: string | null;
  slug: string;
  category_id: string;
  area_id: string | null;
  address_en: string | null;
  address_ur: string | null;
  landmark_en: string | null;
  landmark_ur: string | null;
  lat: number | null;
  lng: number | null;
  phone_primary: string;
  phone_secondary: string | null;
  whatsapp: string | null;
  website_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
  tiktok_url: string | null;
  description_en: string | null;
  description_ur: string | null;
  services_en: string[];
  services_ur: string[];
  logo_url: string | null;
  cover_url: string | null;
  gallery_urls: string[];
  video_urls: string[];
  opening_hours: BusinessRow['opening_hours'];
  is_open_24h: boolean;
  home_delivery: boolean;
  established_year: number | null;
  status: 'published';
  plan_code: BusinessRow['plan_code'];
  is_verified: boolean;
  is_featured: boolean;
  tags: string[];
  meta_title_en: string | null;
  meta_description_en: string | null;
  rating_avg: number | null;
  rating_count: number;
  created_at: string;
  updated_at: string;
  category: OfflineCategory | null;
  area: OfflineArea | null;
  active_offers: OfflineOffer[];
  approved_reviews: OfflineReview[];
}

export interface OfflineEmergencyContact {
  id: string;
  name_en: string;
  name_ur: string;
  phone: string;
  category: EmergencyContactRow['category'];
  icon: string;
  sort_order: number;
  description_en: string | null;
  description_ur: string | null;
  whatsapp: string | null;
  source_url: string | null;
  verified_at: string | null;
}

export interface OfflineDirectorySnapshot {
  schema_version: number;
  downloaded_at: string;
  businesses: OfflineBusiness[];
  categories: OfflineCategory[];
  areas: OfflineArea[];
  emergency_contacts: OfflineEmergencyContact[];
}

export interface OfflineSnapshotMetadata {
  generation: string;
  schema_version: number;
  downloaded_at: string;
  counts: {
    businesses: number;
    categories: number;
    areas: number;
    emergency_contacts: number;
  };
}

interface StoredSnapshot extends OfflineDirectorySnapshot {
  generation: string;
}

interface StoredMetadata {
  key: string;
  generation: string;
}

let databasePromise: Promise<IDBDatabase> | null = null;

function cloneCategory(category: CategoryRow): OfflineCategory {
  return {
    id: category.id,
    name_en: category.name_en,
    name_ur: category.name_ur,
    slug: category.slug,
    parent_id: category.parent_id,
    icon: category.icon,
    color: category.color,
    sort_order: category.sort_order,
    synonyms: [...(category.synonyms ?? [])],
  };
}

function cloneArea(area: AreaRow): OfflineArea {
  return {
    id: area.id,
    name_en: area.name_en,
    name_ur: area.name_ur,
    slug: area.slug,
  };
}

export function toOfflineBusiness(source: BusinessPublicView): OfflineBusiness {
  return {
    id: source.id,
    name_en: source.name_en,
    name_ur: source.name_ur,
    slug: source.slug,
    category_id: source.category_id,
    area_id: source.area_id,
    address_en: source.address_en,
    address_ur: source.address_ur,
    landmark_en: source.landmark_en,
    landmark_ur: source.landmark_ur,
    lat: source.lat,
    lng: source.lng,
    phone_primary: source.phone_primary,
    phone_secondary: source.phone_secondary,
    whatsapp: source.whatsapp,
    website_url: source.website_url,
    facebook_url: source.facebook_url,
    instagram_url: source.instagram_url,
    youtube_url: source.youtube_url,
    tiktok_url: source.tiktok_url,
    description_en: source.description_en,
    description_ur: source.description_ur,
    services_en: [...(source.services_en ?? [])],
    services_ur: [...(source.services_ur ?? [])],
    logo_url: source.logo_url,
    cover_url: source.cover_url,
    gallery_urls: [...(source.gallery_urls ?? [])],
    video_urls: [...(source.video_urls ?? [])],
    opening_hours: source.opening_hours,
    is_open_24h: Boolean(source.is_open_24h),
    home_delivery: Boolean(source.home_delivery),
    established_year: source.established_year,
    status: 'published',
    plan_code: source.plan_code,
    is_verified: Boolean(source.is_verified),
    is_featured: Boolean(source.is_featured),
    tags: [...(source.tags ?? [])],
    meta_title_en: source.meta_title_en,
    meta_description_en: source.meta_description_en,
    rating_avg: source.rating_avg,
    rating_count: source.rating_count ?? 0,
    created_at: source.created_at,
    updated_at: source.updated_at,
    category: source.category ? cloneCategory(source.category) : null,
    area: source.area ? cloneArea(source.area) : null,
    active_offers: (source.active_offers ?? []).map((offer: OfferRow) => ({
      id: offer.id,
      business_id: offer.business_id,
      title: offer.title,
      description: offer.description,
      image_url: offer.image_url,
      valid_from: offer.valid_from,
      valid_to: offer.valid_to,
    })),
    approved_reviews: (source.approved_reviews ?? [])
      .filter((review: ReviewRow) => review.status === 'approved')
      .map((review: ReviewRow) => ({
        id: review.id,
        business_id: review.business_id,
        author_name: review.author_name,
        rating: review.rating,
        comment: review.comment,
        owner_reply: review.owner_reply,
        owner_reply_at: review.owner_reply_at,
        created_at: review.created_at,
      })),
  };
}

export function toOfflineEmergencyContact(source: EmergencyContactRow): OfflineEmergencyContact {
  return {
    id: source.id,
    name_en: source.name_en,
    name_ur: source.name_ur,
    phone: source.phone,
    category: source.category,
    icon: source.icon,
    sort_order: source.sort_order,
    description_en: source.description_en ?? null,
    description_ur: source.description_ur ?? null,
    whatsapp: source.whatsapp ?? null,
    source_url: source.source_url ?? null,
    verified_at: source.verified_at ?? null,
  };
}

const FORBIDDEN_OFFLINE_KEYS = new Set([
  'owner_id',
  'created_by',
  'updated_by',
  'assigned_to',
  'claimed_at',
  'user_id',
  'email',
  'auth_token',
  'access_token',
  'refresh_token',
  'service_role',
  'service_role_key',
]);

function containsForbiddenKeys(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsForbiddenKeys);
  return Object.entries(value as Record<string, unknown>).some(([key, child]) =>
    FORBIDDEN_OFFLINE_KEYS.has(key.toLowerCase()) || containsForbiddenKeys(child)
  );
}

export function validateOfflineDirectorySnapshot(snapshot: OfflineDirectorySnapshot): boolean {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.schema_version !== OFFLINE_DIRECTORY_SCHEMA_VERSION) return false;
  if (!snapshot.downloaded_at || !Number.isFinite(Date.parse(snapshot.downloaded_at))) return false;
  if (!Array.isArray(snapshot.businesses) || !Array.isArray(snapshot.categories) ||
      !Array.isArray(snapshot.areas) || !Array.isArray(snapshot.emergency_contacts)) return false;
  if (containsForbiddenKeys(snapshot)) return false;

  const businessIds = new Set<string>();
  for (const business of snapshot.businesses) {
    if (!business || typeof business.id !== 'string' || !business.id ||
        typeof business.slug !== 'string' || !business.slug ||
        typeof business.name_en !== 'string' || !business.name_en ||
        business.status !== 'published' || businessIds.has(business.id)) return false;
    businessIds.add(business.id);
  }

  const categoryIds = new Set<string>();
  for (const category of snapshot.categories) {
    if (!category || !category.id || !category.slug) return false;
    if (categoryIds.has(category.id)) return false;
    categoryIds.add(category.id);
  }

  const areaIds = new Set<string>();
  for (const area of snapshot.areas) {
    if (!area || !area.id || !area.slug) return false;
    if (areaIds.has(area.id)) return false;
    areaIds.add(area.id);
  }

  const contactIds = new Set<string>();
  for (const contact of snapshot.emergency_contacts) {
    if (!contact || !contact.id || !contact.name_en || !contact.phone) return false;
    if (contactIds.has(contact.id)) return false;
    contactIds.add(contact.id);
  }

  return true;
}

export function isOfflineDirectorySupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openDatabase(): Promise<IDBDatabase> {
  if (!isOfflineDirectorySupported()) {
    return Promise.reject(new Error('Offline storage is not supported by this browser.'));
  }
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE)) {
        database.createObjectStore(SNAPSHOT_STORE, { keyPath: 'generation' });
      }
      if (!database.objectStoreNames.contains(META_STORE)) {
        database.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        databasePromise = null;
      };
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error ?? new Error('Unable to open offline storage.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('Offline storage is busy in another tab. Close older Hello Sadiqabad tabs and retry.'));
    };
  });

  return databasePromise;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Offline storage request failed.'));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Offline storage transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Offline storage transaction was aborted.'));
  });
}

export async function getActiveOfflineDirectorySnapshot(): Promise<OfflineDirectorySnapshot | null> {
  const database = await openDatabase();
  const transaction = database.transaction([META_STORE, SNAPSHOT_STORE], 'readonly');
  const done = transactionDone(transaction);
  const metadata = await requestResult<StoredMetadata | undefined>(
    transaction.objectStore(META_STORE).get(ACTIVE_SNAPSHOT_KEY)
  );
  if (!metadata?.generation) {
    await done;
    return null;
  }
  const stored = await requestResult<StoredSnapshot | undefined>(
    transaction.objectStore(SNAPSHOT_STORE).get(metadata.generation)
  );
  await done;
  if (!stored) return null;

  const { generation: _generation, ...snapshot } = stored;
  return validateOfflineDirectorySnapshot(snapshot) ? snapshot : null;
}

export async function saveOfflineDirectorySnapshot(
  snapshot: OfflineDirectorySnapshot
): Promise<OfflineSnapshotMetadata> {
  if (!validateOfflineDirectorySnapshot(snapshot)) {
    throw new Error('The offline directory package failed validation. The previous saved package was kept.');
  }

  const database = await openDatabase();
  const generation = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : 'offline-' + Date.now().toString(36);
  const stored: StoredSnapshot = { ...snapshot, generation };
  const transaction = database.transaction([META_STORE, SNAPSHOT_STORE], 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(SNAPSHOT_STORE).put(stored);
  transaction.objectStore(META_STORE).put({ key: ACTIVE_SNAPSHOT_KEY, generation } satisfies StoredMetadata);
  await done;

  // The new generation is active only after the atomic write has committed.
  // Cleanup happens afterward, so a failed write cannot remove the previous copy.
  const cleanup = database.transaction(SNAPSHOT_STORE, 'readwrite');
  const cleanupDone = transactionDone(cleanup);
  const keys = await requestResult<IDBValidKey[]>(cleanup.objectStore(SNAPSHOT_STORE).getAllKeys());
  for (const key of keys) {
    if (key !== generation) cleanup.objectStore(SNAPSHOT_STORE).delete(key);
  }
  await cleanupDone;

  return {
    generation,
    schema_version: snapshot.schema_version,
    downloaded_at: snapshot.downloaded_at,
    counts: {
      businesses: snapshot.businesses.length,
      categories: snapshot.categories.length,
      areas: snapshot.areas.length,
      emergency_contacts: snapshot.emergency_contacts.length,
    },
  };
}

export async function getOfflineDirectoryMetadata(): Promise<OfflineSnapshotMetadata | null> {
  const snapshot = await getActiveOfflineDirectorySnapshot();
  if (!snapshot) return null;
  const database = await openDatabase();
  const transaction = database.transaction([META_STORE, SNAPSHOT_STORE], 'readonly');
  const done = transactionDone(transaction);
  const metadata = await requestResult<StoredMetadata | undefined>(
    transaction.objectStore(META_STORE).get(ACTIVE_SNAPSHOT_KEY)
  );
  await done;
  if (!metadata?.generation) return null;
  return {
    generation: metadata.generation,
    schema_version: snapshot.schema_version,
    downloaded_at: snapshot.downloaded_at,
    counts: {
      businesses: snapshot.businesses.length,
      categories: snapshot.categories.length,
      areas: snapshot.areas.length,
      emergency_contacts: snapshot.emergency_contacts.length,
    },
  };
}

export async function clearOfflineDirectorySnapshot(): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction([META_STORE, SNAPSHOT_STORE], 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(META_STORE).delete(ACTIVE_SNAPSHOT_KEY);
  transaction.objectStore(SNAPSHOT_STORE).clear();
  await done;
}
