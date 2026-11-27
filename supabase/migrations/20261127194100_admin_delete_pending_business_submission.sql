create or replace function public.admin_delete_pending_business_submission(p_submission_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_submission public.submissions%rowtype;
  v_owner_request public.owner_registration_requests%rowtype;
  v_has_owner_request boolean := false;
  v_media_paths text[] := array[]::text[];
  v_direct_auth_user_id uuid := null;
begin
  if v_actor is null or not exists (
    select 1 from public.profiles
    where id = v_actor and role = 'super_admin' and is_active = true
  ) then
    raise exception 'Super Admin permission required to delete a business request.';
  end if;

  select * into v_submission
  from public.submissions
  where id = p_submission_id and type = 'new_business'
  for update;

  if not found then
    raise exception 'Business registration request was not found.';
  end if;

  if v_submission.status not in ('new', 'in_review') or v_submission.business_id is not null then
    raise exception 'Only an unapproved request without a created business listing can be deleted.';
  end if;

  select * into v_owner_request
  from public.owner_registration_requests
  where submission_id = p_submission_id
  for update;
  v_has_owner_request := found;

  if v_has_owner_request then
    if v_owner_request.status in ('processing', 'approved') or
       v_owner_request.invitation_status in ('processing', 'sent') then
      raise exception 'This Owner request is already being processed or has been activated/invited; it cannot be deleted here.';
    end if;

    v_direct_auth_user_id := v_owner_request.direct_auth_user_id;
    if v_direct_auth_user_id is not null then
      if not exists (
        select 1 from public.profiles
        where id = v_direct_auth_user_id and role = 'owner' and is_active = false
      ) then
        raise exception 'The linked Owner account is not safely inactive; request deletion is blocked.';
      end if;
      if exists (select 1 from public.businesses where owner_id = v_direct_auth_user_id) then
        raise exception 'The linked Owner already has a business; request deletion is blocked.';
      end if;
    end if;
  end if;

  select coalesce(array_agg(storage_path), array[]::text[])
  into v_media_paths
  from public.business_media_assets
  where submission_id = p_submission_id;

  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
  values (
    v_actor,
    'business_submission.deleted',
    'submissions',
    p_submission_id,
    jsonb_build_object(
      'submission_type', 'new_business',
      'previous_status', v_submission.status,
      'owner_request_id', case when v_has_owner_request then v_owner_request.id else null end,
      'direct_auth_user_id', v_direct_auth_user_id,
      'pending_media_count', coalesce(cardinality(v_media_paths), 0)
    )
  );

  delete from public.owner_registration_requests
  where submission_id = p_submission_id;

  delete from public.submissions
  where id = p_submission_id;

  return jsonb_build_object(
    'ok', true,
    'direct_auth_user_id', v_direct_auth_user_id,
    'storage_paths', to_jsonb(v_media_paths)
  );
end;
$$;

revoke all on function public.admin_delete_pending_business_submission(uuid) from public, anon;
grant execute on function public.admin_delete_pending_business_submission(uuid) to authenticated, service_role;
