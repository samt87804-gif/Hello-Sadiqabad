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
**Status: in progress — IndexedDB storage and the public download manager are implemented; offline read integration, app-shell caching and acceptance testing remain.**

1. Design a versioned IndexedDB schema for public directory snapshots and download metadata. Keep current localStorage favorites/recent-history keys compatible.
2. Add a download manager reachable from the existing public app (a dedicated offline-data screen plus a clear entry point). It must show an honest size estimate/actual bytes, progress, cancellation, success/failure and last successful download.
3. Download data through the existing public, anonymous-RLS-approved read paths. Include the complete current published business set plus crawl-only supplemental records, categories, areas and emergency contacts. Use an explicit public-field allow-list.
4. Write into a staging generation and switch the active generation only after every required dataset has passed validation. An interrupted/failed download must leave the previous verified offline package untouched.
5. Make public business search, filters, business details, categories, areas, homepage directory sections, favorites/recent items and emergency contacts read the verified IndexedDB snapshot when offline. Preserve the existing online Supabase source-of-truth path.
6. Add offline shell asset caching for the React app and its lazy-loaded route chunks. Generate the asset manifest at build time or use another deterministic approach. Preserve current update notification behavior; never force reload an active visitor. Retain old asset caches safely until no active client depends on them; test rollback and stale chunk cases.
7. Ensure write actions fail clearly while offline and never show a success state. Do not queue review/inquiry/claim/correction/business submissions.
8. Add unit tests for IndexedDB versioning, snapshot validation/atomic activation, stale-data metadata, cancellation, quota errors, online-vs-offline data selection and offline write guards.

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
- Still required in Phase 1: browser-level IndexedDB transaction/quota/concurrency tests, offline read fallbacks for directory pages, app-shell/lazy-chunk caching, online-only write guards and full acceptance checks. The stored package is not yet consumed by public pages while offline; do not claim complete offline browsing.
