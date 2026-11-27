# Hello Sadiqabad — New Chat Handoff

## Mandatory first step
Read **`docs/PROJECT_WORKING_RULES.md`** before any project work. It is the permanent canonical user-rules file. The user's approval applies only to the scope they explicitly approve.

## Repository workflow
- Repository: `samt87804-gif/Hello-Sadiqabad`
- Work directly on `main`; no feature branches and no Pull Requests.
- Preserve existing data and working workflows.
- After every approved change, run checks, verify production deployment, and give the user simple manual test steps.

## Canonical project documents
- `PROJECT_ROADMAP.md` — one current project-wide roadmap and owner acceptance status.
- `docs/PROJECT_WORKING_RULES.md` — permanent rules; do not change unless the user asks.
- `docs/NEW_CHAT_HANDOFF.md` — this short starting guide.
- Active feature plans remain in `docs/`; historical, duplicate, superseded and AI Studio planning documents are in `docs/archive/`.
- Archive contents are historical evidence, not active implementation instructions.

## Production baseline (26 November 2026)
- Production website: https://hellosadiqabad.com
- Business Registration & Admin Approval module: user manually tested and explicitly confirmed it works well.
- Monthly Owner Plan & Payment workflow has been implemented and deployed: Free/Basic/Premium comparison, Basic Rs. 700/month, Premium Rs. 1,500/month, paid-only Website URL entitlement, JazzCash/Easypaisa/UBL instructions, payment reference submission, Admin verification, one-month activation, renewal, expiry visibility and audit trail.
- Image uploads now use a shared WebP compression flow; upload is blocked if the output is not smaller than the original.
- The Owner/Admin acceptance tests for the new plan/payment workflow are still pending. Do not claim owner acceptance until the user reports successful tests.

## Current project audit approach
The old roadmap contains legacy unchecked items. Do not assume every unchecked item is still outstanding or bulk-mark items complete. Ask the user to test old features one workstream at a time using short, practical steps, and record only the user's confirmed result.

## First manual acceptance document
See `docs/OWNER_PLAN_PAYMENT_ACCEPTANCE_CHECKLIST.md` for the new plan/payment and paid website URL tests.


## Current workstream — Admin Finance & Direct Plan Assignment (26 November 2026)

- Active scope: [docs/ADMIN_FINANCE_AND_PLAN_ASSIGNMENT_IMPLEMENTATION_PLAN.md](ADMIN_FINANCE_AND_PLAN_ASSIGNMENT_IMPLEMENTATION_PLAN.md).
- Owner explicitly requested this work in the current conversation; no new chat is needed.
- Add Admin ability to assign Free, Basic or Premium to any business without an Owner request, including partial-payment and zero-fee/waived assignments. Admin records agreed fee, actual amount received and outstanding balance.
- A dedicated Super Admin Finance page/immutable receipt ledger is required. Only actual receipts count as income; waived and outstanding amounts remain separate.
- Read-only audit found the existing raw Plan Tier dropdown in Admin Business Editor can change plans without financial accounting. Replace it with the audited assignment flow, preserving the ability to change plans.
- Existing Owner-request payment submission/verification and one-month activation/renewal remain unchanged; approved Owner requests must create ledger records atomically.
- Implementation is now deployed to production. Migrations `20261126120000_admin_plan_finance_ledger_and_assignment`, `20261126124500_guard_business_plan_financial_assignment` `20261126130000_fix_owner_plan_financial_period_start`, `20261126133000_allow_fk_cleanup_on_immutable_plan_receipts` and `20261126140000_admin_finance_assignment_history` are applied.
- Business Editor's raw Plan Tier dropdown has been replaced with a Super Admin-only **Assign / Change Plan** workflow. Admin enters agreed fee, amount received now, payment method/reference and reason for any discount/waiver. Outstanding is calculated and later instalments append new immutable receipts.
- Finance page includes actual collections (today/month/lifetime), outstanding, waived, Basic/Premium collections, payment-method and assignment-kind summaries, searchable/date-filtered receipt ledger, full plan assignment history (including Free and fully waived/zero-receipt events), separate CSV exports and outstanding-balance instalment entry.
- Existing Owner payment request UI and review RPC behavior remain intact; an after-update trigger records a receipt only when the existing Owner request is explicitly marked done and payment_verified=true. The one historical verified Owner payment was backfilled as Rs. 700; no revenue was inferred from plan labels.
- Security: financial tables are private, RLS-enabled and have no direct client grants; public RPCs check Super Admin authority. Direct authenticated updates to business plan fields are blocked except through trusted audited workflows.
- Verified in rollback transactions: partial payment plus two instalments, full waiver/zero receipt, Super Admin assignment RPC, direct-update guard, non-admin dashboard denial and a simulated verified Owner approval creating one linked receipt with the correct renewal period start. GitHub CI passed for latest UI commit `2573a4782ac3a10961be45a72df001eaca5752ed` (run `45878673559`); Cloudflare production deployment `ba2ba359-801a-4a8c-ae1b-c917aeaa6079` succeeded for that commit. Finance CSV exports also guard against spreadsheet formula injection.
- Owner manual acceptance is still pending. Do not claim the workflow is accepted until the Owner tests it in production.


## Current workstream — Owner Financial Profiles, Payment History & Approval Workflows (27 November 2026)

- Owner-approved scope is implemented on `main`. Active plan: [docs/OWNER_FINANCIAL_PROFILE_AND_PAYMENT_HISTORY_PLAN.md](OWNER_FINANCIAL_PROFILE_AND_PAYMENT_HISTORY_PLAN.md); manual checklist: [docs/OWNER_FINANCIAL_PROFILE_ACCEPTANCE_CHECKLIST.md](OWNER_FINANCIAL_PROFILE_ACCEPTANCE_CHECKLIST.md).
- Admin → Owners: Super Admin can click an Owner name / Financial Profile and view account, linked businesses, plan assignment history, original/net receipts, adjustments, balances, correction requests, profile requests and audit events.
- Owner Portal → My Payments: read-only Owner-scoped history and aggregate totals; Owners can submit correction requests only. No direct payment-ledger edit/delete UI.
- Admin direct correction/reversal and Owner-request review both create append-only adjustment rows. Original receipts remain intact; corrected amount zero means reversal. Finance dashboard, ledger, assignments, balances, installment validation and CSV use net adjusted amounts.
- Owner Full Name/Phone updates require approval; password change remains self-service. Live `owner_edits_require_approval=true` and existing business listing moderation remain unchanged.
- Live migrations applied to the existing Supabase project: `20261126193259` (`owner_financial_profiles_and_payment_corrections`) and `20261126193516` (`admin_direct_receipt_correction`).
- SQL rollback/adversarial checks passed: Owner scope isolation, Super Admin restriction, direct profile edit guard, approved profile update, corrected receipt delta, unchanged original receipt, Finance totals/ledger/balances, adjustment immutability and installment overpayment rejection.
- Feature commit: `c5ea0e23118be7785ff7b1e60b63104938fbb0b6`. Cloudflare Pages production deployment `9d78a58f-1157-4211-bd02-0cbce0a8b24f` succeeded (build and deploy stages).
- Documentation-cycle rule added to `docs/PROJECT_WORKING_RULES.md` (commit `a74df37eb8dcc45887ac05b897cf91756b0a39e6`): read canonical docs and directly relevant source at each task/phase, update plan/roadmap/handoff, and tick only verified work.
- GitHub Actions CI run `45885425664` passed: `build` and `edge-functions` jobs; npm audit high/critical gate, TypeScript typecheck, automated tests, production build and Edge Function typecheck all succeeded.
- Remaining: authenticated browser/device smoke tests and Owner manual acceptance. Do not claim acceptance until Owner confirms.
- Continue from Phase F3/Phase G. Do not re-request a source ZIP.


## Current workstream — Owner Portal audit and improvements (27 November 2026)

- Owner explicitly approved the full implementation roadmap in this conversation. Continue Phase 0 first, then follow [docs/OWNER_PORTAL_AUDIT_AND_IMPROVEMENT_PLAN.md](OWNER_PORTAL_AUDIT_AND_IMPROVEMENT_PLAN.md) in order.
- Canonical rules remain authoritative: direct commits to `main`, no branches/PRs, preserve all workflows/data, read canonical docs and relevant source before each phase, update this handoff/roadmap/plan continuously, and explain practical Owner test steps.
- Phase 0 confirmed issue: authenticated users had table-wide SELECT on `public.submissions`; Owner RLS allows reading their own eligible submissions and the Owner API selected the internal `admin_note` column.
- Live additive RPC migration applied: `20261126202451` (`owner_submission_private_notes_rpc`). RPC is SECURITY DEFINER with empty search_path, checks Super Admin or `moderation.review`, and anon cannot execute it.
- App commit `2d3f306839e17500abaa5f2b6bd7216bcdfc2330` removes `admin_note` from the Owner history query and switches Business Field Review to the Admin-only RPC. CI run `45890993686` passed (TypeScript, tests, build, Edge Functions); Cloudflare Pages production deployment `7bf8e537-e786-4688-a283-8d0c16dbd355` succeeded for the same commit.
- Live migrations applied: `20261126202451` (`owner_submission_private_notes_rpc`), `20261126202642` (`restrict_owner_submission_private_note_select`) and `20261126202723` (`restrict_submission_assignment_column_select`). Authenticated has no table-wide SELECT on `public.submissions`; `admin_note` and `assigned_to` SELECT are false; required safe columns remain selectable.
- SQL rollback/auth simulation denied non-Admin private-note RPC access and verified the Super Admin RPC can return a private-note row without exposing note text in test output. Supabase advisor shows its generic SECURITY DEFINER warning; the function contains explicit Super Admin / `moderation.review` checks. Other pre-existing advisor findings remain separate.
- Do not replay `20261127100000_owner_financial_profiles_and_payment_corrections.sql`: the live ledger already records the financial feature under `20261126193259` and `20261126193516`. This repo/live mismatch was observed and must remain explicit.
- No Owner manual acceptance has been performed for this new workstream. After CI/deployment and permission verification, give the Owner practical steps and wait for their report.


### Phase 0 practical acceptance — still required

1. **Super Admin:** sign in to `https://hellosadiqabad.com`, open Admin → Business Field Review, open a request that has an earlier private note, and confirm the “Previous note” still appears. Add a test note to a designated test request and save; confirm the note is retained after refreshing.
2. **Owner:** sign in with an Owner account, open Owner Portal → My Businesses / request history, and confirm the Owner's own requests and statuses still load. Confirm no internal Admin note is shown.
3. **Plan payment:** open Owner Portal → My Payments and Plan, confirm payment history, pending correction status and plan request information still load normally. Do not submit a real payment or correction just for testing.
4. Report any error text or screenshot. Do not include passwords, payment secrets or private account details.

- Phase 0 technical implementation is deployed; Owner manual acceptance is not yet confirmed. Continue to Phase 1 only after this manual check or record the Owner's decision to proceed with acceptance pending.


### Phase 1 — data correctness (implemented, CI-passed and deployed)

- Owner's pending-review counter now counts both `new` and `in_review` submissions.
- `updateInquiryStatus` now assigns `handled_by` only when status becomes `handled`; a simple `read` action changes only status/time and preserves the handler field. Demo mode follows the same behavior.
- Added tests for both behaviors in `src/lib/ownerPortal.test.ts`.
- Commit `b63a8a4a42a6dffd90f435e7ae1bb8e0d002015b`; CI run `45891440166` passed; Cloudflare Pages deployment `54bea682-bd88-4285-8daf-c9b60d59ae8b` succeeded.
- Owner authorized continuing the full roadmap while Phase 0 manual acceptance remains pending; do not mark Phase 0 accepted until the Owner completes the practical checks above.


### Phase 1 practical acceptance — still required

1. Owner Portal → My Businesses: “Requests awaiting review” should include `new` and `in_review`, but exclude `done` and `rejected`.
2. Owner Portal → a business → Inquiries: choose a new/test inquiry and click **Mark Read**. It should become **READ** without assigning you as the handler.
3. Click **Handled** on that test inquiry. It should become **HANDLED** and record the current signed-in user as handler.
4. Report any mismatch or error. Avoid changing a real customer inquiry unless it is appropriate to mark it handled.


### Phase 2 — Owner experience (implemented, CI-passed and deployed)

- Notifications now support per-item read/unread and mark-all-read; errors and successes are shown to the Owner.
- Stored `link_path` is used only when it resolves to an internal `/owner` route; external/unknown paths are not rendered as links.
- Notification title/body uses Urdu when the app language is Urdu and the Urdu field is non-empty; otherwise it falls back to English.
- My Payments now loads the unread badge instead of passing a hard-coded zero.
- Mobile Owner navigation is a compact collapsible menu; every prior destination and sign-out remains available. Desktop sidebar is unchanged.
- Analytics shows an honest empty state when no real top-search-term data exists.
- Live migration `20261126203248` restricts authenticated notification UPDATE to the `is_read` column only. RLS still scopes rows to the signed-in user.


### Phase 2 practical acceptance — still required

1. **Per-item notifications:** Owner Portal → Notifications. Mark one notification read; its New highlight should disappear. Mark it unread again; it should return to the unread state. Use a test notification where possible.
2. **Notification link:** open a notification with an available Open/کھولیں link. It should navigate to an internal Owner Portal page, not an external website.
3. **Urdu:** change the app language to Urdu and confirm notification title/body display Urdu where supplied; missing Urdu text should fall back to English.
4. **Payments badge:** open Owner Portal → My Payments. The navigation unread badge should show the same unread count.
5. **Mobile menu:** on a phone, open the Owner Portal menu. All destinations should be visible in a compact grid; selecting one should close the menu. Sign Out should remain available.
6. **Analytics:** open Owner Portal → Analytics. If no real search terms are available, the Top Search Terms section should show the explanatory empty message, not a blank panel or invented numbers.
7. Report any issue or screenshot. Do not share passwords or payment secrets.


### Phase 3A — Owner data-load reliability (implemented, CI-passed and deployed)

- `useOwnerPortalData` now uses a monotonically increasing request sequence; effect cleanup invalidates in-flight work. Only the newest request may update data, show an error or clear loading.
- Switching selected business immediately clears business-scoped analytics, offers and products. A failed load cannot leave the previous business's results visible under the new listing.
- This is a narrow reliability fix. Cross-page overfetch and server-side pagination/filtering remain unchecked Phase 3 tasks.


### Phase 3B — page-specific loading and Owner list pagination (implemented, CI-passed and deployed)

- The common Owner data hook now accepts page needs. Dashboard loads engagement aggregates; Listing loads categories/areas/plans/requests; Products loads products/requests; Offers loads plans/offers/requests; Reviews and Inquiries load their own list pages; Analytics loads stats; Plan loads plans/requests; public profile settings load profile selection. All screens still load the signed-in Owner's businesses and unread notification count for navigation.
- Reviews and Inquiries now request 20 rows for the selected business, ordered newest first, and show a Load more control only when another page exists.
- Existing full review/inquiry loaders remain in place for Dashboard so its unanswered/new counts remain accurate.
- Demo tests create 23 sample rows, verify first page 20 + next page 3, hasMore state and no overlap, then clean up test rows.
- Request history remains capped at latest 50 and needs its own paginated history workflow.
- Admin Business Field Approval database check on 27 Nov 2026: live DB has 4 active new-business submissions (2 new, 2 in_review) and 26 pending_review field rows. No new_business submission currently has a non-null legacy admin_note (count 0), so an old Previous note is not available to display. The queue should nevertheless contain four submission cards; Owner reports seeing no cards, so Admin screen visibility remains an unresolved manual issue. No records were changed.


### Phase 3B release evidence

- Commit 93f414bc5a745f00a3d08453421a15893702cd5e.
- GitHub Actions CI 45893377773 passed: TypeScript, automated tests, production build and Edge Function typecheck.
- Cloudflare Pages deployment 3d9864f2-ae0c-4238-8b23-64614921e1c4 succeeded for the same commit.

### Admin Business Field Approval visibility follow-up

- Correct Admin navigation label is “Business Field Approval”. The separate “Moderation Queue” intentionally excludes new-business registrations.
- Live DB read-only counts: 2 new + 2 in_review new-business submissions, 13 done submissions, and 26 pending_review field rows. The queue code shows new/in_review records; completed records appear only if media or Owner invitation work remains outstanding.
- Authenticated-role simulation with the active Super Admin profile saw 17 total new-business submissions and 26 pending field reviews; the private-note RPC executed and returned zero notes. This confirms database access for a Super Admin. No current new_business submission has a non-null legacy admin_note, so no “Previous note” text is available in the existing records.
- Owner reports no cards visible in the Admin UI. Ask the Owner to open Admin → Business Field Approval (not Moderation Queue) and press Refresh; if still empty, capture a screenshot including the page heading and any toast/error. No database records were modified.

### Phase 3B practical acceptance — Owner

1. Sign in as an Owner and open Owner Portal → Reviews. The first page should show at most 20 newest approved reviews for the selected business. If more exist, a “Load more reviews” button appears; click it and confirm older reviews append without duplicates.
2. Open Owner Portal → Inquiries. The first page should show at most 20 newest inquiries. If more exist, click “Load more inquiries” and confirm the next records append without duplicates.
3. Switch between two businesses (if the account has two) and confirm reviews/inquiries belong only to the selected business.
4. Open My Businesses, Listing, Products, Offers, Analytics, Plan, Profile, Public Profile and Notifications. Confirm each page still shows its required information and no missing sections/errors.
5. If a selected business has fewer than 20 records, no Load more button is expected. Report any mismatch; do not mark manual acceptance complete until the Owner confirms.


### Phase 3C — My Businesses request-history pagination (implemented, CI-passed and deployed)

- My Businesses now loads the latest 20 Owner-submitted requests initially and provides “Load older requests” if another page exists.
- Older requests append without duplicate IDs; existing statuses, messages and ordering are preserved.
- No request records were edited or deleted.


### Phase 3C release evidence

- Fix commit 44fee047542dc1c1735e891b4ded48ecbb39121a.
- CI 45893853551 passed: TypeScript, automated tests, production build and Edge Function typecheck.
- Cloudflare Pages deployment 984fd83b-5b23-4aed-a659-942c50480be2 succeeded for the same commit.
- The preceding commit's CI caught a missing import in the new regression test. The test import was corrected; the subsequent complete CI passed. The production build had succeeded on the initial attempt; no database or user records were changed.

### Phase 3C practical acceptance — Owner

1. Sign in and open Owner Portal → My Businesses.
2. Scroll to “My Requests & Approval History”. The newest 20 requests should load first.
3. If the account has more than 20 requests, click “Load older requests”. The next older records should appear underneath, without repeating existing cards. If there are 20 or fewer, the button should not appear.
4. Check that each request keeps its original date and status (Pending review, Approved, Rejected, etc.). Do not change any request status just to test pagination.
5. Report any missing, repeated or incorrectly ordered request.


### Phase 4A — dynamic Owner offer expiry (implemented, CI-passed and deployed)

- New offer forms now default their end date to 30 calendar days after the current Pakistan-local date, not a hard-coded date. Existing offer dates remain unchanged when editing.
- Existing validation rejects an end date earlier than the start date.
- Added regression tests for month boundaries and leap-year arithmetic.


### Phase 4A release evidence

- Commit d6700c75b7626c597ec57bc0969c0e117231c5c0.
- CI 45894239701 passed: TypeScript, automated tests, production build and Edge Function typecheck.
- Cloudflare Pages deployment 99e9d170-37a8-487c-a31b-7186ca455f3e succeeded for the same commit.

### Owner feedback — Phase 0 partial acceptance (27 Nov 2026)

- Owner reports My Businesses request history loads, statuses are visible and internal Admin notes are not visible in the Owner Portal.
- Owner reports My Payments history and Plan details still load correctly.
- Admin Previous note check is still blocked because no cards are visible to the Owner. Database read-only check: 4 active new-business submissions (2 new, 2 in_review), 13 completed, 26 pending field-review rows; simulated authenticated Super Admin can read 17 total new-business submissions and 26 pending fields. No new-business submission has a non-null legacy admin_note. Completed records are not ordinarily listed in the active queue unless media/invitation follow-up remains.
- The intended navigation item is Admin → Business Field Approval. Moderation Queue is a different page and intentionally excludes new-business registrations. If Business Field Approval still shows no cards after Refresh, ask for a screenshot with page heading and any toast/error. Do not create dummy records.
- Phase 0 is partially accepted only; keep Admin queue visibility unresolved.

### Phase 4A practical acceptance — Owner

1. Sign in as an Owner and open Owner Portal → Offers → Add Offer.
2. The start date should default to today (Pakistan time); the end date should default to 30 days later.
3. Change the end date to one day before the start date and attempt to save. A clear validation message should prevent saving.
4. Open an existing offer for editing and confirm its saved dates remain unchanged unless you intentionally edit them.


## Current workstream — Owner Gallery Management Phase 4B (Owner approved 27 November 2026)

- Active plan: `docs/OWNER_GALLERY_MANAGEMENT_PLAN.md`.
- Owner Portal → My Businesses → Edit Listing → Preview now has a Manage photo gallery section. Owner uploads JPG/PNG/WebP; image is compressed to smaller WebP before upload, and if compression cannot reduce size the upload is blocked.
- New gallery images go to private `hs-pending-business-media` through the existing server-issued signed-upload workflow. The existing Admin business-media review area handles approval/rejection; no separate queue was added.
- Approval promotes the photo to the public business media bucket and adds its URL to `businesses.gallery_urls`. Owner removal request keeps a published photo public until Admin approves removal.
- Plan limits from live plans remain unchanged: Free 0, Basic 5, Premium 15. Database RPC locks the business row and checks owner, published status, plan limit, storage path, actual MIME and size. Logo/cover monthly 2-request quota remains separate.
- Live additive migrations applied: `20261127110000_owner_gallery_moderation`, `20261127120000_owner_gallery_removal_requests`, `20261127130000_serialize_gallery_publication`.
- Existing Supabase Edge Functions deployed: `create-business-media-upload` version 4, `review-business-media` version 8.
- Owner removal request currently supports gallery photos created by this managed-media workflow. Older legacy gallery URLs without matching asset records remain Admin-managed; existing gallery URLs were preserved.
- Intermediate CI found two media-status TypeScript union mistakes while adding `removal_requested`; both were corrected. Final CI run `45897858810` passed build and Edge Functions. Cloudflare Pages deployment `45e643b1-ef0e-4d82-b992-142c2d2c9bec` succeeded for commit `7fe21cc6b2c725d0158bd7342f6fcd63b24289e2`, canonical alias `https://hellosadiqabad.com`.
- No existing business, Owner account, gallery URL or production media object was modified. Schema/functions only were changed.
- Owner manual acceptance is still required after successful deployment:
  1. Sign in as Owner with a published Basic/Premium business → My Businesses → Edit Listing → Preview.
  2. Upload one gallery photo; expect success message and no public visibility yet.
  3. Super Admin → Business Field Approval → approve that photo; refresh public business profile and verify photo appears.
  4. Upload another photo and reject it; verify it never appears publicly and Owner history says rejected.
  5. On a managed approved photo, click Request removal; verify it remains public while awaiting Admin.
  6. Admin existing media-review card → Approve Owner removal; verify photo disappears from public gallery.
  7. Confirm Free plan cannot upload; Basic max 5; Premium max 15; logo/cover quota still works.


## Latest Owner feedback — Gallery acceptance and public viewer close fix (27 November 2026)

- Owner explicitly confirmed all Phase 4B manual gallery tests passed. Mark gallery Owner acceptance complete in the active plan and roadmap.
- Owner then reported that opening a gallery photo on the public business profile did not present an obvious close button.
- Inspected the shared src/components/ui/DataDisplay.tsx Lightbox. It already had an icon-only X control, but it was visually subtle and lacked visible text. Updated it to a high-contrast white close button labelled Close / بند کریں, with a larger touch target, shadow, focus ring and active feedback. This is a narrow UI-only change; no business/gallery data, media, permissions, storage or database behavior changed.
- Fix commit: a9ca81982695ef5d07aa94b8a54b55f8be82e3d9. GitHub CI and Cloudflare Pages production deployment are pending verification.
- Next: check CI for this commit, confirm matching Pages deployment, then ask Owner to open any public business profile, tap a gallery image and confirm the labelled close button closes the viewer on both mobile and desktop. Do not claim the viewer fix is accepted until Owner confirms.
- Continue the already-approved Owner Portal roadmap after the close-button verification; retain the outstanding optional legacy-gallery URL removal design and any unchecked roadmap work rather than silently closing them.


## Latest continuation — Owner Portal Phase 5 and gallery viewer deployment (27 November 2026)

- Re-read `docs/PROJECT_WORKING_RULES.md`, `PROJECT_ROADMAP.md`, `docs/NEW_CHAT_HANDOFF.md`, `docs/OWNER_PORTAL_AUDIT_AND_IMPROVEMENT_PLAN.md`, and relevant source before continuing.
- Owner confirmed all Phase 4B gallery manual tests passed. The visible bilingual `Close / بند کریں` public gallery viewer button is deployed. Its specific code commit is `a9ca81982695ef5d07aa94b8a54b55f8be82e3d9`; CI run `45901260609` passed and Cloudflare Pages deployment `1456045e-5c5f-4c4e-9916-b54e2939d8ac` succeeded. Owner device confirmation of the close control is still pending.
- Continued the previously Owner-approved Owner Portal roadmap Phase 5. Source audit found `OwnerPayments` previously only toasted fetch failures, while `OwnerProfile` silently swallowed profile-history fetch errors; submission handlers did not have immediate in-flight guards. Updated `src/pages/owner/OwnerPortalPages.tsx` only:
  - My Payments: visible load error + Retry, preserve prior loaded data on refresh failure, guard overlapping reload responses, prevent duplicate correction submission and disable relevant controls while busy.
  - Owner Profile: show profile request-history loading/error + Retry, block profile change submission until request history loads, prevent duplicate profile change requests, and show/lock password update while in flight.
- Evaluated profile-photo and persisted notification-preference controls. They are intentionally deferred: no existing preference persistence model is present, and profile photo needs a separately approved upload/compression/private-review/publication lifecycle. No new personal data fields, image uploads, schema changes or database migrations were added.
- Phase 5 commit: `f4a211284354ec4d02f1894e0ff9bc8049235a11`. GitHub CI `45902085685` passed TypeScript, automated tests, production build and Edge Function typecheck. Cloudflare Pages production deployment `cb4d87a5-9254-44b7-9761-c0dfaf5cebc3` succeeded with canonical alias `https://hellosadiqabad.com`.
- No database, payment receipt, profile record, approval request, existing business or media record was changed.
- Owner confirmed the Phase 5 manual tests passed on 27 November 2026, including My Payments/Profile loading, retry and in-flight controls. Owner also confirmed the deployed gallery close button works. These are Owner-reported acceptance results, not assistant-performed authenticated browser tests.
- Next approved task: audit Phase 3D for safe reductions in cross-page Owner data fetching. Keep Dashboard aggregate accuracy and existing pagination intact.
- Keep Phase 0 partially accepted until Admin Business Field Review visibility is resolved. Do not claim authenticated browser/device testing has been performed by the assistant.


## Latest continuation — Owner acceptance and Phase 3D notification optimization (27 November 2026)

- Owner explicitly reported "Test pass" after the requested Phase 5 Profile/My Payments checks and the deployed public gallery Close / بند کریں control. Updated the active Owner Portal plan, roadmap and handoff to record those manual acceptance results. This is Owner-reported acceptance; the assistant did not perform an authenticated browser/device session.
- Continued the already-approved Owner Portal Phase 3D scope. Audit confirmed that the shared Owner data hook downloaded every notification row on all Owner pages solely to calculate the navigation unread badge; My Payments repeated the same full-row fetch. Only the Notifications page needs full notification bodies.
- Added `fetchUnreadNotificationCount(userId)`: live mode uses a count-only Supabase query scoped to the signed-in Owner and `is_read=false`; demo mode counts the same Owner's unread rows locally.
- Shared Owner pages now load only the unread count for the navigation badge. Owner Portal → Notifications still loads full notification rows for the list and derives the same count. My Payments now uses the count-only query too.
- Added a regression test for count changes when a notification becomes read. Existing notification read/unread behavior, internal-link safety and content are unchanged.
- Preserved Dashboard's full reviews and inquiries datasets because its aggregate counts rely on complete data. Existing 20-at-a-time Reviews/Inquiries and My Businesses request-history pagination remain unchanged.
- No schema migration, RLS/grant change, notification mutation or existing user data change was made.
- Commits: API `4bde7385f1b0936e40543125963c9f5cd8d5df6c`; Owner UI `08e6a06d277e224a656d1cb25692f63d1f675313`; regression test `fad60e254f66c8b8783245b1e132bf42a6fd6cdb`.
- Cloudflare Pages production deployment `f4095c61-159d-4489-b4d7-02b2b0d46a9b` succeeded for the test commit; build and deploy stages passed and canonical alias `https://hellosadiqabad.com` is attached.
- The connected GitHub commit-status check returned no statuses, so do not claim the GitHub Actions automated test run passed. The regression test is added but CI execution remains unverified.
- Next Owner acceptance: sign in, note the unread badge in Owner Portal navigation, open Notifications and mark one test notification read (badge should decrease by one), then mark it unread (badge should increase by one). Visit Dashboard and My Payments and confirm the same unread count appears. If no test notification exists, do not alter real notifications just to manufacture one.
- Remaining: confirm the automated test/CI status through GitHub Actions when accessible; Owner manual unread-badge acceptance; Phase 3D remaining search/filter audit. Phase 0 Admin Business Field Approval visibility issue remains unresolved.


## Owner confirmation — Phase 3D unread notification badge (27 November 2026)

- Owner explicitly reported "all test pass" after checking the unread badge decreases when a notification is marked Read, increases when marked Unread, and remains consistent across Owner Dashboard and My Payments.
- Updated the active Owner Portal feature plan and roadmap to mark the manual notification badge acceptance complete.
- The lightweight unread-count implementation remains deployed at `f4095c61-159d-4489-b4d7-02b2b0d46a9b` (canonical production alias `https://hellosadiqabad.com`). GitHub Actions automated test execution for the added regression test remains unverified because the connected commit-status check returned no statuses; do not state CI passed.
- Continue the already-approved Phase 3D remaining search/filter audit. Inspect current Owner Reviews, Inquiries, My Businesses request history, listings and API query implementations before making any changes. Preserve all current pagination, dashboard aggregate accuracy, owner scoping, RLS and records. Ask before any change that replaces an existing working workflow or broadens scope.
- Phase 0 Admin Business Field Approval visibility acceptance remains unresolved.

## Latest continuation — Owner Portal Phase 3D acceptance and Phase 3E filters (27 November 2026)

- Owner explicitly confirmed **all Phase 3D unread-notification badge tests passed**: Read decreases the unread count, Unread increases it, and Dashboard/My Payments remain consistent. Record as Owner-reported manual acceptance; do not claim assistant-authenticated browser testing.
- Reconciled the active Owner Portal plan's stale Phase 3D pending wording with the Owner's confirmation. The detailed plan and roadmap now record Phase 3D manual acceptance as complete. Automated CI for its regression test remains unverified because the connected GitHub commit-status check returned no statuses.
- Owner approved implementing Reviews and Inquiries filters with a clear **Haan**. Existing implementation already had server-side 20-row pagination; new filters are applied before pagination in both Supabase and demo mode.
- Phase 3E changes on `main`:
  - `src/lib/api.ts`: `fetchOwnerReviewsPage` supports All / Replied / Not replied; `fetchOwnerInquiriesPage` supports All / New / Read / Handled.
  - `src/pages/owner/OwnerPortalPages.tsx`: filter state is included in the data-load and Load more requests, resetting pagination when a filter changes.
  - `src/components/owner/OwnerModules.tsx`: visible filter selectors added to Reviews and Inquiries.
  - `src/lib/ownerPortal.test.ts`: demo-mode regression coverage verifies replied/unreplied counts and all inquiry statuses; expanded fixture to 63 rows to verify multi-page filtered results and correct hasMore boundaries.
- Commits: API `dc68cdd464c3523b38d351c5763a4679ddf1e323`; page wiring `41781e579de653626105c3974c74d3046aad96a1`; UI controls `36408b907bdfa10244dbb0ad72922ad20e89abd4`; initial tests `f4869d72cffd5c995d73d33f545644b37747eaac`; expanded pagination tests `4590ce4ee79ffd0d534ce76ccfe6c669993b0ef5`.
- No schema migration, RLS/grant change, new data field, existing review/inquiry mutation or production record change was made. Dashboard full review/inquiry loaders remain unchanged.
- Cloudflare Pages production deployment `a9db5c36-39db-47f4-a73c-6ef67a69d5e5` succeeded for commit `4590ce4`; all stages passed and canonical alias `https://hellosadiqabad.com` is attached. The deployment includes the filter UI, server-side filtering and latest test-source commit.
- GitHub combined commit status returned no statuses for `4590ce4`; do not claim GitHub Actions automated tests passed. Cloudflare Pages build passed, which verifies the production build only.
- Owner manual filter acceptance remains pending.
- Next Owner test after deployment: Owner Portal → Reviews: test All, Replied, Not replied and Load more; Owner Portal → Inquiries: test All, New, Read, Handled and Load more. Confirm only matching records appear and older matching rows append without duplicates. Phase 3E manual acceptance remains pending.
- Phase 0 Admin Business Field Approval visibility acceptance remains unresolved. Continue to preserve existing pagination, dashboard aggregate accuracy, owner scoping, RLS and all existing records.


## Business Field Approval queue visibility — diagnostic checkpoint (27 November 2026)

- Re-read the canonical `docs/PROJECT_WORKING_RULES.md`, roadmap, handoff, active Owner Portal plan and the current Admin queue, Admin route, permission and migration sources before continuing. Permanent rules remain unchanged: direct `main` workflow, narrow backward-compatible changes, no unapproved schema/data changes, and no Owner acceptance claim without Owner confirmation.
- Read-only live Supabase checks (including a transaction-scoped authenticated Super Admin simulation) confirm **4 active new-business submissions** are visible under RLS: 2 `new` and 2 `in_review`. The same simulated role can read **39 field-review rows** attached to these active submissions, including **26 pending** rows. The `submissions` and `business_field_reviews` SELECT policies permit Super Admin / `moderation.review`; required submission columns are selectable while private `admin_note` and `assigned_to` remain non-selectable directly. No production rows, statuses, notes, accounts or media were changed.
- Source inspection confirms the active queue query selects `new` and `in_review` submissions, the route is `/admin/business-review`, and the component is gated by `moderation.review` (Super Admin passes this permission check). The separate Moderation Queue is not the correct page.
- Likely failure path identified: before commit `8cc2e5027c1fd8ef613141550e40df0c39f3551c`, any error in optional media, linked Owner-request, private-note RPC or signed-preview loading aborted the entire queue load. The narrow diagnostic change makes those dependent loads non-blocking and displays warnings; required submission/field-review failures now show a visible error and Retry. This is a plausible cause, **not yet a proven root cause**, until the live Admin page is checked.
- Commit `8cc2e5027c1fd8ef613141550e40df0c39f3551c` is on `main`. Cloudflare Pages production deployment `4a8d53e3-5550-43c6-93b0-1b55343a5a75` completed all stages successfully and is attached to `https://hellosadiqabad.com`. The connected GitHub status/workflow lookup returned no CI run/status, so automated CI is **unverified**; do not claim it passed.
- Owner manual acceptance is still pending. Next: Super Admin (or staff with `moderation.review`) → Admin → Business Field Approval → Refresh. Expected: four active request cards. If an optional warning appears, cards should still display. If the page remains empty or a required error appears, send a screenshot showing the page heading, all warning/error text and the Refresh result. No dummy submissions should be created.
- Existing records contain no non-null legacy `submissions.admin_note` among the 17 new-business submissions, so a prior-note preview cannot be confirmed from current legacy data. Phase 0 remains partially accepted until the queue is visible and Owner confirms the manual check.
- Other Owner Portal acceptance remains open: Phase 3E Reviews/Inquiries filters and Load more; Phase 1 pending count/inquiry handled workflow; Phase 2 notifications/mobile navigation/analytics empty state; Phase 3B Reviews/Inquiries pagination; Phase 3C My Businesses request-history pagination; Phase 4A offer date behavior. Do not mark these owner-tested without explicit confirmation.


## Owner confirmation — Phase 0 queue visibility passed (27 November 2026)

- Owner explicitly reported **test pass** after Super Admin → Admin → Business Field Approval → Refresh displayed all four active request cards. The earlier empty-queue visibility blocker is resolved.
- Together with previously confirmed Owner request history/statuses, private Admin-note non-disclosure, My Payments history and Plan details, Phase 0 manual acceptance is complete.
- Previous-note text could not be manually demonstrated because none of the current 17 new-business submissions has a non-null legacy `admin_note`. Do not create a note or dummy request just to test this.
- Next documented step: Phase 1 Owner manual acceptance. Test the “Requests awaiting review” count (includes `new` and `in_review`, excludes `done` and `rejected`), then use an appropriate test inquiry: Mark Read should set READ without assigning a handler; Handled should set HANDLED and assign the current signed-in user. Do not mark a genuine customer inquiry handled unless it is actually resolved.
- Current code was re-inspected: `countOwnerRequestsAwaitingReview` counts only `new` / `in_review`; `updateInquiryStatus` has a regression test for handler assignment. Phase 1 CI run `45891440166` and Pages deployment `54bea682-bd88-4285-8daf-c9b60d59ae8b` previously passed. Owner manual acceptance remains pending.


## Phase 1 source audit — pending-review count limitation (27 November 2026)

- After Owner confirmed Phase 0 queue visibility, continued Phase 1 source audit.
- Found `OwnerBusinesses` initially loads only 20 Owner submissions; the “Requests awaiting review” count is currently calculated from this first-page array. If older pending requests exist beyond those 20 rows, the summary can undercount until older pages are loaded.
- Recommended narrow fix: add a server-side exact count query scoped to the authenticated Owner, existing allowed submission types, and `new` / `in_review` statuses; retain the existing request-history pagination and RLS. Demo mode should count the full matching Owner request set. No schema migration or record mutation expected.
- **Do not implement until Owner explicitly approves**, per the permanent serious-issue/change-approval rule.
- Inquiry status behavior remains: Mark Read should not assign `handled_by`; Handled should set it to the current signed-in Owner. Owner manual acceptance is still pending.


## Owner Portal Phase 1 — exact pending-request count fix (27 November 2026)

- Owner explicitly approved the narrow counter fix after the audit identified undercounting when pending requests exist beyond the first 20 history rows.
- Implemented a Supabase exact count query scoped to the signed-in Owner, existing Owner-visible request types (`new_business`, `claim`, `plan_upgrade`, `owner_product`, `owner_service`, `owner_offer`) and statuses `new` / `in_review`. RLS remains the security boundary.
- Demo mode counts the full in-memory set using the same Owner/type/status filters.
- Existing request-history pagination, sorting, Load older requests, and stored records are unchanged. No schema, migration, RLS, permission or data mutation.
- Added a regression test with 28 Owner requests so pending rows beyond the first 20 must still be included; also excludes other-owner, correction-type and rejected rows.
- Initial GitHub Actions run `45911358060` caught a missing test-only `SubmissionRow` type import; automated tests and production build passed on that first attempt. The type-only import was corrected in follow-up commit `251ca5b8c15d285daef86696b9b8b37b5cde1b67`.
- Follow-up GitHub Actions CI run `45911463787` passed TypeScript, automated tests, production build and Edge Function typecheck. Matching Cloudflare Pages production deployment `06180522-7bd2-4592-ab49-3471600c9017` passed build and deploy.
- No schema/RLS/permission/data migration or record mutation. The exact count uses existing Owner-scoped RLS and existing allowed request types/statuses.
- Next: Owner manual acceptance: open Owner Portal → My Businesses, check Requests awaiting review, and confirm Load older requests does not change the count; then use a safe test/resolved inquiry to confirm Read does not assign a handler and Handled assigns the current signed-in Owner. Do not mark Phase 1 manually accepted until Owner confirms.


## Public Add Business opening-hours convenience — 27 November 2026

- Owner explicitly approved the narrow public-form enhancement.
- Added shared opening/closing time inputs and **Apply to All** for Monday–Sunday; each day remains independently editable.
- Added a per-day **Off** checkbox. It clears/disables that day's times and preserves the explicit closed state as an empty array in the existing `opening_hours` JSON payload. Untouched days remain omitted; no schema or migration change.
- Client validation rejects incomplete time pairs and closing times that are not later than opening times; Off days are valid.
- Added unit regression coverage in `src/lib/hours.test.ts` and mobile/desktop production browser-smoke assertions in `scripts/public-form-smoke.mjs`.
- Application commit: `3095edb45d94394c187f9f009a8caeb8a895da80`. GitHub Actions CI run `45998652407` passed TypeScript, automated tests, production build, dependency high/critical audit gate and Edge Function typecheck. Cloudflare Pages production deployment `5cd6ad7d-70ca-4f8f-a2ed-db9ed2872c66` succeeded for that exact commit with the canonical alias attached.
- Public mobile/desktop browser smoke workflow `45998652504` was still running at the documentation checkpoint; do not claim its result until completed.
- No database migration, RLS/grant change or existing production data mutation was made.
- [ ] Owner manual production acceptance remains pending. Test public `https://hellosadiqabad.com/add-business`: enter shared times, click Apply to All, confirm all seven days update, edit one day independently, mark a day Off and verify its inputs clear/disable, turn it back On, then submit a suitable test request and verify the Admin Business Field Approval card still displays the hours correctly. Do not create a real customer listing solely for testing; use an owner-authorized test request.


## Current workstream — Owner invitations, password setup and Moderation Queue reliability (27 November 2026)

- Owner approved investigation/fixes for three production issues: invitation password Save disabled, Business Field Approval Owner profile provisioning failure, and Moderation Queue's admin-data request warning.
- Production logs confirmed Moderation Queue attempted direct `public.submissions` SELECT after the table-wide SELECT privilege was removed to protect private Owner/Admin fields. The correct fix is a narrowly permission-checked Admin RPC; direct table access must remain restricted.
- Production Postgres logs also showed `permission denied for schema private` from `private.guard_owner_profile_self_edit()`. The trigger called the private Super Admin helper as an authenticated caller without private-schema USAGE. Fix must preserve the Owner profile approval guard and avoid exposing the private schema.
- Invitation Edge Function previously upserted `full_name` and `phone` on profile conflict, needlessly invoking the Owner self-edit guard for an existing profile. Provisioning now inserts if absent and updates only safe role/activation flags when needed.
- Password reset page now handles invite/recovery token hashes, PKCE codes and access/refresh tokens, and establishes a session before enabling Save.
- Active feature plan: `docs/OWNER_INVITATION_AND_ADMIN_MODERATION_FIX_PLAN.md`.
- Existing Supabase project only; no new project, no production test Owner account, no real invitation or existing record mutation during verification.


### Release evidence — Owner invitation and Admin moderation fixes

- Main commit `eaf7379319d21c8fefadba85a7f9e6ef001b6bea`; CI run `46001682834` completed successfully (TypeScript, unit tests, build, Edge Function typecheck).
- Live migration `20261127124555` (`fix_owner_invitation_and_admin_moderation_access`) is recorded in the existing Supabase ledger.
- Deployed Edge Functions: `send-business-owner-invitation` version 2 and `manage-owner-registration` version 7; both ACTIVE and JWT verification remains enabled.
- Cloudflare Pages deployment `ff61c63d-5b7d-4863-a19b-05d286953667` succeeded for the exact main commit and is attached to canonical `https://hellosadiqabad.com`.
- Permission tests: active Super Admin simulation read 23 moderation submissions; active Owner simulation was denied; anon cannot execute the RPC. Direct authenticated table SELECT remains restricted.
- Profile self-edit guard test now returns the intended Admin-approval rejection, not the private-schema permission error; test transaction was rolled back.
- No real invitation email or production test user/record was created. Owner device acceptance remains pending.


## Current workstream — Owner direct registration, password approval and account deletion (27 November 2026)

- Owner explicitly authorized this work and added the requirement that Super Admin must be able to delete any Owner account.
- Active plan: `docs/OWNER_DIRECT_REGISTRATION_ACTIVE_IMPLEMENTATION_PLAN.md`.
- Scope: public Add Business collects Owner email/password/confirmation; Auth account stays inactive until Admin approves the business; same credentials work after activation; no invitation/password setup emails in the new workflow; Owner requests password change and Admin approves before Owner sets it; Super Admin can permanently delete an Owner with confirmation/audit.
- Security: never store plaintext password outside the Auth request path; do not expose passwords to Admin; email ownership is not verified in a no-email workflow and must be manually checked by Admin before activation; deletion must preserve business/financial/history records and revoke sessions.
- Existing pending requests and historical records are preserved unchanged. The owner will ask those applicants to resubmit under the new workflow.
- Audit completed: canonical rules, live roadmap/handoff, Add Business, auth context, `submit-suggestion`, Business Field Review Queue, live public schema and migration ledger were inspected. Existing `profiles.is_active` and invitation lifecycle fields were confirmed.
- Current state: active implementation plan committed to `main` as `1d75315ab8c7671c132256897ba0f74118dd9b43`. This is documentation/audit only; no application code, production migration, Auth user, or Edge Function has been changed/deployed for the new workflow yet.
- Next safe step: implement and test secure server-side registration/account linkage first, then the UI/Admin activation path, password approval, and account deletion. Do not deploy an incomplete workflow.


## Direct Owner registration & password-change approval — current state (27 November 2026)

- Implementation committed directly to `main`; latest application-bearing Pages deployment was built/deployed successfully from commit `63945f99bf1d918297475186fe9c8cbc39c40b9c` (deployment `cacbedcb-7e5b-4278-8fb3-aa1555cff2d2`).
- Public Add Business captures Owner password and confirmation for unauthenticated applicants. Confirm password is client-only; password is separated from `payload` and sent only to the server-side `submit-suggestion` Edge Function. No plaintext credential is persisted in submissions, owner requests, audit logs or Admin UI.
- Direct Auth identity is created with trusted `app_metadata.owner_registration_status=pending_admin_approval`; profile trigger creates it inactive. Duplicate email fails without changing existing Auth users. Rate limiting and rollback are retained.
- Admin Business Field Approval shows direct account status and requires an explicit identity/authority verification confirmation before `activate-direct-owner` can link the already-published business and activate the profile. No email invitation is sent for direct requests. Legacy invitations remain available for old requests.
- Owner Portal password-change request/status is implemented. Admin approves/rejects. Owner's authenticated session calls `complete-owner-password-change`; approval expires after 30 minutes and is consumed once. Password is never displayed to Admin.
- Live migrations: `20261127164058`, `20261127164621`, `20261127165305`, `20261127165456`. The 7 old Owner registration records remain untouched. Email uniqueness is separated for legacy and direct requests so old non-invited pending records do not block resubmission.
- Active Edge Functions: `submit-suggestion` v13, `activate-direct-owner` v5, `review-owner-password-change` v4, `complete-owner-password-change` v1, `send-business-owner-invitation` v3. JWT verification is enabled on each.
- Supabase advisors re-run: the new password-request table no longer triggers multiple permissive SELECT policies or an unindexed reviewer FK. Existing project-wide findings remain and were not broadened into this change.
- Cloudflare Pages `npm run build` and deploy stages succeeded. GitHub Actions TypeScript/unit-test status is not verified in this session; do not state full CI passed.
- No test Owner account or real production registration/password-change request was created.
- Next: verify latest Pages deployment after docs updates, obtain automated typecheck/test evidence if available, then give Owner the full manual acceptance checklist. Owner deletion is separate and deferred from this release.


## Direct Owner registration & password-change approval — final audit (27 November 2026)

- Canonical permanent rules and active implementation plan were re-read. Current implementation is already on `main`; no further application/schema change was needed for this checkpoint.
- Live Supabase read-only audit confirms feature migrations `20261127164058`, `20261127164621`, `20261127165305`, `20261127165456`; ACTIVE JWT-verified Edge Functions: `submit-suggestion` v13, `activate-direct-owner` v5, `review-owner-password-change` v4, `complete-owner-password-change` v1. Legacy invitation remains v3.
- Data audit: 7 legacy Owner registration rows retained; 0 direct registrations and 0 password-change requests exist currently. No password columns exist in the registration/password-request tables, and no existing submission payload contains password keys. No test users or production submissions were created.
- Production Pages build/deploy evidence remains commit `63945f99bf1d918297475186fe9c8cbc39c40b9c`, deployment `cacbedcb-7e5b-4278-8fb3-aa1555cff2d2`. Fresh GitHub Actions run status was not accessible through the available connector actions; don't claim a fresh CI pass.
- Owner manual acceptance remains pending. Detailed 12-step test sequence is in the active plan. Wait for Owner's results before ticking acceptance.


## Production registration-lock incident fix — 27 November 2026

- Owner reported that public Add Business returned: `The new Owner account could not be safely locked pending Admin approval.`; no request appeared in Business Field Review.
- Production Edge Function logs confirmed two `submit-suggestion` POST requests returned HTTP 400 at 18:26:45Z and 18:29:11Z on 27 November 2026.
- Root cause: the registration code relied on `auth.admin.createUser()` to persist trusted `app_metadata` before the Auth `on_auth_user_created` trigger ran. The trigger did not receive the expected pending status, so the profile could be created active and the strict inactive-profile check failed.
- Fix committed to `main` as `2dd3264f1ef1701b8fbb9b8832af8ddb471aecb8`: after Auth user creation, explicitly set trusted pending `app_metadata` and apply a long Auth ban using `updateUserById`, then explicitly update and verify the new Owner profile as `role=owner,is_active=false`. If cleanup deletion fails, fallback also retains the Auth ban and inactive profile. The Admin activation function already changes the trusted status to approved and removes the ban after the required business/identity checks.
- Deployed `submit-suggestion` Edge Function version 14; status ACTIVE and JWT verification remains enabled. No schema/RLS/grant change and no production test account or business submission were created.
- Owner must now manually submit one genuine, authorized business request with a fresh email to verify the success message and Admin queue appearance. Manual acceptance remains pending; do not mark the full workflow accepted until the Owner confirms.
- Automated GitHub CI and the live end-to-end submit were not independently executed in this fix checkpoint. The function deployment itself succeeded; this is not evidence that the public submission journey has passed.
