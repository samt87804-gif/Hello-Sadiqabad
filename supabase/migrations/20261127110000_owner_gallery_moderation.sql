-- Phase 4B: owner-managed, Admin-approved business gallery uploads.
-- Existing gallery URLs remain untouched; new images use the private media lifecycle.
begin;

alter table public.business_media_assets
  drop constraint if exists business_media_assets_media_field_check;
alter table public.business_media_assets
  add constraint business_media_assets_media_field_check
  check (media_field in ('logo','cover','gallery'));

-- Gallery requests are represented by business_media_assets only; the legacy
-- monthly logo/cover request allowance remains unchanged.
drop policy if exists business_media_assets_owner_read on public.business_media_assets;
create policy business_media_assets_owner_read on public.business_media_assets
  for select to authenticated
  using (uploader_id = (select auth.uid())
    and business_id in (select b.id from public.businesses b where b.owner_id = (select auth.uid())));

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
  v_gallery_limit integer;
  v_gallery_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_media_field not in ('logo','cover','gallery') then raise exception 'Invalid media field'; end if;
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

  if p_media_field='gallery' then
    select coalesce((p.limits->>'gallery')::integer,0) into v_gallery_limit
    from public.plans p where p.code=v_plan_code and p.is_active=true;
    if coalesce(v_gallery_limit,0)<=0 then
      raise exception 'Your current plan does not include a photo gallery';
    end if;
    select cardinality(coalesce(b.gallery_urls,array[]::text[])) +
      (select count(*)::integer from public.business_media_assets a
       where a.business_id=b.id and a.media_field='gallery'
         and a.status in ('pending_review','approved_pending_promotion'))
      into v_gallery_count
    from public.businesses b where b.id=p_business_id;
    if coalesce(v_gallery_count,0)>=v_gallery_limit then
      raise exception 'Your plan gallery limit has been reached';
    end if;
  else
    v_month_start := date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
    if (select count(*) from public.business_image_change_requests
        where business_id=p_business_id and owner_id=auth.uid()
          and requested_at >= v_month_start
          and requested_at < v_month_start + interval '1 month') >= 2 then
      raise exception 'Monthly logo and cover image change limit reached (2 per business)';
    end if;
  end if;

  if p_storage_path !~ ('^owners/' || auth.uid()::text || '/[A-Za-z0-9._-]+$') then
    raise exception 'Invalid private media path';
  end if;
  select metadata into v_object_metadata from storage.objects
  where bucket_id='hs-pending-business-media' and name=p_storage_path;
  if not found then raise exception 'Uploaded private business image was not found'; end if;
  v_actual_size := nullif(v_object_metadata->>'size','')::bigint;
  v_actual_mime := v_object_metadata->>'mimetype';
  if v_actual_size is distinct from p_file_size_bytes or v_actual_mime is distinct from p_mime_type then
    raise exception 'Uploaded image metadata does not match the declared file type or size';
  end if;

  insert into public.business_media_assets(
    business_id,uploader_id,media_field,storage_path,mime_type,file_size_bytes
  ) values(p_business_id,auth.uid(),p_media_field,p_storage_path,p_mime_type,p_file_size_bytes)
  returning id into v_asset_id;

  if p_media_field in ('logo','cover') then
    insert into public.business_image_change_requests(business_id,owner_id,media_field,media_asset_id)
    values(p_business_id,auth.uid(),p_media_field,v_asset_id)
    returning id into v_request_id;
    return v_request_id;
  end if;
  return v_asset_id;
end
$function$;

revoke all on function private.request_business_image_change(uuid,text,text,text,bigint) from public, anon;
grant execute on function private.request_business_image_change(uuid,text,text,text,bigint) to authenticated;

create or replace function public.request_business_image_change(
  p_business_id uuid, p_media_field text, p_storage_path text, p_mime_type text, p_file_size_bytes bigint
) returns uuid language sql security invoker set search_path=''
as $function$
  select private.request_business_image_change(p_business_id,p_media_field,p_storage_path,p_mime_type,p_file_size_bytes)
$function$;
revoke all on function public.request_business_image_change(uuid,text,text,text,bigint) from public, anon;
grant execute on function public.request_business_image_change(uuid,text,text,text,bigint) to authenticated;

commit;
