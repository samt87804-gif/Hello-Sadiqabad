import React from 'react';
import { Link } from 'react-router-dom';
import { BadgeCheck, Bookmark, MapPin, MessageCircle, Phone, Star, Tag } from 'lucide-react';
import type { BusinessPublicView } from '../../types/directory';
import { useI18n } from '../../lib/i18n';
import { bilingualText } from '../../lib/format';
import { buildTelUrl, buildWhatsAppUrl, formatPkPhoneDisplay } from '../../lib/phone';
import { effectivePlanCode } from '../../lib/searchFilter';
import { trackBusinessEvent } from '../../lib/api';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { OpenNowBadge } from './OpenNowBadge';

export function BusinessCard({
  business,
  isSaved,
  onToggleSave,
}: {
  business: BusinessPublicView;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const { lang, urduHints, t } = useI18n();
  const effPlan = effectivePlanCode(business.plan_code, business.plan_expires_at);
  const canWhatsApp =
    Boolean(business.whatsapp) && (effPlan === 'basic' || effPlan === 'premium');
  const displayName = bilingualText(lang, business.name_en, business.name_ur);
  const catName = business.category
    ? bilingualText(lang, business.category.name_en, business.category.name_ur)
    : '';
  const areaName = business.area
    ? bilingualText(lang, business.area.name_en, business.area.name_ur)
    : 'Sadiqabad';
  const activeOffer = business.active_offers?.[0];

  return (
    <article
      className={`rounded-2xl bg-surface-container-lowest border border-outline-variant/35 shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between gap-3 ${
        effPlan === 'premium' ? 'border-t-4 border-t-secondary-container' : ''
      }`}
    >
      {/* Top Row: Media + Identity */}
      <div className="flex items-start gap-3">
        <Link
          to={`/business/${business.slug}`}
          className="relative w-20 h-20 rounded-xl overflow-hidden bg-surface-container shrink-0"
        >
          <ImageWithFallback
            src={business.logo_url || business.cover_url}
            alt={business.name_en}
            className="w-full h-full"
          />
          {effPlan === 'premium' && (
            <span className="absolute top-1 start-1 px-1.5 py-0.5 rounded bg-secondary-container text-on-secondary-container text-[9px] font-extrabold uppercase tracking-wider">
              {lang === 'ur' ? 'پریمیم' : 'Premium'}
            </span>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/business/${business.slug}`} className="min-w-0 group">
              <div className="flex items-center gap-1">
                <h3 className="text-base font-bold text-on-surface group-hover:text-primary transition-colors truncate">
                  {displayName}
                </h3>
                {business.is_verified && (
                  <BadgeCheck
                    className="w-4 h-4 text-primary shrink-0"
                    aria-label="Verified business"
                  />
                )}
              </div>
              {lang === 'en' && urduHints && business.name_ur && (
                <p
                  className="font-urdu text-xs text-primary/90 leading-[1.9] truncate"
                  dir="rtl"
                >
                  {business.name_ur}
                </p>
              )}
            </Link>

            <button
              type="button"
              aria-label={isSaved ? 'Remove from saved' : 'Save business'}
              onClick={() => onToggleSave(business.id)}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-secondary-fixed text-secondary'
                  : 'bg-surface-container-low text-on-surface-variant hover:text-secondary'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Zero-pill metadata line separated with middots */}
          <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-xs text-on-surface-variant mt-1">
            {catName && <span className="font-semibold text-primary">{catName}</span>}
            {catName && <span>·</span>}
            <span className="inline-flex items-center gap-0.5">
              <MapPin className="w-3.5 h-3.5 text-secondary shrink-0" />
              <span>{areaName}</span>
            </span>
            {typeof business.distance_km === 'number' && (
              <>
                <span>·</span>
                <span className="tabular-nums font-semibold">{business.distance_km} km</span>
              </>
            )}
          </div>

          {/* Rating + Open Now */}
          <div className="flex items-center flex-wrap gap-2 mt-2">
            {business.rating_avg ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-on-surface tabular-nums">
                <Star className="w-3.5 h-3.5 text-secondary-container fill-secondary-container" />
                <span>{business.rating_avg.toFixed(1)}</span>
                <span className="text-on-surface-variant font-normal">
                  ({business.rating_count})
                </span>
              </span>
            ) : (
              <span className="text-xs text-on-surface-variant">
                {lang === 'ur' ? 'ابھی کوئی تبصرہ نہیں' : 'No reviews yet'}
              </span>
            )}
            <OpenNowBadge openingHours={business.opening_hours} isOpen24h={business.is_open_24h} />
          </div>
        </div>
      </div>

      {/* Active Offer Strip */}
      {activeOffer && (
        <Link
          to={`/business/${business.slug}`}
          className="px-3 py-1.5 rounded-xl bg-secondary-fixed/65 text-on-secondary-fixed text-xs font-semibold flex items-center gap-1.5 truncate hover:brightness-95"
        >
          <Tag className="w-3.5 h-3.5 text-secondary shrink-0" />
          <span className="truncate">{activeOffer.title}</span>
        </Link>
      )}

      {/* Action Bar with Visible Phone Number */}
      <div className="pt-2 border-t border-outline-variant/25 flex items-center gap-2">
        <a
          href={buildTelUrl(business.phone_primary)}
          onClick={() => trackBusinessEvent(business.id, 'call')}
          className="flex-1 min-h-[42px] px-3 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary-container transition-colors"
        >
          <Phone className="w-3.5 h-3.5 shrink-0" />
          <span dir="ltr" className="tabular-nums truncate">
            {formatPkPhoneDisplay(business.phone_primary)}
          </span>
        </a>

        {canWhatsApp ? (
          <a
            href={buildWhatsAppUrl(
              business.whatsapp,
              `Assalam o Alaikum! I found ${business.name_en} on HelloSadiqabad.com`
            )}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBusinessEvent(business.id, 'whatsapp')}
            className="min-h-[42px] px-3.5 rounded-xl bg-whatsapp text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:brightness-95 transition-all shrink-0"
          >
            <MessageCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{t('action.whatsapp', 'WhatsApp')}</span>
          </a>
        ) : (
          <Link
            to={`/business/${business.slug}`}
            className="min-h-[42px] px-3.5 rounded-xl bg-surface-container text-on-surface text-xs font-bold flex items-center justify-center hover:bg-surface-container-high transition-colors shrink-0"
          >
            {t('action.viewDetails', 'View Details')}
          </Link>
        )}
      </div>
    </article>
  );
}
