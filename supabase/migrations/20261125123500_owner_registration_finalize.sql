-- Atomic owner-request finalization: business link, request state and audit stay consistent.
begin;

create or replace function public.finalize_owner_registration(
  p_request_id uuid,
  p_action text,
  p_actor_id uuid,
  p_owner_user_id uuid default null,
  p_admin_note text default null
) returns boolean
language plpgsql
security invoker
set search_path=''
as $function$
declare
  request_row public.owner_registration_requests%rowtype;
  linked_business_id uuid;
begin
  if current_user <> 'service_role' then
    raise exception 'Service role required' using errcode='42501';
  end if;
  if p_action not in ('approve','reject') then
    raise exception 'Invalid owner registration action';
  end if;
  if p_actor_id is null then
    raise exception 'Review actor is required';
  end if;
  if p_admin_note is not null and char_length(p_admin_note)>1000 then
    raise exception 'Admin note is too long';
  end if;

  select * into request_row
  from public.owner_registration_requests
  where id=p_request_id
  for update;
  if not found then
    raise exception 'Owner registration request not found';
  end if;

  if p_action='reject' then
    if request_row.status='rejected' then return false; end if;
    if request_row.status<>'pending' then
      raise exception 'Owner registration request is already being processed';
    end if;
    update public.owner_registration_requests
    set status='rejected',reviewed_by=p_actor_id,reviewed_at=now(),
        admin_note=nullif(btrim(p_admin_note),''),updated_at=now()
    where id=p_request_id;
  else
    if request_row.status='approved' then return false; end if;
    if request_row.status<>'processing' then
      raise exception 'Owner registration request is not locked for approval';
    end if;
    if p_owner_user_id is null then
      raise exception 'Owner user is required for approval';
    end if;
    if request_row.submission_id is not null and request_row.business_id is null then
      raise exception 'The submitted business must be published before owner invitation';
    end if;
    if request_row.business_id is not null then
      update public.businesses
      set owner_id=p_owner_user_id,claimed_at=now(),updated_at=now()
      where id=request_row.business_id and status='published' and owner_id is null
      returning id into linked_business_id;
      if linked_business_id is null then
        raise exception 'The reviewed business is unavailable for owner assignment';
      end if;
    end if;
    update public.owner_registration_requests
    set status='approved',reviewed_by=p_actor_id,reviewed_at=now(),
        admin_note=nullif(btrim(p_admin_note),''),updated_at=now()
    where id=p_request_id;
  end if;

  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
  values(
    p_actor_id,
    'owner_registration.'||p_action,
    'owner_registration_requests',
    p_request_id::text,
    jsonb_build_object(
      'owner_user_id',case when p_action='approve' then p_owner_user_id else null end,
      'email',request_row.email,
      'business_id',request_row.business_id,
      'submission_id',request_row.submission_id,
      'admin_note',p_admin_note
    )
  );

  return true;
end
$function$;

revoke all on function public.finalize_owner_registration(uuid,text,uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.finalize_owner_registration(uuid,text,uuid,uuid,text) to service_role;

commit;
