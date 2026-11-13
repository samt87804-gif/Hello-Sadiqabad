import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, ExternalLink, X } from 'lucide-react';
import type { AdRow } from '../../types/database';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import {
  fetchActiveAds,
  fetchPublicSiteSettings,
  trackAdImpression,
  trackBusinessEvent,
} from '../../lib/api';

export function AdBanner({ ad }: { ad: AdRow }) {
  const [adsEnabled, setAdsEnabled] = useState(true);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicSiteSettings()
      .then((settings) => {
        if (!active) return;
        setAdsEnabled(settings.ads_enabled);
        if (settings.ads_enabled && trackedRef.current !== ad.id) {
          trackedRef.current = ad.id;
          trackAdImpression(ad.id);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [ad.id]);

  if (!adsEnabled) return null;

  const isInternal = !ad.target_url || ad.target_url.startsWith('/');
  const to = ad.target_url || '/';

  const handleClick = () => {
    trackBusinessEvent(ad.business_id, 'view', ad.id);
  };

  const inner = (
    <div className="rounded-2xl bg-surface-container-lowest border border-secondary-container/40 shadow-md overflow-hidden group">
      <div className="relative h-36 sm:h-44 w-full">
        <ImageWithFallback src={ad.image_url} alt={ad.title} className="w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-extrabold inline-flex items-center gap-1 shadow-sm">
          <Award className="w-3.5 h-3.5" />
          <span>Sponsored Spotlight</span>
        </div>
        <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between gap-2 text-white">
          <div className="min-w-0">
            <h3 className="text-base sm:text-lg font-bold truncate group-hover:underline">
              {ad.title}
            </h3>
            {ad.notes && <p className="text-xs text-white/85 truncate">{ad.notes}</p>}
          </div>
          {!isInternal && <ExternalLink className="w-4 h-4 shrink-0 text-white/80" />}
        </div>
      </div>
    </div>
  );

  if (isInternal) {
    return (
      <Link to={to} onClick={handleClick} className="block">
        {inner}
      </Link>
    );
  }
  return (
    <a href={to} target="_blank" rel="noopener noreferrer" onClick={handleClick} className="block">
      {inner}
    </a>
  );
}

export function PopupAdModal() {
  const [ad, setAd] = useState<AdRow | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let timerId: number | undefined;
    try {
      if (sessionStorage.getItem('hs_popup_ad_shown')) return undefined;
    } catch {
      return undefined;
    }

    Promise.all([fetchPublicSiteSettings(), fetchActiveAds('popup')])
      .then(([settings, ads]) => {
        if (!active || !settings.ads_enabled || !ads[0]) return;
        const candidate = ads[0];
        timerId = window.setTimeout(() => {
          if (!active) return;
          setAd(candidate);
          setOpen(true);
          trackAdImpression(candidate.id);
          try {
            sessionStorage.setItem('hs_popup_ad_shown', candidate.id);
          } catch {
            // ignore storage errors
          }
        }, 10000);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      if (timerId) window.clearTimeout(timerId);
    };
  }, []);

  if (!open || !ad) return null;

  const isInternal = !ad.target_url || ad.target_url.startsWith('/');
  const to = ad.target_url || '/';

  const handleClose = () => setOpen(false);
  const handleCta = () => {
    trackBusinessEvent(ad.business_id, 'view', ad.id);
    setOpen(false);
  };

  return (
    <div
      className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Sponsored offer: ${ad.title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-3xl overflow-hidden bg-surface-container-lowest border border-secondary-container/50 shadow-2xl">
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close sponsored popup"
          className="absolute top-3 end-3 z-10 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative h-52 w-full bg-surface-container">
          <ImageWithFallback src={ad.image_url} alt={ad.title} className="w-full h-full" />
          <span className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-secondary-container text-on-secondary-container text-[11px] font-extrabold inline-flex items-center gap-1">
            <Award className="w-3.5 h-3.5" /> Sponsored
          </span>
        </div>

        <div className="p-5 space-y-3">
          <h3 className="text-lg font-extrabold text-on-surface">{ad.title}</h3>
          {ad.notes && <p className="text-xs text-on-surface-variant">{ad.notes}</p>}
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[40px] px-4 rounded-xl border border-outline-variant text-xs font-semibold text-on-surface hover:bg-surface-container-low cursor-pointer"
            >
              Dismiss
            </button>
            {isInternal ? (
              <Link
                to={to}
                onClick={handleCta}
                className="min-h-[40px] px-4 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
              >
                View Offer
              </Link>
            ) : (
              <a
                href={to}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCta}
                className="min-h-[40px] px-4 rounded-xl bg-primary text-on-primary text-xs font-bold inline-flex items-center gap-1.5"
              >
                Visit Offer <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
