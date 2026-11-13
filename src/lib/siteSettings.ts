import { SEED_SITE_SETTINGS } from './seedData';
import type { SiteSettingRow } from '../types/database';

export interface SiteSettingsMap {
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
