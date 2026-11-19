const DEFAULT_SITE_URL = 'https://hellosadiqabad.com';

const clip = (value, limit = 1200) =>
  typeof value === 'string' ? value.replace(/\u0000/g, '').slice(0, limit) : value ?? null;

const pageUrl = (base, path) => `${base.replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;


export function resolvePublicDirectoryFilters(query, categories = [], areas = []) {
  const normalize = (value) => String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\\p{L}\\p{N}]+/gu, ' ')
    .trim();
  const normalized = normalize(query);
  if (!normalized) return { category: null, area: null };

  const category = categories.find((item) => {
    const rawTerms = [item.name_en, item.name_ur, item.slug, ...(Array.isArray(item.synonyms) ? item.synonyms : [])];
    return rawTerms.some((value) => {
      const term = normalize(value);
      return term && normalized.includes(term);
    });
  });

  const area = areas.find((item) => {
    const rawTerms = [item.name_en, item.name_ur, item.slug?.replace(/[-_]+/g, ' ')];
    return rawTerms.some((value) => {
      const term = normalize(value);
      if (!term) return false;
      if (normalized.includes(term)) return true;
      const meaningfulTokens = term.split(/\\s+/).filter((token) =>
        token.length >= 5 && !['sadiqabad', 'town', 'road', 'area', 'block', 'colony', 'street'].includes(token)
      );
      return meaningfulTokens.some((token) => normalized.includes(token));
    });
  });

  return { category: category?.slug || null, area: area?.slug || null };
}

export function buildPublicKnowledgeContext(rows, siteUrl = DEFAULT_SITE_URL) {
  const base = siteUrl.replace(/\/+$/, '');
  const categoriesById = new Map((rows.categories || []).map((item) => [item.id, item]));
  const areasById = new Map((rows.areas || []).map((item) => [item.id, item]));

  return {
    categories: (rows.categories || []).map((item) => ({
      name: item.name_en,
      name_ur: item.name_ur,
      slug: item.slug,
      url: pageUrl(base, `category/${encodeURIComponent(item.slug)}`),
      parent: categoriesById.get(item.parent_id)?.name_en || null,
      synonyms: Array.isArray(item.synonyms) ? item.synonyms.slice(0, 20) : [],
    })),
    areas: (rows.areas || []).map((item) => ({
      name: item.name_en,
      name_ur: item.name_ur,
      slug: item.slug,
      url: pageUrl(base, `area/${encodeURIComponent(item.slug)}`),
    })),
    government_helplines: (rows.emergency_contacts || []).map((item) => ({
      name: item.name_en,
      name_ur: item.name_ur,
      phone: item.phone,
      category: item.category,
      description: clip(item.description_en, 500),
      description_ur: clip(item.description_ur, 500),
      source_url: item.source_url,
      verified_at: item.verified_at,
      directory_url: pageUrl(base, 'emergency'),
    })),
    local_authorities: (rows.local_authorities || []).map((item) => ({
      name: item.name_en,
      name_ur: item.name_ur,
      type: item.authority_type,
      description: clip(item.description_en, 900),
      description_ur: clip(item.description_ur, 900),
      phone: item.phone,
      phone_secondary: item.phone_secondary,
      email: item.email,
      address: clip(item.address_en, 250),
      address_ur: clip(item.address_ur, 250),
      website: item.website_url,
      map: item.map_url,
      office_hours: item.office_hours_en,
      office_hours_ur: item.office_hours_ur,
      source_url: item.source_url,
      verified_at: item.verified_at,
      directory_url: pageUrl(base, 'local-authorities'),
    })),
    authority_profiles: (rows.authority_profiles || []).map((item) => ({
      name: item.name_en,
      name_ur: item.name_ur,
      slug: item.slug,
      url: pageUrl(base, `authority-profiles/${encodeURIComponent(item.slug)}`),
      designation: item.designation_en,
      designation_ur: item.designation_ur,
      organization: item.show_organization ? item.organization_en : null,
      organization_ur: item.show_organization ? item.organization_ur : null,
      status: item.show_status ? item.status_label_en : null,
      status_ur: item.show_status ? item.status_label_ur : null,
      authority: item.show_authority ? clip(item.authority_en, 1200) : null,
      authority_ur: item.show_authority ? clip(item.authority_ur, 1200) : null,
      biography: item.show_bio ? clip(item.bio_en, 1800) : null,
      biography_ur: item.show_bio ? clip(item.bio_ur, 1800) : null,
      phone: item.show_contact ? item.phone : null,
      email: item.show_contact ? item.email : null,
      website: item.show_contact ? item.website_url : null,
      facebook: item.show_contact ? item.facebook_url : null,
      instagram: item.show_contact ? item.instagram_url : null,
      source_url: item.source_url,
      verified_at: item.verified_at,
    })),
    news: (rows.news_articles || []).map((item) => ({
      title: item.title_en,
      title_ur: item.title_ur,
      excerpt: clip(item.excerpt_en, 900),
      excerpt_ur: clip(item.excerpt_ur, 900),
      content: clip(item.content_en, 6000),
      content_ur: clip(item.content_ur, 6000),
      slug: item.slug,
      published_at: item.published_at,
      url: pageUrl(base, `news/${encodeURIComponent(item.slug)}`),
    })),
    website_pages: (rows.pages || []).map((item) => ({
      title: item.title_en,
      title_ur: item.title_ur,
      slug: item.slug,
      content: clip(item.body_md_en, 3500),
      content_ur: clip(item.body_md_ur, 3500),
      url: pageUrl(base, encodeURI(item.slug)),
    })),
    products: (rows.business_products || []).map((item) => ({
      name: item.name_en,
      name_ur: item.name_ur,
      description: clip(item.description_en, 500),
      description_ur: clip(item.description_ur, 500),
      price: item.price,
      business: item.business ? {
        name: item.business.name_en,
        name_ur: item.business.name_ur,
        url: pageUrl(base, `business/${encodeURIComponent(item.business.slug)}`),
      } : null,
    })).filter((item) => item.business),
    offers: (rows.offers || []).map((item) => ({
      title: item.title,
      description: clip(item.description, 500),
      valid_from: item.valid_from,
      valid_to: item.valid_to,
      business: item.business ? {
        name: item.business.name_en,
        name_ur: item.business.name_ur,
        url: pageUrl(base, `business/${encodeURIComponent(item.business.slug)}`),
      } : null,
    })).filter((item) => item.business),
    announcements: (rows.announcements || []).map((item) => ({
      title: item.title_en,
      title_ur: item.title_ur,
      body: clip(item.body_en, 900),
      body_ur: clip(item.body_ur, 900),
      start_date: item.start_date,
      end_date: item.end_date,
      link_url: item.link_url,
      directory_url: pageUrl(base, 'announcements'),
    })),
    public_site_information: (rows.site_settings || []).map((item) => ({
      key: item.key,
      description: item.description,
      value: item.value,
    })),
    source_status: rows.source_status || {},
  };
}

export const PUBLIC_SITE_SETTING_KEYS = [
  'site_name',
  'contact_email',
  'contact_phone',
  'contact_whatsapp',
  'default_language',
  'social_links',
];
