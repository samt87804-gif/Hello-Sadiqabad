# Final Product Expansion — Phase 0 Audit & Design

**Audit date:** 25 November 2026  
**Repository:** `samt87804-gif/Hello-Sadiqabad`  
**Branch:** `main`  
**Audited HEAD:** `a310577362fde1d5ce15ecc1fed507cf0a72d668`  
**Supabase project:** Hello Sadiqabad (`efwohfzqitevkuybnyif`, ACTIVE_HEALTHY, PostgreSQL 17.11)  
**Scope:** Read-only inspection for the owner-approved Final Product Expansion Master Plan. No application code, production data, schema, Storage objects, Auth settings or deployment configuration was changed during this audit.

## 1. Executive result

The approved expansion is feasible by extending the current app. The existing Government Jobs, Government Schemes, Local Authorities, Authority Profiles, Add Business, Owner Registration and Owner Portal features are present and must remain the foundation.

The audit found three major engineering constraints:

1. **Admin performance is primarily an application loading/rendering problem, not an obviously slow business-list SQL query.** The Admin page currently launches a broad batch of unrelated data requests on every tab load, eagerly bundles large Admin managers, fetches every business with all joined columns, and renders all filtered business cards at once. Data Quality repeats category-wide scans and renders every matching issue.
2. **The current Storage bucket is public.** Pending business or government media cannot be made private merely by putting files in a special folder inside that bucket. A separate private pending-media bucket is required; approved assets can then be promoted to the existing public bucket.
3. **The live Supabase migration ledger differs materially from the repository migration filenames.** Do not replay the baseline, run `db push`, or infer that a repository migration has/has not been applied from filename alone. Every future migration needs exact live-ledger reconciliation and a reviewed additive SQL plan.

No unresolved design-level access boundary remains if the private pending-media bucket, separate private employer/candidate records and server-side owner eligibility/quota enforcement described below are followed. Browser-level desktop interaction timing could not be collected in this tool session; only source-level and database-query baselines are available. That limitation remains an acceptance item for Phase 1.

## 2. Repository and CI baseline

- Current `main` HEAD at audit: `a310577362fde1d5ce15ecc1fed507cf0a72d668`.
- Current CI run for that HEAD: [GitHub Actions run 45581182349](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45581182349), completed successfully.
- Both CI jobs passed:
  - Build job: `npm ci`, dependency audit gate, TypeScript typecheck, automated tests and production build.
  - Edge Functions job: Deno typecheck for Supabase Edge Functions.
- This was a documentation-only commit. It is not evidence that any of the new expansion features have been implemented.
- Cloudflare Pages deployment for this exact HEAD was not verified during this audit. Do not claim it is deployed based only on GitHub CI.
- Production canonical domain remains `https://hellosadiqabad.com`; deployment instructions identify Cloudflare Pages project `hello-sadiqabad`, branch `main`.

## 3. Live database and migration audit

### 3.1 Project state and table/RLS baseline

- Supabase project status: `ACTIVE_HEALTHY`, PostgreSQL 17.11.
- Live estimated/observed record counts from database statistics / table inspection:
  - Businesses: approximately 698 in table statistics; the full joined business query returned 697 rows at audit time.
  - Categories: 30.
  - Areas: 315.
  - Submissions: 16.
  - Owner registration requests: 3.
  - Government Jobs: 1.
  - Government Schemes: 5.
  - Local Authorities: 9.
  - Authority Profiles: 2.
  - Audit logs: approximately 3,293.
- These counts are a snapshot, not a promise that the data remains unchanged.
- A direct catalog check found **no public base table with RLS disabled**. RLS is enabled on all inspected public tables.
- Public read policies for Businesses, Government Jobs, Government Schemes, Local Authorities and Authority Profiles are status/active gated. Owner registration requests permit public INSERT only with pending/unreviewed state; Admin read is permission-gated. Submission review is permission-gated and owner submission reads are scoped.
- Do not widen any existing public policy to implement the new requirements. Use dedicated least-privilege policies and explicit public-safe projections.

### 3.2 Migration-ledger drift

- Repository contains 74 migration SQL files.
- Live Supabase migration ledger contains 95 versions.
- 55 version IDs match exactly.
- 19 repository migration filenames have version IDs absent from the live ledger.
- 40 live ledger versions do not have an exact same-version filename in the repository.
- Some changes were applied under a timestamp/name different from the committed filename, and the initial live baseline predates the consolidated repository baseline.
- This confirms the permanent project warning. Do not replay the consolidated baseline, run an unreviewed schema push, or blindly apply/revert a migration. For each new schema change:
  1. Inspect live table/constraint/policy/function state.
  2. Inspect the exact related live migration versions.
  3. Design a strictly additive, idempotent migration.
  4. Verify the migration against current live state before applying.
  5. Commit the exact applied SQL and update the handoff.
- No migration was applied during this audit.

### 3.3 Supabase Advisors

**Security Advisor**
- INFO: `private.analytics_gateway_tokens` has RLS enabled but no policies. It is a private-schema table; do not add broad policies simply to silence the notice. Confirm intended access before changing it.
- WARN: leaked-password protection is disabled. The existing domain/security plan records that this is unavailable on the connected Free plan. No plan upgrade or Auth setting change is authorised here.

**Performance Advisor**
- 40 `unused_index` INFO notices. Do not drop indexes without query-plan and workload evidence; several are on recently added/low-volume features.
- No new performance warning justifies destructive index removal.

**Health Advisor**
- No findings at audit time.

## 4. Admin Business and Data Quality performance findings

### 4.1 Current architecture

- `/admin/:tab` is already a lazy route in `src/App.tsx`, but `src/pages/admin/AdminPortal.tsx` statically imports large manager modules:
  - `BusinessAndModeration.tsx` — 1,734 lines.
  - `SystemAndTaxonomy.tsx` — 1,776 lines.
  - `GrowthAndOps.tsx` and multiple other Admin managers.
  - Government, owner registration, authorities and analytics managers.
- AdminPortal's `reload()` launches a Promise.all batch of **19 data requests** on mount and after reload, regardless of the selected tab. It includes business, reviews, submissions, inquiries, leads, profiles, ads, imports, authorities, settings, pages, audit logs and other datasets even when the active tab does not need them.
- Each request is wrapped in a 12-second timeout; a slow unrelated request can delay completion of the whole Promise.all batch.
- `fetchAdminBusinesses()` currently requests `businesses.select('*, categories(*), areas(*), plans(*)).order('updated_at', desc)` without pagination or a column allowlist.
- BusinessManager filters the complete in-memory array and renders every matching business card; there is no bounded page/window.
- DataQualityManager maps every business to issue flags, builds the full matching result list and renders every match. Category dropdown counts call `businesses.filter(...)` once per category, repeating scans. At 698 businesses and 30 categories this is roughly 20,940 business/category comparisons on each render, in addition to the audit pass.
- The Admin global quick-search currently reads the in-memory business, lead and profile arrays; any tab-scoped loading change must preserve this feature or replace it with a safe bounded search.

### 4.2 Database query baseline

A read-only `EXPLAIN (ANALYZE, BUFFERS)` of the current joined business-list query returned:
- 697 rows.
- Planning time: approximately 8.771 ms.
- Execution time: approximately 5.347 ms.
- Shared buffers read from disk: 0; the query used cached shared blocks.
- Sort: in-memory quicksort, approximately 1,238 KB.
- The returned row width estimate was 2,676 bytes.

This is a database-only baseline executed through the database tool, not an authenticated browser/RLS timing and not a measurement of network transfer, React rendering, first usable interaction or click latency. It suggests that reducing the broad UI fetch fan-out, payload width and number of rendered cards is a better first investigation than dropping indexes.

### 4.3 Approved Phase 1 implementation direction

1. Lazy-load Admin tab managers so inactive manager code is not evaluated in the initial Admin chunk.
2. Load only the datasets needed by the active tab; always retain the small dashboard-count request for navigation badges. Preserve global quick search with a separate debounced, bounded loader or equivalent.
3. Replace the broad `select('*')` business list with an explicit allowlist of fields needed for rows and filters; fetch detail-only fields when a record is opened.
4. Introduce bounded pagination/incremental rendering for BusinessManager and DataQualityManager while preserving filters, sorting, bulk actions, exports and keyboard access.
5. Precompute category issue counts in one pass rather than filtering the complete business array for each category.
6. Keep all existing permission checks, RLS, moderation semantics, audit events and export completeness.
7. Capture authenticated desktop before/after cold-load, warm-load, first-interaction and click-to-response metrics, plus mobile smoke tests, before marking Phase 1 accepted.

**Measurement limitation:** No authenticated browser or physical device performance trace was available in this audit. Do not invent milliseconds. Record real UI timings when a browser session is available; keep this acceptance evidence open until then.

## 5. Add Business and Owner onboarding audit

### 5.1 Existing public flow

- Public route: `/add-business`.
- Current form submits a `new_business` row through `submitPublicSuggestion()`.
- Existing fields include English name, optional Urdu name, category ID, area ID, primary phone, optional WhatsApp, English address, a small predefined facilities list, English description, contact name/phone and a honeypot.
- It does **not** currently collect the full approved field set: Urdu address, nearby landmark separately, map URL, daily opening hours, owner Gmail, or business logo/cover uploads.
- Public submission does not create an Auth user or upload a public logo/cover. The current approval RPC explicitly inserts `logo_url` and `cover_url` as NULL for new public submissions.
- Current category/area selects are native selects and automatically preselect the first item after loading. The approved redesign must avoid accidental first-option selection and must explain how to request a missing taxonomy item.

### 5.2 Existing Owner Registration

- Separate route: `/owner-register`.
- It inserts into `public.owner_registration_requests` (full name, email, phone, optional business name). No account is created at submission.
- Table RLS permits public INSERT only with pending/unreviewed fields; Admin SELECT is restricted to Super Admin or `owners.create`.
- Deployed `manage-owner-registration` Edge Function is ACTIVE, version 3, `verify_jwt=true`. It validates the caller's Auth user and owner-management permission, locks the request into processing, sends a Supabase Auth invitation, creates an owner profile, and attempts rollback if profile/request provisioning fails.
- The existing Edge Function does **not** associate the invited owner with the approved business. It also needs explicit idempotency and rollback review before it is extended.
- Current owner-registration Admin queue is a separate manager and is not yet integrated with per-field business review.

### 5.3 Proposed additive design

- Keep existing `submissions` rows and legacy payloads intact. Add a separate field-review ledger keyed by submission and field; each field stores its submitted value, moderation state, reviewer, timestamp and audit context. Do not replace the legacy payload.
- When a field is approved, apply only that field to the business's public row through an Admin-authorized server-side operation. Pending/rejected/unpublished fields remain private. Define and enforce a minimum safe public listing before publishing a business row.
- Add a separate private pending-media bucket. The existing `Hello Sadiqabad` bucket is **public**, so folders inside it are not private even if object policies restrict writes. Pending logo/cover objects must never use public URLs. On approval, validate and promote the asset to the existing public bucket while retaining the currently approved image until replacement approval.
- Add a server-enforced monthly quota ledger for owner logo/cover change requests, with an atomic per-business check and Asia/Karachi calendar-month boundaries. Admin moderation must not consume or be blocked by the owner quota.
- Extend the existing owner invitation flow only after Admin review. The Edge Function must verify the reviewed submission/business relationship, invite by email, assign the owner role and attach the owner to only the intended approved business. If any stage fails, roll back the Auth user/relationship and restore a retryable request state. Preserve audit history and never accept owner IDs/roles from public input.
- Keep the public form free of password/confirm-password fields and do not persist private form drafts in local storage.

## 6. Government Jobs and Schemes audit

### 6.1 Existing routes and tables

- Government Jobs public routes: `/government-jobs` and `/government-jobs/:slug`.
- Government Schemes public routes: `/government-schemes` and `/government-schemes/:slug`.
- Admin managers and dedicated permissions already exist: `government_jobs.manage` and `government_schemes.manage`.
- Public RLS is published-only; existing official-source verification, intake status, re-verification and revision-history safeguards must remain intact.
- Government Jobs currently has `title_ur`, `summary_en`, `summary_ur` and optional `image_url`; most detailed eligibility/instructions fields are currently single-language.
- Government Schemes currently has `title_ur` and `summary_ur`, but benefit details, eligibility, required documents, application steps and fees/repayment are currently single-language. The live table does not currently have a poster/image column.
- The first Government Job has an optional image URL; current MVP does not require an image before publication.
- The existing Schemes MVP contains five published information records. Their intake statuses are unconfirmed; preserve that status and all source facts.

### 6.2 Proposed additive design

- Add Urdu counterparts for all user-facing English detail fields and an explicit bilingual completeness check in Admin. Keep original official-source wording/links and never auto-translate legal criteria without review.
- Add an approved image field to Schemes and extend the Jobs image workflow without breaking existing records.
- Government content without complete required Urdu/English fields and a reviewed poster remains draft/unpublished. Do not silently unpublish or mutate existing live rows; first inventory current records and use a staged Admin review state before enforcing any new publication gate.
- Use the private pending-media bucket for draft uploads; promote only Admin-approved posters to the public media bucket.
- Public detail pages, sitemap, social metadata, search and offline snapshots must include only published records and use the exact approved image. A poster does not imply that intake is open.

## 7. SDK Jobs — proposed data and privacy boundary

There is no SDK Jobs table, route, Admin manager or Edge Function in the current repository/live schema.

Proposed separation:
- Public job table/read projection: only job title, bilingual public description, category/type, vacancies, approved work area, salary text if disclosed, duties, requirements, experience, hours/shift, optional benefits, closing date, approved image, status and canonical slug.
- Private employer mapping: separate Admin-only record linking job to business and submitting owner. Never expose owner/business IDs or contact fields in public responses, metadata, structured data, search, sitemap, offline snapshots or analytics.
- Candidate intake, consent, contact details, physical-CV receipt, interview notes, suitability decision, referral status, fee ledger and referral-letter records belong in separate private tables with strict Admin permissions and retention policy. Do not collect candidate data until retention/deletion policy is approved and operational access is verified.
- Owner eligibility must be enforced server-side: authenticated user, active Admin-approved owner profile, ownership relationship to at least one published business. Public visibility requires explicit Admin publication.
- Use dedicated least-privilege permission keys, audit every sensitive state change and do not add a payment gateway in MVP.
- Public WhatsApp CTA must use the approved number and neutral job-title/canonical-URL message only. Office schedule uses Asia/Karachi and the approved weekday 10 AM–2 PM window; no unverified street address may be shown.

## 8. Gov landing and navigation audit

Existing exact routes:
- Government Jobs: `/government-jobs`
- Government Schemes: `/government-schemes`
- Local Authorities: `/local-authorities`
- Authority Profiles: `/authority-profiles` and `/authority-profiles/:slug`
- Emergency remains `/emergency`.

Current mobile bottom navigation has nine items: Home, Search, Categories, News, Government Jobs, Government Schemes, Urgent/Emergency, Saved and Offline. The approved target is exactly Home, Search, Gov, SDK Jobs and Saved. The Home Emergency card and `/emergency` route must remain intact.

Recommended new public routes for the approved navigation are `/gov`, `/sdk-jobs` and `/sdk-jobs/:slug`; verify route naming and SEO collisions before implementation. Do not duplicate Local Authorities or Authority Profiles data.

## 9. Security and open risks

1. **Private pending media:** confirmed hard requirement for a new private bucket because the current bucket is public.
2. **Migration drift:** 74 repository files vs 95 live ledger entries; exact version mismatches must be reconciled for every new DDL change.
3. **Owner invite association:** current invite flow creates an owner profile but does not link the intended business; extension must be transactional/idempotent with rollback.
4. **Public field projection:** public business reads must be built from approved field states only; never expose raw submission JSON or private contact fields.
5. **SDK Jobs privacy:** employer mapping and candidate records must be physically separate from public job rows or exposed only through a reviewed public projection.
6. **Existing security notices:** private analytics gateway table INFO and Free-plan leaked-password warning are documented; do not weaken security or upgrade plans automatically.
7. **Browser metrics:** authenticated desktop/mobile timings remain unmeasured. Do not claim Phase 1 performance acceptance until real before/after traces exist.

## 10. Phase 0 disposition

**Audit and design:** completed for repository, live schema/migration ledger, RLS, Storage, current routes, current owner flow, government content baseline and SDK Jobs privacy model.

**Remaining evidence:** authenticated desktop baseline timings and browser interaction traces are not available in this session. The database-only business-list baseline is recorded above. Keep this item open in the Phase 1 acceptance checklist.

**Production changes:** none. No database migration, Storage bucket, Auth setting, public data or deployed Edge Function was changed during this audit.


## Current-main reconciliation and Phase 1 optimization checkpoint — 25 November 2026

The source-level findings above were an earlier audit snapshot and are not all accurate for current `main`. Re-inspection of current source confirms:

- `AdminPortal.tsx` uses `React.lazy` for the large Admin managers; the Admin shell does not statically import those manager modules.
- The 19-slot `Promise.all` in `reload` is not 19 unconditional network calls. Most slots resolve immediately; business, taxonomy, profiles, leads, moderation, etc. are gated by the active tab and permission.
- `fetchAdminBusinesses()` now uses an explicit field allowlist with category/area relations, not `select('*')`. It remains an unbounded list fetch (no server-side range); the latest read-only DB baseline remains about 5.3 ms for 697 rows, not a browser timing.
- BusinessManager and DataQualityManager already paginate visible cards to 50 per page. DataQuality category counts already use one linear pass through businesses rather than a repeated full scan per category.
- Phase 1 follow-up added a 30-second in-memory cache for businesses, taxonomy, profiles and leads across Admin tab changes. Global quick search shares the same cache. Explicit child-action reloads force a fresh read; failed refreshes preserve the last successfully loaded data and leave the cache eligible for retry. Cache is not persisted to local storage.
- Main commit `ce1b6788c3beafab864cf577c3b046beca64a49a`; [CI run 45639985225](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45639985225) passed; Cloudflare Pages deployment `81b032d7-64e1-45c1-a63c-1a46c60a8580` succeeded with canonical alias.

**Phase 1 remains in progress / not accepted.** No authenticated Admin browser or physical-device performance trace was captured here, so there are no before/after milliseconds to report. The next safe acceptance step is a real signed-in Admin desktop/mobile trace of Business and Data Quality cold-load, warm tab-switch, first interaction, search/filter, page navigation and edit/review response, with permission/error regression checks. Do not invent timings or mark Phase 1 complete.