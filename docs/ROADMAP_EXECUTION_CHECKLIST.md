# Hello Sadiqabad — Roadmap Execution Checklist

Last reviewed: 17 November 2026

This is the detailed execution companion to `PROJECT_ROADMAP.md`. The roadmap remains the status source of truth. This document preserves acceptance criteria, dependencies, official source provenance, migrations and verification evidence so a later batch does not silently omit requirements.

## Operating rules

- Work directly on GitHub `main`; no branches or pull requests.
- Work only on the batch the user approved. Ask before beginning the next batch.
- Inspect current code, database schema, RLS and migrations before changes.
- Use additive database changes; never delete or overwrite existing directory records without approval.
- Public helpline/authority records must retain official source URLs and verification dates.
- Never invent a direct phone, street address, office hours or named office-holder.
- Keep unapproved/inactive records private through database RLS, not just UI conditions.
- Run typecheck, automated tests, production build, RLS checks and Cloudflare deployment verification.
- Check off roadmap tasks only after the corresponding acceptance criteria and deployment pass.

## Completed batches

### Batch 1
- [x] (1) News in mobile bottom navigation.
- [x] (2) Multiple images and YouTube URL in News articles.
- [x] (3) 16:9 image-management cards (40% image / 60% details).

### Batch 2
- [x] (4) Admin editor state retained across Admin tabs and browser-tab returns.
- [x] (5) Owner products, services and offers require database-enforced Admin approval.
- [x] (6) Owner selects businesses displayed on public owner profile.

### Batch 3
- [x] (7) Category listing count enlarged, bold and right-aligned.
- [x] (8) Supplied logo applied to header, favicon, Apple touch icon and PWA manifest.
- [x] (9) Helpline name and phone centered/enlarged in right 60% of 16:9 cards.

## Batch 4 — user approved

### (10) Sponsor Ads enhancements
- [x] Admin summary: live campaigns, pending review, impressions, clicks and overall CTR.
- [x] Search campaigns by title, sponsoring business and notes.
- [x] Filter campaigns by lifecycle status and placement.
- [x] Display scheduled and date-expired labels based on dates without mutating stored status.
- [x] Show creative preview, sponsoring business, placement, schedule and CTR.
- [x] Add `emergency_banner` and `authorities_banner` placements.
- [x] Render civic ads on Government Helplines and Local Authorities pages using shared AdBanner.
- [x] Respect global `ads_enabled` setting.
- [x] Validate creative image URLs as HTTPS.
- [x] Allow HTTPS destinations and safe same-site single-slash paths; block `//host` redirects.
- [x] Update only campaign fields so stale Admin form state cannot overwrite impression/click counters.
- [x] Extend database placement and target URL constraints.
- [x] Production code/deployment verified; no ad campaigns exist yet, so live impression/click telemetry will be exercised when the first campaign is activated.

### (11) Government Helplines
- [x] Preserve existing emergency contacts and offline cache.
- [x] Add Government category and dedicated `/government-helplines` route.
- [x] Add `source_url` and `verified_at` to the existing `emergency_contacts` table.
- [x] Require an official HTTPS source URL for new Government-category records.
- [x] Display official source and verification date.
- [x] Admin can add/edit/activate/deactivate records.
- [x] Seed six sourced entries: District Control Room 0800-33444, Patrolling Police 1124, Suthra Punjab 1139, IGP Complaint Center 1787, Punjab Women 1043, and LGCD 0800-02345.
- [x] Production page/build verified; government entries use the existing emergency-contact fetch/cache path. No separate airplane-mode runtime simulation was run.

### (12) Local Authorities
- [x] Create `public.local_authorities` with bilingual fields, type, description, phone(s), email, address, office hours, website/map links, source URL, verification date, sort order and active flag.
- [x] RLS: anon sees active rows only; authenticated users see active rows; only Super Admin can manage records.
- [x] Add updated-at and audit-log triggers.
- [x] Add public `/local-authorities` directory with search and type filters.
- [x] Display contact actions only when a field is present.
- [x] Display official source and last-verified date.
- [x] Add Super Admin CRUD/activation interface.
- [x] Include Local Authorities in the Admin JSON backup.
- [x] Seed five sourced records: Municipal Committee Sadiqabad, SDPO Sadiqabad Circle, City Sadiqabad Police Station, Saddar Sadiqabad Police Station and Tehsil Council Sadiqabad.
- [x] Leave the Tehsil Council direct phone blank because the cited official directory does not publish one.
- [x] Production route/build and Super Admin manager wiring verified; RLS tested directly against Supabase.

## Database migration

- [x] Applied: `20261116044916_enhance_ads_and_add_government_directories`.
- [x] Applied follow-up source correction: `20261116051134_verify_official_government_helpline_sources`.
- [x] Both migrations are recorded with matching filenames under `supabase/migrations/`.
- [x] No existing business, owner, ad or emergency contact rows deleted.
- [x] Anonymous RLS check at Batch 4: five active authority rows visible; inactive rows not visible.
- [x] Batch 6 anonymous RLS check: all four newly seeded police stations are visible as active rows; no private/inactive rows were exposed.
- [x] Batch 6 anonymous RLS check: both newly seeded Government helplines are visible as active rows with source provenance.
- [x] Owner write check: INSERT denied by RLS.
- [x] Super Admin INSERT tested successfully in a rolled-back transaction.
- [x] No RLS test records persisted.
- [x] Safe internal ad destination `/business/sample` passed database constraint in a rolled-back test.
- [x] Protocol-relative `//evil.example/path` rejected by database constraint.

## Official source register

### Government helplines
- District Rahim Yar Khan Control Room (0800-33444) and Patrolling Police (1124): https://rykhan.punjab.gov.pk/contact_us
- Suthra Punjab 1139: https://suthra.punjab.gov.pk/complaint.php
- Pakistan Railways Enquiry 117 and WAPDA Electricity Helpline 118 (District Rahim Yar Khan official contact directory): https://rykhan.punjab.gov.pk/contact_us
- Punjab Police IGP Complaint Center 1787: https://www.punjabpolice.gov.pk/contact_details
- Punjab Women Helpline 1043: https://pcsw.punjab.gov.pk/system/files/PGPR-2023%20%26%202024-Web.pdf
- Punjab LGCD 0800-02345: https://lgcd.punjab.gov.pk/facilities_available_for_obtaining_information

### Local authorities
- Municipal Committee Sadiqabad: https://mcsadiqabad.lgpunjab.org.pk/
- Punjab Police Sadiqabad Circle and station numbers (SDPO, City, Saddar, Ahmed Pur Lamma, Kot Sabzal, Bhong and Machka): https://punjabpolice.gov.pk/node/3549
- Tehsil Council Sadiqabad official listing: https://lgcd.punjab.gov.pk/district-rahim-yar-khan

## Batch completion record

- Batch 4 approval: user approved on 16 November 2026.
- Code status: implemented and deployed.
- Database status: additive migration applied; RLS smoke checks passed.
- Active records after Batch 6: eight Government-category helplines and nine Local Authorities.
- Data caveat: older District Control Room number 068-9230389 was retained but deactivated because the current official district page did not confirm it; no existing rows were deleted.
- CI status: final GitHub Actions run 43808174348 succeeded for commit 69ad062d984f6f4bcc5e59cc1ca3dc480febc2eb.
- Cloudflare production deployment: b628632c-60c2-491b-bf5c-0025a67683c2 succeeded; preview URL https://b628632c.hello-sadiqabad-2bs.pages.dev and canonical site https://hello-sadiqabad-2bs.pages.dev.
- Ads telemetry caveat: no ad campaigns currently exist in production, so the tracking code is deployed but real campaign clicks/impressions will be observed after an ad is activated.
- Batch 6 approval: user authorized continuation on 16 November 2026.
- Batch 6 implementation: four additional police-station records inserted additively into `public.local_authorities`, plus two official helpline records inserted into `public.emergency_contacts`; no existing rows were changed and no schema migration was needed.
- Batch 6 sources: official Punjab Police Sadiqabad Circle directory, https://punjabpolice.gov.pk/node/3549; District Rahim Yar Khan official contact directory, https://rykhan.punjab.gov.pk/contact_us.
- Batch 6 records: Ahmed Pur Lamma (068-5020028), Kot Sabzal (068-5020030), Bhong (068-5020029), Machka (068-5020031), Pakistan Railways Enquiry (117), and WAPDA Electricity Helpline (118).
- Batch 6 verification: Supabase anonymous-role queries returned all six active records with their source URLs and verification timestamps; existing active-only RLS remained effective.
- Batch 6 is data-only; no application code or Pages deployment was required.
- Next: continue only with additional government contacts when a direct official source confirms them. Batch 5 chatbot live acceptance remains pending user testing.


## Batch 5 — Read-only Roman Urdu-first AI Chatbot (implementation deployed; live acceptance pending)

### Scope and implementation
- [x] Add a floating, mobile-responsive chatbot widget to public AppShell pages.
- [x] Hide the chatbot on Admin routes and authenticated Owner Portal routes; retain it on public owner profile pages.
- [x] Add the Cloudflare Pages Function endpoint `POST /api/chat`.
- [x] Restrict the endpoint to same-origin browser requests when an Origin header is present.
- [x] Validate message roles and payload shape; cap each message at 500 characters and conversation history at 8 messages.
- [x] Add a best-effort per-isolate throttle of 12 requests per 5 minutes per IP.
- [x] Use Workers AI model `@cf/meta/llama-3.3-70b-instruct-fp8-fast` through Cloudflare's Workers AI binding and default AI Gateway.
- [x] Configure the Pages `AI` binding for both Production and Preview environments.
- [x] Use the existing Supabase project URL and publishable key only; no service-role key, secret or new database credential is introduced.
- [x] Read only through the existing anonymous/public Supabase RLS policies.
- [x] Include public categories, areas, active Government Helplines, active Local Authorities, published News, active products/offers, active Civic Announcements and field-redacted public owner profiles.
- [x] Add query-based business retrieval through the existing public `search_businesses` RPC. Only an explicit safe-field allowlist is passed to the model; owner IDs, owner-only data, plans, internal records and Admin-only data are excluded.
- [x] Bound long descriptions and News excerpts to keep model context and usage under control.
- [x] Add Roman Urdu-first system instructions, treat database text as untrusted input, resist prompt injection, prohibit actions/tool use and require an explicit unavailable-information response instead of guessing.
- [x] No Supabase migration or database write was required.

### Security and data-integrity review
- [x] Published business retrieval is limited by the existing `businesses_anon_read` RLS policy.
- [x] Product and offer reads are constrained by existing active/public RLS policies and their published-business checks.
- [x] News is limited to published rows with a non-future `published_at`.
- [x] Government Helplines and Local Authorities are limited to active rows by anonymous RLS.
- [x] Public owner information is sourced only from `owner_public_profile_directory`, which redacts fields according to Admin-controlled visibility flags.
- [x] The chatbot has no code path for inserting, updating, deleting, approving, booking, calling or messaging.
- [x] Prompt history accepts only `user` and `assistant` roles; browser callers cannot submit a custom system role.
- [ ] The current in-memory IP throttle is per-isolate best effort, not a distributed/global limit. Add a Cloudflare WAF rate-limiting rule if stronger production enforcement is required.

### Verification record
- [x] Direct model smoke test: selected Llama 3.3 70B Fast returned a short Roman Urdu greeting; response usage was lower than the initial reasoning-model candidate in this check.
- [x] GitHub Actions CI run: `43825635321` — success for code commit `05a8668fbea9cc38f4d278af2bf5f1e014e0449c`.
- [x] Cloudflare Pages deployment for code commit `05a8668fbea9cc38f4d278af2bf5f1e014e0449c`: `5ec40ad1-7c8b-4ce1-bbda-cc9a40c17f23` — deploy stage succeeded.
- [ ] End-to-end POST request against the live Pages Function could not be executed from the current verification environment. User acceptance smoke test is still required for: Roman Urdu greeting, query-matched business, Government Helpline number, missing-data fallback, prompt injection and private/Admin data non-disclosure.
- [ ] Confirm actual chatbot interaction on the public website before marking Batch 5 complete.

### Operational notes
- Workers AI inference is usage-based; actual charges depend on usage and the Cloudflare account plan.
- The public directory context is edge-cached for 180 seconds. Search-specific business matches are fetched separately for the user's latest question.
- The chatbot is informational only and must not be expanded into an action-taking agent without separate approval.

## Batch 7 — Search, Areas UI & Authority Profiles (16 November 2026)

### Search acceptance
- [x] Shared normalization helper applies NFKC, case folding, diacritic normalization and whitespace/punctuation normalization.
- [x] Public directory search matches normalized query tokens against shop names, Urdu names, descriptions, addresses, category/area labels, tags and services.
- [x] Search suggestions use the same case-insensitive normalization.
- [x] Regression tests cover uppercase and lowercase versions of the same shop name.
- [ ] GitHub CI must pass the new tests, typecheck and production build before batch completion.

### Areas dropdown acceptance
- [x] Replace the native Area select in public search filters with a styled searchable dropdown.
- [x] Show selected area, available-area count, live matching count, and an All Areas option.
- [x] Preserve area slugs in URL filters and existing search behavior.
- [ ] Verify the dropdown in production on mobile and desktop after deployment.

### Authority Profiles data model
- [x] Preserve `public.local_authorities` as the separate directory of government office contact points; no existing authority row was changed.
- [x] Create `public.authority_profiles` for named individuals such as Press Club Chairman, Lawyers Association President, Ghalla Mandi Chairman, Auto Union President and government officers.
- [x] Profile fields: English/Urdu name, photo URL, designation, organization/union, current status label, authority/responsibilities, bilingual bio, phone, email, website, Facebook, Instagram, linked published business IDs, source URL, sort order and active status.
- [x] Add Admin-controlled display toggles for status, organization, authority, bio, contact details and linked businesses.
- [x] Add public listing route `/authority-profiles` and detail route `/authority-profiles/:slug`.
- [x] Add Super Admin-only Admin navigation and create/edit/publish/hide manager.
- [x] Allow portrait uploads (JPG/PNG/WebP/AVIF, max 5 MB) to the existing public `Hello Sadiqabad` bucket under `authority-profiles/`.
- [x] Include profiles in the full JSON backup and add the profile directory to the sitemap.
- [x] Cross-link authority profiles from the existing Local Authorities public page.

### Database migrations and security
- [x] Applied `20261116110000_create_authority_profiles`.
- [x] Applied `20261116112000_index_authority_profile_audit_users`.
- [x] Applied `20261116113000_restrict_authority_profile_anon_write`.
- [x] Enable RLS; anonymous visitors can read active profiles only.
- [x] Authenticated users can read active profiles; Super Admin can read inactive profiles and manage all profile records.
- [x] Insert/update/delete policies require `private.is_super_admin()`.
- [x] Public SELECT and authenticated write grants added explicitly for the new public table (Data API exposure no longer assumed from schema alone).
- [x] Explicitly revoke anon INSERT/UPDATE/DELETE; `has_table_privilege` verified anon SELECT=true and anon INSERT/UPDATE/DELETE=false.
- [x] Add updated-at and audit-log triggers.
- [x] Storage write policies restrict insert/update/delete to Super Admins and the `Hello Sadiqabad/authority-profiles/` folder.
- [x] Database schema and policies verified directly; anonymous-role read query returned no rows because no profile records have been created yet.
- [x] Supabase security advisor reported no new findings for this migration; existing owner profile security-definer view and leaked-password protection warnings remain pre-existing.
- [x] Add indexes for created_by and updated_by; remove unused GIN index on business_ids.
- [x] GitHub Actions CI run 43830226159 succeeded for final application commit `192e349129e42a61032fd52f63a323b76f247d6e` (edge-functions and build jobs).
- [x] Cloudflare Pages production deployment `f7456c2d-dbae-49f8-b33e-e4713c39f311` succeeded for final application commit `192e349129e42a61032fd52f63a323b76f247d6e`; canonical site https://hello-sadiqabad-2bs.pages.dev.
- [ ] Super Admin to test the first portrait upload and create a real profile after entering verified person details; no public person has been seeded or invented.

### Batch 7 status
- Implementation and database migrations are on `main` and deployed to production.
- GitHub CI, TypeScript typecheck, automated tests and production build passed.
- Supabase RLS test confirmed anon sees active test rows only; inactive test rows were hidden and transaction was rolled back.
- Supabase privilege test confirmed anon can SELECT but cannot INSERT, UPDATE or DELETE; authenticated Super Admin write grants remain in place behind RLS.
- Security Advisor reported no new findings from this batch; the existing `owner_public_profile_directory` security-definer view and leaked-password protection warnings are pre-existing.
- Public profiles remain empty until the Admin enters a real office-holder's details and photo; no person was fabricated.
- The existing Local Authorities office/contact directory and records remain intact.
- Chatbot Batch 5 live acceptance is still pending user testing.


## Batch 8 — Local SEO and contact-data integrity (17 November 2026)

### Read-only audit
- [x] Audit the 223 published listings for missing/placeholder phone, missing address/area/coordinates, thin descriptions and missing custom SEO fields.
- [x] Audit 374-row crawler export, 771-row seed workbook and 204-row locality workbook for duplicate title/phone candidates, place-ID uniqueness, city relevance and area-name scope.
- [x] Record the evidence, import safeguards and follow-up priorities in `docs/LOCAL_SEO_DATA_QUALITY_AUDIT.md`.
- [x] No live directory records were inserted, updated, renamed, merged, deactivated or deleted.

### Indexable local taxonomy
- [x] Add a tested sitemap eligibility helper: categories require at least one published listing; area pages require at least three.
- [x] Apply the eligibility filter to both taxonomy index routes and detail URL generation in the sitemap (not just the index-page check).
- [x] Verify deployed production sitemap responds 200 and contains 169 URLs in the current snapshot, including 10 category detail URLs and 14 area detail URLs; no search URL was present.
- [x] Existing area/category records remain available to directory filters and direct navigation; sitemap eligibility is not a database visibility or deletion rule.

### Contact data integrity
- [x] Add `isValidPkPhone` and prevent empty/zero/all-zero phone values from producing telephone or WhatsApp destinations.
- [x] Hide invalid primary/secondary call actions on business cards and business profiles; keep directions and other available actions intact.
- [x] Add automated tests for empty, zero, all-zero, mobile, landline and emergency-code cases.

### Verification
- [x] GitHub Actions CI run 43954510510 passed (TypeScript, automated tests, production build and Edge Function typecheck).
- [x] Cloudflare Pages deployment `c3c0e3ba-1729-4f9b-87f8-cbca75e60ed4` succeeded for commit `81e9378f681f9ad82e7af680ccf4735ad9256d6d` (includes sitemap cache-key version bump).
- [x] Browser-rendered production sitemap verification returned HTTP 200 and 169 `<loc>` entries, including 14 `/area/` and 10 `/category/` entries.
- [x] Browser-rendered production invalid-phone business profile returned HTTP 200 with canonical URL, no `tel:` links, no placeholder phone text, and no Call action.
- [x] Browser-rendered `/categories`, `/emergency`, `/map`, `/news`, `/offers`, and `/announcements`: all returned HTTP 200, matching canonical URLs, populated titles/descriptions, an H1, and `index,follow` robots.
- [ ] The offers and announcements datasets currently have zero active rows; they are omitted from the sitemap, but their empty routes still send `index,follow`. Add dynamic `noindex,follow` until active content exists.
- [ ] Full public-route crawl and Google Rich Results Test remain pending.


## Batch 9 — Empty offers and announcements indexability (17 November 2026)

- [x] Shared SEO helper supports explicit robots directives and dynamic indexability updates.
- [x] Empty/error Offers page returns to `noindex,follow`; active offer data changes it to `index,follow,max-image-preview:large`.
- [x] Empty/error Announcements page returns to `noindex,follow`; non-empty result set changes it to `index,follow,max-image-preview:large`.
- [x] GitHub Actions CI run 43956280854 passed.
- [x] Cloudflare Pages deployment 017a7ca2-fe39-463d-9e46-631bba2e1fbe succeeded.
- [x] Post-deployment browser-render checks confirmed both routes return HTTP 200, correct canonical URL, one H1, and `noindex,follow` while empty.


## Batch 10 — Cross-workbook Places reconciliation review (17 November 2026)

- [x] Reconcile the crawler export (374 rows) and New Seed Data (771 rows) by Google Place ID.
- [x] Confirm 1,145 combined rows, 1,109 likely Sadiqabad records, 36 geographic-review rows, 1,028 unique nonblank Place IDs, and 117 repeated IDs across files (234 participating rows).
- [x] Reconfirm live published-business completeness with read-only SQL: 223 published; 49 without area; 15 without primary phone; 7 without coordinates; 33 without address.
- [x] Inspect live `public.businesses` schema; it has no Google Place ID column, so direct exact-ID matching to current production records is not yet possible.
- [x] Generate the staged review workbook `Hello_Sadiqabad_Business_Data_Audit.xlsx`; no production records changed.
- [x] Update `docs/LOCAL_SEO_DATA_QUALITY_AUDIT.md` and `docs/NEW_CHAT_HANDOFF.md` with the findings and matching limitation.
- [ ] Complete read-only candidate matching against the 223 published businesses using normalized name, phone, address and coordinate proximity; manually review ambiguous cases.
- [ ] Only after review, propose an import/correction batch. No production import or schema change is authorized by this audit.
