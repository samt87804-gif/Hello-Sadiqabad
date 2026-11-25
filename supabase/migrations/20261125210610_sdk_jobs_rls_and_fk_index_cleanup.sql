-- Consolidate SDK Jobs RLS policies and index all new foreign keys.
drop policy if exists sdk_jobs_owner_read on public.sdk_jobs;
drop policy if exists sdk_jobs_admin_read on public.sdk_jobs;
drop policy if exists sdk_jobs_owner_insert on public.sdk_jobs;
drop policy if exists sdk_jobs_admin_insert on public.sdk_jobs;
drop policy if exists sdk_jobs_owner_update on public.sdk_jobs;
drop policy if exists sdk_jobs_admin_update on public.sdk_jobs;

create policy sdk_jobs_authenticated_read on public.sdk_jobs
for select to authenticated
using (
  employer_owner_id = (select auth.uid())
  or private.is_super_admin()
  or private.staff_has_permission('sdk_jobs.manage')
);

create policy sdk_jobs_authenticated_insert on public.sdk_jobs
for insert to authenticated
with check (
  private.is_super_admin()
  or private.staff_has_permission('sdk_jobs.manage')
  or (
    employer_owner_id = (select auth.uid())
    and status = 'pending_review'
    and private.sdk_job_owner_can_submit((select auth.uid()), source_business_id)
  )
);

create policy sdk_jobs_authenticated_update on public.sdk_jobs
for update to authenticated
using (
  private.is_super_admin()
  or private.staff_has_permission('sdk_jobs.manage')
  or (
    employer_owner_id = (select auth.uid())
    and status in ('draft','changes_requested','published')
  )
)
with check (
  private.is_super_admin()
  or private.staff_has_permission('sdk_jobs.manage')
  or (
    employer_owner_id = (select auth.uid())
    and status = 'pending_review'
    and private.sdk_job_owner_can_submit((select auth.uid()), source_business_id)
  )
);

create index if not exists sdk_jobs_area_id_idx on public.sdk_jobs(area_id);
create index if not exists sdk_jobs_reviewed_by_idx on public.sdk_jobs(reviewed_by);
create index if not exists sdk_job_status_history_actor_id_idx on public.sdk_job_status_history(actor_id);
create index if not exists sdk_job_admin_notes_author_id_idx on public.sdk_job_admin_notes(author_id);
