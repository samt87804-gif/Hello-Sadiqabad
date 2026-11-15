alter table public.owner_registration_requests
  drop constraint if exists owner_registration_requests_status_check;
alter table public.owner_registration_requests
  add constraint owner_registration_requests_status_check
  check (status in ('pending','processing','approved','rejected'));
