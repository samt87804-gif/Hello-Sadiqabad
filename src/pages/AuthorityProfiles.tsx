import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, ExternalLink, Facebook, Instagram, Mail, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import type { AuthorityProfileRow } from '../types/database';
import type { BusinessPublicView } from '../types/directory';
import { fetchAuthorityProfiles, fetchBusinessesByIds } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText } from '../lib/format';
import { buildTelUrl } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import { AppShell } from '../components/layout/AppShell';
import { Container, Card, Badge } from '../components/ui/Surface';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';

function profileText(lang: string, en?: string | null, ur?: string | null): string {
  return lang === 'ur' ? (ur || en || '') : (en || ur || '');
}

export function AuthorityProfiles() {
  const { slug } = useParams();
  const { lang, urduHints } = useI18n();
  const [profiles, setProfiles] = useState<AuthorityProfileRow[]>([]);
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [loading, setLoading] = useState(true);
  const profile = useMemo(() => profiles.find((item) => item.slug === slug), [profiles, slug]);

  useEffect(() => {
    let active = true;
    fetchAuthorityProfiles()
      .then(async (rows) => {
        if (!active) return;
        setProfiles(rows);
        const selected = slug ? rows.find((item) => item.slug === slug) : null;
        if (selected?.show_businesses && selected.business_ids?.length) {
          const linked = await fetchBusinessesByIds(selected.business_ids);
          if (active) setBusinesses(linked.filter((business) => business.status === 'published'));
        } else if (active) setBusinesses([]);
      })
      .catch(() => { if (active) setProfiles([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    updatePageSeo({
      title: profile ? `${profile.name_en} — Authority Profile` : 'Sadiqabad Authority Profiles',
      description: profile?.bio_en || 'Profiles of public representatives, union chairmen, association presidents and government officers in Sadiqabad.',
      canonicalPath: slug ? `/authority-profiles/${slug}` : '/authority-profiles',
    });
  }, [profile, slug]);

  const heading = lang === 'ur' ? 'صادق آباد کی شخصیات اور اتھارٹی پروفائلز' : 'Sadiqabad Authority Profiles';

  return (
    <AppShell>
      <Container className="py-6 space-y-5">
        <header className="rounded-3xl bg-primary text-on-primary p-5 sm:p-7 space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2"><ShieldCheck className="w-7 h-7" /><h1 className="text-xl sm:text-2xl font-extrabold">{profile ? profileText(lang, profile.name_en, profile.name_ur) : heading}</h1></div>
            {profile && <Link to="/authority-profiles" className="text-xs font-bold underline inline-flex items-center gap-1"><ArrowLeft className="w-3.5 h-3.5" />{lang === 'ur' ? 'تمام پروفائلز' : 'All profiles'}</Link>}
          </div>
          {!profile && <p className="text-sm text-white/85">{lang === 'ur' ? 'پریس کلب، وکلا، غلہ منڈی، آٹو یونین اور سرکاری شعبوں کے نمائندوں کے عوامی تعارف۔' : 'Public profiles of union chairmen, association presidents, civic representatives and government officers serving Sadiqabad.'}</p>}
          <div className="flex flex-wrap gap-2">
            <Link to="/local-authorities" className="rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-xs font-bold">{lang === 'ur' ? 'سرکاری دفاتر کے رابطے' : 'Government office directory'}</Link>
            {!profile && <span className="rounded-xl bg-white/15 px-3 py-2 text-xs font-bold">{profiles.length} {lang === 'ur' ? 'پروفائلز' : 'public profiles'}</span>}
          </div>
        </header>

        {loading ? <Card className="p-8 text-center text-sm text-on-surface-variant">{lang === 'ur' ? 'پروفائلز لوڈ ہو رہی ہیں…' : 'Loading authority profiles…'}</Card> :
          profile ? (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
                  <div className="bg-surface-container-low min-h-[260px] md:min-h-[340px]">
                    {profile.photo_url ? <ImageWithFallback src={profile.photo_url} alt={profile.name_en} className="w-full h-full min-h-[260px] md:min-h-[340px] object-cover" /> : <div className="w-full h-full min-h-[260px] flex items-center justify-center"><UserRound className="w-20 h-20 text-outline" /></div>}
                  </div>
                  <div className="p-5 sm:p-7 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {profile.show_status && profile.status_label_en && <Badge variant="success">{profileText(lang, profile.status_label_en, profile.status_label_ur)}</Badge>}
                      <Badge variant="neutral">{lang === 'ur' ? 'صادق آباد' : 'Sadiqabad'}</Badge>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface">{profileText(lang, profile.name_en, profile.name_ur)}</h2>
                    {(profile.designation_en || profile.designation_ur) && <p className="text-base font-bold text-primary">{profileText(lang, profile.designation_en, profile.designation_ur)}</p>}
                    {profile.show_organization && (profile.organization_en || profile.organization_ur) && <p className="flex items-center gap-2 text-sm text-on-surface-variant"><Building2 className="w-4 h-4 shrink-0" />{profileText(lang, profile.organization_en, profile.organization_ur)}</p>}
                    {profile.show_authority && (profile.authority_en || profile.authority_ur) && <section className="pt-2"><h3 className="text-sm font-extrabold mb-1">{lang === 'ur' ? 'اختیارات اور ذمہ داریاں' : 'Authority & responsibilities'}</h3><p className="text-sm leading-7 text-on-surface-variant whitespace-pre-line">{profileText(lang, profile.authority_en, profile.authority_ur)}</p></section>}
                    {profile.show_bio && (profile.bio_en || profile.bio_ur) && <section className="pt-1"><h3 className="text-sm font-extrabold mb-1">{lang === 'ur' ? 'تعارف' : 'Profile introduction'}</h3><p className="text-sm leading-7 text-on-surface-variant whitespace-pre-line">{profileText(lang, profile.bio_en, profile.bio_ur)}</p></section>}
                    {profile.show_contact && <div className="flex flex-wrap gap-2 pt-2">
                      {profile.phone && <a href={buildTelUrl(profile.phone)} className="rounded-xl bg-primary text-on-primary px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{profile.phone}</a>}
                      {profile.email && <a href={`mailto:${profile.email}`} className="rounded-xl bg-surface-container px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />Email</a>}
                      {profile.website_url && <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-surface-container px-3 py-2 text-xs font-bold inline-flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" />Website</a>}
                      {profile.facebook_url && <a href={profile.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="rounded-xl bg-surface-container p-2.5"><Facebook className="w-4 h-4" /></a>}
                      {profile.instagram_url && <a href={profile.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="rounded-xl bg-surface-container p-2.5"><Instagram className="w-4 h-4" /></a>}
                    </div>}
                    {profile.source_url && <a href={profile.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-primary underline inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" />{lang === 'ur' ? 'حوالہ / ماخذ' : 'Reference source'}</a>}
                  </div>
                </div>
              </Card>
              {profile.show_businesses && businesses.length > 0 && <section className="space-y-3"><h2 className="text-lg font-extrabold">{lang === 'ur' ? 'منسلک کاروبار' : 'Associated businesses'}</h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{businesses.map((business) => <Link key={business.id} to={`/business/${business.slug}`} className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-3 flex items-center gap-3 hover:border-primary/50 transition-colors"><div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container shrink-0"><ImageWithFallback src={business.logo_url || business.cover_url} alt={business.name_en} className="w-full h-full object-cover" /></div><div className="min-w-0"><p className="text-sm font-bold truncate">{business.name_en}</p><p className="text-xs text-on-surface-variant truncate"><MapPin className="inline w-3 h-3" /> {business.area?.name_en || 'Sadiqabad'}</p></div></Link>)}</div></section>}
            </div>
          ) : slug ? (
            <Card className="p-8 text-center space-y-3"><h2 className="font-bold">{lang === 'ur' ? 'یہ پروفائل دستیاب نہیں' : 'Authority profile not found'}</h2><Link to="/authority-profiles" className="text-sm font-bold text-primary underline">{lang === 'ur' ? 'تمام پروفائلز دیکھیں' : 'Browse all profiles'}</Link></Card>
          ) : profiles.length === 0 ? (
            <Card className="p-8 text-center text-sm text-on-surface-variant">{lang === 'ur' ? 'ابھی کوئی عوامی پروفائل شامل نہیں کی گئی۔' : 'No public authority profiles have been added yet.'}</Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {profiles.map((item) => <Link key={item.id} to={`/authority-profiles/${item.slug}`} className="group rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-lowest shadow-sm hover:shadow-md hover:border-primary/50 transition-all">
                <div className="aspect-[16/10] bg-surface-container-low overflow-hidden">{item.photo_url ? <ImageWithFallback src={item.photo_url} alt={item.name_en} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" /> : <div className="w-full h-full flex items-center justify-center"><UserRound className="w-16 h-16 text-outline" /></div>}</div>
                <div className="p-4 space-y-1.5">
                  {item.show_status && item.status_label_en && <Badge variant="success">{profileText(lang, item.status_label_en, item.status_label_ur)}</Badge>}
                  <h2 className="font-extrabold text-base text-on-surface">{profileText(lang, item.name_en, item.name_ur)}</h2>
                  {(item.designation_en || item.designation_ur) && <p className="text-sm font-bold text-primary">{profileText(lang, item.designation_en, item.designation_ur)}</p>}
                  {item.show_organization && (item.organization_en || item.organization_ur) && <p className="text-xs text-on-surface-variant">{profileText(lang, item.organization_en, item.organization_ur)}</p>}
                  {item.show_bio && (item.bio_en || item.bio_ur) && <p className="text-xs text-on-surface-variant line-clamp-3">{profileText(lang, item.bio_en, item.bio_ur)}</p>}
                </div>
              </Link>)}
            </div>
          )}
      </Container>
    </AppShell>
  );
}
