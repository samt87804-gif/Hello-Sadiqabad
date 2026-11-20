# Hello Sadiqabad — Project Roadmap

This is the live application project checklist. Update it on `main` whenever a task is verified complete. A phase is checked only after implementation and verification.

**Domain, security and SEO work is tracked separately in [docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md](docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md). New-chat continuity and the website owner's Google/Supabase checklist are in [docs/NEW_CHAT_HANDOFF.md](docs/NEW_CHAT_HANDOFF.md).**

## Domain, security and SEO implementation

- Current source of truth: [Domain, Security & SEO Master Plan](docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md).
- Working mode: direct commits to `main` only; no feature branches or Pull Requests unless the owner changes this instruction.
- Owner-confirmed 17 November 2026: Supabase Auth Site URL and canonical redirect URLs saved; Google Search Console Domain property verified and DNS TXT retained in Cloudflare.
- Phase 0: Cloudflare HTTPS/TLS/CSP headers reviewed; one narrow chat API rate-limit rule active. Supabase RLS retained; public owner-profile view fixed using `security_invoker`, generated redacted columns and column-level grants. Missing owner-profile FK index added.
- Supabase leaked-password protection remains disabled because the connected organization is on the Free plan; no automatic upgrade or credential request.
- Phase 1 foundation deployed: dynamic `/sitemap.xml` returns 516 unique canonical URLs; `robots.txt` points to it; canonical/OG/Twitter metadata, Organization/WebSite, NewsArticle, LocalBusiness and BreadcrumbList schema added; search/auth/private/unknown routes are noindex.
- Targeted live browser checks passed for homepage collaboration credit/banner, sitemap, robots, search noindex, news, business and category metadata/schema, mobile business breadcrumb and News image alt text. News image alt text and visible business breadcrumbs were improved. Semantic H1 headings were added to homepage, category index, city map, offers and announcements. CI and Pages deployment succeeded; browser re-check was rate-limited. Full-site crawl and Google Rich Results Test remain pending.
- Owner-confirmed 17 November 2026: `https://hellosadiqabad.com/sitemap.xml` submitted successfully in Search Console; Google says periodic processing will follow. Processing/index coverage not yet confirmed. Owner also confirmed URL Inspection + Request Indexing submissions for the homepage and all six priority URLs (`/categories`, `/emergency`, `/map`, `/news`, `/offers`, `/announcements`) are complete. These are crawl-queue submissions only; indexing/coverage is not yet confirmed. Next: continue technical SEO audit and later review Search Console indexing results.

## Completed

- [x] Homepage hero banner
- [x] Homepage collaboration credit under the header and AP KI AWAZ × INSPIRE ACADEMY banner at the bottom; deployed and browser-verified
- [x] Owner registration request flow and Admin approval/rejection workflow
- [x] Public owner profiles with Admin-controlled field-level privacy
- [x] News Module — bilingual public feed/article pages, Admin draft/publish editor, database RLS, and production deployment verified
- [x] Enhanced Owner Portal — My Businesses management, owner-only approval/request history, secure plan-upgrade submissions, and database-enforced active-offer limits
- [x] Owner Products & Services Catalogue — bilingual owner-managed products (max 2 per business), public display on published profiles, and database/UI service limits (max 2 for owner edits)

## In progress

- [ ] Batch 5 — Read-only, Roman Urdu-first AI Chatbot: implementation is on `main` and deployed; final end-to-end live chat verification is pending.

## Search rollout — 18 November 2026

- [x] Category detail pages now include a category-scoped live business search for name, Urdu text, phone, address, area, category synonyms/tags and services.
- [x] Search uses the existing public business matcher with 300 ms debounce and request cancellation; no Supabase schema/RLS/data change was required.
- [ ] Remaining page-level search rollout is still pending.

## User-requested improvements (16 November 2026)

Batch 1 — completed (16 November 2026):
- [x] (1) Add News to the mobile bottom navigation.
- [x] (2) Support multiple images and a YouTube video URL in each News article.
- [x] (3) Standardize image-management previews as 16:9 cards with 40% image / 60% details; show name, phone and a Call action for helplines.

Batch 2 — completed (16 November 2026):
- [x] (4) Keep Admin edit sections and unsaved form state mounted when switching Admin tabs or refreshing dashboard data.
- [x] (5) Route owner-created and edited products, services and offers through database-enforced Admin approval before public display.
- [x] (6) Let owners choose which of their published businesses appear on their public owner profile, with RLS-controlled public visibility.

Batch 3 — completed (16 November 2026):
- [x] (7) Move category listing quantity to the far right of homepage and All Categories cards and make it larger/bolder.
- [x] (8) Use the supplied Hello Sadiqabad logo in the site header, favicon, Apple touch icon and installable PWA manifest.
- [x] (9) Center helpline names and phone numbers in the right 60% of 16:9 helpline cards and increase text size.

## Batch 4 — completed and deployed (16 November 2026)

### (10) Sponsor Ads enhancements
- [x] Add admin campaign summary metrics: live campaigns, pending review, impressions, clicks and overall CTR.
- [x] Add campaign search plus lifecycle-status and placement filters.
- [x] Show creative preview, sponsoring business, placement, schedule and CTR on each campaign.
- [x] Add Government Helplines and Local Authorities placements.
- [x] Render civic placements through the shared AdBanner component and respect the global ads_enabled setting.
- [x] Distinguish scheduled and date-expired campaigns without silently changing stored status.
- [x] Make campaign updates preserve live impression/click counters instead of overwriting them with stale form data.
- [x] Validate banner image HTTPS and allow only HTTPS external targets or safe same-site paths; reject protocol-relative //host redirects.
- [x] Extend the ads placement and target URL database constraints for the two new civic placements and safe internal paths.
- [x] Verify production build and deployment; click/impression tracking is wired through the existing telemetry path. Production currently has no ad campaigns, so real campaign telemetry will begin when the first campaign is activated.

### (11) Government Helplines
- [x] Preserve the existing emergency shortcodes and shared offline cache.
- [x] Add a dedicated /government-helplines page and Government category without creating a duplicate helpline table.
- [x] Add official source URL and verification timestamp to emergency_contacts.
- [x] Add Admin source URL management and require an official HTTPS source for Government-category records.
- [x] Seed six government helpline entries with linked official sources: District Control Room 0800-33444, Patrolling Police 1124, Suthra Punjab 1139, Punjab Police IGP complaints 1787, Punjab Women 1043, and LGCD 0800-02345.
- [x] Show source links and source-checked dates on public cards.
- [x] Verify production route/build and public display; Government contacts use the existing emergency-contact fetch and offline-cache path.

### (12) Local Authorities
- [x] Add public.local_authorities with bilingual names, authority type, descriptions, phones, email, address, office hours, website/map links, source URL, verified_at, sort order and active flag.
- [x] Enable RLS: anonymous visitors can read active rows only; only Super Admin can insert, update or delete.
- [x] Add updated_at and audit-log triggers.
- [x] Add public /local-authorities page with search and authority-type filters.
- [x] Add call, email, website and map actions only when a corresponding field is present.
- [x] Show official source and verification date on each authority card.
- [x] Add Super Admin create/edit/activate/deactivate management and include the records in JSON backup export.
- [x] Seed five Sadiqabad entries from official sources; omit unpublished phone/address fields rather than inventing them.
- [x] Verify production route/build, Super Admin tab wiring, RLS and public active-only visibility.

## Batch 5 — AI Chatbot (implementation deployed; final live verification pending)

- [x] Add a responsive floating chatbot to public pages; keep Admin and Owner Portal screens free of the widget.
- [x] Add a read-only `/api/chat` Cloudflare Pages Function with same-origin validation, input/history limits and best-effort per-isolate request throttling.
- [x] Connect Cloudflare Workers AI model `@cf/meta/llama-3.3-70b-instruct-fp8-fast` through the Pages `AI` binding and default AI Gateway.
- [x] Configure Workers AI bindings for both Production and Preview environments.
- [x] Read only approved public data through Supabase's publishable key and anonymous RLS: published businesses, query-matched published businesses, categories, areas, active helplines, active authorities, published news, active products/offers, current announcements and redacted public owner profiles.
- [x] Whitelist fields before sending business search results to the model; do not forward owner IDs, private profile rows, admin records or service-role credentials.
- [x] Add Roman Urdu-first instructions, prompt-injection resistance, no-action behavior and an explicit no-invention rule.
- [x] GitHub CI, automated tests, typecheck and production build passed; Cloudflare Pages production deployment succeeded.
- [ ] End-to-end live POST smoke test: verify Roman Urdu greeting, business search, helpline lookup, unknown information fallback, prompt-injection resistance and no private/Admin data disclosure.

### Batch 5 implementation notes
- No Supabase schema migration or database writes were required.
- Public directory reads use existing anonymous RLS policies and the redacted owner-profile view. That view is now `security_invoker=true` with generated public-only columns and column-level anon grants; raw phone/email and private profile fields remain inaccessible.
- The in-memory request throttle remains best-effort per Cloudflare isolate. A Cloudflare zone-level rate-limit rule is now active on POST `/api/chat`: 30 requests per 10 seconds per IP+colo, 10-second block with JSON 429; other site routes are not included.
- Workers AI is usage-based; actual inference charges depend on usage and the Cloudflare account plan.

## Batch 6 — Official Government Contacts Expansion (completed 16 November 2026)

### Government Helplines
- [x] Add Pakistan Railways Enquiry — 117, listed by the District Rahim Yar Khan official contact directory.
- [x] Add WAPDA Electricity Helpline — 118, listed by the District Rahim Yar Khan official contact directory.
- [x] Preserve all existing emergency and Government helpline entries; both additions include source URL and verification timestamp.

### Local Authorities
- [x] Add Ahmed Pur Lamma Police Station — 068-5020028.
- [x] Add Kot Sabzal Police Station — 068-5020030.
- [x] Add Bhong Police Station — 068-5020029.
- [x] Add Machka Police Station — 068-5020031.
- [x] Use the official Punjab Police Sadiqabad Circle directory as the source for all four records.
- [x] Preserve the existing five authority records; additions are separate, active records with source URL and verification timestamp.

### Verification
- [x] Verify all six new contacts are visible under the Supabase anonymous role through existing active-only RLS.

## Remaining after Batch 6
- [ ] Expand Government Helplines further only when additional numbers are confirmed by official sources.
- [ ] Expand Local Authorities further only when additional direct public contact details are officially published.

## Batch 7 — Search, Areas UI & Authority Profiles (deployed 16 November 2026; Admin acceptance pending)

### Search
- [x] Normalize search terms and searchable business text using Unicode normalization and case folding.
- [x] Search shop names, Urdu names, descriptions, addresses, categories, areas, tags and services without case-sensitive mismatch.
- [x] Apply the same normalization to search suggestions.
- [x] Add regression tests for uppercase/lowercase shop-name searches.

### Areas dropdown
- [x] Replace the native area filter with a responsive, searchable dropdown showing selected area, total available areas and matching count.
- [x] Keep all existing area slugs and search-filter URL behavior intact.

### Authority Profiles
- [x] Preserve the existing official Local Authorities office/contact directory and its data.
- [x] Add a separate Super Admin-managed Authority Profiles module for union chairmen, association leaders and government/public officers.
- [x] Support name, portrait, designation, organization, current status, authority/responsibilities, bilingual biography, contact/social links and optional source.
- [x] Let Admin select linked published businesses and independently control visibility of status, organization, authority, biography, contact and business sections.
- [x] Add public authority-profile listing and individual profile routes.
- [x] Upload portraits to the existing public storage bucket in a dedicated folder with Super Admin-only write policies.
- [x] Include authority profiles in the Admin full JSON backup and the public directory sitemap.

### Database and security
- [x] Add `public.authority_profiles` with active-only public RLS, Super Admin CRUD policies, audit/update triggers and indexes.
- [x] Add dedicated storage write policies for `authority-profiles/` in the existing public bucket.
- [x] Grant public SELECT and authenticated write privileges; explicitly revoke anon INSERT/UPDATE/DELETE and verify anon cannot write; no service-role key is used by the frontend.
- [x] Keep the existing `public.local_authorities` rows and behavior unchanged.
- [x] GitHub CI, typecheck, tests, production build and Cloudflare Pages deployment succeeded.
- [ ] Super Admin to create the first real authority profile and confirm portrait upload; no real office-holder profile was fabricated or seeded.
- [x] Add a clear desktop Civic Services menu linking separately to Local Authorities and Authority Profiles; add Authority Profiles to the public All Links footer for mobile and desktop visitors.
- [x] Add a direct public-profile preview link to each Authority Profiles Admin card.
- [x] Add an individual-profile Presentation Mode with a clean full-screen canvas, prominent portrait/name/designation, exit control and Print / Save PDF action.
- [ ] Owner / relevant office-holder to review the first genuinely sourced profile content and portrait before public publishing; no real person or biography has been invented.

## Existing functionality to preserve

- The 14 legacy imported listings with more than 2 English service entries currently have no linked owner. They were not trimmed or deleted. Admin can review them now; once a listing is linked to its owner, that owner can reduce the list to 2. Unchanged legacy arrays remain intact during unrelated owner edits; changed owner service arrays are capped at 2.
- Product catalogue starts empty; owners add and maintain their own products (up to 2 per business). Public visitors see only active products on published business listings.

- Offer limits continue to follow the configured plan values (Free 0, Basic 2, Premium 10 active offers); database enforcement now matches the active-offer count shown in the portal. A universal two-offer cap would be a separate confirmed rule change.

- Civic Announcements already exist at `/announcements`, with bilingual title/body, optional link, active date range, and Admin management permission `announcements.manage`.
- Do not replace or break Civic Announcements when adding a separate News feature unless explicitly requested.
- Keep public visibility and all approval decisions enforced by Supabase RLS/backend, not only frontend UI.

## Update rules

1. Mark a task `[x]` only after code, database/security checks (when applicable), build/tests, and deployment verification pass.
2. Keep incomplete sub-work unchecked and clearly labelled.
3. Commit roadmap updates to `main` alongside the completed task.
4. Work through user-requested improvements in batches of three; update this checklist after each verified batch and ask before starting the next batch.
5. Keep docs/ROADMAP_EXECUTION_CHECKLIST.md synchronized with detailed acceptance criteria, source register, migrations, test results and deployment references.


## Phase 2 progress — Local SEO & directory quality (17 November 2026)

- [x] Read-only audit of live business/category/area completeness and the three supplied Excel workbooks; findings are recorded in `docs/LOCAL_SEO_DATA_QUALITY_AUDIT.md`.
- [x] Sitemap now includes category detail pages only when they have at least one published business, and area detail pages only when they have at least three published businesses. The current live-data snapshot produces 10 category detail URLs and 14 area detail URLs; no business or area records were deleted or hidden from the directory.
- [x] Add regression tests for sitemap taxonomy eligibility.
- [x] Reject blank/placeholder Pakistani phone values when creating tel: or WhatsApp links; hide invalid call actions on business cards and business profiles, including the sticky mobile action and secondary phone line.
- [x] Version the sitemap edge-cache key so the previously cached pre-filter sitemap cannot continue serving stale area URLs.
- [x] Final CI passed (run 43954510510) and Cloudflare Pages production deployment succeeded (deployment c3c0e3ba-1729-4f9b-87f8-cbca75e60ed4, commit 81e9378f681f9ad82e7af680ccf4735ad9256d6d).
- [x] Browser-render the production invalid-phone business profile: HTTP 200, correct canonical URL, no tel: link, no placeholder phone display, and no Call action.
- [x] Browser-render all six owner-submitted priority routes (/categories, /emergency, /map, /news, /offers, /announcements): each returned HTTP 200 with matching canonical, unique title/description, an H1, and index-follow robots.
- [ ] Complete the remaining full route-by-route live browser audit and Google Rich Results Test.
- [ ] Offers and announcements currently have zero active records each and are correctly omitted from the sitemap; their empty pages still declare index,follow, so consider dynamic noindex until real content is published.
- [ ] Review candidate Google Places records against current business records by place ID/address/coordinates before any import. No production import, merge, rename, or deletion has been performed.
- [ ] Resolve data-quality gaps only from verified sources or owner/business submissions; no phone, address, image, or description has been invented.


## Phase 2 continuation — Empty listing-page indexability (17 November 2026)

- [x] Add a shared robots metadata helper for client-rendered pages.
- [x] Offers route starts as `noindex,follow` and switches to `index,follow` only when active offers load; fetch failures and zero active offers remain noindex.
- [x] Announcements route follows the same pattern for the currently selected announcement set; fetch failures and empty results remain noindex.
- [x] GitHub Actions CI passed for code commit `bac9261c134bc782159db8d696026ff0979fdc4a`.
- [x] Cloudflare Pages production deployment succeeded: `017a7ca2-fe39-463d-9e46-631bba2e1fbe`.
- [x] Post-deploy browser-render checks confirmed both `/offers` and `/announcements` return HTTP 200, canonical URLs, one H1, and `noindex,follow` while their active datasets are empty.


## Search keyword and favicon improvements — 17 November 2026

- [x] Homepage now targets “Sadiqabad Business Directory” with visible bilingual H1 and natural local-service copy; title/description updated.
- [x] Category index metadata now names local shop, doctor, clinic, restaurant and pharmacy intents; category and area detail pages retain dynamic location/category titles.
- [x] Supplied logo is hosted on the site domain as favicon and social/PWA logo assets. CI run 44072068947 passed and production deployment 6202c970-d2b1-406e-a991-e5b5e736f88c succeeded.
- [x] Live homepage, favicon, site-logo and manifest checks passed on production. Google Search Console recrawl request and later keyword/index coverage review remain pending; no ranking guarantee.


## New feature — Offline-first PWA (owner-requested 17 November 2026)

- [ ] Offline-first public directory and installed PWA. Detailed scope, safeguards, phases and acceptance gates: [`docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md`](docs/OFFLINE_FIRST_IMPLEMENTATION_PLAN.md).
- [x] Phase 0 audit and documentation plan drafted: current PWA install prompt/manifest already exist; current Service Worker only caches `offline.html`; emergency contacts have a limited local cache; complete directory data/media are not yet available offline.
- [x] Permanent owner-confirmed engineering and production-safety rules recorded in [`docs/PROJECT_WORKING_RULES.md`](docs/PROJECT_WORKING_RULES.md).
- [ ] Phase 1 core offline data package + app-shell caching + public directory offline reads + online-only write guards.
  - [x] Add the public `/offline-data` download manager and footer entry; it fetches and validates public businesses/categories/areas/emergency contacts, shows progress and estimated size, supports cancellation before activation, and preserves the previous snapshot on failure. Production route verified HTTP 200.
  - [x] Connect public business search/details, categories, areas, emergency contacts, homepage directory sections, favorites/recent lookups and related-business reads to the saved snapshot when the browser is offline. Offline public writes (reviews, inquiries, suggestions) now return a clear not-sent response; tracking is skipped and no offline queue is created. CI run 44118681086 passed; Pages deployment e3d48ab7-b202-43a2-8184-385ec0520686 succeeded; `/offline-data` browser-render verified HTTP 200.
  - [x] Add the initial conservative Service Worker runtime cache: cache SPA entry + emergency fallback, network-first navigation, cached SPA fallback for app routes, and first-use caching of fingerprinted same-origin JS/CSS. Preserve `/offline`; exclude API/function/Supabase traffic; do not force activate, claim clients or delete old caches. CI runs 44120063673 and 44120165303 passed; final Pages deployment 4c4647d1-e582-4250-8704-a258e15c3089 succeeded.
  - [ ] Browser-test Service Worker lifecycle, cache contents, offline reload/deep-links, stale chunks, update/rollback and IndexedDB transaction/quota/concurrency failures. Full offline acceptance remains pending.
  - [x] Initial IndexedDB snapshot store, explicit public-field mappers and snapshot validation added; GitHub CI (run 44112311265) and Pages deployment (6d404e0a-299b-4fb1-bb09-9891cb261cf2) succeeded.
  - [x] Strict public business-set verification and the download manager route are deployed; CI run 44114620453 passed and Pages deployment ba819f2f-2881-44d8-9606-54285abe6dbd succeeded.
  - [x] Public snapshot read adapters and offline-only API selection/write guards added in commits a0160b6, 63c60fd, ea7180e and 76805d8. CI run 44118681086 passed TypeScript, automated tests, production build and Edge Function checks. Pages deployment e3d48ab7-b202-43a2-8184-385ec0520686 succeeded; `/offline-data` returned HTTP 200 and rendered its download UI.
  - [ ] Browser-level IndexedDB transaction/quota/concurrency tests, Service Worker lifecycle/cache-content tests, offline reload/deep-link, stale-chunk/rollback and write-guard acceptance checks remain.
- [ ] Phase 2 remaining public content and cacheable media.
- [ ] Phase 3 safe updates, storage/quota handling and recovery.
- [ ] Phase 4 Android/iOS/desktop and airplane-mode acceptance testing.
- **Safety status:** Phase 1 now has an IndexedDB package, download manager, public read adapters, offline write guards and an initial conservative Service Worker shell/chunk cache. The Service Worker does not force activate, claim open clients or delete old caches; it reuses the v3 cache namespace for rollback compatibility with the currently deployed worker. Offline reload/deep-link and stale-chunk/rollback behavior remain unverified. Supabase remains authoritative online. No Supabase schema/data, user/business records or Cloudflare settings were changed.


### Offline-first Phase 1 — Service Worker initial caching (17 November 2026)

- [x] Add conservative SPA shell and first-use fingerprinted JS/CSS caching in `public/sw.js`; preserve the existing emergency fallback and keep network/API/private traffic out of cache.
- [x] Keep normal waiting-worker lifecycle: no `skipWaiting()`, no `clients.claim()`, and no old-cache deletion. Reuse current v3 cache key because the deployed previous worker deletes all other cache keys during rollback.
- [x] CI runs 44120063673 and 44120165303 passed; final production Pages deployment 4c4647d1-e582-4250-8704-a258e15c3089 succeeded.
- [ ] Browser-level offline reload/deep-link, cache inspection, stale chunk, worker update/rollback and IndexedDB quota/concurrency acceptance tests.

  - [x] Generate a build-time fingerprinted JS/CSS manifest and pre-cache the actual Vite app bundles on Service Worker install to support direct public-route offline navigation. Production manifest endpoint verified HTTP 200 with 75 assets (73 JS, 2 CSS); Pages deployment 9c5e9413-98d1-4568-9b3f-fe912c3e1638 succeeded.
  - [x] Strengthen offline package validation for malformed nested rows, business-offer ownership, emergency-contact field types and nested private fields; add regression tests.
  - [x] Show browser storage usage/quota where supported and clarify that some photos/news/live content may still need internet. Production /offline-data UI verified with Browser Rendering.
  - [ ] Resolve the independent high/critical npm audit CI gate. TypeScript, tests, production build and Edge Function checks passed on run 44143421511, but overall CI remains failed at npm audit --audit-level=high; exact advisory needs investigation before dependency changes.
  - [ ] Actual IndexedDB quota/transaction/concurrent-tab tests and real-browser Service Worker Cache Storage/offline deep-link/stale-chunk/rollback acceptance remain pending.

  - [x] Add offline readiness diagnostics for Service Worker, app shell, emergency fallback, all fingerprinted assets, native IndexedDB write/read/abort/concurrency and saved directory data.
  - [x] Production isolated-browser end-to-end download: 655 public businesses, 19 categories, 303 areas, 12 emergency contacts saved; offline public search/detail/category/area/emergency adapters passed with matching counts.
  - [x] Add regression test proving offline public reviews/inquiries/suggestions are not sent/saved and analytics telemetry creates no session or queued write.
  - [ ] Physical device airplane-mode reload/deep-link and Service Worker update/rollback acceptance remains. Online smoke checks for every public route and real quota-exhaustion testing also remain.
  - [ ] CI security audit remains blocked by GHSA-fc5q-39xc-vjpf (picomatch ReDoS through 4.0.7); npm audit offers only force-downgrading Vite to 6.2.7. Do not suppress the audit or apply a breaking downgrade; await a safe upstream fix.
  - [x] Cloudflare Pages production deployment 6d482311-18fe-47f6-bed0-382c0422dae7 succeeded for commit b80e6b470390fc80fba26c0111574a2e46c21a38.

- Additional production online smoke checks passed via Browser Rendering: home, search, a published crawl-only business profile (Shoe World), Restaurants category, Tibba Zahir Pir area, Emergency (1122/15), Local Authorities, Authority Profiles, /offline and /offline-data all returned rendered pages with expected page content. This validates key online public routes after the offline changes. A stale DB-backed static snapshot listing was correctly withheld when its live publication status could not be verified; no stale business data was force-shown.


## Mobile offline-download shortcut — 17 November 2026

- [x] Add a dedicated, clearly highlighted **Offline** destination to the persistent mobile bottom navigation so browser and installed-PWA users can reach `/offline-data` from any public route; retain the existing footer link and download workflow.
- [x] TypeScript, automated tests and production build passed; Cloudflare Pages deployment `057d8d2b-6e48-44df-acea-13974115c885` succeeded for commit `76ba1eee2e579aa9c5deaf9d5e3150185d1f1d3a`. The overall CI run `44154044236` remains blocked only by the pre-existing high-severity npm audit advisory; do not suppress or force-downgrade dependencies.
- [ ] Check the seven-item mobile navigation visually on a physical phone as part of the remaining Phase 1 device acceptance.


## Admin-only image uploads and offline media — 18 November 2026

- [x] Shared Admin upload control added to existing Admin image fields: directory cards (categories, areas, helplines), homepage hero, Authority profiles, admin-managed owner profile photo, News cover/gallery, sponsor campaigns and business gallery. Existing compressed business logo/cover upload retained.
- [x] New images are converted to WebP before upload with purpose-specific resizing; original file limit 15 MiB, compressed WebP limit 8 MiB. Existing Supabase public bucket reused; no new storage bucket or service-role credential.
- [x] Storage RLS allows 'site-media' writes only for authenticated Admin/Super Admin staff with the required permissions and own UID path; final RLS check enforces WebP MIME and <=8 MiB.
- [x] Owner image URL editing removed from business listing/product/offer forms; database triggers/RPCs reject owner attempts to change business, product or offer images while preserving existing images.
- [x] Offline download now prefetches referenced public business, product, offer, directory, hero, campaign, news and authority images into a separate Cache Storage namespace; Service Worker intercept is restricted to the public Supabase image bucket and existing same-origin Google image proxy.
- [x] TypeScript, 92 automated tests, production build and Edge Function checks passed; Cloudflare Pages deployment succeeded.
- [ ] Overall CI remains blocked only by the existing npm audit gate (3 high findings in picomatch/tinyglobby/Vite). Authenticated Admin upload, media cache count and physical-device offline reload remain unverified.


### Additional security hardening — public business submissions

- Public visitors do not have image upload or image URL fields in the Add Business form. The live approval RPC now explicitly inserts NULL for logo and cover URLs from public new-business submissions, so a crafted public payload cannot set either image. Admin adds images after approval.
- This final migration is applied as '20261117195404_public_submission_images_admin_only'. Existing businesses and image URLs were not changed.


### Verification update — 18 November 2026

- [x] TypeScript, automated tests (92 passing), production build and Supabase Edge Function checks passed in GitHub Actions run '44164115526'.
- [x] Cloudflare Pages production deployment '70ad68bf-c6b4-4505-85c4-19d07f075a2f' succeeded for commit '2aa09779c1993dd3dde4a3734e06b86e2ca23e4d'; canonical domain alias remains attached.
- [ ] Overall CI remains failed only at the pre-existing npm audit gate (3 high findings: picomatch, tinyglobby and Vite). No suppression or unsafe major-version downgrade was made.
- [ ] Authenticated Admin upload, compression-size observation, media Cache Storage count and physical-device airplane-mode/reload tests are still pending.

### Storage upload RLS correction — 18 November 2026

- [x] Investigated the actual failed upload in Supabase Storage logs: active Super Admin session and correct `site-media/<uid>/...` path; rejection occurred at `storage.objects` INSERT RLS.
- [x] Removed unreliable `metadata.mimetype` / `metadata.size` checks from `site_media_admin_insert`; retained authenticated-only access, exact bucket, `site-media` prefix, own UID folder and existing Super Admin/staff permission predicates.
- [x] Applied migration `20261117204927_fix_site_media_admin_insert_rls` and verified the live policy.
- [x] Client-side WebP conversion, resizing and 8 MiB compressed-file limit remain in `adminMedia.ts`. MIME/size are no longer independently enforced by Storage RLS.
- [ ] Owner to confirm a successful upload in the live Admin UI; then verify image URL persistence and `/offline-data` media caching. Public visitors and business owners remain unable to upload.


## Offline media polish — 18 November 2026

- [x] Preserve public category and helpline image URL mappings in the existing offline IndexedDB snapshot so their already-cached images can render on category and emergency cards without connectivity.
- [ ] Verify the new snapshot mapping path in CI and on a real browser/device with internet disabled; users with an older offline package must download the offline directory once again.


## Offline category image delivery correction — 18 November 2026

- [x] Root cause identified: direct cross-origin Supabase Storage image URLs cannot be fulfilled by the site's Service Worker while offline, even if the response was separately stored in Cache Storage.
- [x] Category and helpline cards now resolve approved public Storage images through the same-origin image proxy; offline download pre-caches those exact proxy URLs.
- [ ] Verify production deployment and fresh-download airplane-mode rendering on a real device.


## Admin Data Quality category filter — 18 November 2026

- [x] Add a category dropdown to the existing Data Quality monitor, with per-category business counts, an All Categories option, and an Unassigned Category option.
- [x] Existing issue chips, issue counts, listing cards, and CSV export now operate within the selected category scope; selecting All Categories preserves the previous overall view.
- [ ] Verify GitHub CI and Cloudflare Pages deployment before marking this UI change production-verified.
- No business records, category records, Supabase schema, RLS policies, or permissions were changed.


## Owner account listing assignment correction — 18 November 2026

- [x] Correct admin-create-user email validation to use the existing shared validator.
- [x] Show only unassigned businesses in the owner-creation listing selector and clear stale selection after a successful create.
- [x] Add server-side listing preflight, preserve race-safe conditional assignment, verify owner_id after update, and return actionable conflict errors with Auth-user rollback on failure.
- [ ] Verify Edge Function deployment, GitHub checks, Cloudflare Pages deployment and production read-only ownership state.
- No existing owner/business assignments or Supabase schema/RLS policies changed.


## Existing owner multi-listing management — 18 November 2026

- [x] Add a separate Manage Listings control to existing owner cards.
- [x] Support selecting multiple unassigned listings and retaining/removing that owner's current assignments.
- [x] Enforce authenticated admin permission and refuse listings assigned to another owner.
- [ ] Verify Edge Function deployment, GitHub CI and Cloudflare Pages release.
- No schema or existing ownership data changes required.


## Owner multi-listing assignment — database permission correction — 18 November 2026

- [x] Production logs identified the precise failure: PostgreSQL SQLSTATE 42501, `permission denied for schema private`, inside `public.enforce_business_plan_limits()` during the authenticated admin's conditional business owner_id update.
- [x] Applied additive migration `20261118100000_fix_business_plan_trigger_private_schema_permissions`: changed only this trigger function to SECURITY DEFINER, retained its empty search_path and existing super-admin/staff permission checks. No grants to private schema, RLS changes, or data changes.
- [x] Verified the function owner is postgres and SECURITY DEFINER is active.
- [x] Ran a transaction-level authenticated Super Admin update test for the exact selected MS Advertisement listing; trigger accepted the update. Rolled the transaction back and independently verified owner_id remains NULL.
- [ ] Owner to retry Manage Listings in the live Admin UI and confirm the real Edge Function request succeeds. This remains the end-to-end acceptance check.


## Inspire Business Academy listing enhancement — 18 November 2026

- [x] Updated the existing published listing (no duplicate): six-month programme, all 10 courses, Rs. 2,000 admission fee, Rs. 5,040 monthly lab charges including all courses, batch timings, facilities, location, contact details and 09:00–20:00 opening hours.
- [x] Existing listing remains Premium and Featured; homepage relevance ordering already prioritizes featured listings.
- [x] Added active categories `Computer & IT Training Institute` and `Education & Training Academy`; tagged the existing listing for both categories. Live SQL verification reports one matching listing in each category.
- [x] Updated directory category-count and search matching logic to recognize secondary category slugs stored in business tags. TypeScript, automated tests and production build passed in CI.
- [x] Confirmed Adeel Bhatti is the assigned owner account and his public profile has name/photo sharing enabled; the existing Business Profile page already displays the public owner profile and the existing Admin gallery workflow supports multiple listing photos. The two already-approved listing images (cover and logo) were added to gallery_urls without duplicating either URL.
- [ ] CI overall remains blocked at the existing npm audit gate (high dependency advisories in picomatch/tinyglobby/Vite); type-check, tests and build steps passed. Production Pages deployment and live browser category-page verification are pending until CI is green.
- Existing business record, owner assignment and public profile were preserved; no schema/RLS changes or duplicate listing created.


## Public News and Authority sharing — 19 November 2026

- [x] Add WhatsApp, Facebook, copy-link and supported native-share actions to individual News article and Authority Profile detail pages.
- [x] Add crawler-ready Open Graph/Twitter metadata responses for News and Authority detail URLs. News uses its cover image (first gallery image fallback); Authority uses the profile's own photo; existing site logo is the fallback when an image is absent.
- [x] Limit metadata lookup to published News articles and active Authority profiles using the existing public Supabase read access. No database schema, RLS, private records or existing content changed.
- [x] Production Pages deployment 891d235d-b897-4207-b4fc-008dcdcf9229 succeeded for code commit 3360b77aa8ec8c10c9c5b55b65c2000458dda3b9.
- [x] Live crawler-user-agent checks returned HTTP 200 and correct page-specific title, canonical URL and OG image for one News article and Farhan Iqbal's Authority profile using WhatsApp and Facebook user-agent strings; the latest Authority Urdu-description fallback was rechecked after deployment.
- [x] Live normal-browser rendering confirmed WhatsApp, Facebook and Copy link controls on both News and Authority detail pages. Authority profile rendering no longer waits for the optional related-business dataset; production deployment `e69db7ef-2085-4a61-bbb1-a2607f6d35b5` succeeded and the Authority route was rechecked after deployment.
- [ ] Actual WhatsApp app/device and Facebook Sharing Debugger preview checks, plus physical-device interaction checks, remain pending. Do not claim those external platform checks are complete.


## Advanced Admin Analytics — owner-approved 19 November 2026

- [ ] Advanced site-wide analytics and Live Visitors. Scope, security controls, phases and evidence checklist: [docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md](docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md).
- [x] Owner approved full analytics scope including Live Visitors; feature plan committed to main (commit b95c46279f8a36ae6e80000e65e3943afe62aebc).
- [x] Initial read-only audit confirmed existing business events, daily business stats, search logs, ad counters and Analytics tab. Existing Admin UI remains directory-focused; full site-wide visitors/sessions/live traffic are not yet implemented.
- [x] Deployed `track-event` v7 reviewed: JWT verification is off, service-role is server-side, CORS allowlist and rate limit exist, but rate-limit key is client-provided session ID; Origin is not authentication. Raw search text is stored in legacy `search_logs`. Hardening/design review remains required before extension.
- [ ] Complete Phase 0 RLS/grants/RPC and permission verification; do not make schema/function changes until the gate passes.

- [ ] Advanced site-wide analytics and Live Visitors. Scope, security controls, phases and evidence checklist: [docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md](docs/ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md).
- [x] Owner approved full analytics scope including Live Visitors; feature plan committed to main.
- [x] Read-only audit verified legacy analytics schemas, RLS/grants, admin_analytics RPC authorization, active-staff permission helper, deployed track-event v7 and repository source/callers.
- [x] Identified repository/deployed track-event drift: deployed v7 is less strict than repository source; client-controlled session ID rate limiting is bypassable; legacy search_logs contains raw query text.
- [x] Verified Supabase Realtime has no published tables and no realtime.messages RLS policies; it is not currently a safe/proven visitor Presence transport.
- [x] Recorded initial threat model and preferred Cloudflare Durable Object ephemeral presence design in the feature plan. No application code, DB schema, Edge Function or Cloudflare config changed.
- [ ] Phase 0 remains open: inspect SPA route lifecycle/offline exclusions, compare repo migrations with live ledger, verify Cloudflare Pages/Worker binding availability and finalize event/report contracts before schema/function work.

- [x] Further Phase 0 audit: mapped React Router public/private route groups, confirmed offline mode skips telemetry and creates no event queue, and identified search/business/ad event call sites.
- [x] Read-only Cloudflare audit: production Pages project has only the existing AI binding, one unrelated Worker script and zero Durable Object namespaces. Cloudflare docs require a separate DO Worker deployment and binding to Pages; this infrastructure has not been changed.
- [ ] Analytics Phase 0 remains open pending repo migration tree parity and reviewed separate DO Worker/Pages binding deployment sequence.


## Advanced Admin Analytics — migration and deployment audit (19 November 2026)

- [x] Compare the current repository migration directory against the live Supabase migration ledger; document differences and select a safe forward-only migration path.
- Repository currently has 47 migration SQL files; live Supabase has 67 applied migration versions through `20261118091057`. Normalized name matching found 44 corresponding names, 23 live entries without a same-named repository file and 3 repository files without a same-named live entry. Some similarly named migrations have different timestamps; do not assume their SQL is identical.
- The repository's consolidated initial baseline is not the same as the production ledger's 16 individual initial migrations. Never replay the consolidated baseline or rewrite historical migration records.
- New analytics schema work, when ready, must use a new timestamped additive migration after the latest live version and be checked against actual live object names.
- Cloudflare Pages deployment for docs commit `36fd8af2757d77001192e16b48b1611fa9aab256` is now verified successful: deployment `bc218d44-5724-4f50-b6c1-83bcbe047aa6`. This is documentation-only deployment, not an analytics release.
- Advanced Analytics implementation remains not started: no analytics schema, tracker, ingestion function, Durable Object or dashboard changes have been made. Phase 0 remains open for final event/report contract and Cloudflare edge architecture review.


## Advanced Admin Analytics — Phase 1 database foundation (19 November 2026)

- [x] Additive Supabase migration `20261119140712_site_analytics_foundation`: privacy-minimized event/session tables, RLS, indexes and `admin_site_analytics_report` SECURITY INVOKER RPC.
- [x] Additive privilege hardening migration `20261119140832_site_analytics_privilege_hardening`: service_role can insert/update/read new analytics rows but cannot delete; service_role cannot execute the admin report.
- [x] Add independent weekly 90-day retention job through migration `20261119140930_site_analytics_retention_90d`; existing legacy cleanup job was not modified.
- [x] Add atomic deduplicated event/session database RPC and private gateway-token registry primitives through `20261119141643_site_analytics_ingestion_primitives`. Registry has no active token and is not used by the current collector.
- [x] Deploy new Supabase Edge Function `track-site-analytics` v1 (`verify_jwt=false`) with 4 KiB payload cap, strict event/path allowlists, sensitive-field rejection, bot filtering, HMAC visitor/session pseudonyms, HMAC edge-IP rate-limit key and atomic event RPC. Existing `track-event` v7 remains unchanged.
- [x] Verify anon cannot SELECT the new tables or execute the report RPC; verify authenticated SELECT remains subject to `analytics.view` RLS; verify service_role cannot DELETE analytics rows or execute the report RPC.
- [x] Transaction test: first event insert and duplicate suppression yielded one event row and one session page view; transaction rolled back. Rate-limit test allowed first request and denied the second at limit 1; transaction rolled back.
- [x] Simulated unrelated authenticated user denied by report RPC; simulated active Super Admin received correctly structured empty report. No test analytics rows retained.
- [ ] Complete request-level collector smoke tests and frontend integration. No public page tracker has been enabled and no analytics events are being collected yet.
- [ ] Implement Live Visitors Durable Object and secure Pages binding; current Cloudflare Pages project has no analytics binding.
- [ ] Build advanced Analytics UI and verify production data only after privacy notice and opt-out behavior are in place.
- Advisor status after migrations: one pre-existing leaked-password-protection security warning; 30 unused-index INFO notices (7 new analytics indexes are expected to be unused before ingestion); two pre-existing multiple-permissive-policy warnings on unrelated tables.


### Advanced Analytics — frontend and Admin report (19 November 2026)

- [x] Add privacy-aware client tracker with Do Not Track / Global Privacy Control and local opt-out checks, 30-day pseudonymous visitor IDs, 30-minute sessions and offline skip.
- [x] Add global SPA page-view and active-time engagement events without blocking navigation.
- [x] Add privacy-filtered search summary and business CTA/share event integration while retaining existing legacy event tracking.
- [x] Add authorized report API and Admin Analytics dashboard: summary metrics, daily views, top pages, channels, devices, search/engagement summary and CSV export.
- [x] Verify Cloudflare Pages production deployment for commit `9c04c3c5780ea5a84dc91338044c159e695c0ceb`: build and deploy stages succeeded.
- [ ] Add explicit privacy notice/controls and complete request-level collector smoke tests before enabling `VITE_SITE_ANALYTICS_ENABLED` in production. Production tracking remains disabled.
- [ ] Build Live Visitors Durable Object, authenticated admin read path and Cloudflare binding.
- [ ] Run/verify GitHub CI typecheck, automated tests and Edge Function typecheck; Pages build success alone is not a substitute.


- [x] Add public bilingual analytics opt-out control on `/privacy`, with local preference persistence and Do Not Track / Global Privacy Control enforcement.
- [x] Enable production `VITE_SITE_ANALYTICS_ENABLED=true` only after the privacy control was deployed; Cloudflare Pages deployment for commit `b0fd6d2c203a8fba8a874c7ed4ffa06ed8a600d9` succeeded.
- [ ] Verify a real browser page view and opt-out behavior end-to-end; request-level collector smoke tests remain outstanding.
- [x] Implement Live Visitors using a permission-guarded aggregate RPC over active session heartbeats; Durable Object not needed for current scale.

- [x] Add `admin_live_visitor_count()` RPC (SECURITY INVOKER; Super Admin / analytics.view; aggregate only) and Admin KPI polling every 30 seconds.
- [x] Verify anon EXECUTE is denied and simulated Super Admin can read aggregate count. No visitor-level data is exposed.


## Advanced Analytics — verified production checkpoint (19 November 2026)

- [x] Privacy-minimized event ingestion is live; production database aggregate check: 53 events/24h (20 page views, 19 search summaries, 14 engagement), 3 sessions/24h, 1 live session in the five-minute window.
- [x] Live Visitors aggregate-only RPC and KPI deployed; no visitor-level records are exposed.
- [x] Privacy opt-out/DNT/GPC controls are deployed on `/privacy`; production collection flag is enabled.
- [x] CSV spreadsheet-formula injection protection added.
- [x] Latest code commit `d7c007660890badfa9e30a13510ec8eedaa00b21`; Pages deployment `534fa136-8ad7-4af8-8f22-752028b5973a` successful.
- [x] GitHub Actions run `44551040604`: TypeScript, automated tests, production build and Edge Function type-check all passed.
- [ ] Manual browser/opt-out walkthrough and direct collector abuse tests remain outstanding.
- [ ] Custom date range, comparison periods, visible report filters, deeper content drilldowns and expanded CSV exports remain outstanding.


## Advanced Analytics Expansion — plan approved to begin (19 November 2026)

- [x] Created [Advanced Analytics Expansion Roadmap](docs/ANALYTICS_EXPANSION_ROADMAP.md): prioritized P0 reliability/security, P1 reporting controls, P2 content/journeys, P3 audience/acquisition, P4 alerts and P5 exports/UX.
- [ ] Phase 0 re-audit and P0 browser, collector-abuse and authorization verification.
- [ ] Phase 2 custom date range, period comparison, visible filters, metric glossary/freshness and filter-scoped exports.
- [ ] Phases 3–6: content/conversion funnels, audience/acquisition, alerts and advanced exports/UX.
- Existing production analytics and legacy counters remain in place; no historical backfill or visitor-level tracking is planned.

- [x] Extract shared analytics collector envelope validation and add automated tests for PII-like fields, event names, UUIDs, engagement/search bounds and content references.
- [x] Deploy `track-site-analytics` Edge Function v4; CI run `44554526513` passed app build/tests/typecheck and Edge Function Deno check.
- [x] Reverify live analytics grants/RLS: anon read/execute denied; service_role report execute/delete denied; authenticated report access remains gated by Super Admin / `analytics.view` policies.
- [ ] Direct HTTP abuse/replay/rate-limit tests, staff permission matrix and browser privacy/lifecycle walkthrough remain open.

- [x] Extract public route allowlist into shared validator and add tests excluding Admin, Owner, auth, API, unknown, query-bearing, fragment-bearing and malformed routes.
- [x] CI passed for route-validation commit `d6a9a063995d09295268148c51b05f891afa8314`; deployed collector is Edge Function v5 (ACTIVE).


## Business share cards & organic Google Search — owner-approved (19 November 2026)

- [x] Owner approved the plan. Scope is the Hello Sadiqabad business page appearing as a conventional organic Google Search result; Google Maps / Google Business Profile creation is explicitly excluded.
- [x] Phase 0 live re-audit: 397 published businesses, 375 with at least one image URL and 22 without; anon business SELECT is limited by RLS to published rows.
- [x] Added crawler-specific Cloudflare Pages route `functions/business/[slug].js`, safe SEO/JSON-LD helpers and automated tests.
- [x] GitHub Actions run `44581326800` passed typecheck, tests, build and Edge Function checks.
- [x] Pages deployment `cdf061de-6a21-4d32-8deb-ea39013c03eb` succeeded for commit `c60031040fd95f41fb3ee35afeb2e55725507a00`.
- [x] Googlebot Browser Rendering returned HTTP 200 and page-specific title, description, canonical, real cover image URL and JSON-LD for a live published listing.
- [ ] Verify post-hydration visible content, normal-browser pass-through, invalid/unpublished crawler 404, WhatsApp/Facebook/LinkedIn crawlers and actual device previews.
- [ ] Audit sitemap sample/uniqueness, submit/inspect priority URLs in Search Console, and monitor actual index coverage. Google indexing/ranking is not guaranteed.


### Business SEO/share-card verification update — 19 November 2026

- [x] Final deployed code commit `b8f0c6d3bc2135c4cc6991fcbfd6b03fcc4ef056`; CI run `44582413841` passed all jobs; Pages deployment `73868e0a-b57f-4a60-8294-d9190c23a818` succeeded.
- [x] BusinessProfile browser metadata now uses the same SEO/JSON-LD helper as the crawler handler, preventing mismatched titles and duplicate structured-data scripts after hydration.
- [x] Googlebot post-hydration check returned the real business h1 and one JSON-LD script.
- [x] WhatsApp and Facebook crawler responses returned HTTP 200 with correct OG/Twitter image/title/description/canonical tags.
- [x] Unknown slug gives 404/noindex; normal browser user-agent pass-through verified.
- [x] Sitemap XML is HTTP 200 and contains 397 business URLs; live published table has 397 unique slugs and no duplicate slugs.
- [ ] Actual WhatsApp/Facebook app previews and LinkedIn crawler check remain pending; social platform image fetch/cache behavior must be observed separately.
- [ ] Search Console URL inspection and actual Google indexing/performance remain pending.


### Mobile business share popup fix — 19 November 2026

- [x] Shared modal layout now uses viewport-safe centered sizing on mobile, constrained flex content, touch-friendly vertical scrolling and bottom safe-area padding.
- [x] Business share popup is constrained to `max-w-md`; share actions use a compact two-column mobile grid.
- [x] Changes committed directly to `main` in `6246f7a` and `af3041a`; no database, RLS, storage, business data or sharing destinations changed.
- [ ] CI, Pages deployment and narrow-device browser verification pending; do not describe the fix as live until those checks pass.


## Chatbot public knowledge collection — Part 1
**Status: implemented, CI passed, and deployed to production (20 November 2026).**

The existing `/api/chat` and Cloudflare Workers AI integration have been retained. This part adds a public-data knowledge collection and query-specific retrieval layer; it does not fine-tune or retrain the base model.

### Public sources collected
- All published businesses are searchable through the existing public `search_businesses` RPC. Each request supplies up to 12 relevant public records and the database-reported total count; category and locality filters are applied when the query identifies them.
- All active categories and areas are cached as source data; the prompt receives a relevant subset or the complete area-name index when the user asks for areas.
- Published news articles and published static pages, with full text included only when relevant to the question.
- Active government helplines, local authorities, authority profiles, visibility-approved owner public-profile fields, active products, current offers, current announcements, and an allowlist of public site settings.
- Public navigation guide for the actual app routes, including search, categories, map, favorites, offline data, news, offers, emergency contacts, government helplines, local authorities, authority profiles, and add-business.

### Data snapshot observed during implementation
| Public source | Records |
|---|---:|
| Published businesses | 397 |
| Active categories | 22 |
| Active areas | 314 |
| Published news | 2 |
| Published static pages | 8 |
| Active emergency/government helplines | 12 |
| Active local authorities | 9 |
| Active authority profiles | 2 |
| Visibility-approved public owner profiles | 3 |
| Active products for published businesses | 1 |
| Current offers | 0 |
| Current announcements | 0 |

Counts are a live snapshot and may change as public content is updated.

### Retrieval, accuracy and privacy
- Public knowledge is cached at the edge for up to 180 seconds, then refreshed from the public database. This is live retrieval, not a model-weight training operation.
- Context is compacted for the model's 24,000-token limit. News bodies, page bodies, civic details, owner profiles, business hours, media, reviews, and offers are included only when the question needs them.
- Business results are capped at 12 per request; the exact total and applied category/area scope are passed to the assistant so it can avoid presenting a partial result as the complete directory.
- English, Urdu, and Roman Urdu category/locality intent is recognized. Category terms and locality phrases are separated to avoid false matches such as “Ghalla Mandi” versus “Anaj Mandi”.
- Business social links, WhatsApp, gallery and video fields respect the public business plan visibility rules. Owner profiles use only database-redacted public fields; owner IDs are not sent to the model.
- Only public/published/active information is included. Unpublished content, admin/owner private data, credentials, internal IDs, and private account data are excluded.
- Source-load status is passed to the assistant so an unavailable source is not misrepresented as an empty directory.
- No database migration or database write was needed.

### Verification
- Added unit tests for public-field mapping, plan visibility, owner-profile redaction, category/locality matching, compact context selection, and Roman Urdu intent.
- GitHub Actions run `44600639970`: TypeScript checks, automated tests, production build, and Edge Function type-check all passed.
- Cloudflare Pages deployment `5e76f8d4-1e2c-4702-ad38-fb3ba70a33e4`: production deployment succeeded.
- Production `/api/chat` smoke test returned HTTP 200 for a restaurant-category query and returned real business links. Area-list and latest-news queries were also smoke-tested successfully against the deployed Pages build.

### Explicitly not part of Part 1
The admin “Train / Sync Latest Information to Chatbot” button and its manual full/incremental sync controls have not been added. No separate vector database, persistent training corpus, or model fine-tuning has been introduced. Those are separate later phases and remain untouched until approved.


## Chatbot public knowledge and conversation experience — Part 2
**Status: implemented, CI passed, and deployed (20 November 2026).** Full feature plan: `docs/CHATBOT_PUBLIC_KNOWLEDGE_PLAN.md`.

- Follow-up retrieval now anchors short questions such as “aur iska address?” to the prior user query; chained follow-ups retain the original topic, while unrelated questions start a new retrieval topic.
- Business search now distinguishes exact business-name lookup from category browsing. It searches a distinctive business-name token even if the business name contains category synonyms.
- Locality matching no longer selects an area merely because a business name contains a generic token such as “school”; partial locality matching requires an explicit location cue.
- Assistant HTTP(S) and Markdown URLs render as safe clickable links; unsafe schemes are not linked.
- Chat widget has a New Chat control and accessible message/loading announcements.
- Regression tests cover follow-up context, category/business-name disambiguation, locality false positives and safe links.
- GitHub Actions run `44604061079` passed TypeScript, automated tests, production build and Edge Function checks.
- Cloudflare Pages deployment `97e8efdf-a322-41bd-8949-215e2b7766ce` succeeded for commit `83e8a86777f6db361e1b5c5bb5d3b35984331da9`.
- Canonical production API smoke test returned HTTP 200 and correctly returned Al-Buraq School & Academy's public phone number `03277056075`; the follow-up address question correctly resolved to “near Kamal medical complex, Sadiqabad”.
- No database migration or private-data access was introduced. Physical mobile/device UI verification remains outstanding.

### Chatbot Part 3 — Admin-managed public knowledge refresh
**Status: implemented, CI-passed and deployed.** Details: `docs/CHATBOT_PUBLIC_KNOWLEDGE_PLAN.md`.

- Added super-admin-only Admin Portal section `/admin/chatbot-knowledge` and the “Train / Sync Latest Information to Chatbot” control.
- Added authenticated server route `POST /api/chat/sync` and status route `GET /api/chat/sync`; both validate the Supabase user and current active Super Admin profile. POST requires same-origin.
- Full refresh reloads all 12 public knowledge sources plus the published-business count. Business records themselves continue to be searched live for each visitor question.
- Refresh only replaces the versioned public cache when all required sources load and the cache write succeeds. Failed source loads preserve the previous cache.
- Added persistent run history/progress/source results in `public.chatbot_knowledge_sync_runs`, protected by RLS for active Super Admins only. Anonymous SELECT is denied; authenticated DELETE is not granted.
- Admin UI shows last successful sync, live progress, source counts/status, recent history and error details.
- Applied Supabase migrations `20261119201013`, `20261119201034`, `20261119201234` and `20261119201810`.
- GitHub Actions run `44607374336` passed TypeScript, automated tests, production build and Edge Function checks. Cloudflare Pages deployment `f59c46e9-e0e6-494f-ad41-8cd2ddcbba26` succeeded for final commit `700dc172b70624c539373ad185ba620b538dfff5`.
- Production unauthenticated GET/POST tests returned HTTP 401. Positive full sync requires the owner to use their active Super Admin session.
- Full refresh is implemented; incremental sync, vector search and model fine-tuning are not.
- Mobile/device verification remains outstanding.

## New product expansion plan — Jobs, Schemes & Owner Portal (20 November 2026)

**Owner approved 20 November 2026. Phase 0 audit/design/documentation is authorised; feature implementation and database changes are not yet authorised.** Canonical handoff, permanent-rule quick reference and full specification: [Hello Sadiqabad Master Plan & New-Chat Handoff](docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md).

- [ ] Phase 0 — complete the authorised audit/design: confirm scope and fields, inspect admin permissions/moderation/audit logs/schema/migration ledger/RLS/storage, prepare additive data model and UX proposal, and obtain acceptance of the design before implementation.
- [ ] Phase 1 — Government Jobs MVP: Admin-managed verified jobs, public listing/detail pages, filters, deadlines, official advertisement and apply links.
- [ ] Phase 2 — Government Schemes MVP: Punjab + Federal scheme directory, benefits, source-backed eligibility/document checklists, official application/status links, scheme phase history and anti-scam guidance.
- [ ] Phase 3 — Public Add Business + Owner Registration redesign: accessible searchable bilingual area picker for 314+ areas, no default area selection, guided form, better address/contact/location details and privacy consent.
- [ ] Phase 4 — Owner Portal improvements: visible but locked Basic/Premium benefits on Free, quota/plan clarity, guided profile completion and consistent plan enforcement through RLS/RPC.
- [ ] Phase 5 — daily-use engagement: home-page latest jobs/schemes, saved items, opt-in alerts, digest and chatbot integration after source/public-field review.

Planning baseline inspected:
- Public Add Business is src/pages/AddBusiness.tsx; it currently collects business name, category, area, phone, optional WhatsApp, address, facilities, short description and submitter contact. Area is a native select that preselects the first area.
- The active area table currently contains 314 areas.
- Owner account request is /owner-register; Owner Portal navigation is src/components/owner/OwnerNav.tsx; owner page flows are in src/pages/owner/OwnerPortalPages.tsx.
- Owner listing editor src/components/owner/ListingEditor.tsx already has a multi-step flow, LocationPicker, opening-hours editor and some plan-aware locks. Current live plans: Free, Basic and Premium; the plan table is the source of truth for limits/features.
- Public new-business requests continue through existing moderation; this plan must not bypass it.
- Initial official research sources and scam-safety requirements are recorded in the feature plan.
- Owner approved the plan and authorised Phase 0 on 20 November 2026. Next: complete Phase 0 inspection/design/documentation only. No feature code, schema migration or production data change is authorised yet; obtain explicit approval before Phase 1 implementation.


---

## Government Jobs / Schemes / Owner Portal — Phase 0 checkpoint (20 Nov 2026)

- [x] Owner approval received for Phase 0 audit, requirements and design only.
- [x] Read-only audit completed against the current `main` code and live Supabase schema, migration ledger, RLS, Storage policies, plan data, permission gates and relevant Owner/Admin flows.
- [x] Detailed findings and proposed additive architecture documented in `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PHASE0_AUDIT.md`.
- [x] Owner accepted the Phase 0 design and authorised Phase 1 Government Jobs implementation.
- [x] Phase 1 MVP code committed; CI and Cloudflare Pages deployment passed.
- [x] Additive Government Jobs database table, RLS, grants, audit triggers and dedicated permission applied.
- [ ] Phase 1 final acceptance: owner/Admin creates and verifies initial official-source job entries; complete physical mobile/browser QA.
- [ ] Phase 2 Government Schemes — separately gated; not started.
- Existing businesses, submissions, owner registration, plans, security policies and migration history remain preserved.


## Government Jobs — Phase 1 implementation checkpoint (20 Nov 2026)

- [x] Public jobs listing and detail routes.
- [x] Admin create/edit/draft/publish/close/cancel/duplicate and re-verification workflow.
- [x] Dedicated `government_jobs.manage` permission in frontend and database permission RPC.
- [x] Public-only RLS, explicit table grants, HTTPS URL checks, publish verification gate, audit/update triggers.
- [x] Pakistan timezone deadline status helper and automated tests.
- [x] Public sitemap entries for published job content.
- [x] Live migration history recorded in `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md`.
- [x] CI success and Cloudflare Pages production deploy success for commit `464691c9542ae753ec4a7b320d097b72136e13ce`.
- [ ] Add first manually verified official-source job records and perform owner-side mobile UX acceptance.
- No auto-scraping or auto-publishing. Assistant may prepare drafts only when asked; Admin controls publication.


## Government Jobs — Phase 1 final implementation delta (20 Nov 2026)

Latest implementation commit: `9e86b6505737ca5d666550e9df4b3a58566a12f7` (Admin summary fields now use multiline textareas).
- [x] English summary required for publication; optional Urdu summary shown when available.
- [x] Department and job-type filters added alongside government-level, active/archive and text search.
- [x] Upcoming status uses `application_open_at` in Asia/Karachi; expired state uses Pakistan local date.
- [x] Public navigation added to desktop header, mobile bottom navigation and footer.
- [x] Admin duplicate warning added for matching ad number or same title/department.
- [x] Bilingual summary migration applied and tracked.
- [x] Latest CI passed; latest Cloudflare Pages production deployment succeeded.
- [ ] Physical mobile/browser acceptance and first manually verified official job records.


## Government Jobs — first verified entry and poster upload delta (20 Nov 2026)

- [x] Added one currently open Federal Government vacancy from the official National Jobs Portal: Network Support Consultant, Office of the Controller General of Accounts, PPS-7, Islamabad, one vacancy, minimum five years' networking experience, closing 28 November 2026. Domicile eligibility is not stated in the portal listing; the public record explicitly tells applicants to confirm it rather than assuming Punjab eligibility.
- [x] Added optional job poster upload in Admin using the existing public Storage bucket, scoped Storage RLS policies, 5 MB client-side validation and JPG/PNG/WebP/AVIF support. Image is optional and can be added later; public detail and listing cards render it when supplied.
- [x] Added nullable `government_jobs.image_url` column and tracked migration `20261120152313_government_jobs_optional_poster_image.sql`.
- [ ] Run final CI/deployment verification and owner-side browser/mobile QA. No other feature phase is claimed complete.


## Government Schemes — Phase 2 MVP implementation (20 Nov 2026)

- [x] Owner instructed that the next work begin and continue without pausing; Phase 2 implementation authorised.
- [x] Public /government-schemes directory and /government-schemes/:slug detail pages with search, Punjab/Federal, category and intake-status filters.
- [x] Admin Government Schemes manager with dedicated government_schemes.manage permission, review queue, public correction reports and revision history.
- [x] Five official-source scheme information records seeded: Apni Chhat Apna Ghar, Asaan Karobar Card, PM Youth Business & Agriculture Loan, Benazir Kafaalat and Benazir Hunarmand.
- [x] All five schemes have intake_status='unconfirmed'; the UI does not label "Apply Now" until the official intake is verified.
- [x] RLS, explicit grants, audit triggers, append-only scheme revision snapshots, report privacy and open-intake guard applied and tracked in migrations.
- [ ] Complete real-browser and physical mobile acceptance for the public and Admin routes.
- [ ] Reverify official application availability, eligibility and fees before changing any scheme intake status to open.
- [ ] Phase 3 Public Add Business + Owner Registration UX is the next feature phase in the master plan.

### Phase 1 deployment verification update (20 Nov 2026)

- [x] Anonymous-role SQL test can read the published Network Support Consultant record; its poster field is NULL until the owner uploads an image.
- [x] Government job poster Storage INSERT/UPDATE/DELETE policies are present and restricted to the `government-jobs/<auth.uid()>/` path plus Super Admin or `government_jobs.manage`.
- [x] Supabase Security Advisor reported no new Government Jobs/Storage finding. Existing unrelated findings remain: private analytics gateway token table with no policy (INFO) and leaked-password protection disabled (WARN).
- [x] Cloudflare Pages production deployment `73263626-a9f9-43ba-a4df-f0a33dca493d` succeeded with alias `https://hellosadiqabad.com`; it includes the optional poster upload code and the latest code state before docs-only Phase 2 handoff updates.
- [ ] Physical mobile/browser acceptance remains outstanding. Web browsing tool could not fetch the production detail URL; do not claim browser rendering verified.
- GitHub combined commit status did not expose check results in this run; Pages `npm run build` succeeded. Do not mark unit tests/typecheck/CI independently passed.


### Phase 2 verification evidence (20 Nov 2026)
- [x] Supabase anonymous-role SQL returned five published scheme records.
- [x] Draft visibility test returned zero to anon; unauthorised authenticated scheme insert was rejected by RLS.
- [x] Anonymous/authenticated public correction report inserts succeeded in rolled-back tests; non-admin report read returned zero.
- [x] Security Advisor showed no new Government Schemes finding; Performance Advisor showed no unindexed foreign keys after adding indexes.
- [x] Final Cloudflare Pages deployment ec963236-1709-4eee-9618-59185c891b96 succeeded with production alias after the latest UI refinements; npm run build passed.
- [ ] GitHub TypeScript/unit-test CI status not independently verified (combined status endpoint returned no check details).
- [ ] Production browser fetch and physical mobile QA remain outstanding.
