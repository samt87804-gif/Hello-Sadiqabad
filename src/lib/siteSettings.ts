import { SEED_SITE_SETTINGS } from './seedData';
import type { SiteSettingRow } from '../types/database';

export const DEFAULT_HERO_BANNER_URL = 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/Sadiqabad%20Phone%20Directory%20Landmark%20Banner.png';

export interface DirectoryImageUrls {
  categories: Record<string, string>;
  areas: Record<string, string>;
  helplines: Record<string, string>;
  businesses: Record<string, string>;
  offers: Record<string, string>;
  ads: Record<string, string>;
}

export const EMPTY_DIRECTORY_IMAGE_URLS: DirectoryImageUrls = {
  categories: {}, areas: {}, helplines: {}, businesses: {}, offers: {}, ads: {},
};

export interface SiteSettingsMap {
  hero_banner_url: string;
  directory_image_urls: DirectoryImageUrls;
  site_name: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_email: string;
  social_links: { facebook?: string; instagram?: string };
  default_language: 'en' | 'ur';
  owner_edits_require_approval: boolean;
  reviews_require_approval: boolean;
  ads_enabled: boolean;
  maintenance_mode: boolean;
}

export function parseSiteSettings(rows: SiteSettingRow[] = SEED_SITE_SETTINGS): SiteSettingsMap {
  const map = new Map(rows.map((r) => [r.key, r.value]));
  return {
    hero_banner_url: String(map.get('hero_banner_url') ?? DEFAULT_HERO_BANNER_URL),
    directory_image_urls: (() => {
      const value = map.get('directory_image_urls');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return EMPTY_DIRECTORY_IMAGE_URLS;
      const record = value as Partial<DirectoryImageUrls>;
      return {
        categories: record.categories && typeof record.categories === 'object' ? record.categories : {},
        areas: record.areas && typeof record.areas === 'object' ? record.areas : {},
        helplines: record.helplines && typeof record.helplines === 'object' ? record.helplines : {},
        businesses: record.businesses && typeof record.businesses === 'object' ? record.businesses : {},
        offers: record.offers && typeof record.offers === 'object' ? record.offers : {},
        ads: record.ads && typeof record.ads === 'object' ? record.ads : {},
      };
    })(),
    site_name: String(map.get('site_name') ?? 'Hello Sadiqabad'),
    contact_phone: String(map.get('contact_phone') ?? '0300-8671234'),
    contact_whatsapp: String(map.get('contact_whatsapp') ?? '0300-8671234'),
    contact_email: String(map.get('contact_email') ?? 'salam@hellosadiqabad.com'),
    social_links: (map.get('social_links') as { facebook?: string; instagram?: string }) ?? {},
    default_language: map.get('default_language') === 'ur' ? 'ur' : 'en',
    owner_edits_require_approval: Boolean(map.get('owner_edits_require_approval') ?? false),
    reviews_require_approval: Boolean(map.get('reviews_require_approval') ?? true),
    ads_enabled: Boolean(map.get('ads_enabled') ?? true),
    maintenance_mode: Boolean(map.get('maintenance_mode') ?? false),
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsMap = parseSiteSettings(SEED_SITE_SETTINGS);
