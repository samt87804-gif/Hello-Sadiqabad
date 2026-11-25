-- Field-level moderation RPC. Public directory columns are only populated from approved fields.
begin;

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
  s public.submissions%rowtype;
  f public.business_field_reviews%rowtype;
  v_business_id uuid;
  v_city_id uuid;
  v_name text;
  v_phone text;
  v_category_id uuid;
  v_area_id uuid;
  v_address text;
  v_slug text;
  v_core_ready boolean;
  v_pending boolean;
begin
  if not private.staff_has_permission('moderation.review') then
    raise exception 'Permission denied' using errcode='42501';
  end if;
  if p_status not in ('approved_published','rejected','unpublished') then
    raise exception 'Invalid field review status';
  end if;
  if p_admin_note is not null and char_length(p_admin_note)>1000 then
    raise exception 'Admin note is too long';
  end if;

  select * into s from public.submissions
    where id=p_submission_id and type='new_business' for update;
  if not found then raise exception 'New business submission not found'; end if;

  select * into f from public.business_field_reviews
    where submission_id=p_submission_id and field_key=p_field_key for update;
  if not found then raise exception 'Field is not part of this submission'; end if;

  update public.business_field_reviews
    set status=p_status, reviewed_by=auth.uid(), reviewed_at=now(),
        admin_note=nullif(btrim(p_admin_note),''), updated_at=now()
    where id=f.id;

  v_business_id := s.business_id;
  select
    bool_and(status='approved_published')
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
      case when exists(select 1 from public.business_field_reviews where submission_id=p_submission_id and field_key='owner_name' and status='approved_published') then nullif(s.payload->>'owner_name','') else null end,
      'published','visitor_submission',auth.uid(),now()
    ) returning id into v_business_id;

    update public.submissions set business_id=v_business_id,updated_at=now() where id=p_submission_id;
  elsif v_business_id is not null then
    -- Optional values are independently visible; rejected/unpublished values are hidden.
    update public.businesses set
      name_ur=case when p_field_key='name_ur' then case when p_status='approved_published' then nullif(s.payload->>'name_ur','') else null end else name_ur end,
      whatsapp=case when p_field_key='whatsapp' then case when p_status='approved_published' then nullif(s.payload->>'whatsapp','') else null end else whatsapp end,
      address_ur=case when p_field_key='address_ur' then case when p_status='approved_published' then nullif(s.payload->>'address_ur','') else null end else address_ur end,
      landmark_en=case when p_field_key='landmark_en' then case when p_status='approved_published' then nullif(s.payload->>'landmark_en','') else null end else landmark_en end,
      landmark_ur=case when p_field_key='landmark_ur' then case when p_status='approved_published' then nullif(s.payload->>'landmark_ur','') else null end else landmark_ur end,
      map_url=case when p_field_key='map_url' then case when p_status='approved_published' then nullif(s.payload->>'map_url','') else null end else map_url end,
      description_en=case when p_field_key='description_en' then case when p_status='approved_published' then nullif(s.payload->>'description_en','') else null end else description_en end,
      description_ur=case when p_field_key='description_ur' then case when p_status='approved_published' then nullif(s.payload->>'description_ur','') else null end else description_ur end,
      services_en=case when p_field_key='services_en' then case when p_status='approved_published' and jsonb_typeof(s.payload->'services_en')='array' then array(select jsonb_array_elements_text(s.payload->'services_en')) else '{}'::text[] end else services_en end,
      services_ur=case when p_field_key='services_ur' then case when p_status='approved_published' and jsonb_typeof(s.payload->'services_ur')='array' then array(select jsonb_array_elements_text(s.payload->'services_ur')) else '{}'::text[] end else services_ur end,
      opening_hours=case when p_field_key='opening_hours' then case when p_status='approved_published' then s.payload->'opening_hours' else null end else opening_hours end,
      owner_name=case when p_field_key='owner_name' then case when p_status='approved_published' then nullif(s.payload->>'owner_name','') else null end else owner_name end,
      updated_at=now()
    where id=v_business_id;
  end if;

  if v_business_id is not null then
    if not coalesce(v_core_ready,false) then
      update public.businesses set status='pending_approval',published_at=null,updated_at=now()
      where id=v_business_id;
    else
      update public.businesses set status='published',published_at=coalesce(published_at,now()),updated_at=now()
      where id=v_business_id;
    end if;
  end if;

  select exists(select 1 from public.business_field_reviews
    where submission_id=p_submission_id and status='pending_review') into v_pending;
  if not v_pending then
    perform set_config('app.business_field_review','true',true);
    update public.submissions set status='done',updated_at=now() where id=p_submission_id;
  else
    update public.submissions set status='in_review',updated_at=now() where id=p_submission_id;
  end if;

  insert into public.audit_logs(actor_id,action,entity,entity_id,details)
  values(auth.uid(),'business_field.'||p_status,'business_field_reviews',f.id::text,
    jsonb_build_object('submission_id',p_submission_id,'business_id',v_business_id,
      'field_key',p_field_key,'old_status',f.status,'new_status',p_status,'admin_note',p_admin_note));

  return v_business_id;
end
$function$;

revoke all on function private.review_business_submission_field(uuid,text,text,text) from public, anon;
grant execute on function private.review_business_submission_field(uuid,text,text,text) to authenticated;

create or replace function public.review_business_submission_field(
  p_submission_id uuid,p_field_key text,p_status text,p_admin_note text default null
) returns uuid language sql security invoker set search_path=''
as $function$
  select private.review_business_submission_field(p_submission_id,p_field_key,p_status,p_admin_note)
$function$;
revoke all on function public.review_business_submission_field(uuid,text,text,text) from public, anon;
grant execute on function public.review_business_submission_field(uuid,text,text,text) to authenticated;

commit;
