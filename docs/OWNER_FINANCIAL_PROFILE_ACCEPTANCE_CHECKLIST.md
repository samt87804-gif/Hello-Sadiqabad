# Owner Financial Profile & Payment History — Manual Acceptance

**Release commit:** `c5ea0e23118be7785ff7b1e60b63104938fbb0b6`  
**Production:** https://hellosadiqabad.com  
**Cloudflare Pages deployment:** `9d78a58f-1157-4211-bd02-0cbce0a8b24f` (build and deploy stages succeeded)  
**Status:** Ready for Owner review; acceptance not yet confirmed.

## Super Admin review

- [ ] Sign in with a Super Admin account.
- [ ] Open Admin → Owners.
- [ ] Click an Owner's name (or **Financial Profile**).
- [ ] Confirm Owner identity, active status, business count and linked businesses appear.
- [ ] Confirm each business shows plan/status/expiry.
- [ ] Confirm plan assignment history includes agreed fee, waived amount, receipts and outstanding.
- [ ] Confirm complete receipt history shows original amount, net amount and adjustment history.
- [ ] Confirm Owner correction requests and profile-change requests show their status and explanation.
- [ ] Confirm the related audit trail is visible.
- [ ] Verify non-Super Admin staff do not see the Financial Profile action and cannot call the financial RPCs.

## Owner Portal review

- [ ] Sign in as an Owner and open **My Payments**.
- [ ] Confirm business count, paid total, outstanding total and active paid plans.
- [ ] Confirm only that Owner's own receipts and businesses appear.
- [ ] Confirm receipt amount, method, transaction reference, date and plan period.
- [ ] Confirm the page does not provide direct edit/delete controls for payment history.
- [ ] Submit a correction request only against a designated test receipt/account. Enter a corrected amount, explanation and optional evidence/reference.
- [ ] Confirm the receipt and totals do not change while the request is pending.
- [ ] Confirm request status and Admin response appear in request history.

## Owner profile approval

- [ ] On a designated test Owner account, open Profile and request a Full Name and/or Phone change with a reason.
- [ ] Confirm the current account values remain unchanged while pending.
- [ ] As Super Admin, approve or reject the request from the Owner Financial Profile.
- [ ] If approved, confirm the Owner profile reflects the approved values and the request/audit history records the decision.
- [ ] Confirm password change remains self-service.
- [ ] Confirm existing business listing edits still follow the existing approval setting and moderation workflow.

## Financial integrity safeguards

- [ ] Do not test a correction/reversal against a real customer payment unless the Owner has explicitly approved the actual correction.
- [ ] Use only a test Owner/business/receipt for any approval or reversal test.
- [ ] Never attempt to delete an original receipt. Admin corrections append an adjustment; corrected amount Rs. 0 means reversal.
- [ ] Verify Admin Finance dashboard, ledger, balances, assignment history and CSV use net adjusted receipt amounts.
- [ ] Confirm waivers and outstanding balances are not counted as cash received.

## Acceptance result

- Owner acceptance: [ ] Accepted  [ ] Issues found
- Tester/date:
- Notes / screenshots / issue details:

Do not mark Owner acceptance complete until the Owner explicitly confirms the manual review.
