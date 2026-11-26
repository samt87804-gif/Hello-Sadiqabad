# Owner Portal — Audit & Improvement Implementation Plan

**Status:** Owner approved the full roadmap on 27 November 2026. Phase 0 is in progress. Work is performed directly on `main` under `docs/PROJECT_WORKING_RULES.md`. Do not mark Owner/device acceptance complete until the Owner confirms it.

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
- [ ] Commit the application/RPC migration and verify GitHub CI + Cloudflare Pages deployment.
- [ ] Apply the follow-up additive privilege migration: revoke table-wide SELECT from `authenticated`, grant SELECT only on non-private columns, and verify `admin_note` is no longer readable through PostgREST.
- [ ] Verify non-Admin RPC denial, Admin note visibility, Owner submission history and plan-payment workflow.
- [ ] Owner manual acceptance.

**Important migration note:** The repository contains a later-timestamped financial-profile migration file while the live ledger already records that feature under earlier versions. That file must not be replayed. The new notes migration was applied as its own live version; keep the repository file aligned to the exact live version above.

## Phase 1 — Data correctness

- [ ] Count both `new` and `in_review` Owner business requests in the pending-review summary.
- [ ] Do not set `handled_by` when an inquiry is merely marked `read`; preserve the handler unless the inquiry is actually handled.
- [ ] Add regression tests for both cases and verify the existing Admin/Owner flows.

## Phase 2 — Owner experience

- [ ] Add per-notification read/unread actions and use stored `link_path` for safe in-app navigation.
- [ ] Show available Urdu notification title/body when Urdu is selected, with a sensible fallback.
- [ ] Add clear loading, success and error feedback for notification actions.
- [ ] Correct unread badge count on My Payments.
- [ ] Improve Owner navigation on narrow screens without removing any destinations.
- [ ] Add honest empty states for analytics with no search-attribution data; do not invent search metrics.

## Phase 3 — Reliability and scale

- [ ] Prevent stale business-scoped data from appearing after switching selected businesses.
- [ ] Sequence/cancel overlapping Owner data loads and clear business-specific state before loading another business.
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
