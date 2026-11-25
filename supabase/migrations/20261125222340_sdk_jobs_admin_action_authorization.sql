create table private.sdk_job_admin_authorizations (
  job_id uuid not null references public.sdk_jobs(id) on delete cascade,
  action text not null check (action in ('approve_poster','publish')),
  actor_id uuid not null references public.profiles(id) on delete cascade,
  image_url text,
  authorized_at timestamptz not null default now(),
  expires_at timestamptz not null,
  primary key (job_id, action),
  check ((action = 'approve_poster' and image_url is not null) or (action = 'publish' and image_url is null))
);

alter table private.sdk_job_admin_authorizations enable row level security;
create policy sdk_job_admin_authorizations_service_role
on private.sdk_job_admin_authorizations
for all to service_role using (true) with check (true);
grant select, insert, update, delete on private.sdk_job_admin_authorizations to service_role;

create or replace function public.authorize_sdk_job_admin_action(
  p_job_id uuid,
  p_actor_id uuid,
  p_action text,
  p_image_url text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_status text;
  v_pending_path text;
  v_approved_url text;
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = p_actor_id and p.is_active = true
      and (
        p.role = 'super_admin'
        or (
          p.role = 'staff'
          and exists (
            select 1 from public.staff_members sm
            where sm.user_id = p_actor_id and sm.is_active = true
              and sm.permissions ->> 'sdk_jobs.manage' = 'true'
          )
        )
      )
  ) then
    raise exception 'Active SDK Jobs Admin permission is required' using errcode = '42501';
  end if;

  select j.status, j.pending_media_path, j.approved_image_url
    into v_status, v_pending_path, v_approved_url
  from public.sdk_jobs j where j.id = p_job_id;
  if not found then
    raise exception 'SDK Job not found' using errcode = 'P0002';
  end if;
  if v_status <> 'pending_review' then
    raise exception 'Only a job awaiting review can receive an Admin authorization' using errcode = '42501';
  end if;

  if p_action = 'approve_poster' then
    if v_pending_path is null or p_image_url is null
       or p_image_url !~ '^https://[^[:space:]]+/storage/v1/object/public/Hello%20Sadiqabad/sdk-jobs/' then
      raise exception 'A valid promoted SDK Jobs poster is required' using errcode = '23514';
    end if;
  elsif p_action = 'publish' then
    if v_approved_url is null or p_image_url is not null then
      raise exception 'An approved poster is required before publication' using errcode = '23514';
    end if;
  else
    raise exception 'Unsupported SDK Jobs Admin action' using errcode = '22023';
  end if;

  insert into private.sdk_job_admin_authorizations(job_id, action, actor_id, image_url, expires_at)
  values (p_job_id, p_action, p_actor_id, p_image_url, now() + interval '90 seconds')
  on conflict (job_id, action) do update
    set actor_id = excluded.actor_id,
        image_url = excluded.image_url,
        authorized_at = now(),
        expires_at = excluded.expires_at;
end
$function$;

revoke all on function public.authorize_sdk_job_admin_action(uuid,uuid,text,text) from public, anon, authenticated;
grant execute on function public.authorize_sdk_job_admin_action(uuid,uuid,text,text) to service_role;

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
    if tg_op = 'UPDATE' and new.approved_image_url is distinct from old.approved_image_url
       and new.approved_image_url is not null then
      if not exists (
        select 1 from private.sdk_job_admin_authorizations a
        where a.job_id = new.id and a.actor_id = (select auth.uid())
          and a.action = 'approve_poster' and a.image_url = new.approved_image_url
          and a.expires_at > now()
      ) then
        raise exception 'Poster must be approved through the secure SDK Jobs review flow' using errcode = '42501';
      end if;
      delete from private.sdk_job_admin_authorizations
      where job_id = new.id and actor_id = (select auth.uid()) and action = 'approve_poster';
    end if;

    if tg_op = 'UPDATE' and new.status = 'published' and old.status is distinct from 'published' then
      if not exists (
        select 1 from private.sdk_job_admin_authorizations a
        where a.job_id = new.id and a.actor_id = (select auth.uid())
          and a.action = 'publish' and a.image_url is null
          and a.expires_at > now()
      ) then
        raise exception 'Job must pass the secure SDK Jobs publication review before publishing' using errcode = '42501';
      end if;
      delete from private.sdk_job_admin_authorizations
      where job_id = new.id and actor_id = (select auth.uid()) and action = 'publish';
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' then
      raise exception 'Invalid SDK Job slug' using errcode = '23514';
    end if;
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
  if new.slug is distinct from old.slug then
    raise exception 'Job slug cannot be changed by an owner' using errcode = '42501';
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
