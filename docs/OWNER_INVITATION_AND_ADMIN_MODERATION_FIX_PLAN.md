# Owner Invitation, Password Setup & Admin Moderation Reliability — Active Fix Plan

**Owner approval:** 27 November 2026. Work directly on `main` and the existing Supabase project only.

## Reported production symptoms

1. Owner opens an invitation link, enters a new password, but Save is disabled and cannot continue.
2. Admin → Moderation Queue shows: `1 admin data request(s) failed or timed out`.
3. Business Field Approval approves the submitted fields and sends an invitation, but Owner profile provisioning fails; retry shows `Owner profile could not be provisioned`.

## Root-cause evidence

- Supabase Postgres logs at 27 November 2026 12:26–12:31 PKT show `permission denied for schema private` from `private.guard_owner_profile_self_edit()`. The trigger calls `private.is_super_admin()` in invoker context, while authenticated users do not have USAGE on the private schema.
- Supabase Postgres logs at the same time show `permission denied for table submissions` from Admin data reads. The private-note hardening intentionally removed broad authenticated SELECT; however, `fetchAllSubmissionsAdmin()` still reads the entire table directly.
- Supabase Edge Function logs show `send-business-owner-invitation` returned HTTP 400 during the profile provisioning attempt. Its profile upsert overwrote `full_name` and `phone` on conflict, which invokes the Owner self-edit trigger even when the account already has a profile.
- `ResetPassword.tsx` recognized access-token/recovery and PKCE code formats but did not explicitly verify invite/recovery `token_hash` URLs or establish a session from all supported token forms.

## Implementation

- [x] Add an Admin-only `admin_moderation_submissions()` RPC requiring Super Admin or `moderation.review`; do not restore direct table SELECT.
- [x] Repair `private.guard_owner_profile_self_edit()` with a tightly scoped SECURITY DEFINER trigger function and JWT-role check; do not grant authenticated USAGE on `private`.
- [x] Change invitation profile provisioning to insert only when absent and update only role/activation flags for an existing non-Owner profile; never overwrite an existing Owner's name/phone during retry.
- [x] Parse Supabase invite/recovery token hashes, PKCE codes and access/refresh tokens; establish a session before enabling password Save.
- [x] Add regression tests for auth invitation/recovery URL parsing.
- [ ] Run typecheck, unit tests, production build and Edge Function typecheck.
- [ ] Deploy Supabase migration and both affected Edge Functions.
- [ ] Deploy Pages app and verify the exact main commit.
- [ ] Verify RPC access is denied to anon and non-Admin authenticated users; Super Admin / moderation.review succeeds.
- [ ] Owner manual acceptance: accept a fresh invitation, set password, sign in to Owner Portal, verify linked business; retry an invitation from Business Field Approval; open Moderation Queue and confirm submissions/reviews load without the red warning.

## Safety

- No new Supabase project or staging project.
- No production test Auth user, dummy business submission, invitation email, or existing Owner record mutation for verification.
- Preserve RLS, private Owner data, field approval history, existing Auth accounts, business links and retry/idempotency semantics.
- Do not mark Owner acceptance complete until the Owner reports the practical checks passed.
