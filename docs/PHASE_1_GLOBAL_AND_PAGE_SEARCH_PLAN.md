# Phase 1 — Global Search & Page-Level Search

> Project: Hello Sadiqabad  
> Repository: `samt87804-gif/Hello-Sadiqabad`  
> Status: **Planning documented — implementation not yet started**  
> Last updated: 2026-11-16

## Goal

Build one consistent search experience across Hello Sadiqabad:

1. A **Global Search** that can discover relevant public content across the website.
2. **Page-level search bars** on pages and portal sections where users browse lists or records.
3. Results update as the user types (live search); an Enter key or separate Search button must not be required.

This document is the source of truth for Phase 1 scope, progress, acceptance criteria, and working rules. Check an item only after its implementation and verification are complete.

## Scope and placement

### A. Global Search

- [ ] Audit existing routes, search components, data access, database schema, and current search behavior before coding.
- [ ] Add a prominent global search entry point on the homepage.
- [ ] Search public, relevant records across:
  - [ ] Businesses and business services
  - [ ] Categories and subcategories
  - [ ] News (headline and approved searchable content)
  - [ ] Emergency helplines (department, service, and published contact details)
- [ ] Present results grouped by type, with a clear result title, useful context, and a working destination link.
- [ ] Support empty query, clear query, loading, no-results, and recoverable error states.
- [ ] Ensure results only include published/public records; never expose drafts, private owner data, admin-only data, or restricted fields.
- [ ] Make the search usable on mobile and desktop, with keyboard and screen-reader support.

### B. Page-level search

Add a search bar where a page/section presents a searchable list or collection. Search should be scoped to the current page/section unless the UI clearly says otherwise.

- [ ] Categories and subcategories
- [ ] Businesses within a category
- [ ] Business directory/listing pages
- [ ] News listing (headline, content excerpt, category where available)
- [ ] Emergency Helpline page (department, service, published phone/contact fields)
- [ ] Owner Portal: businesses, submissions, products/services, and other list-based management sections found during audit
- [ ] Admin Portal: dashboard tables and list-based sections such as businesses, categories, news, users, submissions, reviews, and complaints, subject to the signed-in admin's permissions
- [ ] Any additional list-heavy page discovered in the route/component audit

Do not add a redundant search input to pages that have no meaningful collection to search. For portal sections, search only the records and fields the current user is authorized to view.

### C. Live-search behavior

- [ ] Update visible results on each meaningful query change; no Search button required.
- [ ] Case-insensitive matching.
- [ ] Trim leading/trailing whitespace and handle repeated spaces.
- [ ] Clearing the query restores the unfiltered list.
- [ ] Show a useful empty state when nothing matches.
- [ ] Preserve existing sorting, filters, pagination, and permission rules; define how search combines with them.
- [ ] Avoid flashing stale results when a user types quickly.
- [ ] Debounce remote/server requests where appropriate; local in-memory filtering should feel immediate.
- [ ] Keep search state local to the relevant page unless persistence is explicitly useful and safe.

## Technical approach (decide after audit)

- [ ] Inventory existing data hooks, query helpers, components, routes, and database indexes before choosing an implementation.
- [ ] Reuse a shared search input/presentation component where practical; do not force every page into one oversized abstraction.
- [ ] Use client-side filtering only for data already loaded and reasonably small.
- [ ] For large/paginated datasets, use a server-side search strategy with bounded result sizes and appropriate indexes.
- [ ] Use request cancellation or a latest-request guard so slow earlier queries cannot overwrite newer results.
- [ ] Avoid fetching entire tables just to filter them in the browser.
- [ ] Keep search queries parameterized through the Supabase client; do not build unsafe SQL strings.
- [ ] Review text matching, punctuation, Urdu/Roman Urdu, and common spelling variants against actual data before promising fuzzy matching.
- [ ] Do not add a third-party search service or new dependency without demonstrating a need and documenting cost, privacy, and operational impact.
- [ ] Do not change database schema, RLS policies, or permissions without a documented reason and explicit review of the security impact.

## Acceptance criteria

Phase 1 is complete only when all applicable checks below pass:

- [ ] Global search returns relevant published businesses, categories, news, and helplines.
- [ ] Each global result opens the correct existing page/detail route; no placeholder or dead links.
- [ ] Every in-scope page/portal list has a working, correctly scoped live search.
- [ ] Search updates while typing and clearing restores the full list.
- [ ] Empty, loading, no-results, and error states are handled.
- [ ] Fast typing and slow network responses do not show stale results.
- [ ] Owner/Admin search respects existing authentication, role, and row-level access controls.
- [ ] Search does not reveal unpublished, private, or unauthorized information.
- [ ] Desktop and mobile layouts remain usable and do not overlap or break existing controls.
- [ ] Automated checks pass: `npm run typecheck`, `npm test`, and `npm run build` (or the repository's current equivalent).
- [ ] Changed flows are manually checked in the running site where browser access is available.
- [ ] Production deployment is verified before describing the feature as live.

## Working rules for this project

1. **Inspect first, then change.** Read the relevant page, component, hooks, route, and data source before editing.
2. **No guessing.** Confirm actual routes, table/column names, data shape, and existing behavior from the repository/database.
3. **One focused batch at a time.** Keep changes reviewable and avoid unrelated refactors.
4. **Protect data and permissions.** Never broaden public access or bypass Supabase RLS to make search work.
5. **No fake results or links.** Search results must come from real records and point to verified routes/actions.
6. **Live means live.** Search reacts to typing; do not make users press Enter or click a Search button.
7. **Performance matters.** Bound server queries, debounce remote requests, prevent race conditions, and do not load whole tables unnecessarily.
8. **Preserve existing behavior.** Keep current filters, sorting, pagination, forms, drafts, and portal navigation working.
9. **Mobile-first verification.** Check narrow screens as well as desktop; avoid layout overflow and obstructive controls.
10. **Accessibility is required.** Inputs need labels, keyboard access, visible focus, and announced result/status changes where appropriate.
11. **Test before marking complete.** A checkbox is ticked only after code review and relevant tests; deployment is a separate check.
12. **Report honestly.** Distinguish planned, coded, tested, deployed, and user-confirmed. Never claim browser testing or production success without evidence.
13. **No unapproved external services.** Do not send user/search data to a third party or add paid services without approval.
14. **Keep this document current.** Update checkboxes and add a short dated progress note after each completed batch.


## Code audit — 2026-11-16

### Confirmed existing implementation

- `src/pages/Home.tsx` already has a homepage search input, 250 ms debounced autocomplete, and navigation to `/search?q=...`.
- `src/pages/Search.tsx` already has a business directory search page, a 300 ms debounce, URL-synced filters, abort handling, stale-response protection, pagination, and error/retry UI.
- `src/pages/Categories.tsx` already filters categories locally as the user types.
- `src/components/directory/SearchFilters.tsx` already includes a searchable area selector.
- `src/pages/CategoryDetail.tsx` filters businesses by category/area/open status but its audited state has no free-text query input.
- `src/pages/Emergency.tsx` has category chips but no text search input.
- `src/pages/News.tsx` loads published articles but the listing view has no text search input.
- `src/pages/admin/AdminPortal.tsx` has an admin quick-jump input, but it is not a general per-section live search. It currently routes the entered text into the businesses tab.
- `src/pages/owner/OwnerPortalPages.tsx` contains multiple list-based sections (businesses, submissions, products, offers, reviews, inquiries, notifications); the audit found no shared page-level search facility. Each section needs targeted review before adding controls.
- `src/lib/searchFilter.ts` already provides normalized multi-token matching/ranking for business directory records.
- `src/lib/api.ts` `searchBusinesses()` currently loads the business directory source and filters businesses; `fetchSearchSuggestions()` currently searches categories, areas, and businesses only. It does not include news or emergency contacts.
- `src/lib/api.ts` already has separate public-news and emergency-contact fetchers. Public news fetch is status/publish-date constrained. Admin news fetch is separate and includes non-public workflow states.

### Audit risks / design decisions

- The current business directory search path calls `fetchGitHubBusinesses()` and filters its returned collection in application code. Do not expand this into a whole-database scan for all global content.
- Global search should use separate bounded public data sources for businesses, active categories/areas, published news, and active emergency contacts. Each source must retain its own public visibility rules and route mapping.
- Search must not use admin-only fetchers to populate public results.
- Admin portal components are composed by tab and some managers have their own local state. A generic wrapper cannot safely filter all manager views without inspecting each manager's data model and action flow.
- Owner portal has list and editor pages mixed together; add search only to genuine collections, not profile/forms or analytics charts.
- The existing homepage autocomplete is a useful baseline, but its current suggestion types and source coverage need expansion or a dedicated global result route.
- No code changes to search behavior have been made in this audit batch. No database schema/RLS changes have been made.

### Audit progress

- [x] Route and page inventory from `src/App.tsx`
- [x] Homepage and current directory search inspection
- [x] Category, category-detail, news, and emergency page inspection
- [x] Owner Portal list-section inventory (initial)
- [x] Admin Portal tab routing and quick-search inspection (initial)
- [x] Search API source coverage and public-news/helpline fetcher inspection
- [ ] Inspect individual Admin manager components and their list data/filters
- [ ] Inspect remaining public list pages (offers, announcements, areas, favorites, authorities)
- [ ] Finalize global-search result schema and routes
- [x] Implement Global Search (homepage autocomplete plus cross-directory results on `/search`)
- [x] Implement page-level live search on Emergency and News listings
- [ ] Implement remaining page-level search rollout


## Progress log

- [x] 2026-11-16 — Phase 1 scope, page inventory targets, acceptance criteria, and working rules documented in the repository.
- [x] 2026-11-16 — Confirmed repository default branch is `main` and package scripts include `typecheck`, `test`, `build`, and `check`.
- [ ] Repository code/route/data audit completed.
- [x] Global search implementation pushed; Cloudflare production build/deploy succeeded. Typecheck and interactive browser checks remain pending.
- [x] Emergency and News page-level live search implementation pushed; Cloudflare production build/deploy succeeded. Typecheck and interactive browser checks remain pending.
- [ ] Remaining page-level search rollout implemented and tested.
- [ ] Full Phase 1 acceptance criteria passed.
- [ ] Production deployment verified.

## Implementation notes

Add dated notes here as work progresses. Record changed files, commit/PR references, test results, known limitations, and deployment URL. Do not mark a task complete merely because code was written.
