# Owner Portal Audit — 14 November 2026

## Scope

Reviewed the Owner Portal routes/components, connected Supabase schema/RLS/RPCs, public submission Edge Function, GitHub CI, and Cloudflare Pages production project.

## Existing Owner Portal modules

- Owner dashboard and listing selector
- Business listing editor (basic details, contact, location, hours, services, social links and media URLs)
- Offers manager
- Customer reviews and owner replies
- Customer inquiries inbox
- Analytics dashboard (7/30/90-day selector)
- Plan and benefits view / manual upgrade request
- Notifications
- Owner profile and password update

## Live database snapshot

- Businesses: 123 (all currently published)
- Businesses assigned to an owner: 0
- Owner profiles: 1
- Super-admin profiles: 1
- Pending/recorded submissions: 0
- Sadiqabad area records: 204
- Supabase Storage buckets: 0

Existing businesses were deliberately not assigned to an owner. No ownership can be inferred from a public directory record.

## Production fixes applied

### 1. Analytics date-window consistency

The owner_dashboard_stats RPC previously returned all-time totals while the series was date-filtered. Totals and series now use the same clamped 1–90 day window. Search terms remain an empty array until owner-attributable search analytics are implemented; no sample search terms are fabricated by this RPC.

### 2. Review reply editing

The owner_reply_to_review function previously updated only reviews whose owner_reply was NULL, so the existing edit UI could not edit a saved reply. It now permits an active owner of the business to replace a reply on an approved review, with a 1–500 character validation.

### 3. Inquiry least-privilege permissions

The broad inquiries_manage policy was replaced with owner/staff SELECT and UPDATE policies. Authenticated users can update only status, handled_by, and updated_at; they cannot update customer phone/message fields or delete inquiry records.

### 4. Authenticated owner claim linking

public.submissions.submitted_by now records an authenticated active owner account for claim and new-business submissions. The submit-suggestion Edge Function remains publicly callable (verify_jwt=false) but validates any supplied bearer token before associating an active owner profile.

Moderator approval now:
- Links an authenticated owner claim to that owner's account.
- Links a new business submitted by an authenticated owner after approval.
- Sends an owner notification using existing supported notification types.
- Refuses to overwrite a business already assigned to another owner.
- Leaves anonymous submissions unlinked for manual admin account assignment.

## Regression checks

All SQL regression fixtures were created inside transactions and rolled back.

- 7-day analytics excluded a 10-day-old fixture and included the 2-day-old fixture.
- A saved review reply was edited successfully.
- Inquiry status update succeeded; phone/message update and delete privileges were denied.
- Authenticated claim approval linked the business and displayed an owner notification under owner RLS.
- Authenticated new-business approval published and linked the business and displayed an owner notification.
- No regression fixture remains in production data.

GitHub CI passed (npm ci, lint, tests, production build). Cloudflare Pages production deployment for the audited main commit completed successfully.

## Remaining work / gaps

### Critical / operational

1. Existing 123 published businesses remain unassigned. Do not bulk-assign them; each owner relationship needs verified evidence or an explicit admin assignment.
2. Anonymous claims can still be approved as verified listings without an owner_id; an admin must create/identify the owner account and assign the business.
3. Owner Portal has no visible claim-submission history/status page. Owners currently receive the submission confirmation toast, then an approval notification if their authenticated account was captured.
4. The remote Supabase migration ledger and the repository's fresh-project baseline are not a one-to-one history. The README explicitly says not to replay the baseline on the already-initialized production project. Continue using sequential, tracked additive migrations and reconcile the historical ledger before attempting a fresh remote db push.

### High-priority product gaps

5. Business media is URL-based. There is no Storage bucket or direct upload/crop/replace workflow.
6. Owner analytics does not yet expose real search-term attribution; top_search_terms is empty.
7. Plan upgrades are manual requests; online payment, invoices, receipts and renewal transactions are not implemented.
8. Owner profile has basic name/phone/password controls but no profile photo or notification preference controls.
9. No end-to-end test currently exercises the complete production owner journey (sign-in → claim/new listing → moderation → assigned listing → edit → customer actions). Existing ownerPortal.test.ts primarily tests the local demo-data path.

### Security / operations

10. Supabase Auth leaked-password protection is still disabled (security advisor warning).
11. Supabase performance advisor reports unused indexes. These are informational; do not remove them without workload evidence.
12. Storage policies, media upload validation, and owner-visible upload quotas must be designed together when the media feature is implemented.

## Production change references

- 20261114151944_owner_portal_analytics_review_reply_and_inquiry_hardening
- 20261114152133_owner_claim_account_linking_and_approval_notification
- 20261114152250_fix_owner_claim_notification_type
- 20261114152345_link_owner_submitted_new_business_to_portal
- Edge Function: submit-suggestion, version 6
- No pull request was created; changes were committed directly to main.


## Admin owner creation and listing assignment correction — 18 November 2026

- Owner reported that choosing an existing listing while creating an Owner Portal account did not result in the listing appearing under that owner.
- Read the permanent project rules, Owner Portal audit, current OwnersManager UI, admin-create-user Edge Function, shared validation helper, live schema/RLS, and production function logs.
- Confirmed production has 3 owner profiles: one owns ARTS APPAREL; two have no assigned listings. Production currently has 371 unassigned businesses and 1 assigned business. No existing owner/business relationship was changed.
- Root causes in the creation path: the Edge Function duplicated email validation with an incorrectly double-escaped regex instead of using the already-imported isValidEmail helper; the UI also offered already-assigned listings and retained the previous selected listing after a successful creation. The Edge Function correctly refused to overwrite a non-null owner_id, but its error was generic.
- Fix: use the shared email validator; preflight-check the selected business exists and is unassigned; preserve the conditional owner_id IS NULL update and verify the returned owner_id; compensate by deleting the just-created Auth user if the assignment loses a race; return clear conflict errors; show only unassigned listings in the admin dropdown; clear selection after success and when opening/closing the modal.
- No Supabase schema, RLS, permissions, existing profile, Auth user, business record or ownership relationship was changed as part of the fix. Edge Function deployment and CI/Pages verification are tracked separately.


## Existing owner multi-listing management — 18 November 2026

- Added a separate Manage Listings action to each existing owner card; public profile/privacy remains separate.
- Admin can select multiple unassigned businesses and retain/remove the selected owner's existing assignments in one save.
- New Supabase Edge Function validates authenticated admin/staff permissions, active owner role, UUIDs, and listing ownership. It refuses cross-owner transfers and uses conditional updates to avoid overwriting a concurrent assignment.
- No database schema, RLS, profile, auth user, or existing business ownership was changed during implementation. Actual assignment changes occur only when an admin explicitly saves the listing selection.
- Demo mode supports the same multi-listing selection behavior.
- Verify CI, Edge Function deployment, Cloudflare Pages deployment, and a read-only production check before declaring live.
