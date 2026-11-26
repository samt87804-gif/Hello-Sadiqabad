# Owner Portal — Audit & Improvement Implementation Plan

**Status:** Owner approved the full roadmap on 27 November 2026. Phase 0 manual acceptance is now complete after Owner confirmed the Business Field Approval queue displays the four active requests. Phase 1 technical implementation is deployed and awaits its specific Owner manual acceptance. Phase 3E Reviews/Inquiries filters are implemented on `main` and Cloudflare Pages build/deployment is verified on the canonical production domain; GitHub Actions status is unverified and Owner acceptance is pending. Work is performed directly on `main` under `docs/PROJECT_WORKING_RULES.md`.

## Working agreement

- Keep this checklist current as work proceeds; tick only tasks implemented and verified.
- Explain every completed change in practical Roman Urdu: what changed, why it helps, how it works, and exact Owner actions.
- Preserve all existing Owner/Admin workflows, records, approvals, RLS and image-compression safeguards.
- Existing Supabase project only. Reconcile live migration history before any schema change; never replay the baseline.
- Do not call a feature complete based only on a green build. Track CI, deployment, endpoint checks and Owner manual acceptance separately.

## Phase 0 — Security: private Admin notes

**Goal:** Owners must never be able to read internal Admin notes attached to their own submissions. Admin review must continue working.

- [x] Re-read canonical working rules, roadmap, handoff, Owner Portal source and live RLS/grants.
- [x] Confirmed `authenticated` has table-wide SELECT on `public.submissions`, including `admin_note`; Owner RLS permits reading the Owner's own eligible submissions.
- [x] Applied additive Admin-only note-reader RPC to the existing Supabase project. Live migration version: `20261126202451` (`owner_submission_private_notes_rpc`). It checks Super Admin or `moderation.review`, uses a fixed empty search path, and is not executable by anon.
- [x] Updated Owner submission query to stop requesting `admin_note`.
- [x] Updated Business Field Review Admin queue to load prior private notes through the permission-checked RPC; generated database types updated.
- [x] Commit the application/RPC migration and verify GitHub CI + Cloudflare Pages deployment (commit `2d3f306839e17500abaa5f2b6bd7216bcdfc2330`; CI run `45890993686` succeeded; Cloudflare Pages deployment `7bf8e537-e786-4688-a283-8d0c16dbd355` build/deploy succeeded).
- [x] Apply additive privilege migrations `20261126202642` and `20261126202723`: removed table-wide SELECT, granted only required non-private columns, and removed `assigned_to` SELECT.
- [x] Verify live grants: authenticated table-wide SELECT is false; `admin_note` and `assigned_to` SELECT are false; required safe columns remain selectable.
- [x] Rollback/auth simulation: non-Admin private-note RPC call is denied; simulated Super Admin can retrieve the note result through the protected RPC without exposing note text in the test output.
- [x] Owner manually confirmed My Businesses request history/statuses load and private Admin notes are not exposed in Owner Portal.
- [x] Owner manually confirmed My Payments history and Plan details still load.
- [x] Owner confirmed Admin → Business Field Approval displays the four active request cards after Refresh (27 November 2026). This closes the previously reported empty-queue visibility acceptance.
- [x] Owner manual acceptance for Phase 0 recorded on 27 November 2026. Previous-note content itself could not be demonstrated because live records contain no non-null legacy `admin_note`; private-note access remains protected by the Admin-only RPC and column grants.

**Important migration note:** The repository contains a later-timestamped financial-profile migration file while the live ledger already records that feature under earlier versions. That file must not be replayed. The notes RPC and access restrictions are recorded as live migrations `20261126202451` (`owner_submission_private_notes_rpc`), `20261126202642` (`restrict_owner_submission_private_note_select`) and `20261126202723` (`restrict_submission_assignment_column_select`). Keep each repository migration file aligned to the exact live version; do not replay the unmatched financial migration.

## Phase 1 — Data correctness

- [x] Count both `new` and `in_review` Owner business requests in the pending-review summary; added a regression test.
- [x] Pending-review summary now uses a separate exact count query scoped to the signed-in Owner and the same six Owner-visible submission types; it is independent of the 20-row request-history page. Demo mode counts the full matching set. Added a regression test with 28 Owner requests, including pending rows beyond the first 20, plus other-owner, wrong-type and final-status exclusions.
- [x] Set `handled_by` only when an inquiry is marked `handled`; marking it `read` no longer assigns the current user as handler. Demo and live API paths match; added regression assertions.
- [x] Added regression tests for pending-review counting and inquiry handler tracking.
- [x] CI and production deployment verified: commit `b63a8a4a42a6dffd90f435e7ae1bb8e0d002015b`, CI run `45891440166`, Pages deployment `54bea682-bd88-4285-8daf-c9b60d59ae8b`.
- [ ] Owner manual test of pending-review count and inquiry read/handled workflow.

### Phase 1 count accuracy follow-up — implementation awaiting CI/deployment

- Owner approved the narrow correction on 27 November 2026.
- The counter now queries the exact count of rows for the signed-in Owner, limited to the existing Owner-visible request types and statuses `new` / `in_review`; it no longer derives the summary from the first 20 history rows.
- Existing history pagination and Load older requests behavior are unchanged. Demo mode applies the same Owner/type/status filters across all in-memory submissions.
- Regression coverage creates 28 matching Owner requests with pending rows only beyond the first 20, and verifies other-owner, correction-type and rejected rows are excluded.
- No schema, RLS, permissions, submission records or migration changes are included. Initial CI run `45911358060` passed automated tests and production build but TypeScript caught a missing `SubmissionRow` type import in the new test; the import has now been corrected in a follow-up commit. Await the follow-up CI and matching Pages deployment before asking for manual acceptance.

## Phase 2 — Owner experience

- [x] Add per-notification read/unread actions and use stored `link_path` only for safe internal Owner Portal navigation; added regression tests for the path guard and demo read/unread behavior.
- [x] Show Urdu notification title/body when Urdu is selected, falling back to English when Urdu text is empty.
- [x] Add per-item and mark-all loading states plus success/error feedback for notification actions.
- [x] Load the current unread notification count on My Payments instead of hard-coding zero.
- [x] Replace the long horizontal mobile navigation strip with a compact collapsible menu; all existing destinations and sign-out remain available.
- [x] Add an honest empty state when no real search-attribution terms are available; no fabricated metrics.

## Phase 3 — Reliability and scale

- [x] Prevent stale business-scoped data from appearing after switching selected businesses: clear stats/offers/products immediately and discard results from superseded requests.
- [x] Sequence overlapping Owner data loads; invalidate in-flight requests on dependency changes/unmount, ignore stale responses/errors, and clear business-scoped state before/at selection changes.
- [x] Reduce unnecessary cross-page notification fetching: Owner pages now request only the unread count for the navigation badge; the full notification rows load only on Owner Portal → Notifications. Dashboard's full reviews/inquiries data remains intact for accurate aggregate counts.
- [x] Reviews and Inquiries use server-side pages of 20; My Businesses request history uses pages of 20 with Load older requests. Existing records and order are preserved.
- [x] Owner confirmed all Phase 3D unread-badge manual tests passed on 27 November 2026 (badge decreases on Read, increases on Unread, and stays consistent on Dashboard/My Payments).

## Phase 4 — Business listing management

- [x] Replace the hard-coded offer expiry default with a date 30 calendar days after today's Pakistan-local date; existing start/end-date validation remains enforced.
- [x] Phase 4B Owner gallery management designed and implemented with mandatory smaller WebP compression, plan limits, private upload, Admin approval, Owner removal requests and serialized publication; see `docs/OWNER_GALLERY_MANAGEMENT_PLAN.md`.
- [x] Owner confirmed all gallery upload/approval/rejection/removal manual tests passed on 27 November 2026.

## Phase 5 — Optional Owner profile improvements

- [x] Evaluated Owner profile photo and notification preference controls. Neither is added in this phase: there is no existing persisted preference model, and profile-photo support would need a separately approved upload, mandatory compression, private review and publication lifecycle. No new personal data fields or upload routes were introduced.
- [x] My Payments now shows an actionable load error with Retry, retains already-loaded history if a refresh fails, ignores stale overlapping reload responses and disables refresh/correction actions while busy.
- [x] Payment correction submission has an immediate in-flight guard to prevent rapid duplicate submissions; receipt data remains read-only until Admin approval.
- [x] Owner Profile now shows request-history loading/error states and a Retry action; profile approval submission stays disabled until existing request history is loaded successfully, preventing an unnoticed duplicate pending request.
- [x] Profile approval and password update buttons show busy states and block repeat submissions while their requests are in flight.
- [x] Owner confirmed Profile and My Payments manual tests passed on 27 November 2026 (loading/retry and busy/duplicate-submit behavior).
- [ ] If Owner wants profile photos or saved notification preferences later, request separate scope approval before design/implementation.

### Phase 3D — notification overfetch reduction (implemented, deployed and Owner-manually accepted)

- Added `fetchUnreadNotificationCount`: live Supabase requests return only an exact count of the signed-in Owner's unread notifications; demo mode calculates the same count locally.
- Shared Owner Portal pages now fetch only that count for the navigation badge instead of downloading every notification row. The Notifications page alone fetches full notification content. My Payments also uses the lightweight count.
- Added a regression test for unread count changes when a notification is marked read. Existing per-notification read/unread, safe internal links and Owner notification list remain unchanged.
- Dashboard full reviews/inquiries datasets were deliberately preserved because Dashboard totals depend on them. No migration, RLS/grant change, notification mutation or user-data change was made.
- API commit `4bde7385f1b0936e40543125963c9f5cd8d5df6c`; Owner UI commit `08e6a06d277e224a656d1cb25692f63d1f675313`; regression test commit `fad60e254f66c8b8783245b1e132bf42a6fd6cdb`.
- Cloudflare Pages production deployment `f4095c61-159d-4489-b4d7-02b2b0d46a9b` succeeded; canonical alias `https://hellosadiqabad.com` is attached.
- Owner explicitly confirmed all unread-badge tests passed on 27 November 2026: marking Read decreases the badge, marking Unread increases it, and Dashboard/My Payments remain consistent. This is Owner-reported acceptance.
- GitHub Actions status for the added regression test remains unverified because the connected commit-status check returned no statuses; do not claim CI passed.


### Phase 3E — Reviews and Inquiries status filters (implemented and Pages-deployed; GitHub CI status unverified; Owner acceptance pending)

- Owner Reviews now has All / Replied / Not replied filters. Replied state is based on a non-empty `owner_reply`; only approved public reviews remain eligible, as before.
- Owner Inquiries now has All / New / Read / Handled filters using the existing inquiry status values.
- Filters are applied in the Supabase query before the existing 20-row pagination, so matching older records are not missed. Demo mode applies the same filter before pagination.
- Changing a filter resets the list to its first page; Load more continues within that filter. Existing sort order, owner-selected business scope, reply editing, inquiry actions and Dashboard aggregate loaders remain unchanged.
- No schema migration, RLS/grant change, new data field or existing-record mutation was introduced.
- Commits: API `dc68cdd464c3523b38d351c5763a4679ddf1e323`; Owner page wiring `41781e579de653626105c3974c74d3046aad96a1`; filter controls `36408b907bdfa10244dbb0ad72922ad20e89abd4`; initial regression tests `f4869d72cffd5c995d73d33f545644b37747eaac`; expanded 63-row filtered-pagination regression tests `4590ce4ee79ffd0d534ce76ccfe6c669993b0ef5`.
- Cloudflare Pages production deployment `a9db5c36-39db-47f4-a73c-6ef67a69d5e5` succeeded for test commit `4590ce4`; all stages passed and canonical alias `https://hellosadiqabad.com` is attached. This deploy includes the filter UI and server-side query changes.
- GitHub combined commit status returned no statuses for the test commit; automated test execution is not claimed. Pages `npm run build` passed, but it does not substitute for the separate automated test suite.
- [ ] Owner manual acceptance of all four filter choices, correct results and Load more pagination.

## Phase 6 — Final verification and release

- [x] GitHub CI run `45902085685` passed TypeScript typecheck, automated tests, production build and Supabase Edge Function typecheck for Phase 5 commit `f4a211284354ec4d02f1894e0ff9bc8049235a11`.
- [x] Verified GitHub Actions CI run `45902085685` and matching Cloudflare Pages production deployment `cb4d87a5-9254-44b7-9761-c0dfaf5cebc3` for Phase 5 commit `f4a211284354ec4d02f1894e0ff9bc8049235a11`.
- [x] Owner confirmed the Phase 5 Profile/My Payments checks passed on 27 November 2026.
- [x] Owner confirmed the deployed public gallery `Close / بند کریں` button test passed; mobile/desktop confirmation is recorded as Owner-reported, not independently browser-tested.
- [x] Updated this plan, `PROJECT_ROADMAP.md` and `docs/NEW_CHAT_HANDOFF.md` with Owner acceptance and the next safe roadmap task.
- [x] Owner confirmed Phase 3D notification badge behavior passed on 27 November 2026.
- [ ] Continue remaining Phase 3D search/filter audit; preserve Dashboard aggregate accuracy, notification privacy and existing pagination.


## Phase 0 release evidence

- Application commit: `2d3f306839e17500abaa5f2b6bd7216bcdfc2330`.
- GitHub Actions CI: run `45890993686`, completed successfully. TypeScript typecheck, automated tests, production build and Edge Function typecheck passed.
- Cloudflare Pages: deployment `7bf8e537-e786-4688-a283-8d0c16dbd355`, production build and deploy stages succeeded for the same commit; canonical domain alias is present.
- Supabase live migrations: `20261126202451`, `20261126202642`, `20261126202723`.
- Post-migration permission check: authenticated has no table-wide SELECT on `public.submissions`; SELECT on `admin_note` and `assigned_to` is false; required safe columns remain selectable.
- Supabase security advisor still reports the generic authenticated SECURITY DEFINER warning for this new RPC. This is intentional: it is the only Admin read path for private notes, checks Super Admin / `moderation.review` inside the function, and non-Admin denial was tested. Other existing security/performance advisor findings remain separately tracked; no broad security relaxation was made.
- Remaining acceptance: signed-in Owner/Admin browser testing by the Owner. No authenticated browser session was used by the assistant.


## Phase 1 release evidence

- Commit: `b63a8a4a42a6dffd90f435e7ae1bb8e0d002015b`.
- GitHub Actions CI run `45891440166` passed: TypeScript, automated tests (including the new pending-count and inquiry-handler regression tests), production build and Edge Function typecheck.
- Cloudflare Pages deployment `54bea682-bd88-4285-8daf-c9b60d59ae8b` succeeded for the same commit.
- Owner manual acceptance remains pending.


### Phase 2 database hardening

- Live migration `20261126203248` (`restrict_notification_updates_to_read_flag`) revokes table-wide notification UPDATE from `authenticated` and grants UPDATE only on `is_read`.
- Existing RLS remains in force: users can update only their own notification rows. The existing mark-all-read RPC changes only `is_read` and remains compatible.


## Phase 2 release evidence

- App commit: `1cc43f63c1499308fbe417dd08509fb0e8ccfcb5`.
- GitHub Actions CI run `45892045086` passed: TypeScript, automated tests (including safe-link and per-notification read/unread tests), production build and Edge Function typecheck.
- Cloudflare Pages deployment `d788df3a-58a0-489f-9f47-e535c83601d9` succeeded for the same commit.
- Supabase migration `20261126203248` restricts authenticated notification UPDATE to `is_read`; RLS still limits rows to `auth.uid()`. Verified table-wide UPDATE false, `is_read` UPDATE true, `title_en` and `link_path` UPDATE false. Existing mark-all-read RPC passed a rollback/authenticated-role check.
- Owner manual acceptance remains pending.


### Phase 3A — reliability release pending

- Updated `useOwnerPortalData` with a request sequence guard and cleanup invalidation. Older requests cannot overwrite newer selected-business data or show stale errors.
- Business-specific analytics, offers and products clear immediately when the selected listing changes or a reload starts; they remain empty if the new listing's data fails to load.
- Remaining Phase 3 work: reduce unnecessary cross-page fetching and add server-side pagination/filtering for reviews, inquiries and request history.


### Phase 3A release evidence

- Commit: c2902820e052e9df1cefc34568ce153a1f5f2843.
- GitHub Actions CI run 45892395019 passed.
- Cloudflare Pages deployment d85a8d11-4fe5-4908-98c1-534a175091f6 succeeded for the same commit.

### Phase 3B — implementation pending CI

- Owner pages now fetch only the datasets used by that screen; shared business list and unread notifications remain available for navigation.
- Reviews and Inquiries screens fetch 20 records at a time for the selected business and offer a Load more control. Dashboard full engagement data remains unchanged so its counts are not silently under-reported.
- Added demo-mode regression coverage for page boundaries, has-more state and duplicate-free concatenation.
- Request history still shows the most recent 50 records; pagination for that history remains a separate follow-up.


### Phase 3B release evidence

- Commit: 93f414bc5a745f00a3d08453421a15893702cd5e.
- GitHub Actions CI run 45893377773 passed: TypeScript type check, automated tests, production build and Edge Function type check.
- Cloudflare Pages deployment 3d9864f2-ae0c-4238-8b23-64614921e1c4 succeeded for the same commit.
- Owner manual acceptance remains pending.


### Phase 3C — Owner request history pagination (implemented, CI-passed and deployed)

- My Businesses request history now fetches 20 newest Owner submissions per request and offers Load older requests when another page exists.
- Existing request rows and status meanings are preserved; records are appended without duplicate IDs. No submissions are modified.


### Phase 3C release evidence

- App commit: 44fee047542dc1c1735e891b4ded48ecbb39121a.
- GitHub Actions CI run 45893853551 passed: TypeScript, automated tests, production build and Edge Function typecheck.
- Cloudflare Pages deployment 984fd83b-5b23-4aed-a659-942c50480be2 succeeded for the same commit.
- An initial CI run for commit b164654cf2c07f5ed4f6d58a99f64dcfc9b75737 caught a missing test import; the import was corrected in 44fee047 and the full CI passed. No production data was changed.


### Phase 4A — offer expiry default (implemented, CI-passed and deployed)

- New Owner offers now default to 30 days from the current Pakistan-local date instead of a fixed 2027 date. Editing an existing offer continues to preserve its saved dates.
- Added tests for normal month rollover and leap-year date arithmetic. Existing validation still prevents an end date before the start date.


### Phase 4A release evidence

- Commit: d6700c75b7626c597ec57bc0969c0e117231c5c0.
- GitHub Actions CI run 45894239701 passed: TypeScript, automated tests (including date-default boundary/leap-year tests), production build and Edge Function typecheck.
- Cloudflare Pages deployment 99e9d170-37a8-487c-a31b-7186ca455f3e succeeded for the same commit.

### Owner manual feedback — Phase 0 partial acceptance (27 November 2026)

- Owner confirmed the Owner request history loads, request statuses are visible and private Admin notes are not shown in the Owner Portal.
- Owner confirmed My Payments payment history and Plan details still load as before.
- Admin Business Field Approval / Previous note check is blocked: Owner reports no cards visible. Live read-only checks show 2 new + 2 in_review new-business submissions and 26 pending field rows. Authenticated Super Admin simulation can read these rows. There are 13 completed new-business submissions, which are not shown in the active queue unless media/invitation work remains. None of the 17 new-business submissions currently has a non-null legacy admin_note, so there is no existing Previous note content to display.
- Correct menu destination is Admin → Business Field Approval, not Admin → Moderation Queue. If the correct page still appears empty after Refresh, collect a screenshot including heading and any toast/error. Do not alter data to manufacture a test record.
- Phase 0 remains partially accepted, not fully accepted, until the Admin queue visibility check is resolved.


## Phase 5 release evidence — Profile and My Payments reliability

- Commit: `f4a211284354ec4d02f1894e0ff9bc8049235a11` (`Improve Owner profile and payment request feedback`).
- GitHub Actions CI: run `45902085685` passed TypeScript typecheck, automated tests, production build and Supabase Edge Function typecheck.
- Cloudflare Pages production deployment: `cb4d87a5-9254-44b7-9761-c0dfaf5cebc3` succeeded for the same commit; canonical alias `https://hellosadiqabad.com` is attached.
- No database migration, payment receipt, profile record, approval request or existing user data was changed.
- Owner/device manual acceptance remains pending. Test steps: Owner Portal → My Payments: refresh history; if a load error is shown, Retry should work and existing data should remain visible. Open a receipt correction form, submit once and verify the button stays disabled until completion; pending correction should prevent another request. Owner Portal → Profile: request history should show loading/error and Retry; approval request should remain unavailable until history is loaded; submit a valid profile change request and verify one pending request appears; password update should show an in-progress state and prevent repeat clicks. Do not submit a real financial correction or change account details solely for testing unless using an appropriate test account.


## Business Field Approval queue visibility — diagnostic checkpoint (27 November 2026)

- Re-read the canonical `docs/PROJECT_WORKING_RULES.md`, roadmap, handoff, active Owner Portal plan and the current Admin queue, Admin route, permission and migration sources before continuing. Permanent rules remain unchanged: direct `main` workflow, narrow backward-compatible changes, no unapproved schema/data changes, and no Owner acceptance claim without Owner confirmation.
- Read-only live Supabase checks (including a transaction-scoped authenticated Super Admin simulation) confirm **4 active new-business submissions** are visible under RLS: 2 `new` and 2 `in_review`. The same simulated role can read **39 field-review rows** attached to these active submissions, including **26 pending** rows. The `submissions` and `business_field_reviews` SELECT policies permit Super Admin / `moderation.review`; required submission columns are selectable while private `admin_note` and `assigned_to` remain non-selectable directly. No production rows, statuses, notes, accounts or media were changed.
- Source inspection confirms the active queue query selects `new` and `in_review` submissions, the route is `/admin/business-review`, and the component is gated by `moderation.review` (Super Admin passes this permission check). The separate Moderation Queue is not the correct page.
- Likely failure path identified: before commit `8cc2e5027c1fd8ef613141550e40df0c39f3551c`, any error in optional media, linked Owner-request, private-note RPC or signed-preview loading aborted the entire queue load. The narrow diagnostic change makes those dependent loads non-blocking and displays warnings; required submission/field-review failures now show a visible error and Retry. This is a plausible cause, **not yet a proven root cause**, until the live Admin page is checked.
- Commit `8cc2e5027c1fd8ef613141550e40df0c39f3551c` is on `main`. Cloudflare Pages production deployment `4a8d53e3-5550-43c6-93b0-1b55343a5a75` completed all stages successfully and is attached to `https://hellosadiqabad.com`. The connected GitHub status/workflow lookup returned no CI run/status, so automated CI is **unverified**; do not claim it passed.
- Owner manual acceptance is still pending. Next: Super Admin (or staff with `moderation.review`) → Admin → Business Field Approval → Refresh. Expected: four active request cards. If an optional warning appears, cards should still display. If the page remains empty or a required error appears, send a screenshot showing the page heading, all warning/error text and the Refresh result. No dummy submissions should be created.
- Existing records contain no non-null legacy `submissions.admin_note` among the 17 new-business submissions, so a prior-note preview cannot be confirmed from current legacy data. Phase 0 remains partially accepted until the queue is visible and Owner confirms the manual check.
- Other Owner Portal acceptance remains open: Phase 3E Reviews/Inquiries filters and Load more; Phase 1 pending count/inquiry handled workflow; Phase 2 notifications/mobile navigation/analytics empty state; Phase 3B Reviews/Inquiries pagination; Phase 3C My Businesses request-history pagination; Phase 4A offer date behavior. Do not mark these owner-tested without explicit confirmation.


## Owner confirmation — Phase 0 complete (27 November 2026)

- Owner explicitly reported **test pass** after signing in as Super Admin, opening Admin → Business Field Approval and refreshing; the four active request cards were visible.
- This resolves the prior queue-visibility blocker. Combined with the previously confirmed Owner request history/statuses, private Admin-note non-disclosure, My Payments history and Plan details, Phase 0 manual acceptance is complete.
- Existing production data has no non-null legacy `submissions.admin_note` among the 17 new-business submissions, so actual Previous note text could not be demonstrated; no note was created or changed just for testing. Admin-only note access remains protected.
- Next in documented order: Phase 1 manual acceptance — pending-review count and inquiry Read/Handled behavior. Do not change real customer inquiry state solely for testing; use an appropriate test inquiry or an existing inquiry that is genuinely ready to be handled.


## Phase 1 audit finding — pending-review count is page-limited (27 November 2026)

- During source audit after Phase 0 acceptance, found `OwnerBusinesses` loads only the first 20 submissions initially via `fetchOwnerSubmissionsPage(user.id, 0, 20)`.
- The “Requests awaiting review” summary currently calls `countOwnerRequestsAwaitingReview(requests)` on that in-memory first page. Therefore, when an Owner has more than 20 requests, pending `new` / `in_review` requests on older pages are omitted until Load older requests is used; the displayed count can be understated.
- Proposed narrow remedy (awaiting Owner approval): add an Owner-scoped exact-count query for allowed submission types and statuses `new` / `in_review`, preserving existing RLS and pagination. Demo mode should count the full Owner request set. No schema change, existing record mutation or workflow replacement is needed.
- [ ] Owner approval required before implementing this accuracy fix. After approval, add regression coverage for more than 20 submissions and verify CI/production deployment.
- Phase 1 inquiry handler behavior remains separately awaiting Owner manual acceptance: Read must not set `handled_by`; Handled should set the current Owner as handler.
