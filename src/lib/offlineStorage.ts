import type { EmergencyContactRow } from '../types/database';

const FAVORITES_KEY = 'hs_favorites';
const RECENT_KEY = 'hs_recent';
const EMERGENCY_CACHE_KEY = 'hs_emergency_cache';
const SESSION_KEY = 'hs_anon_session_id';

export function getFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteId(businessId: string): string[] {
  const current = getFavorites();
  const next = current.includes(businessId)
    ? current.filter((id) => id !== businessId)
    : [businessId, ...current];
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors
  }
  return next;
}

export function clearAllFavorites(): void {
  try {
    localStorage.removeItem(FAVORITES_KEY);
  } catch {
    // ignore
  }
}

export interface RecentViewedItem {
  id: string;
  slug: string;
  name_en: string;
  name_ur: string | null;
  area_name: string;
  category_name: string;
  icon: string;
  logo_url: string | null;
  viewed_at: string;
}

export function getRecentlyViewed(): RecentViewedItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(item: Omit<RecentViewedItem, 'viewed_at'>): RecentViewedItem[] {
  const current = getRecentlyViewed().filter((x) => x.id !== item.id);
  const next: RecentViewedItem[] = [
    { ...item, viewed_at: new Date().toISOString() },
    ...current,
  ].slice(0, 10);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}

export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {
    // ignore
  }
}

export function cacheEmergencyContacts(contacts: EmergencyContactRow[]): void {
  try {
    localStorage.setItem(
      EMERGENCY_CACHE_KEY,
      JSON.stringify({ updated_at: new Date().toISOString(), items: contacts })
    );
  } catch {
    // ignore
  }
}

export function getCachedEmergencyContacts(): {
  items: EmergencyContactRow[];
  updated_at: string | null;
} {
  try {
    const raw = localStorage.getItem(EMERGENCY_CACHE_KEY);
    if (!raw) return { items: [], updated_at: null };
    const parsed = JSON.parse(raw) as { items?: EmergencyContactRow[]; updated_at?: string };
    return {
      items: Array.isArray(parsed.items) ? parsed.items : [],
      updated_at: parsed.updated_at ?? null,
    };
  } catch {
    return { items: [], updated_at: null };
  }
}

export function getOrCreateSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `sess_${Math.random().toString(36).slice(2)}_${Date.now()}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `sess_${Date.now()}`;
  }
}
