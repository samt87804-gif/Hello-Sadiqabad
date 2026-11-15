create table if not exists public.owner_public_profiles (
  owner_id uuid primary key references public.profiles(id) on delete cascade,
  display_name text,
  photo_url text,
  phone text,
  email text,
  is_public boolean not null default false,
  show_name boolean not null default false,
  show_photo boolean not null default false,
  show_phone boolean not null default false,
  show_email boolean not null default false,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint owner_public_profiles_display_name_length check (display_name is null or char_length(display_name) <= 120),
  constraint owner_public_profiles_photo_https check (photo_url is null or photo_url ~* '^https://[^[:space:]]+$'),
  constraint owner_public_profiles_phone_length check (phone is null or char_length(phone) <= 40),
  constraint owner_public_profiles_email_length check (email is null or char_length(email) <= 254)
);

alter table public.owner_public_profiles enable row level security;

drop policy if exists owner_public_profiles_admin_read on public.owner_public_profiles;
create policy owner_public_profiles_admin_read
on public.owner_public_profiles for select to authenticated
using (private.is_super_admin() or private.staff_has_permission('owners.create'));

drop policy if exists owner_public_profiles_admin_insert on public.owner_public_profiles;
create policy owner_public_profiles_admin_insert
on public.owner_public_profiles for insert to authenticated
with check (private.is_super_admin() or private.staff_has_permission('owners.create'));

drop policy if exists owner_public_profiles_admin_update on public.owner_public_profiles;
create policy owner_public_profiles_admin_update
on public.owner_public_profiles for update to authenticated
using (private.is_super_admin() or private.staff_has_permission('owners.create'))
with check (private.is_super_admin() or private.staff_has_permission('owners.create'));

revoke all on public.owner_public_profiles from anon, authenticated;
grant select, insert, update on public.owner_public_profiles to authenticated;

create or replace view public.owner_public_profile_directory
with (security_barrier = true)
as
select
  p.owner_id,
  case when p.is_public and p.show_name then p.display_name else null end as display_name,
  case when p.is_public and p.show_photo then p.photo_url else null end as photo_url,
  case when p.is_public and p.show_phone then p.phone else null end as phone,
  case when p.is_public and p.show_email then p.email else null end as email
from public.owner_public_profiles p
where p.is_public
  and (p.show_name or p.show_photo or p.show_phone or p.show_email);

revoke all on public.owner_public_profile_directory from anon, authenticated;
grant select on public.owner_public_profile_directory to anon, authenticated;

create index if not exists idx_businesses_owner_published
on public.businesses(owner_id, status, updated_at desc)
where owner_id is not null and status = 'published';

comment on table public.owner_public_profiles is
'Admin-managed public owner profile and field-level visibility settings. Public users must read the redacted owner_public_profile_directory view only.';
