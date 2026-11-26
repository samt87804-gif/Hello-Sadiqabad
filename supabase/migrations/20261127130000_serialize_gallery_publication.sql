-- Serialize gallery publication/removal with Owner uploads so concurrent Admin actions cannot exceed plan limits.
begin;

create or replace function public.manage_business_gallery_publication(
  p_asset_id uuid,
  p_public_url text,
  p_action text
) returns boolean
language plpgsql
security invoker
set search_path=''
as $function$
declare
  asset_row public.business_media_assets%rowtype;
  business_row public.businesses%rowtype;
  gallery_limit integer;
  gallery_count integer;
begin
  if current_user <> 'service_role' then raise exception 'Service role required' using errcode='42501'; end if;
  if p_action not in ('publish','unpublish') then raise exception 'Invalid gallery action'; end if;
  if p_public_url is null or char_length(p_public_url)>2048 then raise exception 'Invalid public gallery URL'; end if;

  select * into asset_row from public.business_media_assets
  where id=p_asset_id and media_field='gallery' for update;
  if not found or asset_row.business_id is null then raise exception 'Managed gallery photo not found'; end if;

  select * into business_row from public.businesses where id=asset_row.business_id for update;
  if not found then raise exception 'Business not found'; end if;

  if p_action='publish' then
    if business_row.status <> 'published' then return false; end if;
    select coalesce((limits->>'gallery')::integer,0) into gallery_limit
    from public.plans where code=business_row.plan_code and is_active=true;
    if coalesce(gallery_limit,0)<=0 then return false; end if;
    if p_public_url=any(coalesce(business_row.gallery_urls,array[]::text[])) then return true; end if;
    gallery_count := cardinality(coalesce(business_row.gallery_urls,array[]::text[]));
    if gallery_count>=gallery_limit then return false; end if;
    update public.businesses set gallery_urls=array_append(coalesce(gallery_urls,array[]::text[]),p_public_url),updated_at=now()
      where id=business_row.id;
    return true;
  end if;

  update public.businesses
  set gallery_urls=array_remove(coalesce(gallery_urls,array[]::text[]),p_public_url),updated_at=now()
  where id=business_row.id;
  return true;
end
$function$;
revoke all on function public.manage_business_gallery_publication(uuid,text,text) from public,anon,authenticated;
grant execute on function public.manage_business_gallery_publication(uuid,text,text) to service_role;

commit;
