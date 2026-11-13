import type { BusinessPublicView } from '../types/directory';
import { supabaseConfig } from './supabase';

export function updatePageSeo(opts: {
  title: string;
  description?: string;
  path?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | null;
}) {
  const fullTitle = opts.title.includes('Hello Sadiqabad')
    ? opts.title
    : `${opts.title} — Hello Sadiqabad`;
  document.title = fullTitle;

  const setMeta = (selector: string, content: string) => {
    let el = document.querySelector(selector) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      if (selector.includes('property=')) {
        const prop = /property="([^"]+)"/.exec(selector)?.[1];
        if (prop) el.setAttribute('property', prop);
      } else if (selector.includes('name=')) {
        const name = /name="([^"]+)"/.exec(selector)?.[1];
        if (name) el.setAttribute('name', name);
      }
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const desc =
    opts.description ||
    'Bilingual local business directory and emergency phone book for Sadiqabad, District Rahim Yar Khan.';
  setMeta('meta[name="description"]', desc);
  setMeta('meta[property="og:title"]', fullTitle);
  setMeta('meta[property="og:description"]', desc);

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  const cleanPath = opts.path ?? opts.canonicalPath ?? window.location.pathname;
  canonical.href = `${supabaseConfig.siteUrl.replace(/\/$/, '')}${cleanPath}`;

  const existingJsonLd = document.getElementById('hs-json-ld');
  if (existingJsonLd) existingJsonLd.remove();
  if (opts.jsonLd) {
    const script = document.createElement('script');
    script.id = 'hs-json-ld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(opts.jsonLd);
    document.head.appendChild(script);
  }
}

export function buildLocalBusinessJsonLd(business: BusinessPublicView): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name_en,
    alternateName: business.name_ur ?? undefined,
    description: business.description_en ?? undefined,
    telephone: business.phone_primary,
    url: `${supabaseConfig.siteUrl}/business/${business.slug}`,
    image: business.cover_url || business.logo_url || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address_en ?? '',
      addressLocality: 'Sadiqabad',
      addressRegion: 'Punjab',
      addressCountry: 'PK',
    },
    ...(typeof business.lat === 'number' && typeof business.lng === 'number'
      ? {
          geo: {
            '@type': 'GeoCoordinates',
            latitude: business.lat,
            longitude: business.lng,
          },
        }
      : {}),
    ...(business.rating_avg && business.rating_count > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: business.rating_avg,
            reviewCount: business.rating_count,
          },
        }
      : {}),
  };
}
