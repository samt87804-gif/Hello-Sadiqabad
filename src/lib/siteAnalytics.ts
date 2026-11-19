import { getSupabaseClient } from './supabase';

export type SiteAnalyticsEventName =
  | 'page_view'
  | 'engagement'
  | 'cta_click'
  | 'content_share'
  | 'search_summary';

export type SiteAnalyticsEntityType =
  | 'business'
  | 'news'
  | 'authority_profile'
  | 'category'
  | 'area';

export interface SiteAnalyticsEventOptions {
  pagePath?: string;
  entityType?: SiteAnalyticsEntityType;
  entityId?: string;
  filters?: Record<string, unknown>;
  activeSeconds?: number;
  resultsCount?: number;
}

const VISITOR_KEY = 'hs_site_analytics_visitor_v1';
const SESSION_KEY = 'hs_site_analytics_session_v1';
const OPT_OUT_KEY = 'hs_site_analytics_opt_out';
const VISITOR_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_IDLE_MS = 30 * 60 * 1000;

type StoredVisitor = { id: string; expiresAt: number };
type StoredSession = { id: string; lastSeenAt: number };

const ANALYTICS_ENABLED =
  typeof import.meta !== 'undefined' &&
  import.meta.env?.VITE_SITE_ANALYTICS_ENABLED === 'true';

export function classifySiteAnalyticsPath(pathname: string): string | null {
  const staticRoutes: Record<string, string> = {
    '/': 'home',
    '/search': 'search',
    '/categories': 'categories',
    '/offers': 'offers',
    '/map': 'map',
    '/emergency': 'emergency',
    '/government-helplines': 'government_helplines',
    '/local-authorities': 'local_authorities',
    '/authority-profiles': 'authority_profiles',
    '/announcements': 'announcements',
    '/news': 'news',
    '/about': 'static',
    '/advertise': 'static',
    '/contact': 'static',
    '/terms': 'static',
    '/privacy': 'static',
    '/listing-terms': 'static',
    '/refund-policy': 'static',
    '/faq': 'static',
  };
  if (staticRoutes[pathname]) return staticRoutes[pathname];

  const dynamic: Array<[RegExp, string]> = [
    [/^\/category\/[a-z0-9]+(?:-[a-z0-9]+)*$/, 'category'],
    [/^\/area\/[a-z0-9]+(?:-[a-z0-9]+)*$/, 'area'],
    [/^\/business\/[a-z0-9]+(?:-[a-z0-9]+)*$/, 'business'],
    [/^\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/, 'news'],
    [/^\/authority-profiles\/[a-z0-9]+(?:-[a-z0-9]+)*$/, 'authority_profiles'],
  ];
  return dynamic.find(([pattern]) => pattern.test(pathname))?.[1] ?? null;
}

export function hasBrowserAnalyticsPrivacySignal(): boolean {
  if (typeof navigator === 'undefined') return false;
  const extendedNavigator = navigator as Navigator & { globalPrivacyControl?: boolean };
  return navigator.doNotTrack === '1' || extendedNavigator.globalPrivacyControl === true;
}

export function getSiteAnalyticsOptOut(): boolean {
  if (hasBrowserAnalyticsPrivacySignal()) return true;
  try {
    return window.localStorage.getItem(OPT_OUT_KEY) === '1';
  } catch {
    return true;
  }
}

export function setSiteAnalyticsOptOut(optOut: boolean): void {
  try {
    if (optOut) {
      window.localStorage.setItem(OPT_OUT_KEY, '1');
      window.localStorage.removeItem(VISITOR_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } else {
      window.localStorage.removeItem(OPT_OUT_KEY);
    }
  } catch {
    // Storage unavailable means analytics remains unavailable.
  }
}

export function canTrackSiteAnalytics(): boolean {
  return ANALYTICS_ENABLED &&
    typeof window !== 'undefined' &&
    typeof navigator !== 'undefined' &&
    navigator.onLine &&
    !getSiteAnalyticsOptOut();
}

function randomId(): string | null {
  try {
    return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : null;
  } catch {
    return null;
  }
}

function getOrCreateIds(): { visitorId: string; sessionId: string } | null {
  const now = Date.now();
  try {
    let visitor: StoredVisitor | null = null;
    const rawVisitor = window.localStorage.getItem(VISITOR_KEY);
    if (rawVisitor) {
      const parsed = JSON.parse(rawVisitor) as Partial<StoredVisitor>;
      if (typeof parsed.id === 'string' && typeof parsed.expiresAt === 'number' && parsed.expiresAt > now) {
        visitor = { id: parsed.id, expiresAt: parsed.expiresAt };
      }
    }
    if (!visitor) {
      const id = randomId();
      if (!id) return null;
      visitor = { id, expiresAt: now + VISITOR_TTL_MS };
      window.localStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
    }

    let session: StoredSession | null = null;
    const rawSession = window.sessionStorage.getItem(SESSION_KEY);
    if (rawSession) {
      const parsed = JSON.parse(rawSession) as Partial<StoredSession>;
      if (typeof parsed.id === 'string' && typeof parsed.lastSeenAt === 'number' &&
          now - parsed.lastSeenAt <= SESSION_IDLE_MS && now >= parsed.lastSeenAt) {
        session = { id: parsed.id, lastSeenAt: now };
      }
    }
    if (!session) {
      const id = randomId();
      if (!id) return null;
      session = { id, lastSeenAt: now };
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return { visitorId: visitor.id, sessionId: session.id };
  } catch {
    return null;
  }
}

function currentUtm() {
  const params = new URLSearchParams(window.location.search);
  const read = (key: string) => {
    const value = params.get(key)?.trim();
    return value ? value.slice(0, 100) : undefined;
  };
  return {
    source: read('utm_source'),
    medium: read('utm_medium'),
    campaign: read('utm_campaign'),
    content: read('utm_content'),
  };
}

export function trackSiteAnalyticsEvent(
  eventName: SiteAnalyticsEventName,
  options: SiteAnalyticsEventOptions = {},
): void {
  if (!canTrackSiteAnalytics()) return;
  const pagePath = options.pagePath ?? window.location.pathname;
  if (!classifySiteAnalyticsPath(pagePath)) return;

  const ids = getOrCreateIds();
  const client = getSupabaseClient();
  if (!ids || !client) return;

  const body: Record<string, unknown> = {
    event_id: randomId(),
    event_name: eventName,
    visitor_id: ids.visitorId,
    session_id: ids.sessionId,
    page_path: pagePath,
  };
  if (!body.event_id) return;

  if (options.entityType) body.entity_type = options.entityType;
  if (options.entityId) body.entity_id = options.entityId;
  if (options.filters) body.filters = options.filters;
  if (options.activeSeconds !== undefined) body.active_seconds = options.activeSeconds;
  if (options.resultsCount !== undefined) body.results_count = options.resultsCount;

  if (eventName === 'page_view') {
    if (document.referrer) body.referrer = document.referrer.slice(0, 2048);
    const utm = currentUtm();
    if (utm.source || utm.medium || utm.campaign || utm.content) body.utm = utm;
  }

  void client.functions.invoke('track-site-analytics', { body }).catch(() => {
    // Analytics is non-critical and is never queued or allowed to block navigation.
  });
}
