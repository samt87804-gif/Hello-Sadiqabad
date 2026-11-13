import { getSupabaseClient, supabaseConfig } from './supabase';
import {
  SEED_ADS,
  SEED_ANNOUNCEMENTS,
  SEED_AREAS,
  SEED_AUDIT_LOGS,
  SEED_BUSINESS_NOTES,
  SEED_BUSINESSES,
  SEED_CATEGORIES,
  SEED_CITY,
  SEED_DAILY_STATS,
  SEED_EMERGENCY_CONTACTS,
  SEED_IMPORT_BATCHES,
  SEED_INQUIRIES,
  SEED_LEADS,
  SEED_NOTIFICATIONS,
  SEED_OFFERS,
  SEED_PAGES,
  SEED_PLANS,
  SEED_PROFILES,
  SEED_REVIEWS,
  SEED_SEARCH_LOGS,
  SEED_SITE_SETTINGS,
  SEED_STAFF_MEMBERS,
  SEED_SUBMISSIONS,
} from './seedData';
import {
  cacheEmergencyContacts,
  getCachedEmergencyContacts,
  getOrCreateSessionId,
} from './offlineStorage';
import { effectivePlanCode, filterAndRankBusinesses } from './searchFilter';
import { normalizePkPhone } from './phone';
import { daysUntil, slugify } from './format';
import { getPakistanDateString, isOfferCurrentlyValid } from './offers';
import { parseSiteSettings, type SiteSettingsMap } from './siteSettings';
import type {
  AdPlacement,
  AdRow,
  AnnouncementRow,
  AreaRow,
  AuditLogRow,
  BusinessEventType,
  BusinessNoteRow,
  BusinessRow,
  CategoryRow,
  CityRow,
  DailyBusinessStatRow,
  EdgeFunctionResult,
  EmergencyContactRow,
  ImportBatchRow,
  InquiryRow,
  InquiryStatus,
  LeadRow,
  LeadStatus,
  MyPermissionsRpcResult,
  NotificationRow,
  OfferRow,
  PageRow,
  PlanRow,
  ProfileRow,
  ReviewRow,
  SearchLogRow,
  SiteSettingRow,
  StaffMemberRow,
  StaffType,
  SubmissionRow,
  SubmissionStatus,
  SubmissionType,
  UserRole,
} from '../types/database';
import type {
  AdminAnalyticsData,
  AdminDashboardCounts,
  BusinessPublicView,
  CategoryWithChildren,
  OwnerDashboardStats,
  SearchFiltersState,
  SearchSuggestionItem,
} from '../types/directory';

const DEMO_DB_KEY = 'hs_demo_db_v2';

export interface DemoDbState {
  city: CityRow;
  categories: CategoryRow[];
  areas: AreaRow[];
  plans: PlanRow[];
  businesses: BusinessRow[];
  offers: OfferRow[];
  reviews: ReviewRow[];
  emergency_contacts: EmergencyContactRow[];
  announcements: AnnouncementRow[];
  ads: AdRow[];
  pages: PageRow[];
  site_settings: SiteSettingRow[];
  inquiries: InquiryRow[];
  submissions: SubmissionRow[];
  leads: LeadRow[];
  notifications: NotificationRow[];
  profiles: ProfileRow[];
  staff_members: StaffMemberRow[];
  daily_stats: DailyBusinessStatRow[];
  search_logs: SearchLogRow[];
  import_batches: ImportBatchRow[];
  audit_logs: AuditLogRow[];
  business_notes: BusinessNoteRow[];
  user_emails: Record<string, string>;
  user_active: Record<string, boolean>;
}

function createInitialDemoDb(): DemoDbState {
  return {
    city: structuredClone(SEED_CITY),
    categories: structuredClone(SEED_CATEGORIES),
    areas: structuredClone(SEED_AREAS),
    plans: structuredClone(SEED_PLANS),
    businesses: structuredClone(SEED_BUSINESSES),
    offers: structuredClone(SEED_OFFERS),
    reviews: structuredClone(SEED_REVIEWS),
    emergency_contacts: structuredClone(SEED_EMERGENCY_CONTACTS),
    announcements: structuredClone(SEED_ANNOUNCEMENTS),
    ads: structuredClone(SEED_ADS),
    pages: structuredClone(SEED_PAGES),
    site_settings: structuredClone(SEED_SITE_SETTINGS),
    inquiries: structuredClone(SEED_INQUIRIES),
    submissions: structuredClone(SEED_SUBMISSIONS),
    leads: structuredClone(SEED_LEADS),
    notifications: structuredClone(SEED_NOTIFICATIONS),
    profiles: structuredClone(SEED_PROFILES),
    staff_members: structuredClone(SEED_STAFF_MEMBERS),
    daily_stats: structuredClone(SEED_DAILY_STATS),
    search_logs: structuredClone(SEED_SEARCH_LOGS),
    import_batches: structuredClone(SEED_IMPORT_BATCHES),
    audit_logs: structuredClone(SEED_AUDIT_LOGS),
    business_notes: structuredClone(SEED_BUSINESS_NOTES),
    user_emails: {
      'user-owner-1': 'owner@hellosadiqabad.com',
      'user-admin-1': 'admin@hellosadiqabad.com',
      'user-staff-1': 'staff@hellosadiqabad.com',
    },
    user_active: {
      'user-owner-1': true,
      'user-admin-1': true,
      'user-staff-1': true,
    },
  };
}

let memoryDbCache: DemoDbState | null = null;

export function loadDemoDb(): DemoDbState {
  if (memoryDbCache) return memoryDbCache;
  try {
    const raw = localStorage.getItem(DEMO_DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoDbState;
      if (parsed && Array.isArray(parsed.businesses) && Array.isArray(parsed.categories)) {
        memoryDbCache = parsed;
        return memoryDbCache;
      }
    }
  } catch {
    // ignore corrupted localStorage
  }
  memoryDbCache = createInitialDemoDb();
  saveDemoDb(memoryDbCache);
  return memoryDbCache;
}

export function saveDemoDb(next: DemoDbState): void {
  memoryDbCache = next;
  try {
    localStorage.setItem(DEMO_DB_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
}

export function resetDemoDb(): void {
  const fresh = createInitialDemoDb();
  saveDemoDb(fresh);
}

function nowIso(): string {
  return new Date().toISOString();
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function todayDateStr(): string {
  return getPakistanDateString();
}

function enrichBusiness(b: BusinessRow, db: DemoDbState): BusinessPublicView {
  const category = db.categories.find((c) => c.id === b.category_id) ?? null;
  const area = b.area_id ? db.areas.find((a) => a.id === b.area_id) ?? null : null;
  const effCode = effectivePlanCode(b.plan_code, b.plan_expires_at);
  const plan = db.plans.find((p) => p.code === effCode) ?? db.plans[0] ?? null;
  const today = todayDateStr();
  const active_offers = db.offers.filter(
    (o) => o.business_id === b.id && isOfferCurrentlyValid(o, today)
  );
  const approved_reviews = db.reviews.filter(
    (r) => r.business_id === b.id && r.status === 'approved'
  );
  return {
    ...b,
    category,
    area,
    plan,
    effective_features: plan?.features,
    effective_limits: plan?.limits,
    active_offers,
    approved_reviews,
  };
}

function appendAuditDemo(
  db: DemoDbState,
  actorId: string | null,
  action: string,
  entity: string,
  entityId: string | null,
  details: Record<string, unknown> = {}
) {
  db.audit_logs.unshift({
    id: uid('aud'),
    actor_id: actorId,
    action,
    entity,
    entity_id: entityId,
    details,
    created_at: nowIso(),
  });
}

// ---------------------------------------------------------------------------
// PUBLIC READS
// ---------------------------------------------------------------------------

export async function fetchSiteSettings(): Promise<SiteSettingsMap> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('site_settings')
      .select('key, value, description, is_public')
      .eq('is_public', true);
    if (!error && data) {
      return parseSiteSettings(data as SiteSettingRow[]);
    }
  }
  const db = loadDemoDb();
  return parseSiteSettings(db.site_settings);
}

export const fetchPublicSiteSettings = fetchSiteSettings;

export async function fetchCity(): Promise<CityRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('cities')
      .select('*')
      .eq('slug', supabaseConfig.defaultCitySlug)
      .single();
    if (!error && data) return data as CityRow;
  }
  return loadDemoDb().city;
}

export async function fetchCategoriesWithCounts(): Promise<CategoryWithChildren[]> {
  const db = loadDemoDb();
  let categories: CategoryRow[] = db.categories.filter((c) => c.is_active);
  let businesses: BusinessRow[] = db.businesses.filter((b) => b.status === 'published');

  const client = getSupabaseClient();
  if (client) {
    const [catRes, bizRes] = await Promise.all([
      client.from('categories').select('*').eq('is_active', true).order('sort_order'),
      client.from('businesses').select('id, category_id').eq('status', 'published'),
    ]);
    if (!catRes.error && catRes.data) categories = catRes.data as CategoryRow[];
    if (!bizRes.error && bizRes.data) businesses = bizRes.data as BusinessRow[];
  }

  const counts = new Map<string, number>();
  for (const b of businesses) {
    counts.set(b.category_id, (counts.get(b.category_id) ?? 0) + 1);
  }

  const parents = categories
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order);

  return parents.map((parent) => {
    const children = categories
      .filter((c) => c.parent_id === parent.id)
      .sort((a, b) => a.sort_order - b.sort_order);
    const totalCount =
      (counts.get(parent.id) ?? 0) +
      children.reduce((acc, ch) => acc + (counts.get(ch.id) ?? 0), 0);
    return {
      ...parent,
      children,
      listing_count: totalCount,
    };
  });
}

export async function fetchAllCategories(includeInactive = false): Promise<CategoryRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const q = client.from('categories').select('*').order('sort_order');
    const { data, error } = includeInactive ? await q : await q.eq('is_active', true);
    if (!error && data) return data as CategoryRow[];
  }
  const db = loadDemoDb();
  return db.categories
    .filter((c) => includeInactive || c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export async function fetchAllAreas(includeInactive = false): Promise<AreaRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const q = client.from('areas').select('*').order('name_en');
    const { data, error } = includeInactive ? await q : await q.eq('is_active', true);
    if (!error && data) return data as AreaRow[];
  }
  const db = loadDemoDb();
  return db.areas
    .filter((a) => includeInactive || a.is_active)
    .sort((a, b) => a.name_en.localeCompare(b.name_en));
}

export async function fetchPlans(): Promise<PlanRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('plans').select('*').order('sort_order');
    if (!error && data) return data as PlanRow[];
  }
  return [...loadDemoDb().plans].sort((a, b) => a.sort_order - b.sort_order);
}

export async function searchBusinesses(
  filters: Partial<SearchFiltersState>,
  options: {
    page?: number;
    limit?: number;
    userCoords?: { lat: number; lng: number } | null;
    logSearch?: boolean;
    signal?: AbortSignal;
  } = {}
): Promise<{ items: BusinessPublicView[]; total: number }> {
  if (options.signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const client = getSupabaseClient();

  if (client) {
    const offset = Math.max(0, (page - 1) * limit);
    const { data, error } = await client.rpc('search_businesses', {
      p_query: filters.q?.trim() || null,
      p_category: filters.category || null,
      p_area: filters.area || null,
      p_open_now: Boolean(filters.open),
      p_verified: Boolean(filters.verified),
      p_has_offer: Boolean(filters.offer),
      p_min_rating: filters.rating ?? null,
      p_delivery: Boolean(filters.delivery),
      p_sort: filters.sort ?? 'relevance',
      p_lat: options.userCoords?.lat ?? null,
      p_lng: options.userCoords?.lng ?? null,
      p_limit: limit,
      p_offset: offset,
    });
    if (options.signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }
    if (!error && Array.isArray(data)) {
      const rows = data as BusinessPublicView[];
      const total = rows[0]?.total_count ?? rows.length;
      return { items: rows, total };
    }
  }

  if (options.signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const db = loadDemoDb();
  const enriched = db.businesses.map((b) => enrichBusiness(b, db));
  const ranked = filterAndRankBusinesses(
    enriched,
    db.categories,
    db.areas,
    db.plans,
    filters,
    options.userCoords
  );

  if (options.signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  if (options.logSearch && filters.q?.trim()) {
    db.search_logs.unshift({
      id: uid('sl'),
      query: filters.q.trim().slice(0, 120),
      filters: { ...filters },
      results_count: ranked.length,
      created_at: nowIso(),
    });
    saveDemoDb(db);
  }

  const start = (page - 1) * limit;
  return {
    items: ranked.slice(start, start + limit),
    total: ranked.length,
  };
}

export async function fetchSearchSuggestions(
  query: string,
  options: { signal?: AbortSignal } = {}
): Promise<SearchSuggestionItem[]> {
  if (options.signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('search_suggestions', {
      p_query: trimmed,
      p_limit: 8,
    });
    if (options.signal?.aborted) {
      throw new DOMException('The user aborted a request.', 'AbortError');
    }
    if (!error && Array.isArray(data)) {
      return data as SearchSuggestionItem[];
    }
  }

  if (options.signal?.aborted) {
    throw new DOMException('The user aborted a request.', 'AbortError');
  }

  const db = loadDemoDb();
  const results: SearchSuggestionItem[] = [];

  for (const cat of db.categories) {
    if (!cat.is_active) continue;
    const match =
      cat.name_en.toLowerCase().includes(trimmed) ||
      cat.name_ur.includes(trimmed) ||
      cat.synonyms.some((s) => s.toLowerCase().includes(trimmed));
    if (match) {
      results.push({
        kind: 'category',
        label_en: cat.name_en,
        label_ur: cat.name_ur,
        slug: cat.slug,
        subtitle: 'Category',
      });
    }
  }

  for (const area of db.areas) {
    if (!area.is_active) continue;
    if (area.name_en.toLowerCase().includes(trimmed) || area.name_ur.includes(trimmed)) {
      results.push({
        kind: 'area',
        label_en: area.name_en,
        label_ur: area.name_ur,
        slug: area.slug,
        subtitle: 'Neighborhood',
      });
    }
  }

  for (const biz of db.businesses) {
    if (biz.status !== 'published') continue;
    const match =
      biz.name_en.toLowerCase().includes(trimmed) ||
      (biz.name_ur ?? '').includes(trimmed) ||
      biz.tags.some((t) => t.toLowerCase().includes(trimmed));
    if (match) {
      const area = db.areas.find((a) => a.id === biz.area_id);
      results.push({
        kind: 'business',
        label_en: biz.name_en,
        label_ur: biz.name_ur ?? biz.name_en,
        slug: biz.slug,
        subtitle: area?.name_en ?? 'Sadiqabad',
      });
    }
  }

  return results.slice(0, 8);
}

export async function fetchBusinessBySlug(slug: string): Promise<BusinessPublicView | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('get_business_public', { p_slug: slug });
    if (!error && data) {
      return data as BusinessPublicView;
    }
  }
  const db = loadDemoDb();
  const found = db.businesses.find((b) => b.slug === slug && b.status === 'published');
  if (!found) return null;
  return enrichBusiness(found, db);
}

export async function fetchRelatedBusinesses(
  businessId: string,
  categoryId: string,
  limit = 6
): Promise<BusinessPublicView[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('related_businesses', {
      p_business_id: businessId,
      p_limit: limit,
    });
    if (!error && Array.isArray(data)) {
      return data as BusinessPublicView[];
    }
  }
  const db = loadDemoDb();
  return db.businesses
    .filter((b) => b.status === 'published' && b.id !== businessId && b.category_id === categoryId)
    .slice(0, limit)
    .map((b) => enrichBusiness(b, db));
}

export async function fetchEmergencyContacts(): Promise<{
  items: EmergencyContactRow[];
  fromCache: boolean;
  cachedAt: string | null;
}> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (!error && data) {
        const items = data as EmergencyContactRow[];
        cacheEmergencyContacts(items);
        return { items, fromCache: false, cachedAt: nowIso() };
      }
    } catch {
      const cached = getCachedEmergencyContacts();
      if (cached.items.length > 0) {
        return { items: cached.items, fromCache: true, cachedAt: cached.updated_at };
      }
    }
  }

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const cached = getCachedEmergencyContacts();
    if (cached.items.length > 0) {
      return { items: cached.items, fromCache: true, cachedAt: cached.updated_at };
    }
  }

  const items = [...loadDemoDb().emergency_contacts]
    .filter((e) => e.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  cacheEmergencyContacts(items);
  return { items, fromCache: false, cachedAt: nowIso() };
}

export async function fetchActiveOffers(): Promise<
  Array<OfferRow & { business: BusinessPublicView | null }>
> {
  const today = todayDateStr();
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('offers')
      .select('*, businesses(*, categories(*), areas(*))')
      .eq('status', 'active')
      .lte('valid_from', today)
      .gte('valid_to', today)
      .order('created_at', { ascending: false });
    if (!error && data) {
      type JoinedOffer = OfferRow & {
        businesses: (BusinessRow & { categories?: CategoryRow | null; areas?: AreaRow | null }) | null;
      };
      return (data as JoinedOffer[]).map((row) => ({
        ...row,
        business: row.businesses
          ? {
              ...row.businesses,
              category: row.businesses.categories ?? null,
              area: row.businesses.areas ?? null,
            }
          : null,
      }));
    }
  }
  const db = loadDemoDb();
  return db.offers
    .filter((o) => isOfferCurrentlyValid(o, today))
    .map((o) => {
      const biz = db.businesses.find((b) => b.id === o.business_id && b.status === 'published');
      return {
        ...o,
        business: biz ? enrichBusiness(biz, db) : null,
      };
    })
    .filter((o) => o.business !== null);
}

export async function fetchAnnouncements(activeOnly = true): Promise<AnnouncementRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const q = client.from('announcements').select('*').order('created_at', { ascending: false });
    const { data, error } = activeOnly ? await q.eq('is_active', true) : await q;
    if (!error && data) return data as AnnouncementRow[];
  }
  const db = loadDemoDb();
  const now = Date.now();
  return db.announcements
    .filter((a) => {
      if (!activeOnly) return true;
      return (
        a.is_active &&
        new Date(a.start_date).getTime() <= now &&
        new Date(a.end_date).getTime() >= now
      );
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function fetchActiveAds(placement?: AdPlacement): Promise<AdRow[]> {
  const today = todayDateStr();
  const client = getSupabaseClient();
  if (client) {
    let q = client
      .from('ads')
      .select('*')
      .eq('status', 'active')
      .lte('start_date', today)
      .gte('end_date', today);
    if (placement) q = q.eq('placement', placement);
    const { data, error } = await q;
    if (!error && data) return data as AdRow[];
  }
  const db = loadDemoDb();
  return db.ads.filter(
    (ad) =>
      ad.status === 'active' &&
      ad.start_date <= today &&
      ad.end_date >= today &&
      (!placement || ad.placement === placement)
  );
}

export async function fetchPageBySlug(slug: string): Promise<PageRow | null> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('pages')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();
    if (!error && data) return data as PageRow;
  }
  const db = loadDemoDb();
  return db.pages.find((p) => p.slug === slug && p.is_published) ?? null;
}

export async function fetchBusinessesByIds(ids: string[]): Promise<BusinessPublicView[]> {
  if (ids.length === 0) return [];
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('businesses')
      .select('*, categories(*), areas(*)')
      .in('id', ids)
      .eq('status', 'published');
    if (!error && data) {
      return (
        data as Array<BusinessRow & { categories?: CategoryRow | null; areas?: AreaRow | null }>
      ).map((row) => ({
        ...row,
        category: row.categories ?? null,
        area: row.areas ?? null,
      }));
    }
  }
  const db = loadDemoDb();
  return ids
    .map((id) => db.businesses.find((b) => b.id === id && b.status === 'published'))
    .filter((b): b is BusinessRow => Boolean(b))
    .map((b) => enrichBusiness(b, db));
}

// ---------------------------------------------------------------------------
// PUBLIC EDGE FUNCTION WRITES (Reviews, Inquiries, Submissions, Tracking)
// ---------------------------------------------------------------------------

export async function trackBusinessEvent(
  businessId: string,
  eventType: BusinessEventType,
  adId?: string
): Promise<void> {
  const sessionId = getOrCreateSessionId();
  const client = getSupabaseClient();
  if (client) {
    await client.functions.invoke('track-event', {
      body: { business_id: businessId, event_type: eventType, ad_id: adId, session_id: sessionId },
    });
    return;
  }

  const db = loadDemoDb();
  const biz = db.businesses.find((b) => b.id === businessId);
  if (biz) {
    if (eventType === 'view') biz.view_count += 1;
    if (eventType === 'call') biz.call_count += 1;
    if (eventType === 'whatsapp') biz.whatsapp_count += 1;
  }

  const today = todayDateStr();
  let stat = db.daily_stats.find((s) => s.business_id === businessId && s.stat_date === today);
  if (!stat) {
    stat = { business_id: businessId, stat_date: today, views: 0, calls: 0, whatsapp: 0, directions: 0, shares: 0 };
    db.daily_stats.push(stat);
  }
  if (eventType === 'view') stat.views += 1;
  if (eventType === 'call') stat.calls += 1;
  if (eventType === 'whatsapp') stat.whatsapp += 1;
  if (eventType === 'directions') stat.directions += 1;
  if (eventType === 'share') stat.shares += 1;

  if (adId) {
    const ad = db.ads.find((a) => a.id === adId);
    if (ad) ad.clicks += 1;
  }
  saveDemoDb(db);
}

export async function trackAdImpression(adId: string): Promise<void> {
  if (!adId) return;
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.functions.invoke('track-event', {
        body: { ad_id: adId, event_type: 'ad_impression', session_id: getOrCreateSessionId() },
      });
    } catch {
      // ignore non-critical telemetry error
    }
    return;
  }
  const db = loadDemoDb();
  const ad = db.ads.find((a) => a.id === adId);
  if (ad) {
    ad.impressions += 1;
    saveDemoDb(db);
  }
}

export async function submitPublicReview(input: {
  business_id: string;
  author_name: string;
  rating: number;
  comment: string;
  website_hp?: string;
}): Promise<EdgeFunctionResult> {
  if (input.website_hp) return { ok: true }; // honeypot silent ignore
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.functions.invoke('submit-review', {
      body: { ...input, session_id: getOrCreateSessionId() },
    });
    if (error) return { ok: false, error: error.message };
    return (data as EdgeFunctionResult) ?? { ok: true };
  }

  const db = loadDemoDb();
  const settings = parseSiteSettings(db.site_settings);
  const autoApprove = !settings.reviews_require_approval;
  const review: ReviewRow = {
    id: uid('rev'),
    business_id: input.business_id,
    author_name: input.author_name.trim(),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    comment: input.comment.trim(),
    status: autoApprove ? 'approved' : 'pending',
    owner_reply: null,
    owner_reply_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.reviews.unshift(review);

  const biz = db.businesses.find((b) => b.id === input.business_id);
  if (biz && autoApprove) {
    const approved = db.reviews.filter((r) => r.business_id === biz.id && r.status === 'approved');
    biz.rating_count = approved.length;
    biz.rating_avg =
      approved.length > 0
        ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / approved.length) * 10) / 10
        : null;
  }
  if (biz?.owner_id) {
    db.notifications.unshift({
      id: uid('notif'),
      user_id: biz.owner_id,
      type: 'review',
      title_en: `New review from ${review.author_name}`,
      title_ur: `${review.author_name} کی طرف سے نیا تبصرہ`,
      body_en: `${review.rating}★ — ${review.comment.slice(0, 80)}`,
      body_ur: `${review.rating}★ — ${review.comment.slice(0, 80)}`,
      link_path: '/owner/reviews',
      is_read: false,
      created_at: nowIso(),
    });
  }
  saveDemoDb(db);
  return { ok: true, data: review };
}

export async function submitPublicInquiry(input: {
  business_id: string;
  name: string;
  phone: string;
  message: string;
  website_hp?: string;
}): Promise<EdgeFunctionResult> {
  if (input.website_hp) return { ok: true };
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.functions.invoke('submit-inquiry', {
      body: { ...input, session_id: getOrCreateSessionId() },
    });
    if (error) return { ok: false, error: error.message };
    return (data as EdgeFunctionResult) ?? { ok: true };
  }

  const db = loadDemoDb();
  const inq: InquiryRow = {
    id: uid('inq'),
    business_id: input.business_id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    message: input.message.trim(),
    status: 'new',
    handled_by: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.inquiries.unshift(inq);

  const biz = db.businesses.find((b) => b.id === input.business_id);
  if (biz?.owner_id) {
    db.notifications.unshift({
      id: uid('notif'),
      user_id: biz.owner_id,
      type: 'inquiry',
      title_en: `New Inquiry from ${inq.name}`,
      title_ur: `${inq.name} کی جانب سے نیا پیغام`,
      body_en: inq.message.slice(0, 100),
      body_ur: inq.message.slice(0, 100),
      link_path: '/owner/inquiries',
      is_read: false,
      created_at: nowIso(),
    });
  }
  saveDemoDb(db);
  return { ok: true, data: inq };
}

export async function submitPublicSuggestion(input: {
  type: SubmissionType;
  business_id?: string | null;
  payload: Record<string, unknown>;
  contact_name?: string;
  contact_phone?: string;
  website_hp?: string;
}): Promise<EdgeFunctionResult> {
  if (input.website_hp) return { ok: true };
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.functions.invoke('submit-suggestion', {
      body: { ...input, session_id: getOrCreateSessionId() },
    });
    if (error) return { ok: false, error: error.message };
    return (data as EdgeFunctionResult) ?? { ok: true };
  }

  const db = loadDemoDb();
  const sub: SubmissionRow = {
    id: uid('sub'),
    type: input.type,
    business_id: input.business_id ?? null,
    payload: input.payload,
    contact_name: input.contact_name?.trim() || null,
    contact_phone: input.contact_phone?.trim() || null,
    status: 'new',
    assigned_to: null,
    admin_note: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.submissions.unshift(sub);
  saveDemoDb(db);
  return { ok: true, data: sub };
}

// ---------------------------------------------------------------------------
// OWNER PORTAL READS & MUTATIONS
// ---------------------------------------------------------------------------

export async function fetchOwnerListings(ownerId: string): Promise<BusinessPublicView[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId)
      .order('updated_at', { ascending: false });
    if (!error && data) {
      const db = loadDemoDb();
      return (data as BusinessRow[]).map((b) => enrichBusiness(b, db));
    }
  }
  const db = loadDemoDb();
  return db.businesses
    .filter((b) => b.owner_id === ownerId)
    .map((b) => enrichBusiness(b, db));
}

export async function fetchOwnerDashboardStats(
  businessId: string,
  days = 30
): Promise<OwnerDashboardStats> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('owner_dashboard_stats', {
      p_business_id: businessId,
      p_days: days,
    });
    if (!error && data) return data as OwnerDashboardStats;
  }

  const db = loadDemoDb();
  const biz = db.businesses.find((b) => b.id === businessId);
  const series = db.daily_stats
    .filter((s) => s.business_id === businessId)
    .sort((a, b) => a.stat_date.localeCompare(b.stat_date))
    .slice(-days);

  const totals = series.reduce(
    (acc, s) => ({
      views: acc.views + s.views,
      calls: acc.calls + s.calls,
      whatsapp: acc.whatsapp + s.whatsapp,
      directions: acc.directions + s.directions,
      shares: acc.shares + s.shares,
    }),
    { views: 0, calls: 0, whatsapp: 0, directions: 0, shares: 0 }
  );

  if (totals.views === 0 && biz) {
    totals.views = biz.view_count;
    totals.calls = biz.call_count;
    totals.whatsapp = biz.whatsapp_count;
  }

  return {
    totals,
    series,
    top_search_terms: [
      { query: biz?.name_en.split(' ')[0].toLowerCase() ?? 'mart', count: 42 },
      { query: 'rail bazaar grocery', count: 29 },
      { query: 'home delivery sadiqabad', count: 18 },
    ],
  };
}

export async function updateOwnerBusiness(
  businessId: string,
  patch: Partial<BusinessRow>,
  actorId: string
): Promise<BusinessRow> {
  // Never let owner mutate protected billing/verification columns directly
  const {
    plan_code: _pc,
    plan_expires_at: _pe,
    is_verified: _iv,
    is_featured: _if,
    owner_id: _oid,
    status: requestedStatus,
    ...safePatch
  } = patch;

  const client = getSupabaseClient();
  if (client) {
    const updatePayload: Record<string, unknown> = { ...safePatch, updated_at: nowIso() };
    const [{ data: curr }, settings] = await Promise.all([
      client.from('businesses').select('status').eq('id', businessId).single(),
      fetchPublicSiteSettings(),
    ]);
    if (curr) {
      if (
        requestedStatus === 'pending_approval' &&
        (curr.status === 'draft' || curr.status === 'rejected')
      ) {
        updatePayload.status = 'pending_approval';
      } else if (curr.status === 'published' && settings.owner_edits_require_approval) {
        updatePayload.status = 'pending_approval';
      }
    }
    const { data, error } = await client
      .from('businesses')
      .update(updatePayload)
      .eq('id', businessId)
      .select()
      .single();
    if (error) throw error;
    return data as BusinessRow;
  }

  const db = loadDemoDb();
  const idx = db.businesses.findIndex((b) => b.id === businessId);
  if (idx === -1) throw new Error('Listing not found');
  const current = db.businesses[idx];
  const requiresApproval = parseSiteSettings(db.site_settings).owner_edits_require_approval;
  let nextStatus = current.status;
  if (
    requestedStatus === 'pending_approval' &&
    (current.status === 'draft' || current.status === 'rejected')
  ) {
    nextStatus = 'pending_approval';
  } else if (current.status === 'published' && requiresApproval) {
    nextStatus = 'pending_approval';
  }
  const updated: BusinessRow = {
    ...current,
    ...safePatch,
    status: nextStatus,
    phone_normalized: safePatch.phone_primary
      ? normalizePkPhone(safePatch.phone_primary)
      : current.phone_normalized,
    updated_at: nowIso(),
  };
  db.businesses[idx] = updated;
  appendAuditDemo(db, actorId, 'business.owner_update', 'businesses', businessId, {
    fields: Object.keys(safePatch),
    status_transition: current.status !== nextStatus ? `${current.status}->${nextStatus}` : null,
  });
  saveDemoDb(db);
  return updated;
}

export async function fetchBusinessOffers(businessId: string): Promise<OfferRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('offers')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as OfferRow[];
  }
  return loadDemoDb().offers.filter((o) => o.business_id === businessId);
}

export async function upsertOffer(
  offer: Partial<OfferRow> & { business_id: string; title: string; valid_from: string; valid_to: string }
): Promise<OfferRow> {
  const client = getSupabaseClient();
  if (client) {
    const payload = {
      ...offer,
      status: offer.status ?? 'active',
      updated_at: nowIso(),
    };
    const { data, error } = await client.from('offers').upsert(payload).select().single();
    if (error) throw error;
    return data as OfferRow;
  }

  const db = loadDemoDb();
  if (offer.id) {
    const idx = db.offers.findIndex((o) => o.id === offer.id);
    if (idx !== -1) {
      db.offers[idx] = { ...db.offers[idx], ...offer, updated_at: nowIso() };
      saveDemoDb(db);
      return db.offers[idx];
    }
  }
  const created: OfferRow = {
    id: uid('offer'),
    business_id: offer.business_id,
    title: offer.title,
    description: offer.description ?? null,
    image_url: offer.image_url ?? null,
    valid_from: offer.valid_from,
    valid_to: offer.valid_to,
    status: offer.status ?? 'active',
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.offers.unshift(created);
  saveDemoDb(db);
  return created;
}

export async function deleteOffer(offerId: string): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('offers').delete().eq('id', offerId);
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  db.offers = db.offers.filter((o) => o.id !== offerId);
  saveDemoDb(db);
}

export async function fetchOwnerReviews(businessIds: string[]): Promise<ReviewRow[]> {
  if (businessIds.length === 0) return [];
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .in('business_id', businessIds)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (!error && data) return data as ReviewRow[];
  }
  return loadDemoDb().reviews.filter(
    (r) => businessIds.includes(r.business_id) && r.status === 'approved'
  );
}

export async function replyToReview(reviewId: string, replyText: string): Promise<void> {
  const trimmed = replyText.trim();
  if (!trimmed) {
    throw new Error('Reply cannot be empty.');
  }
  if (trimmed.length > 500) {
    throw new Error('Reply must be 500 characters or fewer.');
  }
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.rpc('owner_reply_to_review', {
      p_review_id: reviewId,
      p_reply: trimmed,
    });
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  const rev = db.reviews.find((r) => r.id === reviewId);
  if (!rev) throw new Error('Review not found');
  rev.owner_reply = trimmed;
  rev.owner_reply_at = nowIso();
  rev.updated_at = nowIso();
  saveDemoDb(db);
}

export async function fetchOwnerInquiries(businessIds: string[]): Promise<InquiryRow[]> {
  if (businessIds.length === 0) return [];
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('inquiries')
      .select('*')
      .in('business_id', businessIds)
      .order('created_at', { ascending: false });
    if (!error && data) return data as InquiryRow[];
  }
  return loadDemoDb().inquiries.filter((i) => businessIds.includes(i.business_id));
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus,
  handledBy?: string | null
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('inquiries')
      .update({ status, handled_by: handledBy ?? null, updated_at: nowIso() })
      .eq('id', inquiryId);
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  const inq = db.inquiries.find((i) => i.id === inquiryId);
  if (inq) {
    inq.status = status;
    inq.handled_by = handledBy ?? inq.handled_by;
    inq.updated_at = nowIso();
    saveDemoDb(db);
  }
}

export async function fetchNotifications(userId: string): Promise<NotificationRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as NotificationRow[];
  }
  return loadDemoDb().notifications.filter((n) => n.user_id === userId);
}

export async function markNotificationsRead(userId: string, ids?: string[]): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.rpc('mark_notifications_read', { p_ids: ids ?? null });
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  for (const n of db.notifications) {
    if (n.user_id === userId && (!ids || ids.includes(n.id))) {
      n.is_read = true;
    }
  }
  saveDemoDb(db);
}

// ---------------------------------------------------------------------------
// ADMIN & STAFF PORTAL
// ---------------------------------------------------------------------------

export async function fetchMyPermissions(userId: string): Promise<MyPermissionsRpcResult> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('my_permissions');
    if (!error && data) return data as MyPermissionsRpcResult;
  }
  const db = loadDemoDb();
  const profile = db.profiles.find((p) => p.id === userId);
  const staff = db.staff_members.find((s) => s.user_id === userId);
  const role: UserRole = profile?.role ?? 'owner';
  const isActive = db.user_active[userId] ?? true;

  if (role === 'super_admin') {
    return {
      role,
      is_active: true,
      staff_types: [],
      permissions: [
        'business.create',
        'business.edit_own',
        'business.publish',
        'import.run',
        'leads.manage',
        'owners.create',
        'tiers.manage',
        'ads.review',
        'moderation.review',
        'support.read',
        'analytics.view',
        'announcements.manage',
        'settings.manage',
      ],
    };
  }

  if (role === 'staff' && staff) {
    const typePerms: Record<StaffType, MyPermissionsRpcResult['permissions']> = {
      data_entry: ['business.create', 'business.edit_own'],
      importer: ['import.run'],
      sales_onboarding: ['leads.manage', 'owners.create', 'tiers.manage', 'ads.review'],
      listing_manager: ['business.create', 'business.edit_own', 'business.publish'],
      moderator: ['moderation.review'],
      support: ['support.read', 'moderation.review'],
    };
    const set = new Set<MyPermissionsRpcResult['permissions'][number]>();
    for (const st of staff.staff_types) {
      for (const p of typePerms[st] ?? []) set.add(p);
    }
    for (const [k, v] of Object.entries(staff.permissions ?? {})) {
      if (v) set.add(k as MyPermissionsRpcResult['permissions'][number]);
      else set.delete(k as MyPermissionsRpcResult['permissions'][number]);
    }
    return {
      role,
      is_active: staff.is_active && isActive,
      staff_types: staff.staff_types,
      permissions: Array.from(set),
    };
  }

  return {
    role: 'owner',
    is_active: isActive,
    staff_types: [],
    permissions: [],
  };
}

export async function fetchAdminDashboardCounts(): Promise<AdminDashboardCounts> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('admin_dashboard_counts');
    if (!error && data) return data as AdminDashboardCounts;
  }
  const db = loadDemoDb();
  return {
    pending_businesses: db.businesses.filter((b) => b.status === 'pending_approval').length,
    pending_reviews: db.reviews.filter((r) => r.status === 'pending').length,
    new_submissions: db.submissions.filter(
      (s) => s.status === 'new' || s.status === 'in_review'
    ).length,
    open_leads: db.leads.filter((l) => !['converted', 'dropped', 'not_interested'].includes(l.status)).length,
    expiring_plans: db.businesses.filter((b) => {
      if (b.plan_code === 'free' || !b.plan_expires_at) return false;
      const d = daysUntil(b.plan_expires_at);
      return d !== null && d <= 14;
    }).length,
    published_businesses: db.businesses.filter((b) => b.status === 'published').length,
  };
}

export async function fetchAdminBusinesses(): Promise<BusinessPublicView[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('businesses')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) {
      const db = loadDemoDb();
      return (data as BusinessRow[]).map((b) => enrichBusiness(b, db));
    }
  }
  const db = loadDemoDb();
  return db.businesses.map((b) => enrichBusiness(b, db));
}

export async function adminUpsertBusiness(
  input: Partial<BusinessRow> & { name_en: string; phone_primary: string; category_id: string },
  actorId: string
): Promise<BusinessRow> {
  const normalized = normalizePkPhone(input.phone_primary);
  const slug = input.slug?.trim() || `${slugify(input.name_en)}-${Math.random().toString(36).slice(2, 5)}`;

  const client = getSupabaseClient();
  if (client) {
    const payload = {
      ...input,
      slug,
      city_id: input.city_id ?? SEED_CITY.id,
      phone_normalized: normalized,
      updated_at: nowIso(),
    };
    const { data, error } = await client.from('businesses').upsert(payload).select().single();
    if (error) throw error;
    return data as BusinessRow;
  }

  const db = loadDemoDb();
  if (input.id) {
    const idx = db.businesses.findIndex((b) => b.id === input.id);
    if (idx !== -1) {
      const updated: BusinessRow = {
        ...db.businesses[idx],
        ...input,
        phone_normalized: normalized,
        published_at:
          input.status === 'published' && !db.businesses[idx].published_at
            ? nowIso()
            : db.businesses[idx].published_at,
        updated_at: nowIso(),
      };
      db.businesses[idx] = updated;
      appendAuditDemo(db, actorId, 'business.update', 'businesses', updated.id, {
        status: updated.status,
        plan_code: updated.plan_code,
      });
      saveDemoDb(db);
      return updated;
    }
  }

  const created: BusinessRow = {
    id: uid('biz'),
    city_id: db.city.id,
    owner_id: input.owner_id ?? null,
    name_en: input.name_en,
    name_ur: input.name_ur ?? null,
    slug,
    category_id: input.category_id,
    area_id: input.area_id ?? null,
    address_en: input.address_en ?? null,
    address_ur: input.address_ur ?? null,
    landmark_en: input.landmark_en ?? null,
    landmark_ur: input.landmark_ur ?? null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    phone_primary: input.phone_primary,
    phone_secondary: input.phone_secondary ?? null,
    phone_normalized: normalized,
    whatsapp: input.whatsapp ?? null,
    email: input.email ?? null,
    website_url: input.website_url ?? null,
    facebook_url: input.facebook_url ?? null,
    instagram_url: input.instagram_url ?? null,
    youtube_url: input.youtube_url ?? null,
    tiktok_url: input.tiktok_url ?? null,
    description_en: input.description_en ?? null,
    description_ur: input.description_ur ?? null,
    services_en: input.services_en ?? [],
    services_ur: input.services_ur ?? [],
    logo_url: input.logo_url ?? null,
    cover_url: input.cover_url ?? null,
    owner_name: input.owner_name ?? null,
    owner_photo_url: input.owner_photo_url ?? null,
    gallery_urls: input.gallery_urls ?? [],
    video_urls: input.video_urls ?? [],
    opening_hours: input.opening_hours ?? null,
    is_open_24h: input.is_open_24h ?? false,
    home_delivery: input.home_delivery ?? false,
    established_year: input.established_year ?? null,
    status: input.status ?? 'pending_approval',
    rejection_reason: input.rejection_reason ?? null,
    plan_code: input.plan_code ?? 'free',
    plan_expires_at: input.plan_expires_at ?? null,
    is_verified: input.is_verified ?? false,
    is_featured: input.is_featured ?? false,
    tags: input.tags ?? [],
    meta_title_en: input.meta_title_en ?? null,
    meta_description_en: input.meta_description_en ?? null,
    rating_avg: null,
    rating_count: 0,
    view_count: 0,
    call_count: 0,
    whatsapp_count: 0,
    source: input.source ?? 'admin',
    created_by: actorId,
    assigned_to: input.assigned_to ?? null,
    published_at: input.status === 'published' ? nowIso() : null,
    claimed_at: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.businesses.unshift(created);
  appendAuditDemo(db, actorId, 'business.create', 'businesses', created.id, {
    name_en: created.name_en,
  });
  saveDemoDb(db);
  return created;
}

export async function findDuplicateBusinesses(
  phone: string,
  name: string,
  areaId?: string | null
): Promise<BusinessRow[]> {
  const norm = normalizePkPhone(phone);
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('find_duplicate_businesses', {
      p_phone_normalized: norm,
      p_name: name,
      p_area_id: areaId ?? null,
    });
    if (!error && Array.isArray(data)) return data as BusinessRow[];
  }
  const db = loadDemoDb();
  const lower = name.trim().toLowerCase();
  return db.businesses.filter(
    (b) =>
      (norm && b.phone_normalized === norm) ||
      (lower.length >= 3 && b.name_en.toLowerCase().includes(lower))
  );
}

export async function fetchBusinessNotes(businessId: string): Promise<BusinessNoteRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('business_notes')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (!error && data) return data as BusinessNoteRow[];
  }
  return loadDemoDb().business_notes.filter((n) => n.business_id === businessId);
}

export async function addBusinessNote(
  businessId: string,
  authorId: string,
  note: string
): Promise<BusinessNoteRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('business_notes')
      .insert({ business_id: businessId, author_id: authorId, note })
      .select()
      .single();
    if (error) throw error;
    return data as BusinessNoteRow;
  }
  const db = loadDemoDb();
  const created: BusinessNoteRow = {
    id: uid('note'),
    business_id: businessId,
    author_id: authorId,
    note: note.trim(),
    created_at: nowIso(),
  };
  db.business_notes.unshift(created);
  saveDemoDb(db);
  return created;
}

export async function fetchAllReviewsAdmin(): Promise<ReviewRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as ReviewRow[];
  }
  return loadDemoDb().reviews;
}

export async function moderateReview(
  reviewId: string,
  status: 'approved' | 'rejected',
  actorId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('reviews')
      .update({ status, updated_at: nowIso() })
      .eq('id', reviewId);
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  const rev = db.reviews.find((r) => r.id === reviewId);
  if (!rev) return;
  rev.status = status;
  rev.updated_at = nowIso();

  const biz = db.businesses.find((b) => b.id === rev.business_id);
  if (biz) {
    const approved = db.reviews.filter((r) => r.business_id === biz.id && r.status === 'approved');
    biz.rating_count = approved.length;
    biz.rating_avg =
      approved.length > 0
        ? Math.round((approved.reduce((s, r) => s + r.rating, 0) / approved.length) * 10) / 10
        : null;
  }
  appendAuditDemo(db, actorId, `review.${status}`, 'reviews', reviewId, {
    business_id: rev.business_id,
  });
  saveDemoDb(db);
}

export async function fetchAllSubmissionsAdmin(): Promise<SubmissionRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('submissions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as SubmissionRow[];
  }
  return loadDemoDb().submissions;
}

export async function reviewSubmission(
  submissionId: string,
  action: 'approve' | 'reject' | 'in_review',
  adminNote: string,
  actorId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    if (action === 'approve') {
      const { error } = await client.rpc('approve_submission', {
        p_submission_id: submissionId,
        p_action: 'approve',
      });
      if (error) throw error;
      return;
    }
    const status: SubmissionStatus = action === 'reject' ? 'rejected' : 'in_review';
    const { error } = await client
      .from('submissions')
      .update({ status, admin_note: adminNote || null, updated_at: nowIso() })
      .eq('id', submissionId);
    if (error) throw error;
    return;
  }

  const db = loadDemoDb();
  const sub = db.submissions.find((s) => s.id === submissionId);
  if (!sub) return;
  sub.admin_note = adminNote || sub.admin_note;
  sub.updated_at = nowIso();

  if (action === 'approve') {
    sub.status = 'done';
    const p = sub.payload as Record<string, unknown>;
    if (sub.type === 'new_business') {
      await adminUpsertBusiness(
        {
          name_en: String(p.name_en || 'New Sadiqabad Business'),
          name_ur: typeof p.name_ur === 'string' ? p.name_ur : null,
          category_id: String(p.category_id || db.categories[0].id),
          area_id: typeof p.area_id === 'string' ? p.area_id : null,
          address_en: typeof p.address_en === 'string' ? p.address_en : null,
          landmark_en: typeof p.landmark_en === 'string' ? p.landmark_en : null,
          description_en: typeof p.description_en === 'string' ? p.description_en : null,
          phone_primary: String(p.phone_primary || sub.contact_phone || '0300-0000000'),
          whatsapp: typeof p.whatsapp === 'string' ? p.whatsapp : null,
          logo_url: typeof p.logo_url === 'string' ? p.logo_url : null,
          cover_url: typeof p.cover_url === 'string' ? p.cover_url : null,
          services_en: Array.isArray(p.services_en) ? (p.services_en as string[]) : [],
          status: 'published',
          source: 'visitor_submission',
        },
        actorId
      );
    } else if ((sub.type === 'correction' || sub.type === 'phone_suggestion') && sub.business_id) {
      const biz = db.businesses.find((b) => b.id === sub.business_id);
      if (biz) {
        if (typeof p.phone_primary === 'string' && p.phone_primary) {
          biz.phone_primary = p.phone_primary;
          biz.phone_normalized = normalizePkPhone(p.phone_primary);
        }
        if (typeof p.address_en === 'string' && p.address_en) biz.address_en = p.address_en;
        if (typeof p.reason === 'string' && p.reason.toLowerCase().includes('permanently closed')) {
          biz.status = 'archived';
        }
        biz.updated_at = nowIso();
      }
    } else if (sub.type === 'claim' && sub.business_id) {
      const biz = db.businesses.find((b) => b.id === sub.business_id);
      if (biz) {
        biz.claimed_at = nowIso();
        biz.is_verified = true;
        if (typeof p.owner_name === 'string' && p.owner_name) biz.owner_name = p.owner_name;
        biz.updated_at = nowIso();
      }
    } else if (sub.type === 'report' && sub.business_id) {
      const biz = db.businesses.find((b) => b.id === sub.business_id);
      if (biz && typeof p.reason === 'string' && p.reason.toLowerCase().includes('permanently closed')) {
        biz.status = 'archived';
        biz.updated_at = nowIso();
      }
    } else if (sub.type === 'broken_image' && sub.business_id) {
      const biz = db.businesses.find((b) => b.id === sub.business_id);
      if (biz) {
        biz.updated_at = nowIso();
      }
    } else if (sub.type === 'plan_upgrade' && sub.business_id) {
      const biz = db.businesses.find((b) => b.id === sub.business_id);
      if (biz && (p.requested_plan === 'basic' || p.requested_plan === 'premium')) {
        biz.plan_code = p.requested_plan;
        const nextYr = new Date();
        nextYr.setFullYear(nextYr.getFullYear() + 1);
        biz.plan_expires_at = nextYr.toISOString();
        biz.updated_at = nowIso();
      }
    }
  } else {
    sub.status = action === 'reject' ? 'rejected' : 'in_review';
  }
  appendAuditDemo(db, actorId, `submission.${action}`, 'submissions', submissionId);
  saveDemoDb(db);
}

export async function bulkUpdateBusinesses(
  ids: string[],
  patch: Partial<Pick<BusinessRow, 'status' | 'category_id' | 'area_id' | 'assigned_to' | 'is_verified'>>,
  actorId: string
): Promise<void> {
  if (ids.length === 0) return;
  const client = getSupabaseClient();
  if (client) {
    const updatePayload: Record<string, unknown> = { ...patch, updated_at: nowIso() };
    if (patch.status === 'published') updatePayload.published_at = nowIso();
    const { error } = await client.from('businesses').update(updatePayload).in('id', ids);
    if (error) throw error;
    return;
  }

  const db = loadDemoDb();
  for (const id of ids) {
    const biz = db.businesses.find((b) => b.id === id);
    if (!biz) continue;
    Object.assign(biz, patch);
    if (patch.status === 'published' && !biz.published_at) {
      biz.published_at = nowIso();
    }
    biz.updated_at = nowIso();
  }
  appendAuditDemo(db, actorId, 'business.bulk_update', 'businesses', ids.join(','), patch);
  saveDemoDb(db);
}

export async function fetchAllInquiriesAdmin(): Promise<InquiryRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as InquiryRow[];
  }
  return loadDemoDb().inquiries;
}

export async function fetchLeads(): Promise<LeadRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('leads')
      .select('*')
      .order('updated_at', { ascending: false });
    if (!error && data) return data as LeadRow[];
  }
  return loadDemoDb().leads;
}

export async function upsertLead(
  input: Partial<LeadRow> & { name: string; phone: string },
  actorId: string
): Promise<LeadRow> {
  const norm = normalizePkPhone(input.phone);
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('leads')
      .upsert({
        ...input,
        phone_normalized: norm,
        created_by: input.created_by ?? actorId,
        updated_at: nowIso(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as LeadRow;
  }

  const db = loadDemoDb();
  if (input.id) {
    const idx = db.leads.findIndex((l) => l.id === input.id);
    if (idx !== -1) {
      db.leads[idx] = { ...db.leads[idx], ...input, phone_normalized: norm, updated_at: nowIso() };
      saveDemoDb(db);
      return db.leads[idx];
    }
  }
  const created: LeadRow = {
    id: uid('lead'),
    name: input.name,
    phone: input.phone,
    phone_normalized: norm,
    category_text: input.category_text ?? null,
    area_text: input.area_text ?? null,
    address: input.address ?? null,
    status: (input.status as LeadStatus) ?? 'new',
    notes: input.notes ?? null,
    assigned_to: input.assigned_to ?? actorId,
    created_by: actorId,
    converted_business_id: null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.leads.unshift(created);
  saveDemoDb(db);
  return created;
}

export async function convertLeadToBusiness(leadId: string, actorId: string): Promise<string> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('convert_lead', { p_lead_id: leadId });
    if (error) throw error;
    return String(data);
  }
  const db = loadDemoDb();
  const lead = db.leads.find((l) => l.id === leadId);
  if (!lead) throw new Error('Lead not found');
  const matchingCat =
    db.categories.find((c) =>
      c.name_en.toLowerCase().includes((lead.category_text ?? '').toLowerCase())
    ) ?? db.categories[0];
  const created = await adminUpsertBusiness(
    {
      name_en: lead.name,
      phone_primary: lead.phone,
      category_id: matchingCat.id,
      address_en: lead.address,
      status: 'draft',
      source: 'lead_conversion',
    },
    actorId
  );
  lead.status = 'converted';
  lead.converted_business_id = created.id;
  lead.updated_at = nowIso();
  appendAuditDemo(db, actorId, 'lead.convert', 'leads', leadId, {
    converted_business_id: created.id,
  });
  saveDemoDb(db);
  return created.id;
}

export async function fetchProfilesAdmin(): Promise<
  Array<ProfileRow & { email?: string; is_active?: boolean; staff?: StaffMemberRow | null }>
> {
  const db = loadDemoDb();
  const client = getSupabaseClient();
  if (client) {
    const [profRes, staffRes] = await Promise.all([
      client.from('profiles').select('*').order('created_at', { ascending: false }),
      client.from('staff_members').select('*'),
    ]);
    if (!profRes.error && profRes.data) {
      const staffRows = (staffRes.data ?? []) as StaffMemberRow[];
      return (profRes.data as ProfileRow[]).map((p) => ({
        ...p,
        staff: staffRows.find((s) => s.user_id === p.id) ?? null,
      }));
    }
  }
  return db.profiles.map((p) => ({
    ...p,
    email: db.user_emails[p.id],
    is_active: db.user_active[p.id] ?? true,
    staff: db.staff_members.find((s) => s.user_id === p.id) ?? null,
  }));
}

export async function adminCreateUser(
  input: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: UserRole;
    staff_types?: StaffType[];
    permissions?: Record<string, boolean>;
    assign_business_id?: string;
  },
  actorId: string
): Promise<EdgeFunctionResult<{ user_id: string }>> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.functions.invoke('admin-create-user', { body: input });
    if (error) return { ok: false, error: error.message };
    return (data as EdgeFunctionResult<{ user_id: string }>) ?? { ok: true };
  }

  const db = loadDemoDb();
  const newId = uid('user');
  db.profiles.unshift({
    id: newId,
    role: input.role,
    full_name: input.full_name,
    phone: input.phone ?? null,
    avatar_url: null,
    must_change_password: true,
    created_at: nowIso(),
    updated_at: nowIso(),
  });
  db.user_emails[newId] = input.email.toLowerCase();
  db.user_active[newId] = true;

  if (input.role === 'staff') {
    db.staff_members.push({
      id: uid('staff'),
      user_id: newId,
      staff_types: input.staff_types ?? ['data_entry'],
      permissions: input.permissions ?? {},
      is_active: true,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  }
  if (input.assign_business_id) {
    const biz = db.businesses.find((b) => b.id === input.assign_business_id);
    if (biz) {
      biz.owner_id = newId;
      biz.claimed_at = nowIso();
    }
  }
  appendAuditDemo(db, actorId, 'user.create', 'profiles', newId, {
    role: input.role,
    email: input.email,
  });
  saveDemoDb(db);
  return { ok: true, data: { user_id: newId } };
}

export async function adminResetUserPassword(
  userId: string,
  newPassword: string,
  actorId: string
): Promise<EdgeFunctionResult> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.functions.invoke('admin-reset-password', {
      body: { user_id: userId, new_password: newPassword },
    });
    if (error) return { ok: false, error: error.message };
    return (data as EdgeFunctionResult) ?? { ok: true };
  }
  const db = loadDemoDb();
  const prof = db.profiles.find((p) => p.id === userId);
  if (prof) {
    prof.must_change_password = true;
    prof.updated_at = nowIso();
  }
  appendAuditDemo(db, actorId, 'user.reset_password', 'profiles', userId);
  saveDemoDb(db);
  return { ok: true };
}

export async function adminSetUserActive(
  userId: string,
  isActive: boolean,
  actorId: string
): Promise<EdgeFunctionResult> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.functions.invoke('admin-set-user-active', {
      body: { user_id: userId, is_active: isActive },
    });
    if (error) return { ok: false, error: error.message };
    return (data as EdgeFunctionResult) ?? { ok: true };
  }
  const db = loadDemoDb();
  db.user_active[userId] = isActive;
  const staff = db.staff_members.find((s) => s.user_id === userId);
  if (staff) staff.is_active = isActive;
  appendAuditDemo(db, actorId, 'user.set_active', 'profiles', userId, { is_active: isActive });
  saveDemoDb(db);
  return { ok: true };
}

export async function upsertStaffMember(
  userId: string,
  staffTypes: StaffType[],
  permissions: Record<string, boolean>,
  isActive: boolean,
  actorId: string
): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client.from('staff_members').upsert({
      user_id: userId,
      staff_types: staffTypes,
      permissions,
      is_active: isActive,
      updated_at: nowIso(),
    });
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  const existing = db.staff_members.find((s) => s.user_id === userId);
  if (existing) {
    existing.staff_types = staffTypes;
    existing.permissions = permissions;
    existing.is_active = isActive;
    existing.updated_at = nowIso();
  } else {
    db.staff_members.push({
      id: uid('staff'),
      user_id: userId,
      staff_types: staffTypes,
      permissions,
      is_active: isActive,
      created_at: nowIso(),
      updated_at: nowIso(),
    });
  }
  appendAuditDemo(db, actorId, 'staff.update', 'staff_members', userId, { staffTypes });
  saveDemoDb(db);
}

export async function fetchAllAdsAdmin(): Promise<AdRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('ads')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as AdRow[];
  }
  return loadDemoDb().ads;
}

export async function upsertAd(
  ad: Partial<AdRow> & { business_id: string; title: string; placement: AdPlacement; image_url: string },
  actorId: string
): Promise<AdRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('ads')
      .upsert({ ...ad, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data as AdRow;
  }
  const db = loadDemoDb();
  if (ad.id) {
    const idx = db.ads.findIndex((a) => a.id === ad.id);
    if (idx !== -1) {
      db.ads[idx] = { ...db.ads[idx], ...ad, reviewed_by: actorId, updated_at: nowIso() };
      appendAuditDemo(db, actorId, 'ad.update', 'ads', ad.id, { status: db.ads[idx].status });
      saveDemoDb(db);
      return db.ads[idx];
    }
  }
  const created: AdRow = {
    id: uid('ad'),
    business_id: ad.business_id,
    title: ad.title,
    placement: ad.placement,
    image_url: ad.image_url,
    target_url: ad.target_url ?? null,
    start_date: ad.start_date ?? todayDateStr(),
    end_date: ad.end_date ?? '2027-12-31',
    status: ad.status ?? 'active',
    notes: ad.notes ?? null,
    impressions: 0,
    clicks: 0,
    created_by: actorId,
    reviewed_by: actorId,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.ads.unshift(created);
  appendAuditDemo(db, actorId, 'ad.create', 'ads', created.id);
  saveDemoDb(db);
  return created;
}

export async function updatePlanRow(plan: PlanRow, actorId: string): Promise<PlanRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('plans')
      .update({
        name_en: plan.name_en,
        name_ur: plan.name_ur,
        limits: plan.limits,
        features: plan.features,
        price_note: plan.price_note,
        is_active: plan.is_active,
        updated_at: nowIso(),
      })
      .eq('id', plan.id)
      .select()
      .single();
    if (error) throw error;
    return data as PlanRow;
  }
  const db = loadDemoDb();
  const idx = db.plans.findIndex((p) => p.id === plan.id);
  if (idx !== -1) db.plans[idx] = { ...plan, updated_at: nowIso() };
  appendAuditDemo(db, actorId, 'plan.update', 'plans', plan.id, { code: plan.code });
  saveDemoDb(db);
  return plan;
}

export async function upsertCategory(
  cat: Partial<CategoryRow> & { name_en: string; name_ur: string; slug: string },
  actorId: string
): Promise<CategoryRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('categories')
      .upsert({ ...cat, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data as CategoryRow;
  }
  const db = loadDemoDb();
  if (cat.id) {
    const idx = db.categories.findIndex((c) => c.id === cat.id);
    if (idx !== -1) {
      db.categories[idx] = { ...db.categories[idx], ...cat, updated_at: nowIso() };
      saveDemoDb(db);
      return db.categories[idx];
    }
  }
  const created: CategoryRow = {
    id: uid('cat'),
    name_en: cat.name_en,
    name_ur: cat.name_ur,
    slug: cat.slug || slugify(cat.name_en),
    parent_id: cat.parent_id ?? null,
    icon: cat.icon ?? 'Store',
    color: cat.color ?? '#006948',
    sort_order: cat.sort_order ?? db.categories.length + 1,
    synonyms: cat.synonyms ?? [],
    is_active: cat.is_active ?? true,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.categories.push(created);
  appendAuditDemo(db, actorId, 'category.create', 'categories', created.id);
  saveDemoDb(db);
  return created;
}

export async function upsertArea(
  area: Partial<AreaRow> & { name_en: string; name_ur: string; slug: string },
  actorId: string
): Promise<AreaRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('areas')
      .upsert({ ...area, city_id: area.city_id ?? SEED_CITY.id, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data as AreaRow;
  }
  const db = loadDemoDb();
  if (area.id) {
    const idx = db.areas.findIndex((a) => a.id === area.id);
    if (idx !== -1) {
      db.areas[idx] = { ...db.areas[idx], ...area, updated_at: nowIso() };
      saveDemoDb(db);
      return db.areas[idx];
    }
  }
  const created: AreaRow = {
    id: uid('area'),
    city_id: db.city.id,
    name_en: area.name_en,
    name_ur: area.name_ur,
    slug: area.slug || slugify(area.name_en),
    is_active: area.is_active ?? true,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.areas.push(created);
  appendAuditDemo(db, actorId, 'area.create', 'areas', created.id);
  saveDemoDb(db);
  return created;
}

export async function upsertEmergencyContact(
  item: Partial<EmergencyContactRow> & { name_en: string; name_ur: string; phone: string },
  actorId: string
): Promise<EmergencyContactRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('emergency_contacts')
      .upsert({ ...item, city_id: item.city_id ?? SEED_CITY.id, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data as EmergencyContactRow;
  }
  const db = loadDemoDb();
  if (item.id) {
    const idx = db.emergency_contacts.findIndex((e) => e.id === item.id);
    if (idx !== -1) {
      db.emergency_contacts[idx] = { ...db.emergency_contacts[idx], ...item, updated_at: nowIso() };
      saveDemoDb(db);
      return db.emergency_contacts[idx];
    }
  }
  const created: EmergencyContactRow = {
    id: uid('em'),
    city_id: db.city.id,
    name_en: item.name_en,
    name_ur: item.name_ur,
    phone: item.phone,
    category: item.category ?? 'general',
    icon: item.icon ?? 'Phone',
    sort_order: item.sort_order ?? db.emergency_contacts.length + 1,
    is_active: item.is_active ?? true,
    description_en: item.description_en ?? null,
    description_ur: item.description_ur ?? null,
    whatsapp: item.whatsapp ?? null,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.emergency_contacts.push(created);
  appendAuditDemo(db, actorId, 'emergency.create', 'emergency_contacts', created.id);
  saveDemoDb(db);
  return created;
}

export async function upsertAnnouncement(
  ann: Partial<AnnouncementRow> & { title_en: string; title_ur: string; body_en: string; body_ur: string },
  actorId: string
): Promise<AnnouncementRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('announcements')
      .upsert({ ...ann, created_by: ann.created_by ?? actorId, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data as AnnouncementRow;
  }
  const db = loadDemoDb();
  if (ann.id) {
    const idx = db.announcements.findIndex((a) => a.id === ann.id);
    if (idx !== -1) {
      db.announcements[idx] = { ...db.announcements[idx], ...ann, updated_at: nowIso() };
      saveDemoDb(db);
      return db.announcements[idx];
    }
  }
  const created: AnnouncementRow = {
    id: uid('ann'),
    title_en: ann.title_en,
    title_ur: ann.title_ur,
    body_en: ann.body_en,
    body_ur: ann.body_ur,
    link_url: ann.link_url ?? null,
    start_date: ann.start_date ?? nowIso(),
    end_date: ann.end_date ?? '2027-12-31T00:00:00Z',
    is_active: ann.is_active ?? true,
    created_by: actorId,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  db.announcements.unshift(created);
  appendAuditDemo(db, actorId, 'announcement.create', 'announcements', created.id);
  saveDemoDb(db);
  return created;
}

export async function fetchImportBatches(): Promise<ImportBatchRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('import_batches')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data as ImportBatchRow[];
  }
  return loadDemoDb().import_batches;
}

export async function recordImportBatch(
  batch: Omit<ImportBatchRow, 'id' | 'created_at'>,
  rowsToInsert: Array<Partial<BusinessRow> & { name_en: string; phone_primary: string; category_id: string }>,
  actorId: string
): Promise<ImportBatchRow> {
  for (const row of rowsToInsert) {
    await adminUpsertBusiness(row, actorId);
  }
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('import_batches')
      .insert({ ...batch, created_by: actorId })
      .select()
      .single();
    if (error) throw error;
    return data as ImportBatchRow;
  }
  const db = loadDemoDb();
  const created: ImportBatchRow = {
    id: uid('imp'),
    ...batch,
    created_by: actorId,
    created_at: nowIso(),
  };
  db.import_batches.unshift(created);
  appendAuditDemo(db, actorId, 'import.run', 'import_batches', created.id, {
    imported: batch.imported_count,
    failed: batch.failed_count,
  });
  saveDemoDb(db);
  return created;
}

export async function fetchAdminAnalytics(days = 30): Promise<AdminAnalyticsData> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.rpc('admin_analytics', { p_days: days });
    if (!error && data) return data as AdminAnalyticsData;
  }

  const db = loadDemoDb();
  const dateMap = new Map<string, { views: number; calls: number; whatsapp: number }>();
  for (const s of db.daily_stats) {
    const prev = dateMap.get(s.stat_date) ?? { views: 0, calls: 0, whatsapp: 0 };
    dateMap.set(s.stat_date, {
      views: prev.views + s.views,
      calls: prev.calls + s.calls,
      whatsapp: prev.whatsapp + s.whatsapp,
    });
  }
  const daily_traffic = Array.from(dateMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([date, val]) => ({ date, ...val }));

  const top_businesses = [...db.businesses]
    .sort((a, b) => b.view_count - a.view_count)
    .slice(0, 8)
    .map((b) => ({
      id: b.id,
      name_en: b.name_en,
      slug: b.slug,
      views: b.view_count,
      calls: b.call_count,
    }));

  const catCounts = new Map<string, number>();
  for (const b of db.businesses) {
    catCounts.set(b.category_id, (catCounts.get(b.category_id) ?? 0) + 1);
  }
  const top_categories = db.categories
    .map((c) => ({
      id: c.id,
      name_en: c.name_en,
      name_ur: c.name_ur,
      count: catCounts.get(c.id) ?? 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const searchMap = new Map<string, number>();
  const zeroMap = new Map<string, number>();
  for (const sl of db.search_logs) {
    const q = sl.query.toLowerCase();
    searchMap.set(q, (searchMap.get(q) ?? 0) + 1);
    if (sl.results_count === 0) zeroMap.set(q, (zeroMap.get(q) ?? 0) + 1);
  }

  return {
    daily_traffic,
    top_businesses,
    top_categories,
    top_searches: Array.from(searchMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count),
    zero_result_searches: Array.from(zeroMap.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count),
    ad_performance: db.ads.map((a) => ({
      id: a.id,
      title: a.title,
      placement: a.placement,
      impressions: a.impressions,
      clicks: a.clicks,
      ctr: a.impressions > 0 ? Math.round((a.clicks / a.impressions) * 1000) / 10 : 0,
    })),
  };
}

export async function fetchAllSiteSettingsAdmin(): Promise<SiteSettingRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('site_settings').select('*').order('key');
    if (!error && data) return data as SiteSettingRow[];
  }
  return loadDemoDb().site_settings;
}

export async function updateSiteSetting(key: string, value: unknown, actorId: string): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    const { error } = await client
      .from('site_settings')
      .update({ value, updated_at: nowIso() })
      .eq('key', key);
    if (error) throw error;
    return;
  }
  const db = loadDemoDb();
  const row = db.site_settings.find((s) => s.key === key);
  if (row) row.value = value;
  appendAuditDemo(db, actorId, 'settings.update', 'site_settings', key, { value });
  saveDemoDb(db);
}

export async function fetchAllPagesAdmin(): Promise<PageRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.from('pages').select('*').order('slug');
    if (!error && data) return data as PageRow[];
  }
  return loadDemoDb().pages;
}

export async function upsertStaticPage(page: PageRow, actorId: string): Promise<PageRow> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('pages')
      .upsert({ ...page, updated_by: actorId, updated_at: nowIso() })
      .select()
      .single();
    if (error) throw error;
    return data as PageRow;
  }
  const db = loadDemoDb();
  const idx = db.pages.findIndex((p) => p.id === page.id || p.slug === page.slug);
  const next = { ...page, updated_by: actorId, updated_at: nowIso() };
  if (idx !== -1) db.pages[idx] = next;
  else db.pages.push(next);
  appendAuditDemo(db, actorId, 'page.update', 'pages', page.slug);
  saveDemoDb(db);
  return next;
}

export async function fetchAuditLogs(limit = 100): Promise<AuditLogRow[]> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (!error && data) return data as AuditLogRow[];
  }
  return loadDemoDb().audit_logs.slice(0, limit);
}

export function generateSitemapXml(baseUrl = supabaseConfig.siteUrl): string {
  const db = loadDemoDb();
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const urls: string[] = [
    '/',
    '/search',
    '/categories',
    '/offers',
    '/map',
    '/emergency',
    '/announcements',
    '/add-business',
  ];
  for (const cat of db.categories.filter((c) => c.is_active)) {
    urls.push(`/category/${cat.slug}`);
  }
  for (const area of db.areas.filter((a) => a.is_active)) {
    urls.push(`/area/${area.slug}`);
  }
  for (const biz of db.businesses.filter((b) => b.status === 'published')) {
    urls.push(`/business/${biz.slug}`);
  }
  for (const page of db.pages.filter((p) => p.is_published)) {
    urls.push(`/${page.slug}`);
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((u) => `  <url><loc>${cleanBase}${u}</loc></url>`),
    '</urlset>',
  ].join('\n');
}
