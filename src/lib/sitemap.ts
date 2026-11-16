export interface SitemapEntry {
  path: string;
  lastModified?: string | null;
}

const DEFAULT_SITE_ORIGIN = 'https://hellosadiqabad.com';

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function normalizeLastModified(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toISOString().slice(0, 10);
}

/** Builds a sitemap from already-filtered, public, canonical routes. */
export function buildSitemapXml(
  entries: readonly SitemapEntry[],
  siteOrigin = DEFAULT_SITE_ORIGIN
): string {
  const origin = new URL(siteOrigin).origin;
  const urls = new Map<string, string | null>();

  for (const entry of entries) {
    if (
      !entry ||
      typeof entry.path !== 'string' ||
      !entry.path.startsWith('/') ||
      entry.path.startsWith('//') ||
      entry.path.includes('?') ||
      entry.path.includes('#')
    ) continue;

    let parsed: URL;
    try {
      parsed = new URL(entry.path, origin);
    } catch {
      continue;
    }
    if (parsed.origin !== origin || parsed.username || parsed.password) continue;

    const location = parsed.origin + parsed.pathname;
    const lastModified = normalizeLastModified(entry.lastModified);
    const existing = urls.get(location);
    if (!urls.has(location) || (!existing && lastModified) || (existing && lastModified && lastModified > existing)) {
      urls.set(location, lastModified);
    }
  }

  const rows = Array.from(urls.entries()).map(([location, lastModified]) => {
    const lastmod = lastModified ? '\n    <lastmod>' + lastModified + '</lastmod>' : '';
    return '  <url>\n    <loc>' + escapeXml(location) + '</loc>' + lastmod + '\n  </url>';
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...rows,
    '</urlset>',
    '',
  ].join('\n');
}
