create table if not exists public.owner_password_change_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','approved','rejected','consumed','expired')),
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  expires_at timestamptz,
  consumed_at timestamptz,
  updated_at timestamptz not null default now(),
  check (
    (status = 'pending' and reviewed_at is null and reviewed_by is null and expires_at is null and consumed_at is null)
    or (status = 'approved' and reviewed_at is not null and reviewed_by is not null and expires_at is not null and consumed_at is null)
    or (status = 'rejected' and reviewed_at is not null and reviewed_by is not null and consumed_at is null)
    or (status = 'consumed' and reviewed_at is not null and reviewed_by is not null and expires_at is not null and consumed_at is not null)
    or (status = 'expired' and reviewed_at is not null and reviewed_by is not null and expires_at is not null and consumed_at is null)
  )
);

create index if not exists owner_password_change_requests_admin_queue_idx
  on public.owner_password_change_requests(status, requested_at desc);
create index if not exists owner_password_change_requests_owner_history_idx
  on public.owner_password_change_requests(user_id, requested_at desc);
create unique index if not exists owner_password_change_one_pending_per_owner_uidx
  on public.owner_password_change_requests(user_id) where status = 'pending';

alter table public.owner_password_change_requests enable row level security;
revoke all on public.owner_password_change_requests from anon, authenticated;
grant select, insert on public.owner_password_change_requests to authenticated;
grant all on public.owner_password_change_requests to service_role;

drop policy if exists owner_password_change_owner_read on public.owner_password_change_requests;
create policy owner_password_change_owner_read
  on public.owner_password_change_requests for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists owner_password_change_owner_insert on public.owner_password_change_requests;
create policy owner_password_change_owner_insert
  on public.owner_password_change_requests for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid()) and p.role = 'owner' and p.is_active = true
    )
    and status = 'pending'
    and reviewed_at is null and reviewed_by is null
    and expires_at is null and consumed_at is null and admin_note is null
  );

drop policy if exists owner_password_change_admin_read on public.owner_password_change_requests;
create policy owner_password_change_admin_read
  on public.owner_password_change_requests for select to authenticated
  using (private.is_super_admin() or private.staff_has_permission('moderation.review'));

comment on table public.owner_password_change_requests is
  'Owner password-change approvals. Password material is never stored in this table.';
