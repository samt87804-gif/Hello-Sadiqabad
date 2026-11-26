# Owner Portal — Audit & Improvement Implementation Plan

**Status:** Owner approved the full roadmap on 27 November 2026. Phase 0 technical implementation is deployed; Owner manual acceptance is pending. Phase 1 data-correctness changes are implemented, CI-verified and deployed. Owner manual acceptance for both phases remains pending. Work is performed directly on `main` under `docs/PROJECT_WORKING_RULES.md`. Do not mark Owner/device acceptance complete until the Owner confirms it.

## Working agreement

- Keep this checklist current as work proceeds; tick only tasks implemented and verified.
- Explain every completed change in practical Roman Urdu: what changed, why it helps, how it works, and exact Owner actions.
- Preserve all existing Owner/Admin workflows, records, approvals, RLS and image-compression safeguards.
- Existing Supabase project only. Reconcile live migration history before any schema change; never replay the baseline.
- Do not call a feature complete based only on a green build. Track CI, deployment, endpoint checks and Owner manual acceptance separately.

## Phase 0 — Security: private Admin notes

**Goal:** Owners must never be able to read internal Admin notes attached to their own submissions. Admin review must continue working.

- [x] Re-read canonical working rules, roadmap, handoff, Owner Portal source and live RLS/grants.
- [x] Confirmed `authenticated` has table-wide SELECT on `public.submissions`, including `admin_note`; Owner RLS permits reading the Owner's own eligible submissions.
- [x] Applied additive Admin-only note-reader RPC to the existing Supabase project. Live migration version: `20261126202451` (`owner_submission_private_notes_rpc`). It checks Super Admin or `moderation.review`, uses a fixed empty search path, and is not executable by anon.
- [x] Updated Owner submission query to stop requesting `admin_note`.
- [x] Updated Business Field Review Admin queue to load prior private notes through the permission-checked RPC; generated database types updated.
- [x] Commit the application/RPC migration and verify GitHub CI + Cloudflare Pages deployment (commit `2d3f306839e17500abaa5f2b6bd7216bcdfc2330`; CI run `45890993686` succeeded; Cloudflare Pages deployment `7bf8e537-e786-4688-a283-8d0c16dbd355` build/deploy succeeded).
- [x] Apply additive privilege migrations `20261126202642` and `20261126202723`: removed table-wide SELECT, granted only required non-private columns, and removed `assigned_to` SELECT.
- [x] Verify live grants: authenticated table-wide SELECT is false; `admin_note` and `assigned_to` SELECT are false; required safe columns remain selectable.
- [x] Rollback/auth simulation: non-Admin private-note RPC call is denied; simulated Super Admin can retrieve the note result through the protected RPC without exposing note text in the test output.
- [ ] Manually verify the Admin Business Field Review screen, Owner request history and existing plan-payment screen in a signed-in browser.
- [ ] Owner manual acceptance; do not mark Phase 0 accepted until the Owner confirms the practical tests.

**Important migration note:** The repository contains a later-timestamped financial-profile migration file while the live ledger already records that feature under earlier versions. That file must not be replayed. The notes RPC and access restrictions are recorded as live migrations `20261126202451` (`owner_submission_private_notes_rpc`), `20261126202642` (`restrict_owner_submission_private_note_select`) and `20261126202723` (`restrict_submission_assignment_column_select`). Keep each repository migration file aligned to the exact live version; do not replay the unmatched financial migration.

## Phase 1 — Data correctness

- [x] Count both `new` and `in_review` Owner business requests in the pending-review summary; added a regression test.
- [x] Set `handled_by` only when an inquiry is marked `handled`; marking it `read` no longer assigns the current user as handler. Demo and live API paths match; added regression assertions.
- [x] Added regression tests for pending-review counting and inquiry handler tracking.
- [x] CI and production deployment verified: commit `b63a8a4a42a6dffd90f435e7ae1bb8e0d002015b`, CI run `45891440166`, Pages deployment `54bea682-bd88-4285-8daf-c9b60d59ae8b`.
- [ ] Owner manual test of pending-review count and inquiry read/handled workflow.

## Phase 2 — Owner experience

- [x] Add per-notification read/unread actions and use stored `link_path` only for safe internal Owner Portal navigation; added regression tests for the path guard and demo read/unread behavior.
- [x] Show Urdu notification title/body when Urdu is selected, falling back to English when Urdu text is empty.
- [x] Add per-item and mark-all loading states plus success/error feedback for notification actions.
- [x] Load the current unread notification count on My Payments instead of hard-coding zero.
- [x] Replace the long horizontal mobile navigation strip with a compact collapsible menu; all existing destinations and sign-out remain available.
- [x] Add an honest empty state when no real search-attribution terms are available; no fabricated metrics.

## Phase 3 — Reliability and scale

- [x] Prevent stale business-scoped data from appearing after switching selected businesses: clear stats/offers/products immediately and discard results from superseded requests.
- [x] Sequence overlapping Owner data loads; invalidate in-flight requests on dependency changes/unmount, ignore stale responses/errors, and clear business-scoped state before/at selection changes.
- [ ] Reduce unnecessary cross-page fetching where safe.
- [ ] Add server-side pagination/filtering for reviews, inquiries and request history without hiding older records.

## Phase 4 — Business listing management

- [ ] Replace the hard-coded offer expiry default with a date derived from the current day and validate it.
- [ ] Design Owner gallery management with mandatory WebP compression, smaller-than-original enforcement, plan limits, private upload and Admin approval.
- [ ] Implement gallery changes only after the full upload/review/promotion lifecycle is verified; preserve existing media.

## Phase 5 — Optional Owner profile improvements

- [ ] Evaluate Owner profile photo and notification preference controls.
- [ ] Improve payment/profile request loading and error states without allowing duplicate submissions.
- [ ] Confirm whether any optional profile additions need a separate approval before expanding scope.

## Phase 6 — Final verification and release

- [ ] Run `npm run check` (typecheck, automated tests and production build).
- [ ] Verify GitHub Actions CI and matching Cloudflare Pages deployment for each release commit.
- [ ] Verify relevant live routes and database permissions; do not claim authenticated browser coverage unless performed.
- [ ] Give the Owner concise, numbered manual acceptance steps.
- [ ] Record the Owner's reported result; leave acceptance unchecked until explicitly confirmed.
- [ ] Update this plan, `PROJECT_ROADMAP.md` and `docs/NEW_CHAT_HANDOFF.md` with exact commit, migration, CI, deployment and remaining steps.


## Phase 0 release evidence

- Application commit: `2d3f306839e17500abaa5f2b6bd7216bcdfc2330`.
- GitHub Actions CI: run `45890993686`, completed successfully. TypeScript typecheck, automated tests, production build and Edge Function typecheck passed.
- Cloudflare Pages: deployment `7bf8e537-e786-4688-a283-8d0c16dbd355`, production build and deploy stages succeeded for the same commit; canonical domain alias is present.
- Supabase live migrations: `20261126202451`, `20261126202642`, `20261126202723`.
- Post-migration permission check: authenticated has no table-wide SELECT on `public.submissions`; SELECT on `admin_note` and `assigned_to` is false; required safe columns remain selectable.
- Supabase security advisor still reports the generic authenticated SECURITY DEFINER warning for this new RPC. This is intentional: it is the only Admin read path for private notes, checks Super Admin / `moderation.review` inside the function, and non-Admin denial was tested. Other existing security/performance advisor findings remain separately tracked; no broad security relaxation was made.
- Remaining acceptance: signed-in Owner/Admin browser testing by the Owner. No authenticated browser session was used by the assistant.


## Phase 1 release evidence

- Commit: `b63a8a4a42a6dffd90f435e7ae1bb8e0d002015b`.
- GitHub Actions CI run `45891440166` passed: TypeScript, automated tests (including the new pending-count and inquiry-handler regression tests), production build and Edge Function typecheck.
- Cloudflare Pages deployment `54bea682-bd88-4285-8daf-c9b60d59ae8b` succeeded for the same commit.
- Owner manual acceptance remains pending.


### Phase 2 database hardening

- Live migration `20261126203248` (`restrict_notification_updates_to_read_flag`) revokes table-wide notification UPDATE from `authenticated` and grants UPDATE only on `is_read`.
- Existing RLS remains in force: users can update only their own notification rows. The existing mark-all-read RPC changes only `is_read` and remains compatible.


## Phase 2 release evidence

- App commit: `1cc43f63c1499308fbe417dd08509fb0e8ccfcb5`.
- GitHub Actions CI run `45892045086` passed: TypeScript, automated tests (including safe-link and per-notification read/unread tests), production build and Edge Function typecheck.
- Cloudflare Pages deployment `d788df3a-58a0-489f-9f47-e535c83601d9` succeeded for the same commit.
- Supabase migration `20261126203248` restricts authenticated notification UPDATE to `is_read`; RLS still limits rows to `auth.uid()`. Verified table-wide UPDATE false, `is_read` UPDATE true, `title_en` and `link_path` UPDATE false. Existing mark-all-read RPC passed a rollback/authenticated-role check.
- Owner manual acceptance remains pending.


### Phase 3A — reliability release pending

- Updated `useOwnerPortalData` with a request sequence guard and cleanup invalidation. Older requests cannot overwrite newer selected-business data or show stale errors.
- Business-specific analytics, offers and products clear immediately when the selected listing changes or a reload starts; they remain empty if the new listing's data fails to load.
- Remaining Phase 3 work: reduce unnecessary cross-page fetching and add server-side pagination/filtering for reviews, inquiries and request history.


### Phase 3A release evidence

- Commit: c2902820e052e9df1cefc34568ce153a1f5f2843.
- GitHub Actions CI run 45892395019 passed.
- Cloudflare Pages deployment d85a8d11-4fe5-4908-98c1-534a175091f6 succeeded for the same commit.

### Phase 3B — implementation pending CI

- Owner pages now fetch only the datasets used by that screen; shared business list and unread notifications remain available for navigation.
- Reviews and Inquiries screens fetch 20 records at a time for the selected business and offer a Load more control. Dashboard full engagement data remains unchanged so its counts are not silently under-reported.
- Added demo-mode regression coverage for page boundaries, has-more state and duplicate-free concatenation.
- Request history still shows the most recent 50 records; pagination for that history remains a separate follow-up.


### Phase 3B release evidence

- Commit: 93f414bc5a745f00a3d08453421a15893702cd5e.
- GitHub Actions CI run 45893377773 passed: TypeScript type check, automated tests, production build and Edge Function type check.
- Cloudflare Pages deployment 3d9864f2-ae0c-4238-8b23-64614921e1c4 succeeded for the same commit.
- Owner manual acceptance remains pending.
