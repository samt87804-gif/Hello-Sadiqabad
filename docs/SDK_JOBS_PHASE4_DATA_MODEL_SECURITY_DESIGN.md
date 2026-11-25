# SDK Jobs — Phase 4 Data Model & Security Design

**Status:** Phase 4 started; audit/design checkpoint only.  
**Owner-approved scope:** `docs/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md` §4.4 and Phase 4.  
**Reviewed against:** current `main`, existing migrations, live Supabase schema/RLS/grants, owner portal, Admin permission architecture and `docs/SDK_JOBS_RECRUITMENT_PLAN.md`.  
**Date:** 26 November 2026.

## 1. Current implementation baseline

- There is no SDK Jobs route, owner job-submission UI, Admin SDK Jobs manager, `sdk_jobs` table, or SDK Jobs-specific Edge Function in the current repository/live schema.
- Government Jobs already exists as a separate feature at `/government-jobs` and `/government-jobs/:slug`, with its own `government_jobs.manage` permission and publication safeguards. SDK Jobs must not reuse or alter that government-content workflow.
- Owner routes are protected by `RequireAuth` + `RequireRole roles={['owner']}`. The canonical ownership relation used by the current Owner Portal is `businesses.owner_id = auth.uid()`; owner listing queries also filter by that owner ID.
- Live `profiles` has `role` and `is_active`; live `businesses` has `owner_id`, `status`, `id`, business public content and plan fields. Owner eligibility can therefore be checked against the authenticated profile and a currently published business, not a client-supplied owner flag.
- Admin permissions are explicit. Current permission architecture spans the TypeScript `PermissionKey`, staff permission editor, Admin navigation and tab switch, `public.my_permissions()`, and `private.staff_has_permission()`. Existing privileged government permissions are not automatically granted through broad staff types. SDK Jobs must follow the same pattern with a separate `sdk_jobs.manage` permission.
- Live RLS inspection: public business rows are visible to anon only when published; authenticated owners can read their own linked businesses; Admin/staff access is permission-gated. The current audit log table is Super Admin-readable, and its generic row trigger records basic change metadata; SDK Jobs still needs a dedicated review/status history suitable for its workflow.
- Live migration ledger currently has 108 applied versions and differs from the consolidated repository baseline. No migration, schema, RLS, grants, Storage policy or production data was changed during this audit.

## 2. Required data boundaries

### 2.1 Owner-submitted job record

Use a new additive `public.sdk_jobs` table. It may contain both public job content and private linkage fields, but the base table must never be readable by anon. Proposed field groups:

- Identity: UUID, unique stable slug, created/updated/published timestamps.
- Private employer linkage: `employer_owner_id` referencing `auth.users`, and `source_business_id` referencing the selected business. These fields are Admin-only and never appear in public responses.
- Public bilingual content: English/Urdu title, short summary and full description; category; vacancy count; job type; work area/location; duties; qualifications/requirements; experience; working hours/shift; optional benefits; closing date.
- Optional salary: minimum/maximum and a display state that can clearly say “Not disclosed”; no salary is mandatory.
- Media: private pending upload path and separately recorded approved public poster URL/path. A pending object path must never be returned by the public read model.
- Moderation: draft/pending-review/changes-requested/rejected/published/unpublished/closed/expired/archived lifecycle, reviewer metadata and private Admin note.
- Public listing fields must be explicitly allowlisted; never serialize the whole row or its JSON/private linkage.

Use existing taxonomy IDs only where the current `areas` schema supports the intended local-area semantics. Do not invent job categories, area names, office addresses, or local facts. Category/type choices and final form labels must be grounded in the approved product plan and existing UI conventions.

### 2.2 Public read model

Create a narrowly projected public view/read model (for example `public.sdk_jobs_public`) that exposes only published job content and approved poster URL. It must exclude:

- Employer/business/owner names and IDs.
- Owner phone, WhatsApp, email or other contact information.
- Private upload paths, Admin notes, reviewer IDs, moderation history.
- Candidate records, interview notes, suitability/referral outcomes and internal identifiers.

The public route must use a narrowly projected `sdk_jobs_public` view with `security_invoker=true`. Anon receives no table-level SELECT on `sdk_jobs`; it receives only the exact public columns needed by that view, protected by a published-only RLS policy. Private employer linkage, review fields and pending-media paths have no anon column grants. Direct base-table reads therefore cannot retrieve private columns. Public routes, SEO metadata, Open Graph, sitemap, search and offline snapshots must all use the same safe projection.

### 2.3 Owner eligibility and write rules

Every submission/write must be checked server-side and by RLS/database constraints:

1. Authenticated user exists.
2. `profiles.role = 'owner'` and `profiles.is_active = true`.
3. The selected `businesses` row is currently `status = 'published'` and `businesses.owner_id = auth.uid()`.
4. `employer_owner_id` is always derived from `auth.uid()`; clients cannot nominate another owner.
5. New submissions enter `pending_review`. Owners cannot publish, approve, assign, change employer linkage, or edit moderation metadata.
6. Owner edits are limited to their own eligible job and allowed editable states; a material edit to a published job returns it to moderation.
7. An owner who loses the linked published business or active owner role cannot create new submissions. Existing job records remain preserved and become Admin-reviewable; do not silently delete or rewrite them.

A hidden form or frontend-only `RequireRole` check is not an authorization boundary.

### 2.4 Admin moderation and audit

- Add a dedicated `sdk_jobs.manage` permission. Only Super Admin or staff explicitly granted this permission can view/manage all submissions and private employer linkage.
- Gate Admin navigation, Admin tab rendering, data fetching, RLS and server-side actions independently.
- Admin actions: approve/publish, reject, request correction, edit, unpublish, close/expire, reopen after review and archive.
- Add append-only job status/action history with actor, action, old/new status, timestamp and optional reason. Owners must not read this table. Direct owner updates/deletes of history must be impossible.
- Reuse the project's audit conventions, but do not assume the generic `audit_logs` trigger alone satisfies the job-specific workflow history requirement.

## 3. Media privacy

- Owner-supplied optional posters must upload to a dedicated private pending area using the established signed-upload pattern and server-side MIME/size/path validation.
- Admin approval is required before a poster is promoted/copied to an existing approved public-media strategy.
- Store and return only the approved public media reference in the public view. Never publish a pending Storage path or signed URL in HTML, API, metadata, sitemap or offline data.
- The public job can remain pending until Admin approval. A record must not be publicly published without a safe approved share image, in accordance with the master plan's shareability requirement.
- Confirm current bucket limits and upload constraints before implementation; do not weaken the existing private business-media policies.

## 4. Phase boundaries

Phase 4 includes owner vacancy submission, Admin job moderation, published/active public listing and detail pages, search/filtering, canonical sharing, employer-anonymity enforcement and the Admin contact CTA.

Phase 5 is separate and must not be pulled forward into Phase 4: candidate intake/consent, CV or candidate records, interview notes, suitability, referrals, referral letters, fee ledger/configuration and office-hour settings. No candidate personal data should be collected until Phase 5 defines and approves retention/deletion, access and consent controls.

## 5. Acceptance test matrix for implementation

- Unauthenticated user cannot create/read private job rows.
- Authenticated non-owner, inactive owner, owner without a published business, and owner selecting somebody else's business are denied server-side.
- Eligible owner can submit only against their own published business; new record is pending.
- Owner cannot set published status, alter owner/business linkage, access Admin notes or write review history.
- Admin without `sdk_jobs.manage` is denied; explicitly permitted staff and Super Admin can manage; ordinary staff types receive no implicit permission.
- Anon can read only the published public-view fields; no table-level SELECT or private-column grants exist on the base table.
- Employer/business/owner identifiers and contacts are absent from every public response, page, metadata, structured data, sitemap, search result and offline snapshot.
- Pending/rejected/unpublished/closed/expired records do not appear as active public jobs.
- Status transitions and every sensitive Admin action are append-only auditable.
- Pending poster is private; only an approved poster appears publicly.
- Closing date, filters, canonical slug/share URL and WhatsApp CTA use the exact approved contact number `03283212342`, with a neutral message containing only job title and public URL.
- No candidate personal data or online CV upload is introduced in Phase 4.

## 6. Execution checklist

- [x] Read SDK Jobs master requirements and child plan.
- [x] Confirmed there is no existing SDK Jobs implementation/table to extend.
- [x] Inspected owner authentication, owner/business linkage and live `businesses`/`profiles` schema.
- [x] Inspected Admin permission architecture, `my_permissions()`, `staff_has_permission()`, Admin navigation and live RLS/grants.
- [x] Inspected the live migration ledger (108 prior versions) and preserved its existing history; three SDK Jobs migrations are now applied and recorded (111 total).
- [x] Inspected exact `areas` schema; it supports active-area FK plus bilingual names and city ID.
- [x] Inspected staff permission editor (`ALL_PERMISSION_KEYS`), Admin tab permission switch, and all frontend permission-key locations.
- [x] Inspected Storage buckets and object policies: public bucket is unrestricted at bucket metadata level; existing private pending-business bucket is 5 MiB JPEG/PNG/WebP and its Admin read policy is specific to business moderation.
- [x] Implemented database-side owner eligibility enforcement and forced pending status.
- [x] Implemented first-pass Owner vacancy submission UI and owner-only request status list at /owner/sdk-jobs; authenticated owner route and navigation added. Poster upload remains a separate open item.
- [x] Implemented dedicated Admin permission, RLS gates and append-only status history at database level.
- [x] Implemented permission-gated Admin SDK Jobs moderation workspace, navigation gate and status/history/private-note UI; CI run 45707358141 passed build and Edge Function jobs. Authenticated browser and live permission acceptance remain open.
- [x] Implemented the published-only, security-invoker public projection.
- [ ] Implement public listing/detail routes, filters and share metadata.
- [x] Foundation GitHub CI and production Pages deployment passed for the permission/database foundation.
- [ ] Add owner/Admin/public UI-level and adversarial privacy/authorization tests plus authenticated production browser verification.

**Current gate:** Phase 4 read-only audit/design and first database foundation are complete. The live migration ledger contains 111 versions (108 prior + 3 SDK Jobs migrations). The migrations add the private job tables, published-only invoker-security projection, dedicated `sdk_jobs.manage`, owner eligibility guard, Admin-only notes/status history, consolidated RLS policies and FK indexes. Transactional tests confirmed eligible owner submissions are forced to the authenticated owner and `pending_review`; pending jobs do not appear in the public projection; cross-owner business submission is denied; test transactions rolled back and live counts remain 0 jobs / 0 history / 0 notes. Security advisor no longer reports a SECURITY DEFINER view; performance advisor no longer reports SDK Jobs unindexed FKs or multiple permissive policies. Existing unrelated advisor findings remain outside this workstream. The permission type and explicit staff permission editor are updated. Owner form, Admin moderation UI, signed poster upload, public routes and browser acceptance remain open.


## Poster lifecycle and public board implementation checkpoint — 26 November 2026

- [x] Live migration `20261125220215_sdk_jobs_poster_private_upload`: existing private pending-media bucket reused; Admin-only SDK Jobs folder read policy; Owner pending-row updates limited to a path bound to the same job and Owner.
- [x] Private signed-upload Edge Function and Owner Portal poster upload/retry UI deployed/committed. JWT required; active Owner and own pending-review job checked server-side; 5 MiB and JPEG/PNG/WebP enforced at bucket and request boundaries.
- [x] Admin private preview and approve/reject flow deployed. Actual file signature and size checked server-side; only approved object is copied to public media. Pending source is removed after approval/rejection where cleanup succeeds.
- [x] Publication is separately gated by a JWT-protected Admin Edge Function, approved poster, pending-review state, valid closing date, and employer/Owner identity/contact scan across public text fields.
- [x] Public list/detail routes, filters, canonical metadata, privacy-safe JobPosting JSON-LD, share actions, Admin WhatsApp CTA, office visit instructions and sitemap entries implemented using the published-only public projection.
- [x] Rolled-back database tests passed: eligible Owner insert + correctly scoped poster-path attachment; pending job content mutation blocked; cross-job poster path blocked; anon employer ID column read blocked.
- [x] Final CI [45710844636](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45710844636) passed build and Edge Functions.
- [x] Added `get-sdk-job-employer-details` Edge Function; Admin can see linked business and Owner names/contact details via a narrowly scoped, JWT-protected endpoint requiring explicit `sdk_jobs.manage`. No broad RLS grant was added.\n- [ ] Real Owner upload and Admin preview/approval/publication browser acceptance.
- [ ] Pages deployment and public route/sitemap smoke tests.

**No candidate intake, CV/PII, referral letters, fee ledger or recruitment-hour settings have been implemented.** Those remain Phase 5 and require a separate retention/security design.


**Final CI evidence:** [45710844636](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45710844636) passed both build and Edge Function jobs for commit `a5a807ee66b5772089aaa53910cec9d9ed99f6f4`.
