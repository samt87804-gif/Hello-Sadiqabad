# Gov Landing Page & Mobile Bottom Navigation Plan

**Owner-approved decisions:** 25 November 2026.

## Gov landing
Add a public Gov landing page/route with a responsive card grid consistent with the existing Categories card UI. Four cards, bilingual:
1. Government Jobs — link to the existing Government Jobs directory.
2. Government Schemes — link to the existing Government Schemes directory.
3. Local Authorities — link to the existing local authorities directory.
4. Authority Profiles — link to the existing person/profile directory for authorities.

Each card should have clear English/Urdu title and short description, accessible icon/image, and obvious navigation affordance. Inspect exact current route paths before wiring; do not duplicate or replace existing authority data or pages.

## Mobile bottom nav
Updated final intended order (owner correction, 26 November 2026):
1. Home
2. Search
3. News
4. Gov
5. SDK Jobs
6. Saved/Favorites

Keep News as a first-class bottom-nav destination exactly as it was before the Gov redesign; link it to the existing `/news` route with the existing bilingual translation and newspaper icon. Remove separate Government Jobs and Government Schemes bottom-nav entries and replace them with one Gov item. Remove the Urgent bottom-nav item. Preserve the Home page Emergency card, Emergency route, emergency contacts and functionality. Add SDK Jobs as its own item. Labels and accessible names must be bilingual and responsive.

Do not alter desktop navigation unless inspection shows a necessary compatible change.

## Acceptance
- Gov opens four correct cards.
- Every card routes to its existing relevant page.
- Mobile bottom nav has exactly one News, one Gov and one SDK Jobs item, plus Home, Search and Saved; no separate Jobs/Schemes or Urgent shortcut.
- Emergency card, route and contacts still work.
- Existing deep links and browser history continue to work.


## Implementation checkpoint — 26 November 2026

- [x] Added the bilingual public `/gov` landing page with four cards linking to the existing Government Jobs, Government Schemes, Local Authorities and Authority Profiles directories.
- [x] Added the Gov landing to the desktop Civic Services dropdown without removing its existing Local Authorities and Authority Profiles links.
- [x] Replaced the nine-item mobile bottom navigation with Home, Search, Gov, SDK Jobs and Saved; after owner correction, restored News as a sixth item. Final order: Home, Search, News, Gov, SDK Jobs, Saved.
- [x] Removed the separate Government Jobs, Government Schemes and Urgent shortcuts from the bottom navigation only. The `/emergency` route and Home Emergency card remain unchanged.
- [x] Added `/gov` to public route indexing, the sitemap (with cache key version bump) and existing analytics allowlists. Analytics uses the existing `static` page type; no database migration was needed.
- [x] Added automated tests for the four approved destination routes and bilingual card labels/descriptions.
- [x] GitHub CI for the Gov implementation passed in run [45714887257](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45714887257). News-preservation correction passed TypeScript, tests, production build and Supabase Edge Function checks in run [45716487169](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45716487169).
- [x] Gov production Pages deployment — deployment `cf208161-c3da-4116-a0bc-f3eb2a983cfb` succeeded for commit `c766470a26a0325d1bc6c21d2bce65255184d06f`. The News-preservation code commit `981bda1ae6a212cef613021ad1e16188e4f6ee93` also completed a production Pages deployment (Cloudflare deployment `8c1fd329-f5fd-484c-b7c7-c8428bd49713`); the canonical production alias subsequently moved to successful deployment `4f484193-c01c-4f2f-9147-c0becbdc6cbc` on descendant commit `c2d370dcc7b557b623d042902a747b52d5dc10b5`, which includes the News change. [ ] Live rendered six-item nav verification and sitemap check remain pending.
- [ ] Owner browser acceptance for desktop, mobile, Urdu RTL, card deep links and preserved Emergency access.


- [x] Owner correction: restored the existing News shortcut in the mobile bottom navigation at `/news`, using the existing bilingual `nav.news` label and Newspaper icon; responsive grid updated to six columns.
- [ ] CI and production deployment for the six-item navigation correction.


- [x] Added regression tests in `scripts/mobile-bottom-nav.test.mjs` for the six destination routes/order, News translation/icon and six-column layout; included in `npm test`. CI run [45716860002](https://github.com/samt87804-gif/Hello-Sadiqabad/actions/runs/45716860002) was queued/running at checkpoint; await its result.
