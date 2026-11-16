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
- [ ] Verify live production ad impressions/clicks after deploy.

### (11) Government Helplines
- [x] Preserve existing emergency contacts and offline cache.
- [x] Add Government category and dedicated `/government-helplines` route.
- [x] Add `source_url` and `verified_at` to the existing `emergency_contacts` table.
- [x] Require an official HTTPS source URL for new Government-category records.
- [x] Display official source and verification date.
- [x] Admin can add/edit/activate/deactivate records.
- [x] Seed six sourced entries: District Control Room 0800-33444, Punjab Highway Patrol 1124, Suthra Punjab 1139, IGP Complaint Center 1787, Punjab Women 1043, and LGCD 0800-02345.
- [ ] Verify the live page and offline cache after deployment.

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
- [ ] Verify live route and Admin CRUD after deployment.

## Database migration

- [x] Applied: `20261116044916_enhance_ads_and_add_government_directories`.
- [x] Recorded in repository: `supabase/migrations/20261116044916_enhance_ads_and_add_government_directories.sql`.
- [x] No existing business, owner, ad or emergency contact rows deleted.
- [x] Anonymous RLS check: five active authority rows visible; inactive rows not visible.
- [x] Owner write check: INSERT denied by RLS.
- [x] Super Admin INSERT tested successfully in a rolled-back transaction.
- [x] No RLS test records persisted.
- [x] Safe internal ad destination `/business/sample` passed database constraint in a rolled-back test.
- [x] Protocol-relative `//evil.example/path` rejected by database constraint.

## Official source register

### Government helplines
- District Rahim Yar Khan Control Room (0800-33444) and Punjab Highway Patrol (1124): https://rykhan.punjab.gov.pk/contact_us
- Suthra Punjab 1139: https://suthra.punjab.gov.pk/complaint.php
- Punjab Police IGP Complaint Center 1787: https://www.punjabpolice.gov.pk/IGP-Complaint-Cell
- Punjab Women Helpline 1043: https://pcsw.punjab.gov.pk/system/files/PGPR-2023%20%26%202024-Web.pdf
- Punjab LGCD 0800-02345: https://lgcd.punjab.gov.pk/facilities_available_for_obtaining_information

### Local authorities
- Municipal Committee Sadiqabad: https://mcsadiqabad.lgpunjab.org.pk/
- Punjab Police Sadiqabad Circle and station numbers: https://punjabpolice.gov.pk/node/3549
- Tehsil Council Sadiqabad official listing: https://lgcd.punjab.gov.pk/district-rahim-yar-khan

## Batch completion record

- Batch 4 approval: user approved on 16 November 2026.
- Code status: implemented.
- Database status: additive migration applied and RLS smoke checks passed.
- CI status: typecheck, automated tests, production build and Edge Function typecheck passed on commit `8d826f12cf78137e6c71ad756ca1a7ad7811c9e8`; subsequent docs/source corrections are being rebuilt.
- Cloudflare production deployment: pending final verification.
- Next batch: Read-only Roman Urdu-first AI chatbot; do not start until user approves.
