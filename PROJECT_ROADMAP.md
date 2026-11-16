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
- Targeted live browser checks passed for homepage collaboration credit/banner, sitemap, robots, search noindex, news, business and category metadata/schema. Full-site crawl and Google Rich Results Test remain pending.
- Owner's next manual task: submit `https://hellosadiqabad.com/sitemap.xml` in Search Console → Sitemaps, then inspect important URLs and request indexing.

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
