# Admin Business & Data Quality Performance Optimization Plan

**Owner decision:** 25 November 2026. Desktop is affected more than mobile. Initial Phase 1 optimizations are implemented and deployed; full acceptance remains open pending authenticated browser measurements and interaction QA.

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


## Phase 1 implementation checkpoint — 25 November 2026

**Implemented on `main`:**
- Admin tab managers are now lazy-loaded; inactive large manager modules are not imported into the initial Admin route bundle.
- Admin data loading is scoped to the active tab instead of issuing the former 19-request all-tabs batch on every tab load/reload. Dashboard counts remain available for navigation badges.
- Global Admin quick search lazily loads the business, lead and owner datasets after a short input delay when those datasets have not already been loaded.
- Business list filtering is memoized and both desktop table and mobile cards render 50 records per page. Existing filtered selection/bulk actions continue to operate over the full filtered set.
- Data Quality issue derivation/filtering is memoized, category counts are computed in one pass, issue-chip counts are computed in one pass, and matching records render 50 per page. CSV export still exports the complete filtered result, not just the visible page.

**Verification evidence:**
- Commit: `6009012c143e90dbbcce1dfc2fddaa79c3fa2872`.
- GitHub CI: [run 45585636119](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45585636119) — both build and Edge Functions jobs passed. Build job passed `npm ci`, high/critical npm audit gate, TypeScript typecheck, automated tests and production build.
- Cloudflare Pages production deployment: `759c75f9-d12d-45ec-a94d-196953c9ba19`, status success, commit hash matches, canonical production alias `https://hellosadiqabad.com`.
- No database migration, RLS policy, Storage policy, production record or Auth setting was changed.

**Still required before Phase 1 acceptance:**
- Authenticated desktop cold/warm route-load and click-to-response measurements before/after.
- Real browser/mobile checks for search, filters, page navigation, select-all/bulk actions, edit/detail modal, moderation actions and complete CSV export.
- Permission/empty/error/retry regression checks in an authenticated session.
- Do not claim a numerical UI speed improvement from the database-only 5.347 ms query baseline. The browser performance trace was not available in this session.


## Phase 1 follow-up — narrow business list payload (25 November 2026)

A second implementation slice is now on `main`:

- `fetchAdminBusinesses()` uses an explicit allowlist for fields needed by BusinessManager, Data Quality and linked inquiry/review/moderation summaries instead of `select('*')`.
- The list projection no longer fetches the full plan relation. Category and area relations are limited to the fields displayed in the list and quality audit.
- Full business row details are fetched by ID only when an Admin opens the edit modal. Existing edit form fields and update behavior continue to use the complete row.
- Existing list filters, 50-row client pagination, full-filter bulk selection and Data Quality complete filtered CSV export remain intact.

**Verification:** latest commit `4ed8f50042928896064f3925f8e8f203e0951de7`; [GitHub CI run 45587036171](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45587036171) passed both jobs, including TypeScript, automated tests, dependency gate, production build and Deno Edge Function typecheck. Cloudflare Pages deployment `51d981f8-e50a-400d-af08-ae5e14481940` succeeded for this exact commit with canonical alias `https://hellosadiqabad.com`.

**Acceptance remains open:** this is source-level optimization plus CI/deployment evidence, not authenticated browser profiling. Desktop cold/warm load and click latency, real Admin permission/action checks and mobile smoke tests still need a signed-in browser session. No performance milliseconds are claimed.
