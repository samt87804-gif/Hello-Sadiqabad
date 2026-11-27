# Business Registration & Admin Approval — ACTIVE Implementation Plan

> **ACTIVE PLAN — FOLLOW THIS DOCUMENT.** Owner approved the redesigned workflow on 26 November 2026.
> This document supersedes the earlier Business Registration / Owner Approval workflow design for future implementation decisions. The previous plan is retained for history only: [archive/ADD_BUSINESS_OWNER_APPROVAL_PLAN.md](archive/ADD_BUSINESS_OWNER_APPROVAL_PLAN.md). **Do not implement or continue the superseded workflow described there.** Preserve compatible functionality already shipped; do not roll back production code because a design is archived.

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
- [x] Convert Business Field Approval list to one request card per registration.
- [~] Build one popup/drawer with grouped field sections; collapsible section polish is in the current feature PR.
- [x] Add per-field checkbox, section Select All and global Select All/Clear All.
- [x] Add private Owner details panel and invitation checkbox.
- [x] Add public preview, unsaved-change warning and one Save Approval action.
- [x] Add queue counts/statuses without exposing private data.

### Phase C — Atomic approval and invitation orchestration
- [x] Implement server-side bulk save of field decisions with per-field reviewer/time/status audit history.
- [x] Enforce checked = approve; unchecked = remain pending; reject/unpublish only by explicit action.
- [x] Enforce the five-field minimum-safe-listing gate before business publication.
- [x] Add a JWT-protected, idempotent, retryable linked Owner invitation Edge Function with compare-and-swap processing and exact business association.
- [x] Keep field approval durable if invite delivery fails; persist failure state and expose a separate retry action.
- [x] Resolve the Owner account server-side from the private request email; never accept a client-supplied Auth user ID.

### Phase D — Private media lifecycle
- [x] Confirm the existing private pending bucket, signed upload authorization, rate limiting and MIME/size/path checks; retain the existing upload controls.
- [x] Keep approved media visible until replacement approval and promotion succeed.
- [x] Promote only explicitly approved and verified media; defer promotion until the business is public and plan entitlements allow it.
- [ ] Test anonymous read denial before approval and public access only after promotion (manual Storage acceptance still open).

### Phase E — Existing Admin workflow clarity and audit
- [x] Add navigation groups and purpose descriptions for the six pages; merged to main and production deployed.
- [x] Confirm Moderation Queue excludes new Add Business requests from legacy one-click approval and points Admins to Business Field Approval.
- [x] Add before/after audit migration and viewer support; migration applied to production on 26 November 2026 and rollback verification passed.
- [x] Confirm Data Quality is an issue monitor only; explicit Admin action is required for corrections.
- [x] Filter Owner Registration Requests to standalone rows only; linked Add Business invitations are managed in Business Field Approval.
- [x] Remove manual Owner creation and temporary-password setting; existing-account management and secure password-reset link remain.

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

**Verified production checkpoint — 26 November 2026:** Phases A–E code work is merged to `main` in merge commit `fd16c05c7d054f3e98dff1e73dd9ebaa3bf80154`. GitHub Actions run `45724137772` passed both `build` and `edge-functions` jobs. Cloudflare Pages production deployment `eac33069-409b-480a-878f-c3262e9963c5` succeeded for that exact main commit; canonical alias is `https://hellosadiqabad.com`.

**Audit migration:** `20261126075257_business_admin_field_change_audit` is applied and recorded in the live Supabase migration ledger. A transaction using the existing Super Admin identity changed a business name, verified `source=admin_direct_edit` and exact old/new values in `audit_logs.details.changes`, then rolled back. Follow-up read confirmed the original business name remains unchanged and no test audit row remains. The migration excludes private Owner identity fields and usage counters and skips detailed business diffs during field-review RPC operations.

**Current live data snapshot:** 4 active `new_business` submissions; 36 `pending_review` field rows; 100 `approved_published` field rows; 2 `pending_review` media assets. The `hs-pending-business-media` bucket remains private and its read policies are limited to authenticated Admin permission checks. No invitation email, Auth account, production submission, media object or existing business data was created/deleted/changed by these verification tests.

**Remaining Phase D/F acceptance gates:** authenticated Admin popup walkthrough; anonymous Storage read denial and successful public media access only after approved promotion; invitation unchecked/success/failure/retry plus Owner self-service password setup using an owner-approved test account; Owner Portal cross-owner isolation; Owner edit → Moderation Queue → approval while the prior public value remains visible; and six Admin pages/permissions/mobile/legacy submission regression. These require an authenticated browser session and/or an owner-authorized test account. Do not use real Owner accounts or send invitations without explicit owner authorization.

**Next action:** complete the remaining controlled acceptance tests without changing live customer data. Keep all future repository changes directly on `main`; no feature branches or Pull Requests unless the owner explicitly changes this rule.


**Additional Storage RLS check — 26 November 2026:** In a rolled-back transaction, the database session was switched to the `anon` role and queried `storage.objects` for `hs-pending-business-media`; result was 0 visible objects. This verifies the database RLS path for anonymous role access. It does not replace an HTTP/browser signed/public URL test or the post-approval promotion/public-read acceptance, which remain open.

## 11. Public Add Business opening-hours shortcuts — 27 November 2026

Owner-approved enhancement to the existing public Add Business form; it does not change the registration/approval workflow or database schema.

- [x] Add one shared opening-time and closing-time pair with an **Apply to All** action for all seven days.
- [x] Keep each day's opening/closing inputs independently editable after applying the shared time.
- [x] Add a per-day **Off** option. Off clears and disables that day's time inputs and serializes the day as an empty array in the existing `opening_hours` JSON shape.
- [x] Preserve optional hours: untouched days remain omitted, while explicitly Off days are retained as closed. If no day is configured, the field remains omitted.
- [x] Validate complete time pairs and require closing time to be later than opening time; Off days are excluded from time validation.
- [x] Add pure-function regression tests and mobile/desktop public-form browser smoke assertions.
- [ ] Owner manual acceptance of Apply to All, per-day edits, Off/On behavior and form submission/review compatibility.
- No database migration, RLS, permission, existing submission, business record or media change is required.


### Release evidence — public Add Business opening-hours controls (27 November 2026)

- Application commit: `3095edb45d94394c187f9f009a8caeb8a895da80`.
- GitHub Actions CI run `45998652407` passed TypeScript typecheck, automated tests, production build, dependency high/critical audit gate and Supabase Edge Function typecheck.
- Cloudflare Pages production deployment `5cd6ad7d-70ca-4f8f-a2ed-db9ed2872c66` succeeded for the same application commit; canonical alias `https://hellosadiqabad.com` is attached.
- Public mobile/desktop browser smoke workflow `45998652504` is still running; its result is not claimed yet.
- Owner manual acceptance remains pending. No database migration, RLS/grant change or existing production data mutation was made.


## Owner invitation reliability follow-up — 27 November 2026

- Production Edge Function logs show `send-business-owner-invitation` returned HTTP 400 during Owner profile provisioning. The profile upsert included `full_name` and `phone` on conflict, which unnecessarily invoked the self-edit protection trigger for an existing profile.
- The fix preserves existing profile name/phone, inserts the Owner profile only when missing, and updates only role/activation flags if an existing non-Owner profile needs conversion. Staff/Super Admin and inactive Owner accounts remain blocked.
- Invitation remains idempotent, retryable, and separate from durable business field approval. Do not delete or mutate existing Auth/Owner accounts during tests.
- Fresh invite success, password setup, business linkage and retry acceptance remain Owner manual checks.


### Release evidence — Owner invitation provisioning follow-up (27 November 2026)

- Main commit `eaf7379319d21c8fefadba85a7f9e6ef001b6bea`; CI run `46001682834` passed and Pages deployment `ff61c63d-5b7d-4863-a19b-05d286953667` succeeded.
- Live migration `20261127124555` and `send-business-owner-invitation` Edge Function version 2 are deployed.
- Provisioning now inserts a profile only if missing; existing profile name/phone are not overwritten during retry. Staff/Admin and inactive Owner protections remain.
- No real invitation was sent as part of automated verification. [ ] Owner must verify a real approved request and invitation.
