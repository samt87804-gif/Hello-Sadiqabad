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
