# SDK Jobs — Local Recruitment and Referral Service Plan

**Owner-approved decisions:** 25 November 2026. This is a new private-sector local recruitment module, distinct from Government Jobs.

## 1. Who can post
Only a Supabase-authenticated, Admin-approved business owner who has at least one published business. Verify ownership and active status server-side using current canonical relationships. No public self-asserted owner status.

## 2. Owner submission
Collect vacancy details only: English/Urdu job title and description, job category, vacancy count, job type, work area/location, salary (optional), duties, qualifications, experience, hours/shift, benefits (optional), closing date and optional poster. Do not ask for owner/business contact details for public display. The system may retain the posting owner/business relationship privately for Admin review.

All submissions start pending. Admin approval is mandatory. Edits to a live job that materially change its content return to review.

## 3. Public privacy
Public job pages must not reveal poster identity, business/owner name, phone, WhatsApp, Gmail, private business IDs, owner IDs, candidate or moderation data. Admin-only views show employer and source business. Review API, SEO metadata, Open Graph, sitemap, offline data, logs and search indexes for leakage.

## 4. Public experience and sharing
- SDK Jobs listing, search, filters and detail pages.
- Stable canonical URL per published job.
- Approved image in page card and social share preview.
- Share/copy link action.
- Contact Admin on WhatsApp: **03283212342**.
- Prefill a neutral message with job title and public URL only.
- No direct public employer contact or in-app employer application.
- Clear vacancy, area, requirements, closing date and office-visit instructions.

## 5. Candidate workflow
1. Candidate contacts Admin.
2. Admin asks candidate to bring a physical CV during office hours.
3. Admin records candidate intake with consent and minimum necessary details.
4. Admin interviews/screens candidate for the selected vacancy.
5. Admin records suitability decision and reason.
6. If suitable, Admin refers candidate to the linked employer.
7. Admin generates an official referral letter with unique reference and verification mechanism.
8. Admin tracks referral outcome.

No online CV upload in initial release. Candidate data, interview notes, contact details and CV details are private Admin-only. Define retention/deletion policy before collecting candidate data. Share minimum necessary candidate information with an employer only after candidate consent and referral. Referral is not a job guarantee.

## 6. Fee policy
- Free service through **31 January 2027 inclusive**.
- Fee may apply from **1 February 2027**.
- Fee amount is not decided. It must be configured by authorized Admin; never invent, hardcode or collect an unapproved amount.
- Only candidate pays. No business-owner fee under this plan.
- Admin records waived/free-period, pending, paid and refund/void states as applicable, with amount, currency, payment date, method/reference, operator and audit trail.
- No payment gateway in initial scope.
- If 1 February arrives and fee is unset, do not invent a price or collect money; show “fee to be confirmed/contact Admin” and follow an explicitly approved Admin policy.

## 7. Recruitment office contact and schedule
- WhatsApp: **03283212342**.
- Default days: Monday–Friday.
- Default hours: **10:00 AM–2:00 PM Pakistan time**.
- Saturday and Sunday: closed.
- Candidate copy must state strictly: do not arrive before 10:00 AM or after 2:00 PM; do not visit Saturday/Sunday.
- Admin may change office hours and working days through a controlled, audited setting. Show the same current schedule across SDK Jobs and job details.
- Do not invent an office address. Use existing verified address only, or ask owner to confirm before publishing.

## 8. Admin workspace
- Job submission/review queue, employer identity and linked business.
- Approve, reject, request correction, edit, unpublish, close/expire, reopen and archive.
- Candidate intake and consent, interview scheduling/notes, suitability and referral statuses.
- Referral letter generation, unique reference, printable/shareable PDF or controlled document, verification page/code and audit log.
- Fee settings, free-period status, collection ledger and receipts.
- Office schedule and WhatsApp settings.
- Strict permission separation and audit of every sensitive action.

## 9. Data/security requirements
Use additive schema after auditing current database and migration ledger. Separate public job content from private employer linkage and candidate records. RLS and server-side functions enforce owner eligibility, moderation, candidate access, fee management and letter issuance. Public anonymous SELECT returns published/active safe fields only. No candidate or employer private data in offline cache, public search, metadata or analytics. Keep Pakistan timezone consistent for deadlines and schedule.

## 10. Acceptance
- Unapproved/unqualified owners cannot post.
- No submitted job is public before Admin approval.
- Employer identity remains Admin-only on every public surface.
- Contact CTA uses the approved WhatsApp number.
- Office schedule/weekend closure is correct and Admin configurable.
- Free through 31 Jan 2027; no fee amount invented; candidate-only fee.
- Candidate records and CV details remain private.
- Referral and letter are auditable and not represented as a placement guarantee.
- Every published job has a canonical share URL and approved social image.


## Phase 4 kickoff — 26 November 2026

The owner confirmed all testing through Government Jobs and Government Schemes (master workstream 4.3) is complete and correct. The next workstream is this SDK Jobs plan; do not repeat the already accepted tests unless a regression is reported.

- [x] Reconciled this plan with current `main` and the Final Product Expansion Master Plan.
- [x] Confirmed no SDK Jobs routes, table, owner submission UI, Admin manager or Edge Function exists yet; Government Jobs remains separate.
- [x] Inspected current owner eligibility source: active `profiles.role='owner'` and at least one `businesses` row with `owner_id=auth.uid()` and `status='published'`.
- [x] Inspected current dedicated Admin permission pattern and live RLS/grants. New permission must be `sdk_jobs.manage` and must be explicit for staff; do not add broad staff-type defaults.
- [x] Inspected live migration ledger (108 prior versions); three SDK Jobs migrations are now applied and recorded (111 total). Existing data/schema baseline must not be replayed.
- [x] Added detailed data-boundary/security design: [`SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md`](SDK_JOBS_PHASE4_DATA_MODEL_SECURITY_DESIGN.md).
- [x] Finish exact areas schema, staff permission editor/Admin tab gates and Storage limits review; findings are in the Phase 4 design document.
- [x] Additive `sdk_jobs`, `sdk_job_status_history` and `sdk_job_admin_notes` tables; private employer linkage and published-only invoker-security public view applied via migrations `20261125210353` and `20261125210439`.
- [x] Database-side owner eligibility and pending-status enforcement; owner submission simulation passed inside a rolled-back transaction.
- [x] Dedicated `sdk_jobs.manage` added to DB permission RPC, TypeScript key and explicit staff permission editor; no broad staff-type grant.
- [x] Consolidated RLS policies and all new FK indexes via migration `20261125210610`; no SDK Jobs-specific security/performance advisor warnings remain.
- [x] First-pass Owner submission form and owner request status list added at /owner/sdk-jobs; CI run 45707087025 passed build and Edge Function jobs.\n- [ ] Signed private poster upload and approval/promotion remain open.
- [ ] Permission-gated Admin moderation UI and workflow actions.
- [ ] Public listing/detail/search/filter/share pages and employer-anonymity checks.
- [x] Foundation CI and production deployment passed; database authorization/public-projection transaction tests and advisor checks passed.
- [ ] Run UI/adversarial authorization, public leakage, status-transition, media privacy and authenticated browser acceptance.

**Phase boundary:** candidate intake, consent records, CV details, interview notes, suitability, referrals, referral letters, fees and office-hour configuration remain Phase 5. Do not collect candidate personal data in Phase 4.

**Current status:** Phase 4 audit/design and database foundation are complete. Migrations `20261125210353`, `20261125210439` and `20261125210610` are applied and recorded. The private job tables, owner eligibility guard, `sdk_jobs.manage` permission, Admin-only notes/status history and published-only invoker-security projection are live. Owner and cross-owner authorization tests ran in rollback transactions; all temporary rows were rolled back and live job/history/note counts remain zero. Security/performance advisor checks show no SDK Jobs-specific security-definer-view, unindexed-FK or multiple-permissive-policy finding. Remaining Phase 4 work is owner UI/media upload, Admin moderation UI, public board/share routes and browser/adversarial acceptance.


### Database foundation acceptance — 26 November 2026

- [x] Live migrations `20261125210353`, `20261125210439` and `20261125210610` applied and recorded; migration ledger is 111 versions.
- [x] Owner submission transaction test passed: identity derived from `auth.uid()`, selected published business checked server-side, status forced to `pending_review`, no pending job visible in public projection.
- [x] Cross-owner business submission denied; status history trigger verified; all tests rolled back. Live counts: 0 jobs, 0 history rows, 0 Admin notes.
- [x] Anon has no table-level SELECT/private-column access; published public view is invoker-security. `sdk_jobs.manage` is wired through the DB permission RPC, TypeScript type and explicit staff permission editor.
- [x] No SDK Jobs-specific security-definer-view, unindexed-FK or multiple-permissive-policy advisor finding remains.
- [x] CI [45702011116](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45702011116) passed; production Pages deployment `3d3bf1ec-2f80-4695-886e-75aaf2b528cb` succeeded with canonical alias.
- [ ] Owner form/private poster upload, Admin moderation UI, public routes and end-to-end browser tests remain in progress.


## Owner Portal UI increment — 26 November 2026

- [x] Added an authenticated Owner Portal route at /owner/sdk-jobs, protected by the existing RequireAuth + owner-role gate.
- [x] Added SDK Jobs navigation in the Owner Portal.
- [x] Added a first-pass vacancy submission form using the existing sdk_jobs table and owner RLS/trigger enforcement; the selected source business is restricted in the UI to the authenticated owner's published businesses and is independently revalidated by the database.
- [x] Form captures English/Urdu title, summary and description, category, vacancy count, job type, area/location, optional salary, duties, qualifications, experience, hours, benefits and closing date.
- [x] Added owner-only request status list using the owner RLS policy; employer linkage is not displayed publicly.
- [ ] CI/typecheck/build verification for this UI increment.
- [ ] Add signed private poster upload and Admin approval/promotion. Current UI explicitly tells the Owner that no listing can publish without an approved image; no public media path or upload shortcut was added.
- [ ] Add controlled owner edit/resubmission after designing preservation of the previously approved public version. Do not enable edits to published records until this is solved: current status trigger would take the published row out of the public view immediately.
- [ ] Admin queue/actions, public listing/detail/search/share pages and adversarial privacy/browser acceptance remain open.

**Current status:** Owner submission UI has been added to main but is not yet CI-verified or production-released. No poster upload, Admin moderation UI or public SDK Jobs pages are claimed complete. The form writes only to the private sdk_jobs table; the published-only public view remains the only planned public read surface.


## Admin moderation UI increment — 26 November 2026

- [x] Added SDK Jobs item to Admin navigation gated by the explicit sdk_jobs.manage permission.
- [x] Added a lazy-loaded Admin SDK Jobs moderation workspace with queue, detail view, private employer linkage IDs, status history and private Admin notes.
- [x] Added guarded status actions for request correction, reject, unpublish, close, return to review and archive. Publish is blocked until an approved poster exists, as required by the database constraint and privacy plan.
- [x] CI/typecheck/build verification for the Admin workspace and tab wiring passed in run 45707358141 (build + Edge Function jobs).
- [ ] Authenticated Admin browser test, explicit staff permission denial/allow test and live RLS verification.
- [ ] Business name/owner-friendly identity resolution in the Admin detail view where existing Admin data permissions allow it.
- [ ] Poster upload/promotion, public board/detail routes and privacy/SEO/offline checks.

**Current code status:** Owner submission UI and Admin moderation workspace are committed to main; CI run 45707358141 passed both build and Edge Function jobs. These UI increments are not yet production-deployed or authenticated-browser-tested. It does not publish jobs without an approved poster. No public SDK Jobs route has been added yet.


## SDK Jobs poster, publication privacy and public-board increment — 26 November 2026

- [x] Applied live migration `20261125220215_sdk_jobs_poster_private_upload` and committed the matching migration file. Migration ledger was 112 after this migration; the later Owner-feedback migration brings it to 113.
- [x] Reused the existing private `hs-pending-business-media` bucket without changing its 5 MiB JPEG/PNG/WebP restrictions or making it public.
- [x] Added an Admin-only SELECT policy scoped to the `sdk-jobs/` folder and explicit `sdk_jobs.manage` / Super Admin authorization.
- [x] Hardened the owner-write trigger and RLS: a pending-review Owner can update only the pending poster path; the path must embed that exact job ID and owner ID. New owner inserts forcibly clear any client-supplied media path. Transaction tests passed for eligible owner submission/path attachment, denial of public-content mutation while pending, and denial of a path belonging to another job; all test rows were rolled back.
- [x] Deployed `create-sdk-job-poster-upload` (JWT required): verifies active Owner, own pending-review job, MIME/size declaration, rate limits and generates a one-time private signed upload path.
- [x] Added Owner Portal optional poster upload after submission and a retry control in the request list. Actual uploaded bytes are not trusted based on browser MIME; Admin review verifies JPEG/PNG/WebP magic bytes and the 5 MiB limit.
- [x] Deployed `review-sdk-job-poster` (JWT required): Admin permission check, private preview/reject, magic-byte validation, promotion to the existing public media bucket only after approval, private pending-object cleanup, and poster action history.
- [x] Added Admin poster preview, approve/reject actions, full content review fields and a required human privacy-review acknowledgement before publication.
- [x] Deployed `publish-sdk-job` (JWT required): requires Admin permission, pending-review state and approved poster; blocks expired closing dates and scans public text for linked business name, Owner name/email/phone, phone/email patterns and external links before publishing.
- [x] Added public `/sdk-jobs` listing and `/sdk-jobs/:slug` detail routes using only `sdk_jobs_public`; search and category/area/type/closing-date filters, canonical metadata, JobPosting structured data with confidential employer identity, approved poster, share actions and the exact Admin WhatsApp CTA.
- [x] Added the approved recruitment office instruction: physical CV, Monday–Friday 10:00 AM–2:00 PM Pakistan time; closed Saturday/Sunday. No street address is invented or displayed because a verified address has not been supplied.
- [x] Added desktop header/footer navigation and dynamic sitemap entries from the published-only public view. No employer/private data is queried by the sitemap.
- [x] Transactional security checks passed: anon cannot select `employer_owner_id`; Owner content mutation and cross-job pending path attachment were denied; test transactions rolled back. Live SDK Jobs/job-history/Admin-note counts remain zero.
- [x] Supabase Security Advisor has no SDK Jobs-specific finding; existing unrelated project findings remain (private analytics table RLS info and leaked-password protection warning).
- [x] Latest combined CI run [45710844636](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45710844636) passed both build and Edge Functions for the final poster/publication/admin-detail code.
- [ ] Authenticated Owner upload and Admin preview/approve/publish browser acceptance; verify real signed upload and real image promotion using an authorized browser session.
- [ ] Production Pages deployment and public endpoint/sitemap smoke tests after CI and browser acceptance.
- [x] Added JWT-protected `get-sdk-job-employer-details` Edge Function; Admin UI now displays linked business name/contact and Owner name/contact only to active Super Admin or staff explicitly granted `sdk_jobs.manage`. No broad businesses/profiles RLS grants were added.

**Release gate:** Code and Edge Functions are committed/deployed, and the additive database policy/trigger migration is live. Do not call the public feature production-released yet: latest CI is running, no real authenticated upload/publish browser acceptance has been performed, and Pages deployment is pending. No candidate intake, CV upload, referral, fee collection or office-hour settings were added (Phase 5 remains separate).


- [x] Added owner-visible `owner_feedback` (separate from private Admin notes), with 2,000-character limit. Only authenticated Owner/Admin can read; anon has no column grant and the public view does not include it.
- [x] Admin must provide an Owner-facing reason when requesting correction or rejecting; Owner Portal displays it.
- [x] Owner can edit/resubmit draft or changes-requested jobs; the server trigger returns them to `pending_review` and clears old feedback. Published-job editing remains intentionally disabled in the UI until a version-preservation design is approved.
- [x] Rolled-back DB tests passed: Owner can read Admin feedback; Owner resubmission returns to pending review and clears feedback; Owner cannot change the feedback; anon cannot read the column. All test rows rolled back.

**Final UI/Edge CI confirmation:** run [45711210914](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45711210914) completed successfully (build + Edge Functions) on commit `2e50c3d6972682c70f2bbf0934a49ae1df3d5c8d`. This includes the Owner correction/resubmission UI and owner-visible feedback.


## Social previews, Owner correction loop and final automated checks — 26 November 2026

- [x] Added Cloudflare Pages social-preview handlers for `/sdk-jobs` and `/sdk-jobs/:slug`; detail crawler metadata reads only the published `sdk_jobs_public` projection, includes approved poster/canonical URL/JobPosting JSON-LD, and uses a generic confidential employer label. No owner/business IDs, contacts, feedback or pending-media paths are selected.
- [x] Added Node tests in `scripts/sdk-job-social-preview.test.mjs` for public-projection field allowlisting, employer-data absence, missing/unpublished job 404/noindex, non-crawler pass-through and listing metadata.
- [x] Added CI Node syntax checks for both SDK Jobs Cloudflare Pages Functions and included the social-preview tests in `npm test`.
- [x] Added Owner-visible moderation feedback in migration `20261125221201_sdk_jobs_owner_visible_feedback`; private Admin notes remain separate. Owner can read feedback but cannot alter it; anon cannot read the column and public view excludes it.
- [x] Added Owner edit/resubmit for draft and changes-requested jobs. The DB trigger returns resubmissions to pending review and clears old feedback. Published-job editing remains disabled until a public-version preservation design is approved.
- [x] Rolled-back DB tests passed for Owner feedback visibility, Owner feedback write denial, feedback clearing on resubmission and anon feedback denial.
- [x] Latest live counts after rollback: 0 SDK Jobs, 0 status-history rows, 0 Admin notes; 4 eligible active Owner-to-published-business links exist for future authorized browser acceptance.
- [ ] Final CI for the latest social-preview/test commit is queued as run [45711961724](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45711961724); recheck its conclusion before release.
- [ ] Authenticated Owner/Admin browser upload, preview, correction/resubmission, approve and publish acceptance.
- [ ] Production Pages deployment and live public route/sitemap/social-crawler smoke tests.

**Release gate remains closed:** Do not deploy Pages or claim the feature production-released until latest CI passes and authenticated Owner/Admin browser acceptance is completed.


- [x] Added slug/path safety migration `20261125222053_sdk_jobs_slug_path_safety`: strict lowercase hyphenated slug constraint; Owner cannot set an unsafe slug or change an existing slug. This prevents a crafted slug from affecting the public poster storage path.
- [x] Rolled-back DB tests passed: unsafe slug insert denied and Owner slug mutation denied. Live SDK Jobs/history/notes counts remain zero; Security Advisor still reports only the two pre-existing unrelated items.


## Database-enforced Admin approval/publication gate — 26 November 2026

- [x] Added migration `20261125222340_sdk_jobs_admin_action_authorization` (ledger 115). A private RLS-protected one-time authorization table is used for poster approval and publication.
- [x] The public authorization RPC is executable only by `service_role`; anon/authenticated cannot call it. It validates the actor has active Super Admin or explicit `sdk_jobs.manage`, the job is pending review, and poster requirements are met.
- [x] DB trigger now blocks direct Admin table updates that set `approved_image_url` or transition a job to `published` without a matching 90-second one-time authorization. The trigger consumes the token on success.
- [x] `review-sdk-job-poster` and `publish-sdk-job` now create the one-time DB authorization only after their server-side validation, then perform the user-scoped update. Edge Functions redeployed with JWT verification enabled.
- [x] Rolled-back DB tests passed: direct poster approval blocked, direct publish blocked, authorized poster approval and publish succeeded, authorization tokens consumed, no test rows persisted.
- [x] Privilege check passed: anon=false, authenticated=false, service_role=true for authorization RPC execute.
- [x] Security Advisor after this migration still shows only the same two unrelated project findings; no SDK Jobs-specific security warning.
- [x] CI [45712905357](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45712905357) passed build and Supabase Edge Function checks for the authorization-gated functions.
