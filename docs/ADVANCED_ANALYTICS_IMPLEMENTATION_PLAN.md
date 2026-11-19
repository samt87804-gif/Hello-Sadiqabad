# Hello Sadiqabad — Advanced Admin Analytics Implementation Plan

**Status:** Approved by site owner — 19 November 2026  
**Repository:** https://github.com/samt87804-gif/Hello-Sadiqabad  
**Branch policy:** Direct commits to `main` only  
**Production:** https://hellosadiqabad.com  
**Supabase project:** `efwohfzqitevkuybnyif`

## Purpose

Build a reliable, privacy-conscious, production-ready site analytics system inside the existing Admin Panel. It must complement—not replace—the current business analytics, search logs, ad analytics, business counters, and existing permissions.

This document is the execution checklist and source of truth for this feature. Each checkbox may be marked complete only when the stated implementation and verification evidence exists. Distinguish implemented, test-passed, CI-passed, deployed, endpoint-verified and owner/device-verified states.

## Mandatory project rules

- Follow `docs/PROJECT_WORKING_RULES.md` and the current repository/database as sources of truth.
- Inspect relevant code, callers, routes, tests, schema, migrations, RLS, permissions, Edge Functions and deployment configuration before each change.
- Commit directly to `main`; do not create a branch or PR.
- Keep changes narrow, additive, backward-compatible and reversible. Do not delete, truncate, reseed or mutate existing business/user/operational data.
- Never expose Supabase service-role/secret credentials in browser code, GitHub, logs or chat.
- Preserve existing `analytics.view` access semantics: Super Admin or explicitly authorized active staff only. Enforce access on the server/database path, not only by hiding UI.
- Never trust client-supplied visitor identity, session identifiers, page URLs, referrers, event names or timestamps without validation.
- Do not treat CORS/Origin allowlists as authentication. Public event ingestion must be abuse-resistant and rate-limited.
- Minimize personal data. Do not collect raw IP addresses, emails, names, precise location or fingerprinting attributes for analytics. Do not store sensitive free-text search terms without a reviewed minimization/retention policy.
- Do not publish analytics tables, live presence state, or visitor-level data to anonymous users.
- Existing analytics remain intact. New site-wide metrics must be clearly distinguished from legacy business counters and historical data.
- Do not fabricate historical page views. Backfill only from verified source data and label any estimated/partial history.
- Update this plan, `PROJECT_ROADMAP.md` and `docs/NEW_CHAT_HANDOFF.md` after meaningful progress.
- Run relevant tests, typecheck, production build, CI, Supabase advisors and production verification where available. Never claim checks that were not run.

## Feature scope

### A. Overview and reporting
- [ ] Total page views, unique visitors, sessions, average engagement time, pages/session and returning/new visitor trends.
- [ ] Daily/hourly traffic trend charts and comparison with the previous equivalent period.
- [ ] Date presets: Today, Yesterday, Last 7 days, Last 30 days, Last 90 days, plus custom date range.
- [ ] Clear timezone handling and visible reporting timezone.
- [ ] Metric definitions/tooltips and data freshness indicators.
- [ ] Empty/loading/error states; avoid presenting missing data as zero when ingestion is unavailable.

### B. Live visitors
- [ ] Live online visitor count with clear freshness/heartbeat window and automatic stale-session expiry.
- [ ] Currently viewed public page/route and page title where safe; no private/admin/owner routes.
- [ ] Live updates without frequent full-page polling where a secure Realtime approach is viable.
- [ ] Secure channel/API access; no anonymous access to live visitor lists or presence payloads.
- [ ] Graceful fallback and reconnect behaviour; disclose approximate nature of online count.
- [ ] Never expose IP, email, account identity, raw session token or other personal identifiers.

### C. Page and content analytics
- [ ] Top pages and page-level views/unique visitors/engagement.
- [ ] Public page groups: home, business profiles, categories, areas, News, Authority profiles, search and other public content.
- [ ] Page-level News, Authority and Business performance with links to the relevant Admin-managed records where appropriate.
- [ ] Landing pages, exit pages and navigation paths where measurable without invasive tracking.
- [ ] Exclude Admin Portal, Owner Portal, auth/reset, internal API/function, offline-data download and other non-public/system routes from public traffic reports unless a separately approved operational metric is needed.

### D. Audience and technology
- [ ] Country-level geography only when reliably available and privacy-safe.
- [ ] City-level geography only when sufficiently coarse and reliable; never request browser geolocation for analytics.
- [ ] Device class: mobile/tablet/desktop.
- [ ] Browser and operating-system family/version at coarse level.
- [ ] Bot/crawler filtering and clear rules for known social preview crawlers.

### E. Acquisition and referrals
- [ ] Traffic source/channel grouping: direct, search, social, referral, campaign and other/unknown.
- [ ] Referrer host reporting; avoid storing full referrer query strings or sensitive URL parameters.
- [ ] UTM campaign/source/medium/content reporting with strict length/character limits and parameter scrubbing.
- [ ] Facebook, WhatsApp, Google and other referrers where the browser actually supplies usable attribution; do not infer missing attribution.

### F. Search insights
- [ ] Popular on-site searches and search trends.
- [ ] Search result count and zero-result searches, using normalized/minimized terms.
- [ ] Search filters/category/area breakdowns where available.
- [ ] Protect search logs from accidental capture of phone numbers, emails, addresses or other sensitive input; document redaction and retention.

### G. Engagement and conversion events
- [ ] Business profile views and existing business interaction metrics.
- [ ] Click-to-call, WhatsApp, directions/map, website visits, share actions and other meaningful public CTA events.
- [ ] News and Authority profile views/shares.
- [ ] Ad impressions/clicks and CTR continue to use the existing verified ad analytics source; avoid double counting.
- [ ] Event naming/versioning, deduplication and validation; no arbitrary client event payloads.

### H. Export and usability
- [ ] CSV export for supported report tables with selected date/filter scope.
- [ ] Excel export only if a safe, tested implementation/dependency is justified; otherwise provide CSV that opens in spreadsheet apps.
- [ ] Filters by date, page type, source, device and relevant content entity.
- [ ] Responsive Admin UI, accessible labels, readable charts and useful empty states.
- [ ] Export authorization, row limits and safe CSV formula-injection handling.

## Architecture principles

- Reuse existing project patterns and current Supabase client/API conventions.
- Inspect and harden the current `track-event` Edge Function before deciding whether to extend it or introduce a separate ingestion endpoint. Existing JWT-off configuration, service-role use, CORS and rate-limit behaviour must be explicitly reviewed.
- Use a first-party event collector and server-side validation. Keep service-role credentials server-only.
- Use additive analytics storage and aggregation. Candidate object names are provisional and must be checked against live schema before migration: `site_analytics_events`, `site_analytics_sessions`, daily rollups, and restricted reporting RPCs/views.
- Store only a random, short-lived pseudonymous visitor/session token where essential; rotate/expire it, avoid cross-site identity, and document consent/privacy behaviour appropriate to the site's deployment.
- Set a raw-event retention target of 90 days only after confirming storage/cron capability and safe deletion semantics; retain privacy-safe aggregates longer. Do not enable an unverified cleanup job.
- Prefer daily/hourly aggregates for dashboard queries; add indexes based on measured query patterns.
- Any exposed-schema table must have RLS enabled. Do not grant anonymous SELECT on analytics data. Review Data API exposure/grants explicitly.
- Reporting functions must use the existing authorization model and be safe against privilege escalation. Avoid SECURITY DEFINER unless absolutely necessary and independently reviewed; if required, constrain schema, search_path, execute grants and in-function authorization.
- Live visitor design must be validated against current Supabase Realtime authorization documentation. Presence is not automatically safe merely because its channel name is obscure. If public visitor clients cannot join a private channel without exposing visitor state, use a server-mediated heartbeat/aggregate design instead.
- Avoid raw IP persistence. If rate limiting needs an IP signal, use a provider/platform rate-limit facility or ephemeral server-side signal and do not store it in analytics tables.
- Existing legacy tables/RPCs/counters and owner/business dashboards must remain compatible.

## Execution phases and acceptance gates

### Phase 0 — Read-only audit and detailed design
- [x] Re-read permanent project rules, feature-relevant roadmap/handoff and current Analytics UI.
- [x] Inspect current `track-event` source, callers, config, CORS, rate limiting, service-role operations and deployed function version (repo + deployed v7).
- [x] Confirm live legacy analytics table schemas (`business_events`, `daily_business_stats`, `search_logs`, `rate_limits`) and live migration ledger; reviewed RLS/grants/RPC definitions below.
- [x] Trace application permission source: Admin UI uses `analytics.view`; database helper checks Super Admin or active staff/profile with explicit overrides and role-derived defaults. Verified the existing report RPC and analytics SELECT policies below.
- [ ] Inspect route/page lifecycle and all meaningful event sources, including SPA navigation and offline mode.
- [ ] Compare repository migrations with live migration history; do not replay consolidated baseline or assume migration parity.
- [x] Review current Supabase Realtime authorization docs: private channels require Realtime RLS policies on `realtime.messages` and private channel mode; do not assume topic secrecy is authorization. Current changelog review was performed in the prior audit.
- [ ] Write the final schema/ingestion/live-presence design and threat model in this plan before database changes. (Initial architecture decision recorded below; detailed contract, migration parity and route lifecycle still open.)

**Gate:** No schema or production function change until the live architecture, permissions, migration path and security design are understood. This gate remains open: route lifecycle/event coverage, repository-vs-live migration parity, final Cloudflare binding availability and detailed event/report contracts still require verification.

### Phase 1 — Secure ingestion and additive data model
- [ ] Define event contract, allowlisted event names, public-route policy, schema version and payload limits.
- [ ] Harden ingestion against malformed payloads, spoofed URLs/referrers, oversized values, bot noise, replay/duplicate events and abuse.
- [ ] Validate Origin as a supplementary browser control only; do not treat it as caller authentication.
- [ ] Ensure no secret/service-role material is shipped to browser.
- [ ] Create additive migration(s) only after review; RLS on every exposed table, least-privilege grants, appropriate indexes and no anonymous report reads.
- [ ] Add authorized server-side reporting access using the existing Super Admin / active staff `analytics.view` rules.
- [ ] Add safe retention/aggregation strategy only after verifying available Supabase scheduling/cron capability.
- [ ] Test unauthorized anon/authenticated/staff-without-permission/inactive-staff access and authorized Super Admin/analytics staff access.

**Gate:** Database advisors reviewed; RLS/grants and permission tests pass; existing analytics queries and owner dashboards remain unaffected.

### Phase 2 — Frontend tracking coverage
- [ ] Add first-party page-view/session tracking for public SPA route changes.
- [ ] Add safe CTA event instrumentation for call, WhatsApp, directions, website, shares, News and Authority content.
- [ ] Integrate on-site search analytics without capturing sensitive raw input.
- [ ] Prevent tracking in Admin/Owner/auth/private routes and offline mode; do not queue telemetry offline.
- [ ] Respect browser lifecycle, consent/privacy design, duplicate navigation and ad-block/network failure gracefully.
- [ ] Automated tests for event contract, route exclusions, redaction, deduplication and failure behaviour.

**Gate:** Existing site flows remain functional; event samples verified in database; no private routes or sensitive values recorded.

### Phase 3 — Live visitors
- [ ] Implement secure live online count and currently-viewed public-page summary.
- [ ] Confirm private-channel authorization or use server-mediated heartbeat/aggregate fallback.
- [ ] Expire disconnected/stale visitors; test tab close, sleep, network loss, reconnect and duplicate tabs.
- [ ] Test that anonymous users cannot subscribe to or read visitor presence/report data.
- [ ] Show approximate count and freshness in UI.

**Gate:** Live count and page summary behave correctly under connection churn; no visitor identity or private state leaks.

### Phase 4 — Admin Analytics UI
- [ ] Expand existing Analytics tab rather than creating a parallel Admin area.
- [ ] Build Overview, Live Visitors, Pages, Acquisition, Audience/Devices, Search, Engagement and Exports sections.
- [ ] Add date presets/custom range, filters, comparisons, metric definitions and freshness indicators.
- [ ] Reuse existing design system/chart dependencies; do not add packages without need.
- [ ] Ensure responsive layout, accessible controls and robust loading/empty/error states.
- [ ] Enforce permission checks at UI and backend/reporting layer.

**Gate:** Super Admin and authorized analytics staff can use the reports; other roles are denied server-side.

### Phase 5 — QA, deployment and handoff
- [ ] Add/extend automated tests for analytics logic, security boundaries, RLS and reporting.
- [ ] Run typecheck, test suite, production build and Edge Function checks.
- [ ] Review Supabase security/performance/health advisors and resolve new feature-related findings.
- [ ] Inspect GitHub Actions/CI for the exact final commit; record pre-existing npm audit blockers separately without suppressing or unsafe dependency downgrades.
- [ ] Verify matching Cloudflare Pages deployment and production endpoints.
- [ ] Verify ingestion and Admin report with controlled test events; clean up only test events created for this verification and only by exact IDs.
- [ ] Update `PROJECT_ROADMAP.md`, `docs/NEW_CHAT_HANDOFF.md` and this plan with evidence and remaining device/owner checks.
- [ ] Provide final Roman Urdu report: features implemented, tests, commit/deployment IDs, live verification, known limitations and owner actions.

## Privacy, retention and metric definitions

- **Page view:** one validated public page navigation after deduplication rules.
- **Visitor:** a privacy-preserving, time-limited pseudonymous browser identifier; not a verified person.
- **Session:** a bounded period of activity with a documented inactivity timeout.
- **Live visitor:** a recently active browser heartbeat/Presence entry within the documented freshness window; approximate, not a count of authenticated people.
- **Unique visitors:** distinct pseudonymous visitor IDs within the selected period, subject to cookie/storage resets and privacy controls.
- **Engagement time:** approximate foreground/active page time only; do not count background-tab dwell as active engagement.
- **Traffic source:** derived from available referrer/UTM data; missing/stripped attribution is reported as direct/unknown according to documented rules.
- **Geography:** coarse provider-derived country/city only if available without persisting raw IP; otherwise omit.
- **Retention:** proposed raw-event maximum 90 days, subject to final technical and privacy review. Aggregated data may be retained longer only if it contains no visitor-level identifiers.

### Phase 0 — verified findings (19 November 2026)

- Existing Admin tab is `AnalyticsView` in `src/components/admin/SystemAndTaxonomy.tsx`: it displays directory traffic, top businesses, zero-result searches, business CSV and sitemap download; date presets are 7/30/90 days.
- `AdminPortal.tsx` gates the tab with Super Admin or `analytics.view`. Database helper `private.staff_has_permission('analytics.view')` checks active staff row, active profile, role `staff`, explicit allow/deny overrides and role-derived defaults. Super Admin is separately checked by `private.is_super_admin()`.
- Existing `public.admin_analytics(p_days)` is SQL `STABLE`, SECURITY INVOKER (not SECURITY DEFINER), `search_path=''`, and internally filters on Super Admin / `analytics.view`. It aggregates legacy directory stats, businesses, categories, searches and ad counters. Its EXECUTE ACL currently includes `anon`, but the function returns no report object to unauthorized callers and invoker/RLS boundaries remain in force; this will be revisited when adding new report RPCs.
- Live RLS: `business_events` SELECT requires `private.staff_has_permission('analytics.view')`; `search_logs` SELECT requires Super Admin or `analytics.view`; `daily_business_stats` SELECT permits the business owner or analytics staff. These tables have RLS enabled and no anon SELECT grants. `rate_limits` denies anon/authenticated table access.
- Live migration ledger contains a distinct sequence of timestamped migrations (starting 2026-11-13 and later owner-specific migrations through 2026-11-18). Repository baseline is not the live ledger; any future schema migration must be additive and carefully aligned.
- Deployed `track-event` v7: JWT verification OFF; service-role client is server-side; payload capped at 4 KiB; allowlisted business event names and UUID checks; rate limiting 300/hour keyed by caller-provided `session_id`; CORS Origin allowlist; raw search query up to 120 chars stored in `search_logs`. This is a public ingestion endpoint. Caller-controlled session IDs can be rotated to evade the current per-session limit; CORS is not authentication. Do not extend this path for site-wide analytics until a robust edge-level abuse strategy is designed.
- Supabase Realtime docs confirm private channel authorization is enforced by RLS on `realtime.messages` and private channel mode; the project’s Realtime settings and any live channel policies still need direct verification before using Presence.
- Supabase Security Advisor currently has one pre-existing leaked-password-protection warning (Free-plan limitation already documented elsewhere). Performance Advisor reports 23 unused-index INFO notices and two existing multiple-permissive-policy warnings on unrelated tables. No advisor finding is attributed to this analytics work.

## Progress log

| Date | Phase | Change / evidence | Status |
|---|---|---|---|
| 19 Nov 2026 | Approval | Owner approved advanced Admin Analytics scope including Live Visitors. No analytics code or database changes made at approval. | Approved |
| 19 Nov 2026 | Phase 0 | Read project rules, existing master plan, roadmap and handoff; confirmed current Admin Analytics UI and live legacy analytics schemas/migration ledger. Deployed `track-event` v7 uses service-role server-side, JWT verification OFF, CORS allowlist and rate limiting keyed by client-provided session ID (300/hour); CORS is not authentication and the session key is caller-controlled. Search terms are stored in `search_logs` as raw text up to 120 chars. Current Admin Analytics shows legacy directory traffic, top businesses, zero-result searches and CSV; it does not yet provide site-wide page views, visitor/session reports or live visitors. Realtime private-channel docs reviewed. Detailed legacy RLS/grants/RPC and authorization checks remain open; no analytics code/database changes. | In progress |

## Explicit non-goals unless separately approved

- Cross-device identity resolution, advertising profiles, fingerprinting or user-level tracking.
- Collecting precise GPS/browser geolocation, raw IP, emails, names or phone numbers for analytics.
- Public-facing visitor counters or public access to Admin analytics.
- Replacing existing business analytics, ad reporting, owner dashboards or moderation data.
- Claiming Google Search Console metrics, search-engine rankings or ad-platform conversions unless verified external integrations are added separately.

### Phase 0 — additional verified findings (19 November 2026)

#### Tracking implementation and data flow
- Repository supabase/functions/track-event/index.ts uses a server-side service-role client, 4 KiB JSON body cap, UUID validation for business/ad references, published-business lookup and allowlisted business event names. The deployed v7 source is older/simpler than repository source: deployed v7 parses unbounded JSON, does not apply the repository UUID checks or published business lookup consistently, and also trusts the supplied session ID as the rate-limit key. This repository/deployment drift must be reconciled before any deployment.
- Frontend src/lib/api.ts invokes track-event for search and business events. Search tracking sends a normalized term (or category/area/browse fallback), result count and selected filters; business event tracking passes a session ID from the existing offline storage helper. Existing function callers must remain backward-compatible or be migrated atomically.
- Existing public event ingestion is inherently callable outside the browser. Origin allowlisting only limits browser cross-origin use; it cannot authenticate a caller. A client-supplied session ID is not a trustworthy rate-limit identity.
- Existing check_rate_limit RPC is SECURITY DEFINER with an empty search_path and atomically increments a server-side counter in rate_limits; however, the key is selected by the caller through the Edge Function. Do not persist raw IP or use client-supplied identifiers as an abuse boundary.

#### Live database authorization and schema
- business_events columns: id, business_id, event_type, ad_id, session_id, created_at; authenticated SELECT is granted and RLS requires private.staff_has_permission('analytics.view'). No anon SELECT grant.
- daily_business_stats contains business/date counters for views, calls, WhatsApp, directions and shares; authenticated SELECT is granted and RLS allows the business owner or analytics staff. No anon SELECT grant.
- search_logs stores raw query, JSONB filters, results_count and created_at; authenticated SELECT is granted and RLS requires Super Admin or analytics.view. No anon SELECT grant.
- rate_limits stores key/window/count; RLS denies anon/authenticated access. No anon/authenticated table grants were found.
- private.staff_has_permission('analytics.view') verifies Super Admin or an active staff row joined to an active profile with role staff; explicit permission overrides and all override take precedence, then role-derived listing-manager default applies.
- Existing public.admin_analytics(p_days) is SQL STABLE, SECURITY INVOKER, empty search_path and returns no JSON report unless Super Admin or analytics.view. It currently aggregates legacy directory/business/search/ad metrics; preserve its contract while adding new report endpoints. Its EXECUTE ACL includes anon and authenticated, but the function's in-query authorization returns no report to unauthorized callers. New report functions should use narrower grants and independently enforce authorization.
- Realtime publication supabase_realtime exists but has no published tables. No RLS policies exist on realtime.messages in this project. Therefore no current private Supabase Realtime channel authorization path is configured or proven safe for this feature.

#### Migration and deployment implications
- The live migration ledger currently runs through versions dated 18 November 2026 and is not identical to the repository's consolidated baseline. Future SQL must be a new timestamped additive migration after comparing exact repo migration files with the live ledger. Never replay baseline migrations or use an unreviewed schema push.
- Repository track-event source and deployed v7 differ materially. Any rollout must first reconcile the deployed endpoint with reviewed repository source and preserve the existing legacy event contracts.
- The project already uses Cloudflare Pages Functions for same-origin crawler metadata and sitemap responses. A Cloudflare same-origin collection route is a candidate perimeter for request shaping/rate limiting; Cloudflare Workers Rate Limiting bindings are documented as generally available, and Durable Objects support strongly consistent coordination, storage and real-time WebSockets. This is a design candidate, not yet an approved/deployed binding or proof that the current Pages project has the required bindings.
- Current Supabase Realtime cannot be assumed to support visitor Presence safely: there are no published tables or Realtime RLS policies. Initial preferred design is a Cloudflare Durable Object-backed ephemeral heartbeat/aggregate for live visitor count, with no public visitor-list API; an admin-only authenticated read path will independently verify analytics.view. Confirm Pages/Worker binding support, cost/limits, and Cloudflare deployment configuration before implementation.

#### Threat model — initial
- Spoofed traffic/events: public clients can call endpoints directly, forge URLs/referrers/UTMs/event types and rotate arbitrary IDs. Mitigate with same-origin edge route, Cloudflare rate limits, strict allowlists/normalization, payload caps, bot filtering, server-side route validation, event deduplication and no trust in caller identity. These controls reduce abuse; public analytics events cannot be made cryptographically authentic without a verified visitor credential.
- Rate-limit evasion: do not key quotas by caller-supplied session IDs. Use edge-provider request characteristics for transient rate limiting; do not store IP in analytics. Apply additional global and event-specific quotas to reduce distributed abuse.
- Data exfiltration: never expose raw event/session tables to anon; report APIs independently check active Super Admin / analytics.view; enforce date and row limits; CSV export escapes formula-leading values.
- Privacy leakage: do not store raw IP, full referrer URLs/query strings, sensitive free-text search terms, precise location, user identity or fingerprinting attributes. Store coarse device/browser/channel and privacy-safe normalized search terms only where justified.
- Live presence abuse/leakage: ephemeral opaque random presence IDs, no visitor-level payload to public clients, TTL expiry, route allowlist and server-side admin authorization; do not use an unprotected public Supabase Realtime topic.
- Operational risk: preserve business event writes, ad counters, owner dashboard metrics and existing search reports; deploy backward-compatible changes and verify with controlled test events.
