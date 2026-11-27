# Legacy Business QR URL Compatibility — Active Fix Plan

**Status:** Existing snapshot-alias fix deployed; explicit THE INSPIRE BUSINESS ACADEMY legacy URL compatibility implemented in this change; new manual acceptance pending — 28 November 2026  
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

- [x] TypeScript, automated tests and production build passed.
- [x] GitHub Actions CI run `46063096322` passed for commit `c3de360440e6f29c3e826f0f384fece6d120170a`.
- [x] Cloudflare Pages production deployment `4acf9c22-299f-4c23-9b19-ae86b8067863` succeeded for the same commit.
- [x] Live Browser Rendering confirmed the old browser URL renders the correct business profile and current canonical metadata.
- [x] Googlebot request for an old slug received a 301 redirect and followed to the current canonical URL.
- [x] Regression tests cover unknown/ambiguous aliases and unpublished rows; these do not expose listings.
- [ ] Owner manually scans an existing QR code and confirms the correct profile opens; then confirms a newly generated QR code opens the same profile.

Owner manual acceptance must remain pending until the Owner confirms the device tests.


## Verified release details

- GitHub main commit: `c3de360440e6f29c3e826f0f384fece6d120170a`.
- GitHub Actions CI run: `46063096322` — passed TypeScript, automated tests, production build and Edge Function typecheck.
- Cloudflare Pages production deployment: `4acf9c22-299f-4c23-9b19-ae86b8067863` — all stages succeeded for the exact commit.
- Live old-slug browser check: correct business page rendered with the current canonical URL and business-specific metadata.
- Live crawler check: Googlebot old-slug request returned through a 301 to the current canonical slug; final URL and metadata were verified.
- Manual phone/QR acceptance remains pending with the Owner.


## Additional verified legacy URL — THE INSPIRE BUSINESS ACADEMY (28 November 2026)

- Owner supplied the exact broken Google URL: `/business/the-inspire-business-academy-sadiqabad-4x0`.
- Read-only live Supabase lookup confirmed the unique published business ID `0d14d4af-6434-4b3c-aec3-3de0bb669a51` and canonical slug `the-inspire-business-academy-sadiqabad-1h0`.
- The historical URL was not present in the active crawl-only snapshot, so the snapshot-only resolver could not map it.
- Added a narrowly scoped explicit alias keyed by the old slug and stable business ID. Browser resolution and crawler 301 redirect both require the matching business to remain currently published; no name/phone matching, DB mutation, slug rewrite, RLS change or new sitemap entry is used.
- Regression tests cover redirect to the canonical URL and 404 behavior if the business is unpublished.
- [x] Production Googlebot Browser Rendering confirmed an HTTP 301 from the supplied `-4x0` URL to canonical `-1h0`; after redirect, the page rendered the academy H1, business-specific title, indexable robots metadata and LocalBusiness JSON-LD.
- [ ] Owner manually opens the supplied old URL in a normal browser/phone and confirms the profile loads and the address bar changes to the canonical `-1h0` URL.


## Additional verified legacy URL — Bakhtawar Memorial Hospital (28 November 2026)

- Owner explicitly approved the 301 behavior change for the old URL `/business/bakhtawar-memorial-hospital-hkl`.
- Read-only live Supabase lookup confirmed the unique published business ID `b880b4ec-8196-4c96-81a0-ddd9f61efd9d`, current slug `bakhtawar-memorial-hospital-gn7`, and status `published`.
- Added the exact historical slug + stable business ID to the verified alias registry. Existing browser and crawler resolution paths now resolve it only when the matching live row remains published; crawler requests are designed to 301 to the current canonical slug.
- Added regression coverage for the exact Bakhtawar alias and for the alias not resolving when no published row is present.
- No business data, slug, sitemap, schema, RLS, ownership, plan entitlement or database records were changed.
- [ ] GitHub Actions CI status for the alias/test commits could not be retrieved through the connected GitHub checks interface; Cloudflare Pages build/deploy passed separately.
- [x] Production Googlebot Browser Rendering verified the old URL returns HTTP 301 with Location `/business/bakhtawar-memorial-hospital-gn7`; final URL returns HTTP 200 with the correct hospital title, canonical URL, indexable robots metadata and LocalBusiness JSON-LD.
- [x] Owner manually opened the old URL in a normal browser/phone and confirmed the profile loads and address bar changes to the canonical `-gn7` URL (owner confirmation: 28 November 2026).

### Bakhtawar release verification

- Alias commit: `1af5ecfd10508cf0a3912f853aab1a0e031239c3`.
- Regression-test commit: `c84f3e248ee1f652cd4934c236882846ab8f881c`.
- Documentation checkpoint: `da60de46e4b3eeda63ef432d26097f0988f6d6d3`.
- Cloudflare Pages deployments succeeded for the alias commit (`4d841d15-bbcc-48fa-b2bb-117dfb5ade7f`), test commit (`98905f55-7023-4fa7-9f10-3d1177e1129e`) and latest documentation commit (`09b0ed21-4697-46a2-82c9-cfba649afd78`). The latest deployment is aliased to `https://hellosadiqabad.com`.
- Production Googlebot rendering confirms the 301 and canonical destination. No Google indexing/ranking result is claimed.
- GitHub CI remains unverified because the connected GitHub status endpoint returned no check/status entries; this is not represented as a pass.
