drop index if exists public.owner_registration_active_email;

create unique index if not exists owner_registration_active_email_legacy
  on public.owner_registration_requests(lower(email))
  where status in ('pending','processing','approved')
    and direct_auth_user_id is null;

create unique index if not exists owner_registration_active_email_direct
  on public.owner_registration_requests(lower(email))
  where status in ('pending','processing','approved')
    and direct_auth_user_id is not null;

comment on index public.owner_registration_active_email_legacy is
  'Preserves email uniqueness within the legacy invitation workflow without blocking applicants from resubmitting through direct registration.';
comment on index public.owner_registration_active_email_direct is
  'Enforces one active direct Auth registration request per email.';
