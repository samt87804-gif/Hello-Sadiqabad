export function bilingualText(
  lang: 'en' | 'ur',
  enValue: string | null | undefined,
  urValue: string | null | undefined
): string {
  const en = enValue?.trim() ?? '';
  const ur = urValue?.trim() ?? '';
  if (lang === 'ur') {
    return ur || en;
  }
  return en || ur;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function formatDateShort(iso: string | null | undefined, lang: 'en' | 'ur' = 'en'): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
}

export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function extractSafeEmbedUrl(url: string): string | null {
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.hostname.includes('youtube.com') || parsed.hostname === 'youtu.be') {
      let videoId = '';
      if (parsed.hostname === 'youtu.be') {
        videoId = parsed.pathname.slice(1);
      } else {
        videoId = parsed.searchParams.get('v') ?? parsed.pathname.split('/embed/')[1] ?? '';
      }
      videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '');
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()?.replace(/[^0-9]/g, '');
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch {
    return null;
  }
  return null;
}

export function buildGoogleMapsDirectionsUrl(
  lat: number | null | undefined,
  lng: number | null | undefined,
  fallbackQuery: string
): string {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery + ', Sadiqabad, Pakistan')}`;
}

export interface VCardBusinessInput {
  name_en: string;
  phone_primary: string;
  phone_secondary?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  website_url?: string | null;
  address_en?: string | null;
  slug: string;
}

function escapeVCardText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

export function buildBusinessVCard(b: VCardBusinessInput, origin = 'https://hellosadiqabad.com'): string {
  const cleanOrigin = origin.replace(/\/$/, '');
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escapeVCardText(b.name_en)}`,
    `ORG:${escapeVCardText(b.name_en)};Sadiqabad`,
    `TEL;TYPE=WORK,VOICE:${b.phone_primary.trim()}`,
  ];

  if (b.phone_secondary?.trim()) {
    lines.push(`TEL;TYPE=VOICE:${b.phone_secondary.trim()}`);
  }
  if (b.whatsapp?.trim() && b.whatsapp.trim() !== b.phone_primary.trim()) {
    lines.push(`TEL;TYPE=CELL:${b.whatsapp.trim()}`);
  }
  if (b.email?.trim()) {
    lines.push(`EMAIL;TYPE=WORK:${b.email.trim()}`);
  }
  if (b.website_url?.trim()) {
    lines.push(`URL:${b.website_url.trim()}`);
  }
  lines.push(`URL:${cleanOrigin}/business/${b.slug}`);
  if (b.address_en?.trim()) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardText(b.address_en.trim())};Sadiqabad;Punjab;;Pakistan`);
  }
  lines.push('END:VCARD');
  return lines.join('\r\n');
}

