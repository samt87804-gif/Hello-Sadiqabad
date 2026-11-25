# Hello Sadiqabad — Final Product Expansion Master Plan

> **Canonical new-chat starting document.** Read this document first, then follow the mandatory repository reading order below. This is a planning/approval record, not evidence that implementation has started or shipped.
>
> Owner decisions recorded: 25 November 2026. Work directly on `main` under the permanent project rules.

## 1. Owner-approved scope and priorities

The owner has approved planning for six connected workstreams:

1. Admin Business and Data Quality performance.
2. Public Add Business redesign, field-by-field moderation, private pending media and secure owner invitation.
3. Bilingual, image-led Government Jobs and Government Schemes content, with shareable public pages.
4. New SDK Jobs local recruitment and referral service.
5. New Gov landing page that groups Government Jobs, Government Schemes, Local Authorities and Authority Profiles.
6. Mobile bottom navigation revision.

This document records requirements and implementation gates. It does not authorize destructive changes, weakening RLS, production data edits, or skipping the phase gates in the permanent rules.

## 2. Mandatory reading order for every new chat

1. This file: `docs/FINAL_PRODUCT_EXPANSION_MASTER_PLAN.md`.
2. `docs/PROJECT_WORKING_RULES.md` — permanent mandatory rules.
3. `PROJECT_ROADMAP.md` — live application checklist and latest status.
4. `docs/NEW_CHAT_HANDOFF.md` — latest continuation notes; reconcile with current main.
5. `docs/GOVERNMENT_JOBS_SCHEMES_OWNER_PORTAL_PLAN.md` — existing Jobs/Schemes/Owner baseline.
6. The workstream plans linked below.
7. `docs/DOMAIN_SECURITY_SEO_MASTER_PLAN.md`, `DEPLOYMENT.md`, relevant tests, migrations and code before touching affected areas.

**Source-of-truth order:** current `main` code and tracked migrations for implemented behavior; permanent working rules for how to work; roadmap for application-wide status; this master plan and its child plans for the owner-approved target behavior. If documents conflict with code or live schema, inspect and reconcile; never assume.

## 3. Permanent constraints

- Protect the live production site. Make narrow, backward-compatible, additive changes.
- Commit directly to GitHub `main`; do not create branches or PRs unless owner changes this rule.
- Inspect callers, routes, tests, migrations, RLS, permissions, storage policies and deployment config before every change.
- Preserve every existing business, user, owner, review, inquiry, media and operational record. No destructive migration, truncation, bulk replacement or reseeding.
- Never weaken RLS, authentication, authorization, moderation, validation, rate limits or privacy.
- Never put service-role credentials, tokens or secrets in frontend code, GitHub or chat.
- Do not expose private owner/employer/candidate information in public pages, metadata, logs, offline bundles or social previews.
- Do not invent local facts, office address, business information, government eligibility, official source, poster or opening hours.
- Update the relevant plan, roadmap and handoff after meaningful work.
- Distinguish planned, implemented, CI-passed, deployed, endpoint-tested, browser-tested and physical-device-tested. Do not claim checks that were not run.
- The existing Supabase migration ledger differs from the consolidated repository baseline. Never replay the baseline or run an unreviewed schema push.
- Keep canonical production domain `https://hellosadiqabad.com`.
- Public offline snapshots must remain public/anonymous-safe only. Never cache Admin/Owner portals, private candidate data, drafts or auth data.

## 4. Approved workstream decisions

### 4.1 Admin Business and Data Quality performance

**Problem:** Admin Business and Data Quality pages hang or become very slow, especially on desktop. Clicks and interactions respond late.

**Required outcome:** Both sections open promptly and remain responsive while searching, filtering, reviewing and editing.

Audit and optimize:
- Route-level code splitting and lazy loading; ensure heavy page modules are not eagerly loaded by the Admin shell.
- Component-level lazy loading for expensive tabs, drawers, editors, charts and detail panels.
- Initial network waterfall, duplicate requests, sequential requests that can safely be parallelized, stale/repeated fetching and over-broad selects.
- Large tables/lists: server-side pagination or bounded incremental loading, filtering and sorting where supported; never fetch all records just to render the first screen.
- React render profiling, unstable props, repeated derived work, large JSON rendering, expensive previews and unnecessary state updates.
- Search/filter debounce where appropriate, cancellation/ignore of stale requests, memoization only where profiling supports it.
- Skeleton/loading states that do not block unrelated controls; clear error/retry states.
- Preserve all existing moderation actions, permission checks, audit logs, exports and data semantics.

**Acceptance:** Record before/after route load and interaction measurements on a representative desktop; verify no regression on mobile; test large datasets, pagination, filters, detail/review actions, errors and permissions. No data is removed to improve performance.

### 4.2 Public Add Business and owner onboarding

**Public form fields requested**
- Business Name English and Business Name Urdu.
- Primary Phone and WhatsApp Number.
- Category dropdown.
- Area dropdown.
- Business Description.
- Facilities as selectable checkboxes.
- Business Address English and Urdu.
- Nearby Landmark.
- Google Maps Location URL.
- Opening hours for every day.
- Business Logo/Profile image and Business Banner/Cover image.
- Business Owner Name and Gmail.

**Category and Area not found:** Show clear bilingual help text explaining that if the required category/area is not in the dropdown, the submitter should WhatsApp the Admin, request that the taxonomy item be added, then return and try again. Do not silently accept an unstructured category/area as if it were an approved taxonomy value. Reuse the current taxonomy IDs and preserve current data relationships.

**UX:** Mobile-first bilingual form, searchable accessible Category/Area controls, no accidental first-option preselection, explicit required/optional labels, validation, preview, consent and submission status. Keep existing anti-spam/honeypot, rate limits, phone validation and moderated submission flow. Do not store partially entered private details in local storage.

**Password decision:** Do NOT ask for or store Password or Confirm Password in the public business request. The public form collects owner name and Gmail. After Admin review, Admin explicitly triggers the existing secure Supabase owner invitation flow. Owner follows the secure invitation/confirmation link and sets their own password through Supabase. Do not create an account directly from an unauthenticated public form.

**Field-level moderation:** Admin can review every submitted field independently. Each field must support:
- Pending Review
- Approved & Published
- Rejected
- Unpublished

An approved field can be public while another field remains pending, rejected or unpublished, subject to a safe minimum-public-listing rule. Admin can later publish a previously unpublished field. Rejection/unpublishing must not erase the submitted value or audit history. Show the submitter/owner private contact information only to authorized Admins; never expose it as a public listing field by default. Maintain an auditable history of status changes and reviewer actions.

**Media privacy:** Logo and cover uploads submitted before approval must be stored in a private pending area/path with restrictive Storage RLS. They must not be accessible through public URLs or public directory queries before explicit approval. After approval, publish/copy/promote only approved media to the existing public media strategy. Validate MIME, file size, dimensions where appropriate, ownership, path and upload limits. Reject unsafe files and orphaned uploads safely.

**Owner image-change cap:** A business owner may submit no more than **two image-change requests per business per calendar month**. Track usage server-side, not only in the UI; define month boundaries consistently in Pakistan time and test boundary conditions. Count replacement/change requests across business profile images (logo and cover; any future profile-image slots must be explicitly included in the same policy before release). Admin review remains mandatory for each replacement. Admin-side moderation is not blocked by the owner's quota. Do not silently overwrite the current approved image: retain it until the replacement is approved. Explain the remaining monthly allowance in the Owner Portal.

**Invitation and business association:** Admin must be able to review the owner request and selected field states, then send an invitation through the existing `manage-owner-registration` Edge Function or its verified current successor. Inspect existing idempotency, role/permission checks, audit log and rollback behavior before extending. The invited user must receive only the intended owner role and association with the approved business; never let a public request assign roles or business ownership. Invitation failure must not leave a half-provisioned owner/business relationship.

**Acceptance:** Public request remains pending; no account/password is created at submission; private media is not public; each field's status independently controls its public visibility; invitation is Admin-authorized and secure; owner can set password through Supabase; image quota is enforced server-side; all existing businesses/submissions remain unchanged.

### 4.3 Government Jobs and Government Schemes

Existing Government Jobs and Schemes features are already implemented. Extend them rather than recreate them. Existing public routes, Admin managers, permissions, source-verification, revisions, intake safety and migrations are the baseline.

**Bilingual requirement:** English and Urdu for title, summary, full details, eligibility, required documents, application instructions/steps, fees or repayment details where relevant, and other user-facing content. Do not translate or alter official legal criteria in a way that changes meaning. Retain and link the authoritative source. Admin must be able to see missing-language status and keep incomplete records in draft.

**Images:** Admin uploads official posters or verified relevant images. Do not fabricate official artwork. A Government Job or Scheme record must remain draft and must not be published until a suitable image is supplied and reviewed. Keep current optional image support backward compatible; review whether Schemes need an additive image field and secure upload path. Apply MIME/size/path validation and private-draft/public-approved media rules where needed.

**Shareability:** Every public record has a stable canonical detail URL and social preview metadata (Open Graph/Twitter-compatible title, bilingual description as appropriate, and the exact approved image). Verify that shared URL previews render the approved poster, not an arbitrary fallback or private draft image. Share actions should use the canonical URL and native share where supported, with copy-link fallback. Do not expose unpublished records in public metadata, sitemap, search or offline packages.

**Accuracy:** Preserve official source links, verification and next-review dates, intake status and existing safeguards. Never label a programme open or an application link active without current official verification. A poster does not imply that intake is open.

**Acceptance:** Existing records and official facts remain intact; bilingual completeness is enforced before publication; no-image records remain draft; approved image appears on detail/card/social preview; public RLS returns published records only; source/intake safeguards remain effective.

### 4.4 SDK Jobs — local private-sector jobs and Admin referral service

**Purpose:** A new Sadiqabad-focused job board where approved local business owners submit vacancies. The Admin team moderates listings and runs candidate screening/referral as a service.

**Who may post:** Only a Supabase-authenticated business owner whose owner account is Admin-approved and who owns/controls at least one published business. Verify this server-side using current ownership/role data and RLS/Edge Function checks. Do not rely on hiding the form.

**Employer privacy:** The public job listing must not reveal who submitted/posted it. No employer name, business name, owner name, phone, WhatsApp, email, internal business ID, owner ID, or contact details in public page, API response, metadata, structured data, social preview, sitemap, offline snapshot or public logs. Authorized Admins can see the posting owner and linked business in the Admin job record. The job's public description may mention a workplace/location only when Admin-approved and must not expose the poster identity accidentally.

**Owner job submission form:** Include role/title, category/type, number of vacancies, job type, work location/area, salary or salary range (optional/“not disclosed”), duties, requirements/qualifications, experience, working hours/shift, benefits (optional), application closing date, English/Urdu content and optional relevant poster/image. Do not ask the owner to provide public contact details. Owner submissions always enter pending review. Owner can view status and edit/resubmit only through a controlled workflow; edits to a published job return to review when they materially change public content.

**Admin moderation:** Every job requires explicit Admin approval before public visibility. Admin can review all content and private employer linkage, edit/return for correction, approve, reject, unpublish, close/expire, reopen after review and archive. Maintain audit history and clear status labels. Public queries must return published/active records only.

**Public job board:** New SDK Jobs landing/list and shareable detail pages; search and useful filters (category, area, job type, date/closing status). Show closing date and vacancy details clearly. No direct Apply-to-employer path. Primary CTA: **Contact Admin on WhatsApp** using the approved number **03283212342**. The contact action should prefill a neutral message with the job title and canonical URL, without embedding private employer details. Also provide an explicit office-visit instruction.

**Candidate process:**
1. Candidate views a public approved job.
2. Candidate contacts Admin through WhatsApp or the approved office contact route.
3. Admin instructs candidate to bring a physical CV to the office during published recruitment hours.
4. Admin records candidate intake with consent and minimum necessary information.
5. Admin interviews/screens the candidate against the approved vacancy.
6. If suitable, Admin refers the candidate to the relevant employer.
7. Admin issues a controlled, verifiable referral letter for that candidate/job.
8. Admin records referral outcome/status for operational tracking.

No online CV upload is required in the initial release. Candidate personal data and CV details are private Admin-only records with strict RLS, retention/deletion policy to be defined before collection, and no public/offline exposure. Do not promise placement or guarantee an interview/job. The referral letter confirms the referral only, not employment or guaranteed selection.

**Recruitment fee and free period:**
- Free period runs through **31 January 2027 inclusive**.
- Fee becomes potentially applicable from **1 February 2027**.
- The fee amount is deliberately undecided and must be configurable by Admin in Admin settings. No amount may be invented, hardcoded, charged or displayed as final before the owner/Admin configures and approves it.
- Only the candidate pays the referral fee. Business owners are not charged for posting or referral under this approved scope.
- Admin must be able to record whether a candidate fee is waived/free-period, pending, paid, refunded/voided where applicable, with amount, currency, date, payment method/reference and receiving Admin/operator audit details. Do not integrate a payment gateway unless separately approved.
- Before the free-period end date, show the service as free. From 1 February 2027, if the Admin fee is still unset, do not invent a price or collect payment; show a controlled “contact Admin / fee to be confirmed” state and let Admin manage referrals under a deliberate policy. The owner must approve any later fee policy change.

**Office hours and contact policy:**
- Recruitment WhatsApp: **03283212342** (same Admin WhatsApp contact already used by Hello Sadiqabad, as owner confirmed).
- Default recruitment office hours: Monday–Friday, **10:00 AM–2:00 PM Pakistan time**.
- Saturday and Sunday: office closed; no recruitment visit hours apply.
- Candidate-facing copy must be strict and unambiguous: do not arrive before 10:00 AM or after 2:00 PM; do not visit on Saturday or Sunday.
- Admin can change office hours and working days later through a controlled setting. Display the configured hours consistently on SDK Jobs, job details, contact instructions and relevant Admin screens. Preserve the weekend closure by default; changing working days must be an explicit Admin action.
- Do not invent or display an office street address. Reuse the existing verified public office address if one exists; otherwise ask the owner to supply/verify it before publishing an address.

**Shareability:** Each published job has a stable canonical URL, approved share image/preview, correct Open Graph metadata, and share/copy-link actions. Social previews must not reveal employer identity or internal IDs.

**Admin operations:** Job pipeline dashboard, candidate queue, interview notes, suitability outcome, referral status, referral letter generation with unique reference/verification mechanism, fee configuration and collection ledger, free-period countdown/status, office-hour settings, audit trail and export with access control. Keep candidate and employer records separate from public job content.

**Acceptance:** Only eligible owners can submit; all posts pending until Admin approval; employer identity is Admin-only across every public surface; candidate CTA uses exact WhatsApp number; office-hour/weekend rules are enforced/displayed; fee is zero through 31 Jan 2027 and configurable thereafter without invented amount; candidate-only payment; referrals and letters are auditable; public jobs are shareable; candidate data is private.

### 4.5 Gov landing page and mobile navigation

**Gov landing page:** New public Gov route/landing page with a responsive two-column (or adaptive) category-card grid matching the existing category-card visual language. Four cards:
1. Government Jobs
2. Government Schemes
3. Local Authorities
4. Authority Profiles (the existing individual/person profile directory for authorities)

Each card has bilingual title/short description, suitable existing/verified icon or image, and navigates to its existing directory route. Do not duplicate authority data or build replacement directories. Inspect exact existing routes and data sources before linking.

**Mobile bottom navigation final order/intent:**
- Home
- Search
- Gov
- SDK Jobs
- Saved/Favorites

Remove separate Jobs, Schemes and Urgent bottom-nav items. The Urgent bottom-nav shortcut is removed because the Home page already has the Emergency card; preserve the Emergency page, emergency contacts and Home emergency card. Preserve all other routes and desktop navigation unless an inspected responsive design requires a narrow compatible adjustment. Labels and accessible names must be bilingual.

**Acceptance:** Gov card opens correct existing routes; all four sections are discoverable; mobile bottom nav has one Gov and one SDK Jobs item; no separate Urgent item; Emergency card/page still work; no route or deep link breaks.

## 5. Implementation phases and gates

Phases are ordered for dependency and risk. The owner has approved this plan, but each phase still requires the documented acceptance evidence before being marked complete.

### Phase 0 — Pre-implementation audit and design
- Reconcile this plan with current `main`, roadmap, handoff, existing Jobs/Schemes/Owner plan, code, tests, live schema/migration ledger, RLS and Storage policies.
- Audit current Admin performance and record baseline measurements.
- Map existing owner registration and business submission flow.
- Map current Jobs/Schemes image and bilingual capabilities.
- Confirm existing local-authority and authority-profile routes.
- Design SDK Jobs data boundaries and candidate privacy model.
- Produce additive migration/RLS/storage proposal; no production schema changes in this phase.
- **Gate:** all current code/data dependencies and migration strategy documented; no unresolved security boundary.

### Phase 1 — Admin performance
- Optimize Business and Data Quality loading and interactions.
- Verify before/after metrics and functional parity.
- **Gate:** desktop and mobile acceptance plus tests.

### Phase 2 — Add Business field approval and secure owner invitation
- Form redesign, taxonomy search/help, bilingual details, hours, map URL, facilities and media submission.
- Field-level moderation and safe public projection.
- Private pending media, approved publication and two-change monthly owner quota.
- Secure Admin-triggered Supabase invitation; owner sets password.
- **Gate:** end-to-end security/RLS/Storage tests, invitation/rollback tests, public privacy tests and mobile form QA.

### Phase 3 — Government bilingual content and media
- Extend Jobs/Schemes records and Admin forms with bilingual content completeness.
- Admin poster upload and publication gate requiring image.
- Canonical share URLs and social previews.
- **Gate:** official facts intact, RLS and media privacy verified, link previews checked.

### Phase 4 — SDK Jobs data, moderation and public board
- Additive schema, dedicated permission, owner eligibility checks, owner submission form, Admin moderation and public routes.
- Candidate contact CTA and employer anonymity tests.
- **Gate:** unauthorised owner cannot submit; no unapproved job public; no employer identity leakage.

### Phase 5 — SDK Jobs recruitment operations
- Candidate intake, private records, interview/suitability tracking, referrals, referral letter, fee ledger and Admin settings.
- Office schedule and WhatsApp integration.
- **Gate:** candidate privacy, role/permission, free-period and fee configuration, letter auditability and office schedule acceptance.

### Phase 6 — Gov landing and mobile navigation
- Four Gov cards, bilingual content and route linking.
- Replace bottom nav items with Gov and SDK Jobs; remove Urgent shortcut only.
- **Gate:** route/deep-link/mobile responsive/accessibility regression tests.

### Phase 7 — Full regression, deployment and handoff
- TypeScript, unit/integration tests, production build, GitHub CI, migration/RLS/Storage checks, deployment and production endpoint checks.
- Real browser testing and physical mobile QA for affected flows.
- Update this plan, child plans, roadmap and handoff with evidence.
- **Gate:** never mark complete or live without the corresponding evidence.

## 6. Cross-cutting security and data design requirements

- Use dedicated least-privilege permission keys for Admin modules; confirm naming against current permission architecture before migration.
- Public read models/views must explicitly select approved public fields. Do not expose raw submission JSON, owner IDs, employer IDs, candidate records, moderation notes or private storage paths.
- Server-side Edge Functions/RPC and RLS must enforce owner eligibility, field publication, image quotas, job moderation, fee collection permissions and referral-letter issuance.
- Every Admin action that changes publication, status, fee, hours, ownership or candidate outcome must be audited.
- Public share metadata, sitemap, search, cache and offline package must follow the same published-field allowlist as public API.
- File uploads require content-type and size checks, safe object paths, uploader authorization and appropriate private/public bucket policies.
- Time-sensitive policies use Asia/Karachi/Pakistan time consistently, with explicit boundary tests.
- Never expose candidate CV or interview notes to employers through public API. Share only the minimum candidate details with the employer after candidate consent and Admin referral.
- No payment gateway, SMS/WhatsApp automation, third-party recruitment integration or automated government scraping is included unless separately approved.

## 7. Owner-approved operational constants

| Setting | Approved value |
|---|---|
| Recruitment WhatsApp | 03283212342 |
| Free recruitment through | 31 January 2027 inclusive |
| Fee may start | 1 February 2027 |
| Fee amount | Not set; Admin configurable later |
| Fee payer | Candidate only |
| Business owner fee | None under this plan |
| Default office days | Monday–Friday |
| Default office hours | 10:00 AM–2:00 PM Pakistan time |
| Weekend | Saturday and Sunday closed |
| Candidate CV | Physical CV at office; no online CV upload in initial release |
| Owner image changes | Maximum 2 per business per calendar month |

## 8. Open items that must not be guessed

- Verify existing official office address before displaying it on recruitment pages.
- Verify exact current route paths for Local Authorities and Authority Profiles before wiring Gov cards.
- Admin-configured referral fee amount is intentionally unset.
- Any future fee waiver/refund rules beyond the recorded statuses require owner approval.
- Exact media size/dimension limits must align with current Storage policy and hosting limits after inspection.
- Any expansion of owner image quota to gallery/product images must be explicitly decided; this plan's initial cap covers business profile/logo and cover image change requests.

## 9. New-chat instruction

When the owner says **“GitHub repo mein plan parh lo”**:
1. Read this entire master plan first.
2. Read `docs/PROJECT_WORKING_RULES.md`, `PROJECT_ROADMAP.md`, `docs/NEW_CHAT_HANDOFF.md`, and all relevant child plans.
3. Check current GitHub `main`, migrations and CI/deployment status; do not assume this plan is already implemented.
4. Identify the next incomplete phase and its blockers.
5. Start only the next safe, approved phase. Give concise Roman Urdu updates and report evidence honestly.


---

## Phase 0 audit checkpoint — 25 November 2026

Read-only audit and design are recorded in [`docs/FINAL_PRODUCT_EXPANSION_PHASE0_AUDIT.md`](FINAL_PRODUCT_EXPANSION_PHASE0_AUDIT.md).

- Audited current `main` at `a310577362fde1d5ce15ecc1fed507cf0a72d668`, repository rules, roadmap, handoff, all approved child plans, deployment instructions and existing Government Jobs/Schemes/Owner implementation.
- Inspected live Supabase project state, public table RLS, relevant policies, Storage bucket/policies, migration ledger, Edge Functions and Security/Performance/Health Advisors.
- Confirmed current Admin performance causes in source: 19-request all-tabs reload, large eager Admin manager imports, unbounded business list rendering and repeated Data Quality category scans. Recorded a database-only business-list query baseline (697 rows; 5.347 ms execution) and clearly marked authenticated browser timing as still outstanding.
- Confirmed the existing Storage bucket is public; pending media requires a separate private bucket, not a folder in the current bucket.
- Confirmed current Owner Registration invitation does not associate the invited owner with the approved business; this must be addressed with an audited, idempotent server-side workflow.
- Confirmed repository/live migration drift (74 repository migration files vs 95 live ledger versions); no migration was applied and the baseline must not be replayed.
- No code, schema, data, Storage objects, Auth settings or deployment configuration changed during Phase 0.

**Disposition:** Phase 0 source/schema/security audit and additive design are complete. Real authenticated desktop/browser performance timings remain an explicit Phase 1 baseline/acceptance item; no millisecond UI claims are made. Proceed to Phase 1 only with this limitation kept visible, and do not mark Phase 1 accepted until desktop/mobile before-and-after traces and functional tests exist.


---

## Phase 1 implementation checkpoint — 25 November 2026

Initial Admin performance optimizations are implemented on `main` and deployed to production:

- Lazy-loaded Admin manager modules.
- Active-tab-scoped data loading instead of the former 19-request global reload.
- Delayed/lazy dataset loading for global Admin quick search.
- Business list pagination (50 per page) with memoized filtering; filtered select-all and bulk actions remain across the complete result set.
- Data Quality memoization, one-pass category/issue counts and 50-result pagination; CSV export remains complete.

**Evidence:** commit `6009012c143e90dbbcce1dfc2fddaa79c3fa2872`; [GitHub CI run 45585636119](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45585636119) passed build/typecheck/tests/dependency gate and Edge Function checks; Cloudflare Pages production deployment `759c75f9-d12d-45ec-a94d-196953c9ba19` succeeded with canonical alias `https://hellosadiqabad.com`.

**Phase 1 remains in progress, not accepted:** authenticated desktop before/after timings, browser interaction tests and mobile smoke tests were not available/performed. No performance milliseconds are claimed. No production database/schema/RLS/Storage changes were made.


## Phase 1 follow-up — latest code/deployment evidence (25 November 2026)

- Business list API now requests an explicit field allowlist and narrow category/area relations instead of `select('*')`; the full business record is fetched by ID only when the Admin opens Edit.
- Latest commit: `4ed8f50042928896064f3925f8e8f203e0951de7`.
- [CI run 45587036171](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45587036171) passed TypeScript, automated tests, dependency gate, production build and Edge Function typecheck.
- Cloudflare Pages deployment `51d981f8-e50a-400d-af08-ae5e14481940` succeeded for that exact commit at `https://hellosadiqabad.com`.
- Phase 1 is still not accepted: authenticated desktop before/after timings and mobile/browser functional acceptance remain outstanding. Do not move the roadmap status to complete until those criteria are evidenced.


## Phase 2 read-only preflight — 25 November 2026

The detailed current implementation/live schema baseline is recorded in [Add Business & Owner Approval Plan](ADD_BUSINESS_OWNER_APPROVAL_PLAN.md). Key confirmed facts: the current Add Business form auto-selects first taxonomy options and lacks several approved fields; `submissions` uses a generic payload with no field review ledger; `private.approve_submission` currently publishes the complete new-business listing in one branch; the separate owner registration table has no business/submission association; the deployed version-3 invitation function does not link the owner to a business; and the only Storage bucket is public. Phase 2 must solve these additively without affecting other submission types or making pending media public.

This was the pre-implementation preflight state. Phase 1 authenticated browser acceptance remains outstanding, but the owner subsequently authorised Phase 2 implementation in parallel; see the production rollout checkpoint below.


---

## Phase 2 execution checkpoint — owner-authorized continuation (25 November 2026)

The owner explicitly authorized starting Phase 2 without waiting for the outstanding Phase 1 authenticated browser/mobile acceptance, and changed the Git workflow to direct `main` commits only. Phase 1 remains **in progress / not accepted**; this authorization changes the work order, not the acceptance evidence.

- No feature branches or Pull Requests are to be created. Prior Phase 2 PR #19 was closed unmerged at the owner's instruction.
- This was a pre-rollout snapshot. The Phase 2 frontend, Admin UI, Edge Functions and migrations have since been ported to `main` and deployed to the existing production project; see the rollout checkpoint below.
- Migration 1 is on `main`. Static review found and corrected a malformed duplicate SQL tail, added explicit `service_role` grants needed by the Edge Functions, and corrected legacy backfill statuses. Latest migration-source fix: `ac3b54d58f106d20eb2ce02e00decd05915cc56f`.
- The Phase 2 tables and private pending-media bucket now exist in production. Migrations were additive; existing businesses/users and public media were preserved. Test transactions were rolled back.
- CI for commit `1bb9d3e2e530078a6d2f7ae4c63d2b350af4ea9a` passed both build and Edge Function jobs. Latest docs/migration-source CI and Cloudflare deployment are still being verified separately; CI does not execute SQL.
- Supabase staging creation was blocked because the organization has reached its two-active-Free-project limit. No project was created and no cost was incurred.

### Additional release blockers found during static review
1. Anonymous clients can currently upload directly to the private pending-media bucket before the Edge Function's rate limit runs. Replace this with a rate-limited server-issued signed upload authorization and remove unrestricted anonymous INSERT policy.
2. Newly created public tables require explicit Data API grants after Supabase's 30 October 2026 change. Migration 1 now grants the service-role permissions required by media submission/moderation Edge Functions.
3. Existing legacy `ModerationManager` still shows `new_business` rows and calls `approve_submission`. The coordinated release must route/hide those rows there and make the new field-level queue the sole new-business moderation path, preserving other submission types.
4. Existing legacy `done` new-business submissions may have `business_id IS NULL`; the live legacy approval function creates the business without backfilling that FK. Migration backfill must preserve `done` as approved and must not guess-link existing businesses by name/phone.
5. Media approval must be made retry-safe across Storage copy, business URL update, review-status update and audit write; rejected/approved pending objects need a retention/cleanup policy. Owner-invitation reject/approve audit and duplicate-invite rollback paths require tests.

**Historical release gate:** this pre-rollout note is superseded by the production rollout checkpoint below. The owner explicitly directed use of the existing Supabase project; additive migrations and rollback tests have since been completed there.

## Phase 2 production rollout checkpoint — 25 November 2026

Owner confirmed that no new Supabase project is to be created. All Phase 2 database work is being performed in the existing Hello Sadiqabad production project only. Changes were additive; test transactions were explicitly rolled back.

### Applied database migrations
- `business_field_approval_workflow` — field review ledger, private media metadata, owner request linkage, private pending-media bucket and RLS.
- `business_field_review_rpc` — permission-checked field approval/publish RPC and compatibility with existing business insert guards.
- `business_media_review_finalize` — atomic/idempotent media review status, quota request and audit finalization.
- `owner_registration_finalize` — atomic owner-request decision, business owner linkage and audit finalization.
- `owner_claim_plan_guard` — treats owner assignment/claim timestamp as metadata so legacy Free-plan feature values do not block owner linking.
- `guard_legacy_new_business_approval` — blocks the legacy all-at-once approval path for new-business submissions; only the field-review RPC can complete them.
- `skip_logo_plan_revalidation` — isolated logo updates no longer fail because of unrelated legacy plan fields; cover/WhatsApp plan gates remain enforced.

### Deployed application and Edge Functions
- Add Business now requests rate-limited, session-bound signed upload URLs; anonymous direct INSERT into the private pending-media bucket is not allowed.
- Submission verifies the uploaded object's actual MIME and size, and the session-bound path before accepting metadata. Failed submissions can clean up only paths belonging to that upload session.
- Admin has a dedicated Business Field Review queue. Legacy ModerationManager no longer routes new-business submissions to the old approval RPC.
- Media moderation is retry-safe and checks that the business is published; cover publication requires a plan with the cover feature.
- Owner invitation uses an atomic finalizer for request status, business-owner link and audit; legacy standalone owner requests remain supported.
- Active deployed Edge Function versions: `create-business-media-upload` v1, `cleanup-business-media-upload` v1, `submit-suggestion` v8, `review-business-media` v1, `manage-owner-registration` v4.

### Verification evidence
- [GitHub CI run 45614173801](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45614173801) passed.
- Cloudflare Pages production deployment for commit `bf927cf66b38f4aa34563b6d035f84ff513f6720` succeeded with canonical alias `https://hellosadiqabad.com`.
- SQL transaction/rollback tests passed for core field approvals, Free-plan WhatsApp rejection, media finalizer idempotency, owner request approve/reject idempotency, owner-business linking, legacy approval guard, isolated logo updates, Free-plan cover rejection and rate-limit counters. All test transactions were rolled back; no test business, submission, media asset, owner request or audit record was retained.
- Current production state: 122 derived field-review rows (97 approved rows for 13 historical `done` submissions and 25 pending rows for 3 current `new` submissions); 0 media assets; 0 image-change requests; 3 existing standalone owner requests; 13 historical `done` submissions still have `business_id IS NULL`. No business is guessed or linked by name/phone.
- The new private bucket is present and has no anonymous INSERT policy. Existing business rows, users and public Storage objects were not rewritten or deleted.

### Remaining acceptance work
- Run authenticated Admin browser QA for the Business Field Review queue, media approval/rejection/unpublish and owner invitation screens.
- Run one owner-approved end-to-end test with a clearly marked disposable submission and remove only that test data afterward; do not use a real business record for testing.
- Verify email delivery/redirect in the actual owner invitation flow and confirm public listing/image rendering.
- Phase 1 remains in progress/not accepted until its separate authenticated desktop/mobile performance acceptance is evidenced.


### Latest hardening follow-up — 25 November 2026

- Added and applied `owner_image_metadata_check` migration. Owner-uploaded image-change requests now compare the declared MIME type and size with actual Supabase Storage object metadata before creating a review request.
- Add Business uploads now use session-hash-bound paths. Cleanup is rate-limited, can delete only paths belonging to that upload session, and refuses to delete media already attached to a business submission.
- Public business profiles now consume the approved `map_url`, show approved Urdu landmarks, and retain safe fallback directions. Google Maps links are restricted to exact Google-owned hosts and validated both in the browser and in `submit-suggestion`.
- Latest CI: [45615114991](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45615114991) passed. Latest Cloudflare Pages production deployment for commit `1187b47bbe24bc59b31f72c2c3e2e9a45803f1f2` succeeded at `https://hellosadiqabad.com`.
- Latest active Edge Function versions: `create-business-media-upload` v2, `cleanup-business-media-upload` v2, `submit-suggestion` v9, `review-business-media` v2, `manage-owner-registration` v5.
- Total Phase 2 migrations applied to the existing project: 9. No new Supabase project was created.


### Final validation and database-advisor follow-up — 25 November 2026

- Added and applied the ninth Phase 2 migration, `phase2_index_and_policy_cleanup`: indexes all Phase 2 foreign-key columns flagged by the advisor and consolidates the owner/admin read policies for image-change requests. Re-check confirms no unindexed-FK or duplicate-permissive-policy warnings remain for the three new Phase 2 tables.
- Added server-side validation for the seven-day opening-hours structure, optional Urdu/landmark fields, safe Google Maps hostnames and the existing two-facility limit. Add Business enforces the same two-facility limit in the UI.
- Public business profile fetch now includes `map_url`, uses only validated Google Maps URLs for directions, and displays approved Urdu landmarks.
- Latest [GitHub CI run 45616069591](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45616069591) passed both build and Edge Function checks.
- Cloudflare Pages deployment containing the application code from `a1b210633c23747b91758fa515e83b8941425080` succeeded for commit `8b778ba2dc7eb04192c5159696353f88ea44334a` with canonical alias `https://hellosadiqabad.com`.
- Latest active Edge Function versions: `create-business-media-upload` v2, `cleanup-business-media-upload` v3, `submit-suggestion` v10, `review-business-media` v3, `manage-owner-registration` v5.
- Total Phase 2 migrations applied to the existing project: **9**. No separate Supabase project was created. Test-only database writes were all rolled back; verification found no test media URLs, test submissions, test owner links or pending Storage objects.


### Phase 2 public-form UX polish checkpoint — 25 November 2026

- Category/Area controls have responsive bilingual search/select panels, taxonomy counts, icons, clearer hints, styled select surfaces and RTL-aware affordances. Existing taxonomy relations and selection rules are preserved.
- Logo/Cover controls use accessible card-style image pickers with format/size guidance and selected-file feedback.
- Main CI `45638490612` and production browser smoke `45638490221` passed; Cloudflare deployment `8969830b-3848-4951-a1dd-7b01f3fda6de` succeeded. No database or existing user/business data was changed.
- This is a visual UX checkpoint only; Phase 2 acceptance remains open pending authenticated Admin/Owner click-through, owner media approval roundtrip and real invitation email/redirect verification. Phase 1 performance acceptance also remains open.

### Phase 1 implementation checkpoint — Admin data reuse — 25 November 2026

- Current-main source recheck: Admin managers are already lazy-loaded; the 19-position reload Promise is permission/tab-gated rather than 19 unconditional requests; business list uses explicit columns; BusinessManager and DataQualityManager show 50 items per page; DataQuality category counts are already computed in one pass.
- Added a 30-second in-memory cache for Admin business, taxonomy, profile and lead datasets across tab changes. Global quick search shares it; explicit child-action reloads bypass it; failed refreshes preserve the last good data and remain retryable. No local storage or database changes.
- CI `45639985225` passed; Pages deployment `81b032d7-64e1-45c1-a63c-1a46c60a8580` succeeded with the canonical alias.
- **Phase 1 is not accepted yet:** authenticated desktop/mobile before/after timings and interaction traces are still required. The database-only business-list query baseline is not a substitute for browser performance evidence.

### Phase 2 Admin review queue performance follow-up — 25 November 2026

- Business Field Review now loads review/media queries in parallel, signs all private image previews in one batch request, groups field rows by submission in one pass, and limits rendered review cards to 20 per page for both submissions and images.
- Moderation rules, private bucket, field status behavior and existing data remain unchanged.
- CI `45640942909` passed; Pages deployment `0ab58777-c70e-4b76-a808-53af57e2a3f1` succeeded. Authenticated Admin click-through and real media approval remain acceptance gates.