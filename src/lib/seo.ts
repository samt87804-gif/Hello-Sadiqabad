import type { BusinessPublicView } from '../types/directory';
import { supabaseConfig } from './supabase';

export function updatePageSeo(opts: {
  title: string;
  description?: string;
  path?: string;
  canonicalPath?: string;
  jsonLd?: Record<string, unknown> | null;
  ogType?: 'website' | 'article';
  image?: string | null;
  robots?: string;
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
  setMeta('meta[name="robots"]', opts.robots ?? 'index,follow,max-image-preview:large');
  setMeta('meta[property="og:title"]', fullTitle);
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[name="twitter:title"]', fullTitle);
  setMeta('meta[name="twitter:description"]', desc);
  setMeta('meta[property="og:type"]', opts.ogType ?? 'website');
  const socialImage = opts.image || 'https://efwohfzqitevkuybnyif.supabase.co/storage/v1/object/public/Hello%20Sadiqabad/186747.png';
  setMeta('meta[property="og:image"]', socialImage);
  setMeta('meta[property="og:image:alt"]', fullTitle);
  setMeta('meta[name="twitter:image"]', socialImage);
  setMeta('meta[name="twitter:card"]', opts.image ? 'summary_large_image' : 'summary');

  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  const cleanPath = opts.path ?? opts.canonicalPath ?? window.location.pathname;
  canonical.href = `${supabaseConfig.siteUrl.replace(/\/$/, '')}${cleanPath}`;
  setMeta('meta[property="og:url"]', canonical.href);

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

export function toMetaDescription(value: string | null | undefined, fallback: string): string {
  const plainText = String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(new RegExp(String.fromCharCode(96), 'g'), ' ')
    .replace(/[*_>#~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!plainText) return fallback;
  return plainText.length > 160 ? plainText.slice(0, 157).trimEnd() + '…' : plainText;
}

export function buildLocalBusinessJsonLd(business: BusinessPublicView): Record<string, unknown> {
  const siteUrl = supabaseConfig.siteUrl.replace(/\/$/, '');
  const businessUrl = siteUrl + '/business/' + business.slug;
  const streetAddress = business.address_en?.trim();
  const telephone = business.phone_primary?.trim();
  const description = business.description_en?.trim();
  const image = business.cover_url || business.logo_url || undefined;
  const breadcrumbItems: Array<Record<string, unknown>> = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl + '/' },
  ];
  if (business.category?.slug && business.category.name_en) {
    breadcrumbItems.push({
      '@type': 'ListItem',
      position: 2,
      name: business.category.name_en,
      item: siteUrl + '/category/' + business.category.slug,
    });
  }
  breadcrumbItems.push({
    '@type': 'ListItem',
    position: breadcrumbItems.length + 1,
    name: business.name_en,
    item: businessUrl,
  });

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': businessUrl + '#localbusiness',
        name: business.name_en,
        ...(business.name_ur ? { alternateName: business.name_ur } : {}),
        ...(description ? { description } : {}),
        ...(telephone ? { telephone } : {}),
        url: businessUrl,
        ...(image ? { image } : {}),
        address: {
          '@type': 'PostalAddress',
          ...(streetAddress ? { streetAddress } : {}),
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
        ...(typeof business.rating_avg === 'number' && business.rating_count > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: business.rating_avg,
                reviewCount: business.rating_count,
              },
            }
          : {}),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbItems,
      },
    ],
  };
}


/** Keep empty or failed listing pages out of search results until content exists. */
export function updatePageRobots(indexable: boolean): void {
  let robots = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
  if (!robots) {
    robots = document.createElement('meta');
    robots.name = 'robots';
    document.head.appendChild(robots);
  }
  robots.content = indexable ? 'index,follow,max-image-preview:large' : 'noindex,follow';
}
