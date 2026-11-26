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

export type PlanPaymentMethodKey = 'jazzcash' | 'easypaisa' | 'ubl';
export interface PlanPaymentMethod { label: string; account_title: string; account_number: string; iban?: string; icon_url: string | null; }
export interface PlanPaymentSettings { instructions_en: string; instructions_ur: string; methods: Record<PlanPaymentMethodKey, PlanPaymentMethod>; }
export const DEFAULT_PLAN_PAYMENT_SETTINGS: PlanPaymentSettings = {
  instructions_en: 'Select your plan, transfer the exact monthly amount to one of the accounts below, then enter the transaction/reference number and confirm that payment has been made. Your plan changes only after Admin verifies the payment.',
  instructions_ur: 'اپنا پلان منتخب کریں، نیچے دیے گئے اکاؤنٹ میں مکمل ماہانہ رقم جمع کروائیں، پھر ٹرانزیکشن/حوالہ نمبر درج کریں اور ادائیگی کی تصدیق کریں۔ ایڈمن کی تصدیق کے بعد ہی پلان تبدیل ہوگا۔',
  methods: {
    jazzcash: { label: 'JazzCash', account_title: 'Adeel Khalid', account_number: '03283212342', icon_url: null },
    easypaisa: { label: 'Easypaisa', account_title: 'Adeel Khalid', account_number: '03283212342', icon_url: null },
    ubl: { label: 'UBL Bank Transfer', account_title: 'Adil Khalid', account_number: '2318422716936', iban: 'PK57UNIL0109000422716936', icon_url: null },
  },
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
  plan_payment_methods: PlanPaymentSettings;
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
    plan_payment_methods: (() => {
      const value = map.get('plan_payment_methods');
      if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_PLAN_PAYMENT_SETTINGS;
      const record = value as Partial<PlanPaymentSettings>;
      const methods = (record.methods && typeof record.methods === 'object' ? record.methods : {}) as Partial<Record<PlanPaymentMethodKey, PlanPaymentMethod>>;
      return {
        instructions_en: typeof record.instructions_en === 'string' ? record.instructions_en : DEFAULT_PLAN_PAYMENT_SETTINGS.instructions_en,
        instructions_ur: typeof record.instructions_ur === 'string' ? record.instructions_ur : DEFAULT_PLAN_PAYMENT_SETTINGS.instructions_ur,
        methods: {
          jazzcash: { ...DEFAULT_PLAN_PAYMENT_SETTINGS.methods.jazzcash, ...(methods.jazzcash ?? {}) },
          easypaisa: { ...DEFAULT_PLAN_PAYMENT_SETTINGS.methods.easypaisa, ...(methods.easypaisa ?? {}) },
          ubl: { ...DEFAULT_PLAN_PAYMENT_SETTINGS.methods.ubl, ...(methods.ubl ?? {}) },
        },
      };
    })(),
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsMap = parseSiteSettings(SEED_SITE_SETTINGS);
