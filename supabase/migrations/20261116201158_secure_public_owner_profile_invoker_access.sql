-- Restore public owner-profile directory reads without a SECURITY DEFINER view.
-- Only generated, already-redacted columns are granted to anon. Raw phone/email
-- and all privacy controls remain inaccessible to anon at the base-table level.

alter table public.owner_public_profiles
  add column if not exists public_display_name text
    generated always as (case when is_public and show_name then display_name else null end) stored,
  add column if not exists public_photo_url text
    generated always as (case when is_public and show_photo then photo_url else null end) stored,
  add column if not exists public_phone text
    generated always as (case when is_public and show_phone then phone else null end) stored,
  add column if not exists public_email text
    generated always as (case when is_public and show_email then email else null end) stored;

drop policy if exists owner_public_profiles_anon_public_read on public.owner_public_profiles;
create policy owner_public_profiles_anon_public_read
  on public.owner_public_profiles
  for select
  to anon
  using (is_public and (show_name or show_photo or show_phone or show_email));

grant select (owner_id, public_display_name, public_photo_url, public_phone, public_email)
  on public.owner_public_profiles to anon;

create or replace view public.owner_public_profile_directory
with (security_barrier = true, security_invoker = true)
as
select
  p.owner_id,
  p.public_display_name as display_name,
  p.public_photo_url as photo_url,
  p.public_phone as phone,
  p.public_email as email
from public.owner_public_profiles p;

revoke all on public.owner_public_profile_directory from anon, authenticated;
grant select on public.owner_public_profile_directory to anon, authenticated;
