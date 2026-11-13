import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Phone } from 'lucide-react';
import { fetchPageBySlug, fetchPublicSiteSettings } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText } from '../lib/format';
import { buildTelUrl, buildWhatsAppUrl, formatPkPhoneDisplay } from '../lib/phone';
import { DEFAULT_SITE_SETTINGS, type SiteSettingsMap } from '../lib/siteSettings';
import { updatePageSeo } from '../lib/seo';
import type { PageRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { MarkdownSafe } from '../components/ui/DataDisplay';
import { ErrorState, Skeleton } from '../components/ui/Feedback';
import { Card, Container } from '../components/ui/Surface';

const INFO_TABS = [
  { slug: 'about', to: '/about', labelEn: 'About Us', labelUr: 'ہمارے بارے میں' },
  { slug: 'contact', to: '/contact', labelEn: 'Contact & Help', labelUr: 'رابطہ اور مدد' },
  { slug: 'privacy', to: '/privacy', labelEn: 'Privacy Policy', labelUr: 'پرائیویسی پالیسی' },
  { slug: 'terms', to: '/terms', labelEn: 'Terms of Use', labelUr: 'استعمال کی شرائط' },
];

export function StaticPage({ slug }: { slug: string }) {
  const { lang, urduHints } = useI18n();
  const [page, setPage] = useState<PageRow | null>(null);
  const [settings, setSettings] = useState<SiteSettingsMap>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicSiteSettings()
      .then(setSettings)
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPageBySlug(slug)
      .then((res) => {
        setPage(res);
        if (res) {
          updatePageSeo({
            title: `${res.title_en} — Hello Sadiqabad`,
            description: `${res.title_en} for Hello Sadiqabad city directory.`,
            canonicalPath: `/${res.slug}`,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <AppShell>
      <Container size="md" className="py-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5 rtl:rotate-180" />{' '}
            {lang === 'ur' ? 'ہوم پر واپس جائیں' : 'Back to Home'}
          </Link>
          <nav aria-label="Information pages" className="flex items-center gap-1.5 flex-wrap">
            {INFO_TABS.map((tab) => (
              <Link
                key={tab.slug}
                to={tab.to}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  slug === tab.slug
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/40 hover:bg-surface-container-low'
                }`}
              >
                {lang === 'ur' ? tab.labelUr : tab.labelEn}
              </Link>
            ))}
          </nav>
        </div>

        {loading ? (
          <Skeleton className="h-64 rounded-2xl" />
        ) : !page ? (
          <ErrorState
            title={lang === 'ur' ? 'صفحہ نہیں ملا' : 'Page not found'}
            description={
              lang === 'ur'
                ? 'یہ معلوماتی صفحہ فی الحال دستیاب نہیں ہے۔'
                : 'This information page is unavailable.'
            }
          />
        ) : (
          <Card className="p-6 sm:p-8 space-y-5">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface">
                {bilingualText(lang, page.title_en, page.title_ur)}
              </h1>
              {lang === 'en' && urduHints && (
                <p className="font-urdu text-base text-primary mt-1 leading-[2.0]" dir="rtl">
                  {page.title_ur}
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-outline-variant/30">
              <MarkdownSafe
                content={lang === 'ur' ? page.body_md_ur || page.body_md_en : page.body_md_en}
              />
            </div>
          </Card>
        )}

        <Card className="p-5 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-on-surface">
              {lang === 'ur' ? 'ہیلو صادق آباد ڈائریکٹری ڈیسک' : 'Hello Sadiqabad Directory Desk'}
            </h2>
            <p className="text-xs text-on-surface-variant">
              {lang === 'ur'
                ? 'کاروبار کلیم کرنے، فون نمبر اپ ڈیٹ کرنے یا غلطی کی اطلاع دینے کے لیے رابطہ کریں۔'
                : 'Need help claiming a listing, updating a phone number, or reporting an error?'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {settings.contact_phone && (
              <a
                href={buildTelUrl(settings.contact_phone)}
                className="min-h-[40px] px-3 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span dir="ltr" className="tabular-nums">
                  {formatPkPhoneDisplay(settings.contact_phone)}
                </span>
              </a>
            )}
            {settings.contact_whatsapp && (
              <a
                href={buildWhatsAppUrl(settings.contact_whatsapp)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[40px] px-3 rounded-xl bg-whatsapp text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />{' '}
                {lang === 'ur' ? 'واٹس ایپ ڈیسک' : 'WhatsApp Desk'}
              </a>
            )}
            {settings.contact_email && (
              <a
                href={`mailto:${settings.contact_email}`}
                className="min-h-[40px] px-3 rounded-xl bg-surface-container text-on-surface text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5" /> {lang === 'ur' ? 'ای میل' : 'Email'}
              </a>
            )}
          </div>
        </Card>
      </Container>
    </AppShell>
  );
}
