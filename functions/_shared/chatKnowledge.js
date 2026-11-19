const DEFAULT_SITE_URL = 'https://hellosadiqabad.com';

const clip = (value, limit = 1200) =>
  typeof value === 'string' ? value.replace(/\u0000/g, '').slice(0, limit) : value ?? null;

const pageUrl = (base, path) => `${base.replace(/\/+$/, '')}/${String(path || '').replace(/^\/+/, '')}`;


export function resolvePublicDirectoryFilters(query, categories = [], areas = []) {
  const normalize = (value) => String(value || '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  const normalized = normalize(query);
  if (!normalized) return { category: null, area: null };

  const locationMatch = normalized.match(/\b(?:in|near|at|within|around|mein|ma)\s+(.+)$/i);
  const categorySearchText = locationMatch ? normalized.slice(0, locationMatch.index).trim() : normalized;
  const areaSearchText = locationMatch ? locationMatch[1].trim() : normalized;

  const findCategory = (searchText) => categories.find((item) => {
    const terms = [item.name_en, item.name_ur, item.slug, ...(Array.isArray(item.synonyms) ? item.synonyms : [])]
      .filter((value) => typeof value === 'string' && value.trim())
      .map(normalize);
    return terms.some((term) => term && searchText.includes(term));
  });
  const category = findCategory(categorySearchText) || findCategory(normalized);

  const genericAreaTokens = [
    'sadiqabad', 'town', 'road', 'area', 'block', 'colony', 'street',
    'mandi', 'market', 'bazaar', 'chowk', 'mohalla', 'city', 'phase',
    'extension', 'sector', 'near', 'within', 'around', 'school', 'schools', 'academy', 'academies',
    'hospital', 'hospitals', 'clinic', 'clinics', 'medical', 'complex', 'restaurant', 'restaurants',
    'hotel', 'hotels', 'shop', 'shops', 'store', 'stores', 'business', 'businesses', 'college',
    'university', 'mosque', 'masjid', 'bank', 'office', 'offices', 'mall', 'plaza', 'center', 'centre',
    'park', 'factory', 'industrial', 'estate', 'railway', 'station', 'stand',
  ];
  const area = areas.find((item) => {
    const rawTerms = [item.name_en, item.name_ur, item.slug?.replace(/[-_]+/g, ' ')];
    return rawTerms.some((value) => {
      const term = normalize(value);
      if (!term) return false;
      if (areaSearchText.includes(term)) return true;
      if (!locationMatch) return false;
      const meaningfulTokens = term.split(/\s+/).filter((token) =>
        token.length >= 5 && !genericAreaTokens.includes(token)
      );
      return meaningfulTokens.some((token) => areaSearchText.includes(token));
    });
  });

  return { category: category?.slug || null, area: area?.slug || null };
}

export function resolveBusinessSearchIntent(query, categories = [], areas = []) {
  const text = String(query || '').trim().slice(0, 240);
  const filters = resolvePublicDirectoryFilters(text, categories, areas);
  const connector = /\b(?:in|near|at|within|around)\s+/i.exec(text);
  const categoryPhrase = connector ? text.slice(0, connector.index) : text;
  const categoryRecord = categories.find((item) => item.slug === filters.category);
  const categoryTerms = categoryRecord
    ? [categoryRecord.name_en, categoryRecord.name_ur, categoryRecord.slug, ...(Array.isArray(categoryRecord.synonyms) ? categoryRecord.synonyms : [])]
      .filter((value) => typeof value === 'string' && value.trim())
      .map(normalizeKnowledgeText)
    : [];
  const browseWords = new Set(['all', 'every', 'list', 'show', 'me', 'find', 'directory', 'business', 'businesses', 'shop', 'shops', 'store', 'stores', 'category', 'categories', 'type', 'types', 'best', 'top', 'the', 'of', 'please', 'mujhe', 'dikhao', 'batao']);
  const categoryPhraseTokens = normalizeKnowledgeText(categoryPhrase).split(/\s+/).filter(Boolean);
  const cleanedCategoryPhrase = categoryPhraseTokens.filter((token) => !browseWords.has(token)).join(' ');
  const categoryIntent = Boolean(filters.category && categoryTerms.some((term) => term && cleanedCategoryPhrase === term));
  const directoryWords = /\b(?:all|every|list|show|directory|businesses|business|shops|stores)\b/i.test(text);
  const areaDirectoryIntent = Boolean(filters.area && directoryWords);
  const category = categoryIntent ? filters.category : null;

  let searchQuery = null;
  if (!categoryIntent && !areaDirectoryIntent) {
    const categoryTokens = new Set(categoryTerms.flatMap((term) => term.split(/\s+/)).filter(Boolean));
    const stopWords = new Set([
      ...browseWords, 'in', 'near', 'at', 'within', 'around', 'sadiqabad', 'phone', 'number', 'address',
      'pata', 'timing', 'hours', 'opening', 'open', 'close', 'contact', 'website', 'map', 'location',
      'price', 'prices', 'qeemat', 'keemat', 'daam', 'ka', 'ki', 'ke', 'aur', 'and', 'what', 'is',
      'its', 'their', 'my', 'his', 'her', 'for', 'about', 'tell', 'get', 'give', 'please',
    ]);
    const tokens = text.match(/[\p{L}\p{N}-]+/gu) || [];
    searchQuery = tokens.find((token) => {
      const normalized = normalizeKnowledgeText(token);
      return normalized.length >= 3 && !stopWords.has(normalized) && !categoryTokens.has(normalized);
    }) || null;
    if (!searchQuery && !filters.area) searchQuery = text.slice(0, 120);
  }

  return { category, area: filters.area, query: searchQuery };
}

export function mapPublicBusinessSearchResult(row, siteUrl = DEFAULT_SITE_URL, query = '') {
  const base = siteUrl.replace(/\/+$/, '');
  const expiry = row.plan_expires_at ? new Date(row.plan_expires_at).getTime() : null;
  const effectivePlan = expiry && expiry < Date.now() ? 'free' : row.plan_code;
  const hasPaidFeatures = effectivePlan === 'basic' || effectivePlan === 'premium';
  const queryText = String(query || '').toLocaleLowerCase();
  const wantsSocial = /social|facebook|instagram|youtube|tiktok|سوشل|فیس بک|انسٹاگرام/.test(queryText);
  const wantsPhotos = /photo|photos|image|images|gallery|picture|tasveer|tasveerein|تصویر|تصاویر|فوٹو/.test(queryText);
  const wantsVideos = /video|videos|youtube|ویڈیو/.test(queryText);
  const wantsReviews = /review|reviews|rating|ratings|feedback|ریویو|درجہ بندی/.test(queryText);
  const wantsHours = /hour|hours|timing|timings|open|opening|close|closing|time|schedule|khula|khulay|waqt|اوقات|ٹائمنگ/.test(queryText);
  const wantsDirections = /map|direction|directions|address|location|where|kahan|kidhar|raasta|route|نقشہ|پتہ|کہاں/.test(queryText);
  const wantsOffers = /offer|offers|discount|sale|deal|promotion|آفر|ڈسکاؤنٹ/.test(queryText);
  const hasCoordinates = row.lat != null && row.lng != null && Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng));
  const lat = hasCoordinates ? Number(row.lat) : null;
  const lng = hasCoordinates ? Number(row.lng) : null;

  return {
    name: row.name_en,
    name_ur: row.name_ur,
    slug: row.slug,
    url: pageUrl(base, `business/${encodeURIComponent(row.slug)}`),
    category: row.category?.name_en || null,
    category_ur: row.category?.name_ur || null,
    category_url: row.category?.slug ? pageUrl(base, `category/${encodeURIComponent(row.category.slug)}`) : null,
    area: row.area?.name_en || null,
    area_ur: row.area?.name_ur || null,
    area_url: row.area?.slug ? pageUrl(base, `area/${encodeURIComponent(row.area.slug)}`) : null,
    address: clip(row.address_en, 250),
    address_ur: clip(row.address_ur, 250),
    landmark: clip(row.landmark_en, 180),
    landmark_ur: clip(row.landmark_ur, 180),
    latitude: wantsDirections ? lat : null,
    longitude: wantsDirections ? lng : null,
    directions_url: wantsDirections && hasCoordinates ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}` : null,
    phone: row.phone_primary,
    alternate_phone: row.phone_secondary,
    whatsapp: hasPaidFeatures ? row.whatsapp : null,
    website: row.website_url,
    social_links: hasPaidFeatures && wantsSocial ? {
      facebook: row.facebook_url,
      instagram: row.instagram_url,
      youtube: row.youtube_url,
      tiktok: row.tiktok_url,
    } : null,
    logo_url: wantsPhotos ? row.logo_url : null,
    cover_url: wantsPhotos ? row.cover_url : null,
    gallery_urls: hasPaidFeatures && wantsPhotos && Array.isArray(row.gallery_urls) ? row.gallery_urls.slice(0, 4) : [],
    video_urls: hasPaidFeatures && wantsVideos && Array.isArray(row.video_urls) ? row.video_urls.slice(0, 3) : [],
    description: clip(row.description_en, 350),
    description_ur: clip(row.description_ur, 350),
    services: Array.isArray(row.services_en) ? row.services_en.slice(0, 6) : [],
    services_ur: Array.isArray(row.services_ur) ? row.services_ur.slice(0, 6) : [],
    opening_hours: wantsHours ? row.opening_hours : null,
    open_24_hours: row.is_open_24h,
    home_delivery: row.home_delivery,
    established_year: row.established_year,
    verified: row.is_verified,
    rating: row.rating_avg,
    rating_count: row.rating_count,
    active_offers: wantsOffers && Array.isArray(row.active_offers) ? row.active_offers.slice(0, 2).map((offer) => ({
      title: offer.title,
      description: clip(offer.description, 240),
      valid_from: offer.valid_from,
      valid_to: offer.valid_to,
    })) : [],
    approved_reviews: wantsReviews && Array.isArray(row.approved_reviews) ? row.approved_reviews.slice(0, 2).map((review) => ({
      author: review.author_name,
      rating: review.rating,
      comment: clip(review.comment, 350),
      created_at: review.created_at,
    })) : [],
  };
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
    public_owner_profiles: (rows.owner_public_profile_directory || []).map((item) => ({
      display_name: item.display_name,
      photo_url: item.photo_url,
      phone: item.phone,
      email: item.email,
    })).filter((item) => item.display_name || item.photo_url || item.phone || item.email),
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

const normalizeKnowledgeText = (value) => String(value || '')
  .normalize('NFKC')
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

function relevanceScore(item, query, fields) {
  const haystack = normalizeKnowledgeText(fields.map((field) => item?.[field]).filter(Boolean).join(' '));
  const terms = normalizeKnowledgeText(query).split(/\s+/).filter((term) => term.length > 2);
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function isContextualFollowUp(query) {
  const normalized = normalizeKnowledgeText(query);
  if (!normalized || normalized.length > 120) return false;
  return /^(?:aur|also|and|iska|iski|iske|uska|uski|uske|is ka|is ki|is ke|us ka|us ki|us ke|yeh|ye|woh|wo|in ka|in ki|in ke|unka|unki|inke|phone|number|address|pata|timing|hours|opening|location|map|link|details|contact|website|price|qeemat|keemat|daam|more|tell me more|more details|what about|how about|where is it|what is its|what are its|their|its|it|that|these|those)\b/i.test(normalized);
}

export function resolveChatKnowledgeQuery(messages = []) {
  const userMessages = (Array.isArray(messages) ? messages : [])
    .filter((message) => message?.role === 'user' && typeof message.content === 'string' && message.content.trim())
    .map((message) => message.content.trim());
  const current = userMessages[userMessages.length - 1] || '';
  if (!current || !isContextualFollowUp(current) || userMessages.length < 2) return current.slice(0, 120);

  let anchorIndex = userMessages.length - 2;
  while (anchorIndex > 0 && isContextualFollowUp(userMessages[anchorIndex])) anchorIndex -= 1;
  const anchor = userMessages[anchorIndex] || '';
  return `${anchor} ${current}`.slice(0, 240);
}

export function selectRelevantPublicKnowledge(context, query) {
  const text = String(query || '');
  const lower = normalizeKnowledgeText(text);
  const filters = resolvePublicDirectoryFilters(text, context.categories || [], context.areas || []);
  const asksAreas = Boolean(filters.area) || /\b(areas?|localit(?:y|ies)|ilaqay|ilakay|ilaka|ilaaqay|neighbou?rhoods?|mohallas?|colon(?:y|ies)|towns?)\b/i.test(lower);
  const asksNews = /\b(news|latest|updates?|announcements?|events?|headlines?|khabar|khabrain|khabrein|taaza|taza|elaan)\b|خبریں|تازہ|اعلان/i.test(text);
  const asksSiteHelp = /\b(website|app|how|kaise|kaisay|kese|use|feature|register|submit|add business|contact|privacy|terms|faq|favorites?|offline|map|search|account)\b/i.test(lower);
  const asksCivic = /\b(government|authority|official|commissioner|deputy|police|municipal|council|helpline|emergency|rescue|ambulance|sarkari|hakoomat|hakumat)\b|سرکاری|حکومت|پولیس|ریسکیو|ایمرجنسی|ہیلپ لائن/i.test(text);
  const asksOwner = /\b(owner|owners|business owner|public profile|malik|maalik)\b|مالک|مالکان/i.test(text);
  const asksProducts = /\b(product|products|service|services|price|prices|qeemat|keemat|daam|offer|offers|discount|sale)\b|قیمت|دام|آفر|ڈسکاؤنٹ/i.test(text);

  const areaRanked = [...(context.areas || [])].sort((a, b) =>
    relevanceScore(b, text, ['name', 'name_ur', 'slug']) - relevanceScore(a, text, ['name', 'name_ur', 'slug'])
  );
  let areas;
  if (filters.area) {
    const exact = (context.areas || []).filter((item) => item.slug === filters.area);
    const related = areaRanked.filter((item) => item.slug !== filters.area).slice(0, 8);
    areas = [...exact, ...related];
  } else if (asksAreas) {
    areas = (context.areas || []).map(({ name, slug, url }) => ({ name, slug, url }));
  } else {
    areas = areaRanked.slice(0, 8);
  }

  const pageRanked = [...(context.website_pages || [])].sort((a, b) =>
    relevanceScore(b, text, ['title', 'title_ur', 'slug', 'content', 'content_ur']) -
    relevanceScore(a, text, ['title', 'title_ur', 'slug', 'content', 'content_ur'])
  );
  const relevantPages = pageRanked.filter((item) =>
    relevanceScore(item, text, ['title', 'title_ur', 'slug', 'content', 'content_ur']) > 0
  ).slice(0, 3);
  const pages = asksSiteHelp
    ? (relevantPages.length ? relevantPages : pageRanked.slice(0, 2)).map((item) => ({
      ...item,
      content: clip(item.content, 1600),
      content_ur: clip(item.content_ur, 1600),
    }))
    : (context.website_pages || []).map(({ title, title_ur, slug, url }) => ({ title, title_ur, slug, url }));

  const news = (context.news || []).map((item) => asksNews ? ({
    ...item,
    content: clip(item.content, 2600),
    content_ur: clip(item.content_ur, 2600),
  }) : ({
    title: item.title,
    title_ur: item.title_ur,
    excerpt: clip(item.excerpt, 260),
    excerpt_ur: clip(item.excerpt_ur, 260),
    slug: item.slug,
    published_at: item.published_at,
    url: item.url,
  }));

  const localAuthorities = asksCivic
    ? context.local_authorities
    : (context.local_authorities || []).map((item) => ({
      name: item.name,
      name_ur: item.name_ur,
      type: item.type,
      directory_url: item.directory_url,
    }));
  const authorityProfiles = asksCivic
    ? context.authority_profiles
    : (context.authority_profiles || []).map((item) => ({
      name: item.name,
      name_ur: item.name_ur,
      designation: item.designation,
      designation_ur: item.designation_ur,
      url: item.url,
    }));
  const publicOwnerProfiles = asksOwner ? context.public_owner_profiles : [];
  const products = asksProducts ? context.products : (context.products || []).map((item) => ({
    name: item.name,
    name_ur: item.name_ur,
    business: item.business,
  }));
  const offers = asksProducts ? context.offers : (context.offers || []).map((item) => ({
    title: item.title,
    business: item.business,
  }));
  const announcements = asksNews ? context.announcements : (context.announcements || []).map((item) => ({
    title: item.title,
    title_ur: item.title_ur,
    start_date: item.start_date,
    end_date: item.end_date,
    directory_url: item.directory_url,
  }));

  return {
    categories: context.categories || [],
    areas,
    areas_total_count: (context.areas || []).length,
    government_helplines: context.government_helplines || [],
    local_authorities: localAuthorities || [],
    authority_profiles: authorityProfiles || [],
    public_owner_profiles: publicOwnerProfiles || [],
    news,
    website_pages: pages,
    products: products || [],
    offers: offers || [],
    announcements: announcements || [],
    public_site_information: context.public_site_information || [],
    source_status: context.source_status || {},
    knowledge_totals: {
      categories: (context.categories || []).length,
      areas: (context.areas || []).length,
      published_news: (context.news || []).length,
      published_pages: (context.website_pages || []).length,
      active_helplines: (context.government_helplines || []).length,
      active_local_authorities: (context.local_authorities || []).length,
      active_authority_profiles: (context.authority_profiles || []).length,
      visible_owner_profiles: (context.public_owner_profiles || []).length,
      active_products: (context.products || []).length,
      current_offers: (context.offers || []).length,
      current_announcements: (context.announcements || []).length,
    },
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
