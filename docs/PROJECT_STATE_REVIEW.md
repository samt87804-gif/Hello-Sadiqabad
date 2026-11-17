# Hello Sadiqabad — Current Project State

Last reviewed: 16 November 2026

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
- Phase 0 documentation is the only change in this update. No application code, database schema/data, user/business records, Cloudflare settings or online visitor behavior changed.
