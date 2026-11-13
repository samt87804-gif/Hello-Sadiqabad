-- Consolidated baseline schema snapshot for Hello Sadiqabad.
-- This is the reproducible baseline for a fresh Supabase project.
create schema if not exists extensions;
create schema if not exists private;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- URL validators are required by table CHECK constraints below.
create or replace function public.is_valid_https_url(p text)
returns boolean language sql immutable set search_path=''
as $$ select p is null or (char_length(p)<=500 and p ~ '^https://[^[:space:]]+$') $$;
create or replace function public.are_valid_https_urls(items text[])
returns boolean language sql immutable set search_path=''
as $$ select coalesce(bool_and(public.is_valid_https_url(x)),true) from unnest(coalesce(items,'{}'::text[])) x $$;

create table if not exists public."ads" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "title" text not null,
  "placement" text not null,
  "image_url" text not null,
  "target_url" text,
  "start_date" date not null,
  "end_date" date not null,
  "status" text default 'pending'::text not null,
  "notes" text,
  "impressions" bigint default 0 not null,
  "clicks" bigint default 0 not null,
  "created_by" uuid,
  "reviewed_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."announcements" (
  "id" uuid default gen_random_uuid() not null,
  "title_en" text not null,
  "title_ur" text not null,
  "body_en" text not null,
  "body_ur" text not null,
  "link_url" text,
  "start_date" timestamp with time zone not null,
  "end_date" timestamp with time zone not null,
  "is_active" boolean default true not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."areas" (
  "id" uuid default gen_random_uuid() not null,
  "city_id" uuid not null,
  "name_en" text not null,
  "name_ur" text not null,
  "slug" text not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."audit_logs" (
  "id" uuid default gen_random_uuid() not null,
  "actor_id" uuid,
  "action" text not null,
  "entity" text not null,
  "entity_id" text,
  "details" jsonb default '{}'::jsonb not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."business_events" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "event_type" text not null,
  "ad_id" uuid,
  "session_id" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."business_notes" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "author_id" uuid not null,
  "note" text not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."businesses" (
  "id" uuid default gen_random_uuid() not null,
  "city_id" uuid not null,
  "owner_id" uuid,
  "name_en" text not null,
  "name_ur" text,
  "slug" text not null,
  "category_id" uuid not null,
  "area_id" uuid,
  "address_en" text,
  "address_ur" text,
  "landmark_en" text,
  "landmark_ur" text,
  "lat" numeric(9,6),
  "lng" numeric(9,6),
  "phone_primary" text not null,
  "phone_secondary" text,
  "phone_normalized" text,
  "whatsapp" text,
  "email" text,
  "website_url" text,
  "facebook_url" text,
  "instagram_url" text,
  "youtube_url" text,
  "tiktok_url" text,
  "description_en" text,
  "description_ur" text,
  "services_en" text[] default '{}'::text[] not null,
  "services_ur" text[] default '{}'::text[] not null,
  "logo_url" text,
  "cover_url" text,
  "owner_name" text,
  "owner_photo_url" text,
  "gallery_urls" text[] default '{}'::text[] not null,
  "video_urls" text[] default '{}'::text[] not null,
  "opening_hours" jsonb,
  "is_open_24h" boolean default false not null,
  "home_delivery" boolean default false not null,
  "established_year" integer,
  "status" text default 'draft'::text not null,
  "rejection_reason" text,
  "plan_code" text default 'free'::text not null,
  "plan_expires_at" timestamp with time zone,
  "is_verified" boolean default false not null,
  "is_featured" boolean default false not null,
  "tags" text[] default '{}'::text[] not null,
  "meta_title_en" text,
  "meta_description_en" text,
  "rating_avg" numeric(2,1),
  "rating_count" integer default 0 not null,
  "view_count" bigint default 0 not null,
  "call_count" bigint default 0 not null,
  "whatsapp_count" bigint default 0 not null,
  "source" text,
  "created_by" uuid,
  "assigned_to" uuid,
  "published_at" timestamp with time zone,
  "claimed_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."categories" (
  "id" uuid default gen_random_uuid() not null,
  "name_en" text not null,
  "name_ur" text not null,
  "slug" text not null,
  "parent_id" uuid,
  "icon" text default 'store'::text not null,
  "color" text default 'primary'::text not null,
  "sort_order" integer default 0 not null,
  "synonyms" text[] default '{}'::text[] not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."cities" (
  "id" uuid default gen_random_uuid() not null,
  "name_en" text not null,
  "name_ur" text not null,
  "slug" text not null,
  "center_lat" numeric(9,6),
  "center_lng" numeric(9,6),
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."daily_business_stats" (
  "business_id" uuid not null,
  "stat_date" date not null,
  "views" integer default 0 not null,
  "calls" integer default 0 not null,
  "whatsapp" integer default 0 not null,
  "directions" integer default 0 not null,
  "shares" integer default 0 not null
);

create table if not exists public."emergency_contacts" (
  "id" uuid default gen_random_uuid() not null,
  "city_id" uuid not null,
  "name_en" text not null,
  "name_ur" text not null,
  "phone" text not null,
  "category" text not null,
  "icon" text default 'phone'::text not null,
  "sort_order" integer default 0 not null,
  "is_active" boolean default true not null,
  "description_en" text,
  "description_ur" text,
  "whatsapp" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."import_batches" (
  "id" uuid default gen_random_uuid() not null,
  "filename" text not null,
  "total_rows" integer not null,
  "imported_count" integer default 0 not null,
  "failed_count" integer default 0 not null,
  "errors" jsonb default '[]'::jsonb not null,
  "created_by" uuid,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."inquiries" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "name" text not null,
  "phone" text not null,
  "message" text not null,
  "status" text default 'new'::text not null,
  "handled_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."leads" (
  "id" uuid default gen_random_uuid() not null,
  "name" text not null,
  "phone" text not null,
  "phone_normalized" text,
  "category_text" text,
  "area_text" text,
  "address" text,
  "status" text default 'new'::text not null,
  "notes" text,
  "assigned_to" uuid,
  "created_by" uuid,
  "converted_business_id" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."notifications" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "type" text not null,
  "title_en" text not null,
  "title_ur" text not null,
  "body_en" text not null,
  "body_ur" text not null,
  "link_path" text,
  "is_read" boolean default false not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."offers" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "title" text not null,
  "description" text,
  "image_url" text,
  "valid_from" date not null,
  "valid_to" date not null,
  "status" text default 'active'::text not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."pages" (
  "id" uuid default gen_random_uuid() not null,
  "slug" text not null,
  "title_en" text not null,
  "title_ur" text not null,
  "body_md_en" text default ''::text not null,
  "body_md_ur" text default ''::text not null,
  "is_published" boolean default false not null,
  "updated_by" uuid,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."plans" (
  "id" uuid default gen_random_uuid() not null,
  "code" text not null,
  "name_en" text not null,
  "name_ur" text not null,
  "limits" jsonb default '{}'::jsonb not null,
  "features" jsonb default '{}'::jsonb not null,
  "price_note" text default ''::text not null,
  "is_active" boolean default true not null,
  "sort_order" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."profiles" (
  "id" uuid not null,
  "role" text default 'owner'::text not null,
  "full_name" text,
  "phone" text,
  "avatar_url" text,
  "must_change_password" boolean default false not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null,
  "is_active" boolean default true not null
);

create table if not exists public."rate_limits" (
  "key" text not null,
  "window_start" timestamp with time zone not null,
  "count" integer default 0 not null
);

create table if not exists public."reviews" (
  "id" uuid default gen_random_uuid() not null,
  "business_id" uuid not null,
  "author_name" text not null,
  "rating" integer not null,
  "comment" text not null,
  "status" text default 'pending'::text not null,
  "owner_reply" text,
  "owner_reply_at" timestamp with time zone,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."search_logs" (
  "id" uuid default gen_random_uuid() not null,
  "query" text not null,
  "filters" jsonb default '{}'::jsonb not null,
  "results_count" integer default 0 not null,
  "created_at" timestamp with time zone default now() not null
);

create table if not exists public."site_settings" (
  "key" text not null,
  "value" jsonb not null,
  "description" text,
  "is_public" boolean default false not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."staff_members" (
  "id" uuid default gen_random_uuid() not null,
  "user_id" uuid not null,
  "staff_types" text[] default '{}'::text[] not null,
  "permissions" jsonb default '{}'::jsonb not null,
  "is_active" boolean default true not null,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

create table if not exists public."submissions" (
  "id" uuid default gen_random_uuid() not null,
  "type" text not null,
  "business_id" uuid,
  "payload" jsonb default '{}'::jsonb not null,
  "contact_name" text,
  "contact_phone" text,
  "status" text default 'new'::text not null,
  "assigned_to" uuid,
  "admin_note" text,
  "created_at" timestamp with time zone default now() not null,
  "updated_at" timestamp with time zone default now() not null
);

alter table public."ads" add constraint "ads_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."ads" add constraint "ads_check" CHECK ((end_date >= start_date));
alter table public."ads" add constraint "ads_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."ads" add constraint "ads_image_https" CHECK (is_valid_https_url(image_url));
alter table public."ads" add constraint "ads_pkey" PRIMARY KEY (id);
alter table public."ads" add constraint "ads_placement_check" CHECK ((placement = ANY (ARRAY['homepage_top'::text, 'search_sidebar'::text, 'category_banner'::text, 'popup'::text])));
alter table public."ads" add constraint "ads_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."ads" add constraint "ads_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'active'::text, 'paused'::text, 'expired'::text, 'rejected'::text])));
alter table public."ads" add constraint "ads_target_https" CHECK (is_valid_https_url(target_url));
alter table public."ads" add constraint "ads_title_check" CHECK (((char_length(title) >= 2) AND (char_length(title) <= 120)));
alter table public."announcements" add constraint "announcements_check" CHECK ((end_date >= start_date));
alter table public."announcements" add constraint "announcements_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."announcements" add constraint "announcements_link_https" CHECK (is_valid_https_url(link_url));
alter table public."announcements" add constraint "announcements_pkey" PRIMARY KEY (id);
alter table public."areas" add constraint "areas_city_id_fkey" FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;
alter table public."areas" add constraint "areas_city_id_slug_key" UNIQUE (city_id, slug);
alter table public."areas" add constraint "areas_pkey" PRIMARY KEY (id);
alter table public."audit_logs" add constraint "audit_logs_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."audit_logs" add constraint "audit_logs_pkey" PRIMARY KEY (id);
alter table public."business_events" add constraint "business_events_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."business_events" add constraint "business_events_event_type_check" CHECK ((event_type = ANY (ARRAY['view'::text, 'call'::text, 'whatsapp'::text, 'directions'::text, 'share'::text, 'search_appearance'::text])));
alter table public."business_events" add constraint "business_events_pkey" PRIMARY KEY (id);
alter table public."business_notes" add constraint "business_notes_author_id_fkey" FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public."business_notes" add constraint "business_notes_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."business_notes" add constraint "business_notes_note_check" CHECK (((char_length(note) >= 1) AND (char_length(note) <= 2000)));
alter table public."business_notes" add constraint "business_notes_pkey" PRIMARY KEY (id);
alter table public."businesses" add constraint "businesses_area_id_fkey" FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL;
alter table public."businesses" add constraint "businesses_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."businesses" add constraint "businesses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
alter table public."businesses" add constraint "businesses_city_id_fkey" FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE RESTRICT;
alter table public."businesses" add constraint "businesses_city_id_slug_key" UNIQUE (city_id, slug);
alter table public."businesses" add constraint "businesses_cover_https" CHECK (is_valid_https_url(cover_url));
alter table public."businesses" add constraint "businesses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."businesses" add constraint "businesses_facebook_https" CHECK (is_valid_https_url(facebook_url));
alter table public."businesses" add constraint "businesses_gallery_https" CHECK (are_valid_https_urls(gallery_urls));
alter table public."businesses" add constraint "businesses_instagram_https" CHECK (is_valid_https_url(instagram_url));
alter table public."businesses" add constraint "businesses_logo_https" CHECK (is_valid_https_url(logo_url));
alter table public."businesses" add constraint "businesses_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."businesses" add constraint "businesses_owner_photo_https" CHECK (is_valid_https_url(owner_photo_url));
alter table public."businesses" add constraint "businesses_pkey" PRIMARY KEY (id);
alter table public."businesses" add constraint "businesses_plan_code_fkey" FOREIGN KEY (plan_code) REFERENCES plans(code);
alter table public."businesses" add constraint "businesses_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'published'::text, 'rejected'::text, 'suspended'::text, 'archived'::text])));
alter table public."businesses" add constraint "businesses_tiktok_https" CHECK (is_valid_https_url(tiktok_url));
alter table public."businesses" add constraint "businesses_videos_https" CHECK (are_valid_https_urls(video_urls));
alter table public."businesses" add constraint "businesses_website_https" CHECK (is_valid_https_url(website_url));
alter table public."businesses" add constraint "businesses_youtube_https" CHECK (is_valid_https_url(youtube_url));
alter table public."categories" add constraint "categories_parent_id_fkey" FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
alter table public."categories" add constraint "categories_pkey" PRIMARY KEY (id);
alter table public."categories" add constraint "categories_slug_key" UNIQUE (slug);
alter table public."cities" add constraint "cities_pkey" PRIMARY KEY (id);
alter table public."cities" add constraint "cities_slug_key" UNIQUE (slug);
alter table public."daily_business_stats" add constraint "daily_business_stats_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."daily_business_stats" add constraint "daily_business_stats_pkey" PRIMARY KEY (business_id, stat_date);
alter table public."emergency_contacts" add constraint "emergency_contacts_category_check" CHECK ((category = ANY (ARRAY['rescue'::text, 'police'::text, 'fire'::text, 'ambulance'::text, 'hospital'::text, 'utility'::text, 'general'::text])));
alter table public."emergency_contacts" add constraint "emergency_contacts_city_id_fkey" FOREIGN KEY (city_id) REFERENCES cities(id) ON DELETE CASCADE;
alter table public."emergency_contacts" add constraint "emergency_contacts_name_en_phone_key" UNIQUE (name_en, phone);
alter table public."emergency_contacts" add constraint "emergency_contacts_pkey" PRIMARY KEY (id);
alter table public."import_batches" add constraint "import_batches_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."import_batches" add constraint "import_batches_pkey" PRIMARY KEY (id);
alter table public."inquiries" add constraint "inquiries_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."inquiries" add constraint "inquiries_handled_by_fkey" FOREIGN KEY (handled_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."inquiries" add constraint "inquiries_message_check" CHECK (((char_length(message) >= 5) AND (char_length(message) <= 1000)));
alter table public."inquiries" add constraint "inquiries_name_check" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 100)));
alter table public."inquiries" add constraint "inquiries_pkey" PRIMARY KEY (id);
alter table public."inquiries" add constraint "inquiries_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'read'::text, 'handled'::text])));
alter table public."leads" add constraint "leads_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."leads" add constraint "leads_converted_business_id_fkey" FOREIGN KEY (converted_business_id) REFERENCES businesses(id) ON DELETE SET NULL;
alter table public."leads" add constraint "leads_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."leads" add constraint "leads_name_check" CHECK (((char_length(name) >= 2) AND (char_length(name) <= 100)));
alter table public."leads" add constraint "leads_notes_check" CHECK (((notes IS NULL) OR (char_length(notes) <= 2000)));
alter table public."leads" add constraint "leads_pkey" PRIMARY KEY (id);
alter table public."leads" add constraint "leads_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'interested'::text, 'paid'::text, 'converted'::text, 'dropped'::text, 'not_interested'::text])));
alter table public."notifications" add constraint "notifications_pkey" PRIMARY KEY (id);
alter table public."notifications" add constraint "notifications_type_check" CHECK ((type = ANY (ARRAY['inquiry'::text, 'review'::text, 'listing_status'::text, 'plan_expiring'::text, 'claim'::text, 'general'::text])));
alter table public."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public."offers" add constraint "offers_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."offers" add constraint "offers_check" CHECK ((valid_to >= valid_from));
alter table public."offers" add constraint "offers_image_https" CHECK (is_valid_https_url(image_url));
alter table public."offers" add constraint "offers_pkey" PRIMARY KEY (id);
alter table public."offers" add constraint "offers_status_check" CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'expired'::text])));
alter table public."pages" add constraint "pages_pkey" PRIMARY KEY (id);
alter table public."pages" add constraint "pages_slug_key" UNIQUE (slug);
alter table public."pages" add constraint "pages_updated_by_fkey" FOREIGN KEY (updated_by) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."plans" add constraint "plans_code_check" CHECK ((code = ANY (ARRAY['free'::text, 'basic'::text, 'premium'::text])));
alter table public."plans" add constraint "plans_code_key" UNIQUE (code);
alter table public."plans" add constraint "plans_pkey" PRIMARY KEY (id);
alter table public."profiles" add constraint "profiles_avatar_https" CHECK (is_valid_https_url(avatar_url));
alter table public."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table public."profiles" add constraint "profiles_pkey" PRIMARY KEY (id);
alter table public."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['super_admin'::text, 'staff'::text, 'owner'::text])));
alter table public."rate_limits" add constraint "rate_limits_pkey" PRIMARY KEY (key);
alter table public."reviews" add constraint "reviews_author_name_check" CHECK (((char_length(author_name) >= 2) AND (char_length(author_name) <= 60)));
alter table public."reviews" add constraint "reviews_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE;
alter table public."reviews" add constraint "reviews_comment_check" CHECK ((char_length(comment) <= 500));
alter table public."reviews" add constraint "reviews_owner_reply_check" CHECK (((owner_reply IS NULL) OR (char_length(owner_reply) <= 500)));
alter table public."reviews" add constraint "reviews_pkey" PRIMARY KEY (id);
alter table public."reviews" add constraint "reviews_rating_check" CHECK (((rating >= 1) AND (rating <= 5)));
alter table public."reviews" add constraint "reviews_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])));
alter table public."search_logs" add constraint "search_logs_pkey" PRIMARY KEY (id);
alter table public."site_settings" add constraint "site_settings_pkey" PRIMARY KEY (key);
alter table public."staff_members" add constraint "staff_members_pkey" PRIMARY KEY (id);
alter table public."staff_members" add constraint "staff_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
alter table public."staff_members" add constraint "staff_members_user_id_key" UNIQUE (user_id);
alter table public."submissions" add constraint "submissions_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES profiles(id) ON DELETE SET NULL;
alter table public."submissions" add constraint "submissions_business_id_fkey" FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL;
alter table public."submissions" add constraint "submissions_payload_check" CHECK ((pg_column_size(payload) <= 8192));
alter table public."submissions" add constraint "submissions_pkey" PRIMARY KEY (id);
alter table public."submissions" add constraint "submissions_status_check" CHECK ((status = ANY (ARRAY['new'::text, 'in_review'::text, 'done'::text, 'rejected'::text])));
alter table public."submissions" add constraint "submissions_type_check" CHECK ((type = ANY (ARRAY['new_business'::text, 'correction'::text, 'claim'::text, 'phone_suggestion'::text, 'report'::text, 'broken_image'::text, 'plan_upgrade'::text])));

CREATE INDEX IF NOT EXISTS idx_ads_business_id ON public.ads USING btree (business_id)
CREATE INDEX IF NOT EXISTS idx_ads_created_by ON public.ads USING btree (created_by)
CREATE INDEX IF NOT EXISTS idx_ads_reviewed_by ON public.ads USING btree (reviewed_by)
CREATE INDEX IF NOT EXISTS idx_announcements_created_by ON public.announcements USING btree (created_by)
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs USING btree (created_at DESC)
CREATE INDEX IF NOT EXISTS idx_audit_entity ON public.audit_logs USING btree (entity, entity_id)
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON public.audit_logs USING btree (actor_id)
CREATE INDEX IF NOT EXISTS idx_events_business_type_date ON public.business_events USING btree (business_id, event_type, created_at)
CREATE INDEX IF NOT EXISTS idx_business_notes_author_id ON public.business_notes USING btree (author_id)
CREATE INDEX IF NOT EXISTS idx_business_notes_business_id ON public.business_notes USING btree (business_id)
CREATE INDEX IF NOT EXISTS idx_businesses_area ON public.businesses USING btree (area_id)
CREATE INDEX IF NOT EXISTS idx_businesses_assigned_to ON public.businesses USING btree (assigned_to)
CREATE INDEX IF NOT EXISTS idx_businesses_category ON public.businesses USING btree (category_id)
CREATE INDEX IF NOT EXISTS idx_businesses_city_status ON public.businesses USING btree (city_id, status)
CREATE INDEX IF NOT EXISTS idx_businesses_created_by ON public.businesses USING btree (created_by)
CREATE INDEX IF NOT EXISTS idx_businesses_name_trgm ON public.businesses USING gin (name_en gin_trgm_ops)
CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses USING btree (owner_id)
CREATE INDEX IF NOT EXISTS idx_businesses_phone ON public.businesses USING btree (phone_normalized)
CREATE INDEX IF NOT EXISTS idx_businesses_plan_code ON public.businesses USING btree (plan_code)
CREATE INDEX IF NOT EXISTS idx_businesses_tags ON public.businesses USING gin (tags)
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories USING btree (parent_id)
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_city_id ON public.emergency_contacts USING btree (city_id)
CREATE INDEX IF NOT EXISTS idx_import_batches_created_by ON public.import_batches USING btree (created_by)
CREATE INDEX IF NOT EXISTS idx_inquiries_business_id ON public.inquiries USING btree (business_id)
CREATE INDEX IF NOT EXISTS idx_inquiries_handled_by ON public.inquiries USING btree (handled_by)
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON public.leads USING btree (assigned_to)
CREATE INDEX IF NOT EXISTS idx_leads_converted_business_id ON public.leads USING btree (converted_business_id)
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads USING btree (created_by)
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications USING btree (user_id, is_read, created_at DESC)
CREATE INDEX IF NOT EXISTS idx_offers_business_id ON public.offers USING btree (business_id)
CREATE INDEX IF NOT EXISTS idx_pages_updated_by ON public.pages USING btree (updated_by)
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON public.reviews USING btree (business_id)
CREATE INDEX IF NOT EXISTS idx_submissions_assigned_to ON public.submissions USING btree (assigned_to)
CREATE INDEX IF NOT EXISTS idx_submissions_business_id ON public.submissions USING btree (business_id)

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin new.updated_at=now(); return new; end $function$
;

CREATE OR REPLACE FUNCTION public.normalize_pk_phone(p text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE
 SET search_path TO ''
AS $function$ declare d text; begin d:=regexp_replace(coalesce(p,''),'[^0-9]','','g'); if left(d,2)='92' then return '+'||d; elsif left(d,1)='0' then return '+92'||substring(d from 2); elsif length(d)=10 then return '+92'||d; else return nullif('+'||d,'+'); end if; end $function$
;

CREATE OR REPLACE FUNCTION public.is_valid_https_url(p text)
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$ select p is null or (char_length(p)<=500 and p ~ '^https://[^[:space:]]+$') $function$
;

CREATE OR REPLACE FUNCTION public.are_valid_https_urls(items text[])
 RETURNS boolean
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO ''
AS $function$ select coalesce(bool_and(public.is_valid_https_url(x)),true) from unnest(coalesce(items,'{}'::text[])) x $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin insert into public.profiles(id,role,full_name) values(new.id,'owner',coalesce(new.raw_user_meta_data->>'full_name','')) on conflict(id) do nothing; return new; end $function$
;

CREATE OR REPLACE FUNCTION private.is_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists(select 1 from public.profiles p where p.id=(select auth.uid()) and p.role='super_admin' and p.is_active) $function$
;

CREATE OR REPLACE FUNCTION private.staff_has_permission(perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select private.is_super_admin() or exists(
 select 1 from public.staff_members s join public.profiles p on p.id=s.user_id
 where s.user_id=(select auth.uid()) and s.is_active and p.is_active and p.role='staff'
 and case
  when s.permissions ? perm then coalesce((s.permissions->>perm)::boolean,false)
  when s.permissions ? 'all' then coalesce((s.permissions->>'all')::boolean,false)
  else case
   when perm='business.create' then s.staff_types && array['data_entry','importer','listing_manager']
   when perm='business.edit_own' then s.staff_types && array['data_entry','listing_manager']
   when perm='business.publish' then s.staff_types && array['listing_manager','moderator']
   when perm='import.run' then s.staff_types && array['importer']
   when perm in('leads.manage','owners.create') then s.staff_types && array['sales_onboarding']
   when perm='tiers.manage' then s.staff_types && array['listing_manager']
   when perm='ads.review' then s.staff_types && array['listing_manager','sales_onboarding','moderator']
   when perm='moderation.review' then s.staff_types && array['moderator','support']
   when perm='support.read' then s.staff_types && array['support']
   when perm='analytics.view' then s.staff_types && array['listing_manager']
   else false end
 end
) $function$
;

CREATE OR REPLACE FUNCTION private.is_owner_of(b_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select exists(select 1 from public.businesses b join public.profiles p on p.id=b.owner_id where b.id=b_id and b.owner_id=(select auth.uid()) and p.is_active) $function$
;

CREATE OR REPLACE FUNCTION private.effective_plan(b_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$ select case when b.plan_expires_at is not null and b.plan_expires_at<now() then 'free' else b.plan_code end from public.businesses b where b.id=b_id $function$
;

CREATE OR REPLACE FUNCTION public.my_permissions()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
select jsonb_build_object(
 'role',p.role,
 'is_active',p.is_active and (case when p.role='staff' then coalesce(s.is_active,false) else true end),
 'staff_types',coalesce(s.staff_types,'{}'::text[]),
 'permissions',case when p.role='super_admin' and p.is_active then
 to_jsonb(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage'])
 else coalesce((select jsonb_agg(z.perm) from unnest(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage']) as z(perm) where private.staff_has_permission(z.perm)),'[]'::jsonb) end
)
from public.profiles p left join public.staff_members s on s.user_id=p.id
where p.id=(select auth.uid())
$function$
;

CREATE OR REPLACE FUNCTION public.guard_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin
 if auth.uid() is not null then
  if (new.role is distinct from old.role or new.is_active is distinct from old.is_active) and not private.is_super_admin() then raise exception 'Only super admin can change role or active status'; end if;
 elsif current_user not in ('service_role','postgres') then raise exception 'Privileged profile updates require an authorized server';
 end if;
 return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.guard_business_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin
 if current_setting('app.approving_submission',true)='true' or current_setting('app.recalculating_rating',true)='true' then return new; end if;
 if auth.uid() is not null and not private.is_super_admin()
 and not private.staff_has_permission('business.publish')
 and not private.staff_has_permission('business.edit_own') then
  if new.status is distinct from old.status and not (old.status in('draft','rejected') and new.status='pending_approval') then raise exception 'Business status is managed by staff'; end if;
  if new.plan_code is distinct from old.plan_code or new.plan_expires_at is distinct from old.plan_expires_at or new.is_verified is distinct from old.is_verified or new.is_featured is distinct from old.is_featured or new.view_count is distinct from old.view_count or new.call_count is distinct from old.call_count or new.whatsapp_count is distinct from old.whatsapp_count or new.owner_id is distinct from old.owner_id or new.rating_avg is distinct from old.rating_avg or new.rating_count is distinct from old.rating_count or new.assigned_to is distinct from old.assigned_to or new.source is distinct from old.source or new.published_at is distinct from old.published_at or new.created_by is distinct from old.created_by then raise exception 'Protected business fields cannot be changed by owners'; end if;
 end if; return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.is_business_open_now(p_hours jsonb, p_open_24h boolean)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$
declare local_now timestamp; day_key text; prev_day text; mins int; r jsonb; o int; c int;
begin
 if coalesce(p_open_24h,false) then return true; end if;
 if p_hours is null then return false; end if;
 local_now:=now() at time zone 'Asia/Karachi';
 day_key:=lower(to_char(local_now,'Dy'));
 prev_day:=lower(to_char(local_now-interval '1 day','Dy'));
 mins:=extract(hour from local_now)::int*60+extract(minute from local_now)::int;
 for r in select value from jsonb_array_elements(coalesce(p_hours->day_key,'[]'::jsonb)) loop
  o:=split_part(r->>'open',':',1)::int*60+split_part(r->>'open',':',2)::int;
  c:=split_part(r->>'close',':',1)::int*60+split_part(r->>'close',':',2)::int;
  if (c>o and mins>=o and mins<c) or (c<=o and mins>=o) then return true; end if;
 end loop;
 for r in select value from jsonb_array_elements(coalesce(p_hours->prev_day,'[]'::jsonb)) loop
  o:=split_part(r->>'open',':',1)::int*60+split_part(r->>'open',':',2)::int;
  c:=split_part(r->>'close',':',1)::int*60+split_part(r->>'close',':',2)::int;
  if c<=o and mins<c then return true; end if;
 end loop;
 return false;
exception when others then return false;
end $function$
;

CREATE OR REPLACE FUNCTION public.mark_notifications_read(p_ids uuid[] DEFAULT NULL::uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin update public.notifications set is_read=true where user_id=(select auth.uid()) and (p_ids is null or id=any(p_ids)); end $function$
;

CREATE OR REPLACE FUNCTION public.find_duplicate_businesses(p_phone_normalized text, p_name text, p_area_id uuid DEFAULT NULL::uuid)
 RETURNS SETOF businesses
 LANGUAGE plpgsql
 STABLE
 SET search_path TO ''
AS $function$ begin
 if not private.is_super_admin() and not private.staff_has_permission('business.create') then raise exception 'Permission denied'; end if;
 return query select b.* from public.businesses b
 where (p_phone_normalized is not null and b.phone_normalized=p_phone_normalized)
 or (length(trim(coalesce(p_name,'')))>=3 and lower(b.name_en) like '%'||lower(trim(p_name))||'%')
 order by case when p_phone_normalized is not null and b.phone_normalized=p_phone_normalized then 0 else 1 end,
 case when p_area_id is not null and b.area_id=p_area_id then 0 else 1 end
 limit 20;
end $function$
;

CREATE OR REPLACE FUNCTION private.approve_submission(p_submission_id uuid, p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare s public.submissions%rowtype; p jsonb; city uuid; new_id uuid; begin
 if not private.staff_has_permission('moderation.review') then raise exception 'Permission denied'; end if;
 if p_action not in('approve','reject') then raise exception 'Invalid action'; end if;
 select * into s from public.submissions where id=p_submission_id for update;
 if not found then raise exception 'Submission not found'; end if;
 p:=s.payload; perform set_config('app.approving_submission','true',true);
 if p_action='approve' then
  if s.type='new_business' then
   select id into city from public.cities where slug='sadiqabad';
   insert into public.businesses(city_id,name_en,name_ur,slug,category_id,area_id,address_en,address_ur,phone_primary,whatsapp,description_en,description_ur,logo_url,cover_url,services_en,status,source,created_by,published_at)
   values(city,coalesce(nullif(p->>'name_en',''),'New Sadiqabad Business'),p->>'name_ur',
    lower(regexp_replace(coalesce(nullif(p->>'name_en',''),'new-business'),'[^a-zA-Z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,6),
    (p->>'category_id')::uuid,nullif(p->>'area_id','')::uuid,p->>'address_en',p->>'address_ur',
    coalesce(nullif(p->>'phone_primary',''),s.contact_phone),p->>'whatsapp',p->>'description_en',p->>'description_ur',p->>'logo_url',p->>'cover_url',
    case when jsonb_typeof(p->'services_en')='array' then array(select jsonb_array_elements_text(p->'services_en')) else '{}'::text[] end,
    'published','visitor_submission',auth.uid(),now()) returning id into new_id;
  elsif s.type in('correction','phone_suggestion') and s.business_id is not null then
   update public.businesses set phone_primary=coalesce(nullif(p->>'phone_primary',''),phone_primary),address_en=coalesce(nullif(p->>'address_en',''),address_en),status=case when lower(coalesce(p->>'reason','')) like '%permanently closed%' then 'archived' else status end,updated_at=now() where id=s.business_id;
  elsif s.type='claim' and s.business_id is not null then
   update public.businesses set claimed_at=now(),is_verified=true,owner_name=coalesce(nullif(p->>'owner_name',''),owner_name),updated_at=now() where id=s.business_id;
  elsif s.type='report' and s.business_id is not null then
   update public.businesses set status=case when lower(coalesce(p->>'reason','')) like '%permanently closed%' then 'archived' else status end,updated_at=now() where id=s.business_id;
  elsif s.type='plan_upgrade' and s.business_id is not null then
   if p->>'requested_plan' in('basic','premium') then update public.businesses set plan_code=p->>'requested_plan',plan_expires_at=now()+interval '1 year',updated_at=now() where id=s.business_id; end if;
  end if;
  update public.submissions set status='done',updated_at=now() where id=p_submission_id;
 else update public.submissions set status='rejected',updated_at=now() where id=p_submission_id; end if;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(auth.uid(),'submission.'||p_action,'submissions',p_submission_id::text,jsonb_build_object('type',s.type,'business_id',s.business_id));
end $function$
;

CREATE OR REPLACE FUNCTION public.approve_submission(p_submission_id uuid, p_action text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin perform private.approve_submission(p_submission_id,p_action); end $function$
;

CREATE OR REPLACE FUNCTION private.owner_reply_to_review(p_review_id uuid, p_reply text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
 if char_length(trim(p_reply)) not between 1 and 500 then raise exception 'Reply must be 1-500 characters'; end if;
 update public.reviews r set owner_reply=trim(p_reply),owner_reply_at=now()
 where r.id=p_review_id and private.is_owner_of(r.business_id) and r.owner_reply is null;
 if not found then raise exception 'Review not found, already replied to, or not owned by you'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.owner_reply_to_review(p_review_id uuid, p_reply text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin perform private.owner_reply_to_review(p_review_id,p_reply); end $function$
;

CREATE OR REPLACE FUNCTION public.search_suggestions(p_query text, p_limit integer DEFAULT 8)
 RETURNS TABLE(kind text, label_en text, label_ur text, slug text, subtitle text)
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select * from (
  select 'business'::text kind,b.name_en label_en,coalesce(b.name_ur,b.name_en) label_ur,b.slug,coalesce(a.name_en,'Sadiqabad') subtitle
  from public.businesses b left join public.areas a on a.id=b.area_id
  where b.status='published' and (b.name_en ilike '%'||trim(p_query)||'%' or coalesce(b.name_ur,'') ilike '%'||trim(p_query)||'%' or exists(select 1 from unnest(b.tags) t where t ilike '%'||trim(p_query)||'%'))
  union all
  select 'category',c.name_en,c.name_ur,c.slug,'Category' from public.categories c
  where c.is_active and (c.name_en ilike '%'||trim(p_query)||'%' or c.name_ur ilike '%'||trim(p_query)||'%' or exists(select 1 from unnest(c.synonyms) s where s ilike '%'||trim(p_query)||'%'))
  union all
  select 'area',a.name_en,a.name_ur,a.slug,'Neighborhood' from public.areas a
  where a.is_active and (a.name_en ilike '%'||trim(p_query)||'%' or a.name_ur ilike '%'||trim(p_query)||'%')
 ) suggestions limit greatest(1,least(coalesce(p_limit,8),20))
$function$
;

CREATE OR REPLACE FUNCTION public.search_businesses(p_query text DEFAULT NULL::text, p_category text DEFAULT NULL::text, p_area text DEFAULT NULL::text, p_open_now boolean DEFAULT false, p_verified boolean DEFAULT false, p_has_offer boolean DEFAULT false, p_min_rating numeric DEFAULT NULL::numeric, p_delivery boolean DEFAULT false, p_lat numeric DEFAULT NULL::numeric, p_lng numeric DEFAULT NULL::numeric, p_sort text DEFAULT 'relevance'::text, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0)
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 with matched as (
  select b.*,
   case when p_lat is not null and p_lng is not null and b.lat is not null and b.lng is not null
   then 6371*2*asin(sqrt(power(sin(radians((b.lat-p_lat)/2)),2)+cos(radians(p_lat))*cos(radians(b.lat))*power(sin(radians((b.lng-p_lng)/2)),2))) end distance_km,
   count(*) over() total_count
  from public.businesses b
  left join public.categories c on c.id=b.category_id
  left join public.areas a on a.id=b.area_id
  where b.status='published'
   and (nullif(trim(p_query),'') is null or b.name_en ilike '%'||trim(p_query)||'%' or coalesce(b.name_ur,'') ilike '%'||trim(p_query)||'%' or coalesce(b.description_en,'') ilike '%'||trim(p_query)||'%' or exists(select 1 from unnest(b.tags) t where t ilike '%'||trim(p_query)||'%') or exists(select 1 from unnest(c.synonyms) s where s ilike '%'||trim(p_query)||'%'))
   and (p_category is null or c.slug=p_category or c.id::text=p_category)
   and (p_area is null or a.slug=p_area or a.id::text=p_area)
   and (not p_open_now or public.is_business_open_now(b.opening_hours,b.is_open_24h))
   and (not p_verified or b.is_verified)
   and (p_min_rating is null or coalesce(b.rating_avg,0)>=p_min_rating)
   and (not p_delivery or b.home_delivery)
   and (not p_has_offer or exists(select 1 from public.offers o where o.business_id=b.id and o.status='active' and current_date between o.valid_from and o.valid_to))
 )
 select (to_jsonb(m) - 'distance_km' - 'total_count') ||
 jsonb_build_object(
 'category',(select to_jsonb(c) from public.categories c where c.id=m.category_id),
 'area',(select to_jsonb(a) from public.areas a where a.id=m.area_id),
 'plan',(select to_jsonb(pl) from public.plans pl where pl.code=case when m.plan_expires_at is not null and m.plan_expires_at<now() then 'free' else m.plan_code end),
 'effective_features',(select pl.features from public.plans pl where pl.code=case when m.plan_expires_at is not null and m.plan_expires_at<now() then 'free' else m.plan_code end),
 'effective_limits',(select pl.limits from public.plans pl where pl.code=case when m.plan_expires_at is not null and m.plan_expires_at<now() then 'free' else m.plan_code end),
 'active_offers',coalesce((select jsonb_agg(to_jsonb(o)) from public.offers o where o.business_id=m.id and o.status='active' and current_date between o.valid_from and o.valid_to),'[]'::jsonb),
 'approved_reviews',coalesce((select jsonb_agg(to_jsonb(r)) from public.reviews r where r.business_id=m.id and r.status='approved'),'[]'::jsonb),
 'distance_km',m.distance_km,'total_count',m.total_count)
 from matched m
 order by
 case when p_sort='rating' then coalesce(m.rating_avg,0) end desc,
 case when p_sort='nearest' then m.distance_km end asc nulls last,
 case when p_sort='newest' then extract(epoch from m.created_at) end desc,
 case when p_sort='relevance' then (case when m.is_featured then 1 else 0 end + case when m.plan_code='premium' then 3 when m.plan_code='basic' then 2 else 1 end) end desc,
 m.name_en asc
 limit greatest(1,least(coalesce(p_limit,20),100)) offset greatest(0,coalesce(p_offset,0))
$function$
;

CREATE OR REPLACE FUNCTION public.get_business_public(p_slug text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select to_jsonb(b) || jsonb_build_object(
 'category',(select to_jsonb(c) from public.categories c where c.id=b.category_id),
 'area',(select to_jsonb(a) from public.areas a where a.id=b.area_id),
 'plan',(select to_jsonb(pl) from public.plans pl where pl.code=case when b.plan_expires_at is not null and b.plan_expires_at<now() then 'free' else b.plan_code end),
 'effective_features',(select pl.features from public.plans pl where pl.code=case when b.plan_expires_at is not null and b.plan_expires_at<now() then 'free' else b.plan_code end),
 'effective_limits',(select pl.limits from public.plans pl where pl.code=case when b.plan_expires_at is not null and b.plan_expires_at<now() then 'free' else b.plan_code end),
 'active_offers',coalesce((select jsonb_agg(to_jsonb(o)) from public.offers o where o.business_id=b.id and o.status='active' and current_date between o.valid_from and o.valid_to),'[]'::jsonb),
 'approved_reviews',coalesce((select jsonb_agg(to_jsonb(r)) from public.reviews r where r.business_id=b.id and r.status='approved'),'[]'::jsonb)
 ) from public.businesses b where b.slug=p_slug and b.status='published' limit 1
$function$
;

CREATE OR REPLACE FUNCTION public.related_businesses(p_business_id uuid, p_limit integer DEFAULT 6)
 RETURNS SETOF jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$
 select to_jsonb(b) || jsonb_build_object('category',(select to_jsonb(c) from public.categories c where c.id=b.category_id),'area',(select to_jsonb(a) from public.areas a where a.id=b.area_id),'plan',(select to_jsonb(pl) from public.plans pl where pl.code=b.plan_code))
 from public.businesses b where b.status='published' and b.id<>p_business_id and b.category_id=(select category_id from public.businesses where id=p_business_id)
 order by b.is_featured desc,b.rating_avg desc nulls last limit greatest(1,least(coalesce(p_limit,6),20))
$function$
;

CREATE OR REPLACE FUNCTION public.admin_dashboard_counts()
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ select jsonb_build_object(
 'pending_businesses',(select count(*) from public.businesses where status='pending_approval'),
 'pending_reviews',(select count(*) from public.reviews where status='pending'),
 'new_submissions',(select count(*) from public.submissions where status in('new','in_review')),
 'open_leads',(select count(*) from public.leads where status in('new','contacted','interested')),
 'expiring_plans',(select count(*) from public.businesses where plan_expires_at between now() and now()+interval '30 days'),
 'published_businesses',(select count(*) from public.businesses where status='published')
) where private.is_super_admin() or private.staff_has_permission('business.create') or private.staff_has_permission('moderation.review') or private.staff_has_permission('support.read') $function$
;

CREATE OR REPLACE FUNCTION public.owner_dashboard_stats(p_business_id uuid, p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ select jsonb_build_object(
 'totals',jsonb_build_object('views',coalesce((select sum(views) from public.daily_business_stats where business_id=p_business_id),0),'calls',coalesce((select sum(calls) from public.daily_business_stats where business_id=p_business_id),0),'whatsapp',coalesce((select sum(whatsapp) from public.daily_business_stats where business_id=p_business_id),0),'directions',coalesce((select sum(directions) from public.daily_business_stats where business_id=p_business_id),0),'shares',coalesce((select sum(shares) from public.daily_business_stats where business_id=p_business_id),0)),
 'series',coalesce((select jsonb_agg(to_jsonb(x) order by x.stat_date) from (select * from public.daily_business_stats where business_id=p_business_id and stat_date>=current_date-greatest(1,least(p_days,90))) x),'[]'::jsonb),
 'top_search_terms','[]'::jsonb
) where private.is_owner_of(p_business_id) $function$
;

CREATE OR REPLACE FUNCTION public.admin_analytics(p_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ select jsonb_build_object(
 'daily_traffic',coalesce((select jsonb_agg(jsonb_build_object('date',x.stat_date,'views',x.v,'calls',x.c,'whatsapp',x.w) order by x.stat_date) from (select stat_date,sum(views) v,sum(calls) c,sum(whatsapp) w from public.daily_business_stats where stat_date>=current_date-greatest(1,least(p_days,365)) group by stat_date) x),'[]'::jsonb),
 'top_businesses',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name_en',name_en,'slug',slug,'views',view_count,'calls',call_count)) from (select id,name_en,slug,view_count,call_count from public.businesses order by view_count desc limit 8) q),'[]'::jsonb),
 'top_categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'name_en',c.name_en,'name_ur',c.name_ur,'count',x.n)) from public.categories c join (select category_id,count(*) n from public.businesses group by category_id) x on x.category_id=c.id),'[]'::jsonb),
 'top_searches',coalesce((select jsonb_agg(jsonb_build_object('query',q.query,'count',q.n) order by q.n desc) from (select query,count(*) n from public.search_logs where created_at>now()-make_interval(days=>greatest(1,least(p_days,365))) group by query order by n desc limit 10) q),'[]'::jsonb),
 'zero_result_searches',coalesce((select jsonb_agg(jsonb_build_object('query',q.query,'count',q.n) order by q.n desc) from (select query,count(*) n from public.search_logs where results_count=0 and created_at>now()-make_interval(days=>greatest(1,least(p_days,365))) group by query order by n desc limit 10) q),'[]'::jsonb),
 'ad_performance',coalesce((select jsonb_agg(jsonb_build_object('id',id,'title',title,'placement',placement,'impressions',impressions,'clicks',clicks,'ctr',case when impressions>0 then round(clicks::numeric*100/impressions,1) else 0 end)) from public.ads),'[]'::jsonb)
) where private.is_super_admin() or private.staff_has_permission('analytics.view') $function$
;

CREATE OR REPLACE FUNCTION public.convert_lead(p_lead_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ declare l public.leads%rowtype; city uuid; cat uuid; new_id uuid; begin
 if not private.staff_has_permission('leads.manage') then raise exception 'Permission denied'; end if;
 select * into l from public.leads where id=p_lead_id for update;
 if not found then raise exception 'Lead not found'; end if;
 select id into city from public.cities where slug='sadiqabad';
 select id into cat from public.categories where is_active order by sort_order limit 1;
 insert into public.businesses(city_id,name_en,slug,category_id,phone_primary,phone_normalized,address_en,status,source,created_by)
 values(city,l.name,lower(regexp_replace(l.name,'[^a-zA-Z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,6),cat,l.phone,public.normalize_pk_phone(l.phone),l.address,'draft','lead_conversion',(select auth.uid()))
 returning id into new_id;
 update public.leads set status='converted',converted_business_id=new_id,updated_at=now() where id=p_lead_id;
 return new_id;
end $function$
;

CREATE OR REPLACE FUNCTION public.recalculate_business_rating()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare target uuid; begin
 target:=coalesce(new.business_id,old.business_id);
 perform set_config('app.recalculating_rating','true',true);
 update public.businesses b set
 rating_count=(select count(*) from public.reviews r where r.business_id=target and r.status='approved'),
 rating_avg=(select round(avg(r.rating)::numeric,1) from public.reviews r where r.business_id=target and r.status='approved')
 where b.id=target;
 return coalesce(new,old);
end $function$
;

CREATE OR REPLACE FUNCTION public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare current_count int; begin
 insert into public.rate_limits(key,window_start,count) values(p_key,now(),1)
 on conflict(key) do update set
  window_start=case when public.rate_limits.window_start + make_interval(secs=>greatest(1,p_window_seconds))<=now() then now() else public.rate_limits.window_start end,
  count=case when public.rate_limits.window_start + make_interval(secs=>greatest(1,p_window_seconds))<=now() then 1 else public.rate_limits.count+1 end
 returning count into current_count;
 return current_count<=greatest(1,p_limit);
end $function$
;

CREATE OR REPLACE FUNCTION public.audit_log_record()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare row_id text; begin
 row_id:=coalesce(to_jsonb(new)->>'id',to_jsonb(old)->>'id');
 insert into public.audit_logs(actor_id,action,entity,entity_id,details)
 values(auth.uid(),tg_op, tg_table_name,row_id,jsonb_build_object('changed_at',now()));
 return coalesce(new,old);
end $function$
;

CREATE OR REPLACE FUNCTION public.expire_plans_and_offers()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
 update public.businesses set plan_code='free',plan_expires_at=null,updated_at=now()
 where plan_expires_at is not null and plan_expires_at<now() and plan_code<>'free';
 update public.offers set status='expired',updated_at=now()
 where status='active' and valid_to<current_date;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_business_owner()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare owner uuid; begin
 select owner_id into owner from public.businesses where id=new.business_id;
 if owner is not null then
  if tg_table_name='inquiries' then
   insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path)
   values(owner,'inquiry','New inquiry from '||new.name,new.name||' کی جانب سے نیا پیغام',left(new.message,100),left(new.message,100),'/owner/inquiries');
  elsif tg_table_name='reviews' then
   insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path)
   values(owner,'review','New review from '||new.author_name,new.author_name||' کی جانب سے نیا تبصرہ',new.rating::text||' stars — '||left(new.comment,80),new.rating::text||' ستارے — '||left(new.comment,80),'/owner/reviews');
  end if;
 end if; return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.trg_normalize_business_phone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin new.phone_normalized:=public.normalize_pk_phone(new.phone_primary); return new; end $function$
;

CREATE OR REPLACE FUNCTION public.trg_normalize_lead_phone()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ begin new.phone_normalized:=public.normalize_pk_phone(new.phone); return new; end $function$
;

CREATE OR REPLACE FUNCTION public.enforce_business_plan_limits()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ declare plan_code text; limits jsonb; features jsonb; social_count int; begin
 if auth.uid() is not null and (private.is_super_admin() or private.staff_has_permission('business.edit_own') or private.staff_has_permission('business.publish')) then return new; end if;
 plan_code:=case when new.plan_expires_at is not null and new.plan_expires_at<now() then 'free' else new.plan_code end;
 select p.limits,p.features into limits,features from public.plans p where p.code=plan_code;
 if limits is null then raise exception 'Business plan is not configured'; end if;
 if coalesce(array_length(new.gallery_urls,1),0)>coalesce((limits->>'max_photos')::int,0) then raise exception 'Your plan photo limit has been reached'; end if;
 if coalesce(array_length(new.video_urls,1),0)>coalesce((limits->>'max_videos')::int,0) then raise exception 'Your plan video limit has been reached'; end if;
 social_count:=(new.website_url is not null)::int+(new.facebook_url is not null)::int+(new.instagram_url is not null)::int+(new.youtube_url is not null)::int+(new.tiktok_url is not null)::int;
 if social_count>coalesce((limits->>'social_links')::int,0) then raise exception 'Your plan social link limit has been reached'; end if;
 if new.whatsapp is not null and coalesce((features->>'whatsapp')::boolean,false)=false then raise exception 'WhatsApp is not included in your current plan'; end if;
 if new.cover_url is not null and coalesce((features->>'cover')::boolean,false)=false then raise exception 'Cover images are not included in your current plan'; end if;
 if coalesce(array_length(new.gallery_urls,1),0)>0 and coalesce((features->>'gallery')::boolean,false)=false then raise exception 'Photo galleries are not included in your current plan'; end if;
 if coalesce(array_length(new.video_urls,1),0)>0 and coalesce((features->>'videos')::boolean,false)=false then raise exception 'Videos are not included in your current plan'; end if;
 if social_count>0 and coalesce((features->>'social_links')::boolean,false)=false then raise exception 'Social links are not included in your current plan'; end if;
 return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.enforce_offer_plan_limit()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$ declare plan_code text; max_offers int; used int; begin
 if auth.uid() is not null and (private.is_super_admin() or private.staff_has_permission('tiers.manage')) then return new; end if;
 if not private.is_owner_of(new.business_id) then raise exception 'Only the business owner can manage offers'; end if;
 plan_code:=private.effective_plan(new.business_id);
 select coalesce((limits->>'offers')::int,0) into max_offers from public.plans where code=plan_code;
 select count(*) into used from public.offers where business_id=new.business_id and id<>new.id;
 if used>=coalesce(max_offers,0) then raise exception 'Your plan offer limit has been reached'; end if;
 return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.increment_business_stat(b_id uuid, stat text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ declare d date; begin
 if stat not in('view','call','whatsapp','directions','share','search_appearance') then raise exception 'Invalid business stat'; end if;
 d:=(now() at time zone 'Asia/Karachi')::date;
 update public.businesses set
  view_count=view_count+case when stat='view' then 1 else 0 end,
  call_count=call_count+case when stat='call' then 1 else 0 end,
  whatsapp_count=whatsapp_count+case when stat='whatsapp' then 1 else 0 end
 where id=b_id and status='published';
 insert into public.daily_business_stats(business_id,stat_date,views,calls,whatsapp,directions,shares)
 values(b_id,d,(stat='view')::int,(stat='call')::int,(stat='whatsapp')::int,(stat='directions')::int,(stat='share')::int)
 on conflict(business_id,stat_date) do update set
  views=public.daily_business_stats.views+excluded.views,
  calls=public.daily_business_stats.calls+excluded.calls,
  whatsapp=public.daily_business_stats.whatsapp+excluded.whatsapp,
  directions=public.daily_business_stats.directions+excluded.directions,
  shares=public.daily_business_stats.shares+excluded.shares;
end $function$
;

CREATE OR REPLACE FUNCTION public.increment_views(b_id uuid)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ select public.increment_business_stat(b_id,'view') $function$
;

CREATE OR REPLACE FUNCTION public.increment_ad_stat(p_ad_id uuid, p_stat text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ begin
 if p_stat='impression' then update public.ads set impressions=impressions+1 where id=p_ad_id and status='active';
 elsif p_stat='click' then update public.ads set clicks=clicks+1 where id=p_ad_id and status='active';
 else raise exception 'Invalid ad stat'; end if;
end $function$
;

CREATE OR REPLACE FUNCTION public.is_staff_active()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ select coalesce((select s.is_active and p.is_active from public.staff_members s join public.profiles p on p.id=s.user_id where s.user_id=(select auth.uid())),false) $function$
;

CREATE OR REPLACE FUNCTION public.has_staff_permission(perm text)
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SET search_path TO ''
AS $function$ select private.staff_has_permission(perm) $function$
;

alter table public."ads" enable row level security;
alter table public."announcements" enable row level security;
alter table public."areas" enable row level security;
alter table public."audit_logs" enable row level security;
alter table public."business_events" enable row level security;
alter table public."business_notes" enable row level security;
alter table public."businesses" enable row level security;
alter table public."categories" enable row level security;
alter table public."cities" enable row level security;
alter table public."daily_business_stats" enable row level security;
alter table public."emergency_contacts" enable row level security;
alter table public."import_batches" enable row level security;
alter table public."inquiries" enable row level security;
alter table public."leads" enable row level security;
alter table public."notifications" enable row level security;
alter table public."offers" enable row level security;
alter table public."pages" enable row level security;
alter table public."plans" enable row level security;
alter table public."profiles" enable row level security;
alter table public."rate_limits" enable row level security;
alter table public."reviews" enable row level security;
alter table public."search_logs" enable row level security;
alter table public."site_settings" enable row level security;
alter table public."staff_members" enable row level security;
alter table public."submissions" enable row level security;

create policy "ads_anon_read" on public."ads" as permissive for select to "anon" using (((status = 'active'::text) AND ((CURRENT_DATE >= start_date) AND (CURRENT_DATE <= end_date))));
create policy "ads_auth_read" on public."ads" as permissive for select to "authenticated" using ((((status = 'active'::text) AND ((CURRENT_DATE >= start_date) AND (CURRENT_DATE <= end_date))) OR private.staff_has_permission('ads.review'::text)));
create policy "ads_delete" on public."ads" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('ads.review'::text)));
create policy "ads_insert" on public."ads" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.staff_has_permission('ads.review'::text)));
create policy "ads_update" on public."ads" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('ads.review'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('ads.review'::text)));
create policy "announcements_anon_read" on public."announcements" as permissive for select to "anon" using ((is_active AND ((now() >= start_date) AND (now() <= end_date))));
create policy "announcements_auth_read" on public."announcements" as permissive for select to "authenticated" using (((is_active AND ((now() >= start_date) AND (now() <= end_date))) OR private.is_super_admin() OR private.staff_has_permission('announcements.manage'::text)));
create policy "announcements_delete" on public."announcements" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('announcements.manage'::text)));
create policy "announcements_insert" on public."announcements" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.staff_has_permission('announcements.manage'::text)));
create policy "announcements_update" on public."announcements" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('announcements.manage'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('announcements.manage'::text)));
create policy "areas_admin_delete" on public."areas" as permissive for delete to "authenticated" using (private.is_super_admin());
create policy "areas_admin_insert" on public."areas" as permissive for insert to "authenticated" with check (private.is_super_admin());
create policy "areas_admin_update" on public."areas" as permissive for update to "authenticated" using (private.is_super_admin()) with check (private.is_super_admin());
create policy "areas_anon_read" on public."areas" as permissive for select to "anon" using (is_active);
create policy "areas_auth_read" on public."areas" as permissive for select to "authenticated" using ((is_active OR private.is_super_admin() OR private.staff_has_permission('business.create'::text)));
create policy "audit_read" on public."audit_logs" as permissive for select to "authenticated" using (private.is_super_admin());
create policy "events_read" on public."business_events" as permissive for select to "authenticated" using (private.staff_has_permission('analytics.view'::text));
create policy "notes_manage" on public."business_notes" as permissive for all to "authenticated" using ((private.staff_has_permission('business.edit_own'::text) OR private.is_super_admin())) with check ((private.staff_has_permission('business.edit_own'::text) OR private.is_super_admin()));
create policy "businesses_admin_delete" on public."businesses" as permissive for delete to "authenticated" using (private.is_super_admin());
create policy "businesses_anon_read" on public."businesses" as permissive for select to "anon" using ((status = 'published'::text));
create policy "businesses_auth_read" on public."businesses" as permissive for select to "authenticated" using (((status = 'published'::text) OR (owner_id = ( SELECT auth.uid() AS uid)) OR private.is_super_admin() OR private.staff_has_permission('business.create'::text) OR private.staff_has_permission('business.publish'::text)));
create policy "businesses_staff_insert" on public."businesses" as permissive for insert to "authenticated" with check (private.staff_has_permission('business.create'::text));
create policy "businesses_update" on public."businesses" as permissive for update to "authenticated" using (((owner_id = ( SELECT auth.uid() AS uid)) OR private.is_super_admin() OR private.staff_has_permission('business.edit_own'::text) OR private.staff_has_permission('business.publish'::text))) with check (((owner_id = ( SELECT auth.uid() AS uid)) OR private.is_super_admin() OR private.staff_has_permission('business.edit_own'::text) OR private.staff_has_permission('business.publish'::text)));
create policy "categories_admin_delete" on public."categories" as permissive for delete to "authenticated" using (private.is_super_admin());
create policy "categories_admin_insert" on public."categories" as permissive for insert to "authenticated" with check (private.is_super_admin());
create policy "categories_admin_update" on public."categories" as permissive for update to "authenticated" using (private.is_super_admin()) with check (private.is_super_admin());
create policy "categories_anon_read" on public."categories" as permissive for select to "anon" using (is_active);
create policy "categories_auth_read" on public."categories" as permissive for select to "authenticated" using ((is_active OR private.is_super_admin() OR private.staff_has_permission('business.create'::text)));
create policy "cities_read" on public."cities" as permissive for select to "anon", "authenticated" using (is_active);
create policy "stats_read" on public."daily_business_stats" as permissive for select to "authenticated" using ((private.is_owner_of(business_id) OR private.staff_has_permission('analytics.view'::text)));
create policy "emergency_admin_delete" on public."emergency_contacts" as permissive for delete to "authenticated" using (private.is_super_admin());
create policy "emergency_admin_insert" on public."emergency_contacts" as permissive for insert to "authenticated" with check (private.is_super_admin());
create policy "emergency_admin_update" on public."emergency_contacts" as permissive for update to "authenticated" using (private.is_super_admin()) with check (private.is_super_admin());
create policy "emergency_anon_read" on public."emergency_contacts" as permissive for select to "anon" using (is_active);
create policy "emergency_auth_read" on public."emergency_contacts" as permissive for select to "authenticated" using ((is_active OR private.is_super_admin()));
create policy "imports_manage" on public."import_batches" as permissive for all to "authenticated" using (private.staff_has_permission('import.run'::text)) with check (private.staff_has_permission('import.run'::text));
create policy "inquiries_manage" on public."inquiries" as permissive for all to "authenticated" using ((private.is_owner_of(business_id) OR private.staff_has_permission('support.read'::text))) with check ((private.is_owner_of(business_id) OR private.staff_has_permission('support.read'::text)));
create policy "leads_manage" on public."leads" as permissive for all to "authenticated" using (private.staff_has_permission('leads.manage'::text)) with check (private.staff_has_permission('leads.manage'::text));
create policy "notifications_read" on public."notifications" as permissive for select to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid)));
create policy "notifications_update" on public."notifications" as permissive for update to "authenticated" using ((user_id = ( SELECT auth.uid() AS uid))) with check ((user_id = ( SELECT auth.uid() AS uid)));
create policy "offers_anon_read" on public."offers" as permissive for select to "anon" using (((status = 'active'::text) AND (valid_from <= CURRENT_DATE) AND (valid_to >= CURRENT_DATE) AND (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = offers.business_id) AND (b.status = 'published'::text))))));
create policy "offers_auth_read" on public."offers" as permissive for select to "authenticated" using ((((status = 'active'::text) AND (valid_from <= CURRENT_DATE) AND (valid_to >= CURRENT_DATE) AND (EXISTS ( SELECT 1
   FROM businesses b
  WHERE ((b.id = offers.business_id) AND (b.status = 'published'::text))))) OR private.is_super_admin() OR private.is_owner_of(business_id)));
create policy "offers_delete" on public."offers" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.is_owner_of(business_id) OR private.staff_has_permission('tiers.manage'::text)));
create policy "offers_insert" on public."offers" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.is_owner_of(business_id) OR private.staff_has_permission('tiers.manage'::text)));
create policy "offers_update" on public."offers" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.is_owner_of(business_id) OR private.staff_has_permission('tiers.manage'::text))) with check ((private.is_super_admin() OR private.is_owner_of(business_id) OR private.staff_has_permission('tiers.manage'::text)));
create policy "pages_admin_delete" on public."pages" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "pages_admin_insert" on public."pages" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "pages_admin_update" on public."pages" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "pages_anon_read" on public."pages" as permissive for select to "anon" using (is_published);
create policy "pages_auth_read" on public."pages" as permissive for select to "authenticated" using ((is_published OR private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "plans_admin_delete" on public."plans" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('tiers.manage'::text)));
create policy "plans_admin_insert" on public."plans" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.staff_has_permission('tiers.manage'::text)));
create policy "plans_admin_update" on public."plans" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('tiers.manage'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('tiers.manage'::text)));
create policy "plans_anon_read" on public."plans" as permissive for select to "anon" using (is_active);
create policy "plans_auth_read" on public."plans" as permissive for select to "authenticated" using ((is_active OR private.is_super_admin() OR private.staff_has_permission('tiers.manage'::text)));
create policy "profiles_read" on public."profiles" as permissive for select to "authenticated" using (((id = ( SELECT auth.uid() AS uid)) OR private.is_super_admin() OR private.staff_has_permission('owners.create'::text)));
create policy "profiles_update" on public."profiles" as permissive for update to "authenticated" using ((id = ( SELECT auth.uid() AS uid))) with check ((id = ( SELECT auth.uid() AS uid)));
create policy "rate_limits_deny_all" on public."rate_limits" as permissive for all to "anon", "authenticated" using (false) with check (false);
create policy "reviews_anon_read" on public."reviews" as permissive for select to "anon" using ((status = 'approved'::text));
create policy "reviews_auth_read" on public."reviews" as permissive for select to "authenticated" using (((status = 'approved'::text) OR private.is_super_admin() OR private.staff_has_permission('moderation.review'::text) OR private.is_owner_of(business_id)));
create policy "reviews_delete" on public."reviews" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text)));
create policy "reviews_insert" on public."reviews" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text)));
create policy "reviews_update" on public."reviews" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text)));
create policy "search_logs_analytics_read" on public."search_logs" as permissive for select to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('analytics.view'::text)));
create policy "settings_admin_delete" on public."site_settings" as permissive for delete to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "settings_admin_insert" on public."site_settings" as permissive for insert to "authenticated" with check ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "settings_admin_update" on public."site_settings" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "settings_anon_read" on public."site_settings" as permissive for select to "anon" using (is_public);
create policy "settings_auth_read" on public."site_settings" as permissive for select to "authenticated" using ((is_public OR private.is_super_admin() OR private.staff_has_permission('settings.manage'::text)));
create policy "staff_admin_delete" on public."staff_members" as permissive for delete to "authenticated" using (private.is_super_admin());
create policy "staff_admin_insert" on public."staff_members" as permissive for insert to "authenticated" with check (private.is_super_admin());
create policy "staff_admin_update" on public."staff_members" as permissive for update to "authenticated" using (private.is_super_admin()) with check (private.is_super_admin());
create policy "staff_read" on public."staff_members" as permissive for select to "authenticated" using (((user_id = ( SELECT auth.uid() AS uid)) OR private.is_super_admin()));
create policy "submissions_read" on public."submissions" as permissive for select to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text)));
create policy "submissions_update" on public."submissions" as permissive for update to "authenticated" using ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text))) with check ((private.is_super_admin() OR private.staff_has_permission('moderation.review'::text)));

CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON ads FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_enforce_business_plan_limits BEFORE INSERT OR UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION enforce_business_plan_limits();
CREATE TRIGGER trg_guard_business_columns BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION guard_business_columns();
CREATE TRIGGER trg_normalize_business_phone BEFORE INSERT OR UPDATE OF phone_primary ON businesses FOR EACH ROW EXECUTE FUNCTION trg_normalize_business_phone();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON emergency_contacts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_notify_inquiry_owner AFTER INSERT ON inquiries FOR EACH ROW EXECUTE FUNCTION notify_business_owner();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON inquiries FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_normalize_lead_phone BEFORE INSERT OR UPDATE OF phone ON leads FOR EACH ROW EXECUTE FUNCTION trg_normalize_lead_phone();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_enforce_offer_plan_limit BEFORE INSERT OR UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION enforce_offer_plan_limit();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON pages FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_guard_profile_role BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION guard_profile_role();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_notify_review_owner AFTER INSERT ON reviews FOR EACH ROW EXECUTE FUNCTION notify_business_owner();
CREATE TRIGGER trg_recalculate_business_rating AFTER INSERT OR DELETE OR UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION recalculate_business_rating();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_audit_record AFTER INSERT OR DELETE OR UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION audit_log_record();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON staff_members FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER trg_updated_at BEFORE UPDATE ON submissions FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to authenticated, service_role;
revoke execute on all functions in schema public from public;
revoke execute on all functions in schema private from public;
grant SELECT on table public."ads" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."ads" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."ads" to "service_role";
grant SELECT on table public."announcements" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."announcements" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."announcements" to "service_role";
grant SELECT on table public."areas" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."areas" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."areas" to "service_role";
grant SELECT on table public."audit_logs" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."audit_logs" to "service_role";
grant SELECT on table public."business_events" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."business_events" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."business_notes" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."business_notes" to "service_role";
grant SELECT on table public."businesses" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."businesses" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."businesses" to "service_role";
grant SELECT on table public."categories" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."categories" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."categories" to "service_role";
grant SELECT on table public."cities" to "anon";
grant SELECT on table public."cities" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."cities" to "service_role";
grant SELECT on table public."daily_business_stats" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."daily_business_stats" to "service_role";
grant SELECT on table public."emergency_contacts" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."emergency_contacts" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."emergency_contacts" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."import_batches" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."import_batches" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."inquiries" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."inquiries" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."leads" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."leads" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."notifications" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."notifications" to "service_role";
grant SELECT on table public."offers" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."offers" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."offers" to "service_role";
grant SELECT on table public."pages" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."pages" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."pages" to "service_role";
grant SELECT on table public."plans" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."plans" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."plans" to "service_role";
grant SELECT, UPDATE on table public."profiles" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."profiles" to "service_role";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."rate_limits" to "service_role";
grant SELECT on table public."reviews" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."reviews" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."reviews" to "service_role";
grant SELECT on table public."search_logs" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."search_logs" to "service_role";
grant SELECT on table public."site_settings" to "anon";
grant DELETE, INSERT, SELECT, UPDATE on table public."site_settings" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."site_settings" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."staff_members" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."staff_members" to "service_role";
grant DELETE, INSERT, SELECT, UPDATE on table public."submissions" to "authenticated";
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public."submissions" to "service_role";
grant execute on function private."approve_submission"(uuid, text) to "authenticated";
grant execute on function private."approve_submission"(uuid, text) to "service_role";
grant execute on function private."effective_plan"(uuid) to "authenticated";
grant execute on function private."effective_plan"(uuid) to "service_role";
grant execute on function private."is_owner_of"(uuid) to "authenticated";
grant execute on function private."is_owner_of"(uuid) to "service_role";
grant execute on function private."is_super_admin"() to "authenticated";
grant execute on function private."is_super_admin"() to "service_role";
grant execute on function private."owner_reply_to_review"(uuid, text) to "authenticated";
grant execute on function private."owner_reply_to_review"(uuid, text) to "service_role";
grant execute on function private."staff_has_permission"(text) to "authenticated";
grant execute on function private."staff_has_permission"(text) to "service_role";
grant execute on function public."admin_analytics"(integer) to "anon";
grant execute on function public."admin_analytics"(integer) to "authenticated";
grant execute on function public."admin_analytics"(integer) to "service_role";
grant execute on function public."admin_dashboard_counts"() to "anon";
grant execute on function public."admin_dashboard_counts"() to "authenticated";
grant execute on function public."admin_dashboard_counts"() to "service_role";
grant execute on function public."approve_submission"(uuid, text) to "authenticated";
grant execute on function public."approve_submission"(uuid, text) to "service_role";
grant execute on function public."are_valid_https_urls"(text[]) to "anon";
grant execute on function public."are_valid_https_urls"(text[]) to "authenticated";
grant execute on function public."are_valid_https_urls"(text[]) to "service_role";
grant execute on function public."audit_log_record"() to "service_role";
grant execute on function public."check_rate_limit"(text, integer, integer) to "service_role";
grant execute on function public."convert_lead"(uuid) to "anon";
grant execute on function public."convert_lead"(uuid) to "authenticated";
grant execute on function public."convert_lead"(uuid) to "service_role";
grant execute on function public."enforce_business_plan_limits"() to "anon";
grant execute on function public."enforce_business_plan_limits"() to "authenticated";
grant execute on function public."enforce_business_plan_limits"() to "service_role";
grant execute on function public."enforce_offer_plan_limit"() to "anon";
grant execute on function public."enforce_offer_plan_limit"() to "authenticated";
grant execute on function public."enforce_offer_plan_limit"() to "service_role";
grant execute on function public."expire_plans_and_offers"() to "service_role";
grant execute on function public."find_duplicate_businesses"(text, text, uuid) to "anon";
grant execute on function public."find_duplicate_businesses"(text, text, uuid) to "authenticated";
grant execute on function public."find_duplicate_businesses"(text, text, uuid) to "service_role";
grant execute on function public."get_business_public"(text) to "anon";
grant execute on function public."get_business_public"(text) to "authenticated";
grant execute on function public."get_business_public"(text) to "service_role";
grant execute on function public."guard_business_columns"() to "anon";
grant execute on function public."guard_business_columns"() to "authenticated";
grant execute on function public."guard_business_columns"() to "service_role";
grant execute on function public."guard_profile_role"() to "anon";
grant execute on function public."guard_profile_role"() to "authenticated";
grant execute on function public."guard_profile_role"() to "service_role";
grant execute on function public."handle_new_user"() to "service_role";
grant execute on function public."handle_updated_at"() to "anon";
grant execute on function public."handle_updated_at"() to "authenticated";
grant execute on function public."handle_updated_at"() to "service_role";
grant execute on function public."has_staff_permission"(text) to "anon";
grant execute on function public."has_staff_permission"(text) to "authenticated";
grant execute on function public."has_staff_permission"(text) to "service_role";
grant execute on function public."increment_ad_stat"(uuid, text) to "service_role";
grant execute on function public."increment_business_stat"(uuid, text) to "service_role";
grant execute on function public."increment_views"(uuid) to "service_role";
grant execute on function public."is_business_open_now"(jsonb, boolean) to "anon";
grant execute on function public."is_business_open_now"(jsonb, boolean) to "authenticated";
grant execute on function public."is_business_open_now"(jsonb, boolean) to "service_role";
grant execute on function public."is_staff_active"() to "anon";
grant execute on function public."is_staff_active"() to "authenticated";
grant execute on function public."is_staff_active"() to "service_role";
grant execute on function public."is_valid_https_url"(text) to "anon";
grant execute on function public."is_valid_https_url"(text) to "authenticated";
grant execute on function public."is_valid_https_url"(text) to "service_role";
grant execute on function public."mark_notifications_read"(uuid[]) to "anon";
grant execute on function public."mark_notifications_read"(uuid[]) to "authenticated";
grant execute on function public."mark_notifications_read"(uuid[]) to "service_role";
grant execute on function public."my_permissions"() to "authenticated";
grant execute on function public."my_permissions"() to "service_role";
grant execute on function public."normalize_pk_phone"(text) to "anon";
grant execute on function public."normalize_pk_phone"(text) to "authenticated";
grant execute on function public."normalize_pk_phone"(text) to "service_role";
grant execute on function public."notify_business_owner"() to "service_role";
grant execute on function public."owner_dashboard_stats"(uuid, integer) to "anon";
grant execute on function public."owner_dashboard_stats"(uuid, integer) to "authenticated";
grant execute on function public."owner_dashboard_stats"(uuid, integer) to "service_role";
grant execute on function public."owner_reply_to_review"(uuid, text) to "authenticated";
grant execute on function public."owner_reply_to_review"(uuid, text) to "service_role";
grant execute on function public."recalculate_business_rating"() to "service_role";
grant execute on function public."related_businesses"(uuid, integer) to "anon";
grant execute on function public."related_businesses"(uuid, integer) to "authenticated";
grant execute on function public."related_businesses"(uuid, integer) to "service_role";
grant execute on function public."search_businesses"(text, text, text, boolean, boolean, boolean, numeric, boolean, numeric, numeric, text, integer, integer) to "anon";
grant execute on function public."search_businesses"(text, text, text, boolean, boolean, boolean, numeric, boolean, numeric, numeric, text, integer, integer) to "authenticated";
grant execute on function public."search_businesses"(text, text, text, boolean, boolean, boolean, numeric, boolean, numeric, numeric, text, integer, integer) to "service_role";
grant execute on function public."search_suggestions"(text, integer) to "anon";
grant execute on function public."search_suggestions"(text, integer) to "authenticated";
grant execute on function public."search_suggestions"(text, integer) to "service_role";
grant execute on function public."trg_normalize_business_phone"() to "anon";
grant execute on function public."trg_normalize_business_phone"() to "authenticated";
grant execute on function public."trg_normalize_business_phone"() to "service_role";
grant execute on function public."trg_normalize_lead_phone"() to "anon";
grant execute on function public."trg_normalize_lead_phone"() to "authenticated";
grant execute on function public."trg_normalize_lead_phone"() to "service_role";
