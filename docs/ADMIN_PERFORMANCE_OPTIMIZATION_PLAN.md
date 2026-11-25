# Admin Business & Data Quality Performance Optimization Plan

**Owner decision:** 25 November 2026. Desktop is affected more than mobile. This is a diagnosis-and-optimization plan; no performance change is claimed implemented.

## Scope
- Admin Business page and its tabs, lists, moderation panels and detail views.
- Admin Data Quality page, reports, checks, tables, filters and exports.
- Shared Admin shell/state/query infrastructure only where profiling proves it is a cause.

## Audit checklist
1. Measure cold route load, warm route load, time to first usable interaction, click-to-response latency and memory on representative desktop.
2. Inspect route imports and Admin shell for eager imports of heavy sections; use route-level lazy loading and tab/panel-level lazy loading where safe.
3. Inspect network waterfall and Supabase calls: repeated requests, duplicate subscriptions, over-fetching, N+1 queries, unbounded result sets, sequential independent reads and stale request races.
4. Inspect table/list rendering, expensive JSON/payload previews, images, charts, modal trees and React re-render profiles.
5. Inspect search, sort, filters, pagination and export behavior; keep export complete while limiting the initial visible dataset.
6. Inspect query cache/invalidation and state retention when switching tabs; avoid refetching unchanged data unnecessarily without showing stale data as current.
7. Ensure loading/error/empty/retry states do not freeze unrelated controls.
8. Preserve Admin permissions, moderation actions, audit events, filters, exports and data integrity.

## Candidate optimizations (only after evidence)
- Lazy import heavy routes and tab content.
- Server-side pagination and filtering for large tables; bounded page size and stable ordering.
- Select only needed columns and defer detail-only fields until a record is opened.
- Debounce text search; cancel or ignore stale requests.
- Parallelize independent requests when dependencies allow.
- Memoize expensive derived views only when profiling identifies repeated work.
- Virtualize very long lists only if it preserves keyboard/screen-reader behavior and row actions.
- Lazy-load previews and non-critical media.
- Keep data-quality calculations server-side or incremental only if correctness and auditability can be preserved.

## Safety
- Do not delete records, reduce data retention or hide errors to make the page look faster.
- Do not weaken RLS or permissions.
- Do not silently change filters, sort order, export completeness or moderation semantics.
- Avoid broad refactors and dependency changes without a demonstrated need.

## Acceptance evidence
- Before/after desktop measurements for both routes, with dataset size and environment recorded.
- Mobile smoke test to ensure no regression.
- Tests for loading, empty, error/retry, pagination, search, filters, detail panel, approve/reject/edit and export.
- Confirm only authorized Admin users can access records/actions.
- TypeScript, relevant tests, production build, CI and deployment evidence recorded separately.


## Phase 0 audit findings

The repository/live-system findings and exact database baseline are recorded in [Final Product Expansion Phase 0 Audit](FINAL_PRODUCT_EXPANSION_PHASE0_AUDIT.md). Confirmed code-level causes include all-tab data fetching on every reload, eager imports of large Admin manager modules, an unbounded business-card list and repeated full-array scans for Data Quality category counts. The joined business query returned 697 rows and executed in 5.347 ms in the audit database context; this is not a browser or authenticated UI timing. Capture real desktop and mobile before/after interaction traces before acceptance.
