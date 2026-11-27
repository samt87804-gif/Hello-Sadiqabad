# Owner Direct Registration, Password Approval & Account Deletion — ACTIVE Implementation Plan

**Status:** PHASES 1–4 IMPLEMENTED AND DEPLOYED / AUTOMATED ACCEPTANCE INCOMPLETE / OWNER MANUAL ACCEPTANCE PENDING  
**Owner authorization:** 27 November 2026  
**Production:** https://hellosadiqabad.com  
**Repository workflow:** direct commits to `main`; existing Supabase project only.

## Owner-approved outcome

Replace the email-invitation dependency for *new* public Add Business submissions with a direct account registration workflow. A public applicant submits business details and creates credentials (email, password, confirm password). Admin reviews the business and, only after the required business approval is complete, activates the already-created Owner account. The applicant then signs in using the exact email/password selected on the public form. No invitation or password-setup email is part of this new workflow.

Add an Owner Portal password-change request. An authenticated Owner can request permission; Admin approves or rejects it. Approval never exposes a password to Admin: the Owner sets the new password inside their authenticated session after approval.

Add a Super Admin-only ability to permanently delete an Owner account. Require an explicit confirmation, protect Super Admin accounts and self-deletion, revoke sessions/ban before deletion, and write a durable audit event. Account deletion must not silently cascade-delete businesses, financial receipts, reviews, inquiries, submissions or historical moderation records. The deletion design must explicitly detach/reassign or retain references safely before Auth deletion; never use a broad cascade as a shortcut.

## Data and security decisions

- Never store plaintext passwords in `submissions.payload`, `owner_registration_requests`, logs, analytics, local storage, or Admin-visible data.
- Credentials are sent only over HTTPS to a server-side Edge Function. Only Supabase Auth stores the password hash.
- The public applicant's email is not verified by this no-email workflow. Admin must independently verify the applicant's identity/authority before activation; this trade-off must be clearly disclosed in the public form and Admin review UI.
- New Auth users must be inactive at application time. App authorization and server-side permission checks must reject inactive Owners. Do not treat email confirmation as proof of Admin approval.
- Duplicate email must fail safely and must never mutate an existing account.
- Existing pending Owner requests are retained unchanged as historical records. The owner will ask those applicants to submit fresh requests. Do not bulk convert, delete, or migrate old requests.
- Keep existing business field/media review and moderation security intact. Do not restore broad table grants or weaken RLS.
- Existing invitation Edge Functions may remain for historical/compatibility purposes during transition, but the new Add Business path must not invoke them. Retire the old workflow only after caller audit and acceptance.

## Verified baseline / audit notes

- Canonical `docs/PROJECT_WORKING_RULES.md`, live `PROJECT_ROADMAP.md`, `docs/NEW_CHAT_HANDOFF.md`, Add Business, auth context, `submit-suggestion`, Business Field Review Queue and live schema/migration ledger were inspected.
- Live tables include `profiles` (`is_active`, `role`), `submissions`, `businesses` and `owner_registration_requests`. Existing Owner request records contain invitation lifecycle columns; preserve them.
- Current live migration ledger ends at `20261127124555_fix_owner_invitation_and_admin_moderation`.
- Existing `admin-set-user-active` Edge Function is Super Admin-only and bans/unbans accounts, but is not a permanent deletion workflow.
- Existing `auth.tsx` already fails closed when profile/permission verification fails and tracks `is_active`.
- Existing `OwnerProfile` has a direct password update capability; this must be gated behind an approved password-change request without breaking other profile behavior.
- Current Add Business form collects Owner name and email but no password. `submit-suggestion` currently creates the linked registration request without Auth credentials.
- The current Business Field Review Queue includes an invitation checkbox and invitation retry lifecycle; new registrations need a separate activation path that does not send email.

## Implementation phases and acceptance evidence

### Phase 1 — secure registration foundation
- [x] Added a server-only direct-registration branch to `submit-suggestion` with password length validation, duplicate-email fail-safe behavior, per-email rate limiting, and rollback of newly created Auth identity on partial failure.
- [x] Provisioned the Auth identity with `app_metadata.owner_registration_status=pending_admin_approval`; `handle_new_user()` creates its Owner profile inactive. The request stores only `direct_auth_user_id`.
- [x] Credentials are separated from `payload`, removed before submission persistence, and are never written to request/audit/log fields. Confirm password remains client-only.
- [x] Applied additive migration `20261127164058_owner_direct_registration_foundation`; preserved the legacy request records and split active-email indexes in `20261127165305_owner_registration_legacy_email_compatibility` so old non-invited requests do not block resubmission.
- [ ] Duplicate-email, invalid-password, honeypot, oversized-body, partial-failure and inactive-login scenarios still need automated/integration verification.

### Phase 2 — public Add Business UX
- [x] Added Owner name/email/password/confirm-password fields for public applicants; authenticated Owners do not see or send new credentials.
- [x] Existing authenticated Owner submission flow remains on the same `submit-suggestion` endpoint without a new password.
- [x] Public form explains inactive-until-approval and manual identity/authority verification because no email verification is sent.
- [x] Existing image compression and media upload validation remain intact.
- [ ] Automated form/submission regression coverage and browser acceptance remain pending.

### Phase 3 — Admin approval and account activation
- [x] Added a direct-registration Admin state in Business Field Approval; it replaces the invitation action for direct-auth requests while retaining the legacy invitation path for historical requests.
- [x] Added `activate-direct-owner` (JWT required): Admin identity/authority confirmation, all five required field approvals, published business, no pending media decisions, safe owner linking, profile activation and audit event.
- [x] Inactive account remains blocked until activation; stale processing locks can be recovered. Rejected or incomplete requests cannot activate.
- [x] Legacy invitation function now explicitly refuses direct-auth requests; existing legacy requests/history remain unchanged and no invitation is sent for new direct registrations.
- [ ] Repeated approval, partial approval, rejection, stale retry and cross-account isolation still need automated/integration verification.

### Phase 4 — Owner password-change approval
- [x] Added `owner_password_change_requests` with Owner-only insert/read and Admin/moderation read policies; applied migration `20261127164621_owner_password_change_approval`.
- [x] Added Owner Portal request/status UI and Admin approve/reject queue. Review is permission-checked server-side.
- [x] `complete-owner-password-change` verifies the Owner's own JWT, consumes an unexpired approval and updates the Auth password; Admin never receives the new password.
- [x] Approvals expire after 30 minutes, are consumed once, prior active approvals are invalidated on a new approval, and audit records contain no password.
- [ ] Owner isolation, staff restrictions, expiry, replay and actual password-change scenarios still need automated/integration verification.

### Phase 5 — Super Admin Owner deletion
- [ ] Deferred from the latest confirmed workflow. Owner deletion remains a separate previously discussed scope and has not been implemented in this release.

### Phase 6 — validation and release
- [x] Reviewed additive migrations, request RLS, service-role-only Edge Function actions and JWT verification. Supabase security/performance advisors were re-run; no new security lint was introduced and the password-request multiple-permissive-policy warning was removed.
- [ ] GitHub Actions `npm run check` (TypeScript + tests + build) is not verified in this session. Cloudflare Pages ran `npm run build` successfully; this is not a substitute for typecheck/unit tests.
- [x] Applied reviewed additive migrations to the existing Supabase project and verified live columns, trigger definition and RLS policies. Existing 7 Owner registration records remain unchanged.
- [x] Deployed and verified active Edge Functions: `submit-suggestion` v13, `activate-direct-owner` v5, `review-owner-password-change` v4, `complete-owner-password-change` v1, `send-business-owner-invitation` v3.
- [x] Cloudflare Pages production deployment for commit `63945f99bf1d918297475186fe9c8cbc39c40b9c` succeeded; `npm run build` stage and deploy stage both succeeded; canonical alias `https://hellosadiqabad.com` is attached. Later commits in this workstream only changed deployed Edge Function source or docs/migration filename alignment.
- [ ] Owner manual acceptance remains unchecked until the Owner reports each test passed.

## Release rule

Do not ship an incomplete or incompatible combination to production. Do not claim this workflow is implemented, deployed, or owner-tested until the corresponding evidence is recorded here and in the roadmap/handoff.


## Implementation evidence — 27 November 2026

- Direct registration and Owner password-approval source committed directly to `main`; production migrations:
  - `20261127164058_owner_direct_registration_foundation`
  - `20261127164621_owner_password_change_approval`
  - `20261127165305_owner_registration_legacy_email_compatibility`
  - `20261127165456_owner_password_change_policy_tuning`
- The 7 existing Owner registration rows were retained. Their old pending statuses were not converted or deleted. Legacy-only email uniqueness remains separate from direct Auth registrations.
- Production Auth trigger was verified to set `profiles.is_active=false` only when trusted `raw_app_meta_data.owner_registration_status` is `pending_admin_approval`; ordinary and legacy Auth creation retains the previous Owner-profile behavior.
- Owner password request RLS now uses one combined read policy for Owner/self and authorized Admin/moderation, plus a reviewer index. Re-running advisors shows the new table no longer triggers multiple-permissive-policy or unindexed-FK warnings. Existing project-wide advisor findings remain.
- Production Pages build/deploy passed on commit `63945f99bf1d918297475186fe9c8cbc39c40b9c` (deployment `cacbedcb-7e5b-4278-8fb3-aa1555cff2d2`). GitHub Actions test/typecheck status is not verified.
- No test Owner account, real business submission or password-change request was created. Owner must perform manual acceptance after the remaining automated verification is completed.


## Final production audit checkpoint — 27 November 2026

- Re-read the canonical permanent rules, current roadmap, handoff, this plan and affected source files before final verification.
- Live Supabase migration ledger confirms all four feature migrations are applied: `20261127164058`, `20261127164621`, `20261127165305`, `20261127165456`.
- Live Edge Function inventory confirms ACTIVE, JWT-verified versions: `submit-suggestion` v13, `activate-direct-owner` v5, `review-owner-password-change` v4 and `complete-owner-password-change` v1. Legacy invitation function remains ACTIVE v3 for historical compatibility.
- Read-only live data audit: 7 existing Owner registration rows remain intact (7 legacy, 0 direct registrations so far); 0 password-change requests exist; password-change table has RLS enabled and no password-named column; Owner registration table has no password-named column; 0 existing submission payloads contain owner_password/password/confirm_password keys. No production test account, business submission or password-change request was created.
- Source review confirms public Add Business sends the password separately to the server function, confirm password stays client-only, Owner password completion calls the dedicated approval-consuming Edge Function, and Admin UI does not receive the new password.
- The feature's Cloudflare Pages application deployment is recorded as successful for commit `63945f99bf1d918297475186fe9c8cbc39c40b9c` (deployment `cacbedcb-7e5b-4278-8fb3-aa1555cff2d2`). Current GitHub connector does not expose a workflow-run listing/dispatch action, so a fresh Actions `npm run check` result could not be independently retrieved or started in this checkpoint. Do not mark CI/typecheck/unit tests as passed on the basis of Pages build alone.
- Remaining before Owner manual acceptance: obtain CI evidence when Actions run access is available, then run the practical browser scenarios below. The production feature code is deployed; manual owner acceptance is not yet recorded.

### Owner practical acceptance checklist

Use a fresh email address that has never registered on the site. Do not use a real existing Owner account for the new-registration test.

1. **Public registration:** open `https://hellosadiqabad.com` → Add Business. Enter a test business listing and Owner name/email/password/confirm password. Submit. Expect a successful submission confirmation. Keep the test email/password safe; never send the password to Admin or in chat.
2. **Password validation:** on a separate unsent attempt, enter a password shorter than 8 characters and confirm the form blocks submission. Then enter two different password values and confirm the mismatch is blocked. Do not create duplicate real requests.
3. **Inactive account:** before Admin activation, sign out and try signing in using the new test email/password. The account must not enter Owner Portal or gain Owner permissions. A denied/inactive result is expected; it must not be treated as an incorrect-password diagnosis without checking the Admin request.
4. **Admin business review:** Super Admin → Admin → Business Field Approval → Refresh. Open the new test submission. Review all required fields and each submitted image; approve/reject fields/media using the normal moderation workflow. Do not activate until the required five core fields are approved/published and all pending media decisions are resolved.
5. **Identity verification and activation:** Admin verifies the applicant's identity and authority using the site's normal independent checks (email is not verified by this no-email workflow). Tick the explicit identity verification confirmation and activate the direct Owner account. Expect a success message and a linked, published business. No invitation or password-reset email should be sent.
6. **Owner login:** sign out of Admin. Sign in with exactly the email/password entered on Add Business. Expect access to Owner Portal and the linked business under My Businesses. Confirm no other business is linked.
7. **Password-change request:** Owner Portal → Profile → Change Password → Request Admin Approval. Expect a pending status. Before approval, try submitting a new password only if the UI permits typing; saving must be blocked and the current password must remain valid.
8. **Admin decision:** Super Admin → Admin → Business Field Approval → Owner Password-Change Approvals. Confirm the request appears. Test Reject on a separate request if practical; a rejected request must not permit password change. For the main flow, click Approve. Admin must never see or enter the new password.
9. **Owner changes password:** within 30 minutes, return to Owner Portal → Profile. Enter a new password and confirmation and save. Expect success. Sign out; verify the old password no longer works and the new password signs in successfully.
10. **One-time approval:** after successful change, try using the same approval again (for example, submit a second password update without a new request). It must be denied. A new password change requires a new Owner request and Admin approval.
11. **Other account isolation:** if a second Owner test account is available, verify it cannot see the first Owner's password request or use the first Owner's approval. Do not test with another real user's credentials.
12. **Regression:** confirm existing Owner login, existing Owner Portal pages, and legacy invitation requests still work as before. Do not resend legacy invitations unless genuinely required.

After completing tests, report pass/fail by step and any exact error text (never include passwords, OTPs, access tokens or private customer details). Only then may the manual acceptance checkboxes be marked complete.
