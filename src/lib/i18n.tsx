import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppLang = 'en' | 'ur';

export interface BilingualEntry {
  en: string;
  ur: string;
}

const DICTIONARY: Record<string, BilingualEntry> = {
  'brand.hello': { en: 'Hello', ur: 'ہیلو' },
  'brand.sadiqabad': { en: 'Sadiqabad', ur: 'صادق آباد' },
  'brand.subtitle': { en: 'Rahim Yar Khan, Punjab', ur: 'رحیم یار خان، پنجاب' },
  'brand.civicStrip': {
    en: 'Sadiqabad Local Directory',
    ur: 'صادق آباد کا اپنا لوکل ڈائریکٹری پورٹل',
  },
  'nav.home': { en: 'Home', ur: 'ہوم' },
  'nav.search': { en: 'Search', ur: 'تلاش' },
  'nav.categories': { en: 'Categories', ur: 'کیٹیگریز' },
  'nav.emergency': { en: 'Urgent', ur: 'ایمرجنسی' },
  'nav.favorites': { en: 'Saved', ur: 'پسندیدہ' },
  'nav.offers': { en: 'Offers', ur: 'رعایت' },
  'nav.map': { en: 'Map', ur: 'نقشہ' },
  'nav.announcements': { en: 'Notices', ur: 'اعلانات' },
  'nav.addBusiness': { en: 'Add Business', ur: 'کاروبار شامل کریں' },
  'nav.login': { en: 'Portal Login', ur: 'پورٹل لاگ ان' },
  'nav.about': { en: 'About', ur: 'تعارف' },
  'nav.faq': { en: 'FAQ', ur: 'سوالات' },
  'nav.contact': { en: 'Contact', ur: 'رابطہ' },
  'nav.privacy': { en: 'Privacy', ur: 'رازداری' },
  'nav.terms': { en: 'Terms', ur: 'شرائط' },
  'hero.badge': { en: 'Sadiqabad, Punjab', ur: 'سمارٹ سٹی گائیڈ' },
  'hero.titlePrefix': { en: 'Find Any Business or Service in', ur: 'صادق آباد میں تلاش کریں' },
  'hero.titleHighlight': { en: 'Sadiqabad', ur: 'ہر کاروبار اور سروس' },
  'hero.subtitle': {
    en: 'All shops, doctors, hospitals, and local services in Sadiqabad in one trusted place.',
    ur: 'صادق آباد کی تمام دکانیں، ڈاکٹرز، ہسپتال اور سروسز ایک جگہ',
  },
  'hero.searchPlaceholder': {
    en: 'Search shops, doctors, emergency...',
    ur: 'دکان، ڈاکٹر یا سروس تلاش کریں...',
  },
  'action.search': { en: 'Search', ur: 'تلاش' },
  'action.call': { en: 'Call', ur: 'کال کریں' },
  'action.callNow': { en: 'Call Now', ur: 'کال کریں' },
  'action.whatsapp': { en: 'WhatsApp', ur: 'واٹس ایپ' },
  'action.directions': { en: 'Directions', ur: 'راستہ' },
  'action.share': { en: 'Share', ur: 'شیئر کریں' },
  'action.save': { en: 'Save', ur: 'محفوظ' },
  'action.saved': { en: 'Saved', ur: 'محفوظ شدہ' },
  'action.qrCode': { en: 'QR Code', ur: 'کیو آر کوڈ' },
  'action.viewAll': { en: 'View all', ur: 'سب دیکھیں' },
  'action.viewDetails': { en: 'View Details', ur: 'تفصیل دیکھیں' },
  'action.loadMore': { en: 'Load More Results', ur: 'مزید نتائج دیکھیں' },
  'action.registerBusiness': { en: 'Register Business Now', ur: 'کاروبار درج کروائیں' },
  'action.sendInquiry': { en: 'Send Inquiry', ur: 'پیغام بھیجیں' },
  'action.writeReview': { en: 'Write a Review', ur: 'اپنی رائے درج کریں' },
  'action.suggestEdit': { en: 'Suggest Edit / Report', ur: 'تصحیح / رپورٹ' },
  'action.claimBusiness': { en: 'Claim this Business', ur: 'ملکیت کا دعویٰ' },
  'section.emergencyTitle': { en: '24/7 City Emergency Contacts', ur: 'ہنگامی صورتحال میں فوری رابطہ' },
  'section.quickLookups': { en: 'Quick Lookups', ur: 'فوری تلاش' },
  'section.categories': { en: 'Explore Categories', ur: 'شعبہ جات دیکھیں' },
  'section.featured': { en: 'Featured & Top Rated', ur: 'نمایاں اور بہترین کاروبار' },
  'section.offers': { en: 'Local Offers & Deals', ur: 'صادق آباد میں خصوصی رعایت' },
  'section.newInTown': { en: 'New in Town', ur: 'تازہ ترین اندراج' },
  'section.recentlyViewed': { en: 'Recently Viewed', ur: 'حال ہی میں دیکھے گئے' },
  'section.cityMap': { en: 'City Key Locations', ur: 'شہر کے اہم مقامات' },
  'section.addBusinessTitle': {
    en: 'Add Your Business to Sadiqabad Directory',
    ur: 'اپنا کاروبار یا کلینک مفت میں رجسٹر کروائیں',
  },
  'profile.aboutBusiness': { en: 'About Business', ur: 'کاروبار کا تعارف' },
  'profile.operatingHours': { en: 'Operating Hours', ur: 'اوقاتِ کار' },
  'profile.services': { en: 'Services & Facilities', ur: 'سہولیات و خدمات' },
  'profile.locationAddress': { en: 'Location & Address', ur: 'مقام اور پتہ' },
  'profile.directLines': { en: 'Direct Contact Lines', ur: 'براہ راست رابطہ نمبرز' },
  'profile.reviews': { en: 'Customer Reviews', ur: 'صارفین کی آراء' },
  'filter.all': { en: 'All', ur: 'سب' },
  'filter.openNow': { en: 'Open Now', ur: 'ابھی کھلا' },
  'filter.verified': { en: 'Verified', ur: 'تصدیق شدہ' },
  'filter.offers': { en: 'Offers', ur: 'رعایت' },
  'filter.delivery': { en: 'Delivery', ur: 'ہوم ڈیلیوری' },
  'filter.filters': { en: 'Filters', ur: 'فلٹرز' },
  'plan.free': { en: 'Free Plan', ur: 'مفت پلان' },
  'plan.basic': { en: 'Basic Plan', ur: 'بیسک پلان' },
  'plan.premium': { en: 'Premium Plan', ur: 'پریمیم پلان' },
  'offline.banner': {
    en: 'You are offline. Emergency numbers remain available.',
    ur: 'آپ آف لائن ہیں۔ ایمرجنسی نمبرز دستیاب ہیں۔',
  },
  'common.urduHints': { en: 'Show Urdu hints', ur: 'اردو اشارے دکھائیں' },
  'common.cancel': { en: 'Cancel', ur: 'منسوخ کریں' },
  'common.confirm': { en: 'Confirm', ur: 'تصدیق کریں' },
  'common.submit': { en: 'Submit', ur: 'جمع کروائیں' },
  'common.close': { en: 'Close', ur: 'بند کریں' },
  'common.retry': { en: 'Try Again', ur: 'دوبارہ کوشش کریں' },
};

interface I18nContextValue {
  lang: AppLang;
  isUrdu: boolean;
  urduHints: boolean;
  setLang: (lang: AppLang) => void;
  setUrduHints: (val: boolean) => void;
  t: (key: string, fallback?: string) => string;
  entry: (key: string, fallbackEn?: string, fallbackUr?: string) => BilingualEntry;
}

const LANG_KEY = 'hs_lang';
const HINTS_KEY = 'hs_urdu_hints';

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  isUrdu: false,
  urduHints: true,
  setLang: () => undefined,
  setUrduHints: () => undefined,
  t: (k, f) => f ?? k,
  entry: (k, fEn, fUr) => ({ en: fEn ?? k, ur: fUr ?? '' }),
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<AppLang>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY);
      if (saved === 'en' || saved === 'ur') return saved;
    } catch {
      // ignore
    }
    return 'en';
  });

  const [urduHints, setUrduHintsState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(HINTS_KEY);
      if (saved === 'false') return false;
    } catch {
      // ignore
    }
    return true;
  });

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ur' ? 'rtl' : 'ltr';
  }, [lang]);

  const setLang = (next: AppLang) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // ignore
    }
  };

  const setUrduHints = (val: boolean) => {
    setUrduHintsState(val);
    try {
      localStorage.setItem(HINTS_KEY, String(val));
    } catch {
      // ignore
    }
  };

  const entry = (key: string, fallbackEn?: string, fallbackUr?: string): BilingualEntry => {
    const found = DICTIONARY[key];
    if (found) return found;
    return { en: fallbackEn ?? key, ur: fallbackUr ?? '' };
  };

  const t = (key: string, fallback?: string): string => {
    const found = DICTIONARY[key];
    if (!found) return fallback ?? key;
    return lang === 'ur' ? found.ur || found.en : found.en;
  };

  return (
    <I18nContext.Provider
      value={{
        lang,
        isUrdu: lang === 'ur',
        urduHints,
        setLang,
        setUrduHints,
        t,
        entry,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
