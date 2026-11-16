import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, MessageCircle, PhoneCall, ShieldAlert } from 'lucide-react';
import { fetchEmergencyContacts, fetchPublicSiteSettings } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { buildTelUrl, buildWhatsAppUrl } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import type { EmergencyCategory, EmergencyContactRow } from '../types/database';
import { AdPlacementSlot } from '../components/directory/AdBanner';
import { AppShell } from '../components/layout/AppShell';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { Badge, Card, Container } from '../components/ui/Surface';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { EMPTY_DIRECTORY_IMAGE_URLS, type DirectoryImageUrls } from '../lib/siteSettings';

const CATEGORIES: Array<{ id: 'all' | EmergencyCategory; labelEn: string; labelUr: string }> = [
  { id: 'all', labelEn: 'All Helplines', labelUr: 'تمام ہیلپ لائنز' },
  { id: 'rescue', labelEn: 'Rescue', labelUr: 'ریسکیو' },
  { id: 'police', labelEn: 'Police', labelUr: 'پولیس' },
  { id: 'fire', labelEn: 'Fire', labelUr: 'فائر بریگیڈ' },
  { id: 'ambulance', labelEn: 'Ambulance', labelUr: 'ایمبولینس' },
  { id: 'utility', labelEn: 'Utilities (Gas / Electricity)', labelUr: 'گیس اور بجلی' },
  { id: 'general', labelEn: 'Public Helplines', labelUr: 'عوامی ہیلپ لائنز' },
  { id: 'government', labelEn: 'Government Helplines', labelUr: 'سرکاری ہیلپ لائنز' },
];

export function Emergency({ initialCategory = 'all' }: { initialCategory?: 'all' | EmergencyCategory }) {
  const { lang, urduHints } = useI18n();
  const [contacts, setContacts] = useState<EmergencyContactRow[]>([]);
  const [directoryImageUrls, setDirectoryImageUrls] = useState<DirectoryImageUrls>(EMPTY_DIRECTORY_IMAGE_URLS);
  const [filter, setFilter] = useState<'all' | EmergencyCategory>(initialCategory);
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  useEffect(() => {
    updatePageSeo({
      title: initialCategory === 'government' ? 'Government Helplines Sadiqabad — District Control Room, 1139, 1787' : '24/7 Emergency Contacts Sadiqabad — Rescue 1122, Police 15, Fire 16',
      description: initialCategory === 'government' ? 'Verified Government of Punjab and District Rahim Yar Khan public helplines for Sadiqabad.' : 'Offline-ready 24/7 emergency helpline directory for Sadiqabad, District Rahim Yar Khan.',
      canonicalPath: initialCategory === 'government' ? '/government-helplines' : '/emergency',
    });
    Promise.all([fetchEmergencyContacts(), fetchPublicSiteSettings()]).then(([res, settings]) => {
      setContacts(res.items);
      setDirectoryImageUrls(settings.directory_image_urls || EMPTY_DIRECTORY_IMAGE_URLS);
      setFromCache(res.fromCache);
      setCachedAt(res.cachedAt);
    });
  }, []);

  const priorityTop = initialCategory === 'government' ? [] : contacts.filter((c) => ['1122', '15', '16', '115'].includes(c.phone)).slice(0, 4);
  const visible = contacts.filter((c) => filter === 'all' || c.category === filter);

  return (
    <AppShell>
      <Container className="py-6 space-y-6">
        <div className={`rounded-3xl ${initialCategory === 'government' ? 'bg-primary dark:bg-primary' : 'bg-[#ba1a1a] dark:bg-[#93000a]'} text-white p-6 shadow-md space-y-3`}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7" />
              <h1 className="text-2xl font-extrabold">
                {lang === 'ur'
                  ? (initialCategory === 'government' ? 'صادق آباد سرکاری ہیلپ لائنز' : 'صادق آباد 24/7 ایمرجنسی ہیلپ لائنز')
                  : (initialCategory === 'government' ? 'Sadiqabad Government Helplines' : '24/7 Sadiqabad Emergency Helplines')}
              </h1>
            </div>
            <Badge variant="neutral">
              {lang === 'ur' ? 'آف لائن محفوظ شدہ' : 'Offline Cached Ready'}
            </Badge>
          </div>
          {lang === 'en' && urduHints && (
            <p className="font-urdu text-sm text-white/95 leading-[2.0]" dir="rtl">
              {initialCategory === 'government' ? 'صادق آباد اور پنجاب کے سرکاری رابطہ نمبرز — سرکاری ذرائع کے ساتھ' : 'صادق آباد کے ہنگامی رابطہ نمبرز — انٹرنیٹ کے بغیر بھی دستیاب'}
            </p>
          )}
          <div className="p-3 rounded-2xl bg-black/20 text-xs flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {lang === 'ur' ? (
                <>
                  <strong>{initialCategory === 'government' ? 'سرکاری رابطے:' : 'اہم ہدایت:'}</strong> {initialCategory === 'government' ? 'یہ نمبرز متعلقہ سرکاری ویب سائٹس اور ڈائریکٹریز سے لیے گئے ہیں۔ تازہ معلومات کے لیے متعلقہ ماخذ دیکھیں۔' : 'یہاں صرف تصدیق شدہ قومی و پنجاب ٹول فری ہنگامی کوڈز شامل ہیں۔ کال کرتے وقت اپنا درست علاقہ اور قریبی مشہور نشانی بتائیں۔'}
                </>
              ) : (
                <>
                  <strong>{initialCategory === 'government' ? 'Official government contacts:' : 'Verified Shortcodes:'}</strong> {initialCategory === 'government' ? 'Numbers are taken from linked government websites and directories. Check the linked source for current details.' : 'These are verified Pakistan national and Punjab toll-free helplines. Always share your exact neighborhood and nearest landmark when calling.'}
                </>
              )}
            </span>
          </div>
          {fromCache && cachedAt && (
            <p className="text-xs text-white/90 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />{' '}
              {lang === 'ur'
                ? `آف لائن موڈ فعال · آخری اپ ڈیٹ ${formatDateShort(cachedAt)}`
                : `Offline mode active · Last synced ${formatDateShort(cachedAt)}`}
            </p>
          )}
        </div>

        {/* Priority 1 Instant-Dial Grid */}
        {initialCategory === 'all' && priorityTop.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {priorityTop.map((p) => (
              <a
                key={p.id}
                href={buildTelUrl(p.phone)}
                className="p-3.5 rounded-2xl bg-surface-container-lowest border-2 border-[#ba1a1a]/30 hover:border-[#ba1a1a] shadow-sm flex flex-col items-center text-center transition-colors min-h-[44px]"
              >
                <span className="text-2xl font-extrabold text-error tabular-nums" dir="ltr">
                  {p.phone}
                </span>
                <span className="text-xs font-bold text-on-surface mt-0.5 truncate max-w-full">
                  {bilingualText(lang, p.name_en, p.name_ur)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-error mt-1">
                  {lang === 'ur' ? 'کال ملائیں' : 'Tap to Dial'}
                </span>
              </a>
            ))}
          </div>
        )}

        {/* Filter Chips */}
        {initialCategory === 'all' && <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setFilter(c.id)}
              className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 border cursor-pointer transition-colors ${
                filter === c.id
                  ? 'bg-[#ba1a1a] dark:bg-[#b91c1c] text-white border-[#ba1a1a]'
                  : 'bg-surface-container-lowest text-on-surface border-outline-variant/50 hover:bg-surface-container-low'
              }`}
            >
              {lang === 'ur' ? c.labelUr : c.labelEn}
            </button>
          ))}
        </div>}

        <AdPlacementSlot placement="emergency_banner" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((em) => (
            <Card key={em.id} className="overflow-hidden border-error/25">
              <div className="aspect-video flex">
                <div className="w-2/5 shrink-0 overflow-hidden bg-error-container flex items-center justify-center">
                  {directoryImageUrls.helplines[em.id]
                    ? <ImageWithFallback src={directoryImageUrls.helplines[em.id]} alt={`${em.name_en} helpline`} className="w-full h-full" />
                    : <CategoryIcon name={em.icon} className="w-10 h-10 text-error" />}
                </div>
                <div className="w-3/5 min-w-0 p-3 sm:p-4 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-full min-w-0">
                    <h2 className="text-base sm:text-lg font-extrabold text-on-surface leading-snug line-clamp-2">
                      {bilingualText(lang, em.name_en, em.name_ur)}
                    </h2>
                    {lang === 'en' && urduHints && (
                      <p className="font-urdu text-sm text-primary leading-[1.8] mt-1 line-clamp-2" dir="rtl">
                        {em.name_ur}
                      </p>
                    )}
                    {(lang === 'ur' ? em.description_ur || em.description_en : em.description_en) && (
                      <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">
                        {lang === 'ur' ? em.description_ur || em.description_en : em.description_en}
                      </p>
                    )}
                    {em.source_url && <div className="flex items-center justify-center gap-1.5 flex-wrap mt-1"><a href={em.source_url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-primary underline">{lang === 'ur' ? 'سرکاری ماخذ' : 'Official source'}</a>{em.verified_at && <span className="text-[10px] text-outline">{lang === 'ur' ? 'تصدیق' : 'Checked'}: {formatDateShort(em.verified_at)}</span>}</div>}
                  </div>
                  <div className="w-full space-y-2">
                    <span className="block text-xl sm:text-2xl font-extrabold text-error tabular-nums" dir="ltr">{em.phone}</span>
                    <div className="flex items-center justify-center gap-1.5">
                      <a href={buildTelUrl(em.phone)}
                        className="flex-1 min-h-10 px-2 rounded-lg bg-[#ba1a1a] dark:bg-[#b91c1c] text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:opacity-95">
                        <PhoneCall className="w-4 h-4" />
                        {lang === 'ur' ? 'کال کریں' : 'Call'}
                      </a>
                      {em.whatsapp && (
                        <a href={buildWhatsAppUrl(em.whatsapp)} target="_blank" rel="noopener noreferrer"
                          aria-label={lang === 'ur' ? 'واٹس ایپ' : 'WhatsApp'}
                          className="min-h-10 px-3 rounded-lg bg-whatsapp text-white font-bold text-sm flex items-center justify-center">
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}

export function GovernmentHelplines() {
  return <Emergency initialCategory="government" />;
}
