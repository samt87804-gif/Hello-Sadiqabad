# Legacy Business QR URL Compatibility — Active Fix Plan

**Status:** Owner-authorized implementation in progress — 28 November 2026  
**Scope:** Preserve existing printed/downloaded Basic and Premium business QR codes when their URLs contain historical business slugs. No business data, plan, QR entitlement, ownership, or security policy changes.

## Verified root cause

- The public directory snapshot under `public/data/businesses/` contains historical business slugs and stable `databaseId` values from its 14 November 2026 snapshot.
- The live published `businesses` rows now have different canonical slugs. A read-only comparison found 93 snapshot records whose `databaseId` still identifies a live row but whose old slug differs from that row's current slug.
- Current `fetchBusinessBySlug()` performs an exact slug match only. The loader intentionally removes database-backed snapshot copies once their live Supabase rows are loaded, so those historical slugs are no longer resolvable in the browser.
- The crawler handler in `functions/business/[slug].js` also performs an exact current-slug lookup, so legacy QR URLs can fail for crawler/preview requests too.

## Approved solution

1. Build a historical-slug-to-current-slug alias map from the sanitized public snapshot, but only when its stable `databaseId` matches a currently published business row.
2. Keep exact current-slug matching first. Resolve a historical slug only through its stable ID and only to the published public business collection.
3. When an old URL resolves, replace the browser URL with the current canonical slug while displaying the same business profile.
4. Keep QR generation and ShareSheet on the current `business.slug`, so newly generated QR codes use the canonical URL.
5. Extend crawler handling to 301-redirect verified historical slugs to the current canonical URL. Never use private data or expose unpublished rows.
6. Add regression tests for alias mapping, collisions, unpublished/deleted listings, canonical-slug precedence and crawler redirects.

## Safeguards

- No database migration, production data mutation, slug rewrite, RLS/grant change, or QR plan entitlement change.
- No alias is accepted by name/phone matching. The historical record must carry a stable database ID that resolves to a currently published row.
- Ambiguous aliases are ignored; exact current canonical slugs always win.
- The existing dynamic sitemap continues to contain only current canonical slugs. Historical URLs redirect; they are not added as duplicate sitemap entries.

## Verification and owner acceptance

- [ ] TypeScript, automated tests and production build pass.
- [ ] GitHub Actions CI passes for the exact commit.
- [ ] Cloudflare Pages deployment succeeds for the exact commit.
- [ ] Production old-slug browser URL redirects to the current canonical profile.
- [ ] Crawler request for an old slug receives a permanent redirect to the current canonical URL.
- [ ] Unknown aliases and aliases for unpublished listings remain unavailable.
- [ ] Owner manually scans an existing QR code and confirms the correct profile opens; then confirms a newly generated QR code opens the same profile.

Owner manual acceptance must remain pending until the Owner confirms the device tests.
