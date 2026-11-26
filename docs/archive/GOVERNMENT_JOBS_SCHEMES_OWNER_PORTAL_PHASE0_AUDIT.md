# Hello Sadiqabad — Government Jobs, Schemes & Owner Portal
## Phase 0 Read-only Audit & Proposed Design

**Audit date:** 20 November 2026 (Pakistan time)  
**Status:** Read-only audit completed; proposed design prepared; owner acceptance pending  
**Repository:** `samt87804-gif/Hello-Sadiqabad` · `main`  
**Audited code snapshot:** `40107ae3536cadcdd54ea0d9705beeb3ab1d550f`  
**Supabase project:** `efwohfzqitevkuybnyif` · PostgreSQL 17  
**Production:** https://hellosadiqabad.com

> This document records Phase 0 findings and a proposed design. It does not authorise feature implementation, schema changes, migrations, storage changes, or production data changes.

## 1. Audit scope and actions

Reviewed the approved master plan, permanent project working rules, project roadmap, new-chat handoff, domain/security master plan, current relevant frontend and Edge Function code, repository migration files, live Supabase schema, migration ledger, RLS policies, Storage policies, plan configuration, and Supabase Security/Performance/Health Advisors.

**No code, database, migration, Storage, user, business, submission, plan, or production record was changed.** All live database inspection used read-only queries.

## 2. Current implementation findings

### 2.1 Live database and migration state

- Supabase project status: `ACTIVE_HEALTHY`; PostgreSQL 17.11.
- Live migration ledger contains **81 applied entries**, through the four chatbot knowledge-sync migrations dated 19 November 2026.
- The live ledger is not a safe instruction to replay the repository's consolidated baseline. The repo contains a consolidated baseline file while the live ledger records the original and subsequent incremental history. The permanent rule remains: never replay the baseline, assume migration parity, or run an unreviewed schema push.
- Live public schema currently has 36 base tables. There are **no** `government_jobs`, `government_schemes`, or government scheme-round/revision tables.
- Live counts at audit time: 314 active areas (314 total); 449 published businesses (668 total); 16 submissions (3 currently `new`); 2,684 audit-log rows; 1 active Super Admin profile and 4 active Owner profiles; **0 staff-member rows**.
- The current counts are a snapshot, not permanent product constants.

### 2.2 Permissions and Admin navigation

- Existing staff permissions are a finite allowlist: business creation/edit/publish, imports, leads, owners, plans, ads, moderation, support, analytics, announcements and settings.
- Permission definitions are repeated across `src/types/database.ts` (`PermissionKey`), `src/lib/permissions.tsx`, `src/components/admin/AdminNav.tsx`, `src/pages/admin/AdminPortal.tsx`, `src/components/admin/SystemAndTaxonomy.tsx` (`ALL_PERMISSION_KEYS`), and the database functions `private.staff_has_permission()` and `public.my_permissions()`.
- Super Admin is separately and explicitly trusted by the existing database helper. Staff access requires an active profile, active `staff_members` row, role `staff`, and the permission override/default logic. Unknown permission keys currently resolve to false unless explicitly added to the relevant logic.
- The live project currently has no staff members. Therefore no real staff permission matrix has yet been exercised for this feature.
- Admin navigation and tab rendering are separately gated. Adding a visible tab alone would not secure the route or database writes.

**Design implication:** use two narrowly scoped permissions—`government_jobs.manage` and `government_schemes.manage`. Super Admin receives access through the existing Super Admin rule. Staff receive only explicit per-user grants; do not automatically grant either permission through broad existing staff types. Add both keys consistently to the TypeScript union, permission list, staff permission matrix, Admin navigation/tab gates, `my_permissions()`, and server/RLS checks. Test both allow and deny cases.

### 2.3 Existing moderation and owner registration

- Public Add Business calls the existing `submit-suggestion` Edge Function with type `new_business`; it does not directly insert a public business row.
- That Edge Function validates request shape and size, checks origin, applies session and phone rate limits, validates an authenticated Owner where applicable, and creates a `submissions` row. The public form's honeypot and online-only behavior must be preserved.
- The existing `private.approve_submission()` requires `moderation.review`, applies the approved submission and writes an audit-log entry. New Add Business submissions must remain in this existing moderated flow.
- Owner registration writes only to `owner_registration_requests`. Its public INSERT policy permits only pending/unreviewed requests. Admin read is gated by Super Admin or `owners.create`. The `manage-owner-registration` Edge Function verifies the caller's active role/permission, provisions an Auth invitation only after approval, and records the approval in `audit_logs`.
- The owner registration request form currently collects English full name, email, phone and optional business name. It does not directly create an account.
- `submissions` RLS limits owners to their own relevant request types; moderation access is separately permission-gated. Do not broaden these policies to support government content.

**Design implication:** Government job/scheme content is an Admin-managed editorial workflow, not a public submission type. Assistant research creates a draft package only; it never inserts or publishes a record. Keep the public business submission and owner-account approval workflows unchanged.

### 2.4 Audit logging

- `public.audit_logs` is readable by Super Admin only under the current RLS policy.
- Existing audit triggers cover important tables including businesses, plans, ads, staff, profiles, categories, areas, pages, site settings, local authorities and authority profiles.
- Submission approval/rejection is manually logged by `private.approve_submission()`; the submissions table itself does not currently have the general audit trigger.
- Owner registration approval writes an audit record from its Edge Function. Rejection does not currently write an equivalent audit record in that function.
- Existing trigger audit details generally record the changed entity and timestamp, not a complete before/after snapshot.

**Design implication:** add explicit audit coverage for new government content. Preserve the existing Super Admin-only audit-log access. If the Admin UI needs an editorial change history for authorised government-content staff, provide a narrowly scoped revision/history table or server-side read path rather than broadening all `audit_logs` access.

### 2.5 Storage

- The live project currently has one Storage bucket: `Hello Sadiqabad`, configured as **public**.
- Existing Storage write policies are restricted to authenticated Admin/Super Admin permission holders and designated folders. Public bucket status means objects in it are publicly retrievable; a folder name does not make an object private.
- There is no existing private pending-document bucket for government advertisements.

**Design implication:** MVP should store official source and advertisement URLs to the issuing government's own HTTPS domain; do not upload unpublished PDFs into the existing public bucket. If local PDF uploads become essential, design a separate private review bucket and an explicit publish/copy process in a later approved phase, with MIME/size checks and least-privilege Storage policies.

### 2.6 Add Business and Owner Portal UI

- `src/pages/AddBusiness.tsx` uses native Category and Area selects. It preselects the first loaded category and area, and reset returns to the first options. The area value is still submitted as the existing area UUID.
- The public form currently collects business name, category, area, primary phone, optional WhatsApp, address, quick facilities, short description and submitter contact. Contact name/phone are not both mandatory in the current UI, and there is no explicit accuracy/privacy consent checkbox.
- `src/pages/OwnerRegistration.tsx` is a compact English-only form with full name, email, phone and optional business name.
- `src/components/owner/ListingEditor.tsx` already has a multi-step editor, map/location picker, opening hours and preview, but its Area control remains a native select.
- `src/components/owner/OwnerModules.tsx` includes a database-driven Free/Basic/Premium comparison in `PlanCard`; Offers already enforce a plan quota in the UI, and the Listing Editor uses current plan data for WhatsApp/social/media controls. The plan-aware experience is therefore partially implemented, not absent.
- Live `public.plans` values are the source of truth:
  - **Free:** 0 photos, 0 videos, 0 active offers, 0 social links; WhatsApp, cover, gallery, videos, offers, inquiry, QR, verified badge and full analytics are false.
  - **Basic:** 5 photos, 1 video, 2 active offers, 3 social links; WhatsApp, cover, gallery, videos, offers, inquiry, QR and verified badge are true; full analytics false.
  - **Premium:** 15 photos, 3 videos, 10 active offers, expanded social links; listed paid features and full analytics are true.
- Existing backend triggers/RLS enforce plan limits and protect ownership, plan, verification and publication fields. The UI must continue reading `public.plans.features` and `public.plans.limits`, not create a second hardcoded plan configuration.

**Design implication:** reuse the current form submission, area UUIDs, owner editor, plan table and server-side enforcement. Add a shared accessible area picker rather than changing area records or slugs.

### 2.7 Supabase Advisor snapshot

- Security Advisor: one INFO finding for `private.analytics_gateway_tokens` (RLS enabled with no policies) and the existing WARN for leaked-password protection disabled. The latter is plan-gated in the current Free subscription and is outside this feature scope.
- Performance Advisor: 28 unused-index INFO findings and two multiple-permissive-policy WARN findings on existing `business_products` and `submissions` SELECT policies. Do not remove or rewrite existing indexes/policies as part of this feature.
- Health Advisor: no findings.

These are the Advisor results at the audit timestamp. Do not attribute pre-existing findings to the proposed feature.

## 3. Proposed product and route design

### 3.1 Government Jobs

**Public routes**
- `/government-jobs` — searchable list with Punjab/Federal scope, department, qualification, job type, location and active/archive filters.
- `/government-jobs/:slug` — full details, official source, official advertisement link, application instructions and last-verified date.
- Public homepage preview is deferred to the daily-engagement phase.

**Admin route**
- `/admin/government-jobs` — draft list, create/edit, preview, publish, close/cancel/archive, duplicate detection and re-verification queue.

**Status rule**
- Store editorial state as Draft, Published, Closed, Expired or Cancelled. Derive “Closing Soon” from the verified deadline (recommended seven-day threshold); never let a manual label override an elapsed deadline. Keep closed/expired items in a clearly labelled archive.

### 3.2 Government Schemes

**Public routes**
- `/government-schemes` — category and government-level filters, current status and last-verified date.
- `/government-schemes/:slug` — benefits, source-backed eligibility checklist, required documents, official application/status-check links, geographic scope, safety notice and source date.

**Admin route**
- `/admin/government-schemes` — draft/review/publish/update/close workflow, phase/round manager, duplicate checks and re-verification queue.

**Round/history rule**
- Keep the scheme identity separate from its application round. A scheme can have multiple rounds, each with its own dates, eligibility, benefit terms, application URL, status and source. Do not overwrite an old round with a new round's criteria. Preserve an editorial revision snapshot for material corrections.

### 3.3 Add Business and Owner Portal

- Public Add Business becomes a five-step bilingual wizard: identity; area/address; contact; business details; photos/preview.
- Minimum required fields should remain practical: business name, category, explicitly selected area, address, primary business phone, submitter contact and consent. Optional fields should not block a small business owner.
- Shared area picker: English/Urdu search, selected value, result count, no-results/loading/error states, keyboard and screen-reader support, mobile sheet/popover, clear/change control, and no default selection. Preserve the current area UUID and slug exactly.
- Pending media is not part of the first public form unless a private pending-media architecture is approved. The safe initial path is text/contact submission, Admin review, then approved Owner/Admin media management.
- Owner registration remains request-only and Admin-approved; improve bilingual labels, explain privacy and approval, and show a clear pending status. No direct public account creation.
- Owner Portal should show current plan, actual limits and usage, included features, and locked upgrades. Reuse the existing PlanCard comparison and fill the gaps with consistent locked feature cards. Every lock remains backed by database/RPC/RLS enforcement.

## 4. Proposed additive data model

Exact SQL, constraints and indexes must be drafted and reviewed before the implementation phase; this is a logical proposal, not a migration script.

### `public.government_jobs`

- Identity: `id`, `slug`, `title_en`, optional `title_ur`, `department_name`, `department_scope` (Punjab/Federal/other).
- Role: `job_type`, `scale_or_grade`, optional `vacancy_count`, `location_text`, `districts`, optional `sadiqabad_relevance`.
- Eligibility: `qualification_text`, `experience_text`, `age_text`, `domicile_text`, `gender_or_quota_text`, `other_eligibility_text`.
- Application: `application_steps`, `application_fee_text`, `apply_url`, `advertisement_url`, optional official case/advertisement number.
- Lifecycle: `status`, `application_open_at`, `deadline_at`, `published_at`, timestamps.
- Verification/audit metadata: `source_name`, `source_url`, `source_document_url`, `verified_at`, `next_review_at`, `created_by`, `updated_by`, `published_by`.

### `public.government_schemes`

- Identity: `id`, `slug`, `name_en`, optional `name_ur`, `government_level` (Punjab/Federal/other), `department_name`, `category`.
- Purpose/benefit: `summary`, `purpose`, `benefit_type`, `benefit_details`, optional `amount_or_range`, optional `loan_markup_and_tenure`.
- Geography/eligibility: `geographic_scope`, `eligibility_summary`, structured `eligibility_rules` only when supported by an official source, `required_documents`.
- Workflow: `application_steps`, `application_url`, `status_check_url`, optional official helpline, `status`, timestamps.
- Verification/audit metadata: `source_name`, `source_url`, optional official document URL, `verified_at`, `next_review_at`, reviewer/creator/updater/publisher fields.

### `public.government_scheme_rounds` and revision history

Each round belongs to one scheme and stores round/phase name, eligibility and benefit snapshot, open/deadline dates, status, official application/status links, source URL, verification date and publication metadata. Old rounds remain archived and are not silently overwritten. A restricted revision snapshot records material content/source changes for authorised Admin history.

**Indexes/constraints to design:** unique slugs; valid scope/status checks; non-negative vacancy counts; HTTPS-only external URLs; foreign keys; indexes for status/deadline/scope/category/department and round-to-scheme lookup. Do not create indexes without an expected query path.

## 5. Proposed security and publication contract

1. RLS enabled on every new exposed table.
2. Anonymous SELECT sees only explicitly published/public records and public round snapshots. Drafts, Admin notes, unpublished revisions and internal metadata remain unavailable.
3. Writes require authenticated active Super Admin or active staff with the exact dedicated permission. Use both UI gating and database/RPC/RLS enforcement.
4. Public users cannot submit or edit job/scheme records. The assistant prepares drafts only; Admin performs publication.
5. Keep the current `audit_logs` read policy unchanged. Add explicit audit triggers/events for create, update, publish, close/cancel, source change, deadline/eligibility/benefit changes and round changes. Do not expose private audit data to anonymous users.
6. Validate external links as HTTPS, reject shorteners and unsafe schemes, and manually verify official host ownership before publication. Information page and application portal URLs must be stored separately when they differ.
7. No automatic scraping, crawler, scheduled refresh, third-party provider, or auto-publishing in MVP.
8. No CNIC, OTP, password, bank PIN/account, biometric or identity-document collection. No in-app applications, payments, CV storage or eligibility guarantees.
9. All public content must display source and last-verified date. Stale records enter an Admin re-verification queue; deadline/status display must not claim an application is open after the verified closing point.
10. Keep all pending official documents outside the current public Storage bucket. MVP uses official external links only.

## 6. Acceptance and test gates

Before Phase 1/2 implementation:
- Owner accepts scope, fields, public routes, Admin workflow, permission split, source policy, document strategy and publication statuses.
- Exact additive schema, RLS, grants, triggers, indexes and migration ordering are reviewed against the live migration ledger.
- Permission tests cover Super Admin, active staff with permission, active staff without permission, inactive staff and Owner/anonymous denial.
- Public tests prove drafts/private revisions are not visible and published rows are visible.
- Deadline tests cover Pakistan timezone/date-only advertisements, closing boundary, Closing Soon and expired archive.
- Link tests cover HTTPS, shorteners, unsafe schemes, wrong host and official-source/application URL distinction.
- Scheme-round tests prove previous rounds retain their eligibility/deadline/source history.
- Existing business moderation, owner registration, plan limits, PWA public-only cache and chatbot allowlists remain unaffected.
- Mobile, keyboard, screen-reader, loading/error/empty and slow-network UX checks pass for the area picker and new forms.

## 7. Decisions recommended for owner confirmation

The original master plan already recommends these defaults; Phase 0 audit supports retaining them:

1. Jobs: Punjab + Federal, prioritising posts genuinely open to Sadiqabad/Rahim Yar Khan residents. Other provinces only when a verified advertisement is relevant to local residents.
2. Schemes: Punjab + Federal, always label the responsible government level correctly.
3. Publication: Admin-only. Assistant research is a draft-preparation aid, never a publisher.
4. Language: English and Urdu headings/summaries; preserve the official advertisement/criteria link as the controlling source.
5. Alerts: none in MVP; opt-in alerts/digests are a later phase.
6. Documents: official external URLs in MVP; no uploads to the existing public bucket.
7. Owner forms: no CNIC/OTP; no direct account creation; public business requests remain moderated.
8. Staff access: separate explicit `government_jobs.manage` and `government_schemes.manage` grants.

**Next gate:** owner reviews this audit/design and explicitly approves Phase 0 design. Only then may Phase 1 Government Jobs implementation begin. Phase 2, 3, 4 and 5 remain separately gated.

---

## Owner acceptance and Phase 1 follow-on — 20 November 2026

The owner explicitly accepted the Phase 0 design and authorised Phase 1 Government Jobs MVP implementation. Phase 1 is now committed in `464691c9542ae753ec4a7b320d097b72136e13ce`; GitHub Actions CI and Cloudflare Pages production deployment succeeded. The implementation details and exact applied migration versions are recorded in `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md`.

The Phase 0 audit remains a read-only snapshot of the original architecture. Its historical statement that Phase 1 was awaiting approval is superseded by this acceptance note. No changes were made to existing business, owner registration, moderation, plans, or public Storage content. The new Government Jobs table currently has no records; no job has been auto-imported or published.


### Phase 1 implementation status update — 20 November 2026

Phase 0 was accepted by the owner. Phase 1 Government Jobs MVP is now implemented in latest code commit `9e86b6505737ca5d666550e9df4b3a58566a12f7`; CI passed and Cloudflare Pages production deployment succeeded. The live database includes the bilingual summary fields and all five Government Jobs migrations are recorded in the master plan. Physical mobile-browser acceptance and initial manual official-source content entry remain outstanding.


The final Admin form uses multiline English/Urdu summary inputs. Latest commit: `9e86b6505737ca5d666550e9df4b3a58566a12f7`; CI run `44761553431` and Pages deployment `f9b5688a-2642-4f01-98cb-e328440cb476` succeeded.


---

## Phase 2 / Phase 3 status update — 20 November 2026

The owner subsequently instructed that the next work start and continue without pausing; this authorised Government Schemes Phase 2 implementation. The Phase 2 MVP is now implemented and deployed. See:
- docs/GOVERNMENT_SCHEMES_PHASE2_RESEARCH.md
- docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md
- docs/NEW_CHAT_HANDOFF.md

Phase 2 includes five published official-source information records (all application intake statuses remain unconfirmed), public search/filters/detail pages, an Admin manager gated by government_schemes.manage, fixed-reason-only public correction reports, revision snapshots, RLS/grants/audit triggers and tracked migrations.

Phase 3 Public Add Business + Owner Registration UX is the next planned feature phase. The existing Phase 0 baseline remains valid: preserve the moderated submission workflow, owner approval, business ownership, existing area IDs/slugs, plan entitlements and current RLS. No Phase 3 production changes have been made in this update.
