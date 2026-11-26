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


### Phase 3A — Owner data-load reliability (implementation awaiting CI)

- `useOwnerPortalData` now uses a monotonically increasing request sequence; effect cleanup invalidates in-flight work. Only the newest request may update data, show an error or clear loading.
- Switching selected business immediately clears business-scoped analytics, offers and products. A failed load cannot leave the previous business's results visible under the new listing.
- This is a narrow reliability fix. Cross-page overfetch and server-side pagination/filtering remain unchecked Phase 3 tasks.
