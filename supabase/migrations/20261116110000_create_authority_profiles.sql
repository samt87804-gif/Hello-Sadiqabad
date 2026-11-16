create table if not exists public.authority_profiles (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name_en text not null check (char_length(name_en) between 2 and 140),
  name_ur text not null default '',
  photo_url text,
  designation_en text,
  designation_ur text,
  organization_en text,
  organization_ur text,
  status_label_en text,
  status_label_ur text,
  authority_en text,
  authority_ur text,
  bio_en text,
  bio_ur text,
  phone text,
  email text,
  website_url text,
  facebook_url text,
  instagram_url text,
  business_ids uuid[] not null default '{}',
  show_status boolean not null default true,
  show_organization boolean not null default true,
  show_authority boolean not null default true,
  show_bio boolean not null default true,
  show_contact boolean not null default true,
  show_businesses boolean not null default true,
  source_url text,
  verified_at timestamptz,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_profiles_city_slug_key unique(city_id,slug),
  constraint authority_profiles_photo_https check (public.is_valid_https_url(photo_url)),
  constraint authority_profiles_website_https check (public.is_valid_https_url(website_url)),
  constraint authority_profiles_facebook_https check (public.is_valid_https_url(facebook_url)),
  constraint authority_profiles_instagram_https check (public.is_valid_https_url(instagram_url)),
  constraint authority_profiles_source_https check (public.is_valid_https_url(source_url))
);

create index if not exists idx_authority_profiles_city_active_sort
  on public.authority_profiles(city_id,is_active,sort_order,name_en);
create index if not exists idx_authority_profiles_business_ids
  on public.authority_profiles using gin(business_ids);

alter table public.authority_profiles enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.authority_profiles to anon, authenticated;
grant insert, update, delete on public.authority_profiles to authenticated;

drop policy if exists authority_profiles_public_read on public.authority_profiles;
create policy authority_profiles_public_read on public.authority_profiles
  for select to anon using (is_active);
drop policy if exists authority_profiles_authenticated_read on public.authority_profiles;
create policy authority_profiles_authenticated_read on public.authority_profiles
  for select to authenticated using (is_active or private.is_super_admin());
drop policy if exists authority_profiles_admin_insert on public.authority_profiles;
create policy authority_profiles_admin_insert on public.authority_profiles
  for insert to authenticated with check (private.is_super_admin());
drop policy if exists authority_profiles_admin_update on public.authority_profiles;
create policy authority_profiles_admin_update on public.authority_profiles
  for update to authenticated using (private.is_super_admin()) with check (private.is_super_admin());
drop policy if exists authority_profiles_admin_delete on public.authority_profiles;
create policy authority_profiles_admin_delete on public.authority_profiles
  for delete to authenticated using (private.is_super_admin());

drop trigger if exists trg_updated_at_authority_profiles on public.authority_profiles;
create trigger trg_updated_at_authority_profiles before update on public.authority_profiles
  for each row execute function public.handle_updated_at();
drop trigger if exists trg_audit_record_authority_profiles on public.authority_profiles;
create trigger trg_audit_record_authority_profiles after insert or update or delete on public.authority_profiles
  for each row execute function public.audit_log_record();

-- Store portraits in the existing public bucket under a dedicated folder.
-- Public reads are inherited from the bucket's public setting; only Super Admins may write.
drop policy if exists authority_profile_images_admin_insert on storage.objects;
create policy authority_profile_images_admin_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'Hello Sadiqabad' and (storage.foldername(name))[1] = 'authority-profiles' and private.is_super_admin());
drop policy if exists authority_profile_images_admin_update on storage.objects;
create policy authority_profile_images_admin_update on storage.objects
  for update to authenticated
  using (bucket_id = 'Hello Sadiqabad' and (storage.foldername(name))[1] = 'authority-profiles' and private.is_super_admin())
  with check (bucket_id = 'Hello Sadiqabad' and (storage.foldername(name))[1] = 'authority-profiles' and private.is_super_admin());
drop policy if exists authority_profile_images_admin_delete on storage.objects;
create policy authority_profile_images_admin_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'Hello Sadiqabad' and (storage.foldername(name))[1] = 'authority-profiles' and private.is_super_admin());
