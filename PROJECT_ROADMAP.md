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
