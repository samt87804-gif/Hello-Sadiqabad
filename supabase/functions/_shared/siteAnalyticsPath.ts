const siteOrigin = "https://hellosadiqabad.com";

/** Accepts only canonical, allowlisted public paths; query strings and private routes are excluded. */
export function classifySiteAnalyticsPath(raw: unknown): { path: string; pageType: string } | null {
  if (typeof raw !== "string" || raw.length < 1 || raw.length > 512 ||
      !raw.startsWith("/") || raw.includes("?") || raw.includes("#") ||
      raw.includes("\\") || raw.includes("\0")) return null;

  let parsed: URL;
  try {
    parsed = new URL(raw, siteOrigin);
  } catch {
    return null;
  }
  if (parsed.origin !== siteOrigin || parsed.pathname !== raw) return null;

  const staticRoutes: Record<string, string> = {
    "/": "home",
    "/search": "search",
    "/categories": "categories",
    "/gov": "static",
    "/offers": "offers",
    "/map": "map",
    "/emergency": "emergency",
    "/government-helplines": "government_helplines",
    "/local-authorities": "local_authorities",
    "/authority-profiles": "authority_profiles",
    "/announcements": "announcements",
    "/news": "news",
    "/about": "static",
    "/advertise": "static",
    "/contact": "static",
    "/terms": "static",
    "/privacy": "static",
    "/listing-terms": "static",
    "/refund-policy": "static",
    "/faq": "static",
  };
  if (staticRoutes[raw]) return { path: raw, pageType: staticRoutes[raw] };

  const dynamic: Array<[RegExp, string]> = [
    [/^\/category\/[a-z0-9]+(?:-[a-z0-9]+)*$/, "category"],
    [/^\/area\/[a-z0-9]+(?:-[a-z0-9]+)*$/, "area"],
    [/^\/business\/[a-z0-9]+(?:-[a-z0-9]+)*$/, "business"],
    [/^\/news\/[a-z0-9]+(?:-[a-z0-9]+)*$/, "news"],
    [/^\/authority-profiles\/[a-z0-9]+(?:-[a-z0-9]+)*$/, "authority_profiles"],
  ];
  const match = dynamic.find(([pattern]) => pattern.test(raw));
  return match ? { path: raw, pageType: match[1] } : null;
}
