import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Phone, PlusCircle, Tag } from 'lucide-react';
import { fetchActiveOffers } from '../lib/api';
import { bilingualText, formatDateShort } from '../lib/format';
import { useI18n } from '../lib/i18n';
import { buildTelUrl, formatPkPhoneDisplay } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import type { OfferRow } from '../types/database';
import type { BusinessPublicView } from '../types/directory';
import { AppShell } from '../components/layout/AppShell';
import { ImageWithFallback } from '../components/ui/ImageWithFallback';
import { EmptyState, Skeleton } from '../components/ui/Feedback';
import { Badge, Card, Container, SectionHeading } from '../components/ui/Surface';

export function Offers() {
  const { lang } = useI18n();
  const [offers, setOffers] = useState<Array<OfferRow & { business: BusinessPublicView | null }>>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    updatePageSeo({
      title: 'Local Offers & Discounts in Sadiqabad — Hello Sadiqabad',
      description: 'Active discounts, wholesale deals, and seasonal offers from verified Sadiqabad businesses.',
      canonicalPath: '/offers',
    });
    fetchActiveOffers()
      .then(setOffers)
      .finally(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(() => {
    const seen = new Map<string, string>();
    offers.forEach((o) => {
      if (o.business?.category) {
        seen.set(
          o.business.category.slug,
          bilingualText(lang, o.business.category.name_en, o.business.category.name_ur)
        );
      }
    });
    return Array.from(seen.entries());
  }, [offers, lang]);

  const visibleOffers =
    selectedCategory === 'all'
      ? offers
      : offers.filter((o) => o.business?.category?.slug === selectedCategory);

  return (
    <AppShell>
      <Container className="py-6 space-y-6">
        <SectionHeading
          title={lang === 'ur' ? 'خصوصی رعایت اور ڈیلز' : 'Local Offers & Deals'}
          titleUr={lang === 'en' ? 'صادق آباد میں خصوصی رعایت اور ڈیلز' : undefined}
          subtitle={
            lang === 'ur'
              ? 'صادق آباد کے تصدیق شدہ کاروباروں اور کلینکس کی فعال آفرز'
              : 'Verified active discounts from Sadiqabad merchants and clinics'
          }
        />

        {categoryOptions.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-primary text-on-primary border-primary'
                  : 'bg-surface-container-lowest text-on-surface border-outline-variant/50'
              }`}
            >
              {lang === 'ur' ? `تمام ڈیلز (${offers.length})` : `All Deals (${offers.length})`}
            </button>
            {categoryOptions.map(([slug, label]) => (
              <button
                key={slug}
                type="button"
                onClick={() => setSelectedCategory(slug)}
                className={`px-3.5 py-2 rounded-full text-xs font-bold border whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === slug
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container-lowest text-on-surface border-outline-variant/50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40 rounded-2xl" />
            ))}
          </div>
        ) : visibleOffers.length === 0 ? (
          <EmptyState
            title={lang === 'ur' ? 'آج کوئی فعال آفر موجود نہیں' : 'No active offers today'}
            description={
              lang === 'ur'
                ? 'صادق آباد کی دکانوں اور ریستورانوں کی نئی ڈیلز کے لیے جلد دوبارہ چیک کریں۔'
                : 'Check back soon for new deals from Sadiqabad shops and restaurants.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {visibleOffers.map((offer) => (
              <Card key={offer.id} className="p-4 flex flex-col sm:flex-row gap-4">
                <ImageWithFallback
                  src={offer.image_url || offer.business?.logo_url}
                  alt={offer.title}
                  className="w-full sm:w-32 h-36 sm:h-32 rounded-xl shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <Badge variant="gold">
                        <Tag className="w-3 h-3" /> {lang === 'ur' ? 'فعال آفر' : 'Active Deal'}
                      </Badge>
                      <span className="text-xs text-on-surface-variant inline-flex items-center gap-1 tabular-nums">
                        <Calendar className="w-3.5 h-3.5" />{' '}
                        {lang === 'ur' ? 'آخری تاریخ' : 'Till'} {formatDateShort(offer.valid_to)}
                      </span>
                    </div>
                    <h2 className="text-base font-bold text-on-surface">{offer.title}</h2>
                    {offer.description && (
                      <p className="text-xs text-on-surface-variant line-clamp-2">
                        {offer.description}
                      </p>
                    )}
                  </div>

                  {offer.business && (
                    <div className="pt-2 border-t border-outline-variant/25 flex items-center justify-between gap-2">
                      <Link
                        to={`/business/${offer.business.slug}`}
                        className="text-xs font-bold text-primary hover:underline truncate"
                      >
                        {bilingualText(lang, offer.business.name_en, offer.business.name_ur)}
                      </Link>
                      <a
                        href={buildTelUrl(offer.business.phone_primary)}
                        dir="ltr"
                        className="text-xs font-bold text-on-surface inline-flex items-center gap-1 tabular-nums shrink-0"
                      >
                        <Phone className="w-3.5 h-3.5 text-primary" />
                        {formatPkPhoneDisplay(offer.business.phone_primary)}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-5 bg-surface-container-low flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-on-surface">
              {lang === 'ur'
                ? 'صادق آباد میں دکان کے مالک ہیں؟ اپنی خصوصی ڈیلز شائع کریں!'
                : 'Own a shop in Sadiqabad? Publish your seasonal discounts!'}
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {lang === 'ur'
                ? 'اپنی خصوصی آفرز کی تشہیر کے لیے اونر پورٹل میں لاگ ان کریں یا اپنا کاروبار مفت شامل کریں۔'
                : 'Sign in to the Owner Portal or register your listing for free to promote special deals.'}
            </p>
          </div>
          <Link
            to="/owner/offers"
            className="min-h-[44px] px-4 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center justify-center gap-1.5 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />{' '}
            {lang === 'ur' ? 'آفر شامل کریں' : 'Post an Offer'}
          </Link>
        </Card>
      </Container>
    </AppShell>
  );
}
