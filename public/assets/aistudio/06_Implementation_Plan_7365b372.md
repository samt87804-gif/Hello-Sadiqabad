# 06 — Implementation Plan
**Project:** Hello Sadiqabad (HelloSadiqabad.com) — v2  
**Purpose:** Single-pass execution plan for Google AI Studio. This is an internal build order, not a set of user-facing phases or prompts.

This document must be read together with:
- `01_PRD.md` — product scope, features, roles, business rules and plans
- `02_TRD.md` — stack, architecture, folder structure, integration and deployment requirements
- `03_App_Flow.md` — exact routes, navigation, user/owner/admin flows and UI states
- `04_UI_UX_Design_Brief.md` — visual system, responsive behavior, accessibility and component guidance
- `05_Backend_Schema.md` — authoritative database contract, table/column/RPC/function names, RLS and seed requirements

## 1. Execution Rules and Source of Truth

1. Build the complete **Hello Sadiqabad v2** React + TypeScript (strict) + Vite single-page application described by the six documents.
2. Treat all six documents as one specification. Do not omit, simplify away, or replace confirmed requirements with generic placeholders.
3. If any table, column, RPC, Edge Function, role, or database permission detail conflicts, `05_Backend_Schema.md` is authoritative for the backend contract. `01_PRD.md` is authoritative for product behavior and scope; `02_TRD.md` for technical architecture; `03_App_Flow.md` for routes and flows; `04_UI_UX_Design_Brief.md` for visual design.
4. Keep names consistent across routes, components, TypeScript types, API methods, SQL references and UI labels. Do not invent alternate names for specified objects.
5. This is **one complete build pass**. The order below is an internal dependency-aware implementation sequence, not separate prompts or separate deliverables for the user.
6. Do not ask the user to provide Supabase credentials and do not create a Supabase project/database in AI Studio. Implement a Supabase-ready frontend using environment variables and the exact planned API contract.
7. No AI functionality is in v2. Do not add an AI chatbot, AI generation, Cloudflare AI Gateway integration, or related environment variables.
8. No payment, checkout, subscription billing, SMS/WhatsApp API sending, public visitor accounts, multi-city launch, or Supabase Storage upload flow. Plan tiers are informational and managed by staff; upgrade requests are submissions only.
9. Do not use Vercel, `vercel.json`, Express, a custom Node server, or a server-side frontend framework. Hosting target is Cloudflare Workers & Pages.
10. Do not use random stock images or invented image URLs. Until the later Images workflow, use `lucide-react` icons and neutral `ImageWithFallback` placeholders. Images in the product are HTTPS URL fields, not uploaded to Supabase Storage.
11. Do not leave placeholder pages, dead buttons, fake backend success, mock admin data presented as real, or TODO-only core functionality. If Supabase is not configured, show a clear friendly configuration state while keeping the application buildable and navigable where appropriate.
12. Do not hardcode secrets. Only the public Supabase publishable/anon key may be used in the browser through the specified `VITE_` environment variable. Never expose a service-role key.

## 2. Required Build Order

Execute the following sequence internally while producing the complete application.

### 2.1 Project setup and baseline

- Create a Vite React + TypeScript project with strict TypeScript settings.
- Use stable, published, mutually compatible package versions; do not invent package versions.
- Configure Tailwind CSS v4 with `@tailwindcss/vite`.
- Configure `react-router-dom`, `lucide-react`, Leaflet, `qrcode`, and light use of `motion` as specified in `02_TRD.md`.
- Keep the project Node 20+ compatible.
- Create the required scripts:
  - `dev`
  - `build` using `vite build`
  - `preview`
  - `lint` using `tsc --noEmit`
- Ensure the root `.npmrc` contains exactly `legacy-peer-deps=true`.
- Keep `package-lock.json`; do not create `bun.lock` or `bun.lockb`.
- Remove unused v1 dependencies and artifacts: `express`, `dotenv`, `@google/genai`, `@types/express`, `tsx`, `esbuild` unless genuinely required by Vite, and `vercel.json`.
- Add `.gitignore` entries for local environment files and generated artifacts. Commit only `.env.example` with empty values; never commit `.env`.
- Add the folder/file structure in `02_TRD.md`. Small internal additions are allowed only when needed, but preserve the specified structure and responsibilities.

### 2.2 Shared foundation, types and design system

Implement the application foundation before individual pages:

- `src/types/database.ts`: typed database contract matching `05_Backend_Schema.md` exactly. Include all tables, columns, enums/check-constrained values, relationships needed by the client, RPC argument/return types where practical, and Edge Function request/response types.
- `src/types/directory.ts`: frontend view models and shared domain types. Do not rename backend fields in database-facing code.
- `src/index.css`: design tokens for light/dark themes, Tailwind integration, typography, focus styles, base layout and RTL-safe logical spacing.
- Shared UI components under `src/components/ui/`:
  - `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Modal`, `Toast`
  - `Skeleton`, `EmptyState`, `ErrorState`, `ErrorBoundary`
  - `ImageWithFallback`, `Container`, `SectionHeading`, `IconButton`
  - `Bi`, `Lightbox`, `Tabs`, `Table`, `Pagination`, `ConfirmDialog`, `Charts`
- Shared layout components under `src/components/layout/`:
  - `AppShell`, `AppHeader`, `AppFooter`, `AppBottomNav`
  - `PwaUpdateToast`, `LanguageMenu`, `AnnouncementBar`
- Implement the design brief consistently:
  - Mobile-first, starting at 360×640; thumb-friendly controls and minimum 44×44px targets.
  - Emerald/teal primary identity, amber for selected highlights, red for emergency/danger.
  - Light and dark theme tokens from `04_UI_UX_Design_Brief.md`.
  - Plus Jakarta Sans for English and Noto Nastaliq Urdu for Urdu, with specified fallbacks and Urdu line-height near 2.1.
  - Avoid excessive pill badges, gradient overload and decorative stock imagery.
  - Phone numbers always render LTR with tabular numerals, including in Urdu/RTL layouts.
  - Respect `prefers-reduced-motion`; keep transitions subtle (150–250ms).
- Implement reusable loading, empty, error, success, offline and destructive-confirmation patterns. Forms must validate inline, prevent double-submit, and show loading state.

### 2.3 App providers and core libraries

Implement the shared providers and utilities:

- `src/lib/supabase.ts`:
  - Create exactly one Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - Expose `supabaseConfig.isConfigured`.
  - If variables are missing, do not crash; show the friendly “Database not configured” state.
  - Never include service-role credentials or hardcoded project keys.
- `src/lib/api.ts`:
  - Make this the single data-access layer.
  - Use exact table, column, RPC and Edge Function names from `05_Backend_Schema.md`.
  - Centralize query construction, pagination, error normalization and typed responses.
  - Do not silently substitute fake records when a real query fails.
- `src/lib/auth.tsx`: session/auth helpers and `AuthProvider`; expose `user`, `profile`, `signIn`, `signOut`, `refreshProfile`.
- `src/lib/permissions.ts`: `RequireAuth`, `RequireRole`, `usePermissions`; retrieve permissions through `my_permissions()` and use UI gating only as a convenience, never as a replacement for RLS.
- `src/lib/i18n.tsx`: `I18nProvider` and `useI18n()` with `{ lang, isUrdu, t, setLang, urduHints, setUrduHints }`; persist `hs_lang` and `hs_urdu_hints`; update document `lang` and `dir`; all UI strings must exist in English and Urdu.
- `src/lib/theme.tsx`: system default plus manual light/dark toggle persisted as `hs_theme`.
- `src/lib/hooks.ts`, `siteSettings.ts`, `offlineStorage.ts`, `seo.ts`, `format.ts`, `openNow.ts`, `phone.ts`: implement shared hooks and utilities according to their names and the other documents.
- Search input debounce: 300ms. Lists: 20 records per page / load-more behavior. Avoid heavy chart libraries; use the specified lightweight SVG charts.
- Favorites use `hs_favorites`; recently viewed uses `hs_recent` and is capped at 10 items.
- `openNow.ts` must calculate using `Asia/Karachi`, support multiple opening ranges per day and 24-hour businesses, and distinguish Open, Closed, Open 24 hours and Hours not listed.

### 2.4 Routing and global application shell

Implement all routes exactly as listed in `03_App_Flow.md`:

| Route | Page / access |
|---|---|
| `/` | `Home` — public |
| `/search` | `Search` — public; support the documented query parameters |
| `/categories` | `Categories` — public |
| `/category/:slug` | `CategoryDetail` — public |
| `/area/:slug` | `AreaDetail` — public |
| `/business/:slug` | `BusinessProfile` — public |
| `/offers` | `Offers` — public |
| `/map` | `Map` — public |
| `/favorites` | `Favorites` — public, device storage |
| `/emergency` | `Emergency` — public, offline-capable |
| `/announcements` | `Announcements` — public |
| `/add-business` | `AddBusiness` — public |
| `/about`, `/advertise`, `/contact`, `/terms`, `/privacy`, `/listing-terms`, `/refund-policy`, `/faq` | `StaticPage(slug)` — public |
| `/login` | `Login` — public |
| `/forgot-password` | `ForgotPassword` — public |
| `/reset-password` | `ResetPassword` — public |
| `/change-password` | `ChangePassword` — authenticated |
| `/owner` | `OwnerDashboard` — owner; staff/super_admin may preview |
| `/owner/listings/:id` | `OwnerListing` — owner of that business |
| `/owner/offers` | `OwnerOffers` — owner |
| `/owner/reviews` | `OwnerReviews` — owner |
| `/owner/inquiries` | `OwnerInquiries` — owner |
| `/owner/analytics` | `OwnerAnalyticsPage` — owner |
| `/owner/plan` | `OwnerPlan` — owner |
| `/owner/profile` | `OwnerProfile` — owner |
| `/owner/notifications` | `OwnerNotifications` — owner |
| `/admin` and `/admin/:tab` | `AdminPortal` — permission-gated staff / super_admin |
| `*` | `NotFound` — public |

- Use `BrowserRouter`; page components should be named exports and loaded with `React.lazy` as appropriate.
- Use `AppShell` globally: `AnnouncementBar`, `AppHeader`, page content, `AppFooter` on desktop and `AppBottomNav` on mobile.
- Header includes logo, search affordance, language switch, theme toggle and account/login state.
- Mobile bottom navigation: Home, Search, Categories, Emergency, Favorites.
- Owner and admin areas use their own navigation inside the global shell.
- Support `/search` parameters: `q`, `category`, `area`, `open=1`, `verified=1`, `offer=1`, `rating`, `delivery=1`, `sort`.
- Add route guards and `next` redirect behavior exactly as described in the App Flow.
- Ensure direct navigation and browser refresh work on nested routes through the Cloudflare SPA fallback.

### 2.5 Public directory and visitor experience

Build all public-facing functionality:

**Home**
- Announcement bar/ticker; hero heading and search with autocomplete; quick-search links.
- Emergency strip; popular category grid; sponsored placement when active; current offers; recently added listings; recently viewed; Add-your-business CTA.
- Follow the order in `04_UI_UX_Design_Brief.md`.

**Search and discovery**
- Search by business name, category, area, tags and synonyms; support English, Urdu script and Roman Urdu via backend search behavior.
- Filters: category, area, Open now, verified, has offer, minimum rating, home delivery.
- Sort: relevance, rating, nearest, newest.
- Autocomplete through `search_suggestions`.
- Show results count, filter chips, responsive filter sheet, loading/empty/error states and load more.
- Use `search_businesses` for ranked search and preserve the documented query parameters in the URL.

**Categories and areas**
- Render category parent/child hierarchy and category detail listings.
- Render area detail listings.
- Use active categories/areas from Supabase; do not hardcode invented locality data.

**Business profile**
- Fetch the published record through `get_business_public`; load related entries through `related_businesses`.
- Display bilingual name/address/description with fallback to the available language.
- Show category, area, verified/featured status, rating, Open/Closed state, phone, permitted action buttons, cover/logo, services, opening hours, offers, gallery, videos, social links, map/location, approved reviews and related businesses.
- Provide Call (`tel:`), WhatsApp (`wa.me` only when enabled and a number exists), Directions (Google Maps URL), Share (Web Share API with copy-link fallback), Save, QR code, Send Inquiry (if effective plan allows), Write Review, Suggest Correction/Report, Claim this business.
- On mobile, keep the action bar accessible/sticky as described in the design brief.
- Add SEO metadata and `LocalBusiness` JSON-LD.

**Other public pages**
- Offers: only active, currently valid offers from published businesses.
- Map: Leaflet + OpenStreetMap, published businesses with coordinates, category filter and optional Near me. If geolocation is denied, continue without distance and explain gracefully.
- Favorites: device-local favorites, fetched by saved business IDs.
- Emergency: emergency contacts grouped by type with large red tap-to-call actions; it must work offline using cached emergency data.
- Announcements: active announcements within their date range.
- Add Business: bilingual-capable form; submit only through `submit-suggestion` with type `new_business`.
- Static pages: read published page content by exact slugs; render Markdown safely without raw HTML.

### 2.6 Authentication and owner portal

**Authentication**
- Email/password only. There is no public sign-up.
- Login loads `profiles`; route by role: `super_admin`/`staff` → `/admin`, `owner` → `/owner`.
- If `must_change_password=true`, force `/change-password`.
- If staff account is inactive, block access and show an “Account disabled” message.
- Forgot/reset password uses Supabase Auth with redirect `VITE_SITE_URL + '/reset-password'`.
- Protected-route denial must be friendly and must not leak protected data.

**Owner portal**
- Dashboard: owned listings, listing status, plan/expiry, 7/30-day stats, new inquiries, pending reviews and unread notifications. Show a useful empty state if no listing exists.
- Listing editor tabs: Basic, Contact, Location, Hours, Media, Social, Services/Tags, Preview. Show plan limits and locked features.
- Owner may edit only permitted fields. Owners must not be able to change `status` except allowed submission to approval, `plan_code`, `plan_expires_at`, `is_verified`, `is_featured`, counters, `owner_id`, or other protected fields. Database enforcement remains authoritative.
- Save draft and submit for approval using the documented status flow.
- Offers: create/edit/pause/delete only within effective plan limits.
- Reviews: show approved reviews and allow one owner reply per review through `owner_reply_to_review`.
- Inquiries: inbox with new/read/handled states; call-back uses `tel:`.
- Analytics: 7/30/90-day chart and totals for views, calls, WhatsApp, directions and shares.
- Plan: show free/basic/premium features; upgrade request creates `submissions` type `plan_upgrade`. Never add payment or checkout.
- Profile: name, phone and password change.
- Notifications: show own notifications and mark them read through `mark_notifications_read`.

### 2.7 Admin and staff portal

Build a real permission-aware admin portal with these tabs and exact permission expectations:

| Tab | Required access |
|---|---|
| Overview | any active staff |
| Businesses | `business.create`, `business.edit_own`, or `business.publish` |
| Moderation | `moderation.review` |
| Inquiries | `support.read` |
| Sales Leads | `leads.manage` |
| Owner Accounts | `owners.create` |
| Batch Import | `import.run` |
| Ads & Banners | `ads.review` |
| Listing Tiers | `tiers.manage` |
| Categories & Areas | `super_admin` |
| Announcements | `announcements.manage` |
| Team & Roles | `super_admin` |
| Analytics | `analytics.view` |
| Data Quality | `business.edit_own` or `super_admin` |
| Backup & Export | `super_admin` |
| Site Settings | `settings.manage` / super_admin policy as defined in schema |
| Audit Logs | `super_admin` |

Implement the following workflows:
- Overview: pending counts, trend summaries, top searches and zero-result searches using `admin_dashboard_counts` and `admin_analytics` where permitted.
- Businesses: filters, bulk actions, bilingual editor, hours/location controls, duplicate detection by normalized phone/similar name, staff assignment, internal notes and protected status/plan controls.
- Moderation: reviews and submissions queue; approve/reject; review correction diffs before applying; claim approval links the owner; new-business approval follows schema-defined workflow.
- Inquiries: staff support view and handled status.
- Sales Leads: pipeline statuses exactly `new`, `contacted`, `interested`, `paid`, `converted`, `dropped`, `not_interested`; notes, assignment and conversion via `convert_lead`.
- Owner Accounts: create/reset/deactivate through `admin-create-user`, `admin-reset-password`, `admin-set-user-active`; never call privileged Auth admin APIs from the browser.
- Batch Import: CSV/XLSX upload, column mapping, preview, row validation, duplicate warnings, import result and `import_batches` history. Do not silently discard failed rows.
- Ads: placements `homepage_top`, `search_sidebar`, `category_banner`, `popup`; date/status workflow and impression/click/CTR reporting.
- Listing Tiers: manage `free`, `basic`, `premium` limits/features; show expiry board; no payments.
- Taxonomy: categories and areas CRUD; use specified category fields and bilingual labels.
- Announcements: bilingual content, optional link and date range.
- Team & Roles: staff types, custom permission overrides and active/inactive status; only super admin.
- Analytics: date range, traffic, top businesses/categories/searches, zero-result searches and ad CTR.
- Data Quality: incomplete listing checks and export.
- Backup & Export: CSV/JSON exports and sitemap generation.
- Settings: site settings and bilingual static page editor.
- Audit Logs: filter by actor/action/entity/date.
- Every sensitive admin mutation must be audited through `log_audit_event` and/or the database audit triggers.
- Admin tables should use sticky headers and filters on desktop, stacked cards on mobile, bulk selection where appropriate, and confirmation for destructive actions.

### 2.8 Supabase-ready data and security integration

The frontend must be ready to connect to a **new** Supabase project later. Implement against `05_Backend_Schema.md` without creating the database in AI Studio.

**Tables and naming**
- Use the exact table names and columns in `05_Backend_Schema.md`, including all core, public interaction, staff/admin and v2 advanced tables.
- Important tables include `cities`, `profiles`, `staff_members`, `categories`, `areas`, `plans`, `businesses`, `site_settings`, `emergency_contacts`, `pages`, `audit_logs`, `offers`, `reviews`, `inquiries`, `submissions`, `business_events`, `daily_business_stats`, `search_logs`, `rate_limits`, `announcements`, `notifications`, `leads`, `ads`, `import_batches`, and `business_notes`.
- Do not create client-side schema aliases that imply different database column names. Keep UI view-model transformations isolated from the API layer.

**RPC contract**
Use exact RPC names and documented arguments:
- `search_businesses`
- `get_business_public`
- `related_businesses`
- `search_suggestions`
- `increment_business_stat` / `increment_views` only through the approved server-side tracking flow
- `owner_dashboard_stats`
- `admin_dashboard_counts`
- `admin_analytics`
- `find_duplicate_businesses`
- `owner_reply_to_review`
- `approve_submission`
- `convert_lead`
- `mark_notifications_read`
- `rollup_business_events`
- `expire_plans_and_offers`

Do not call service-role-only RPCs directly from the browser. Use `track-event` Edge Function for event/counter tracking.

**Edge Functions**
Integrate frontend calls with these exact function names and payload contracts from the schema:
- Public functions (JWT verification OFF on Supabase deployment): `submit-review`, `submit-inquiry`, `submit-suggestion`, `track-event`.
- Admin functions (JWT verification ON): `admin-create-user`, `admin-reset-password`, `admin-set-user-active`.
- All calls must handle `{ ok: boolean, error?: string }` responses and display safe, user-friendly errors.
- Public forms include the `website_hp` honeypot field where required, client validation, disabled submit while pending and no duplicate submission.
- Never place `SUPABASE_SERVICE_ROLE_KEY` in frontend code or any `VITE_` variable.

**Security expectations**
- Frontend permission checks are not security boundaries. Respect the RLS and RPC authorization contract.
- Do not add anonymous direct writes to protected tables; public writes go through the Edge Functions.
- Do not expose private inquiries, submissions, leads, audit logs, search logs, rate limits, business events or daily analytics to anonymous users.
- Do not permit role escalation or owner edits to protected business columns.
- Validate all external URLs as HTTPS and max 500 characters.
- Sanitize user content and use a safe Markdown renderer with raw HTML disabled.
- Do not store visitor IPs or personal analytics data; use random `session_id` only.
- No Supabase Storage buckets in v2; images are external HTTPS URLs.
- The database creation, migrations, RLS policies, triggers, scheduled jobs, seed data and Edge Function deployment are deferred to the later ChatGPT + Supabase workflow.

### 2.9 PWA, offline, SEO and Cloudflare files

Create and configure the required public files:
- `public/_redirects`: `/*    /index.html   200`
- `public/_headers`: the exact CSP and security headers in `02_TRD.md`; do not broaden `connect-src` to blanket `https:`.
- `public/robots.txt`: allow public pages and disallow `/admin` and `/owner`.
- `public/manifest.webmanifest`: app name, icons, theme color and `display: standalone`.
- `public/sw.js`: precache app shell and `offline.html`; do not cache Supabase API responses except the emergency-contact offline data strategy specified in the TRD.
- `public/offline.html`: useful offline fallback.
- PWA icons may use neutral temporary assets/placeholders until the later image workflow; required final sizes are 192×192 and 512×512 PNG, maskable.
- Register service worker safely and implement `PwaUpdateToast`.
- Emergency contacts must be cached locally and remain available offline.
- `seo.ts`: page title, meta description, canonical URL, Open Graph and `LocalBusiness` JSON-LD for business profiles.
- `robots.txt` must not expose admin/owner pages to indexing.
- Sitemap is generated from Admin → Backup & Export and placed in `public/sitemap.xml`; do not claim it is dynamically hosted unless actually implemented.

### 2.10 Responsive, accessibility and polish

- Test and tune at mobile (360px width), tablet and desktop.
- Mobile header and bottom navigation must respect safe areas.
- Business cards and profiles prioritize phone number and primary actions.
- Business profile mobile action bar remains reachable without covering content.
- Admin tables convert to stacked cards on narrow screens.
- Urdu mode must set `dir="rtl"` and mirror directional icons; use CSS logical properties rather than left/right assumptions.
- Use `Bi` for English labels with Urdu hints in the locations specified by the design brief; default hints ON and allow toggle OFF.
- All UI text must be bilingual. Do not translate business names or user-entered content automatically.
- Keyboard-operable menus/modals; modal focus trap and Escape/back close; visible focus ring; linked form labels; `aria-label` for icon-only buttons; `aria-live` for toast notifications.
- Color must not be the only status indicator; maintain WCAG AA contrast.
- Images must have meaningful alt text and fixed aspect ratios; use lazy loading and `ImageWithFallback`.
- Respect `prefers-reduced-motion`.
- Add friendly empty/error/loading/offline states to every data-driven screen.

## 3. Required Component and Page Inventory

Use the folder structure in `02_TRD.md` and ensure these named components/pages exist and are connected to real routes or parent components.

**Core UI:** `Button`, `Input`, `Select`, `Textarea`, `Card`, `Badge`, `Modal`, `Toast`, `Skeleton`, `EmptyState`, `ErrorState`, `ErrorBoundary`, `ImageWithFallback`, `Container`, `SectionHeading`, `IconButton`, `Bi`, `Lightbox`, `Tabs`, `Table`, `Pagination`, `ConfirmDialog`, `Charts`.

**Layout:** `AppShell`, `AppHeader`, `AppFooter`, `AppBottomNav`, `PwaUpdateToast`, `LanguageMenu`, `AnnouncementBar`.

**Directory:** `BusinessCard`, `SendInquiryModal`, `WriteReviewModal`, `SuggestCorrectionModal`, `QrCodeModal`, `ClaimBusinessModal`, `ShareSheet`, `OpeningHoursTable`, `OpenNowBadge`, `SearchFilters`, `AdBanner`.

**Owner:** `OwnerNav`, `ListingEditor`, `HoursEditor`, `LocationPicker`, `UrlListEditor`, `OffersManager`, `ReviewsReply`, `InquiriesInbox`, `OwnerAnalytics`, `PlanCard`, `NotificationsList`.

**Admin:** `AdminNav`, `AdminDashboard`, `BusinessManager`, `ModerationManager`, `InquiriesManager`, `LeadsManager`, `OwnersManager`, `ImportManager`, `AdsManager`, `PlansManager`, `TaxonomyManager`, `AnnouncementsManager`, `StaffManager`, `AnalyticsView`, `DataQuality`, `BackupExport`, `SettingsManager`, `AuditLogsViewer`.

**Public pages:** `Home`, `Search`, `Categories`, `CategoryDetail`, `AreaDetail`, `BusinessProfile`, `Offers`, `AddBusiness`, `Map`, `Favorites`, `Emergency`, `Announcements`, `StaticPage`, `Login`, `ForgotPassword`, `ResetPassword`, `ChangePassword`, `NotFound`.

**Owner pages:** `OwnerDashboard`, `OwnerListing`, `OwnerOffers`, `OwnerReviews`, `OwnerInquiries`, `OwnerAnalyticsPage`, `OwnerPlan`, `OwnerProfile`, `OwnerNotifications`.

**Admin page:** `AdminPortal` with the permission-gated tabs listed above.

## 4. Data and Naming Consistency Checklist

Before considering implementation complete, verify all of the following:

- [ ] All route paths and page names match `03_App_Flow.md`.
- [ ] All role strings are exactly `super_admin`, `staff`, `owner`.
- [ ] All staff type and permission keys match `01_PRD.md` and `05_Backend_Schema.md`.
- [ ] All table and column references match `05_Backend_Schema.md`.
- [ ] All RPC names and argument names match `05_Backend_Schema.md`.
- [ ] All Edge Function names match `05_Backend_Schema.md`.
- [ ] Plan codes are exactly `free`, `basic`, `premium`.
- [ ] Business status values are exactly `draft`, `pending_approval`, `published`, `rejected`, `suspended`, `archived`.
- [ ] Review, inquiry, submission, lead and ad status values match the schema exactly.
- [ ] Search URL parameters match the App Flow.
- [ ] Browser environment variables match the TRD exactly.
- [ ] No old v1 Supabase URL/key is reused.
- [ ] No Supabase Storage bucket or AI Gateway is introduced.
- [ ] No payment/checkout flow is introduced.
- [ ] City launch defaults to `sadiqabad`; locality seed values must not be invented in frontend code.

## 5. Testing Checkpoints and Acceptance Criteria

Run checks continuously during the build and complete this final QA pass before reporting completion.

### 5.1 Build and code quality
- [ ] `npm install` completes with the committed npm lockfile.
- [ ] `npm run lint` passes (`tsc --noEmit`) with no TypeScript errors.
- [ ] `npm run build` passes with zero errors and creates `dist/`.
- [ ] No missing imports, broken routes, unresolved assets or console-breaking runtime errors.
- [ ] No placeholder pages or inert primary actions remain.
- [ ] App still renders a clear configuration state when Supabase environment variables are absent.

### 5.2 Public experience
- [ ] Home sections appear in the required order.
- [ ] Search supports query parameters, filters, sort, autocomplete and load more.
- [ ] Category and area pages use database content.
- [ ] Business profile displays bilingual fields with fallback, hours, actions, reviews and related listings.
- [ ] Call, WhatsApp, Directions, Share, Save and QR actions work when their conditions are met.
- [ ] Inquiry/review/suggestion/add-business forms validate, submit through the correct Edge Function and handle success/failure/rate limits.
- [ ] Offers and announcements respect active/date conditions.
- [ ] Map renders published businesses with coordinates and gracefully handles denied geolocation.
- [ ] Favorites and recently viewed persist on the device.
- [ ] Emergency call links work and emergency contacts remain available offline.
- [ ] Static pages render safe Markdown.

### 5.3 Auth and owner
- [ ] Login/logout and session restoration work.
- [ ] Role-based redirects work.
- [ ] `must_change_password` forces password change.
- [ ] Forgot/reset password uses the configured redirect.
- [ ] Inactive staff are blocked.
- [ ] Owners only see their own listings and data.
- [ ] Owner editing respects plan limits and protected columns.
- [ ] Offer, review reply, inquiry, analytics, plan-upgrade and notification flows use the specified API/RPC contracts.

### 5.4 Admin and staff
- [ ] Each tab is shown only to a user with the required permission.
- [ ] Staff types and custom overrides are reflected correctly in the UI.
- [ ] Business moderation, submissions, duplicate detection and bulk actions are wired.
- [ ] Lead pipeline and conversion are wired.
- [ ] Owner account actions call only the admin Edge Functions.
- [ ] Import preview reports row-level errors and duplicates.
- [ ] Ads, plans, taxonomy, announcements, staff, analytics, data quality, export, settings and audit screens are implemented.
- [ ] Destructive actions require confirmation.
- [ ] Sensitive actions are logged through the specified audit mechanism.

### 5.5 Security and backend readiness
- [ ] No service-role key, secret, or private credential appears in source, built assets or repository.
- [ ] `.env` is ignored; `.env.example` contains only empty placeholders.
- [ ] No anonymous direct writes are implemented for protected tables.
- [ ] Public writes call the correct Edge Functions.
- [ ] Service-role-only operations are never called directly from the browser.
- [ ] UI permission checks are not treated as a replacement for RLS.
- [ ] All URLs are validated as HTTPS and max 500 characters.
- [ ] User content is sanitized and Markdown raw HTML is disabled.
- [ ] Analytics does not store visitor IPs or personal visitor data.
- [ ] No Supabase Storage buckets or AI services are assumed.

### 5.6 UI, responsive, accessibility and PWA
- [ ] Mobile, tablet and desktop layouts are checked.
- [ ] English and Urdu switch instantly and set correct `lang`/`dir`.
- [ ] Urdu hints toggle works and defaults ON in English mode.
- [ ] Phone numbers remain LTR in Urdu.
- [ ] Dark mode and system default work.
- [ ] Contrast, focus states, labels, keyboard access and tap targets meet the design brief.
- [ ] Reduced-motion preference is respected.
- [ ] Service worker, offline fallback, emergency cache and update toast work.
- [ ] Supabase API responses are not cached by the service worker.

### 5.7 Cloudflare readiness
- [ ] Build command is `npm run build`.
- [ ] Output directory is `dist`.
- [ ] Node compatibility is 20+.
- [ ] `public/_redirects` contains the required SPA fallback.
- [ ] `public/_headers` contains the specified CSP/security headers.
- [ ] Root `.npmrc` contains exactly `legacy-peer-deps=true`.
- [ ] `package-lock.json` exists; `bun.lock` and `bun.lockb` do not.
- [ ] No `vercel.json` or Express server exists.
- [ ] `.env.example` lists `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SITE_URL`, `VITE_DEFAULT_CITY`.
- [ ] Edge Function secret names are documented but not placed in frontend variables.

## 6. Explicitly Deferred to Later Workflow

Do not perform these tasks as part of the AI Studio frontend build:

1. **Supabase project/database creation:** ChatGPT will create a new Supabase project after GitHub export, using `05_Backend_Schema.md` and the actual latest code.
2. **SQL migrations, RLS policies, triggers, RPC deployment, pg_cron, seed data and RLS tests:** these belong to the later Supabase setup.
3. **Supabase Edge Function deployment and secret configuration:** implement the frontend integration contract now; deploy/configure functions later.
4. **Final real images and icon assets:** after the website is built, prepare the separate Images workflow inventory. Until then use Lucide icons and neutral placeholders.
5. **Cloudflare production deployment:** prepare the repo files and build settings now; the user deploys from GitHub after the Supabase workflow.
6. **AI Gateway:** not applicable; AI features are explicitly out of scope for v2.
7. **Locality seed confirmation:** the Sadiqabad area names noted in `05_Backend_Schema.md` must be confirmed by the admin during the later database seed process, not guessed in frontend code.

## 7. Final Deliverable and Completion Report

The completed AI Studio project must contain:
- A complete React + TypeScript + Vite SPA with every required public, owner and admin route.
- The shared UI, layout, directory, owner and admin components specified in this plan.
- A typed Supabase-ready data layer using the exact schema contract.
- Authentication, permission-aware UI, bilingual English/Urdu RTL, theme, favorites, recently viewed, PWA/offline emergency support and SEO foundations.
- Cloudflare-ready public configuration files and npm setup.
- A clean `npm run lint` and `npm run build`.

At completion, provide a concise report that states:
1. What pages, components and flows were implemented.
2. Which integrations are wired and which are intentionally deferred.
3. Results of `npm run lint` and `npm run build`.
4. Any incomplete items or blockers, stated honestly (do not claim untested functionality works).
5. Confirmation that no AI Gateway, payments, Supabase Storage buckets, Vercel configuration or secrets were added.
6. The exact environment variable names expected later, as listed in `02_TRD.md`.

**Completion standard:** the application should be a coherent, navigable, responsive and buildable implementation of the six-document specification—not a visual mockup or a collection of disconnected placeholder screens.
