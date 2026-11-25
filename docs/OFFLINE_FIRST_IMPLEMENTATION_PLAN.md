# Hello Sadiqabad — Offline-First PWA Implementation Plan

Status date: 17 November 2026  
Canonical site: https://hellosadiqabad.com  
Repository: samt87804-gif/Hello-Sadiqabad (`main`)  
Hosting: Cloudflare Pages (`hello-sadiqabad`)  
Public data source: Supabase project `efwohfzqitevkuybnyif`, using existing anonymous/public RLS access

## 1. Owner request and target outcome

Make the existing installable Hello Sadiqabad PWA usable after the visitor has downloaded offline data once. The same-origin website and its installed home-screen app must share the same offline-first code path where the browser platform permits.

After a successful download, visitors should be able to open the app without internet and browse/search/filter public business listings, view business details and locally saved public directory content. Server mutations must remain online-only: reviews, inquiries, corrections, claims, business submissions and any other server write must clearly require an internet connection. No false success and no silent offline submission queue.

The existing website, SEO, installation behavior, online directory, authentication, owner/admin workflows and current Supabase data must continue working.

## 2. Current repository audit (verified from main on 17 November 2026)

### Existing PWA and offline pieces

- `public/manifest.webmanifest` already declares Hello Sadiqabad as an installable `standalone` app with the current icons and root start URL.
- `src/main.tsx` registers `/sw.js` in production and emits the existing `hs-sw-update` event when a new worker is installed.
- `src/components/layout/InstallAppButton.tsx` already implements the install prompt and iOS installation guidance. Preserve it.
- `public/sw.js` currently caches only `/offline.html`. Navigations are network-first and fall back to the offline page. It deliberately does not cache hashed JS/CSS assets, Supabase/API requests or Pages Functions, to avoid stale chunk references and to keep writes/network calls out of the cache.
- `src/lib/offlineStorage.ts` currently stores favorites, recently viewed businesses, an emergency-contact snapshot and an anonymous session ID in browser storage. It does not contain a complete public directory snapshot.
- Emergency contacts already have a limited localStorage fallback. This does not mean the full directory is offline-capable.
- The public static directory data has `public/data/businesses/index.json` with 382 snapshot records across four chunks and 236 image URL entries. When Supabase is configured, `src/lib/api.ts` overlays current published database rows and withholds database-backed snapshot rows if publication status cannot be verified. The live database remains authoritative for moderated/published listings.
- `fetchGitHubBusinesses()` currently hydrates published Supabase businesses with public categories, areas, plans, active offers and approved reviews; it also includes crawl-only supplemental records. Category and area fetches query Supabase directly. Other public modules have separate fetch paths.
- The current application is React + TypeScript + Vite, hosted on Cloudflare Pages. Existing CI runs typecheck, automated tests, production build and Deno checks for Edge Functions.

### Important conclusion

The app is installable, but it is not yet a complete offline directory. The existing Service Worker fallback is intentionally conservative. The implementation must add an offline app shell and a deliberate public-data download/cache layer without weakening the current network/API safeguards.

## 3. Scope and data classification

### Public data intended for offline use

- Published businesses and crawl-only public supplemental listings, following the same existing visibility rules.
- Public categories and areas.
- Public business details: bilingual names/descriptions/services, addresses, public phone/contact fields, coordinates, opening hours, public tags, public images and published profile attributes.
- Active public offers and approved reviews that are already visible on public business pages.
- Active emergency/government helplines.
- Active public local authorities and authority profiles.
- Published news, current public announcements, public static pages and public site settings required to render the public experience.
- Public search/filter metadata and the minimum public data required for the homepage and public routes.

Only fields that the current public UI is allowed to show may be stored. Build an explicit allow-list from the existing public types and RLS-backed fetches; do not copy raw table rows or private/internal columns wholesale.

### Never include in an offline package

- Admin Portal or Owner Portal data, staff permissions, auth tokens/sessions, private owner profile fields, unpublished/draft/moderation records, audit logs, inquiries, leads, submissions, internal analytics, private business notes or any non-public database rows.
- Form submissions or pending write payloads.
- Service-role credentials or any secret.

### Network-required actions

Reviews, inquiries, corrections, claims, new business submissions, login/password operations, owner/admin actions, live telemetry, ad click/impression events, and all database writes require internet. Show a clear offline state and do not report success.

### Map limitation

Business coordinates, filters and map/list markers can be available offline. Do not bulk-download OpenStreetMap or other third-party map tiles unless their current provider terms expressly allow offline prefetch and storage. Without permitted cached tiles, show a clear offline basemap limitation while preserving the local business list/markers where practical.

## 4. Implementation phases

### Phase 0 — Safety audit, rules and plan
**Status: completed in this documentation commit; no application behavior changed.**

- [x] Inspect the current PWA manifest, install prompt, Service Worker, offline storage and public business-data flow.
- [x] Identify existing offline emergency cache and the current static/live business-data merge rules.
- [x] Record permanent owner-confirmed engineering rules in `docs/PROJECT_WORKING_RULES.md`.
- [x] Record the complete offline-first scope, phases and release gates in this document.
- [x] Add links/status to project roadmap and new-chat handoff in this documentation update.

### Phase 1 — Safe offline foundation and core directory package
**Status: in progress — IndexedDB storage, download manager, public offline read adapters, offline write guards, build-manifest app-asset precache and browser readiness diagnostics are implemented. Automated/native-browser storage and adapter checks pass; actual airplane-mode reload/deep-link and update/rollback acceptance remain.**

1. Design a versioned IndexedDB schema for public directory snapshots and download metadata. Keep current localStorage favorites/recent-history keys compatible.
2. Add a download manager reachable from the existing public app (a dedicated offline-data screen plus a clear entry point). It must show an honest size estimate/actual bytes, progress, cancellation, success/failure and last successful download.
3. Download data through the existing public, anonymous-RLS-approved read paths. Include the complete current published business set plus crawl-only supplemental records, categories, areas and emergency contacts. Use an explicit public-field allow-list.
4. Write into a staging generation and switch the active generation only after every required dataset has passed validation. An interrupted/failed download must leave the previous verified offline package untouched.
5. [x] Public business search, filters, business details, categories, areas, homepage directory sections, favorites/recent lookups and emergency contacts now select the verified IndexedDB snapshot when the browser reports offline. Preserve the existing online Supabase source-of-truth path. Public read adapters restore only explicitly stored public fields.
6. Runtime caching is implemented in `public/sw.js`: cache the SPA entry document and existing emergency fallback during install; use network-first navigation with the cached SPA shell as fallback for app routes; build emits `offline-precache.json` from actual fingerprinted Vite JS/CSS assets, and the worker pre-caches those assets in batches of four during install. Production Browser Rendering verified an active worker, cached app shell/emergency fallback and 75/75 assets. The Service Worker does not call `skipWaiting()` or `clients.claim()` and does not delete older caches. It deliberately reuses the existing `hs-sadiqabad-shell-v3` cache key because the currently deployed v3 worker deletes every other cache on activation; this preserves compatibility if the old worker is served again during rollback. Actual airplane-mode navigation, update waiting, stale chunks and rollback across open tabs still require acceptance testing.
7. [x] Public review, inquiry and suggestion API submissions fail with an explicit not-sent message while offline. Search/business/ad telemetry is skipped. No form payloads are saved or queued. Extend this explicit guard to any newly added public write path before release.
8. Tests now cover snapshot validation, malformed nested public rows/private fields, offer ownership, IndexedDB storage activation, simulated quota-abort preservation, concurrent saves, public offline read adapters and public write/telemetry guards. The /offline-data readiness check also runs native browser IndexedDB write/read, abort rollback and concurrent transaction probes. A production Browser Rendering run passed those probes and exercised the full public download plus offline read adapters. Real device quota exhaustion and airplane-mode navigation remain unverified.

**Acceptance gate:** clean CI (typecheck, tests, production build and existing Deno checks); online smoke checks for homepage/search/business profile/category/area/emergency; offline reload and search using a verified snapshot; offline write attempts show a clear connection-required message and create no local pending submission; existing install/update behavior remains intact. No production rollout if stale chunks, missing core routes, data leakage or online regressions are observed.

### Phase 2 — Complete public-content coverage and media
**Status: implementation deployed on 24 November 2026; actual airplane-mode route/media acceptance remains pending.**

- [x] Snapshot and offline read fallbacks for published news/articles, announcements, active local authorities and authority profiles, public static pages, published government jobs/schemes, active ads, public business products, public site settings and opted-in public owner profiles.
- [x] Save public directory image maps and collect media URLs from business logos/covers/galleries/offers, products, news cover/gallery/body, authority/owner photos, job posters, page Markdown, active ads, hero banner and static image assets.
- [x] Extend offline-precache.json to include Vite-emitted images and all static images under public/; use bounded concurrency for public media caching.
- [x] Keep media allow-listed to same-origin assets, the existing public Supabase Storage bucket and the existing Google image proxy. Unsupported or unavailable images are counted and reported but do not block activation of an otherwise valid public-data package. Core snapshot validation, fetch or save failures still preserve the previous verified package.
- [x] Preserve public ads and approved reviews/offers where they already appear in public business data; offline tracking remains disabled.
- [ ] Verify newly included routes and images after a real airplane-mode reload. Third-party map tiles, external video streams and live embeds are not bulk-downloaded.

**Acceptance gate:** public routes use the saved data offline, supported public images are cached, and no private/draft data enters IndexedDB or Cache Storage.

### Phase 3 — New-data notifications, background downloads and storage resilience
**Status: requested update notice and route-persistent download features implemented and deployed; remaining storage management and browser acceptance are pending.**

- [x] Fingerprint public Supabase datasets and static crawler business chunks to detect published/changed public content.
- [x] Check on public pages, on reconnect and every five minutes while the site remains open.
- [x] Show a homepage notification linking to /offline-data when a newer offline package is available.
- [x] Keep the download controller/progress state at app-module scope so in-app route navigation does not abort an active download.
- [x] Show progress and a cancel action across public pages while the download continues.
- [ ] Add incremental sync only where reliable change markers exist; otherwise keep validated full-snapshot replacement.
- [ ] Improve low-storage/quota handling and add safe user-initiated offline-package removal without touching unrelated browser data.
- [ ] Test cancellation, interrupted downloads, browser eviction, low quota, retry and reload/close behavior.

**Acceptance gate:** a new public-content version triggers a homepage notice; in-app navigation does not cancel the download; only a fully validated data-and-image package replaces the previous snapshot.

### Phase 4 — Device verification and controlled release
**Status: not started; depends on Phases 1–3.**

- Verify Android Chrome browser and installed PWA, iOS Safari and Home Screen web app, desktop Chrome/Edge, and at least one constrained-storage scenario.
- Test fresh install, download, force-close/reopen offline, direct deep-link route, refresh offline, search/filter, business detail, call link, favorites, data update, cancel, delete, reinstall and recovery.
- Confirm the installed app does not require opening Chrome manually after installation.
- Verify online forms and portals behave exactly as before when connected.
- Check SEO/canonical/robots/sitemap behavior remains unchanged and public routes remain crawlable online.
- Record device/browser/version and evidence. Distinguish automated CI checks from actual device/airplane-mode tests.

**Release rule:** roll out the full offline feature only after the applicable acceptance gates pass. If a test is unavailable, document it as unverified rather than claiming full offline support.

## 5. Non-negotiable safety and compatibility rules

- Follow `docs/PROJECT_WORKING_RULES.md` and the existing owner-confirmed direct-main workflow.
- Keep online behavior as the default and preserve Supabase as the authoritative database.
- Do not make database schema changes or add Cloudflare Workers/R2 infrastructure unless implementation evidence proves they are required and the owner approves the scope.
- Do not cache Supabase/API POST requests, auth endpoints, private routes or portal data.
- Do not force reload open clients during deployment or Service Worker activation.
- Do not replace the active offline snapshot until the new package has fully downloaded and validated.
- Keep emergency call links and the current offline emergency fallback available even if the full offline package is absent.
- Do not change canonical URLs, page metadata, robots, sitemap, public route paths or SEO behavior as part of offline work.
- Do not claim that all photos, all browsers or airplane-mode behavior are verified until tested on those environments.

## 6. Progress log

### 17 November 2026 — Phase 0 audit

- Inspected `public/sw.js`, `public/offline.html`, `public/manifest.webmanifest`, `src/main.tsx`, `src/lib/offlineStorage.ts`, `src/lib/api.ts`, `src/components/layout/InstallAppButton.tsx`, and representative public pages.
- Confirmed the current Service Worker caches only the offline fallback page; the React app shell and hashed JS/CSS are not cached.
- Confirmed favorites/recent history/emergency contacts already use local browser storage, but no complete business/category/area offline snapshot exists.
- Confirmed public businesses are sourced from static JSON chunks plus current published Supabase rows; live public rows replace snapshot copies and are subject to existing anonymous RLS visibility.
- No application code, Supabase schema/data, Cloudflare settings, public records or user data changed during Phase 0.
- GitHub Actions CI run `44108049876` passed for commit `04c87b0c89e746f0a1da66f38a4bddfeabf4bc82` (both `build` and `edge-functions` jobs succeeded). Cloudflare Pages production deployment `a5fbb764-e91c-4c0f-aee0-cb5d1a5e83d3` completed successfully; the deployment alias is `https://hellosadiqabad.com`. This was a documentation-only commit; application code and visitor behavior were unchanged.

### 17 November 2026 — Phase 1 storage foundation (in progress)

- Added `src/lib/offlineDirectory.ts` with a versioned IndexedDB store for public directory snapshots, active-generation metadata, validated snapshot reads, atomic generation activation and post-commit cleanup.
- Added explicit mappers for published businesses, active categories/areas and active emergency contacts. Owner/account identifiers, email, internal assignment/claim fields and other private keys are excluded; validation rejects forbidden fields and unpublished business rows.
- Added `src/lib/offlineDirectory.test.ts` covering public-field sanitization, schema validation, duplicate identifiers, unpublished records and inactive-category rejection.
- GitHub Actions CI run `44112311265` passed for commit `0460ecb3c6506d25f233bf17a316fb774a632b36`: TypeScript check, automated tests, production build and Edge Function typecheck all succeeded.
- Cloudflare Pages production deployment `6d404e0a-299b-4fb1-bb09-9891cb261cf2` completed successfully for that commit. The new module is not yet imported by the application, so this deployment does not enable offline directory behavior.
- No Supabase schema/data, business/user records, Cloudflare settings, Service Worker behavior or online visitor workflows were changed.
- Added the public `/offline-data` page and footer entry. The download manager fetches published businesses, active categories, areas and fresh emergency contacts; it validates the public snapshot, estimates JSON package size, reports progress, supports cancellation before activation and displays the last successful download.
- Added a strict preflight count using the anonymous public Supabase role and refreshes the business source for each download. If the visible published-business count cannot be matched, the package is not saved. Emergency-contact cache fallback is also rejected for a new package.
- The original `/offline` path renders the existing emergency fallback page, so the new download manager was moved to `/offline-data`. Live browser-render checks confirmed `/offline-data` returns the new app page (HTTP 200) and `/offline` still returns the emergency fallback with its direct-call links (HTTP 200).
- GitHub Actions CI run `44114620453` passed for the strict business-source helper. Cloudflare Pages production deployment `ba819f2f-2881-44d8-9606-54285abe6dbd` succeeded for the `/offline-data` route fix. The final route commit's GitHub CI run `44114989998` was still pending at the time of this log update; Cloudflare's production build/deploy and live route checks succeeded.
- Public read integration and initial public write guards are implemented. Still required in Phase 1: versioned app-shell/lazy-chunk caching with safe old-cache retention; browser-level IndexedDB transaction/quota/concurrency tests; offline reload/deep-link and airplane-mode acceptance; and verification of all online-only forms. The Service Worker still caches only `offline.html`, so do not claim complete offline browsing.


### 17 November 2026 — Phase 1 public snapshot read integration

- Added public adapters in `src/lib/offlineDirectoryAdapters.ts` for offline business/category/area/emergency records. Private account and owner fields are not reconstructed.
- Public API reads now select the verified IndexedDB snapshot when `navigator.onLine` is false: businesses and related listings, categories, areas, emergency contacts, search/filter data and homepage directory sections. Safe public seed settings are used offline; uncached ads/news suggestions/product previews are omitted.
- Public review, inquiry and suggestion submissions are explicitly rejected offline with a not-sent response. Business/ad telemetry and search logging are skipped. No local submission queue exists.
- GitHub Actions CI run `44118681086` passed TypeScript, automated tests, production build and Edge Function checks for commit `76805d80a18c81257d5758aacf29ad6970dd5d18`.
- Cloudflare Pages deployment `e3d48ab7-b202-43a2-8184-385ec0520686` succeeded. Production browser-render check: `/offline-data` HTTP 200; download manager UI present.
- Not verified yet: airplane-mode read flows, reload/deep-link, IndexedDB quota/transaction/concurrent-tab failure cases. App-shell and hashed lazy-chunk caching are still pending. The Service Worker was not modified.
- No Supabase schema/data/RLS/migrations, existing business/user records, Cloudflare settings or live visitor workflows were changed.


### 17 November 2026 — Phase 1 initial Service Worker caching

- Audited the live registration path in `src/main.tsx`, the existing install prompt, React Router lazy imports, Vite output conventions and the deployed `public/sw.js`.
- Found the prior worker used `skipWaiting()`, `clients.claim()` and deleted every Cache Storage entry except its own v3 cache. Those behaviors could activate over open tabs and erase assets required by an older page.
- Updated `public/sw.js` conservatively: pre-cache `/` and `/offline.html`; use network-first navigation; fall back to the cached SPA shell for app routes while keeping `/offline` mapped to the emergency fallback; cache only successful same-origin fingerprinted JS/CSS script/style requests after first use; leave API, function, Supabase and non-fingerprinted requests out of the runtime cache.
- Removed forced activation and cache cleanup. Reused the existing `hs-sadiqabad-shell-v3` cache key rather than creating v4 because the still-deployed v3 worker's activation cleanup would delete a new v4 cache during rollback. Old cache entries are retained; safe pruning and storage limits remain future work.
- Code commits: `5b83a8c16fb9a0a828236e70420fb2399b399cfa` and rollback-compatibility follow-up `5cb77a8bf47089f6c755cf03bb8df82f1ed814ff`.
- GitHub Actions CI runs `44120063673` and `44120165303` both passed, including TypeScript, automated tests, production build and Edge Function checks.
- Cloudflare Pages production deployment for final commit `5cb77a8bf47089f6c755cf03bb8df82f1ed814ff`: `4c4647d1-e582-4250-8704-a258e15c3089`; build and deploy stages succeeded; production alias remains `https://hellosadiqabad.com`.
- Not yet verified: real browser Service Worker lifecycle, cache contents, offline reload/deep-link, previously visited lazy routes, stale chunk behavior across an update, rollback, airplane mode or physical-device behavior. Do not mark Phase 1 complete or claim complete offline browsing.
- No Supabase schema/data/RLS/migrations, Cloudflare account settings, manifest/install prompt, authentication, owner/admin routes or production business/user records were changed.


### 17 November 2026 — Phase 1 hardening and public app-asset precache

- Strengthened validateOfflineDirectorySnapshot so a corrupted or malformed IndexedDB package is rejected before public adapters use it. It now validates category/area structure, business required fields and arrays, active offer-to-business references, approved review fields/ratings and emergency-contact types, in addition to duplicate IDs, schema version and forbidden private keys.
- Added regression tests for malformed nested arrays, offers attached to the wrong business, malformed emergency phone values and nested private email fields.
- Added a typed Vite build plugin that emits offline-precache.json from actual fingerprinted JS/CSS output files. Production Browser Rendering verified the endpoint returns HTTP 200 and a manifest of 75 fingerprinted assets (73 JS chunks and 2 CSS bundles) for the current build. The manifest contains route chunks, including the business profile, search and offline manager bundles.
- Updated the Service Worker to fetch the build-generated manifest during installation and best-effort pre-cache the listed fingerprinted JS/CSS assets. The worker still does not force activation, claim clients, delete older caches or cache API/Supabase traffic. This improves direct public-route offline navigation after install; it does not cache public data or third-party images.
- Improved /offline-data: removed wording implying offline adapters were not yet connected, now explains that core listings can be browsed while photos/news/live content may still need internet, shows browser storage usage/quota where supported, prevents duplicate download starts, and checks cancellation before snapshot activation.
- Updated CI so TypeScript/tests/build continue running even if the independent dependency-audit gate fails. This does not bypass the audit gate; overall CI remains failed when the high/critical audit step fails.
- Commits: 631f31aa0fe54a2cbe8026078cb82e3dbde89e03, 16003b2ef031f27cafb2629681e8b231ba040438, 8687077a47f2da4be28d4e54e7f5890e888a3001, 218c5517b5654bb496bed5dd4f473f9ef62bdf0e, a363474e76afff9959b1199876d93d143ed2baed, 015306c55e235f9638404da18215c3208813d534, 07ccfa978422327a9f12fd8e5aef6c49d5e4d969, d607c987748476cb82c806a57dd26401084ba587.
- GitHub Actions run 44143421511: Edge Function checks passed; TypeScript typecheck, automated tests and production build passed. The separate npm audit --audit-level=high gate failed, so the overall CI run is not green. No dependency update was made without identifying and reviewing the exact advisory.
- Cloudflare Pages production deployment 9c5e9413-98d1-4568-9b3f-fe912c3e1638 succeeded for d607c987748476cb82c806a57dd26401084ba587, alias https://hellosadiqabad.com.
- Production Browser Rendering checks: /offline-data rendered the updated UI; /offline-precache.json returned HTTP 200 and 75 fingerprinted assets; /sw.js returned HTTP 200 and includes the manifest-based install precache. Browser Rendering did not provide an interactive persistent browser session for inspecting actual Cache Storage or airplane-mode navigation; those remain unverified.
- Phase 1 remains in progress. Outstanding: identify/resolve the high/critical dependency audit blocker; actual IndexedDB transaction abort/quota/concurrent-tab tests; verify Service Worker install/cache contents, offline reload/deep links, stale chunk/update/rollback in a real browser; confirm offline write guards and online smoke flows; and complete device/airplane-mode acceptance.
- No Supabase schema/data/RLS/migrations, business/user records, private data, authentication flows, manifest identity, PWA install prompt or Cloudflare account settings were changed.


### 17 November 2026 — Browser acceptance and end-to-end public package download

- Added an Offline readiness check to /offline-data. It verifies active Service Worker registration, cached SPA shell, cached /offline.html emergency fallback, the build manifest and per-asset Cache Storage coverage; it also runs a temporary native IndexedDB write/read, abort rollback and concurrent-transaction probe, then checks the active offline package metadata.
- Added an isolated-browser acceptance path (query parameter offline-download-check=1) that runs the same public directory download workflow, saves the public package in that browser's IndexedDB, temporarily simulates navigator.onLine=false and exercises public search, business detail, categories, areas and emergency contact read adapters. It restores navigator.onLine afterwards. It does not write to Supabase.
- Production Browser Rendering acceptance passed: Service Worker active; SPA shell and emergency fallback cached; 75/75 fingerprinted JS/CSS app assets cached; native IndexedDB write/read, abort rollback and concurrent transactions passed; full package saved with 655 businesses, 19 categories, 303 areas and 12 emergency contacts; offline search/detail/category/area/emergency read adapters passed with matching counts.
- Added a unit test confirming public review, inquiry and suggestion submissions return explicit not-sent responses offline, while business/ad telemetry does not create an analytics session or queue a write.
- GitHub Actions run 44148164258: Edge Function checks, TypeScript typecheck, automated tests and production build passed. Overall CI remains blocked by three high npm audit findings for picomatch/tinyglobby/Vite. The audit report identifies GHSA-fc5q-39xc-vjpf (ReDoS in picomatch through 4.0.7) and offers only a force fix that downgrades Vite to 6.2.7 (major breaking change). The current advisory has no patched version stated; do not suppress the audit or apply the breaking downgrade. See https://github.com/advisories/GHSA-fc5q-39xc-vjpf.
- Cloudflare Pages production deployment 6d482311-18fe-47f6-bed0-382c0422dae7 succeeded for commit b80e6b470390fc80fba26c0111574a2e46c21a38, alias https://hellosadiqabad.com.
- The browser acceptance ran in an isolated Browser Rendering context. It proves the app's public package/download/IndexedDB/read-adapter workflow there, not that the user's phone has downloaded a package. It did not emulate real airplane mode or verify a reload/deep-link while the physical device had all networking disabled.
- Remaining Phase 1 acceptance: user-device airplane-mode reload and direct public deep-link test; real SW update waiting/stale-chunk/rollback behavior across open tabs; real browser quota exhaustion is not forced; online smoke checks for all public routes; resolve the upstream npm audit advisory when a safe patched picomatch/Vite-compatible release is available. Phase 1 remains in progress.
- No Supabase schema/data/RLS/migrations, business/user records, private data, authentication flows or Cloudflare account settings were changed. The Service Worker still avoids forced activation/client claim/cache deletion and does not cache API/Supabase responses.

- Additional production online smoke checks passed via Browser Rendering: home, search, a published crawl-only business profile (Shoe World), Restaurants category, Tibba Zahir Pir area, Emergency (1122/15), Local Authorities, Authority Profiles, /offline and /offline-data all returned rendered pages with expected page content. This validates key online public routes after the offline changes. A stale DB-backed static snapshot listing was correctly withheld when its live publication status could not be verified; no stale business data was force-shown.


## Mobile offline-download entry point — 17 November 2026

- Added a dedicated **Offline** shortcut to the persistent mobile bottom navigation. It is available throughout the public site and installed PWA and opens the existing `/offline-data` download/readiness page directly; it does not change the download flow, offline storage, Service Worker or data access.
- The shortcut uses a distinct primary-tinted treatment and a download icon, with an Urdu label when the app language is Urdu. The existing footer link remains available as a second entry point.
- Verification: commit `76ba1eee2e579aa9c5deaf9d5e3150185d1f1d3a` passed TypeScript, automated tests and production build; Cloudflare Pages production deployment `057d8d2b-6e48-44df-acea-13974115c885` succeeded and the `https://hellosadiqabad.com` alias is attached. Overall CI run `44154044236` remains failed only at the existing high-severity npm audit gate (same upstream picomatch/tinyglobby/Vite advisory); no audit suppression or dependency downgrade was made. Physical-device layout/usability remains part of Phase 1 acceptance.


### 18 November 2026 — Admin-only compressed image uploads and offline media cache (implementation in progress)

- Added a shared AdminImageUpload component for the Admin-managed image URL fields: category/area/emergency-card directory images, homepage hero banner, authority profile photo, admin-managed owner profile photo, news cover/gallery, sponsored campaign banner and business gallery. Existing business logo/cover upload remains on its established compressed Supabase Storage flow. External HTTPS URL entry remains supported where it existed.
- New uploads are browser-compressed to WebP before upload (purpose-specific maximum dimensions, optimized quality); original input is limited to 15 MiB and compressed output to 8 MiB. New objects use the existing public 'Hello Sadiqabad' bucket under 'site-media/<admin-user-id>/<purpose>/...'; no new bucket or secret was introduced.
- Added and applied Storage RLS policies for the 'site-media' prefix. Only authenticated Super Admin/staff accounts with the relevant Admin permissions can insert objects in their own UID folder. The final policy also enforces 'image/webp' and a 1–8 MiB compressed object size. Public read is limited to the already-public image bucket; no anon/owner upload policy was added.
- Owner Portal image URL editing controls for business logo/cover/gallery and product/offer images were removed. Database enforcement was strengthened too: 'guard_business_columns' no longer permits owners to change 'owner_photo_url', 'logo_url', 'cover_url' or 'gallery_urls'; owner product/offer request RPCs permit only the unchanged current image URL, and reject attempts to set, replace or clear it. Existing images and pending requests were not bulk-modified or deleted.
- '/offline-data' now gathers image references from published businesses, active offers, active products (anonymous-RLS public rows only), public directory/hero settings, active ads, published news and active authority profiles. It prefetches supported public Supabase Storage images and the existing Google image proxy into Cache Storage with bounded concurrency and progress; failed/unavailable images are skipped rather than blocking the validated IndexedDB directory package. The Service Worker uses a separate 'hs-sadiqabad-public-media-v1' cache and only intercepts the known public Storage bucket and same-origin '/image' proxy; existing shell cache key and conservative worker lifecycle are preserved.
- Supabase migrations applied and verified: '20261117193404_site_media_admin_upload_policy', '20261117194321_restrict_owner_image_updates', '20261117194905_enforce_site_media_webp_size', '20261117195404_public_submission_images_admin_only'. No production business/user records, existing media objects, RLS read policies, authentication settings or Cloudflare environment variables were changed.
- TypeScript, 92 automated tests, production build and Edge Function checks passed in CI run '44164115526'; Cloudflare Pages deployment '70ad68bf-c6b4-4505-85c4-19d07f075a2f' succeeded for commit '2aa09779c1993dd3dde4a3734e06b86e2ca23e4d'. Overall CI remains failed only at the pre-existing npm audit gate (3 high findings: picomatch/tinyglobby/Vite). Live Admin upload, actual WebP size, offline media cache count and physical-device offline tests remain pending.


### Additional security hardening — public business submissions

- Public visitors do not have image upload or image URL fields in the Add Business form. The live approval RPC now explicitly inserts NULL for logo and cover URLs from public new-business submissions, so a crafted public payload cannot set either image. Admin adds images after approval.
- This final migration is applied as '20261117195404_public_submission_images_admin_only'. Existing businesses and image URLs were not changed.


### Verification update — 18 November 2026

- Production code commit: '2aa09779c1993dd3dde4a3734e06b86e2ca23e4d'. Cloudflare Pages production deployment '70ad68bf-c6b4-4505-85c4-19d07f075a2f' succeeded and the canonical 'https://hellosadiqabad.com' alias is attached.
- GitHub Actions run '44164115526': TypeScript, automated tests (92 passing), production build and Supabase Edge Function checks passed. Overall CI still fails only at the existing npm audit gate (three high-severity findings in picomatch/tinyglobby/Vite); no suppression or unsafe Vite downgrade was applied.
- Live Admin upload, image compression output, Cache Storage media count and physical-device airplane-mode/reload acceptance have not yet been exercised. Keep these as pending; deployment success is not proof of those behaviors.

### Storage upload RLS correction — 18 November 2026

- Supabase Storage logs confirmed a failed `site-media` INSERT from the active Super Admin session, with correct UID folder and `new row violates row-level security policy`. The failing policy included `metadata.mimetype` and `metadata.size` predicates that were not reliably true during Storage's initial INSERT check.
- Applied `20261117204927_fix_site_media_admin_insert_rls` to remove only those metadata predicates. Admin-only authenticated role, `site-media` bucket/path scope, own-UID folder and approved Admin/Super Admin permission checks remain.
- The shared browser uploader still converts images to WebP, resizes, rejects unsupported formats and limits compressed output to 8 MiB. MIME/size are currently enforced in the client, not independently by this Storage RLS policy; do not describe them as server-side enforcement.
- Live policy definition verified. Actual browser upload and offline image caching remain pending owner/device acceptance.


### 18 November 2026 — Category and helpline offline image mapping

- Added the public `directory_image_urls` mapping to the existing version-1 offline snapshot as an optional backward-compatible field. This avoids invalidating previously downloaded offline packages.
- The offline download now saves the same public category/area/helpline image maps already used to build the image prefetch list. Category images remain keyed by category slug; helpline images remain keyed by public helpline ID, matching existing cards.
- Offline `fetchSiteSettings()` restores those saved public image mappings from the verified active IndexedDB snapshot instead of falling back to seed-only image settings. Existing Cache Storage media fetching and Service Worker interception are reused; no new image host or cache namespace is introduced.
- Added snapshot validation tests for valid public category/helpline image maps and rejection of insecure image URLs.
- No Supabase schema/data/RLS, Storage policy, Service Worker, image upload, business image path or Cloudflare setting change is required.
- Pending verification: CI/typecheck/tests/build, production Pages deployment, and browser/device offline rendering of category and helpline card images. Existing offline snapshots from before this update need one fresh offline-directory download to save the image URL mappings.


### 18 November 2026 — Supabase Storage image delivery correction

- Production read-only inspection confirmed category image mappings exist in public `site_settings.directory_image_urls.categories` and point to the existing public `Hello Sadiqabad` Storage bucket.
- Root cause: browser Service Workers only control same-origin requests. The earlier downloader cached direct Supabase URLs in Cache Storage, but category/helpline `img` elements still requested cross-origin Storage URLs. Those direct requests cannot be served from the site's Service Worker cache while offline.
- Narrow correction: category and helpline cards now use the site's existing `/image?url=` same-origin proxy for approved public Supabase Storage images. The offline downloader explicitly pre-caches those same-origin proxy URLs for category and helpline images. Existing business image rendering and direct business image download paths remain unchanged.
- Expanded `functions/image.js` allowlist only for the exact production Supabase host and public `Hello Sadiqabad` bucket prefix; all other Supabase hosts/buckets remain denied. Existing Google image proxy behavior remains.
- No Supabase data/schema/RLS/Storage policy change, no image re-upload, no business data change, and no Service Worker cache-version change.
- Acceptance still requires CI, production deployment, then a fresh offline-directory download and a physical offline check of category/helpline cards.


### 24 November 2026 — Complete public offline package, background navigation and update notice

Implementation is committed to main and deployed to the production alias. This expands the existing IndexedDB snapshot and Cache Storage flow; it does not require a Supabase schema, RLS, Storage-policy or data migration.

- Offline snapshot now includes published businesses, active categories and areas, active emergency contacts, published news articles, active/scheduled public announcements, active local authorities, active authority profiles, published government jobs, published government schemes, published static pages, active business products, active public ads, public site settings, and opted-in owner profiles from the redacted `owner_public_profile_directory` / `owner_public_profile_businesses` views.
- Public records are allowlisted before storage. Internal creator/updater/approver IDs and private notes/analytics are omitted. Owner profile contact fields are taken only from the existing redacted opt-in public view; the raw owner profile tables are not queried. Public owner profile values are hashed for the update fingerprint rather than copied into the fingerprint string.
- Offline adapters now read the saved news, announcements, authority directories, public pages, jobs, schemes, products, ads and opted-in owner profiles from the snapshot. Business listings continue to use the existing offline adapters.
- Image package now includes all public image URL fields from the above datasets, the known shipped public site image assets, directory image maps, business logos/covers/galleries/offers, product images, news images, authority/owner profile photos and job posters. Cache Storage uses the existing public media cache. The Service Worker also serves cached same-origin public image files while offline.
- Cacheable media sources remain deliberately restricted: the existing public Supabase bucket, the existing Google image proxy allowlist, the site's same-origin image proxy, and same-origin static image assets. Unsupported third-party image hosts and failed image requests are skipped, counted and shown in a completion warning; they do not block activation of an otherwise valid public-data package. The previous verified package remains active if core public data validation or the atomic snapshot save fails. External video streams, live embeds and third-party map tiles are not copied into the offline package.
- Download state/controller is now module-scoped and survives React route changes inside the open app. Navigating to another in-app page no longer aborts the download; a persistent progress/cancel indicator remains visible across public pages. This is not a promise that a browser will continue downloads after the tab/browser is closed or the operating system suspends the app.
- Public content version checking fingerprints businesses, products, offers, approved reviews, active ads, categories, areas, emergency contacts, news, announcements, authorities, authority profiles, jobs, schemes, pages, public settings and opted-in public profile views. Public pages check on reconnect and at five-minute intervals. When a saved package is stale (including legacy packages without a version fingerprint), the homepage shows a download-update notice linking to Offline Data.
- Forms, report submissions, account/authentication flows, admin/owner portals and private user data remain online-only and are never queued or stored in the offline package.
- Cloudflare's configured production npm run build and Pages deployment succeeded for commit 9caa205c59e778f676ef1f404475777160cf8cb8 (deployment d87465cd-dc76-4c20-92df-3fc8503376ae, production alias attached). GitHub combined status returned no checks for that commit; TypeScript typecheck and unit tests were not run in this batch. Real browser/mobile testing is still required: start a download, navigate between several public routes, return to confirm progress, complete the package, switch to airplane mode, and verify each downloaded route and image category. Do not claim complete offline acceptance until those checks pass.


## Owner-approved partial-image offline download — 25 November 2026

**Decision:** The owner approved Option 2: a missing or unsupported public image must not prevent the validated public directory package from being saved.

- The downloader continues to cache supported images with bounded concurrency.
- Unsupported hosts, failed proxy requests, non-image responses and Cache Storage failures are counted as skipped images.
- The validated public IndexedDB snapshot can still activate when some images are unavailable. The completion state reports the number of cached and skipped images and clearly warns that skipped images may not appear offline.
- Core public data fetch/validation failures, cancellation and atomic snapshot-save failures still keep the previous verified package untouched.
- The offline package remains public/anonymous-safe only. Admin/Owner portals, authentication/session data, private profiles and write payloads remain excluded.
- Regression coverage verifies that supported images cache while unsupported and unavailable images are counted without aborting the image batch.
- Remaining acceptance: GitHub CI/build, production deployment, fresh package download and actual airplane-mode route/image verification. Do not mark overall offline acceptance complete until the remaining browser/device gates pass.


### Partial-image package — CI, deployment and browser acceptance — 25 November 2026

- [x] Corrected the shared download-state type to support a successful download with image warnings.
- [x] GitHub CI run [45668460310](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45668460310) passed TypeScript, automated tests, production build and Supabase Edge Function checks.
- [x] Cloudflare Pages production deployment `b162f9ca-f575-445f-aeb6-14711b7ff30c` succeeded for feature commit `f5289c6c91ea06680252f22dae2decde615605ce`. The canonical alias `https://hellosadiqabad.com` was subsequently confirmed on deployment `3e856645-fe2b-47b6-84d8-885a6593b6a1` for descendant commit `c181ea930802afa9186674e1be7e19aec4eff988`, which includes the feature.
- [x] Production Browser Rendering test saved a fresh package with **748 businesses, 29 categories, 315 areas and 12 emergency contacts**. It cached **953 images** and reported **235 unavailable/unsupported images** without blocking the package save.
- [x] Browser offline-emulation smoke (390×844) explicitly set `navigator.onLine=false` and network offline, then verified homepage, categories (29 category links), emergency contacts and a business detail page from the saved snapshot. No page-level JavaScript errors were recorded.
- [ ] Physical Android/iOS/desktop airplane-mode testing and worker update/rollback acceptance remain open. The browser-emulation test is not a physical-device test and does not close overall offline Phase 1–4 acceptance.
