-- Atomic/idempotent database finalization for business media moderation.
begin;

create or replace function public.finalize_business_media_review(
  p_asset_id uuid,
  p_action text,
  p_actor_id uuid,
  p_admin_note text default null
) returns boolean
language plpgsql
security invoker
set search_path=''
as $function$
declare
  asset_row public.business_media_assets%rowtype;
begin
  if current_user <> 'service_role' then
    raise exception 'Service role required' using errcode='42501';
  end if;
  if p_action not in ('approved_published','rejected','unpublished') then
    raise exception 'Invalid media review status';
  end if;
  if p_actor_id is null then
    raise exception 'Review actor is required';
  end if;
  if p_admin_note is not null and char_length(p_admin_note)>1000 then
    raise exception 'Admin note is too long';
  end if;

  select * into asset_row
  from public.business_media_assets
  where id=p_asset_id
  for update;
  if not found then
    raise exception 'Business media asset not found';
  end if;

  if asset_row.status=p_action then
    return false;
  end if;
  if asset_row.status='rejected' then
    raise exception 'Rejected media cannot be published';
  end if;
  if p_action='unpublished' and asset_row.status<>'approved_published' then
    raise exception 'Only published media can be unpublished';
  end if;

  update public.business_media_assets
  set status=p_action,
      reviewed_by=p_actor_id,
      reviewed_at=now(),
      admin_note=nullif(btrim(p_admin_note),''),
      updated_at=now()
  where id=p_asset_id;

  update public.business_image_change_requests
  set status=p_action,
      reviewed_by=p_actor_id,
      reviewed_at=now(),
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

revoke all on function public.finalize_business_media_review(uuid,text,uuid,text) from public, anon, authenticated;
grant execute on function public.finalize_business_media_review(uuid,text,uuid,text) to service_role;

commit;
