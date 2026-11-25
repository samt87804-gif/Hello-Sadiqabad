-- Phase 2: additive field-level business approval, private media, and owner invite linkage.
-- Existing submissions and non-new-business moderation paths remain intact.
begin;

alter table public.businesses
  add column if not exists map_url text;

alter table public.owner_registration_requests
  add column if not exists submission_id uuid references public.submissions(id) on delete set null,
  add column if not exists business_id uuid references public.businesses(id) on delete set null;

create index if not exists owner_registration_submission_idx
  on public.owner_registration_requests(submission_id) where submission_id is not null;
create index if not exists owner_registration_business_idx
  on public.owner_registration_requests(business_id) where business_id is not null;

create table if not exists public.business_field_reviews (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  field_key text not null,
  field_value jsonb not null,
  status text not null default 'pending_review'
    check (status in ('pending_review','approved_published','rejected','unpublished')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(submission_id, field_key)
);
create index if not exists business_field_reviews_queue_idx
  on public.business_field_reviews(status, created_at desc);
create index if not exists business_field_reviews_submission_idx
  on public.business_field_reviews(submission_id, field_key);

alter table public.business_field_reviews enable row level security;
revoke all on public.business_field_reviews from anon, authenticated;
grant select on public.business_field_reviews to authenticated;
create policy business_field_reviews_admin_read on public.business_field_reviews
  for select to authenticated
  using (private.is_super_admin() or private.staff_has_permission('moderation.review'));

create table if not exists public.business_media_assets (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references public.submissions(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  uploader_id uuid references auth.users(id) on delete set null,
  media_field text not null check (media_field in ('logo','cover')),
  bucket_id text not null default 'hs-pending-business-media',
  storage_path text not null unique,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  file_size_bytes bigint not null check (file_size_bytes > 0 and file_size_bytes <= 5242880),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved_published','rejected','unpublished')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((submission_id is not null) or (business_id is not null))
);
create index if not exists business_media_assets_submission_idx
  on public.business_media_assets(submission_id, created_at desc);
create index if not exists business_media_assets_business_idx
  on public.business_media_assets(business_id, created_at desc);

alter table public.business_media_assets enable row level security;
revoke all on public.business_media_assets from anon, authenticated;
grant select on public.business_media_assets to authenticated;
create policy business_media_assets_admin_read on public.business_media_assets
  for select to authenticated
  using (private.is_super_admin() or private.staff_has_permission('moderation.review'));

create table if not exists public.business_image_change_requests (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  media_field text not null check (media_field in ('logo','cover')),
  media_asset_id uuid references public.business_media_assets(id) on delete set null,
  requested_at timestamptz not null default now(),
  status text not null default 'pending_review'
    check (status in ('pending_review','approved_published','rejected','unpublished')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  admin_note text check (admin_note is null or char_length(admin_note) <= 1000)
);
create index if not exists business_image_change_monthly_idx
  on public.business_image_change_requests(owner_id, requested_at desc);

alter table public.business_image_change_requests enable row level security;
revoke all on public.business_image_change_requests from anon, authenticated;
grant select on public.business_image_change_requests to authenticated;
create policy business_image_change_requests_owner_read on public.business_image_change_requests
  for select to authenticated using (owner_id = (select auth.uid()));
create policy business_image_change_requests_admin_read on public.business_image_change_requests
  for select to authenticated
  using (private.is_super_admin() or private.staff_has_permission('moderation.review'));

-- The bucket is deliberately private. A folder name never makes the existing public bucket private.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('hs-pending-business-media','hs-pending-business-media',false,5242880,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=false, file_size_limit=5242880,
  allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists hs_pending_media_admin_read on storage.objects;
create policy hs_pending_media_admin_read on storage.objects
  for select to authenticated
  using (bucket_id='hs-pending-business-media'
    and (private.is_super_admin() or private.staff_has_permission('moderation.review')));

drop policy if exists hs_pending_media_public_submit on storage.objects;
create policy hs_pending_media_public_submit on storage.objects
  for insert to anon, authenticated
  with check (bucket_id='hs-pending-business-media'
    and (storage.foldername(name))[1]='pending'
    and (storage.extension(name) in ('jpg','jpeg','png','webp')));

drop policy if exists hs_pending_media_owner_upload on storage.objects;
create policy hs_pending_media_owner_upload on storage.objects
  for insert to authenticated
  with check (bucket_id='hs-pending-business-media'
    and (storage.foldername(name))[1]='owners'
    and (storage.foldername(name))[2]=(select auth.uid())::text);

-- Generate a review record for each public-facing field. Private owner email/contact data is excluded.
create or replace function private.seed_business_field_reviews()
returns trigger language plpgsql security definer set search_path=''
as $function$
declare
  field_item record;
begin
  if new.type <> 'new_business' then return new; end if;
  for field_item in
    select key, value
    from jsonb_each(coalesce(new.payload, '{}'::jsonb))
    where key = any(array[
      'name_en','name_ur','category_id','area_id','phone_primary','whatsapp',
      'address_en','address_ur','landmark_en','landmark_ur','map_url',
      'opening_hours','description_en','description_ur','services_en','services_ur',
      'owner_name'
    ])
  loop
    insert into public.business_field_reviews(submission_id,field_key,field_value)
    values(new.id,field_item.key,field_item.value)
    on conflict(submission_id,field_key) do update
      set field_value=excluded.field_value,status='pending_review',
          reviewed_by=null,reviewed_at=null,admin_note=null,updated_at=now();
  end loop;
  return new;
end
$function$;

drop trigger if exists submissions_seed_business_field_reviews on public.submissions;
create trigger submissions_seed_business_field_reviews
  after insert on public.submissions
  for each row execute function private.seed_business_field_reviews();

-- Stop the legacy all-at-once new_business approval path. Other submission types continue unchanged.
create or replace function private.guard_legacy_new_business_approval()
returns trigger language plpgsql set search_path=''
as $function$
begin
  if old.type='new_business' and new.status='done'
     and current_setting('app.business_field_review',true) is distinct from 'true' then
    raise exception 'New business submissions must be reviewed field by field' using errcode='42501';
  end if;
  return new;
end
$function$;

drop trigger if exists submissions_guard_legacy_new_business_approval on public.submissions;
create trigger submissions_guard_legacy_new_business_approval
  before update of status on public.submissions
  for each row execute function private.guard_legacy_new_business_approval();

-- Pakistan-local month quota. Admin review actions never consume owner quota.
create or replace function public.request_business_image_change(
  p_business_id uuid, p_media_field text, p_storage_path text, p_mime_type text, p_file_size_bytes bigint
) returns uuid language plpgsql security definer set search_path=''
as $function$
declare
  v_asset_id uuid;
  v_request_id uuid;
  v_owner_id uuid;
  v_month_start timestamptz;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if p_media_field not in ('logo','cover') then raise exception 'Invalid media field'; end if;
  if p_mime_type not in ('image/jpeg','image/png','image/webp')
     or p_file_size_bytes <= 0 or p_file_size_bytes > 5242880 then
    raise exception 'Image must be JPG, PNG or WebP and no larger than 5 MB';
  end if;
  select owner_id into v_owner_id from public.businesses where id=p_business_id for update;
  if v_owner_id is distinct from auth.uid() then
    raise exception 'You can only change images for your own business' using errcode='42501';
  end if;
  v_month_start := date_trunc('month', now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
  if (select count(*) from public.business_image_change_requests
      where business_id=p_business_id and owner_id=auth.uid()
        and requested_at >= v_month_start
        and requested_at < v_month_start + interval '1 month') >= 2 then
    raise exception 'Monthly logo and cover image change limit reached (2 per business)';
  end if;
  if p_storage_path !~ ('^owners/' || auth.uid()::text || '/[A-Za-z0-9._-]+  insert into public.business_media_assets(
    business_id,uploader_id,media_field,storage_path,mime_type,file_size_bytes
  ) values(p_business_id,auth.uid(),p_media_field,p_storage_path,p_mime_type,p_file_size_bytes)
  returning id into v_asset_id;
  insert into public.business_image_change_requests(business_id,owner_id,media_field,media_asset_id)
  values(p_business_id,auth.uid(),p_media_field,v_asset_id)
  returning id into v_request_id;
  return v_request_id;
end
$function$;
revoke all on function public.request_business_image_change(uuid,text,text,text,bigint) from public, anon;
grant execute on function public.request_business_image_change(uuid,text,text,text,bigint) to authenticated;


-- Backfill existing submissions without rewriting any business or submission records.
insert into public.business_field_reviews(submission_id,field_key,field_value,status)
select s.id, item.key, item.value,
  case when s.status='done' and s.business_id is not null then 'approved_published' else 'pending_review' end
from public.submissions s
cross join lateral jsonb_each(coalesce(s.payload,'{}'::jsonb)) item
where s.type='new_business'
  and item.key = any(array[
    'name_en','name_ur','category_id','area_id','phone_primary','whatsapp',
    'address_en','address_ur','landmark_en','landmark_ur','map_url',
    'opening_hours','description_en','description_ur','services_en','services_ur',
    'owner_name'
  ])
on conflict(submission_id,field_key) do nothing;

commit;
) then
    raise exception 'Invalid private media path';
  end if;
  if not exists (
    select 1 from storage.objects
    where bucket_id='hs-pending-business-media' and name=p_storage_path
  ) then
    raise exception 'Uploaded private business image was not found';
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
revoke all on function public.request_business_image_change(uuid,text,text,text,bigint) from public, anon;
grant execute on function public.request_business_image_change(uuid,text,text,text,bigint) to authenticated;


-- Backfill existing submissions without rewriting any business or submission records.
insert into public.business_field_reviews(submission_id,field_key,field_value,status)
select s.id, item.key, item.value,
  case when s.status='done' and s.business_id is not null then 'approved_published' else 'pending_review' end
from public.submissions s
cross join lateral jsonb_each(coalesce(s.payload,'{}'::jsonb)) item
where s.type='new_business'
  and item.key = any(array[
    'name_en','name_ur','category_id','area_id','phone_primary','whatsapp',
    'address_en','address_ur','landmark_en','landmark_ur','map_url',
    'opening_hours','description_en','description_ur','services_en','services_ur',
    'owner_name'
  ])
on conflict(submission_id,field_key) do nothing;

commit;
