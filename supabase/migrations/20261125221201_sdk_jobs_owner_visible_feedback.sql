-- Owner-visible moderation feedback, separate from private Admin notes.
alter table public.sdk_jobs
  add column owner_feedback text;

alter table public.sdk_jobs
  add constraint sdk_jobs_owner_feedback_length
  check (owner_feedback is null or char_length(owner_feedback) <= 2000);

grant select (owner_feedback), update (owner_feedback)
on table public.sdk_jobs to authenticated;

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
    new.owner_feedback := null;
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
  new.owner_feedback := null;
  return new;
end
$function$;
