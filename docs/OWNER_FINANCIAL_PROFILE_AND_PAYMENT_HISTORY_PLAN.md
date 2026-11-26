# Owner Financial Profiles, Payment History & Approval Workflows

**Status:** Implemented and deployed; Owner manual acceptance pending (27 November 2026).

## Owner-approved scope

The Owner explicitly approved:
- Admin → Owners: open an Owner financial profile with account details, business count, per-business plan/expiry, receipts, balances, waivers, plan assignment history, correction history and audit trail.
- Admin corrections/reversals: never hard-delete or overwrite an original receipt. Record a separate immutable, reasoned adjustment; a corrected amount of Rs. 0 is a reversal.
- Owner Portal → My Payments: show only the signed-in Owner's businesses, paid/outstanding totals and receipt history. Payment history is read-only.
- Owner payment correction requests: Owner can submit a proposed corrected amount, explanation and optional evidence/reference. Nothing changes financially until Super Admin approves.
- Owner account Full Name and Phone: submit changes for Admin approval. Password change remains self-service.
- Existing business listing edit/moderation workflow and the live `owner_edits_require_approval=true` setting must remain unchanged.

## Financial and security rules

1. `private.plan_assignments` and `private.plan_receipts` remain the source of truth.
2. Original receipt rows remain immutable. Corrections/reversals are separate append-only adjustment rows with actor, timestamp, reason and request link.
3. Net receipt = original receipt + sum(adjustment deltas). Net receipts must never be negative or exceed the assignment's agreed fee after considering other receipts.
4. Only actual net receipts count as collections. Outstanding and waived/discounted amounts remain separate.
5. Owner RPCs derive identity from `auth.uid()`; clients never supply an Owner ID for Owner data access.
6. Owner endpoints return only the authenticated Owner's records. Admin financial detail and approval RPCs are Super Admin-only in the database.
7. Private tables have RLS enabled, direct client grants revoked, and access only through narrowly scoped RPCs.
8. Profile approval RPC runs SECURITY DEFINER under the trusted database owner; a database trigger must block direct Owner edits while allowing that trusted approval transaction.
9. Do not change the existing business listing moderation setting or the existing Owner listing approval workflow.
10. No permanent deletion, direct receipt editing, payment gateway integration, refunds or automatic debt collection are included.

## Implementation checklist

- [x] Phase A: Read permanent rules, roadmap, handoff, active Finance plan, current Owner/Admin source, Finance RPC definitions, profile triggers, live schema/RLS and migration ledger.
- [x] Phase A2: Add the permanent mandatory documentation-cycle rule to `docs/PROJECT_WORKING_RULES.md` (commit `a74df37eb8dcc45887ac05b897cf91756b0a39e6`).
- [x] Phase B: Applied additive private schema, RLS, append-only adjustments, Owner-scoped read/request RPCs, Super Admin profile/review/direct-correction RPCs, profile self-edit database guard, and net-receipt Finance RPC updates. Live migration records: `20261126193259` and `20261126193516`.
- [x] Phase C: Owner Portal My Payments read-only page, correction request submission/status, and profile-change request UX; password self-service retained.
- [x] Phase D: Admin Owners clickable Owner Financial Profile, businesses/assignments/receipts/audit history, correction/reversal approvals and Owner profile-change approval queue.
- [x] Phase E: Finance dashboard, ledger, assignment history, balances, installment validation and receipt CSV now use net adjusted amounts; CSV also exports original amount and adjustment total.
- [x] Phase F1: SQL rollback/adversarial checks passed; Cloudflare Pages `npm run build` and production deployment passed for feature commit `c5ea0e23118be7785ff7b1e60b63104938fbb0b6` (deployment `9d78a58f-1157-4211-bd02-0cbce0a8b24f`).
- [ ] Phase F2: Run repository `npm run check` (TypeScript + automated tests) and complete authenticated browser smoke tests. Cloudflare Pages build runs `npm run build`; separate check/CI status was not available in the connector verification.
- [ ] Phase G: Owner manual acceptance. See `docs/OWNER_FINANCIAL_PROFILE_ACCEPTANCE_CHECKLIST.md`; do not tick until the Owner confirms.

## Required verification

- Direct authenticated Owner update of `profiles.full_name` or `profiles.phone` is rejected.
- Approved profile change succeeds through the trusted SECURITY DEFINER RPC and records an audit event.
- Owner can read only their own payment history and cannot read private tables directly.
- A second Owner cannot retrieve another Owner's profile/history or submit a correction for another Owner's receipt.
- Non-Super Admin staff cannot view financial profiles or approve payment/profile requests.
- Receipt and adjustment UPDATE/DELETE are blocked; original receipt values remain intact.
- A correction creates one adjustment; reversal sets net receipt to zero; duplicate pending requests are blocked.
- Corrected totals propagate to Owner history, Admin profile, dashboard, ledger, assignment history, balances, installments and CSV.
- No assignment can become overpaid or net receipt negative.
- Existing Owner payment verification, plan assignment, listing moderation, business data and image compression remain unchanged.

## Release and acceptance status

- Production Supabase project: existing Hello Sadiqabad project only.
- Live Supabase project only; new live migration versions are `20261126193259` (`owner_financial_profiles_and_payment_corrections`) and `20261126193516` (`admin_direct_receipt_correction`).
- `owner_edits_require_approval` remains `true`; existing business listing moderation was not changed.
- New private tables have RLS enabled and no direct `authenticated` table SELECT grant; Owner/Admin RPCs enforce role and identity in the database.
- SQL rollback checks verified Owner isolation, Super Admin-only financial profile access, Owner direct profile-edit rejection, approved profile-change flow, correction adjustment arithmetic, immutable original receipt, append-only adjustment behavior, Finance dashboard/ledger/assignment/balance propagation and installment overpayment rejection.
- Feature code is committed on `main`; Cloudflare Pages build and deployment succeeded for feature commit `c5ea0e23118be7785ff7b1e60b63104938fbb0b6`.
- Separate `npm run check` and authenticated browser smoke test remain pending; Owner manual acceptance is pending.
