-- A logo URL is not a plan-gated feature; don't revalidate unrelated legacy plan fields.
begin;

create or replace function public.enforce_business_plan_limits()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
declare
  plan_code text;
  limits jsonb;
  features jsonb;
  social_count int;
begin
  -- Owner assignment, claim timestamp and logo URL are administrative/media metadata.
  -- Avoid rejecting these isolated updates because of unrelated legacy plan fields.
  if tg_op = 'UPDATE'
     and (to_jsonb(new) - array['owner_id', 'claimed_at', 'updated_at', 'logo_url'])
         = (to_jsonb(old) - array['owner_id', 'claimed_at', 'updated_at', 'logo_url']) then
    return new;
  end if;

  if current_user = 'service_role' then
    return new;
  end if;

  if auth.uid() is not null and (
    private.is_super_admin()
    or private.staff_has_permission('business.edit_own')
    or private.staff_has_permission('business.publish')
  ) then
    return new;
  end if;

  plan_code := case
    when new.plan_expires_at is not null and new.plan_expires_at < now() then 'free'
    else new.plan_code
  end;

  select p.limits, p.features into limits, features
  from public.plans p where p.code=plan_code;

  if limits is null then raise exception 'Business plan is not configured'; end if;
  if coalesce(array_length(new.gallery_urls,1),0)>coalesce((limits->>'max_photos')::int,0) then raise exception 'Your plan photo limit has been reached'; end if;
  if coalesce(array_length(new.video_urls,1),0)>coalesce((limits->>'max_videos')::int,0) then raise exception 'Your plan video limit has been reached'; end if;

  social_count := (new.website_url is not null)::int
    + (new.facebook_url is not null)::int
    + (new.instagram_url is not null)::int
    + (new.youtube_url is not null)::int
    + (new.tiktok_url is not null)::int;

  if social_count>coalesce((limits->>'social_links')::int,0) then raise exception 'Your plan social link limit has been reached'; end if;
  if new.whatsapp is not null and coalesce((features->>'whatsapp')::boolean,false)=false then raise exception 'WhatsApp is not included in your current plan'; end if;
  if new.cover_url is not null and coalesce((features->>'cover')::boolean,false)=false then raise exception 'Cover images are not included in your current plan'; end if;
  if coalesce(array_length(new.gallery_urls,1),0)>0 and coalesce((features->>'gallery')::boolean,false)=false then raise exception 'Photo galleries are not included in your current plan'; end if;
  if coalesce(array_length(new.video_urls,1),0)>0 and coalesce((features->>'videos')::boolean,false)=false then raise exception 'Videos are not included in your current plan'; end if;
  if social_count>0 and coalesce((features->>'social_links')::boolean,false)=false then raise exception 'Social links are not included in your current plan'; end if;

  return new;
end
$function$;

commit;
