import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ExternalLink, Megaphone, ShieldAlert } from 'lucide-react';
import { fetchAnnouncements } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { updatePageSeo } from '../lib/seo';
import type { AnnouncementRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/ui/Feedback';
import { Card, Container, SectionHeading } from '../components/ui/Surface';

export function Announcements() {
  const { lang, urduHints } = useI18n();
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [activeOnly, setActiveOnly] = useState(true);

  useEffect(() => {
    updatePageSeo({
      title: 'Civic Notices & City Announcements — Hello Sadiqabad',
      description: 'Public health camps, traffic advisories, and city notices for Sadiqabad.',
      canonicalPath: '/announcements',
    });
  }, []);

  useEffect(() => {
    fetchAnnouncements(activeOnly).then(setItems);
  }, [activeOnly]);

  return (
    <AppShell>
      <Container size="md" className="py-6 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            title="Sadiqabad Civic Notices & Events"
            titleUr="صادق آباد کے عوامی اعلانات"
            subtitle="Verified traffic advisories, medical camps, and municipal updates"
          />
          <button
            type="button"
            onClick={() => setActiveOnly((v) => !v)}
            className={`h-10 px-3.5 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer ${
              !activeOnly
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container-lowest text-on-surface border-outline-variant/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>
              {activeOnly
                ? lang === 'ur'
                  ? 'آرکائیو دیکھیں'
                  : 'Show Archive'
                : lang === 'ur'
                ? 'تمام اعلانات'
                : 'Showing All Notices'}
            </span>
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Megaphone className="w-6 h-6" />}
            title={lang === 'ur' ? 'کوئی فعال اعلان موجود نہیں' : 'No active announcements'}
            description={
              lang === 'ur'
                ? 'صادق آباد کے عوامی اعلانات کے لیے جلد دوبارہ دیکھیں۔'
                : 'Check back later for Sadiqabad civic and community notices.'
            }
          />
        ) : (
          <div className="space-y-4">
            {items.map((a) => {
              const isExternal = Boolean(a.link_url && /^https?:\/\//i.test(a.link_url));
              return (
                <Card key={a.id} className="p-5 space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-on-surface">
                        {bilingualText(lang, a.title_en, a.title_ur)}
                      </h2>
                      {lang === 'en' && urduHints && (
                        <p className="font-urdu text-sm text-primary leading-[2.0]" dir="rtl">
                          {a.title_ur}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-outline shrink-0">
                      {formatDateShort(a.created_at, lang)}
                    </span>
                  </div>

                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {bilingualText(lang, a.body_en, a.body_ur)}
                  </p>
                  {lang === 'en' && urduHints && a.body_ur && (
                    <p className="font-urdu text-sm text-on-surface-variant leading-[2.1]" dir="rtl">
                      {a.body_ur}
                    </p>
                  )}

                  {a.link_url && (
                    <div className="pt-1">
                      {isExternal ? (
                        <a
                          href={a.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>{lang === 'ur' ? 'متعلقہ تفصیلات دیکھیں' : 'View Related Details'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <Link
                          to={a.link_url}
                          className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                        >
                          <span>{lang === 'ur' ? 'متعلقہ تفصیلات دیکھیں' : 'View Related Details'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

        <Card className="p-4 bg-[#ba1a1a]/10 border-[#ba1a1a]/25 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-on-surface">
            <ShieldAlert className="w-4 h-4 text-error" />
            <span>
              {lang === 'ur'
                ? '24/7 پولیس 15، ریسکیو 1122 یا ہسپتال نمبر درکار ہیں؟'
                : 'Need 24/7 Police 15, Rescue 1122, or Hospital contacts?'}
            </span>
          </div>
          <Link to="/emergency" className="text-xs font-bold text-error hover:underline">
            {lang === 'ur' ? 'ایمرجنسی فون بک کھولیں ←' : 'Open Emergency Phone Book →'}
          </Link>
        </Card>
      </Container>
    </AppShell>
  );
}
