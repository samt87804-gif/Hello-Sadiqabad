drop index if exists public.owner_registration_one_pending_email;
create unique index if not exists owner_registration_active_email
  on public.owner_registration_requests (lower(email))
  where status in ('pending','processing','approved');
create index if not exists owner_registration_reviewed_by_idx
  on public.owner_registration_requests (reviewed_by)
  where reviewed_by is not null;
