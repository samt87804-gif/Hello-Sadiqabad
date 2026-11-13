import type {
  AreaRow,
  BusinessRow,
  CategoryRow,
  OfferRow,
  PlanFeatures,
  PlanLimits,
  PlanRow,
  ReviewRow,
} from './database';

export type { DayKey, OpeningHoursJson, TimeRange } from './database';

export type SortOption = 'relevance' | 'rating' | 'nearest' | 'newest';

export interface SearchFiltersState {
  q: string;
  category: string;
  area: string;
  open: boolean;
  verified: boolean;
  offer: boolean;
  rating: number | null;
  delivery: boolean;
  sort: SortOption;
}

export interface BusinessPublicView extends BusinessRow {
  category?: CategoryRow | null;
  area?: AreaRow | null;
  plan?: PlanRow | null;
  effective_features?: PlanFeatures;
  effective_limits?: PlanLimits;
  active_offers?: OfferRow[];
  approved_reviews?: ReviewRow[];
  distance_km?: number | null;
  total_count?: number;
}

export interface CategoryWithChildren extends CategoryRow {
  children: CategoryRow[];
  listing_count?: number;
}

export interface SearchSuggestionItem {
  kind: 'business' | 'category' | 'area';
  label_en: string;
  label_ur: string;
  slug: string;
  subtitle?: string;
}

export interface OwnerDashboardStats {
  totals: {
    views: number;
    calls: number;
    whatsapp: number;
    directions: number;
    shares: number;
  };
  series: Array<{
    stat_date: string;
    views: number;
    calls: number;
    whatsapp: number;
    directions: number;
    shares: number;
  }>;
  top_search_terms: Array<{ query: string; count: number }>;
}

export interface AdminDashboardCounts {
  pending_businesses: number;
  pending_reviews: number;
  new_submissions: number;
  open_leads: number;
  expiring_plans: number;
  published_businesses: number;
}

export interface AdminAnalyticsData {
  daily_traffic: Array<{
    date: string;
    views: number;
    calls: number;
    whatsapp: number;
  }>;
  top_businesses: Array<{
    id: string;
    name_en: string;
    slug: string;
    views: number;
    calls: number;
  }>;
  top_categories: Array<{
    id: string;
    name_en: string;
    name_ur: string;
    count: number;
  }>;
  top_searches: Array<{ query: string; count: number }>;
  zero_result_searches: Array<{ query: string; count: number }>;
  ad_performance: Array<{
    id: string;
    title: string;
    placement: string;
    impressions: number;
    clicks: number;
    ctr: number;
  }>;
}
