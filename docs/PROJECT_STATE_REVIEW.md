# Hello Sadiqabad — Current Project State

Last reviewed: 17 November 2026

## Source-of-truth order

1. Current GitHub main code and supabase/migrations describe the implemented application and database.
2. PROJECT_ROADMAP.md is the live checklist for completed work and user-requested improvements.
3. The six files under public/assets/aistudio are the original planning baseline. They remain useful for initial product intent, architecture and security rules, but predate later post-build features. Do not treat them as a complete description of the current implementation.

## Platform

- Frontend: React, TypeScript and Vite.
- Database/auth: Supabase PostgreSQL 17, with RLS and migrations.
- Hosting/deployment: Cloudflare Pages, connected to GitHub.
- Main repository: samt87804-gif/Hello-Sadiqabad, branch main.
- Public site: https://hello-sadiqabad-2bs.pages.dev

## Verified completed application work

- Homepage hero banner.
- Owner registration requests and Admin approval/rejection.
- Public owner profiles with Admin-controlled field-level privacy.
- News module with bilingual public feed/article pages and Admin draft/publish workflow.
- Enhanced Owner Portal, including My Businesses, owner request history and plan-upgrade submissions.
- Owner Products & Services Catalogue, with database/UI limits and published-business visibility rules.
- Admin editor state retention: visited Admin sections remain mounted while switching Admin tabs; dashboard refreshes no longer replace active editors with loading skeletons.
- Owner content approval: owner product, service and offer create/update/delete actions create moderation submissions. Database RLS blocks direct owner writes; Admin approval applies changes and notifies the owner.
- Owner-selected public profile businesses: owners choose up to 50 of their published listings. A separate RLS-protected mapping controls which selected listings are shown on the public owner profile.

## Important existing rules and data to preserve

- Public business and owner-profile visibility must be enforced by Supabase RLS/backend, not only by frontend conditions.
- Existing News articles must remain intact when News media fields are extended.
- Civic Announcements at /announcements are separate from the News module.
- The 14 legacy imported businesses with more than two English service entries were not deleted or trimmed; they have no linked owner. Preserve these records.
- Product catalogue rows currently start empty; owners may add up to two products per business.
- Offer limits remain plan-based (Free 0, Basic 2, Premium 10 active offers).
- Do not perform destructive data changes without explicit approval.

## User-requested improvements

The user asked for nine improvements, implemented in batches with approval before each new batch. Their detailed status is maintained in PROJECT_ROADMAP.md. Do not begin a later batch until the current batch is completed, verified and the user approves the next one.

### Batch 1
1. News button in mobile bottom navigation.
2. Multiple images and a YouTube video URL per News article.
3. Consistent 16:9 image-management preview cards (40% image / 60% details); helpline cards include name, phone and a Call action.

### Batch 2 — completed
4. Admin edit panels stay mounted across Admin tab changes and are not replaced by loading states during refresh.
5. Owner products, services and offers are submitted to moderation; public data changes only after Admin approval.
6. Owners select the published businesses shown on their public owner profile.

### Batch 3 — completed
7. Category listing count is larger/bolder and right-aligned on homepage and All Categories cards.
8. The supplied logo is used in the header, favicon, Apple touch icon and PWA manifest icon references.
9. Helpline card names and phone numbers are centered and enlarged within the right 60% of the 16:9 cards.

The supplied PWA logo is referenced directly from the public Supabase Storage URL in the manifest; the same source is used for the header and browser/app icon links.

## Batch 4 — completed and deployed (16 November 2026)

- Sponsor Ads: campaign dashboard metrics and filters, schedule-aware status labels, creative preview, new civic placements, safe target URL validation, and campaign writes that do not overwrite impression/click counters.
- Government Helplines: dedicated public route using the existing emergency_contacts store, source URLs and verification timestamps, six official-source helpline records, and Admin source management.
- Local Authorities: additive RLS-protected table, five official-source Sadiqabad records, public search/filter route, Super Admin manager, audit triggers, and JSON backup export support.
- Supabase migrations: `20261116044916_enhance_ads_and_add_government_directories` and `20261116051134_verify_official_government_helpline_sources`.
- Security checks so far: anonymous SELECT sees active authority rows only; owner INSERT is denied; Super Admin INSERT was tested in a rolled-back transaction; no RLS test records persisted.
- Source data caveat: Tehsil Council Sadiqabad is listed without a direct public phone because the cited official directory does not publish one. Municipal Committee Sadiqabad details use its official site; police numbers use the Punjab Police directory.
- Final GitHub Actions run `43808174348` succeeded for commit `69ad062d984f6f4bcc5e59cc1ca3dc480febc2eb`.
- Cloudflare Pages production deployment `b628632c-60c2-491b-bf5c-0025a67683c2` succeeded at `https://b628632c.hello-sadiqabad-2bs.pages.dev`; canonical site remains `https://hello-sadiqabad-2bs.pages.dev`.
- Database state: six active Government Helplines and five active Local Authorities; no ads or RLS test rows exist. The older District Control Room landline 068-9230389 is retained but inactive because it could not be re-confirmed in the current official directory.

## Operating checklist

- Inspect the current code, database schema, RLS and relevant migrations before every change.
- Preserve existing data and backward compatibility.
- Validate user-supplied URLs and content in both frontend and database where applicable.
- Run typecheck, tests and production build; verify Supabase behavior and Cloudflare deployment for the affected feature.
- Update PROJECT_ROADMAP.md after each verified batch.

## Offline-first PWA baseline — 17 November 2026

- Owner requested that the public directory and installable PWA work offline after a visitor downloads public data once.
- The initial read-only audit is recorded in `docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md`.
- Permanent engineering and production-safety rules are recorded in `docs/PROJECT_WORKING_RULES.md`.
- Current PWA installation is already configured. Full offline support is not implemented: the Service Worker only caches the offline fallback page; favorites/recent views/emergency contacts have limited local storage; complete public directory/content/media are not cached.
- Phase 0 was documentation-only. Phase 1 now includes an initial validated IndexedDB snapshot store and explicit public-field mappers in `src/lib/offlineDirectory.ts`, plus automated tests in `src/lib/offlineDirectory.test.ts`.
- Commit `0460ecb3c6506d25f233bf17a316fb774a632b36` passed GitHub Actions CI run `44112311265` (TypeScript, tests, production build and Edge Function checks); Cloudflare Pages deployment `6d404e0a-299b-4fb1-bb09-9891cb261cf2` succeeded.
- The storage module is used by the public `/offline-data` download manager and public API read adapters. When the browser reports offline, business directory/search/profile reads, active categories/areas and emergency contacts use the verified IndexedDB snapshot. Public reviews, inquiries and suggestions are rejected offline; telemetry is skipped. App-shell/lazy-chunk caching and browser-level IndexedDB transaction/quota/concurrency tests remain incomplete, so offline reload/deep-link use is not yet verified. No Supabase schema/data, user/business records, Service Worker behavior or Cloudflare settings were changed.


## Offline-first Phase 1 download manager — 17 November 2026

- Public route `/offline-data` and a footer entry were added. It downloads only public business data, active categories/areas and fresh emergency contacts; validates before saving; and preserves the previous snapshot if the download fails or is cancelled before activation.
- A strict anonymous-public row-count check prevents saving an incomplete published business set. Each download refreshes the data source rather than reusing the directory cache.
- The `/offline` path remains the pre-existing emergency fallback page. Browser-render checks confirmed `/offline-data` shows the download UI and `/offline` retains emergency call links.
- CI run `44114620453` passed; Cloudflare deployment `ba819f2f-2881-44d8-9606-54285abe6dbd` succeeded. CI run `44114989998` for the route correction was pending at this review.
- Full offline directory browsing is not yet implemented because public pages do not read the saved snapshot while offline, and the Service Worker still caches only `offline.html`.


## Offline-first Phase 1 — public snapshot read integration — 17 November 2026

- Added public adapters in `src/lib/offlineDirectoryAdapters.ts` for business, category, area and emergency-contact records. The adapters restore only fields already included in the offline allow-list; owner ID, email and private account fields are not restored.
- Updated public API selection so offline browsers read businesses, categories, areas and emergency contacts from the verified IndexedDB snapshot. Homepage uses safe public seed settings and omits non-essential ads/news suggestions/product previews where those sources are not cached.
- Public reviews, inquiries and suggestions now return an explicit connection-required/not-sent result while offline. Business/ad telemetry and search logging are skipped; no offline submission queue is created.
- CI run `44118681086` passed TypeScript, automated tests, production build and Supabase Edge Function checks for commit `76805d80a18c81257d5758aacf29ad6970dd5d18`.
- Cloudflare Pages deployment `e3d48ab7-b202-43a2-8184-385ec0520686` succeeded. Production browser-render check confirmed `/offline-data` returns HTTP 200 and renders the download manager.
- Still incomplete: Service Worker app-shell and lazy-chunk caching, browser-level IndexedDB transaction/quota/concurrency tests, offline reload/deep-link and airplane-mode verification. The current Service Worker still caches only `offline.html`.
- No Supabase schema, data, RLS, migration, Service Worker, Cloudflare setting or existing visitor workflow was changed in this batch.


## Offline-first Phase 1 — initial Service Worker caching — 17 November 2026

- Updated `public/sw.js` to cache the SPA entry document and emergency fallback, use network-first navigation, fall back to the cached SPA entry for app routes, and cache successful fingerprinted Vite JS/CSS chunks after first use.
- `/offline` retains the existing emergency fallback behavior. API/function/Supabase traffic and non-fingerprinted assets are not cached.
- The new worker does not force activation, claim open clients or delete old caches. It reuses the existing `hs-sadiqabad-shell-v3` cache key because the currently deployed v3 worker's cleanup would delete a newly named cache during rollback.
- Commits: `5b83a8c16fb9a0a828236e70420fb2399b399cfa`, then compatibility follow-up `5cb77a8bf47089f6c755cf03bb8df82f1ed814ff`.
- CI runs `44120063673` and `44120165303` passed. Final Cloudflare Pages deployment `4c4647d1-e582-4250-8704-a258e15c3089` succeeded for `5cb77a8bf47089f6c755cf03bb8df82f1ed814ff`.
- Browser/device Service Worker lifecycle, actual cache contents, offline reload/deep-link, stale chunk/update/rollback and IndexedDB quota/concurrency tests remain unverified. Phase 1 remains in progress; no full-offline claim is made.
