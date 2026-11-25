-- SDK Jobs Phase 4 foundation: owner submissions, private employer linkage,
-- explicit moderation permission, published-only public projection and audit history.
-- Candidate intake/referrals/fees are intentionally Phase 5 and are not created here.

create table public.sdk_jobs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  employer_owner_id uuid not null default auth.uid() references auth.users(id) on delete restrict,
  source_business_id uuid not null references public.businesses(id) on delete restrict,
  title_en text not null,
  title_ur text,
  summary_en text not null,
  summary_ur text,
  description_en text not null,
  description_ur text,
  job_category text not null,
  vacancy_count integer not null default 1 check (vacancy_count between 1 and 10000),
  job_type text not null,
  area_id uuid references public.areas(id) on delete restrict,
  work_location_en text,
  work_location_ur text,
  salary_min numeric(12,2) check (salary_min is null or salary_min >= 0),
  salary_max numeric(12,2) check (salary_max is null or salary_max >= 0),
  salary_disclosed boolean not null default false,
  duties_en text,
  duties_ur text,
  qualifications_en text,
  qualifications_ur text,
  experience_en text,
  experience_ur text,
  working_hours_en text,
  working_hours_ur text,
  benefits_en text,
  benefits_ur text,
  closing_date date,
  pending_media_path text,
  approved_image_url text,
  status text not null default 'pending_review'
    check (status in ('draft','pending_review','changes_requested','rejected','published','unpublished','closed','expired','archived')),
  submitted_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sdk_jobs_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint sdk_jobs_title_en_length check (char_length(title_en) between 3 and 180),
  constraint sdk_jobs_summary_en_length check (char_length(summary_en) between 10 and 360),
  constraint sdk_jobs_description_en_length check (char_length(description_en) between 20 and 12000),
  constraint sdk_jobs_category_length check (char_length(job_category) between 2 and 100),
  constraint sdk_jobs_type_length check (char_length(job_type) between 2 and 60),
  constraint sdk_jobs_salary_order check (salary_min is null or salary_max is null or salary_min <= salary_max),
  constraint sdk_jobs_publish_requires_review check (status <> 'published' or (published_at is not null and reviewed_by is not null and reviewed_at is not null and approved_image_url is not null))
);

comment on table public.sdk_jobs is 'Private owner-submitted local vacancies. Employer linkage and moderation fields are never exposed through public reads.';
comment on column public.sdk_jobs.employer_owner_id is 'Private auth user link; never expose in public job API or metadata.';
comment on column public.sdk_jobs.source_business_id is 'Private source business link used for server-side owner eligibility and Admin review.';
comment on column public.sdk_jobs.pending_media_path is 'Private pending bucket path only; never expose in public projection.';
comment on column public.sdk_jobs.approved_image_url is 'Approved public poster URL; publication requires an approved image.';

create index sdk_jobs_owner_created_idx on public.sdk_jobs (employer_owner_id, created_at desc);
create index sdk_jobs_business_created_idx on public.sdk_jobs (source_business_id, created_at desc);
create index sdk_jobs_admin_queue_idx on public.sdk_jobs (status, submitted_at desc);
create index sdk_jobs_public_deadline_idx on public.sdk_jobs (closing_date asc, published_at desc)
  where status = 'published' and published_at is not null;

create table public.sdk_job_status_history (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.sdk_jobs(id) on delete restrict,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);
comment on table public.sdk_job_status_history is 'Append-only Admin-visible status history for SDK Jobs; owners and public users cannot read or mutate it.';

create table public.sdk_job_admin_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.sdk_jobs(id) on delete restrict,
  author_id uuid references auth.users(id) on delete set null,
  note text not null check (char_length(note) between 1 and 4000),
  created_at timestamptz not null default now()
);
comment on table public.sdk_job_admin_notes is 'Private Admin-only notes for SDK Jobs; never exposed to owners or public clients.';

create index sdk_job_status_history_job_created_idx on public.sdk_job_status_history (job_id, created_at desc);
create index sdk_job_admin_notes_job_created_idx on public.sdk_job_admin_notes (job_id, created_at desc);

create or replace function private.sdk_job_owner_can_submit(p_owner_id uuid, p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_owner_id = (select auth.uid())
    and exists (
      select 1
      from public.profiles p
      join public.businesses b on b.owner_id = p.id
      where p.id = (select auth.uid())
        and p.role = 'owner'
        and p.is_active
        and b.id = p_business_id
        and b.status = 'published'
    )
$function$;

revoke all on function private.sdk_job_owner_can_submit(uuid, uuid) from public, anon;
grant execute on function private.sdk_job_owner_can_submit(uuid, uuid) to authenticated;

create or replace function private.guard_sdk_job_owner_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage') then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if not private.sdk_job_owner_can_submit((select auth.uid()), new.source_business_id) then
      raise exception 'Only an active approved owner with a published linked business can submit a job'
        using errcode = '42501';
    end if;
    new.employer_owner_id := (select auth.uid());
    new.status := 'pending_review';
    new.submitted_at := now();
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.published_at := null;
    new.approved_image_url := null;
    return new;
  end if;

  if new.employer_owner_id is distinct from old.employer_owner_id then
    raise exception 'Job employer linkage cannot be changed by an owner' using errcode = '42501';
  end if;
  if old.employer_owner_id is distinct from (select auth.uid())
     or not private.sdk_job_owner_can_submit((select auth.uid()), new.source_business_id) then
    raise exception 'You are not allowed to edit this job' using errcode = '42501';
  end if;
  if old.status not in ('draft','changes_requested','published') then
    raise exception 'This job is not in an owner-editable state' using errcode = '42501';
  end if;

  -- Every owner resubmission returns to the Admin review queue.
  new.status := 'pending_review';
  new.submitted_at := now();
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.published_at := null;
  new.approved_image_url := old.approved_image_url;
  return new;
end
$function$;

create trigger trg_guard_sdk_job_owner_write
before insert or update on public.sdk_jobs
for each row execute function private.guard_sdk_job_owner_write();

create trigger trg_sdk_jobs_updated_at
before update on public.sdk_jobs
for each row execute function public.handle_updated_at();

create trigger trg_sdk_jobs_audit
after insert or update on public.sdk_jobs
for each row execute function public.audit_log_record();

create or replace function private.record_sdk_job_status_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if tg_op = 'INSERT' then
    insert into public.sdk_job_status_history(job_id, actor_id, action, old_status, new_status)
    values (new.id, (select auth.uid()), 'submitted', null, new.status);
  elsif old.status is distinct from new.status then
    insert into public.sdk_job_status_history(job_id, actor_id, action, old_status, new_status)
    values (new.id, (select auth.uid()), 'status_changed', old.status, new.status);
  end if;
  return new;
end
$function$;

create trigger trg_sdk_jobs_status_history
after insert or update on public.sdk_jobs
for each row execute function private.record_sdk_job_status_history();

alter table public.sdk_jobs enable row level security;
alter table public.sdk_job_status_history enable row level security;
alter table public.sdk_job_admin_notes enable row level security;

revoke all on public.sdk_jobs from anon, authenticated;
grant select, insert, update on public.sdk_jobs to authenticated;

create policy sdk_jobs_owner_read on public.sdk_jobs
for select to authenticated
using (employer_owner_id = (select auth.uid()));

create policy sdk_jobs_admin_read on public.sdk_jobs
for select to authenticated
using (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'));

create policy sdk_jobs_owner_insert on public.sdk_jobs
for insert to authenticated
with check (
  employer_owner_id = (select auth.uid())
  and status = 'pending_review'
  and private.sdk_job_owner_can_submit((select auth.uid()), source_business_id)
);

create policy sdk_jobs_admin_insert on public.sdk_jobs
for insert to authenticated
with check (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'));

create policy sdk_jobs_owner_update on public.sdk_jobs
for update to authenticated
using (
  employer_owner_id = (select auth.uid())
  and status in ('draft','changes_requested','published')
)
with check (
  employer_owner_id = (select auth.uid())
  and status = 'pending_review'
  and private.sdk_job_owner_can_submit((select auth.uid()), source_business_id)
);

create policy sdk_jobs_admin_update on public.sdk_jobs
for update to authenticated
using (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'))
with check (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'));

revoke all on public.sdk_job_status_history from anon, authenticated;
grant select on public.sdk_job_status_history to authenticated;
create policy sdk_job_status_history_admin_read on public.sdk_job_status_history
for select to authenticated
using (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'));

revoke all on public.sdk_job_admin_notes from anon, authenticated;
grant select, insert, update on public.sdk_job_admin_notes to authenticated;
create policy sdk_job_admin_notes_admin_read on public.sdk_job_admin_notes
for select to authenticated
using (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'));
create policy sdk_job_admin_notes_admin_insert on public.sdk_job_admin_notes
for insert to authenticated
with check (
  (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'))
  and author_id = (select auth.uid())
);
create policy sdk_job_admin_notes_admin_update on public.sdk_job_admin_notes
for update to authenticated
using (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'))
with check (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'));

create view public.sdk_jobs_public
with (security_barrier = true)
as
select
  j.slug,
  j.title_en,
  j.title_ur,
  j.summary_en,
  j.summary_ur,
  j.description_en,
  j.description_ur,
  j.job_category,
  j.vacancy_count,
  j.job_type,
  a.name_en as area_name_en,
  a.name_ur as area_name_ur,
  j.work_location_en,
  j.work_location_ur,
  j.salary_min,
  j.salary_max,
  j.salary_disclosed,
  j.duties_en,
  j.duties_ur,
  j.qualifications_en,
  j.qualifications_ur,
  j.experience_en,
  j.experience_ur,
  j.working_hours_en,
  j.working_hours_ur,
  j.benefits_en,
  j.benefits_ur,
  j.closing_date,
  j.approved_image_url as image_url,
  j.published_at
from public.sdk_jobs j
left join public.areas a on a.id = j.area_id
where j.status = 'published'
  and j.published_at is not null
  and j.published_at <= now()
  and (j.closing_date is null or j.closing_date >= (now() at time zone 'Asia/Karachi')::date);

revoke all on public.sdk_jobs_public from anon, authenticated;
grant select on public.sdk_jobs_public to anon, authenticated;

create or replace function public.my_permissions()
returns jsonb
language sql
stable
set search_path to ''
as $function$
select jsonb_build_object(
  'role', p.role,
  'is_active', p.is_active and (case when p.role = 'staff' then coalesce(s.is_active, false) else true end),
  'staff_types', coalesce(s.staff_types, '{}'::text[]),
  'permissions', case when p.role = 'super_admin' and p.is_active then
    to_jsonb(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage','government_jobs.manage','government_schemes.manage','sdk_jobs.manage'])
  else coalesce((
    select jsonb_agg(z.perm)
    from unnest(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage','government_jobs.manage','government_schemes.manage','sdk_jobs.manage']) as z(perm)
    where private.staff_has_permission(z.perm)
  ), '[]'::jsonb) end
)
from public.profiles p
left join public.staff_members s on s.user_id = p.id
where p.id = (select auth.uid())
$function$;
