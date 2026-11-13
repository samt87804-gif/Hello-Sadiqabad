import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { useI18n } from '../../lib/i18n';

const DISMISS_KEY = 'hs_demo_banner_dismissed';

export function DemoModeNotice({
  variant = 'banner',
  contextLabelEn,
  contextLabelUr,
  className = '',
}: {
  variant?: 'banner' | 'sample-data';
  contextLabelEn?: string;
  contextLabelUr?: string;
  className?: string;
}) {
  const { isDemoMode } = useAuth();
  const { lang } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (!isDemoMode) return null;

  if (variant === 'sample-data') {
    return (
      <div
        className={`rounded-xl bg-surface-container-low border border-outline-variant/40 px-3.5 py-2.5 text-xs text-on-surface-variant flex items-start gap-2 ${className}`}
      >
        <Info className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {lang === 'ur'
            ? contextLabelUr ??
              'پیش نظارہ / ڈیمو ڈیٹا: یہاں دکھائے گئے اعدادوشمار، تبصرے اور سرگرمی مقامی نمونہ ریکارڈز پر مبنی ہیں۔'
            : contextLabelEn ??
              'Preview / Sample Data: Metrics, reviews, and activity shown here use local demo records stored in this browser.'}
        </p>
      </div>
    );
  }

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore storage restrictions
    }
  };

  return (
    <div
      role="region"
      aria-label={lang === 'ur' ? 'ڈیمو موڈ کی معلومات' : 'Preview and demo mode notice'}
      className={`bg-surface-container-low border-b border-outline-variant/40 text-on-surface text-xs ${className}`}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary-fixed text-on-secondary-fixed text-[11px] font-bold shrink-0">
            <Sparkles className="w-3 h-3" />
            {lang === 'ur' ? 'پیش نظارہ موڈ' : 'Preview / Demo'}
          </span>
          <span className="text-on-surface-variant font-medium truncate">
            {lang === 'ur'
              ? 'اس براؤزر میں مقامی نمونہ ڈیٹا استعمال ہو رہا ہے۔'
              : 'Interactive local demo data — changes stay in this browser.'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="px-2.5 py-1 rounded-lg border border-outline-variant/60 bg-surface text-on-surface font-semibold text-[11px] inline-flex items-center gap-1 hover:border-primary cursor-pointer"
          >
            <span>{lang === 'ur' ? 'تفصیلات' : 'Details'}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={lang === 'ur' ? 'اطلاع بند کریں' : 'Dismiss preview notice'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-3">
          <div className="p-3 rounded-xl bg-surface border border-outline-variant/40 text-xs text-on-surface-variant grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <p className="font-bold text-on-surface mb-0.5">
                {lang === 'ur' ? 'مقامی براؤزر اسٹوریج' : 'Local Browser Storage'}
              </p>
              <p className="leading-relaxed">
                {lang === 'ur'
                  ? 'نئی دکانیں، آفرز، تبصرے اور ترمیمات صرف آپ کے براؤزر میں محفوظ ہوتی ہیں۔'
                  : 'Listings, offers, reviews, inquiries, and imports persist only in this browser’s localStorage.'}
              </p>
            </div>
            <div>
              <p className="font-bold text-on-surface mb-0.5">
                {lang === 'ur' ? 'نمونہ کاروبار و شماریات' : 'Sample Records & Stats'}
              </p>
              <p className="leading-relaxed">
                {lang === 'ur'
                  ? 'ڈیش بورڈ کے ویوز، لیڈز اور ابتدائی ریٹنگز نمونہ ڈائریکٹری ڈیٹا ہیں۔'
                  : 'Dashboard traffic, sample reviews, and merchant leads represent illustrative preview fixtures.'}
              </p>
            </div>
            <div>
              <p className="font-bold text-on-surface mb-0.5">
                {lang === 'ur' ? 'بیرونی سروسز غیر فعال' : 'No Live Emails / Payments'}
              </p>
              <p className="leading-relaxed">
                {lang === 'ur'
                  ? 'پری ویو موڈ میں پاس ورڈ ری سیٹ ای میلز، ایس ایم ایس یا آن لائن ادائیگی نہیں بھیجی جاتی۔'
                  : 'Password reset emails, SMS/OTP calls, and online billing are simulated in Preview Mode.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
