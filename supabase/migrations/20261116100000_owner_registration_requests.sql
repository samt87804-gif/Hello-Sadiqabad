-- Public owner registration requests. Account provisioning is deliberately deferred
-- until an authorized administrator approves the request and sends an Auth invitation.
create table if not exists public.owner_registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null check (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  phone text not null check (char_length(btrim(phone)) between 5 and 30),
  business_name text check (business_name is null or char_length(btrim(business_name)) <= 160),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists owner_registration_one_pending_email
  on public.owner_registration_requests (lower(email)) where status = 'pending';
create index if not exists owner_registration_status_created_idx
  on public.owner_registration_requests (status, created_at desc);
alter table public.owner_registration_requests enable row level security;
revoke all on public.owner_registration_requests from anon, authenticated;
grant insert on public.owner_registration_requests to anon, authenticated;
grant select on public.owner_registration_requests to authenticated;
drop policy if exists owner_registration_public_submit on public.owner_registration_requests;
create policy owner_registration_public_submit on public.owner_registration_requests
  for insert to anon, authenticated
  with check (status = 'pending' and reviewed_by is null and reviewed_at is null and admin_note is null);
drop policy if exists owner_registration_admin_read on public.owner_registration_requests;
create policy owner_registration_admin_read on public.owner_registration_requests
  for select to authenticated
  using (private.is_super_admin() or private.staff_has_permission('owners.create'));
comment on table public.owner_registration_requests is
  'Public owner registration requests; no Auth user is created until admin approval.';
