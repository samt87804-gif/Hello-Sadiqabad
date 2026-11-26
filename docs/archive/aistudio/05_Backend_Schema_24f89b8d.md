# 05 — Backend Schema (Supabase / PostgreSQL)
**This is a planning document only.** It does not create anything. After the site code is in GitHub, ChatGPT (Supabase + GitHub plugins) creates a **NEW Supabase project** and builds this database to match this file **and the actual latest code**. Table, column, RPC and function names below are the single source of truth; the frontend (`src/lib/api.ts`, `src/types/database.ts`) must use them exactly.

Conventions: `id uuid primary key default gen_random_uuid()`; `created_at/updated_at timestamptz default now()` with trigger `handle_updated_at()`; all URL columns have check `^https://\S+$` and length ≤ 500; all migrations idempotent (`if not exists`, `drop policy if exists`); extensions: `pgcrypto`, `pg_trgm`, `unaccent`, `pg_cron`.

## 1. Tables

### Core
**cities**: id, name_en, name_ur, slug (unique), center_lat numeric(9,6), center_lng numeric(9,6), is_active bool default true.

**profiles** (1:1 with `auth.users`, id = auth.users.id, on delete cascade): role text check in (`super_admin`,`staff`,`owner`) default `owner`, full_name, phone, avatar_url, must_change_password bool default false.

**staff_members**: user_id uuid unique → profiles(id) cascade, staff_types text[] default '{}', permissions jsonb default '{}', is_active bool default true.

**categories**: name_en, name_ur, slug unique, parent_id → categories(id) cascade, icon (lucide name), color, sort_order int, synonyms text[] (English, Urdu script and Roman Urdu), is_active. Indexes: parent_id, (is_active, sort_order).

**areas**: city_id → cities cascade, name_en, name_ur, slug, is_active; unique (city_id, slug).

**plans**: code unique check in (`free`,`basic`,`premium`), name_en, name_ur, limits jsonb, features jsonb, price_note, is_active, sort_order.
- limits keys: `gallery`, `max_photos`, `videos`, `max_videos`, `social_links`, `offers`, `search_priority`.
- features keys: `whatsapp`, `cover`, `gallery`, `videos`, `social_links`, `offers`, `inquiry`, `verified_badge`, `qr`, `analytics_full`.
- Seed values exactly as PRD §5 (free: 0/0/0/0/1; basic: 5/1/3/2/2; premium: 15/3/999/10/3).

**businesses**: city_id → cities (restrict), owner_id → profiles (set null), name_en not null, name_ur, slug (unique with city_id), category_id → categories (restrict) not null, area_id → areas (set null), address_en, address_ur, landmark_en, landmark_ur, lat numeric(9,6), lng numeric(9,6), phone_primary not null, phone_secondary, phone_normalized (trigger-maintained), whatsapp, email, website_url, facebook_url, instagram_url, youtube_url, tiktok_url, description_en, description_ur, services_en text[], services_ur text[], logo_url, cover_url, owner_name, owner_photo_url, gallery_urls text[], video_urls text[], opening_hours jsonb, is_open_24h bool default false, home_delivery bool default false, established_year int, status text check in (`draft`,`pending_approval`,`published`,`rejected`,`suspended`,`archived`) default `draft`, rejection_reason text, plan_code → plans(code) default `free`, plan_expires_at timestamptz, is_verified bool, is_featured bool, tags text[], meta_title_en, meta_description_en, rating_avg numeric(2,1), rating_count int default 0, view_count/call_count/whatsapp_count bigint default 0, source text (e.g. `import`, `manual`, `TEST`), created_by, assigned_to → profiles (set null), published_at timestamptz, claimed_at timestamptz. Unique (city_id, slug). Indexes: (city_id,status), category_id, area_id, owner_id, GIN trigram on name_en, GIN on tags, index on phone_normalized.
- `opening_hours` JSON shape: `{ "mon": [{"open":"09:00","close":"21:00"}], "tue": [...], ... "sun": [] }` (empty array = closed; multiple ranges allowed; times in Asia/Karachi).

**site_settings**: key text pk, value jsonb, description, is_public bool. Seed keys: `site_name`, `contact_phone`, `contact_whatsapp`, `contact_email`, `social_links`, `default_language`, `owner_edits_require_approval` (false), `reviews_require_approval` (true), `ads_enabled` (true), `maintenance_mode` (false).

**emergency_contacts**: city_id, name_en, name_ur, phone, category check in (`rescue`,`police`,`fire`,`ambulance`,`hospital`,`utility`,`general`), icon, sort_order, is_active; unique (name_en, phone). Seed: Rescue 1122, Police 15, Fire 16, Edhi/Ambulance 115.

**pages**: slug unique, title_en, title_ur, body_md_en, body_md_ur, is_published, updated_by. Seed slugs: about, advertise, contact, terms, privacy, listing-terms, refund-policy, faq (bilingual).

**audit_logs**: actor_id → profiles (set null), action, entity, entity_id, details jsonb, created_at. Indexes: actor_id, (entity, entity_id), created_at desc.

### Public interaction
**offers**: business_id cascade, title, description, image_url, valid_from, valid_to, status check in (`active`,`paused`,`expired`).

**reviews**: business_id cascade, author_name (2–60), rating int 1–5, comment ≤ 500, status check in (`pending`,`approved`,`rejected`) default `pending`, owner_reply ≤ 500, owner_reply_at. Trigger `recalculate_business_rating()` after insert/update/delete.

**inquiries**: business_id cascade, name (2–100), phone, message (5–1000), status check in (`new`,`read`,`handled`), handled_by.

**submissions**: type check in (`new_business`,`correction`,`claim`,`phone_suggestion`,`report`,`broken_image`,`plan_upgrade`), business_id (set null), payload jsonb (≤ 8192 bytes), contact_name, contact_phone, status check in (`new`,`in_review`,`done`,`rejected`), assigned_to, admin_note.

**business_events**: business_id cascade, event_type check in (`view`,`call`,`whatsapp`,`directions`,`share`,`search_appearance`), ad_id, session_id (random, no IP), created_at. Index (business_id, event_type, created_at).

**daily_business_stats** (rollup, new): business_id cascade, stat_date date, views, calls, whatsapp, directions, shares (ints); primary key (business_id, stat_date).

**search_logs**: query, filters jsonb, results_count, created_at (no personal data).

**rate_limits**: key pk, window_start, count.

**announcements** (new): title_en, title_ur, body_en, body_ur, link_url, start_date, end_date, is_active, created_by.

**notifications** (new): user_id → profiles cascade, type (`inquiry`,`review`,`listing_status`,`plan_expiring`,`claim`,`general`), title_en, title_ur, body_en, body_ur, link_path, is_read bool default false. Index (user_id, is_read, created_at desc).

### Staff / admin
**leads**: name (2–100), phone, phone_normalized (trigger), category_text, area_text, address, status check in (`new`,`contacted`,`interested`,`paid`,`converted`,`dropped`,`not_interested`), notes ≤ 2000, assigned_to, created_by, converted_business_id → businesses (set null).

**ads**: business_id → businesses cascade, title (2–120), placement check in (`homepage_top`,`search_sidebar`,`category_banner`,`popup`), image_url not null, target_url, start_date, end_date (≥ start_date), status check in (`pending`,`active`,`paused`,`expired`,`rejected`), notes, impressions bigint, clicks bigint, created_by, reviewed_by.

**import_batches**: filename, total_rows, imported_count, failed_count, errors jsonb, created_by.

**business_notes**: business_id cascade, author_id cascade, note (1–2000).

## 2. Helper Functions (security definer, `set search_path = public`)
- `handle_updated_at()`, `handle_new_user()` (creates profile with role `owner` on auth signup), `normalize_pk_phone(text)` → E.164-like `+92…`.
- `is_super_admin()`, `is_staff_active()`, `staff_has_permission(perm text)` and alias `has_staff_permission(perm)`, `is_owner_of(b_id uuid)`, `effective_plan(b_id uuid)` (returns `free` if plan expired), `my_permissions()` → jsonb `{role,is_active,staff_types,permissions[]}`.
- Permission keys: `business.create, business.edit_own, business.publish, import.run, leads.manage, owners.create, tiers.manage, ads.review, moderation.review, support.read, analytics.view, announcements.manage, settings.manage`. Derivation from `staff_types` exactly as in PRD §4.5; `staff_members.permissions` jsonb can override (`{"all":true}` or `{"perm":true/false}`).
- `check_rate_limit(p_key text, p_limit int, p_window_seconds int)` → boolean.
- `log_audit_event(p_action, p_entity, p_entity_id, p_details)` and trigger function `audit_log_record()` attached to sensitive tables (businesses, plans, ads, staff_members, profiles role changes, categories, areas, pages, site_settings).

## 3. RPCs (callable from frontend)
| RPC | Who | Purpose |
|---|---|---|
| `search_businesses(p_query, p_category, p_area, p_open_now, p_verified, p_has_offer, p_min_rating, p_delivery, p_lat, p_lng, p_sort, p_limit, p_offset)` | anon+auth | ranked search: trigram + synonyms/tags + Urdu text, plan priority boost, returns rows + `total_count`, distance if lat/lng |
| `get_business_public(p_slug)` | anon+auth | one published business with category, area, plan features, active offers, approved reviews |
| `related_businesses(p_business_id, p_limit)` | anon+auth | same category/area |
| `search_suggestions(p_query, p_limit)` | anon+auth | autocomplete (business names, categories, areas) |
| `increment_business_stat(b_id, stat)` / `increment_views(b_id)` | service_role only (called by `track-event`) | counters + `business_events` |
| `owner_dashboard_stats(p_business_id, p_days)` | owner of business | totals + per-day series from `daily_business_stats` + live today |
| `admin_dashboard_counts()` | staff | pending counts for overview |
| `admin_analytics(p_days)` | `analytics.view` | traffic, top businesses/categories/searches, zero-result searches, ad CTR |
| `find_duplicate_businesses(p_phone, p_name, p_exclude_id)` | staff | duplicates by `phone_normalized` / similar name |
| `owner_reply_to_review(p_review_id, p_reply)` | owner of review's business | sets `owner_reply`, `owner_reply_at` only |
| `approve_submission(p_submission_id, p_action)` | `moderation.review` | applies new_business / claim / correction and marks done, notifies |
| `convert_lead(p_lead_id, p_business_id)` | `leads.manage` | links lead to business, status `converted` |
| `mark_notifications_read(p_ids uuid[])` | authenticated | own notifications |
| `rollup_business_events(p_date)` | cron/service | fills `daily_business_stats` |
| `expire_plans_and_offers()` | cron/service | downgrades expired plans to `free`, marks offers `expired`, creates 7-day `plan_expiring` notifications |

## 4. Triggers
`set_*_updated_at` on every table with `updated_at`; `trg_normalize_business_phone` and `trg_normalize_lead_phone`; `trg_recalc_rating` on reviews; `enforce_business_column_protection` (before update on businesses: if caller is not super_admin/staff-with-permission, block changes to `status` (allow draft/rejected → pending_approval), `plan_code`, `plan_expires_at`, `is_verified`, `is_featured`, `view_count`, `call_count`, `whatsapp_count`, `owner_id`, `rating_*`, `source`, `assigned_to`); `enforce_plan_limits` (before insert/update on businesses and offers: gallery/video/social/offers counts vs `effective_plan` limits for non-staff writers); notification triggers (new inquiry → owner; review status change → owner; business status change → owner; claim approved → claimant); `audit_log_record` triggers.

## 5. Row Level Security (RLS enabled on ALL tables)
| Table | anon | authenticated owner | staff / super_admin |
|---|---|---|---|
| cities, categories, areas, plans, pages (published), emergency_contacts (active), site_settings (`is_public`), announcements (active & in date) | SELECT | SELECT | write: super_admin (announcements: `announcements.manage`; plans: `tiers.manage`) |
| businesses | SELECT where `status='published'` | SELECT/UPDATE own (`owner_id=auth.uid()`) via column protection; INSERT own as `draft` | SELECT all; INSERT `business.create`; UPDATE `business.edit_own` (own/assigned) or `business.publish`; DELETE super_admin |
| offers | SELECT active+in-date on published businesses | CRUD own business (plan limit) | all via `tiers.manage`/super_admin |
| reviews | SELECT approved | SELECT all of own business; UPDATE only via `owner_reply_to_review` | `moderation.review` |
| inquiries, submissions, leads, ads (non-active), import_batches, business_notes, audit_logs, rate_limits, search_logs, business_events, daily_business_stats | **no access** (ads: SELECT only `active` in date range) | inquiries: SELECT/UPDATE status for own business; own submissions of type claim/plan_upgrade SELECT | per permission (`support.read`, `moderation.review`, `leads.manage`, `ads.review`, `import.run`, `analytics.view`); audit_logs super_admin only |
| profiles | none | SELECT/UPDATE own (not `role`, not `must_change_password` except to false) | SELECT staff-visible; role changes super_admin only |
| staff_members | none | none | super_admin (SELECT own row for staff) |
| notifications | none | own rows only (SELECT/UPDATE is_read) | none beyond own |
Rules: anon never has INSERT/UPDATE/DELETE anywhere; public writes happen only in Edge Functions using the service role. Role escalation (`profiles.role`) by non-super_admin must be impossible (test it).

## 6. Storage
No buckets in v2 (images are HTTPS URLs). If a bucket is added later it must be a separate migration.

## 7. Auth Settings
Email + password enabled; email confirmation OFF for admin-created users (created confirmed via admin API); password min length 8; Site URL = `https://hellosadiqabad.com`; Redirect URLs include `https://hellosadiqabad.com/reset-password`, the Cloudflare preview domain and `http://localhost:3000/reset-password`. Public sign-up from the website is **not offered** (accounts are admin-created).

## 8. Edge Functions (each a single self-contained `index.ts`)
| Function | JWT verify | Does |
|---|---|---|
| `submit-review` | OFF | validates, honeypot, rate limit, inserts `reviews` pending |
| `submit-inquiry` | OFF | checks plan feature `inquiry`, rate limit, inserts `inquiries` |
| `submit-suggestion` | OFF | inserts `submissions` for types `new_business`,`correction`,`claim`,`phone_suggestion`,`report`,`broken_image` |
| `track-event` | OFF | records `business_events` (+ counters) and `search_logs`, ad impression/click |
| `admin-create-user` | ON | caller super_admin or `owners.create`; creates auth user (confirmed), profile role, `must_change_password=true`, optional business link / staff row |
| `admin-reset-password` | ON | super_admin or `owners.create`; sets temp password + `must_change_password=true` |
| `admin-set-user-active` | ON | super_admin; bans/unbans auth user and sets `staff_members.is_active` |
All use `ALLOWED_ORIGINS` secret for CORS and return JSON `{ ok: boolean, error?: string }`.

## 9. Scheduled Jobs (pg_cron)
- every night 02:00 PKT: `rollup_business_events(current_date - 1)`; `expire_plans_and_offers()`.
- weekly: delete `rate_limits` older than 1 day, `search_logs` older than 180 days, `business_events` older than 400 days (after rollup).

## 10. Seed Data
City `sadiqabad` (center ≈ 28.3062, 70.1308); ~13 top-level categories with Urdu names and synonyms (Hospitals, Doctors, Pharmacies, Schools, Restaurants, Groceries, Electronics, Mobile shops, Clothing, Auto/Workshops, Banks/ATMs, Real Estate, Services) plus useful sub-categories; ~9 areas (e.g., Model Town, Gulshan-e-Iqbal, Railway Road, Main Bazar, Canal Colony, Kot Sabzal — ChatGPT must confirm real Sadiqabad locality names with the admin before finalizing); 3 plans; 4 emergency contacts; site_settings; 8 bilingual static pages; 3 clearly labeled `TEST –` businesses only in a separate optional file.

## 11. Deliverable SQL / Test Files (kept in repo `supabase/`)
`001_core.sql`, `002_public_directory.sql`, `003_admin_staff.sql`, `004_v2_advanced.sql` (announcements, notifications, rollups, RPCs, cron), `tests/*_rls_tests.sql` (transaction + rollback), `dev_test_data.sql`, `dev_test_cleanup.sql`, `README_SQL.md` (run order + super admin promotion snippet using the admin's email), `functions/<name>/index.ts` for the 7 functions.

## 12. Verification Checklist (for ChatGPT's final report)
All tables have RLS on; anon cannot write; owner cannot escalate role or edit protected columns; staff permissions work per type; inactive staff blocked; rating trigger works; rate limit works; every RPC callable by intended role only; Edge Functions deployed with correct JWT setting and secrets; cron jobs scheduled; list of env variables for Cloudflare.
