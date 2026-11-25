-- SDK Jobs poster lifecycle: narrow owner path attachment + Admin-only private preview.
-- The shared pending bucket remains private and retains its existing 5 MiB JPEG/PNG/WebP limits.

create policy sdk_jobs_pending_media_admin_read
on storage.objects
for select
to authenticated
using (
  bucket_id = 'hs-pending-business-media'
  and (storage.foldername(name))[1] = 'sdk-jobs'
  and (private.is_super_admin() or private.staff_has_permission('sdk_jobs.manage'))
);

create or replace function private.guard_sdk_job_owner_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.area_id is not null and not exists (
    select 1 from public.areas a where a.id = new.area_id and a.is_active
  ) then
    raise exception 'Select an active service area' using errcode = '23514';
  end if;

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
    new.pending_media_path := null;
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

  if old.status = 'pending_review' then
    if (to_jsonb(new) - 'pending_media_path' - 'updated_at')
       is distinct from
       (to_jsonb(old) - 'pending_media_path' - 'updated_at') then
      raise exception 'Only the pending poster may be attached while a job is under review'
        using errcode = '42501';
    end if;
    if new.pending_media_path is not null and new.pending_media_path !~
      ('^sdk-jobs/pending/' || old.id::text || '/' || old.employer_owner_id::text || '/[0-9a-f-]{36}[.](jpg|png|webp)$') then
      raise exception 'Invalid SDK Jobs pending poster path' using errcode = '23514';
    end if;
    return new;
  end if;

  if old.status not in ('draft','changes_requested','published') then
    raise exception 'This job is not in an owner-editable state' using errcode = '42501';
  end if;

  new.pending_media_path := old.pending_media_path;
  new.status := 'pending_review';
  new.submitted_at := now();
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.published_at := null;
  new.approved_image_url := old.approved_image_url;
  return new;
end
$function$;

drop policy if exists sdk_jobs_authenticated_update on public.sdk_jobs;
create policy sdk_jobs_authenticated_update on public.sdk_jobs
for update to authenticated
using (
  private.is_super_admin()
  or private.staff_has_permission('sdk_jobs.manage')
  or (
    employer_owner_id = (select auth.uid())
    and status in ('draft','changes_requested','published','pending_review')
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
