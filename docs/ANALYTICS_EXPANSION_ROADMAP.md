# Hello Sadiqabad — Advanced Analytics Expansion Roadmap

**Status:** Owner-requested expansion plan; approved to begin implementation on 19 November 2026  
**Repository:** https://github.com/samt87804-gif/Hello-Sadiqabad  
**Branch:** `main` only; direct commits  
**Production:** https://hellosadiqabad.com  
**Related source of truth:** [Advanced Analytics Implementation Plan](ADVANCED_ANALYTICS_IMPLEMENTATION_PLAN.md)

## 1. Objective

Evolve the existing privacy-minimized Admin Analytics tab into a decision-support dashboard for the Hello Sadiqabad directory. Preserve the existing collector, analytics tables/RPCs, permission model, legacy business/search/ad analytics, and current production data. Expand incrementally; do not rebuild the system or claim metrics that the collected data cannot support.

This is an additive roadmap. The existing implementation plan remains authoritative for the security contract, schema, ingestion and first-release acceptance gates. This document prioritizes the next expansion.

## 2. Proposed feature catalogue

### P0 — Reliability, correctness and trust (must precede richer reporting)
- Controlled browser verification of page views, SPA navigation, engagement, privacy opt-out, DNT/GPC, offline behavior and private-route exclusion.
- Direct collector abuse tests: malformed/oversized payloads, unknown events/fields, invalid paths/IDs, sensitive values, bot filtering, duplicate/replay behavior and rate limits.
- Authorization matrix: anonymous, unrelated authenticated user, staff without permission, inactive staff, authorized analytics staff and Super Admin.
- Tracking-health panel: last successful event time, ingestion availability/error state and clear stale-data warning; never show unavailable metrics as zero.
- Metric glossary, timezone label (Asia/Karachi), data freshness and explicit definitions for sessions, unique visitors, engagement and live visitors.

### P1 — Reporting controls and comparison
- Date presets: Today, Yesterday, 7, 30 and 90 days; custom start/end date.
- Previous equivalent period comparison with absolute and percentage change; handle zero baseline safely.
- Daily/hourly trend where supported by retained event timestamps and query cost.
- Visible filters: page type/path, channel/source, device and content entity.
- Export exactly the selected date/filter scope; retain CSV formula-injection protection and bounded row counts.
- Responsive, accessible loading/empty/error states.

### P2 — Content and journey intelligence
- Page-level views, unique visitors, sessions and engagement.
- Landing/entry pages and exit pages where session ordering supports reliable derivation.
- Business, News, Authority, Category and Area performance with links to existing Admin-managed records.
- CTA performance: call, WhatsApp, directions, website, share; conversion rates only where numerator and denominator are measured consistently.
- Search funnel: search -> result/profile view -> CTA, plus zero-result trend and filter usage.
- Navigation paths / next-page transitions only as aggregate counts, with minimum-volume safeguards; no visitor-level journey replay or identity exposure.

### P3 — Audience and acquisition
- Device, browser-family and OS-family reports using coarse classifications already collected.
- Country-level reporting only when provider metadata is reliable and volume is sufficient; no browser geolocation.
- City-level geography only after a separate privacy/reliability review and only in coarse aggregate form.
- Referrer host and channel reports; distinguish direct, search, social, referral, campaign and unknown.
- UTM source/medium/campaign/content performance with strict normalization and sensitive parameter scrubbing.
- Known bot/social-preview filtering quality report, without exposing raw request headers.

### P4 — Alerts and scheduled insight
- Traffic drop/spike detection against comparable historical windows, with minimum sample thresholds.
- Collector failure / stale data alert.
- Increase in zero-result searches alert.
- Weekly admin summary (email/in-app only after a separate delivery/permission review).
- Explainable trend highlights; no fabricated causal explanations or AI-generated claims unsupported by data.

### P5 — Advanced exports and operational polish
- Filtered CSV reports for overview, pages, sources, devices, search and content.
- Excel/PDF only if a maintained, secure implementation is justified; CSV remains the baseline.
- Saved report presets only if access control and persistence design are approved.
- Dashboard usability, accessibility, mobile layout and performance tuning based on measured query behavior.

## 3. Data and privacy boundaries

- No raw IP, names, email, phone, precise location, browser geolocation, fingerprinting or visitor-level activity display.
- No anonymous reads of analytics tables, report RPCs or live visitor state.
- Continue enforcing Super Admin / active staff `analytics.view` on the database/server path.
- Do not capture raw search strings or full referrer URLs/query strings. Keep normalized/minimized attributes only.
- Do not infer missing referrer/campaign/country data. Use an explicit Unknown bucket.
- Do not count bots as human visitors; document filtering behavior and limitations.
- Do not double-count legacy ad impressions/clicks or legacy business counters.
- Do not backfill historical data unless a verified source exists; label partial coverage.
- Preserve the 90-day raw-event retention policy and existing aggregate reporting behavior unless a separately reviewed change is needed.
- Avoid Realtime visitor lists; the current aggregate heartbeat RPC remains the default until a proven requirement justifies a more complex design.

## 4. Delivery sequence and acceptance gates

| Phase | Scope | Exit criteria |
|---|---|---|
| 0 | Re-audit current implementation, existing tests and live access controls | Code/schema/permission inventory refreshed; no unverified assumptions |
| 1 | P0 reliability/security verification | Browser and request tests pass; permission matrix passes; regressions documented |
| 2 | P1 custom dates, comparisons, filters, glossary and freshness | API/RPC tests, timezone/boundary tests, permission checks, UI tests and scoped export verified |
| 3 | P2 content, CTA and search funnels | Event coverage proven; denominators documented; aggregate-only reports correct |
| 4 | P3 audience/acquisition | Data quality and minimum-volume/privacy thresholds pass; no unsupported inference |
| 5 | P4 alerting and scheduled summaries | Thresholds, deduplication, delivery authorization and failure behavior tested |
| 6 | P5 exports, saved views and UX polish | Export scope/security, responsive/accessibility and performance acceptance pass |

A phase is not complete merely because code compiles. Mark implementation, test-passed, CI-passed, deployed, endpoint-verified and owner/device-verified separately.

## 5. Immediate execution order

1. Inspect current tests, report RPC contract, deployed collector and Admin permission source.
2. Add/complete collector contract and abuse tests before extending event types or schema.
3. Perform safe read-only verification of the authorization matrix; add tests for missing cases.
4. Add browser-level tests for privacy and route lifecycle where the current test harness supports them. Record any manual-only browser checks as pending rather than claiming completion.
5. Then implement Phase 2 custom range/comparison/filter support with additive, bounded report queries.

## 6. Progress log

### 19 November 2026 — plan created
- Existing deployed foundation: privacy-minimized first-party events, 90-day raw retention, permission-gated reporting, aggregate Live Visitors count, basic 7/30/90-day dashboard and CSV export.
- Production aggregate checkpoint recorded in the original implementation plan; counts are events/sessions, not a claim about unique people.
- Known outstanding work before expansion: browser walkthrough, direct collector abuse tests, full staff authorization matrix, custom range/comparison/filters/content drilldowns and scoped exports.
- This roadmap does not mark those outstanding tasks complete.
