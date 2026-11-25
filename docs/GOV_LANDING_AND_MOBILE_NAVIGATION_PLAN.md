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
Final intended order:
1. Home
2. Search
3. Gov
4. SDK Jobs
5. Saved/Favorites

Remove separate Government Jobs and Government Schemes bottom-nav entries and replace them with one Gov item. Remove the Urgent bottom-nav item. Preserve the Home page Emergency card, Emergency route, emergency contacts and functionality. Add SDK Jobs as its own item. Preserve other navigation access through Gov landing, menus or existing page links. Labels and accessible names must be bilingual and responsive.

Do not alter desktop navigation unless inspection shows a necessary compatible change.

## Acceptance
- Gov opens four correct cards.
- Every card routes to its existing relevant page.
- Mobile bottom nav has exactly one Gov and one SDK Jobs item, no Urgent shortcut.
- Emergency card, route and contacts still work.
- Existing deep links and browser history continue to work.
