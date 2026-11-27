# Owner Direct Registration, Password Approval & Account Deletion — ACTIVE Implementation Plan

**Status:** AUDIT COMPLETE / IMPLEMENTATION NOT YET DEPLOYED  
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
- [ ] Add a server-only direct-registration path with strict validation, duplicate-email handling, request rate limiting, and cleanup/rollback on partial failure.
- [ ] Provision the Auth identity and profile as inactive; store only the Auth user ID on the new request.
- [ ] Ensure credentials are excluded from every submission payload, audit detail, error, and log.
- [ ] Add database linkage and narrowly scoped RLS/service-only access where required; additive migration only.
- [ ] Test duplicate email, invalid password, honeypot, oversized payload, partial failures, and inactive-user login/portal denial.

### Phase 2 — public Add Business UX
- [ ] Add Owner name/email/password/confirm-password fields for public applicants only.
- [ ] Keep the existing authenticated Owner submission flow compatible.
- [ ] Explain that account access starts only after Admin approval and that email ownership is not verified by email.
- [ ] Preserve mandatory image compression and existing media upload validation.
- [ ] Add automated form and submission tests.

### Phase 3 — Admin approval and account activation
- [ ] Replace invitation controls for new direct-registration requests with a clear pending/activate status.
- [ ] Activate the linked Auth user/profile only after all required core business fields and required media decisions satisfy the existing approval gate.
- [ ] Reject/defer paths must leave account inactive.
- [ ] Preserve existing requests and invitation history; no email sent from the new path.
- [ ] Test repeated approval, partial approval, rejection, retry and cross-account isolation.

### Phase 4 — Owner password-change approval
- [ ] Add an Owner request record and Owner Portal request/status UI.
- [ ] Add Admin approve/reject UI and server-side authorization.
- [ ] On approval, allow only the requesting authenticated Owner to set a new password in-session; do not collect or display passwords to Admin.
- [ ] Expire/consume approvals and prevent replay; audit decisions without recording password material.
- [ ] Test owner isolation, staff restrictions, approval expiry, replay and password update.

### Phase 5 — Super Admin Owner deletion
- [ ] Add a Super Admin-only account deletion action with strong confirmation and self/Super Admin protections.
- [ ] Revoke/b​​an sessions before permanent Auth deletion.
- [ ] Preserve business, financial and historical records by explicitly handling foreign keys/references; no blanket cascades.
- [ ] Write an audit record containing actor, target and outcome but no secrets.
- [ ] Test that a deleted Owner cannot sign in and that unrelated business/history records remain intact.

### Phase 6 — validation and release
- [ ] Review migrations, RLS, grants, RPCs, Edge Function JWT settings and all call sites.
- [ ] Run unit tests, Deno checks/tests, TypeScript, production build and GitHub CI.
- [ ] Apply only reviewed additive migrations to the existing Supabase project; verify live schema, RLS and advisors.
- [ ] Deploy Edge Functions and verify their active versions.
- [ ] Verify GitHub main CI and matching Cloudflare Pages production deployment.
- [ ] Owner manual acceptance remains unchecked until the Owner reports each test passed.

## Release rule

Do not ship an incomplete or incompatible combination to production. Do not claim this workflow is implemented, deployed, or owner-tested until the corresponding evidence is recorded here and in the roadmap/handoff.
