# Add Business & Owner Approval Plan

**Owner-approved decisions:** 25 November 2026.

## Public Add Business fields
- Business Name English; Business Name Urdu.
- Primary Phone; WhatsApp Number.
- Category (controlled dropdown).
- Area (controlled dropdown).
- Business Description.
- Facilities (controlled checkbox options).
- Business Address English; Business Address Urdu.
- Nearby Landmark.
- Google Maps Location URL.
- Opening hours for every day.
- Business Logo/Profile image.
- Business Banner/Cover image.
- Business Owner Name.
- Gmail.

Do not collect Password or Confirm Password. Supabase invitation flow is used after Admin review; owner sets password through the secure Supabase link.

## Missing taxonomy values
If Category or Area is not present, show bilingual instructions to WhatsApp Admin, request the taxonomy addition, then return and retry. Do not auto-create taxonomy values from public input or accept them as verified categories/areas. Preserve existing IDs and references.

## Field-level Admin moderation
Each submitted field independently supports Pending Review, Approved & Published, Rejected and Unpublished. Admin can approve one field while keeping another hidden; later publish previously unpublished fields. Rejection/unpublishing does not delete submitted values or history. A safe minimum listing rule must prevent incomplete/unsafe public cards.

Private owner/submitter contacts remain Admin-only unless a separately approved public field exists. Every review/status change records actor, timestamp, old/new status and audit context.

## Media
Initial Logo and Cover uploads stay private in pending storage. Admin approves each media asset before it is publicly served. Keep the current approved image visible until a replacement is approved. Validate MIME, size, path, uploader and ownership. Avoid public bucket URLs for pending media.

## Owner monthly image cap
Maximum two image-change requests per business per calendar month for profile/logo and cover images combined. Enforce in database/RPC/Edge Function, not only UI. Use Pakistan-time calendar month boundaries. Show remaining allowance. Admin review is still required; Admin moderation is not blocked by this owner quota. Do not count unrelated gallery/product images unless owner explicitly expands the policy.

## Owner account creation
1. Owner submits business and owner details.
2. Submission remains pending; no Auth user/password is created.
3. Admin reviews all fields and media separately.
4. Admin approves selected public fields.
5. Admin explicitly sends Supabase owner invitation through the existing secure server-side owner registration workflow after inspecting it.
6. Owner follows secure confirmation/invitation link and sets their password with Supabase.
7. Server-side process associates the authenticated owner with only the intended approved business.
8. Failure/rollback and duplicate-invitation cases must be tested.

Preserve existing anti-spam, honeypot, phone validation, moderation submission, permissions, audit logs and rate limits. Do not save private partial form values to local storage.

## Acceptance
- No public password field or password storage.
- No account at initial public submission.
- Pending media cannot be fetched publicly.
- Every field status controls public visibility independently.
- Owner invite is Admin-authorized and audited.
- Monthly image quota is enforced server-side.
- Existing business/submission data and workflows remain intact.


## Current implementation and live-schema preflight — 25 November 2026

This is a read-only baseline for the future implementation; no Phase 2 code or database changes have been applied.

- Public route is `/add-business`. Current form captures English/optional Urdu name, category, area, primary phone, optional WhatsApp, one English address, facilities, English description and contact name/phone. It does not yet capture Urdu address, separate landmark, map URL, daily hours, owner Gmail or logo/cover uploads.
- The current form auto-selects the first Category and Area after loading. The approved replacement must start with an explicit empty selection and display bilingual missing-taxonomy instructions.
- Public form submits a generic `new_business` item through `submitPublicSuggestion()` into `public.submissions`; no Auth account is created at initial submission.
- Live `public.submissions` has generic `payload` JSON plus `contact_name`, `contact_phone`, `submitted_by`, status and assignment fields. It has no per-field review ledger.
- Live `public.businesses` has the current directory fields and is RLS-enabled. Existing public read is published-only; authenticated read has owner/Admin/staff scopes. No field-level visibility state exists.
- Existing `private.approve_submission(uuid,text)` is a SECURITY DEFINER routine with multiple branches for new businesses, claims, corrections, reports and owner content. Its current `new_business` approval branch inserts the whole listing as `published` in one operation and sets submitted logo/cover to NULL. Do not remove or rewrite other submission branches.
- Live `owner_registration_requests` is a separate table with full name, email, phone, business name and review status; it has no submission/business foreign key.
- Deployed `manage-owner-registration` is ACTIVE version 3 with JWT verification. It validates the Admin actor, locks a pending request, invites by email, creates an owner profile and rolls back some provisioning failures. It currently does not attach the invited owner to a business.
- The only live Storage bucket is `Hello Sadiqabad`, configured `public=true`. Existing business media policies govern authenticated writes, not anonymous reads; a folder inside this bucket is not private.
- Live RLS inspection confirms public submissions and owner-registration requests have restricted insert/read policies; Admin moderation/owner permissions are enforced through private permission helpers. Keep those boundaries.

**Implementation constraints:** Keep legacy `submissions` payloads and other submission types backward compatible. Add field-level review/media/quota structures additively. Preserve the current `approve_submission` branches for all non-new-business submission types and explicitly close the old whole-listing approval bypass for new-business records only when the replacement workflow is fully ready. Create a separate private pending-media bucket and test anonymous reads are denied before any public promotion. Invitation must be idempotent and associate only the exact reviewed business; failure must leave a retryable state and must not leave a half-linked account.


---

## Phase 2 implementation status — 25 November 2026

**In progress on** `feat/business-owner-field-approval`; Draft PR [#19](https://github.com/samt87804-gif/Hello-Sadiqabad/pull/19).

Implemented in branch code:
- Expanded Add Business fields, removed default Category/Area selection, validates Gmail and uploads logo/cover into a separate private pending bucket.
- Added additive per-field review ledger, legacy new-business approval guard, and non-destructive backfill of existing new-business payload fields.
- Added field review RPC and Admin queue; approved required core fields create the public listing, optional fields are individually controlled.
- Added private media review/promotion Edge Function and owner image-change request quota RPC (2 per business per Pakistan-local calendar month).
- Added owner registration request linkage and secure invitation/business association with rollback handling.
- Added cleanup for pending uploads when submission fails before the moderation workflow is established; owner image-change RPC verifies the private object exists.

Verification / blockers:
- Earlier branch head passed CI and preview deployment; latest follow-up commits require fresh CI confirmation.
- Cloudflare preview is not production. No production migration, Storage bucket, business row, owner request, Auth user or other production data has been changed.
- Supabase isolated branch could not be created on the current plan. Both SQL migrations still require execution and rollback testing against an isolated database; do not merge/apply them to production yet.
- Human SQL/security review and verification of repository branch protection/required checks remain outstanding.
- Phase 1 authenticated desktop/mobile acceptance is still outstanding; Phase 2 is proceeding as the owner-approved next workstream, not as a claim that Phase 1 passed acceptance.

**Release gate:** Keep PR #19 Draft and do not merge until latest CI passes, SQL validation/rollback testing succeeds on an isolated database, human review is complete, and branch protection is verified.
