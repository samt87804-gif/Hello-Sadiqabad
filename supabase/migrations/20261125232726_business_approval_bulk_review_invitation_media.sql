begin;

alter table public.owner_registration_requests
  add column if not exists invitation_requested boolean not null default false,
  add column if not exists invitation_status text not null default 'not_requested',
  add column if not exists invitation_requested_by uuid references auth.users(id) on delete set null,
  add column if not exists invitation_requested_at timestamptz,
  add column if not exists invitation_processing_started_at timestamptz,
  add column if not exists invitation_sent_at timestamptz,
  add column if not exists invitation_attempts integer not null default 0,
  add column if not exists invitation_last_error text,
  add column if not exists invitation_user_id uuid references auth.users(id) on delete set null;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.owner_registration_requests'::regclass and conname='owner_registration_invitation_status_check') then
    alter table public.owner_registration_requests
      add constraint owner_registration_invitation_status_check
      check (invitation_status in ('not_requested','waiting_for_business','pending','processing','sent','failed'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.owner_registration_requests'::regclass and conname='owner_registration_invitation_attempts_check') then
    alter table public.owner_registration_requests
      add constraint owner_registration_invitation_attempts_check check (invitation_attempts >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.owner_registration_requests'::regclass and conname='owner_registration_invitation_error_check') then
    alter table public.owner_registration_requests
      add constraint owner_registration_invitation_error_check
      check (invitation_last_error is null or char_length(invitation_last_error) <= 1000);
  end if;
end
$$;

create index if not exists owner_registration_invitation_queue_idx
  on public.owner_registration_requests(invitation_status, updated_at desc)
  where submission_id is not null and invitation_requested=true;

drop policy if exists owner_registration_linked_business_review_read on public.owner_registration_requests;
create policy owner_registration_linked_business_review_read
  on public.owner_registration_requests
  for select to authenticated
  using (
    submission_id is not null
    and (private.is_super_admin() or private.staff_has_permission('moderation.review'))
  );

alter table public.business_media_assets
  drop constraint if exists business_media_assets_status_check;
alter table public.business_media_assets
  add constraint business_media_assets_status_check
  check (status in ('pending_review','approved_pending_promotion','approved_published','rejected','unpublished'));

alter table public.business_image_change_requests
  drop constraint if exists business_image_change_requests_status_check;
alter table public.business_image_change_requests
  add constraint business_image_change_requests_status_check
  check (status in ('pending_review','approved_pending_promotion','approved_published','rejected','unpublished'));

create index if not exists business_media_pending_promotion_idx
  on public.business_media_assets(status, updated_at desc)
  where status='approved_pending_promotion';

create or replace function private.review_business_submission_fields(
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
  s public.submissions%rowtype;
  current_review public.business_field_reviews%rowtype;
  decision_item jsonb;
  v_field_key text;
  v_status text;
  v_field_note text;
  v_old_status text;
  v_business_id uuid;
  v_city_id uuid;
  v_name text;
  v_phone text;
  v_category_id uuid;
  v_area_id uuid;
  v_address text;
  v_slug text;
  v_core_ready boolean := false;
  v_pending boolean := false;
  v_owner_request_id uuid;
  v_invitation_status text := 'not_requested';
  v_whatsapp_allowed boolean := false;
  v_allowed_fields text[] := array[
    'name_en','name_ur','category_id','area_id','phone_primary','whatsapp',
    'address_en','address_ur','landmark_en','landmark_ur','map_url',
    'opening_hours','description_en','description_ur','services_en','services_ur'
  ];
begin
  if not private.staff_has_permission('moderation.review') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_decisions is null or jsonb_typeof(p_decisions) <> 'array' or jsonb_array_length(p_decisions) > 20 then
    raise exception 'Invalid field decision list';
  end if;
  if p_admin_note is not null and char_length(p_admin_note) > 1000 then
    raise exception 'Admin note is too long';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_decisions) d(value)
    group by d.value->>'field_key'
    having count(*) > 1
  ) then
    raise exception 'A field can only have one decision per save';
  end if;

  select * into s
  from public.submissions
  where id=p_submission_id and type='new_business'
  for update;
  if not found or s.status not in ('new','in_review') then
    raise exception 'Active new business submission not found';
  end if;

  perform set_config('app.business_field_review','true',true);
  perform set_config('app.approving_submission','true',true);
  v_business_id := s.business_id;

  for decision_item in select value from jsonb_array_elements(p_decisions)
  loop
    v_field_key := decision_item->>'field_key';
    v_status := decision_item->>'status';
    v_field_note := nullif(btrim(decision_item->>'admin_note'),'');
    if v_field_key is null or not (v_field_key = any(v_allowed_fields)) then
      raise exception 'This field is not eligible for public approval';
    end if;
    if v_status is null or v_status not in ('approved_published','rejected','unpublished') then
      raise exception 'Invalid field review decision';
    end if;
    if v_status='rejected' and coalesce(v_field_note,nullif(btrim(p_admin_note),'')) is null then
      raise exception 'A rejection reason is required';
    end if;

    select * into current_review
    from public.business_field_reviews
    where submission_id=p_submission_id and field_key=v_field_key
    for update;
    if not found then
      raise exception 'Field is not part of this submission';
    end if;
    if v_status='unpublished' and (
      current_review.status <> 'approved_published'
      or v_business_id is null
      or not exists(select 1 from public.businesses b where b.id=v_business_id and b.status='published')
    ) then
      raise exception 'Only a previously published field can be unpublished';
    end if;
    if v_status='approved_published' and v_field_key='whatsapp' then
      if v_business_id is null then
        raise exception 'WhatsApp can be approved after the business exists and its plan is checked';
      end if;
      select coalesce((p.features->>'whatsapp')::boolean,false)
      into v_whatsapp_allowed
      from public.businesses b
      join public.plans p on p.code=b.plan_code
      where b.id=v_business_id;
      if not coalesce(v_whatsapp_allowed,false) then
        raise exception 'WhatsApp requires a Basic or Premium business plan';
      end if;
    end if;

    v_old_status := current_review.status;
    update public.business_field_reviews
    set status=v_status,
        reviewed_by=auth.uid(),
        reviewed_at=now(),
        admin_note=coalesce(v_field_note,nullif(btrim(p_admin_note),'')),
        updated_at=now()
    where id=current_review.id;

    insert into public.audit_logs(actor_id,action,entity,entity_id,details)
    values(
      auth.uid(),
      'business_field.'||v_status,
      'business_field_reviews',
      current_review.id::text,
      jsonb_build_object(
        'submission_id',p_submission_id,
        'business_id',v_business_id,
        'field_key',v_field_key,
        'old_status',v_old_status,
        'new_status',v_status,
        'admin_note',coalesce(v_field_note,p_admin_note)
      )
    );
  end loop;

  select count(*)=5 and bool_and(status='approved_published')
  into v_core_ready
  from public.business_field_reviews
  where submission_id=p_submission_id
    and field_key in ('name_en','category_id','area_id','phone_primary','address_en');

  if v_business_id is null and coalesce(v_core_ready,false) then
    v_name := nullif(btrim(s.payload->>'name_en'),'');
    v_phone := nullif(btrim(s.payload->>'phone_primary'),'');
    v_category_id := nullif(s.payload->>'category_id','')::uuid;
    v_area_id := nullif(s.payload->>'area_id','')::uuid;
    v_address := nullif(btrim(s.payload->>'address_en'),'');
    if v_name is null or v_phone is null or v_category_id is null or v_area_id is null or v_address is null then
      raise exception 'Required approved business fields are incomplete';
    end if;
    select id into v_city_id from public.cities where slug='sadiqabad' limit 1;
    if v_city_id is null then raise exception 'Sadiqabad city record is missing'; end if;

    v_slug := lower(regexp_replace(v_name,'[^a-zA-Z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,6);
    insert into public.businesses(
      city_id,owner_id,name_en,name_ur,slug,category_id,area_id,address_en,address_ur,
      landmark_en,landmark_ur,phone_primary,phone_normalized,whatsapp,map_url,
      description_en,description_ur,services_en,services_ur,opening_hours,owner_name,
      status,source,created_by,published_at
    ) values (
      v_city_id,
      case when s.submitted_by is not null and exists(
        select 1 from public.profiles where id=s.submitted_by and role='owner' and is_active=true
      ) then s.submitted_by else null end,
      v_name,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='name_ur' and status='approved_published') then nullif(s.payload->>'name_ur','') else null end,
      v_slug,v_category_id,v_area_id,v_address,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='address_ur' and status='approved_published') then nullif(s.payload->>'address_ur','') else null end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='landmark_en' and status='approved_published') then nullif(s.payload->>'landmark_en','') else null end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='landmark_ur' and status='approved_published') then nullif(s.payload->>'landmark_ur','') else null end,
      v_phone,regexp_replace(v_phone,'\D','','g'),
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='whatsapp' and status='approved_published') then nullif(s.payload->>'whatsapp','') else null end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='map_url' and status='approved_published') then nullif(s.payload->>'map_url','') else null end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='description_en' and status='approved_published') then nullif(s.payload->>'description_en','') else null end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='description_ur' and status='approved_published') then nullif(s.payload->>'description_ur','') else null end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='services_en' and status='approved_published') and jsonb_typeof(s.payload->'services_en')='array'
        then array(select jsonb_array_elements_text(s.payload->'services_en')) else '{}'::text[] end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='services_ur' and status='approved_published') and jsonb_typeof(s.payload->'services_ur')='array'
        then array(select jsonb_array_elements_text(s.payload->'services_ur')) else '{}'::text[] end,
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='opening_hours' and status='approved_published') then s.payload->'opening_hours' else null end,
      null,
      'published','visitor_submission',auth.uid(),now()
    ) returning id into v_business_id;

    update public.submissions set business_id=v_business_id,updated_at=now() where id=p_submission_id;
    update public.owner_registration_requests set business_id=v_business_id,updated_at=now()
      where submission_id=p_submission_id and status in ('pending','processing');
    update public.business_media_assets set business_id=v_business_id,updated_at=now()
      where submission_id=p_submission_id and business_id is null;
  end if;

  if v_business_id is not null then
    update public.businesses set
      name_ur=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='name_ur' and status='approved_published') then nullif(s.payload->>'name_ur','') else null end,
      whatsapp=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='whatsapp' and status='approved_published') then nullif(s.payload->>'whatsapp','') else null end,
      address_ur=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='address_ur' and status='approved_published') then nullif(s.payload->>'address_ur','') else null end,
      landmark_en=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='landmark_en' and status='approved_published') then nullif(s.payload->>'landmark_en','') else null end,
      landmark_ur=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='landmark_ur' and status='approved_published') then nullif(s.payload->>'landmark_ur','') else null end,
      map_url=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='map_url' and status='approved_published') then nullif(s.payload->>'map_url','') else null end,
      description_en=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='description_en' and status='approved_published') then nullif(s.payload->>'description_en','') else null end,
      description_ur=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='description_ur' and status='approved_published') then nullif(s.payload->>'description_ur','') else null end,
      services_en=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='services_en' and status='approved_published') and jsonb_typeof(s.payload->'services_en')='array' then array(select jsonb_array_elements_text(s.payload->'services_en')) else '{}'::text[] end,
      services_ur=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='services_ur' and status='approved_published') and jsonb_typeof(s.payload->'services_ur')='array' then array(select jsonb_array_elements_text(s.payload->'services_ur')) else '{}'::text[] end,
      opening_hours=case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='opening_hours' and status='approved_published') then s.payload->'opening_hours' else null end,
      updated_at=now()
    where id=v_business_id;

    update public.businesses
    set status=case when coalesce(v_core_ready,false) then 'published' else 'pending_approval' end,
        published_at=case when coalesce(v_core_ready,false) then coalesce(published_at,now()) else null end,
        updated_at=now()
    where id=v_business_id;
  end if;

  if p_admin_note is not null and btrim(p_admin_note) <> '' then
    update public.submissions
    set admin_note=left(concat_ws(E'\n\n',nullif(btrim(admin_note),''),btrim(p_admin_note)),1000),
        updated_at=now()
    where id=p_submission_id;
  end if;

  select id,invitation_status into v_owner_request_id,v_invitation_status
  from public.owner_registration_requests
  where submission_id=p_submission_id and status <> 'rejected'
  order by created_at desc
  limit 1
  for update;

  if p_request_owner_invitation then
    if v_owner_request_id is null then
      raise exception 'No linked private Owner contact record exists for this submission';
    end if;
    if v_invitation_status <> 'sent' then
      update public.owner_registration_requests
      set invitation_requested=true,
          invitation_status=case when v_business_id is not null and coalesce(v_core_ready,false) then 'pending' else 'waiting_for_business' end,
          invitation_requested_by=auth.uid(),
          invitation_requested_at=coalesce(invitation_requested_at,now()),
          invitation_processing_started_at=null,
          invitation_last_error=null,
          updated_at=now()
      where id=v_owner_request_id and invitation_status <> 'processing';
    end if;
  elsif v_owner_request_id is not null and v_invitation_status not in ('sent','processing') then
    update public.owner_registration_requests
    set invitation_requested=false,
        invitation_status='not_requested',
        invitation_requested_by=null,
        invitation_requested_at=null,
        invitation_last_error=null,
        updated_at=now()
    where id=v_owner_request_id;
    v_invitation_status := 'not_requested';
  end if;

  select exists(
    select 1 from public.business_field_reviews
    where submission_id=p_submission_id
      and field_key <> 'owner_name'
      and status='pending_review'
  ) into v_pending;

  update public.submissions
  set status=case when v_pending then 'in_review' else 'done' end,
      updated_at=now()
  where id=p_submission_id;

  if v_owner_request_id is not null then
    select invitation_status into v_invitation_status
    from public.owner_registration_requests where id=v_owner_request_id;
  end if;

  return jsonb_build_object(
    'submission_id',p_submission_id,
    'business_id',v_business_id,
    'core_ready',coalesce(v_core_ready,false),
    'submission_status',case when v_pending then 'in_review' else 'done' end,
    'invitation_status',coalesce(v_invitation_status,'not_requested')
  );
end
$function$;

revoke all on function private.review_business_submission_fields(uuid,jsonb,text,boolean) from public,anon;
grant execute on function private.review_business_submission_fields(uuid,jsonb,text,boolean) to authenticated;

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
  select private.review_business_submission_fields(p_submission_id,p_decisions,p_admin_note,p_request_owner_invitation)
$function$;

revoke all on function public.review_business_submission_fields(uuid,jsonb,text,boolean) from public,anon;
grant execute on function public.review_business_submission_fields(uuid,jsonb,text,boolean) to authenticated;

create or replace function private.review_business_submission_field(
  p_submission_id uuid,
  p_field_key text,
  p_status text,
  p_admin_note text default null
) returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  result jsonb;
begin
  if p_field_key='owner_name' then
    raise exception 'Owner identity is private and cannot be approved as a public field';
  end if;
  result := private.review_business_submission_fields(
    p_submission_id,
    jsonb_build_array(jsonb_build_object('field_key',p_field_key,'status',p_status,'admin_note',p_admin_note)),
    p_admin_note,
    false
  );
  return nullif(result->>'business_id','')::uuid;
end
$function$;

revoke all on function private.review_business_submission_field(uuid,text,text,text) from public,anon;
grant execute on function private.review_business_submission_field(uuid,text,text,text) to authenticated;

create or replace function public.review_business_submission_field(
  p_submission_id uuid,p_field_key text,p_status text,p_admin_note text default null
) returns uuid
language sql
security invoker
set search_path=''
as $function$
  select private.review_business_submission_field(p_submission_id,p_field_key,p_status,p_admin_note)
$function$;

revoke all on function public.review_business_submission_field(uuid,text,text,text) from public,anon;
grant execute on function public.review_business_submission_field(uuid,text,text,text) to authenticated;

create or replace function public.finalize_business_media_review(
  p_asset_id uuid,
  p_action text,
  p_actor_id uuid,
  p_admin_note text default null
) returns boolean
language plpgsql
set search_path=''
as $function$
declare
  asset_row public.business_media_assets%rowtype;
begin
  if current_user <> 'service_role' then
    raise exception 'Service role required' using errcode='42501';
  end if;
  if p_action not in ('approved_pending_promotion','approved_published','rejected','unpublished') then
    raise exception 'Invalid media review status';
  end if;
  if p_actor_id is null then
    raise exception 'Review actor is required';
  end if;
  if p_admin_note is not null and char_length(p_admin_note)>1000 then
    raise exception 'Admin note is too long';
  end if;

  select * into asset_row from public.business_media_assets where id=p_asset_id for update;
  if not found then raise exception 'Business media asset not found'; end if;
  if asset_row.status=p_action then return false; end if;
  if asset_row.status='rejected' then raise exception 'Rejected media cannot be published'; end if;
  if p_action='approved_pending_promotion' and asset_row.status not in ('pending_review','approved_pending_promotion') then
    raise exception 'Only pending media can be approved for later promotion';
  end if;
  if p_action='unpublished' and asset_row.status<>'approved_published' then
    raise exception 'Only published media can be unpublished';
  end if;

  update public.business_media_assets
  set status=p_action,reviewed_by=p_actor_id,reviewed_at=now(),
      admin_note=nullif(btrim(p_admin_note),''),updated_at=now()
  where id=p_asset_id;

  update public.business_image_change_requests
  set status=p_action,reviewed_by=p_actor_id,reviewed_at=now(),
      admin_note=nullif(btrim(p_admin_note),'')
  where media_asset_id=p_asset_id;

  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
  values(
    p_actor_id,
    'business_media.'||p_action,
    'business_media_assets',
    p_asset_id::text,
    jsonb_build_object(
      'business_id',asset_row.business_id,
      'submission_id',asset_row.submission_id,
      'media_field',asset_row.media_field,
      'storage_path',asset_row.storage_path,
      'admin_note',p_admin_note
    )
  );
  return true;
end
$function$;

revoke all on function public.finalize_business_media_review(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.finalize_business_media_review(uuid,text,uuid,text) to service_role;

commit;
