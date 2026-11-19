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
- [x] Inspect route/page lifecycle and existing event sources, including SPA navigation and offline mode; gaps to instrument are documented below.
- [x] Compare repository migrations with live migration history; mismatch and safe forward-migration path documented below. Do not replay consolidated baseline or assume migration parity.
- [x] Review current Supabase Realtime authorization docs: private channels require Realtime RLS policies on `realtime.messages` and private channel mode; do not assume topic secrecy is authorization. Current changelog review was performed in the prior audit.
- [x] Write the schema/ingestion/live-presence design and threat model in this plan before database changes. The design below is the implementation contract; each production change still requires its own review and tests.

**Gate:** Phase 0 read-only audit and design is complete. The repository/live migration mismatch is understood and documented; no historical migrations will be replayed. The detailed contract below is the basis for Phase 1. This does not authorize an unreviewed production migration or infrastructure change.

### Phase 1 — Secure ingestion and additive data model
- [x] Define event contract, allowlisted event names, public-route policy, schema version and payload limits.
- [ ] Harden ingestion against malformed payloads, spoofed URLs/referrers, oversized values, bot noise, replay/duplicate events and abuse.
- [ ] Validate Origin as a supplementary browser control only; do not treat it as caller authentication.
- [ ] Ensure no secret/service-role material is shipped to browser.
- [x] Create additive migration(s) with RLS on every exposed table, least-privilege grants, appropriate indexes and no anonymous report reads; migrations and live checks are recorded below.
- [x] Add authorized server-side reporting access using the existing Super Admin / active staff `analytics.view` rules.
- [x] Add safe 90-day raw-event retention using a separate weekly Supabase Cron job after verifying `pg_cron` capability.
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


#### SPA lifecycle, offline mode and Cloudflare infrastructure verification (19 November 2026)
- React Router is mounted in src/App.tsx. Public routes include home, search, categories/category detail, area detail, business detail, owner public profiles, offers, map, favorites, offline-data, emergency/government/local authorities, announcements/news and static pages. Private routes include login/auth flows, owner portal and /admin/:tab. A site-wide page tracker must subscribe to useLocation in the mounted router, deduplicate initial mount and pathname changes, and explicitly exclude private routes, auth callbacks, query/hash-only changes unless a safe campaign parameter is extracted.
- Existing offline safeguards explicitly skip tracking when navigator.onLine is false; the public offline snapshot is read-only and no tracking queue is created. New analytics must keep that exact no-queue behavior and avoid recording offline route transitions as visits. Do not let tracker writes delay route rendering.
- Existing search tracking is issued from fetchBusinesses(...), with logSearch enabled by default and explicit result count plus filters. Business events and ad impressions are separate calls to track-event. Preserve these legacy writes; do not make the new page tracker double-count business or ad events.
- Cloudflare Pages production project was read-only inspected: project hello-sadiqabad, main branch, production deployment config currently contains only AI binding and the four existing VITE variables; no analytics bindings are configured. Account currently has one standalone Worker script (ai-chat-service) and zero Durable Object namespaces.
- Cloudflare documentation explicitly says a Durable Object Worker must be created/deployed separately and then bound to Pages; a Durable Object cannot be created/deployed within a Pages project. The Pages project currently has no such binding. Therefore the previously proposed DO live-presence architecture is technically viable but requires a separately deployed Worker, a namespace, and a Pages binding followed by redeployment. No infrastructure was modified.
- Cloudflare Pages currently has Functions enabled, but no rate-limiting binding or dedicated analytics endpoint is configured. Zone-level WAF rate-limiting is a separate perimeter control and does not authenticate analytics payloads; do not rely on it as the sole abuse defense. Cloudflare's current docs also note rate-limit counters are data-centre-local, so don't describe WAF limits as a globally exact quota.
- Phase 0 remains open until the current repository migration directory is reconciled against the live migration ledger, exact current route/page tracking semantics are finalized, and a reviewed deployment sequence for the separate Durable Object Worker + Pages binding is documented. No schema, application code, deployed function or Cloudflare configuration changes have been made.


#### Repository migration parity comparison (19 November 2026)

- Read the complete current `supabase/migrations/` directory from GitHub `main` and independently fetched the live Supabase migration ledger.
- Repository contains 47 SQL migration files; live ledger contains 67 applied versions (latest live version: `20261118091057`).
- A normalized migration-name comparison found 44 name matches, 23 live ledger entries without a same-named repository migration, and 3 repository files without a same-named live ledger entry. Several semantically similar entries also have different timestamps/names; this is not proof that their SQL is identical.
- The repository includes a consolidated `20261113220000_hello_sadiqabad_baseline.sql`, while production has 16 individually applied initial migrations from 2026-11-13. The baseline must not be replayed against production.
- Result: migration history is not in exact parity. The safe path for this feature is a new, uniquely timestamped, additive migration strictly later than the latest live version (`20261118091057`), after reviewing its SQL and live object names. Do not repair historical migration records or replay older migrations as part of this feature.
- This completes the comparison task, not the historical reconciliation. The mismatch is documented and must remain a deployment constraint.

#### Latest Pages deployment verification (19 November 2026)

- Re-read the Cloudflare Pages project after the previous queued status. Production deployment `bc218d44-5724-4f50-b6c1-83bcbe047aa6`, commit `36fd8af2757d77001192e16b48b1611fa9aab256`, reached deploy stage `success` at `2026-11-19T12:19:48Z`.
- Current production configuration still has only the existing AI binding and existing Vite environment variables; no analytics Worker/DO binding has been introduced.
- This verifies deployment of documentation changes only; it does not mean Advanced Analytics is deployed.

#### Phase 0 status clarification

- SPA route inventory and offline/no-queue behavior have been inspected, as have existing search, business-event and ad-impression call paths. The broader event-source inventory (all public CTA and content-share actions) still needs a focused pass, so the route/event-source checklist remains open.
- Migration comparison is complete as an audit, but repository/live history is not identical. No historical ledger or migration file was rewritten.
- Phase 0 remains open until the complete event contract and threat model, final DB/report schema, ingestion perimeter and separately deployed Cloudflare Durable Object + Pages binding sequence are specified and reviewed.
- No analytics schema, application tracker, Edge Function, Worker, Durable Object namespace or Cloudflare binding has been changed.


### Final implementation contract — reviewed 19 November 2026

#### 1. Public route and event contract

- Mount the tracker inside the existing `BrowserRouter` and subscribe to React Router `useLocation()`; record the initial public route once and subsequent pathname changes only. Query/hash-only changes do not create page views.
- Strictly allow known public route patterns: `/`, `/search`, `/categories`, `/category/:slug`, `/area/:slug`, `/business/:slug`, `/offers`, `/map`, `/emergency`, `/government-helplines`, `/local-authorities`, `/authority-profiles`, `/authority-profiles/:slug`, `/announcements`, `/news`, `/news/:slug`, and approved public static pages.
- Exclude `/admin/*`, `/owner/*`, all authentication/reset routes, `/add-business` (form may contain contact data), `/favorites` (locally personalized), `/offline-data`, unknown routes, and all internal/API/function routes.
- Event names are versioned and allowlisted: `page_view`, `engagement`, `cta_click`, `content_share`, and `search_summary`. Existing business/ad counters continue through their existing path; new site-wide events must not increment them again.
- Existing call sites identified: search tracking in `searchBusinesses`; business profile view and call/WhatsApp/directions/share actions through `trackBusinessEvent`; ad impression/click paths through `trackAdImpression` and `trackBusinessEvent`. News and Authority sharing uses `ContentShareActions` and currently has no analytics instrumentation; these share actions will be added as separate `content_share` events. Helpline/authority/owner-profile contact links are not business events and will not be included in business counters.
- Search analytics will capture result count and safe category/area/filter metadata. Raw free-text search will not be copied into the new analytics event table. Existing `search_logs` remains unchanged until a separately reviewed redaction/retention change is approved.
- The tracker does not run while offline and creates no offline event queue. Failed telemetry must never block route rendering or user actions.

#### 2. First-party collection and abuse controls

- Browser invokes the dedicated Supabase Edge Function directly through the existing Supabase client. This preserves the real visitor's Cloudflare `cf-connecting-ip` signal for per-IP rate limiting; a Pages proxy would hide that address behind the proxy's egress identity unless a separate authenticated gateway were provisioned.
- New Supabase function has JWT verification disabled because it is a public visitor-ingestion endpoint. It uses strict allowlists, a 4 KiB body cap, server-side route classification, HMAC pseudonymization and a database-backed per-IP quota. Origin/CORS is supplementary only, never authentication. Keep the existing `track-event` function and its deployed v7 contract untouched until separately reconciled.
- The collector derives an HMAC-SHA256 rate-limit key from Cloudflare's edge-provided `cf-connecting-ip` using the server-only Supabase service-role key, then calls the existing atomic `check_rate_limit` RPC at 1200 requests/hour per edge IP. Only the HMAC key is stored temporarily in the existing `rate_limits` table, which is already cleaned by the existing maintenance job; raw IP is never stored or written to analytics tables. Client session IDs are never used as rate-limit keys.
- Never trust client IDs for abuse quotas. Random browser visitor/session IDs are only for aggregate grouping; the server HMACs them before persistence. Client timestamps are ignored; server timestamps are authoritative. Event UUIDs provide deduplication.
- Normalize pathnames; strip query strings, fragments and arbitrary URL parameters. Keep only allowlisted, length-limited UTM values and referrer host. Never store full referrer URLs.
- Device/browser/OS are coarse families only. Country may be derived from Cloudflare's country code when present; do not request geolocation or store city, coordinates, IP, fingerprinting attributes, email, name or phone.
- Search text is not sent to the new event store. The initial search report uses safe filters, category/area and zero-result/result-count trends; any future readable-term reporting requires a separate redaction review.

#### 3. Additive Supabase data model and access

- Create `public.site_analytics_events` and `public.site_analytics_sessions` only after checking live names again immediately before migration. Event rows contain server timestamp, event UUID, allowlisted event name, schema version, HMAC visitor/session digests, normalized page path/type, optional content entity reference, safe referrer/UTM/channel fields, coarse device/browser/OS/country, result-count/filter summary and capped active seconds. No raw browser IDs or personal data.
- Session rows contain HMAC digests, start/last-seen timestamps, landing/exit path, page-view count, capped active seconds and the same coarse attribution/device dimensions. No visitor-level API or UI list is created.
- Enable RLS on both exposed tables. Revoke `anon` and authenticated direct writes; allow only server-side service-role ingestion. Authenticated SELECT is restricted by RLS to active Super Admin or `private.staff_has_permission('analytics.view')`; anon receives no table access.
- Add a narrow `SECURITY INVOKER` reporting RPC for authenticated users, fixed empty `search_path`, date range capped to 90 days, result limits and an explicit authorization check. Grant EXECUTE only to authenticated. Preserve `admin_analytics(p_days)` and all legacy business/search/ad/owner reporting contracts.
- Initial reporting reads the event/session tables with indexes; add rollups only if measured query performance requires them. Do not fabricate historical page views.
- `pg_cron` 1.6.4 is installed and active. Existing weekly maintenance job currently removes legacy search logs older than 180 days and business events older than 400 days. Add a separate, independently named weekly cleanup job for new raw analytics rows older than 90 days; do not modify the existing maintenance job. Aggregated visitor-free summaries may be retained only after their exact contents are reviewed.

#### 4. Visitor/session privacy and live presence

- Browser visitor token: cryptographically random, first-party, rotating after a documented 30-day expiry; session token: random, session-scoped with a 30-minute inactivity boundary. Neither contains account/user identity. The server stores only keyed HMAC digests.
- Live heartbeat runs every 20 seconds only while the page is visible/online. A single Durable Object stores only opaque HMAC session key, approved page type and expiry; stale presence expires after 75 seconds and is removed by a scheduled alarm. No raw path, title, visitor identity or list is returned.
- Public heartbeat endpoint returns only acknowledgement. Admin endpoint returns aggregate count and counts by approved page type, never per-visitor data. Admin reads require a valid Supabase access token and the same backend `analytics.view` check; hiding the UI is insufficient.
- Initial live UI may refresh only the compact aggregate endpoint every 15 seconds; do not poll the full report or visitor list. A push/WebSocket channel is deferred until authentication and operational behavior are independently proven.
- Show the count as approximate and include last-updated/freshness information. Browser tab close, sleep, offline, reconnect and duplicate-tab behavior must be tested.
- Update the public privacy notice with first-party pseudonymous analytics, purpose, expiry/retention and opt-out behavior before enabling production collection.

#### 5. Cloudflare deployment sequence

- For Live Visitors, deploy a separate Worker containing the Durable Object class and namespace migration; verify its script, namespace and internal-only routes. The event collector itself does not require a Pages proxy or Cloudflare secret.
- Bind that namespace to the Pages project through Pages Settings → Bindings → Durable Object (or the project's supported Wrangler configuration), then redeploy Pages. Cloudflare confirms a DO cannot be created/deployed inside a Pages project itself.
- Add server-only Pages secrets and the required binding only after the Worker exists. Never expose internal tokens as `VITE_*` variables.
- Verify production Pages deployment and same-origin collector routes before enabling frontend tracking. Rollback means disable the frontend tracker/collector route and stop the new cron job; do not delete event data or the namespace during normal rollback.

#### 6. Required test matrix before rollout

- Anon cannot SELECT events/sessions or read live summary; authenticated users without `analytics.view`, inactive staff and unauthorized roles are denied; Super Admin and active explicitly authorized analytics staff succeed.
- Payload tests: oversized JSON, invalid JSON, unknown event, invalid UUID, unsupported route, private route, query/fragment injection, forged referrer, long UTM, replayed event ID, client timestamp, sensitive search input and malformed visitor/session tokens.
- Privacy tests: no raw IP, raw visitor/session token, email, name, phone, precise location, full referrer URL/query or free-text search is stored.
- Frontend tests: initial page view once, SPA pathname change once, query/hash ignored, private/form/offline routes excluded, offline queue absent, tracker network failure non-blocking, engagement foreground-only and capped.
- Live tests: heartbeat cadence, 75-second stale expiry, alarm cleanup, duplicate tabs, reconnect, browser sleep, admin-only aggregate access and no public visitor-level response.
- Regression tests: existing `track-event` business/search/ad behavior, `admin_analytics`, owner analytics and all current counters remain unchanged.


### Phase 1 — database and collector progress (19 November 2026)

- Applied additive migration `20261119140712_site_analytics_foundation`: created `site_analytics_events`, `site_analytics_sessions`, indexes, RLS policies and the `admin_site_analytics_report` SECURITY INVOKER RPC.
- Applied `20261119140832_site_analytics_privilege_hardening`: tightened `service_role` table privileges to SELECT/INSERT/UPDATE only and removed its report-RPC EXECUTE permission. Anonymous table SELECT and report-RPC EXECUTE are denied; authenticated SELECT is subject to the `analytics.view` RLS policy.
- Applied `20261119140930_site_analytics_retention_90d`: added independent daily `pg_cron` job `site-analytics-retention-90d` at 22:00 UTC. Existing maintenance job was not modified.
- Applied `20261119141643_site_analytics_ingestion_primitives`: added atomic deduplicated `record_site_analytics_event(jsonb)` and a private, inactive gateway-token registry reserved for a future internal edge-to-edge integration. The token registry has no active token and is not used by the public collector.
- Deployed new Supabase Edge Function `track-site-analytics` version 1 with `verify_jwt=false`. It validates a 4 KiB JSON contract, allowlisted public paths/events, filters/UTM, bot user agents, coarse device/browser/OS and country; rejects raw search text and unsupported fields; HMACs visitor/session IDs and the edge IP rate-limit key; calls the atomic database RPC. Existing `track-event` remains untouched.
- The collector uses the edge-provided `cf-connecting-ip` only to derive an HMAC rate-limit key with the server-only service-role key, then uses the existing atomic `check_rate_limit` RPC (240/hour). Raw IP is not stored. CORS allowlisting is supplementary only.
- Transactional database tests verified event insert + duplicate suppression (one event row and one session page-view increment), then rolled the test transaction back. Rate-limit test verified first request allowed and second request denied at a limit of one, then rolled back.
- Authorization checks: anonymous SELECT on both new tables is false; anonymous EXECUTE on the report RPC is false; authenticated SELECT is granted but RLS applies; service_role can insert but cannot delete; service_role cannot execute the report RPC. A simulated unrelated authenticated user was denied by the report RPC; a simulated active Super Admin received an empty, correctly structured report. No test analytics rows were retained.
- Supabase Security Advisor after these changes still reports only the pre-existing leaked-password-protection warning. Performance Advisor shows 30 unused-index INFO notices (7 are the new analytics indexes, expected before ingestion/report usage) and 2 pre-existing multiple-permissive-policy warnings on unrelated tables. No analytics-specific security warning was reported.
- Added `src/lib/siteAnalytics.ts` with opt-out/Do Not Track/Global Privacy Control checks, 30-day pseudonymous visitor ID, 30-minute session ID, offline skip, and non-blocking event invocation. Added global React Router page-view and visible-time engagement tracking in `src/App.tsx`; added search summary and business CTA/share events in `src/lib/api.ts`. Existing legacy `track-event` calls remain intact.
- Added `fetchSiteAnalyticsReport` and `AdvancedAnalyticsPanel` to the existing Admin Analytics tab. It displays actual database-backed page views, pseudonymous unique visitors, sessions, engagement, daily page views, top pages, channels, devices, search summary, and CSV export. Existing directory/business/ad analytics remain below it.
- Cloudflare Pages deployment for commit `9c04c3c5780ea5a84dc91338044c159e695c0ceb` completed successfully (build and deploy stages both success). This verifies production build only; GitHub typecheck/test workflow status has not yet been verified.
- Added a visible bilingual analytics preference control on the public `/privacy` page; it persists an opt-out locally and respects Do Not Track / Global Privacy Control. Live published privacy policy text already states random session identifiers and no raw visitor IP storage. Cloudflare Pages production flag `VITE_SITE_ANALYTICS_ENABLED=true` is now configured and the production deployment for the privacy-controls commit succeeded. Tracking is enabled; users with opt-out/DNT/GPC remain untracked. Request-level collector smoke tests and end-to-end production event verification remain outstanding.
- No Live Visitors Durable Object, Cloudflare binding or live presence count exists yet. No production analytics events have been enabled; no historical metrics are fabricated.


### Live Visitors architecture decision and implementation (19 November 2026)

The earlier Durable Object proposal above is superseded for the current Live Visitors requirement. The new session aggregate table already receives server-validated heartbeat-equivalent engagement events every 30 seconds while a page is visible. A separate Durable Object would add an extra public endpoint, namespace, Worker deployment and cross-service auth path without adding necessary capability for a simple aggregate count.

- Applied additive migration `20261119150122_site_analytics_live_visitor_count`.
- Added `public.admin_live_visitor_count()`: SECURITY INVOKER, empty search_path, authenticated-only EXECUTE, explicit Super Admin / active staff `analytics.view` check, returns only the number of session aggregates whose `last_seen_at` is within the last five minutes.
- The RPC returns no session hashes, visitor hashes, paths or visitor-level rows. Anonymous EXECUTE is false; authenticated EXECUTE is true and RLS/auth checks remain in force. A simulated active Super Admin successfully read the aggregate count.
- Added `fetchAdminLiveVisitorCount()` and a Live Visitors KPI in the Admin panel, refreshed every 30 seconds. A Durable Object/Cloudflare binding is not required for this aggregate-only implementation.
- Revisit DO or sharded ephemeral presence only if measured traffic/load demonstrates that the existing Supabase aggregate query needs a dedicated coordination layer. Do not build a visitor list.


## Verified production status — 19 November 2026 (supersedes earlier pending checkpoints)

- Latest frontend change: CSV export now neutralizes spreadsheet formula starters (=, +, -, @ and leading control/space characters), quotes CSV delimiters/newlines, and uses CRLF row endings. Unused icon import removed.
- Latest code commit: `d7c007660890badfa9e30a13510ec8eedaa00b21`.
- Latest Cloudflare Pages production deployment: `534fa136-8ad7-4af8-8f22-752028b5973a`; commit matches the code commit above; build/deploy stage reports success. Production alias: https://hellosadiqabad.com.
- GitHub Actions CI run `44551040604` completed successfully for the same commit. Both `build` and `edge-functions` jobs passed; TypeScript type-check, automated tests, production build, and Supabase Edge Function type-check all passed.
- Production database confirms analytics ingestion is active: 53 events in the last 24 hours, comprising 20 `page_view`, 19 `search_summary`, and 14 `engagement` events; 3 sessions seen in the last 24 hours and 1 session active within the five-minute live window. These are aggregate counts only; no visitor-level data was inspected or exposed.
- Live visitor aggregate RPC remains permission-guarded and returns only an integer. No Durable Object or public visitor-presence channel is used.
- Privacy control remains available on `/privacy`; production flag `VITE_SITE_ANALYTICS_ENABLED=true` is enabled. Browser opt-out/DNT/GPC logic is implemented. Production event ingestion is verified by aggregate DB counts, but a controlled manual browser/opt-out walkthrough and direct request-level abuse test are still outstanding.
- Current dashboard scope is 7/30/90-day presets, summary KPIs, daily page-view trend, top pages, channels, devices, search/engagement summaries, live count and daily-series CSV export. The broader feature wishlist is not complete: custom date ranges, comparison periods, visible page/source/device/entity filters, page-level content drilldowns, richer browser/OS/geography reporting, and full-table/filter-scoped exports remain open.
- Security verification already completed: anon cannot read analytics tables or execute admin report/live-count RPCs; report access is gated by Super Admin / active staff `analytics.view`; service_role cannot delete analytics rows or execute report RPC. Existing `track-event` v7 and legacy analytics remain unchanged.
- Correct collector rate limit is 1200 requests/hour per HMAC-derived edge-IP key; raw IP is not persisted. Event payload cap is 4 KiB. Raw analytics retention is independent and daily at 22:00 UTC for 90-day cleanup.
- Advisor caveats remain: one pre-existing leaked-password-protection warning; unused-index notices include the new analytics indexes before sustained traffic; unrelated pre-existing permissive-policy notices remain.
- Do not interpret the production aggregate counts as historical backfill or unique human users. Metrics are approximate pseudonymous browser/session counts and start only after activation/consent rules.

### Remaining acceptance work
- [ ] Controlled browser walkthrough: public page navigation, SPA route change, foreground engagement heartbeat, privacy opt-out, DNT/GPC and excluded private routes.
- [ ] Direct request-level collector tests: malformed/oversized payload, disallowed event/path, sensitive field, bot, duplicate/replay and rate-limit behavior.
- [ ] Add the remaining report filters/custom range/comparison and broaden export coverage.
- [ ] Verify staff-without-permission and inactive-staff denial in addition to the already-tested anonymous and unrelated-authenticated cases.
- [ ] Review real Admin dashboard rendering with an authorized owner/staff account and confirm existing legacy analytics screens still work.
