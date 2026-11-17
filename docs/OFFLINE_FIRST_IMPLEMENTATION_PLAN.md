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
**Status: not started; depends on Phase 1.**

- Add offline snapshots and offline read fallbacks for active offers, published news/articles, current announcements, active local authorities, public authority profiles, public static pages and public site settings.
- Create a deduplicated image manifest from the public business/content snapshots. Download public logos and cover images first, then galleries and other public media with bounded concurrency and explicit storage limits.
- Use browser cache APIs safely for eligible same-origin and CORS-permitted media. If a third-party image cannot be cached, keep a graceful existing image fallback and report it as unavailable offline; do not proxy or copy images through an unapproved external service.
- Keep ads/telemetry non-essential and do not record offline impressions/clicks as if they reached the server.
- Provide a user-visible choice to include large gallery media where storage constraints require it; clearly state what is and is not stored.

**Acceptance gate:** each included public route can load from local data offline; downloaded images render where cacheable; missing third-party images fail gracefully; no private/draft data enters IndexedDB or Cache Storage.

### Phase 3 — Updates, storage management and resilience
**Status: not started; depends on Phases 1–2.**

- Add safe update checks and a versioned data manifest, last-successful-sync timestamp and data schema version.
- Implement incremental updates where reliable change markers exist. Where they do not, use a validated full dataset refresh staged atomically; do not claim delta sync without evidence.
- Show available storage/quota using supported StorageManager APIs, estimate download size, handle quota failures and offer retry.
- Support user-initiated removal of offline data without clearing favorites, auth settings or unrelated browser data.
- Retain the last good offline generation until a replacement completes successfully.
- Test low storage, interrupted download, app update while offline, browser eviction, corrupt/old snapshot and retry.

**Acceptance gate:** no partial snapshot is ever presented as complete; previous valid data survives failed updates; data age and update state are accurate.

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
- Supabase migrations applied and verified: '20261117193404_site_media_admin_upload_policy', '20261117194321_restrict_owner_image_updates', '20261117194905_enforce_site_media_webp_size'. No production business/user records, existing media objects, RLS read policies, authentication settings or Cloudflare environment variables were changed.
- Automated code verification, CI, Pages deployment and live upload/download browser acceptance are pending. Do not describe the feature as live until CI and production deployment pass. Do not claim all images are offline-available until the real-browser media cache check and physical-device offline test pass. Phase 1/2 device acceptance remains outstanding.
