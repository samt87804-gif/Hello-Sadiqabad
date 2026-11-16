import React, { useEffect, useMemo, useState } from 'react';
import { Building2, ExternalLink, Mail, MapPin, PhoneCall, Search } from 'lucide-react';
import type { LocalAuthorityRow, LocalAuthorityType } from '../types/database';
import { fetchLocalAuthorities } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText, formatDateShort } from '../lib/format';
import { buildTelUrl } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { AdPlacementSlot } from '../components/directory/AdBanner';
import { Badge, Card, Container } from '../components/ui/Surface';

const TYPE_LABELS: Record<LocalAuthorityType, { en: string; ur: string }> = {
  municipal: { en: 'Municipal', ur: 'بلدیاتی' },
  police: { en: 'Police', ur: 'پولیس' },
  revenue: { en: 'Revenue / Tehsil', ur: 'ریونیو / تحصیل' },
  district: { en: 'District Government', ur: 'ضلعی حکومت' },
  sanitation: { en: 'Sanitation', ur: 'صفائی' },
  other: { en: 'Other', ur: 'دیگر' },
};

export function LocalAuthorities() {
  const { lang, urduHints } = useI18n();
  const [authorities, setAuthorities] = useState<LocalAuthorityRow[]>([]);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<LocalAuthorityType | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updatePageSeo({
      title: 'Local Authorities Sadiqabad — Municipal Committee & Police Contacts',
      description: 'Officially sourced public contact directory for local authorities serving Sadiqabad, Punjab, Pakistan.',
      canonicalPath: '/local-authorities',
    });
    let active = true;
    fetchLocalAuthorities()
      .then((rows) => { if (active) setAuthorities(rows); })
      .catch(() => { if (active) setAuthorities([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const visible = useMemo(() => authorities.filter((row) => {
    const text = [row.name_en, row.name_ur, row.description_en ?? '', row.address_en ?? '', row.phone ?? ''].join(' ').toLowerCase();
    return (filter === 'all' || row.authority_type === filter) && (!query.trim() || text.includes(query.trim().toLowerCase()));
  }), [authorities, filter, query]);

  return (
    <AppShell>
      <Container className="py-6 space-y-5">
        <header className="rounded-3xl bg-primary text-white p-6 space-y-2">
          <div className="flex items-center gap-2"><Building2 className="w-7 h-7" /><h1 className="text-2xl font-extrabold">{lang === 'ur' ? 'صادق آباد کے مقامی سرکاری ادارے' : 'Sadiqabad Local Authorities'}</h1></div>
          {lang === 'en' && urduHints && <p className="font-urdu text-sm text-white/90" dir="rtl">صادق آباد کے بلدیاتی اور سرکاری اداروں کے رابطے</p>}
          <p className="text-sm text-white/90">{lang === 'ur' ? 'دفاتر کے رابطے سرکاری ذرائع سے لیے گئے ہیں۔ ہر ادارے کے کارڈ پر اصل ماخذ دیکھیں۔' : 'Public office contacts sourced from official government directories. Open each source link to verify current details.'}</p>
        </header>

        <AdPlacementSlot placement="authorities_banner" />

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2.5">
          <div className="relative">
            <Search className="absolute start-3 top-3 w-4 h-4 text-outline" />
            <input aria-label="Search authorities" placeholder={lang === 'ur' ? 'ادارے یا فون نمبر تلاش کریں' : 'Search offices or phone numbers'} value={query} onChange={(e) => setQuery(e.target.value)} className="w-full h-10 ps-9 pe-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm" />
          </div>
          <select aria-label="Filter authority type" value={filter} onChange={(e) => setFilter(e.target.value as LocalAuthorityType | 'all')} className="h-10 px-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm">
            <option value="all">{lang === 'ur' ? 'تمام ادارے' : 'All authorities'}</option>
            {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{lang === 'ur' ? label.ur : label.en}</option>)}
          </select>
        </div>

        {loading ? <Card className="p-8 text-center text-sm text-on-surface-variant">{lang === 'ur' ? 'لوڈ ہو رہا ہے…' : 'Loading directory…'}</Card> :
          visible.length === 0 ? <Card className="p-8 text-center text-sm text-on-surface-variant">{lang === 'ur' ? 'اس تلاش میں کوئی ادارہ نہیں ملا۔' : 'No authority contacts match this search yet.'}</Card> :
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {visible.map((row) => (
              <Card key={row.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-base">{bilingualText(lang, row.name_en, row.name_ur)}</h2>
                    {lang === 'en' && urduHints && <p className="font-urdu text-sm text-primary" dir="rtl">{row.name_ur}</p>}
                  </div>
                  <Badge variant="secondary">{lang === 'ur' ? TYPE_LABELS[row.authority_type].ur : TYPE_LABELS[row.authority_type].en}</Badge>
                </div>
                {(lang === 'ur' ? row.description_ur || row.description_en : row.description_en) && <p className="text-sm text-on-surface-variant">{lang === 'ur' ? row.description_ur || row.description_en : row.description_en}</p>}
                {(lang === 'ur' ? row.address_ur || row.address_en : row.address_en) && <p className="text-xs text-on-surface-variant flex items-start gap-2"><MapPin className="w-4 h-4 shrink-0" />{lang === 'ur' ? row.address_ur || row.address_en : row.address_en}</p>}
                {(row.office_hours_en || row.office_hours_ur) && <p className="text-xs text-on-surface-variant">{lang === 'ur' ? row.office_hours_ur || row.office_hours_en : row.office_hours_en}</p>}
                <div className="flex flex-wrap gap-2">
                  {row.phone && <a href={buildTelUrl(row.phone)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-white px-3 py-2 text-xs font-bold"><PhoneCall className="w-3.5 h-3.5" />{row.phone}</a>}
                  {row.phone_secondary && <a href={buildTelUrl(row.phone_secondary)} className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold"><PhoneCall className="w-3.5 h-3.5" />{row.phone_secondary}</a>}
                  {row.email && <a href={`mailto:${row.email}`} className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold"><Mail className="w-3.5 h-3.5" />{lang === 'ur' ? 'ای میل' : 'Email'}</a>}
                  {row.website_url && <a href={row.website_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold"><ExternalLink className="w-3.5 h-3.5" />{lang === 'ur' ? 'ویب سائٹ' : 'Website'}</a>}
                  {row.map_url && <a href={row.map_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-xs font-bold"><MapPin className="w-3.5 h-3.5" />{lang === 'ur' ? 'نقشہ' : 'Map'}</a>}
                </div>
                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between gap-2">
                  <a href={row.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary underline">{lang === 'ur' ? 'سرکاری ماخذ' : 'Official source'}</a>
                  <span className="text-[10px] text-outline">{lang === 'ur' ? 'تصدیق' : 'Source checked'}: {formatDateShort(row.verified_at)}</span>
                </div>
              </Card>
            ))}
          </div>
        }
      </Container>
    </AppShell>
  );
}
