# Hello Sadiqabad — Roadmap Execution Checklist

Last reviewed: 16 November 2026

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
- [x] Anonymous RLS check: five active authority rows visible; inactive rows not visible.
- [x] Owner write check: INSERT denied by RLS.
- [x] Super Admin INSERT tested successfully in a rolled-back transaction.
- [x] No RLS test records persisted.
- [x] Safe internal ad destination `/business/sample` passed database constraint in a rolled-back test.
- [x] Protocol-relative `//evil.example/path` rejected by database constraint.

## Official source register

### Government helplines
- District Rahim Yar Khan Control Room (0800-33444) and Patrolling Police (1124): https://rykhan.punjab.gov.pk/contact_us
- Suthra Punjab 1139: https://suthra.punjab.gov.pk/complaint.php
- Punjab Police IGP Complaint Center 1787: https://www.punjabpolice.gov.pk/contact_details
- Punjab Women Helpline 1043: https://pcsw.punjab.gov.pk/system/files/PGPR-2023%20%26%202024-Web.pdf
- Punjab LGCD 0800-02345: https://lgcd.punjab.gov.pk/facilities_available_for_obtaining_information

### Local authorities
- Municipal Committee Sadiqabad: https://mcsadiqabad.lgpunjab.org.pk/
- Punjab Police Sadiqabad Circle and station numbers: https://punjabpolice.gov.pk/node/3549
- Tehsil Council Sadiqabad official listing: https://lgcd.punjab.gov.pk/district-rahim-yar-khan

## Batch completion record

- Batch 4 approval: user approved on 16 November 2026.
- Code status: implemented and deployed.
- Database status: additive migration applied; RLS smoke checks passed.
- Active records: six Government Helplines and five Local Authorities.
- Data caveat: older District Control Room number 068-9230389 was retained but deactivated because the current official district page did not confirm it; no existing rows were deleted.
- CI status: final GitHub Actions run 43808174348 succeeded for commit 69ad062d984f6f4bcc5e59cc1ca3dc480febc2eb.
- Cloudflare production deployment: b628632c-60c2-491b-bf5c-0025a67683c2 succeeded; preview URL https://b628632c.hello-sadiqabad-2bs.pages.dev and canonical site https://hello-sadiqabad-2bs.pages.dev.
- Ads telemetry caveat: no ad campaigns currently exist in production, so the tracking code is deployed but real campaign clicks/impressions will be observed after an ad is activated.
- Next batch: Read-only Roman Urdu-first AI chatbot; do not start until user approves.


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
