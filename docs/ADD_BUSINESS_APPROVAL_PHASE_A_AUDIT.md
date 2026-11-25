# Business Registration & Admin Approval — Phase A technical audit

**Date:** 26 November 2026  
**Repository:** `samt87804-gif/Hello-Sadiqabad`  
**Branch:** `main`  
**Audit type:** Read-only source, live-schema, RLS, Storage and migration inspection  
**Owner-approved design:** `docs/ADD_BUSINESS_APPROVAL_ACTIVE_IMPLEMENTATION_PLAN.md`

## 1. Executive result

The current implementation already has useful building blocks: a per-field review ledger, a minimum-publication gate, private pending-media storage, controlled media promotion, a linked Owner registration record and a secure server-side invitation path.

It does **not** yet implement the approved Admin experience. Business Field Approval currently performs immediate one-field RPC actions, displays field rows inline, and handles images in a separate section. It has no grouped review popup, local checkbox selection, single Save Approval action, or invitation control inside the review popup.

No code, schema, production record, Storage object, Auth account or infrastructure setting was changed during this audit.

## 2. Admin route/component/permission map

| Admin responsibility | Route/tab | Current component | Current permission | Audit finding |
|---|---|---|---|---|
| Business Field Approval | `/admin/business-review` | `BusinessFieldReviewQueue` | `moderation.review` | One card per submission exists, but fields have immediate separate Approve/Reject/Unpublish actions; media is a separate list. |
| Moderation Queue | `/admin/moderation` | `ModerationManager` | `moderation.review` | New-business submissions are excluded from the actual legacy queue and shown only as a notice/link to Business Field Approval. Other submissions/reviews remain here. |
| Businesses | `/admin/businesses` | `BusinessManager` | `business.create` (publishing additionally controlled by `business.publish`) | Existing direct Admin editing, status controls and business management are present. |
| Data Quality | `/admin/quality` | `DataQualityManager` | `business.create` | Current checks include missing pin/logo/hours/Urdu name, invalid phone, missing category/area and broken-image reports. Duplicate detection is not surfaced as a Data Quality issue in this component. |
| Owners | `/admin/owners` | `OwnersManager` | `owners.create` | Lists Owner profiles, assigned businesses, assignment controls, activation/deactivation, reset-password and public-profile/privacy management. A manual create flow still asks Admin for a temporary password; preserve/review this separately when aligning owner onboarding. |
| Owner Registration Requests | `/admin/owner-requests` | `OwnerRegistrationRequests` | `owners.create` | Currently loads linked and standalone requests together. It must become standalone-only; linked Add Business requests belong in Business Field Approval. |

The Admin navigation is currently a flat list. The approved three-group structure (Review & Approvals, Directory Management, Owner Management) remains Phase E.

## 3. Public Add Business submission trace

1. Public route is `/add-business` in `src/pages/AddBusiness.tsx`.
2. The form collects bilingual business name, category, area, primary phone, WhatsApp, bilingual address, bilingual landmark, Maps URL, daily opening hours, facilities/services, bilingual description, submitter contact, private Owner name and Gmail, and optional logo/cover.
3. Images are compressed and uploaded through `create-business-media-upload` to the private `hs-pending-business-media` bucket using a server-issued signed upload URL.
4. `submitPublicSuggestion()` calls `submit-suggestion`. The Edge Function validates payload, anti-spam/session/phone rate limits, owner name/Gmail, business fields, Maps URL, hours and media metadata; it verifies uploaded object MIME/size/path before inserting media records.
5. The Edge Function removes `owner_email` from the business payload. For anonymous submissions it creates one `owner_registration_requests` row linked by `submission_id`; the email is therefore not stored in the public business payload. The function does not create an Auth account or publish a business at submission time.
6. A database trigger seeds `business_field_reviews` rows from submitted public fields. The current seed allowlist also includes `owner_name`; that field must be rendered only in the private Admin panel and must not have a public approval checkbox.

## 4. Existing field review and publication semantics

- `business_field_reviews` stores one current decision per `(submission_id, field_key)`, with status `pending_review`, `approved_published`, `rejected` or `unpublished`.
- RLS is enabled. Authenticated SELECT is limited to Super Admin or staff with `moderation.review`; there is no anon policy.
- The public wrapper `review_business_submission_field` is SECURITY INVOKER. Its private SECURITY DEFINER implementation checks `private.staff_has_permission('moderation.review')` before changing data.
- The current RPC saves one field per call and writes an audit event. It allows explicit approve/reject/unpublish statuses. The current UI shows Unpublish for every field; the replacement must only offer unpublish for a field already published.
- The existing minimum-publication gate uses exactly five core fields: `name_en`, `category_id`, `area_id`, `phone_primary`, `address_en`. Selected field decisions can be saved while this set is incomplete; no business row is created/public until all five are approved. Preserve this owner-approved rule.
- When the core set is complete, the RPC creates and publishes a business, copies only approved optional fields, links the submission, pending media assets and linked Owner request to the new business, then updates the submission status based on remaining pending fields.
- The RPC contains a branch for `owner_name`, but `public.clear_legacy_business_owner_profile_fields()` clears `businesses.owner_name` and `owner_photo_url` on every insert/update. The live database currently has 677 businesses and zero non-null `owner_name` values. Keep Owner identity private and remove it from public-field selection.

## 5. Media lifecycle and Storage security

- `hs-pending-business-media` is private, capped at 5 MiB, and allows JPEG, PNG and WebP.
- No anon SELECT or INSERT policy exists for this bucket. There is no authenticated direct INSERT policy for visitor uploads; the public form uses a server-authorized signed upload path.
- Admin read policy is limited to Super Admin or `moderation.review`.
- `review-business-media` verifies the actor's Admin permission, asset metadata and linked business. Promotion copies the object into the public `Hello Sadiqabad` bucket and updates the business image URL. It requires the business to be published; Cover additionally requires the plan's cover feature.
- The current media review UI is separate from the business request card. Promotion is an external Storage side effect and must remain retryable without rolling back already-saved field decisions. A checked image must never become public before verified promotion succeeds.

## 6. Owner invitation and private request lifecycle

- Anonymous new-business submissions create a linked `owner_registration_requests` row with private email, name, phone and `submission_id`. Existing authenticated Owners are linked through their authenticated identity by the field-review RPC and do not require a new invite.
- The live pending Owner-request count is 4: one linked to a new-business submission and three standalone.
- `owner_registration_requests` RLS currently grants Admin read through Super Admin or `owners.create`. A moderator with only `moderation.review` cannot read the linked email; add a narrowly scoped read policy for linked (`submission_id IS NOT NULL`) rows only.
- `manage-owner-registration` requires `owners.create`, locks the request as `processing`, sends a Supabase invite, provisions an Owner profile, and calls `finalize_owner_registration` to link an eligible published business. On caught failure it attempts to delete the invited Auth user and reset the request to pending. This path is not yet invoked from Business Field Approval, and its request status alone is not a durable, separately visible invitation-task lifecycle.
- The new popup must keep invitation optional, use only the linked private request email, associate the invited account only with the reviewed business, and expose a safe retry state. Invitation delivery failure must not roll back field approvals.

## 7. Existing Admin moderation, direct edit and audit

- `ModerationManager` explicitly filters `new_business` out of its actionable legacy submissions; it shows a link to Business Field Approval instead. This is a useful compatibility boundary to preserve.
- `BusinessManager` uses `adminUpsertBusiness` for direct Admin edits and status changes.
- The generic `audit_log_record()` trigger on `businesses` currently records actor, operation, table, row ID and timestamp only; it does not preserve before/after field values. Phase E must add explicit before/after audit details for Admin edits without weakening existing protections.
- `DataQualityManager` currently identifies the issues listed in Section 2. It is a human-review surface and must not be changed to auto-delete or auto-unpublish records.
- `OwnersManager` already prevents assigning a business currently assigned to a different Owner through its visible selection list; database-side authorization remains the enforcement boundary.

## 8. Live production baseline (read-only)

| Measure | Live value at audit |
|---|---:|
| Total businesses | 677 |
| New-business submissions, all statuses | 17 |
| `new` submissions | 2 |
| `in_review` submissions | 2 |
| `done` historical submissions | 13 |
| Active queue submissions (`new` + `in_review`) | 4 |
| Pending field-review rows | 36 |
| Previously approved field-review rows | 100 |
| Pending business media assets | 2 |
| Pending Owner registration requests | 4 |
| Linked pending Owner requests | 1 |
| Standalone pending Owner requests | 3 |
| Field-review audit events | 6 |
| Media-review audit events | 0 |
| Owner-registration audit events | 0 |
| Business audit events | 2,666 |

The 13 historical `done` submissions have all five core review fields backfilled as approved but no `business_id`. They are not active queue items. Do not create businesses, re-open requests or rewrite statuses automatically. Historical backfill rows do not have matching per-field audit history; do not invent it.

## 9. Migration and test baseline

- Live migration ledger was inspected read-only and currently ends at version `20261125222340` (`sdk_jobs_admin_action_authorization`).
- The live ledger version/name history differs from the repository's consolidated migration filenames (for example, the live `business_field_approval_workflow` version is `20261125121438`, while the repository migration filename starts `20261125110000`). Never replay consolidated baseline migrations or assume a repository migration filename is safe to apply to production.
- Any new database change must be additive, uniquely versioned after the live ledger, and checked against the live schema/RLS/Storage/function privileges before application.
- Baseline app-code commit: `37abe91ebfe0b3064dbdfc073a00d5cb64ec7d0c`.
- GitHub Actions run `45717440342` completed successfully: `build` and `edge-functions` jobs passed, including TypeScript, `npm test`, production build, dependency security gate and Edge Function typecheck.
- `npm test` currently runs `src/lib/*.test.ts` and the SDK social-preview, mobile-bottom-nav and Gov-navigation Node tests. No dedicated Business Registration/Admin Approval tests were found; add focused tests before release.

## 10. Phase A exit and next steps

Phase A exit criteria are satisfied. No production state was changed.

1. Phase B: replace per-field inline actions with one card and grouped popup, field checkboxes, global/section Select All/Clear All, private Owner panel, invitation checkbox, public preview, internal note, unsaved-change protection and one Save Approval action.
2. Coordinate the UI contract with Phase C before production release: bulk atomic field decision RPC; checked = approve; unchecked = remain pending; rejection only by explicit action with reason; unpublish only for previously public fields; minimum five-field gate; invitation task state and retry; media decision/promotion retry.
3. Keep linked Add Business Owner requests out of the standalone Owner Registration Requests page.
4. Preserve existing Admin routes, legacy moderation types, direct business management, Owner Portal access and all production records.
