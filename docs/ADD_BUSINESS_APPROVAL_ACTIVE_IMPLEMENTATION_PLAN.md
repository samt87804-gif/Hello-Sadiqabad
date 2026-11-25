# Business Registration & Admin Approval — ACTIVE Implementation Plan

> **ACTIVE PLAN — FOLLOW THIS DOCUMENT.** Owner approved the redesigned workflow on 26 November 2026.
> This document supersedes the earlier Business Registration / Owner Approval workflow design for future implementation decisions. The previous plan is retained for history only: [ADD_BUSINESS_OWNER_APPROVAL_PLAN.md](ADD_BUSINESS_OWNER_APPROVAL_PLAN.md). **Do not implement or continue the superseded workflow described there.** Preserve compatible functionality already shipped; do not roll back production code because a design is archived.

## 1. Owner decision and objective

The owner approves one coherent request-based Admin workflow. A public Add Business submission appears as **one request card**. Admin opens the card and reviews the complete submission in one popup/drawer. Admin selects individual public fields to approve, optionally asks the system to send the Owner invitation, then performs **one Save action**.

Do not make Admin approve every field through separate queue rows/pages or multiple Save actions. Do not create a second parallel approval queue for the same Add Business request.

## 2. Canonical end-to-end workflow

1. Visitor submits the public Add Business form.
2. System stores one pending registration request. It does not create an Auth account, set a password, publish the business or expose private owner contact data.
3. Admin opens Business Field Approval and sees one card for that request: request ID, business name, category/area, submitted date, authorized logo/cover thumbnails and concise field counts.
4. Admin clicks the card. One review popup opens with all submitted data grouped into collapsible sections.
5. Admin checks only fields that should become public. Every public field has its own checkbox. Section Select All and global Select All/Clear All are available.
6. Owner name and Gmail/email are marked Private — Admin only. They have no public approval checkbox.
7. Logo and cover appear as separate media items with previews and independent approval checkboxes. Pending/private media remains private until verified and promoted.
8. Admin optionally checks Send Owner Invitation Link. Invitation is independent of public field approval. If unchecked, no invitation is sent.
9. Admin presses one Save Approval action. The system validates and records field decisions/audit history, publishes only selected safe fields and records an invitation task if requested.
10. If requested, the secure server-side invitation flow sends the link and associates the invited account only with this approved business. Invitation failure must not silently undo valid field decisions; show a retryable state and separate retry action.
11. Owner follows the Supabase invitation/confirmation link and sets their own password. Owner Portal shows only businesses linked to that authenticated owner.
12. Owner edits are change requests. Previously approved public values remain visible until Admin approves replacements. Requests go to Moderation Queue.
13. Admin direct edits to existing businesses happen in Businesses management and are audited with actor, timestamp, old/new value and context.
14. Data Quality identifies incomplete, duplicate or suspicious records for human review. It never silently deletes, unpublishes or overwrites a business.
15. Standalone Owner Registration Requests remain separate; they are not Add Business registrations and must not be merged into that queue.

## 3. One-card request list

Each Add Business submission has exactly one card. Show request ID, status, English/Urdu business name, category, area, submitted date/time, authorized media thumbnails, counts (submitted / selected / pending / explicitly rejected), and a Review request action. Do not expose owner email/phone in the list to staff lacking the relevant permission. Do not show each field as a separate queue item.

## 4. Review popup / drawer

### Header and actions
- Business name, request ID, submitted timestamp and current state.
- Previous/Next request navigation where supported.
- Public preview of currently selected fields; preview never publishes.
- Close without saving and an unsaved-changes warning.
- One primary Save Approval action.
- Optional Reject Entire Request action, requiring reason and confirmation.

### Field groups and independent selection

Render submitted fields only, grouped as follows:

**Business Information:** Business Name English/Urdu, Category, Description English/Urdu, Facilities/Services.

**Contact Information:** Primary Phone, WhatsApp, website/social links and a public business email only if explicitly collected as a business contact field with clear consent. Owner Gmail is never this field.

**Location & Address:** Area, Address English/Urdu, Nearby Landmark, Google Maps URL / verified coordinates.

**Facilities & Hours:** Facilities, daily opening hours and 24-hour status.

**Business Images:** Logo/Profile, Banner/Cover and other image slots only if already part of the approved form/media model.

Each public field shows its submitted value and an independent checkbox. A field can be approved while another remains pending.

### Selection controls
- Global Select All and Clear All.
- Section-level Select All / Clear.
- Checkbox changes are local until Save; they must not mutate the database early.
- Reopening a request loads persisted decisions, not stale browser-only checkbox state.

### Private owner details
- Owner full name and owner Gmail/email appear in a distinct Private — Admin only panel.
- They have no public-approval checkbox and never enter public views, search, SEO, Open Graph, sitemap, analytics or offline directory.
- Only authorized Admins can see the email for review/invitation.
- Checkbox: Send Owner Invitation Link.
- If no valid owner email exists, disable invitation and explain why.
- If not selected now, invitation can be sent later through authorized owner/business management.

### Internal note and audit
Optional private Admin note, never public. Record reviewer, timestamp, selected fields, fields left pending, explicit rejections, media decisions, invitation requested/result and reason/context. Keep review history auditable.

## 5. Save semantics — critical

- Checked public fields become approved and eligible for publication, subject to minimum-safe-listing rules.
- Unchecked fields remain Pending / Not published. They are not automatically rejected.
- Rejected is an explicit Admin decision with a reason.
- Unpublished is for a previously public field intentionally hidden; preserve its value and history.
- Existing approved public values remain visible until an approved replacement is ready.
- Incomplete businesses must not appear as misleading public listings.
- Field decisions and business publication state must commit consistently; validation failure must not partially publish.
- Invitation is a separate external side effect. Persist an auditable invitation task/state; sending must be idempotent and retryable.
- Do not claim invitation sent until the server confirms success.
- Media promotion is separate from checking its box: verify ownership, MIME, size and private source path, then promote only approved assets. Keep existing approved media until replacement promotion succeeds.

## 6. Responsibilities of the six existing Admin pages

Keep existing routes/capabilities unless separately approved. Clarify labels/help and navigation; do not merge data models or duplicate queues.

| Existing page | Canonical responsibility |
|---|---|
| /admin/business-review | Business Field Approval — one card per new public Add Business registration; popup field selection and one Save |
| /admin/moderation | Moderation Queue — Owner/public change requests, products, services, offers, reports and existing moderation submissions; not a second Add Business queue |
| /admin/owner-requests | Owner Registration Requests — standalone Owner access requests not linked to a new Add Business request |
| /admin/businesses | Businesses — existing records, Admin direct edits, visibility/publish controls and audited changes |
| /admin/quality | Data Quality — missing, duplicate, invalid and inconsistent data review; never automatic deletion/unpublishing |
| /admin/owners | Owners — existing Owner accounts, activation and authorized business associations; secure invite/resend/retry |

Suggested navigation groups:
- Review & Approvals: Business Field Approval, Moderation Queue, Owner Registration Requests.
- Directory Management: Businesses, Data Quality.
- Owner Management: Owners.

Do not change route semantics without auditing links, permissions, bookmarks and tests.

## 7. Owner Portal behaviour

- Invited Owner sets password through Supabase; public Add Business never asks for a password.
- Owner sees only businesses linked to their authenticated user.
- Owner sees statuses for their own changes: Pending, Approved, Rejected (with reason) or Changes Requested.
- Owner edits use controlled submissions; they never directly publish.
- A pending replacement does not replace the old approved public value.
- Owner cannot read another owner's records or Admin-only notes.
- Preserve unrelated existing Owner Portal modules and permissions.

## 8. Security, data and compatibility gates

Before each phase inspect current main, components, routes, API calls, migrations, live schema, RLS, Storage policies, Edge Functions and tests.

- Preserve all business, owner, submission, review, media and audit records.
- Additive migrations only; inspect live migration ledger before every migration. Never replay consolidated baseline.
- Never weaken RLS or expose pending/private data publicly.
- Keep pending media private; use rate-limited, narrowly scoped signed upload authorization where required.
- Never expose owner Gmail/name or internal linkage in public responses or metadata.
- Keep legacy submission types (correction, claim, reports, owner content, etc.) working.
- Preserve anti-spam, honeypot, validation, rate limits and permission checks.
- Do not save private partial public-form values to local storage.
- Audit every direct Admin edit and review action.
- Test idempotent invitations, retries, partial decisions, media failure, rollback and duplicates.
- No destructive changes or bulk data rewrites.

## 9. Phased execution checklist

### Phase A — Workflow and code/schema audit
- [x] Read this active plan, permanent rules, roadmap and handoff.
- [x] Map all six Admin routes to current components, API calls, permissions and database records.
- [x] Trace Add Business submission through Edge Function/database and current review UI.
- [x] Trace Owner invitation, idempotency, profile creation and business association.
- [x] Inspect field review tables/status model, media bucket and Storage RLS; reconcile with live schema.
- [x] Record compatibility risks and test baseline before editing.

### Phase B — One-card queue and popup UI
- [ ] Convert Business Field Approval list to one request card per registration.
- [ ] Build one popup/drawer with grouped collapsible field sections.
- [ ] Add per-field checkbox, section Select All and global Select All/Clear All.
- [ ] Add private Owner details panel and invitation checkbox.
- [ ] Add public preview, unsaved-change warning and one Save Approval action.
- [ ] Add queue counts/statuses without exposing private data.

### Phase C — Atomic approval and invitation orchestration
- [ ] Implement server-side save of field decisions and audit history.
- [ ] Enforce checked = approve; unchecked = remain pending; reject/unpublish only by explicit action.
- [ ] Enforce minimum-safe-listing before business appears publicly.
- [ ] Make invitation idempotent, retryable and linked to exactly the reviewed business.
- [ ] Keep field approval durable if invite delivery fails; surface retry state.
- [ ] Verify account/association cannot be created from client-supplied identity.

### Phase D — Private media lifecycle
- [ ] Confirm private pending bucket, signed upload authorization, rate limiting and MIME/size/path constraints.
- [ ] Keep approved media visible until replacement approval and promotion succeed.
- [ ] Promote only checked and verified media; retain failed promotion for safe retry.
- [ ] Test anonymous read denial before approval and public access only after promotion.

### Phase E — Existing Admin workflow clarity and audit
- [ ] Add navigation groups and purpose descriptions for the six pages.
- [ ] Confirm Moderation Queue does not duplicate new Add Business requests.
- [ ] Confirm Businesses direct edits have before/after audit records.
- [ ] Confirm Data Quality suggestions never auto-delete or unpublish.
- [ ] Confirm standalone Owner Registration Requests remain separate.
- [ ] Confirm Owners page exposes only authorized account/association controls.

### Phase F — End-to-end QA and release
- [ ] Test new Add Business request with fields/media.
- [ ] Test partial approval: checked fields public, unchecked fields pending.
- [ ] Test explicit rejection and later unpublish separately.
- [ ] Test invite unchecked, success, failure and retry.
- [ ] Test Owner password setup and business isolation.
- [ ] Test Owner edit -> moderation -> approval while old public value remains visible.
- [ ] Test Admin direct edit and audit trail.
- [ ] Test all six Admin routes, permissions, mobile layout and legacy submission types.
- [ ] Run typecheck, tests, build, CI, production deployment and authenticated browser checks.
- [ ] Update roadmap, handoff and this plan with exact evidence.

## 10. Current status and next action

**Plan status:** Owner-approved. Phase A audit completed against GitHub main and the live Supabase schema on 26 November 2026; see [ADD_BUSINESS_APPROVAL_PHASE_A_AUDIT.md](ADD_BUSINESS_APPROVAL_PHASE_A_AUDIT.md). No application code, schema or production records were changed during the audit. The earlier illustrative popup prototype remains non-production and is not counted as implementation.

**Next action:** implement Phase B (one-card queue and popup UI) in a complete, backward-compatible release. Before shipping, coordinate the UI with the required atomic field-save/invitation orchestration and preserve the existing moderation, owner, media and legacy submission paths.
