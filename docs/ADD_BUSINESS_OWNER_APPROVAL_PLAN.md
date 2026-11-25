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


## Implementation status — 25 November 2026

Owner-approved execution mode: commit directly to GitHub `main`; do not create Pull Requests. The previous implementation branch and PR #19 were closed unmerged at the owner's request.

### Implemented source (not released)
- The Phase 2 implementation source exists on `feat/business-owner-field-approval`: field-level review queue/RPC, private pending media, Add Business fields/uploads, owner registration linkage and rollback, and media moderation Edge Function.
- This is reference code only; those app/Edge Function changes and migration 2 are not in `main` and are not deployed.
- Migration 1 is present on `main`. Its malformed duplicate trailing fragment was removed in commit `1bb9d3e2e530078a6d2f7ae4c63d2b350af4ea9a`; current source ends with one `COMMIT`.
- CI run [45608741733](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45608741733) passed build and Edge Function jobs. CI does not execute the SQL migration.

### Blocker and release gate
- A $0/month temporary Supabase project was approved, but project creation was blocked by the organization's limit of two active Free projects. No staging project was created.
- No Phase 2 migration has been applied to production. Production schema/data remains untouched by this work.
- Do not ship the Add Business/Admin/Edge Function code until migration 1 and migration 2 have been tested together against an isolated database, including rollback and RLS/Storage checks.
- Before release, resolve static concerns in media cleanup/atomicity, verify all live columns/constraints/helper functions, and test legacy `approve_submission` branches and existing owner-registration requests.

**Next step:** obtain an isolated staging database (free an existing Free project slot or explicitly approve a paid staging option), validate both migrations and workflows, then port only the verified code directly to `main` in narrow commits.

### Additional security review — anonymous media upload

Static review of the closed feature-branch implementation found that `AddBusiness` uploads pending images directly to the private Storage bucket using the public client before calling `submit-suggestion`. The `submit-suggestion` Edge Function rate-limits only after those objects have already been uploaded. Its `storage.objects` INSERT policy allows anonymous uploads into the `pending` folder, so an attacker can bypass the Edge Function rate limit and create many objects (each individually bounded by the bucket's 5 MB/MIME restrictions). This is a storage-abuse / cost-exhaustion risk and is a release blocker.

Required fix before release: replace unrestricted anonymous direct uploads with short-lived, narrowly scoped signed upload authorizations issued by a rate-limited server-side endpoint (or another equivalently enforced quota design). Bind authorization to the allowed `logo`/`cover` path, MIME type, max size and one-time submission token; ensure abandoned uploads expire/are cleaned up. Test that anonymous clients cannot upload without authorization and that repeated requests hit server-side limits. Do not relax the private bucket's read restrictions.

### Data API grants review — 25 November 2026

Supabase's 30 October 2026 change requires explicit grants for newly created `public` tables before the Data API can access them. The migration already grants authenticated SELECT for the admin/owner-facing tables and authenticated EXECUTE for the RPCs. Static review found the service-role Edge Functions also need access to the new media tables: `submit-suggestion` inserts/selects `business_media_assets`; `review-business-media` reads/updates `business_media_assets` and updates `business_image_change_requests`. Migration 1 was amended in commit `49569240a9d51c5922790df9ae147539487a9fb8` to grant `SELECT, INSERT, UPDATE` on `business_media_assets` and `SELECT, UPDATE` on `business_image_change_requests` to `service_role`. This is source-only; SQL remains unexecuted pending isolated staging validation.

### Legacy moderation compatibility review — 25 November 2026

Read-only production inspection found 13 existing `new_business` submissions with status `done` but `business_id IS NULL`, plus 3 still `new`. The live legacy `private.approve_submission` implementation creates the business but does not write the new business ID back to `submissions.business_id`. The Phase 2 backfill was corrected in commit `ac3b54d58f106d20eb2ce02e00decd05915cc56f` to mark all legacy `done` submissions as `approved_published`, preserve `rejected` as `rejected`, and leave other states pending; it must not infer/link existing business IDs from names or phones.

A separate UI integration issue was found: existing `ModerationManager` still includes `new_business` rows in its `All` and `New Listings` filters and calls legacy `reviewSubmission()` / `approve_submission()` for those actions. Once the migration's guard is active, this legacy approval path intentionally fails. The release must hide/route `new_business` out of the legacy moderation manager and make the new field-review queue the sole path, while preserving all other legacy submission types. Do this in the same coordinated release as the new queue and migrations.