# Hello Sadiqabad — Phased Completion Roadmap

## Working mode
- The currently connected GitHub repository, Supabase project, and Cloudflare Pages project are development/testing resources only. Do not treat them as the final production environment.
- Code changes are committed directly to `main`, as explicitly requested. Do not create pull requests or feature branches unless the user changes this instruction.
- Main-branch commits can trigger the connected Cloudflare Pages deployment. The owner has explicitly authorized direct-main code changes and additive fixes to the connected testing Supabase project. Do not treat testing resources as production; avoid destructive data changes, baseline replay, new infrastructure, Auth dashboard changes, or Worker/R2 changes unless specifically needed and approved.
- Never commit secrets, service-role keys, real credentials, or test personal data.

## Completion standard
A feature is complete only when all applicable checks pass:
1. The user journey works from entry point to success and failure states.
2. Role and ownership boundaries are enforced by the backend/RLS, not only by hidden UI.
3. Inputs are validated on both client and server where applicable.
4. Loading, empty, retry, permission-denied, and error states are handled.
5. Relevant unit/integration/end-to-end tests exist and pass.
6. Type-check, lint, tests, and production build pass in CI.
7. Mobile layout, keyboard use, screen-reader labels, and contrast are reviewed.
8. Documentation, environment-variable lists, and database migrations match the implementation.

A green build alone is not proof that every user-facing feature works.

## Phases

### Phase 1 — Repository and engineering foundation (in progress)
- Normalize package metadata and project documentation.
- Inventory routes, components, data services, migrations, Edge Functions, and tests.
- Review TypeScript strictness, dependency health, error boundaries, logging, and environment validation.
- Add reliable test utilities and quality gates without weakening existing checks.
- Remove dead/duplicate code only after proving it is unused.
- Audit every public/admin/owner route and all seven Supabase Edge Functions.
- Owner-update RLS gap is fixed in the connected testing project: staff row scoping, protected-column enforcement, owner field allow-list, and database-side private approval enforcement are implemented.
- Rollback-only database regression checks pass for all six staff types and owner/staff mutation boundaries; make these repeatable in CI and add browser E2E coverage.
- Acceptance: clean install, lint/type-check, test suite, production build, Deno function checks, and documented baseline.

### Phase 2 — Public directory experience
- Home, search, filters, categories, areas, business details, offers, announcements, map, emergency contacts, favorites, add-business, legal/static pages.
- Public data reads are now wired to Supabase for published businesses, categories, areas, plans, active offers, approved reviews, emergency contacts, announcements, ads, and published pages; crawl-only Google Places records remain supplemental static data.
- Category, Area, Map, Favorites, Business Profile, Add Business, and Offers now have improved fetch failure, cancellation, and retry behavior. Full journey/device testing remains open.
- Verify real data loading, pagination/large-directory behavior, no-result states, malformed data, links, phone/WhatsApp/directions actions, and mobile navigation.
- Verify SEO metadata, canonical URLs, sitemap/robots, structured data where appropriate, and image fallbacks.
- Acceptance: every public route and action has a tested happy path and failure/empty state.

### Phase 3 — Authentication and authorization
- Login, logout, session restoration, password reset/change, inactive accounts, pending users, role changes, staff permissions, and account provisioning.
- Ensure unapproved users cannot reach owner tools and missing/failed permission data fails closed.
- Owner Portal is currently owner-role-only. A future staff/Super Admin preview must be explicit and read-only.
- Use a secure invitation or temporary-credential process; never use preset/shared passwords.
- Acceptance: role/permission matrix tests plus backend/RLS denial tests.

### Phase 4 — Admin Portal
- Overview, businesses/moderation, submissions/claims, categories, areas, plans, staff/users, leads, ads, offers, announcements, static pages, settings, imports/exports, audit logs, and reporting.
- Check every action for authorization, confirmation on destructive operations, validation, audit trail, and safe failure handling.
- Acceptance: admin/staff permission matrix and workflow tests.

### Phase 5 — Owner Portal
- Dashboard, listing editor, offers, reviews/replies, inquiries, analytics, plan information, profile, and notifications.
- Verify strict ownership isolation for every query and mutation, including multiple listings and unassigned accounts.
- Acceptance: owner A cannot read or mutate owner B data, including through direct API calls.

### Phase 6 — Supabase backend integrity
- Reconcile repository migrations with the actual fresh-project baseline strategy.
- Database-level owner-update column restrictions and private approval enforcement are implemented and regression-tested; see `docs/PHASE1_SECURITY_REVIEW.md`. Migration-ledger reconciliation and repeatable test automation remain open.
- Verify table/column/type parity with generated TypeScript types and all frontend queries.
- Review RLS policies, grants, SECURITY DEFINER functions, triggers, indexes, Edge Function auth/CORS/rate limits, and error contracts.
- Add repeatable local/test database setup and regression coverage.
- Acceptance: clean database can be built from repository instructions and automated security/data-integrity tests pass.

### Phase 7 — Business operations and additional capabilities
- Admin-configurable free/monthly/quarterly/yearly plans and feature limits.
- Owner application and approval; listing request, moderation, plan assignment, payment verification, publication, renewal, expiry, suspension, and history.
- Media upload/storage workflow and secure AI features, if enabled in the approved requirements.
- Do not guess payment methods, fee amounts, grandfathering policy, or other unresolved business rules.
- Acceptance: complete lifecycle tests using test accounts and test data.

### Phase 8 — Final quality assurance
- Cross-browser/device testing, accessibility, performance, security, SEO, resilience, backup/restore, and disaster recovery.
- Verify all environment variables and deployment steps from a clean checkout.
- Produce a final feature matrix: passed, blocked, deferred, and evidence.
- Acceptance: no open critical/high defects; all release gates pass; clean-room deployment succeeds.

## Current known constraints and deferred decisions
- The existing database migration ledger differs from the repository's consolidated baseline. Never replay the baseline on the current connected database or run an unreviewed schema push.
- Existing published business records must not be assigned to owners without verified ownership evidence.
- Payment collection method and the grandfathering treatment of existing listings are not yet specified.
- Current Supabase/Cloudflare resources are for testing. Final credentials, domain, project IDs, and deployment secrets will be created separately during the clean-room launch stage.
- The PWA currently provides an offline fallback page; do not describe the whole directory as offline-capable until data caching and offline actions are implemented and tested.
