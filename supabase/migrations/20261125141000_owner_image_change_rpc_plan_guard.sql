-- Enforce published-business and cover-plan eligibility inside the owner image-change RPC as defense in depth.
begin;

create or replace function private.request_business_image_change(
  p_business_id uuid,
  p_media_field text,
  p_storage_path text,
  p_mime_type text,
  p_file_size_bytes bigint
) returns uuid
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_asset_id uuid;
  v_request_id uuid;
  v_owner_id uuid;
  v_business_status text;
  v_plan_code text;
  v_month_start timestamptz;
  v_object_metadata jsonb;
  v_actual_size bigint;
  v_actual_mime text;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_media_field not in ('logo','cover') then raise exception 'Invalid media field'; end if;
  if p_mime_type not in ('image/jpeg','image/png','image/webp')
     or p_file_size_bytes <= 0 or p_file_size_bytes > 5242880 then
    raise exception 'Image must be JPG, PNG or WebP and no larger than 5 MB';
  end if;

  select owner_id,status,plan_code into v_owner_id,v_business_status,v_plan_code
  from public.businesses where id=p_business_id for update;
  if v_owner_id is distinct from auth.uid() then
    raise exception 'You can only change images for your own business' using errcode='42501';
  end if;
  if v_business_status is distinct from 'published' then
    raise exception 'Only published businesses can request profile image changes';
  end if;
  if p_media_field='cover' and not exists (
    select 1 from public.plans p
    where p.code=v_plan_code and coalesce(p.features->>'cover','false')='true'
  ) then
    raise exception 'A Basic or Premium plan is required to request a cover image';
  end if;

  v_month_start := date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
  if (select count(*) from public.business_image_change_requests
      where business_id=p_business_id and owner_id=auth.uid()
        and requested_at >= v_month_start
        and requested_at < v_month_start + interval '1 month') >= 2 then
    raise exception 'Monthly logo and cover image change limit reached (2 per business)';
  end if;

  if p_storage_path !~ ('^owners/' || auth.uid()::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'Invalid private media path';
  end if;

  select metadata into v_object_metadata
  from storage.objects
  where bucket_id='hs-pending-business-media' and name=p_storage_path;
  if not found then
    raise exception 'Uploaded private business image was not found';
  end if;
  v_actual_size := nullif(v_object_metadata->>'size','')::bigint;
  v_actual_mime := v_object_metadata->>'mimetype';
  if v_actual_size is distinct from p_file_size_bytes or v_actual_mime is distinct from p_mime_type then
    raise exception 'Uploaded image metadata does not match the declared file type or size';
  end if;

  insert into public.business_media_assets(
    business_id,uploader_id,media_field,storage_path,mime_type,file_size_bytes
  ) values(p_business_id,auth.uid(),p_media_field,p_storage_path,p_mime_type,p_file_size_bytes)
  returning id into v_asset_id;

  insert into public.business_image_change_requests(business_id,owner_id,media_field,media_asset_id)
  values(p_business_id,auth.uid(),p_media_field,v_asset_id)
  returning id into v_request_id;

  return v_request_id;
end
$function$;

commit;
