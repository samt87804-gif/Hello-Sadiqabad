import React, { useEffect, useState } from 'react';
import { AlertTriangle, MapPin, MessageCircle, PhoneCall, ShieldAlert } from 'lucide-react';
import { fetchEmergencyContacts } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { buildTelUrl, buildWhatsAppUrl } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import type { EmergencyCategory, EmergencyContactRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { CategoryIcon } from '../components/ui/CategoryIcon';
import { Badge, Card, Container } from '../components/ui/Surface';

const CATEGORIES: Array<{ id: 'all' | EmergencyCategory; labelEn: string; labelUr: string }> = [
  { id: 'all', labelEn: 'All Helplines', labelUr: 'تمام ہیلپ لائنز' },
  { id: 'rescue', labelEn: 'Rescue', labelUr: 'ریسکیو' },
  { id: 'police', labelEn: 'Police', labelUr: 'پولیس' },
  { id: 'fire', labelEn: 'Fire', labelUr: 'فائر بریگیڈ' },
  { id: 'ambulance', labelEn: 'Ambulance', labelUr: 'ایمبولینس' },
  { id: 'utility', labelEn: 'Utilities (Gas / Electricity)', labelUr: 'گیس اور بجلی' },
  { id: 'general', labelEn: 'Public Helplines', labelUr: 'عوامی ہیلپ لائنز' },
];

export function Emergency() {
  const { lang, urduHints } = useI18n();
  const [contacts, setContacts] = useState<EmergencyContactRow[]>([]);
  const [filter, setFilter] = useState<'all' | EmergencyCategory>('all');
  const [fromCache, setFromCache] = useState(false);
  const [cachedAt, setCachedAt] = useState<string | null>(null);

  useEffect(() => {
    updatePageSeo({
      title: '24/7 Emergency Contacts Sadiqabad — Rescue 1122, Police 15, Fire 16',
      description: 'Offline-ready 24/7 emergency helpline directory for Sadiqabad, District Rahim Yar Khan.',
      canonicalPath: '/emergency',
    });
    fetchEmergencyContacts().then((res) => {
      setContacts(res.items);
      setFromCache(res.fromCache);
      setCachedAt(res.cachedAt);
    });
  }, []);

  const priorityTop = contacts.filter((c) => ['1122', '15', '16', '115'].includes(c.phone)).slice(0, 4);
  const visible = contacts.filter((c) => filter === 'all' || c.category === filter);

  return (
    <AppShell>
      <Container className="py-6 space-y-6">
        <div className="rounded-3xl bg-[#ba1a1a] dark:bg-[#93000a] text-white p-6 shadow-md space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-7 h-7" />
              <h1 className="text-2xl font-extrabold">
                {lang === 'ur'
                  ? 'صادق آباد 24/7 ایمرجنسی ہیلپ لائنز'
                  : '24/7 Sadiqabad Emergency Helplines'}
              </h1>
            </div>
            <Badge variant="neutral">
              {lang === 'ur' ? 'آف لائن محفوظ شدہ' : 'Offline Cached Ready'}
            </Badge>
          </div>
          {lang === 'en' && urduHints && (
            <p className="font-urdu text-sm text-white/95 leading-[2.0]" dir="rtl">
              صادق آباد کے ہنگامی رابطہ نمبرز — انٹرنیٹ کے بغیر بھی دستیاب
            </p>
          )}
          <div className="p-3 rounded-2xl bg-black/20 text-xs flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              {lang === 'ur' ? (
                <>
                  <strong>اہم ہدایت:</strong> یہاں صرف تصدیق شدہ قومی و پنجاب ٹول فری ہنگامی کوڈز شامل ہیں۔ کال کرتے وقت ہمیشہ اپنا درست علاقہ (جیسے ماڈل ٹاؤن، کلب روڈ، ریل بازار یا کے ایل پی روڈ) اور قریبی مشہور نشانی بتائیں۔
                </>
              ) : (
                <>
                  <strong>Verified Shortcodes:</strong> These are verified Pakistan national and Punjab toll-free helplines. Always share your exact neighborhood (e.g., Model Town, Club Road, Rail Bazaar, or KLP Road) and nearest landmark when calling.
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
        {priorityTop.length > 0 && (
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
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
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
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visible.map((em) => (
            <Card key={em.id} className="p-4 border-error/25 flex flex-col justify-between gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-error-container text-error flex items-center justify-center shrink-0">
                    <CategoryIcon name={em.icon} className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-on-surface">
                      {bilingualText(lang, em.name_en, em.name_ur)}
                    </h2>
                    {lang === 'en' && urduHints && (
                      <p className="font-urdu text-xs text-primary leading-[1.9]" dir="rtl">
                        {em.name_ur}
                      </p>
                    )}
                    {(lang === 'ur' ? em.description_ur || em.description_en : em.description_en) && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        {lang === 'ur' ? em.description_ur || em.description_en : em.description_en}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-lg font-extrabold text-error tabular-nums shrink-0" dir="ltr">
                  {em.phone}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-outline-variant/25">
                <a
                  href={buildTelUrl(em.phone)}
                  className="flex-1 min-h-[44px] px-4 rounded-xl bg-[#ba1a1a] dark:bg-[#b91c1c] text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-95"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>
                    {lang === 'ur' ? (
                      <>
                        کال کریں <span dir="ltr" className="tabular-nums">{em.phone}</span>
                      </>
                    ) : (
                      <>Call {em.phone}</>
                    )}
                  </span>
                </a>
                {em.whatsapp && (
                  <a
                    href={buildWhatsAppUrl(em.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 rounded-xl bg-whatsapp text-white font-bold text-sm flex items-center justify-center gap-1.5"
                  >
                    <MessageCircle className="w-4 h-4" />{' '}
                    {lang === 'ur' ? 'واٹس ایپ' : 'WhatsApp'}
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </AppShell>
  );
}
