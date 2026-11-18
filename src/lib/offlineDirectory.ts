import type { BusinessPublicView } from '../types/directory';
import type { DirectoryImageUrls } from './siteSettings';
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
  directory_image_urls?: DirectoryImageUrls;
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

export function toOfflineCategory(category: CategoryRow): OfflineCategory {
  if (!category.is_active) throw new Error('Only active public categories can be saved offline.');
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

export function toOfflineArea(area: AreaRow): OfflineArea {
  if (!area.is_active) throw new Error('Only active public areas can be saved offline.');
  return {
    id: area.id,
    name_en: area.name_en,
    name_ur: area.name_ur,
    slug: area.slug,
  };
}

export function toOfflineBusiness(source: BusinessPublicView): OfflineBusiness {
  if (source.status !== 'published') throw new Error('Only published businesses can be saved offline.');
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
    category: source.category ? toOfflineCategory(source.category) : null,
    area: source.area ? toOfflineArea(source.area) : null,
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
  if (!source.is_active) throw new Error('Only active public emergency contacts can be saved offline.');
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
  'owner_name',
  'owner_photo_url',
  'user_id',
  'password',
  'raw_user_meta_data',
  'raw_app_meta_data',
  'private_profile',
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isValidPublicCategory(value: unknown): value is OfflineCategory {
  if (!value || typeof value !== 'object') return false;
  const category = value as OfflineCategory;
  return isNonEmptyString(category.id) &&
    isNonEmptyString(category.slug) &&
    typeof category.name_en === 'string' &&
    typeof category.name_ur === 'string' &&
    isNullableString(category.parent_id) &&
    typeof category.icon === 'string' &&
    typeof category.color === 'string' &&
    Number.isFinite(category.sort_order) &&
    isStringArray(category.synonyms);
}

function isValidPublicArea(value: unknown): value is OfflineArea {
  if (!value || typeof value !== 'object') return false;
  const area = value as OfflineArea;
  return isNonEmptyString(area.id) &&
    isNonEmptyString(area.slug) &&
    typeof area.name_en === 'string' &&
    typeof area.name_ur === 'string';
}

function isValidDirectoryImageMap(value: unknown): value is DirectoryImageUrls {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return ['categories', 'areas', 'helplines', 'businesses', 'offers', 'ads'].every((key) => {
    const group = record[key];
    return Boolean(group && typeof group === 'object' && !Array.isArray(group) &&
      Object.entries(group as Record<string, unknown>).every(([id, url]) =>
        isNonEmptyString(id) && typeof url === 'string' && (url === '' || url.startsWith('https://'))
      ));
  });
}

export function validateOfflineDirectorySnapshot(snapshot: OfflineDirectorySnapshot): boolean {
  if (!snapshot || typeof snapshot !== 'object') return false;
  if (snapshot.schema_version !== OFFLINE_DIRECTORY_SCHEMA_VERSION) return false;
  if (!snapshot.downloaded_at || !Number.isFinite(Date.parse(snapshot.downloaded_at))) return false;
  if (!Array.isArray(snapshot.businesses) || !Array.isArray(snapshot.categories) ||
      !Array.isArray(snapshot.areas) || !Array.isArray(snapshot.emergency_contacts)) return false;
  if (containsForbiddenKeys(snapshot)) return false;
  if (snapshot.directory_image_urls !== undefined && !isValidDirectoryImageMap(snapshot.directory_image_urls)) return false;

  const businessIds = new Set<string>();
  for (const candidate of snapshot.businesses as unknown[]) {
    if (!candidate || typeof candidate !== 'object') return false;
    const business = candidate as OfflineBusiness;
    if (!isNonEmptyString(business.id) ||
        !isNonEmptyString(business.slug) ||
        !isNonEmptyString(business.name_en) ||
        business.status !== 'published' ||
        businessIds.has(business.id) ||
        !isNonEmptyString(business.category_id) ||
        !isNullableString(business.area_id) ||
        !isStringArray(business.services_en) ||
        !isStringArray(business.services_ur) ||
        !isStringArray(business.gallery_urls) ||
        !isStringArray(business.video_urls) ||
        !isStringArray(business.tags) ||
        !Array.isArray(business.active_offers) ||
        !Array.isArray(business.approved_reviews) ||
        (business.category !== null && !isValidPublicCategory(business.category)) ||
        (business.area !== null && !isValidPublicArea(business.area))) return false;
    businessIds.add(business.id);

    for (const offer of business.active_offers) {
      if (!offer || !isNonEmptyString(offer.id) ||
          offer.business_id !== business.id ||
          !isNonEmptyString(offer.title) ||
          !isNonEmptyString(offer.valid_from) ||
          !isNonEmptyString(offer.valid_to) ||
          !isNullableString(offer.description) ||
          !isNullableString(offer.image_url)) return false;
    }

    for (const review of business.approved_reviews) {
      if (!review || !isNonEmptyString(review.id) ||
          review.business_id !== business.id ||
          !isNonEmptyString(review.author_name) ||
          !Number.isInteger(review.rating) || review.rating < 1 || review.rating > 5 ||
          typeof review.comment !== 'string' ||
          !isNullableString(review.owner_reply) ||
          !isNullableString(review.owner_reply_at) ||
          !isNonEmptyString(review.created_at)) return false;
    }
  }

  const categoryIds = new Set<string>();
  for (const candidate of snapshot.categories as unknown[]) {
    if (!isValidPublicCategory(candidate)) return false;
    const category = candidate as OfflineCategory;
    if (categoryIds.has(category.id)) return false;
    categoryIds.add(category.id);
  }

  const areaIds = new Set<string>();
  for (const candidate of snapshot.areas as unknown[]) {
    if (!isValidPublicArea(candidate)) return false;
    const area = candidate as OfflineArea;
    if (areaIds.has(area.id)) return false;
    areaIds.add(area.id);
  }

  const contactIds = new Set<string>();
  for (const candidate of snapshot.emergency_contacts as unknown[]) {
    if (!candidate || typeof candidate !== 'object') return false;
    const contact = candidate as OfflineEmergencyContact;
    if (!isNonEmptyString(contact.id) ||
        !isNonEmptyString(contact.name_en) ||
        typeof contact.name_ur !== 'string' ||
        !isNonEmptyString(contact.phone) ||
        !isNonEmptyString(contact.category) ||
        typeof contact.icon !== 'string' ||
        !Number.isFinite(contact.sort_order) ||
        !isNullableString(contact.description_en) ||
        !isNullableString(contact.description_ur) ||
        !isNullableString(contact.whatsapp) ||
        !isNullableString(contact.source_url) ||
        !isNullableString(contact.verified_at) ||
        contactIds.has(contact.id)) return false;
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

async function readActiveStoredSnapshot(): Promise<{ generation: string; snapshot: OfflineDirectorySnapshot } | null> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([META_STORE, SNAPSHOT_STORE], 'readonly');
    let result: { generation: string; snapshot: OfflineDirectorySnapshot } | null = null;
    transaction.oncomplete = () => resolve(result);
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to read offline storage.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Offline storage read was aborted.'));

    const metadataRequest = transaction.objectStore(META_STORE).get(ACTIVE_SNAPSHOT_KEY);
    metadataRequest.onsuccess = () => {
      const metadata = metadataRequest.result as StoredMetadata | undefined;
      if (!metadata?.generation) return;

      const snapshotRequest = transaction.objectStore(SNAPSHOT_STORE).get(metadata.generation);
      snapshotRequest.onsuccess = () => {
        const stored = snapshotRequest.result as StoredSnapshot | undefined;
        if (!stored) return;
        const { generation, ...snapshot } = stored;
        if (validateOfflineDirectorySnapshot(snapshot)) result = { generation, snapshot };
      };
    };
  });
}

export async function getActiveOfflineDirectorySnapshot(): Promise<OfflineDirectorySnapshot | null> {
  const active = await readActiveStoredSnapshot();
  return active?.snapshot ?? null;
}

let fallbackGenerationCounter = 0;

function createOfflineGenerationId(): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    return 'offline-' + Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }
  fallbackGenerationCounter += 1;
  return 'offline-' + Date.now().toString(36) + '-' +
    fallbackGenerationCounter.toString(36) + '-' + Math.random().toString(36).slice(2);
}

export async function saveOfflineDirectorySnapshot(
  snapshot: OfflineDirectorySnapshot
): Promise<OfflineSnapshotMetadata> {
  if (!validateOfflineDirectorySnapshot(snapshot)) {
    throw new Error('The offline directory package failed validation. The previous saved package was kept.');
  }

  const database = await openDatabase();
  const generation = createOfflineGenerationId();
  const stored: StoredSnapshot = { ...snapshot, generation };
  const transaction = database.transaction([META_STORE, SNAPSHOT_STORE], 'readwrite');
  const done = transactionDone(transaction);
  transaction.objectStore(SNAPSHOT_STORE).put(stored);
  transaction.objectStore(META_STORE).put({ key: ACTIVE_SNAPSHOT_KEY, generation } satisfies StoredMetadata);
  await done;

  // Clean old generations only after the new snapshot commits. Re-read the active
  // pointer inside the cleanup transaction so concurrent downloads cannot delete
  // whichever generation became active most recently.
  const cleanup = database.transaction([META_STORE, SNAPSHOT_STORE], 'readwrite');
  const cleanupDone = transactionDone(cleanup);
  const activeRequest = cleanup.objectStore(META_STORE).get(ACTIVE_SNAPSHOT_KEY);
  activeRequest.onsuccess = () => {
    const activeMetadata = activeRequest.result as StoredMetadata | undefined;
    const keysRequest = cleanup.objectStore(SNAPSHOT_STORE).getAllKeys();
    keysRequest.onsuccess = () => {
      for (const key of keysRequest.result) {
        if (key !== activeMetadata?.generation) cleanup.objectStore(SNAPSHOT_STORE).delete(key);
      }
    };
  };
  // Cleanup is best-effort: activation already committed. If cleanup fails,
  // keep the extra older generations rather than reporting a failed download
  // when the new verified snapshot is already active.
  await cleanupDone.catch(() => undefined);

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
  const active = await readActiveStoredSnapshot();
  if (!active) return null;
  const snapshot = active.snapshot;
  return {
    generation: active.generation,
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
