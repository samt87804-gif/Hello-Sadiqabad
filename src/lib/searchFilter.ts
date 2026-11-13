import type { AreaRow, CategoryRow, PlanRow } from '../types/database';
import type { BusinessPublicView, SearchFiltersState } from '../types/directory';
import { getOpenStatus } from './openNow';
import { haversineDistanceKm } from './format';

export const SADIQABAD_CENTER_COORDS = {
  lat: 28.3062,
  lng: 70.1308,
} as const;

export function isValidCoords(coords: unknown): coords is { lat: number; lng: number } {
  if (!coords || typeof coords !== 'object') return false;
  const c = coords as { lat?: unknown; lng?: unknown };
  return (
    typeof c.lat === 'number' &&
    typeof c.lng === 'number' &&
    !Number.isNaN(c.lat) &&
    !Number.isNaN(c.lng) &&
    c.lat >= -90 &&
    c.lat <= 90 &&
    c.lng >= -180 &&
    c.lng <= 180
  );
}

const PLAN_PRIORITY: Record<string, number> = {
  premium: 3,
  basic: 2,
  free: 1,
};

export function effectivePlanCode(
  planCode: 'free' | 'basic' | 'premium',
  planExpiresAt: string | null | undefined,
  now: Date = new Date()
): 'free' | 'basic' | 'premium' {
  if (planCode === 'free') return 'free';
  if (!planExpiresAt) return planCode;
  const exp = new Date(planExpiresAt);
  if (Number.isNaN(exp.getTime())) return planCode;
  return exp.getTime() > now.getTime() ? planCode : 'free';
}

export function filterAndRankBusinesses(
  businesses: BusinessPublicView[],
  categories: CategoryRow[],
  areas: AreaRow[],
  plans: PlanRow[],
  filters: Partial<SearchFiltersState>,
  userCoords?: { lat: number; lng: number } | null,
  now: Date = new Date()
): BusinessPublicView[] {
  const query = (filters.q ?? '').trim().toLowerCase();
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const areaMap = new Map(areas.map((a) => [a.id, a]));
  const planMap = new Map(plans.map((p) => [p.code, p]));

  const matchingCategoryIds = new Set<string>();
  if (filters.category) {
    const selectedCat = categories.find(
      (c) => c.slug === filters.category || c.id === filters.category
    );
    if (selectedCat) {
      matchingCategoryIds.add(selectedCat.id);
      for (const child of categories) {
        if (child.parent_id === selectedCat.id) {
          matchingCategoryIds.add(child.id);
        }
      }
    }
  }

  const scored = businesses
    .filter((b) => b.status === 'published')
    .map((b) => {
      const cat = b.category ?? catMap.get(b.category_id) ?? null;
      const area = b.area ?? (b.area_id ? areaMap.get(b.area_id) ?? null : null);
      const effPlan = effectivePlanCode(b.plan_code, b.plan_expires_at, now);
      const plan = b.plan ?? planMap.get(effPlan) ?? null;
      const openInfo = getOpenStatus(b.opening_hours, b.is_open_24h, now);
      const distance_km =
        userCoords && typeof b.lat === 'number' && typeof b.lng === 'number'
          ? haversineDistanceKm(userCoords.lat, userCoords.lng, b.lat, b.lng)
          : null;

      return {
        ...b,
        category: cat,
        area,
        plan,
        effective_features: plan?.features ?? b.effective_features,
        effective_limits: plan?.limits ?? b.effective_limits,
        distance_km,
        _openState: openInfo.state,
        _effPriority: PLAN_PRIORITY[effPlan] ?? 1,
      };
    })
    .filter((b) => {
      if (filters.category && matchingCategoryIds.size > 0) {
        if (!matchingCategoryIds.has(b.category_id)) return false;
      } else if (filters.category) {
        return false;
      }

      if (filters.area) {
        const matchesArea =
          b.area?.slug === filters.area || b.area_id === filters.area;
        if (!matchesArea) return false;
      }

      if (filters.open) {
        if (b._openState !== 'open' && b._openState !== 'open_24h') return false;
      }

      if (filters.verified && !b.is_verified) return false;

      if (filters.offer && !(b.active_offers && b.active_offers.length > 0)) {
        return false;
      }

      if (typeof filters.rating === 'number' && filters.rating > 0) {
        if ((b.rating_avg ?? 0) < filters.rating) return false;
      }

      if (filters.delivery && !b.home_delivery) return false;

      if (query) {
        const haystack = [
          b.name_en,
          b.name_ur ?? '',
          b.description_en ?? '',
          b.description_ur ?? '',
          b.address_en ?? '',
          b.address_ur ?? '',
          b.phone_primary,
          b.category?.name_en ?? '',
          b.category?.name_ur ?? '',
          ...(b.category?.synonyms ?? []),
          b.area?.name_en ?? '',
          b.area?.name_ur ?? '',
          ...(b.tags ?? []),
          ...(b.services_en ?? []),
        ]
          .join(' ')
          .toLowerCase();

        const tokens = query.split(/\s+/).filter(Boolean);
        const matchesAllTokens = tokens.every((tok) => haystack.includes(tok));
        if (!matchesAllTokens) return false;
      }

      return true;
    })
    .map((b) => {
      let textScore = 0;
      if (query) {
        const nameLower = b.name_en.toLowerCase();
        if (nameLower === query) textScore += 100;
        else if (nameLower.startsWith(query)) textScore += 60;
        else if (nameLower.includes(query)) textScore += 35;
        else if ((b.category?.synonyms ?? []).some((s) => s.toLowerCase().includes(query))) {
          textScore += 25;
        } else {
          textScore += 10;
        }
      }
      return { item: b, textScore };
    });

  const sortBy = filters.sort ?? 'relevance';
  scored.sort((a, b) => {
    if (sortBy === 'rating') {
      const diff = (b.item.rating_avg ?? 0) - (a.item.rating_avg ?? 0);
      if (diff !== 0) return diff;
    } else if (sortBy === 'newest') {
      return new Date(b.item.created_at).getTime() - new Date(a.item.created_at).getTime();
    } else if (sortBy === 'nearest') {
      const dA = a.item.distance_km ?? 9999;
      const dB = b.item.distance_km ?? 9999;
      if (dA !== dB) return dA - dB;
    }

    // Relevance: plan priority + featured + text score + rating
    const scoreA = a.textScore + a.item._effPriority * 20 + (a.item.is_featured ? 15 : 0);
    const scoreB = b.textScore + b.item._effPriority * 20 + (b.item.is_featured ? 15 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return (b.item.rating_avg ?? 0) - (a.item.rating_avg ?? 0);
  });

  return scored.map(({ item }) => {
    const { _openState: _, _effPriority: __, ...clean } = item;
    return clean;
  });
}
