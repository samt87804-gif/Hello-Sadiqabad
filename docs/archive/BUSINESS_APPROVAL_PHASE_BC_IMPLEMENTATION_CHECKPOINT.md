# Business Approval Phase B/C — implementation checkpoint

**Date:** 26 November 2026  
**Production main:** `84d72a4746d69a08eeb87238856a3b92a687b7ca`  
**Active feature branch:** `feature/admin-business-workflow-phase-e` (not merged)

## Production implementation

- One Add Business request card per active registration, with request summary, field counts, Owner invitation state and image count.
- One review popup with business, contact, location and opening-hours groups; individual field selection; global and section Select All/Clear All; explicit rejection reason; explicit unpublish; public preview; private Admin note; unsaved-change confirmation; one Save Approval action.
- Owner name/email remain private and are not public-approval fields.
- Bulk review is server-side. Checked fields approve, unchecked fields stay pending, and explicit rejection/unpublish are separate statuses.
- Five required public fields gate publication. Selected fields can be recorded before the minimum is met; the business remains private until it is.
- Invitation is optional and independent. The secure Edge Function resolves an Auth user server-side, links only to the reviewed business, uses a processing claim/CAS for retries, and records failure without rolling back field approval.
- Pending media stays private. Approved media can remain in `approved_pending_promotion` until the business is public and plan entitlements allow promotion. Cover media on an ineligible plan is deferred, not allowed to block unrelated field decisions.
- Standalone Owner Registration Requests are filtered to `submission_id IS NULL`; the legacy management Edge Function refuses linked Add Business requests.

## Database and Edge Functions

Applied migrations:

- `20261125232726_business_approval_bulk_review_invitation_media`
- `20261125233525_business_review_defer_plan_gated_decisions`
- `20261125233716_business_review_api_privilege_and_policy_tuning`

Active deployed Edge Functions:

- `send-business-owner-invitation` v1, JWT required.
- `review-business-media` v4, JWT required.
- `manage-owner-registration` v6, JWT required.

The public bulk RPC is SECURITY INVOKER; the private helper is SECURITY DEFINER and checks `moderation.review`. Anonymous execute is denied. Owner request RLS is consolidated into one policy: standalone rows require `owners.create`; linked rows require `moderation.review`; super-admin can read both.

## Verification evidence

- GitHub Actions run [45722802681](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45722802681): success.
- Cloudflare Pages production deployment: `a77f3156-deed-4d69-a208-d98e4d5ec468`, success, alias [hellosadiqabad.com](https://hellosadiqabad.com).
- Transactional bulk-review test: business published only after five core fields; `owner_name` remained pending/private and `businesses.owner_name` remained null; invitation task persisted as pending; no email was sent; all rows rolled back.
- Transactional media-finalizer test: `approved_pending_promotion` state saved; all rows rolled back.
- RLS/function privilege checks: linked Owner rows visible to authorized moderator; public RPC is invoker; authenticated can execute; anon cannot.
- Post-test checks found zero synthetic test submissions/businesses/Owner requests/media remaining.

## Live baseline at checkpoint

| Record | Current count |
|---|---:|
| Add Business — new | 2 |
| Add Business — in review | 2 |
| Field reviews — pending | 36 |
| Field reviews — approved | 100 |
| Business media — pending review | 2 |
| Linked Owner requests — pending, invitation not requested | 1 |
| Standalone Owner requests — pending | 3 |
| Owner requests — processing | 0 |

No real invitation email or new Auth account was created by this work.

## Feature branch work (not production yet)

Branch `feature/admin-business-workflow-phase-e` adds:

- Collapsible review sections, request ID and authorized media thumbnails.
- Desktop Admin navigation groups for Review & Approvals, Directory Management, Owner Management and Other Operations.
- Owners page limited to existing accounts; removes manual Owner creation/temporary password setting and sends password-reset links for Owners to set their own password.
- Clearer Moderation Queue, Businesses and Data Quality descriptions; Audit Logs renders before/after values.
- Branch-only migration `20261125235000_business_admin_field_change_audit.sql` to record changed business fields with old/new values while excluding private legacy owner profile fields.

This branch is not merged. Do not apply its audit migration to production until PR approval/merge.

## Remaining acceptance

- Complete branch CI and PR review/merge.
- Apply and transaction-test the Admin before/after audit migration after merge.
- Authenticated Admin browser walkthrough of field decisions, invitation retry, media follow-up and public preview.
- Verify anonymous Storage read denial for pending media and public access only after promotion.
- End-to-end real Owner invitation/password setup, Owner Portal isolation and Owner edit → Moderation Queue → approval using an owner-approved test account.
