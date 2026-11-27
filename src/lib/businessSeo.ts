const SITE_ORIGIN = 'https://hellosadiqabad.com';
const FALLBACK_IMAGE = SITE_ORIGIN + '/site-logo.png';

export interface BusinessSeoRecord {
  name_en?: string | null;
  name_ur?: string | null;
  slug: string;
  description_en?: string | null;
  description_ur?: string | null;
  meta_title_en?: string | null;
  meta_description_en?: string | null;
  logo_url?: string | null;
  cover_url?: string | null;
  address_en?: string | null;
  phone_primary?: string | null;
  category?: { name_en?: string | null } | null;
  area?: { name_en?: string | null } | null;
}

export interface BusinessSeoMetadata {
  title: string;
  description: string;
  canonicalUrl: string;
  image: string;
  imageAlt: string;
}

export function cleanBusinessSeoText(value: string | null | undefined, fallback: string, maxLength = 160): string {
  const plainText = String(value || '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/[*_>#~|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const text = plainText || fallback;
  return text.length > maxLength ? text.slice(0, maxLength - 1).trimEnd() + '…' : text;
}

export function safeBusinessImageUrl(value: string | null | undefined): string | null {
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || !url.hostname || url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function buildBusinessSeoMetadata(
  business: BusinessSeoRecord,
  siteOrigin = SITE_ORIGIN
): BusinessSeoMetadata {
  const name = cleanBusinessSeoText(business.name_en || business.name_ur, 'Sadiqabad Business', 100);
  const category = cleanBusinessSeoText(business.category?.name_en, '', 48);
  const area = cleanBusinessSeoText(business.area?.name_en, '', 48);
  const customTitle = cleanBusinessSeoText(business.meta_title_en, '', 120);
  const descriptor = category
    ? category + (area ? ' in ' + area : '')
    : area ? 'Business in ' + area : 'Sadiqabad';
  const fallbackTitle = name + ' — ' + descriptor + (descriptor === 'Sadiqabad' ? '' : ', Sadiqabad') + ' | Hello Sadiqabad';
  const title = customTitle
    ? (/hello sadiqabad/i.test(customTitle) ? customTitle : customTitle + ' | Hello Sadiqabad')
    : cleanBusinessSeoText(fallbackTitle, name + ' — Sadiqabad | Hello Sadiqabad', 120);
  const sourceDescription = business.description_en || business.description_ur;
  const fallbackDescription = category
    ? 'Find ' + name + ', a ' + category + (area ? ' in ' + area : '') + ', Sadiqabad. View its available contact details and location on Hello Sadiqabad.'
    : name + ', Sadiqabad. View available contact details, location and business information on Hello Sadiqabad.';
  const enrichedShortDescription = sourceDescription && sourceDescription.trim().length < 80 && category
    ? 'Find ' + name + ', a ' + category + (area ? ' in ' + area : '') + ', Sadiqabad. ' + sourceDescription.trim()
    : sourceDescription;
  const description = cleanBusinessSeoText(
    business.meta_description_en || enrichedShortDescription,
    fallbackDescription
  );
  const image = safeBusinessImageUrl(business.cover_url)
    || safeBusinessImageUrl(business.logo_url)
    || FALLBACK_IMAGE;

  return {
    title,
    description,
    canonicalUrl: siteOrigin.replace(/\/$/, '') + '/business/' + business.slug,
    image,
    imageAlt: name,
  };
}

function normalizeBusinessTelephone(value: string | null | undefined): string | null {
  const raw = String(value || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15 || /^0+$/.test(digits)) return null;
  if (digits.startsWith('0092') && digits.length >= 13) return '+' + digits.slice(2);
  if (digits.startsWith('92') && digits.length === 12) return '+' + digits;
  if (digits.startsWith('0') && digits.length === 11) return '+92' + digits.slice(1);
  if (digits.length === 10 && digits.startsWith('3')) return '+92' + digits;
  return raw;
}

export function buildBusinessJsonLd(
  business: BusinessSeoRecord,
  metadata = buildBusinessSeoMetadata(business),
  siteOrigin = SITE_ORIGIN
): Record<string, unknown> {
  const name = cleanBusinessSeoText(business.name_en || business.name_ur, 'Sadiqabad Business', 100);
  const streetAddress = cleanBusinessSeoText(business.address_en, '', 240);
  const telephone = normalizeBusinessTelephone(business.phone_primary);
  const businessNode: Record<string, unknown> = {
    '@type': 'LocalBusiness',
    '@id': metadata.canonicalUrl + '#business',
    name,
    url: metadata.canonicalUrl,
    mainEntityOfPage: metadata.canonicalUrl,
    address: {
      '@type': 'PostalAddress',
      ...(streetAddress ? { streetAddress } : {}),
      addressLocality: 'Sadiqabad',
      addressRegion: 'Punjab',
      addressCountry: 'PK',
    },
  };
  if (business.name_ur) businessNode.alternateName = business.name_ur;
  if (metadata.description) businessNode.description = metadata.description;
  if (metadata.image) businessNode.image = metadata.image;
  if (telephone) businessNode.telephone = telephone;

  return {
    '@context': 'https://schema.org',
    '@graph': [
      businessNode,
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: siteOrigin.replace(/\/$/, '') + '/' },
          { '@type': 'ListItem', position: 2, name, item: metadata.canonicalUrl },
        ],
      },
    ],
  };
}

export function serializeBusinessJsonLd(value: Record<string, unknown>): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}
