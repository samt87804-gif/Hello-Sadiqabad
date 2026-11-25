create or replace function private.review_business_submission_fields_api(
  p_submission_id uuid,
  p_decisions jsonb default '[]'::jsonb,
  p_admin_note text default null,
  p_request_owner_invitation boolean default false
) returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  decision_item jsonb;
  v_field_key text;
  v_status text;
  v_business_status text;
  v_whatsapp_allowed boolean := false;
  v_filtered jsonb := '[]'::jsonb;
  v_deferred_fields text[] := array[]::text[];
  v_result jsonb;
begin
  if not private.staff_has_permission('moderation.review') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_decisions is null or jsonb_typeof(p_decisions) <> 'array' or jsonb_array_length(p_decisions) > 20 then
    raise exception 'Invalid field decision list';
  end if;

  select b.status, coalesce((p.features->>'whatsapp')::boolean,false)
  into v_business_status,v_whatsapp_allowed
  from public.submissions s
  left join public.businesses b on b.id=s.business_id
  left join public.plans p on p.code=b.plan_code
  where s.id=p_submission_id and s.type='new_business';

  for decision_item in select value from jsonb_array_elements(p_decisions)
  loop
    v_field_key := decision_item->>'field_key';
    v_status := decision_item->>'status';

    if v_field_key='whatsapp' and v_status='approved_published' and not coalesce(v_whatsapp_allowed,false) then
      v_deferred_fields := array_append(v_deferred_fields,'whatsapp');
    elsif v_status='unpublished' and v_business_status is distinct from 'published' then
      v_deferred_fields := array_append(v_deferred_fields,coalesce(v_field_key,'unknown'));
    else
      v_filtered := v_filtered || jsonb_build_array(decision_item);
    end if;
  end loop;

  v_result := private.review_business_submission_fields(
    p_submission_id,
    v_filtered,
    p_admin_note,
    p_request_owner_invitation
  );

  return v_result || jsonb_build_object('deferred_fields',to_jsonb(v_deferred_fields));
end
$function$;

revoke all on function private.review_business_submission_fields_api(uuid,jsonb,text,boolean) from public,anon;
grant execute on function private.review_business_submission_fields_api(uuid,jsonb,text,boolean) to authenticated;

create or replace function public.review_business_submission_fields(
  p_submission_id uuid,
  p_decisions jsonb default '[]'::jsonb,
  p_admin_note text default null,
  p_request_owner_invitation boolean default false
) returns jsonb
language sql
security invoker
set search_path=''
as $function$
  select private.review_business_submission_fields_api(
    p_submission_id,p_decisions,p_admin_note,p_request_owner_invitation
  )
$function$;

revoke all on function public.review_business_submission_fields(uuid,jsonb,text,boolean) from public,anon;
grant execute on function public.review_business_submission_fields(uuid,jsonb,text,boolean) to authenticated;

drop policy if exists owner_registration_linked_business_review_read on public.owner_registration_requests;
drop policy if exists owner_registration_admin_read on public.owner_registration_requests;
create policy owner_registration_admin_read
  on public.owner_registration_requests
  for select to authenticated
  using (
    private.is_super_admin()
    or (submission_id is null and private.staff_has_permission('owners.create'))
    or (submission_id is not null and private.staff_has_permission('moderation.review'))
  );

create index if not exists owner_registration_invitation_requested_by_idx
  on public.owner_registration_requests(invitation_requested_by)
  where invitation_requested_by is not null;
create index if not exists owner_registration_invitation_user_id_idx
  on public.owner_registration_requests(invitation_user_id)
  where invitation_user_id is not null;
