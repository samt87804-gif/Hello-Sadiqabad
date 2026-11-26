# Admin Finance & Direct Plan Assignment — Active Implementation Plan

**Status:** Phase A read-only audit complete; implementation not yet started. Owner explicitly requested this work on 26 November 2026. This document is the active scope and acceptance source for the Admin finance and manual plan-assignment work.

## 1. Owner-approved goals

Build a secure Admin-only financial management area while preserving the existing Free, Basic and Premium plan rules and the Owner-initiated payment-request workflow.

Add a direct Admin plan-assignment workflow so an authorized Admin can assign Free, Basic or Premium to any business without waiting for an Owner payment request. The Admin must enter the agreed plan fee, amount actually received and any outstanding balance. A plan may be activated with partial payment or zero fee at the Admin's discretion.

Confirmed existing plan configuration remains unchanged:
- Free: existing limits and features; Website URL unavailable.
- Basic: Rs. 700/month; existing limits and features; Website URL enabled.
- Premium: Rs. 1,500/month; existing limits and features; Website URL enabled.

Do not change plan limits, feature entitlements, public prices or the existing one-month Owner-request activation/renewal rule as part of this work.

## 2. Read-only Phase A findings (26 November 2026)

Repository: `samt87804-gif/Hello-Sadiqabad`; production site: `https://hellosadiqabad.com`.

Read:
- `docs/PROJECT_WORKING_RULES.md`
- `docs/OWNER_PLAN_PAYMENT_ACCEPTANCE_CHECKLIST.md`
- `docs/NEW_CHAT_HANDOFF.md`
- `PROJECT_ROADMAP.md`
- Existing plan/payment migrations `20261126105654` and `20261126110358`
- Relevant Admin Business Manager, Moderation Queue, Admin Portal, API and database type files.

Production Supabase project `Hello Sadiqabad` was inspected read-only. Existing `plans`, `businesses`, `submissions`, `notifications` and `audit_logs` tables exist. No dedicated plan-payment ledger/subscription accounting tables were found. The live database has 605 businesses at the audit snapshot: 601 Free, 1 Basic and 3 Premium. One Owner plan-upgrade request is recorded as done at the audit snapshot. These counts are a point-in-time audit, not permanent constants.

The existing Admin Business Editor already exposes a raw Plan Tier dropdown. That route can change the business plan without capturing the agreed fee, received amount or balance. It must be replaced by the audited financial assignment workflow so plan changes cannot bypass accounting. The ability to change a plan remains available.

The existing Owner-request workflow is a database RPC, `review_plan_upgrade_request`, guarded by `moderation.review`. It independently checks the submitted plan amount/reference/owner confirmation, activates one month from the later of now or the existing expiry, updates the request, notifies the Owner and writes an audit log. Keep that workflow intact and extend its approval transaction to create matching financial records.

Existing `guard_business_columns` protects plan fields from ordinary Owner/staff edits; existing plan enforcement and effective-plan behavior must remain intact. Financial data must not be exposed through public business views or Owner-facing payloads.

## 3. Admin experience

### A. Direct assignment from Businesses

Add an explicit **Assign / Change Plan** action for each business in Admin → Businesses. It must open a dedicated form, not reuse the general listing editor.

Show:
- Business identity and current effective plan/expiry.
- Target plan: Free, Basic or Premium.
- Standard monthly list price (Free Rs. 0, Basic Rs. 700, Premium Rs. 1,500).
- Agreed/chargeable fee for this assignment (Admin may reduce it, including to Rs. 0).
- Amount received now.
- Automatically calculated outstanding balance.
- Payment method when money was received: JazzCash, Easypaisa, UBL/bank transfer, cash or other.
- Transaction/reference number where applicable.
- Optional internal Admin note; require a reason when a fee is reduced/waived or a zero-fee paid plan is assigned.
- Confirmation of the activation period.

For a paid plan, preserve the existing one-month period convention: start at the later of now or the current paid-plan expiry, then add one month. Free has no expiry. A downgrade to Free clears the paid expiry. Do not silently prorate or change the standard plan prices.

Partial-payment and zero-fee assignments activate immediately when the Admin confirms. Display fee, received, waived/discounted and outstanding as separate values. Outstanding must never be reported as received income.

### B. Finance & Payments page

Create a separate Admin navigation section, initially restricted to Super Admin because it contains private financial information.

Dashboard:
- Actual payments received today, this month and lifetime.
- Outstanding receivables/balances.
- Fees waived/discounted (not income).
- Basic and Premium collections.
- Payment-method breakdown.
- New assignments vs renewals.
- Paid subscriptions active and expiring soon.

Ledger:
- One row per actual receipt, with business, Owner, plan/period, amount, method, reference, received date, recorded date and recording Admin.
- Link each receipt to its plan assignment/subscription and source (Owner request or direct Admin assignment).
- Search by business, Owner, transaction reference; filter by date, plan, method and source.
- Business-wise complete plan/payment history.
- Export filtered reports as CSV (Excel-compatible).

Outstanding balances:
- Show agreed fee, total received, waived/discounted amount and remaining balance.
- Allow Admin to record a later instalment against the same assignment; append a new receipt instead of editing an old receipt.
- Prevent overpayment unless a separately approved credit/refund model is later designed.

### C. Accounting definitions

For each paid plan period:
- Standard/list price = configured standard monthly price snapshot.
- Agreed fee = amount the business is actually liable to pay after Admin discount/waiver.
- Waived/discounted = standard/list price minus agreed fee.
- Received = sum of verified receipt entries only.
- Outstanding = agreed fee minus received.
- Income/collections = actual receipt entries only; never count pending, rejected, waived or outstanding amounts as income.

A zero-fee Premium/Basic assignment is valid: agreed fee = 0, received = 0, outstanding = 0, waived = standard price. It activates the plan but contributes zero to collections.

Free plan assignment is recorded as a plan-change event with zero financial values and no expiry.

### D. Existing Owner payment requests

Keep Owner request submission and Admin verification exactly as currently designed. When an Owner request is approved, in the same database transaction:
- Verify payment as today.
- Activate/extend the plan as today.
- Create the corresponding subscription/period accounting record.
- Create exactly one receipt entry for the independently verified payment.
- Retain the existing submission status, notification and audit behavior.

Rejected requests create no receipt and no income. Pending requests are not income.

## 4. Data and security design direction

Implementation should use additive, append-oriented records, with an assignment/period record plus immutable receipt entries. Exact table/function names are to be finalized after the remaining implementation audit.

Required properties:
- Snapshot plan code, standard price, agreed fee, waiver/discount, period dates and assignment source at assignment time.
- Link Owner-request assignments to the source submission with a unique constraint to prevent double counting.
- Receipt entries are append-only; corrections must be separate audited entries, not edits/deletes.
- Use database constraints for nonnegative values, received amount limits, valid plan codes/methods and period integrity.
- A single database RPC transaction performs manual assignment, initial receipt (if any), business plan activation, notification and audit.
- Existing Owner approval RPC writes its subscription and receipt atomically with the existing activation.
- Separate RPC for later instalment receipt, with strict Super Admin authorization.
- Financial tables have RLS enabled and are not public. Only Super Admin can read them. No direct client insert/update/delete; use narrowly scoped RPCs with explicit authorization and fixed search_path.
- Never expose financial balances, references or payment records in public directory data, offline snapshots or Owner views.
- Keep the existing moderation permission for the existing Owner-request review workflow; do not widen it to financial dashboard access.
- Preserve current business plan guards, effective-plan logic, Owner feature limits, URL entitlement and existing data.

Historical migration:
- Do not invent revenue or infer receipt from a plan label alone.
- Any historical backfill must be limited to Owner requests whose existing records explicitly say status done and payment_verified=true, and must be idempotent using a unique source-submission link.
- Do not automatically invent historical manual assignments or payments where no verifiable record exists.

No payment gateway integration, automated collection, refunds, debt write-off, or automatic suspension for outstanding balance is included in this scope.

## 5. Implementation phases

- [x] Phase A: read-only repository and live-schema audit.
- [ ] Phase B: finalize additive schema, RLS, immutable ledger and atomic RPC design; verify current Supabase migration ledger and live triggers/privileges again before DDL.
- [ ] Phase C: implement manual plan assignment and replace the raw Plan Tier dropdown with the financial workflow.
- [ ] Phase D: integrate Owner-request approvals with subscription/receipt records without changing Owner payment rules.
- [ ] Phase E: implement Super Admin Finance dashboard, ledger, outstanding balances, instalment recording and CSV export.
- [ ] Phase F: automated tests, SQL rollback/adversarial tests, TypeScript/build/CI, deployment checks and production smoke tests.
- [ ] Phase G: Owner manual acceptance. Do not mark accepted until the Owner confirms.

## 6. Manual acceptance criteria

1. Admin can assign any business to Free, Basic or Premium without an Owner request.
2. Basic/Premium assignment shows standard price and lets Admin enter an agreed fee, amount received and automatically calculated outstanding.
3. Partial payment activates the selected plan and leaves the correct balance.
4. Zero-fee assignment activates the selected paid plan and records the full waiver, zero received and zero balance.
5. Free assignment clears paid expiry and records a zero-value plan change.
6. Admin can add a later instalment; previous receipts remain unchanged and outstanding decreases correctly.
7. Dashboard totals include only actual receipt entries; pending/rejected requests, waivers and outstanding balances are excluded from income.
8. Existing Owner-request submission, duplicate-pending guard, Admin payment verification, one-month activation/renewal, rejection, notification and audit tests continue to pass.
9. A staff account without explicit Super Admin authority cannot read financial records or call assignment/receipt RPCs.
10. Public/Owner/anon users cannot read financial records or references.
11. Duplicate RPC retries and duplicate source submissions cannot create duplicate receipts.
12. Existing plan limits, features, Website URL entitlement, listings, Owner records and historical submissions remain unchanged.
13. Exported date/plan/method filters match the visible ledger totals.

## 7. Release safeguards

Follow `docs/PROJECT_WORKING_RULES.md` as the highest authority. Work directly on `main`, never use branches/PRs, keep commits narrow, do not deploy partial incompatible changes, preserve production data, and do not apply an untested migration. The live Supabase migration history differs from the repository baseline; inspect the live ledger before every schema change and use only the existing Hello Sadiqabad project. Run relevant tests, build, CI, deployment and production checks. Provide practical Admin/Owner manual tests. Owner acceptance remains pending until explicitly confirmed.
