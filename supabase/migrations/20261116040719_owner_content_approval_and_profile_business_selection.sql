-- Owner content approval and owner-controlled public-profile business selection.
alter table public.submissions drop constraint if exists submissions_type_check;
alter table public.submissions add constraint submissions_type_check check (type = any (array[
 'new_business','correction','claim','phone_suggestion','report','broken_image','plan_upgrade',
 'owner_product','owner_service','owner_offer'
]::text[]));

drop policy if exists submissions_owner_read on public.submissions;
create policy submissions_owner_read on public.submissions for select to authenticated
using (submitted_by=(select auth.uid()) and type in ('new_business','claim','plan_upgrade','owner_product','owner_service','owner_offer'));

drop policy if exists business_products_owner_insert on public.business_products;
drop policy if exists business_products_owner_update on public.business_products;
drop policy if exists business_products_owner_delete on public.business_products;
create policy business_products_staff_insert on public.business_products for insert to authenticated
with check (private.is_super_admin() or private.staff_has_permission('business.publish'));
create policy business_products_staff_update on public.business_products for update to authenticated
using (private.is_super_admin() or private.staff_has_permission('business.publish'))
with check (private.is_super_admin() or private.staff_has_permission('business.publish'));
create policy business_products_staff_delete on public.business_products for delete to authenticated
using (private.is_super_admin() or private.staff_has_permission('business.publish'));

drop policy if exists offers_insert on public.offers;
drop policy if exists offers_update on public.offers;
drop policy if exists offers_delete on public.offers;
create policy offers_staff_insert on public.offers for insert to authenticated
with check (private.is_super_admin() or private.staff_has_permission('tiers.manage'));
create policy offers_staff_update on public.offers for update to authenticated
using (private.is_super_admin() or private.staff_has_permission('tiers.manage'))
with check (private.is_super_admin() or private.staff_has_permission('tiers.manage'));
create policy offers_staff_delete on public.offers for delete to authenticated
using (private.is_super_admin() or private.staff_has_permission('tiers.manage'));

create or replace function public.block_unapproved_owner_service_edits()
returns trigger language plpgsql set search_path=''
as $function$
begin
 if auth.uid() is not null and old.owner_id=(select auth.uid())
    and current_setting('app.approving_submission',true) is distinct from 'true'
    and (new.services_en is distinct from old.services_en or new.services_ur is distinct from old.services_ur) then
   raise exception 'Service changes must be submitted for Admin approval' using errcode='42501';
 end if;
 return new;
end
$function$;
drop trigger if exists businesses_block_unapproved_owner_services on public.businesses;
create trigger businesses_block_unapproved_owner_services before update of services_en,services_ur
on public.businesses for each row execute function public.block_unapproved_owner_service_edits();

create or replace function public.enforce_offer_plan_limit()
returns trigger language plpgsql set search_path=''
as $function$
declare max_offers integer; used_active integer; approval_context boolean:=current_setting('app.approving_submission',true)='true';
begin
 if auth.uid() is not null and (private.is_super_admin() or private.staff_has_permission('tiers.manage')) then return new; end if;
 if not private.is_owner_of(new.business_id) and not approval_context then
   raise exception 'Only the business owner can manage offers' using errcode='42501';
 end if;
 if new.status='active' and new.valid_from<=current_date and new.valid_to>=current_date then
   select coalesce((p.limits->>'offers')::integer,0) into max_offers from public.plans p where p.code=private.effective_plan(new.business_id);
   select count(*)::integer into used_active from public.offers o where o.business_id=new.business_id
    and o.id<>coalesce(new.id,'00000000-0000-0000-0000-000000000000'::uuid)
    and o.status='active' and o.valid_from<=current_date and o.valid_to>=current_date;
   if used_active>=coalesce(max_offers,0) then raise exception 'The business plan active offer limit has been reached' using errcode='23514'; end if;
 end if;
 return new;
end
$function$;

create or replace function private.submit_owner_content_request(p_business_id uuid,p_type text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=''
as $function$
declare v_owner uuid; v_id uuid;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_type not in ('owner_product','owner_service','owner_offer') then raise exception 'Unsupported owner content type'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>8192 then raise exception 'Invalid content request'; end if;
 select owner_id into v_owner from public.businesses where id=p_business_id for update;
 if not found or v_owner is distinct from auth.uid() then raise exception 'You do not own this business' using errcode='42501'; end if;
 if exists(select 1 from public.submissions s where s.business_id=p_business_id and s.submitted_by=auth.uid()
   and s.type=p_type and s.status in ('new','in_review')
   and (p_type='owner_service' or coalesce(s.payload->>'id','')=coalesce(p_payload->>'id',''))) then
   raise exception 'A similar request is already awaiting Admin review';
 end if;
 insert into public.submissions(type,business_id,payload,submitted_by,status,created_at,updated_at)
 values(p_type,p_business_id,p_payload,auth.uid(),'new',now(),now()) returning id into v_id;
 return v_id;
end
$function$;
revoke all on function private.submit_owner_content_request(uuid,text,jsonb) from public;
grant execute on function private.submit_owner_content_request(uuid,text,jsonb) to authenticated;
create or replace function public.submit_owner_content_request(p_business_id uuid,p_type text,p_payload jsonb)
returns uuid language sql security invoker set search_path=''
as $function$ select private.submit_owner_content_request(p_business_id,p_type,p_payload) $function$;
revoke all on function public.submit_owner_content_request(uuid,text,jsonb) from public;
grant execute on function public.submit_owner_content_request(uuid,text,jsonb) to authenticated;

create or replace function private.approve_submission(p_submission_id uuid,p_action text)
returns void language plpgsql security definer set search_path=''
as $function$
declare s public.submissions%rowtype; p jsonb; city uuid; new_id uuid; new_owner uuid; claim_owner uuid; v_content_id uuid;
begin
 if not private.staff_has_permission('moderation.review') then raise exception 'Permission denied'; end if;
 if p_action not in ('approve','reject') then raise exception 'Invalid action'; end if;
 select * into s from public.submissions where id=p_submission_id for update;
 if not found then raise exception 'Submission not found'; end if;
 p:=s.payload;
 perform set_config('app.approving_submission','true',true);
 if p_action='approve' then
  if s.type='new_business' then
   if s.submitted_by is not null then
    select id into new_owner from public.profiles where id=s.submitted_by and role='owner' and is_active;
    if new_owner is null then raise exception 'The submitter account is no longer an active owner account'; end if;
   end if;
   select id into city from public.cities where slug='sadiqabad';
   insert into public.businesses(city_id,owner_id,name_en,name_ur,slug,category_id,area_id,address_en,address_ur,phone_primary,whatsapp,description_en,description_ur,logo_url,cover_url,services_en,status,source,created_by,published_at)
   values(city,new_owner,coalesce(nullif(p->>'name_en',''),'New Sadiqabad Business'),p->>'name_ur',
    lower(regexp_replace(coalesce(nullif(p->>'name_en',''),'new-business'),'[^a-zA-Z0-9]+','-','g'))||'-'||substr(gen_random_uuid()::text,1,6),
    (p->>'category_id')::uuid,nullif(p->>'area_id','')::uuid,p->>'address_en',p->>'address_ur',
    coalesce(nullif(p->>'phone_primary',''),s.contact_phone),p->>'whatsapp',p->>'description_en',p->>'description_ur',p->>'logo_url',p->>'cover_url',
    case when jsonb_typeof(p->'services_en')='array' then array(select jsonb_array_elements_text(p->'services_en')) else '{}'::text[] end,
    'published','visitor_submission',auth.uid(),now()) returning id into new_id;
   if new_owner is not null then
    insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path,is_read,created_at)
    values(new_owner,'listing_status','Your business listing is approved','آپ کی کاروباری لسٹنگ منظور ہو گئی',
     'Your new business listing is now published and available in the Owner Portal.','آپ کی نئی کاروباری لسٹنگ شائع ہو گئی ہے اور اب اونر پورٹل میں دستیاب ہے۔','/owner',false,now());
   end if;
  elsif s.type in('correction','phone_suggestion') and s.business_id is not null then
   update public.businesses set phone_primary=coalesce(nullif(p->>'phone_primary',''),phone_primary),
    address_en=coalesce(nullif(p->>'address_en',''),address_en),
    status=case when lower(coalesce(p->>'reason','')) like '%permanently closed%' then 'archived' else status end,updated_at=now()
   where id=s.business_id;
  elsif s.type='claim' and s.business_id is not null then
   if s.submitted_by is not null then
    select id into claim_owner from public.profiles where id=s.submitted_by and role='owner' and is_active;
    if claim_owner is null then raise exception 'The claimant account is no longer an active owner account'; end if;
    update public.businesses set owner_id=claim_owner,claimed_at=now(),is_verified=true,
     owner_name=coalesce(nullif(p->>'owner_name',''),owner_name),updated_at=now()
    where id=s.business_id and (owner_id is null or owner_id=claim_owner);
    if not found then raise exception 'This business is already assigned to another owner; manual review is required'; end if;
    insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path,is_read,created_at)
    values(claim_owner,'claim','Business claim approved','کاروبار کی ملکیت منظور ہو گئی',
     'Your ownership claim has been approved. Your business is now available in the Owner Portal.','آپ کی ملکیت کی درخواست منظور ہو گئی ہے۔ اب آپ کا کاروبار اونر پورٹل میں موجود ہے۔','/owner',false,now());
   else
    update public.businesses set claimed_at=now(),is_verified=true,owner_name=coalesce(nullif(p->>'owner_name',''),owner_name),updated_at=now() where id=s.business_id;
   end if;
  elsif s.type='report' and s.business_id is not null then
   update public.businesses set status=case when lower(coalesce(p->>'reason','')) like '%permanently closed%' then 'archived' else status end,updated_at=now() where id=s.business_id;
  elsif s.type='plan_upgrade' and s.business_id is not null then
   if p->>'requested_plan' in('basic','premium') then update public.businesses set plan_code=p->>'requested_plan',plan_expires_at=now()+interval '1 year',updated_at=now() where id=s.business_id; end if;
  elsif s.type in('owner_product','owner_offer','owner_service') then
   if s.submitted_by is null or not exists(select 1 from public.businesses b where b.id=s.business_id and b.owner_id=s.submitted_by) then raise exception 'The business is no longer assigned to the submitting owner'; end if;
   if s.type='owner_product' then
    if coalesce(p->>'action','upsert')='delete' then
     delete from public.business_products where id=(p->>'id')::uuid and business_id=s.business_id;
     if not found then raise exception 'Product no longer exists'; end if;
    else
     v_content_id:=coalesce(nullif(p->>'id','')::uuid,gen_random_uuid());
     insert into public.business_products(id,business_id,name_en,name_ur,description_en,description_ur,price,image_url,is_active,sort_order)
     values(v_content_id,s.business_id,btrim(p->>'name_en'),nullif(btrim(p->>'name_ur'),''),
      nullif(btrim(p->>'description_en'),''),nullif(btrim(p->>'description_ur'),''),nullif(p->>'price','')::numeric,
      nullif(btrim(p->>'image_url'),''),coalesce((p->>'is_active')::boolean,true),coalesce((p->>'sort_order')::integer,0))
     on conflict(id) do update set name_en=excluded.name_en,name_ur=excluded.name_ur,description_en=excluded.description_en,
      description_ur=excluded.description_ur,price=excluded.price,image_url=excluded.image_url,is_active=excluded.is_active,
      sort_order=excluded.sort_order,updated_at=now()
     where public.business_products.business_id=s.business_id;
     if not found then raise exception 'Product could not be applied to this business'; end if;
    end if;
   elsif s.type='owner_offer' then
    if coalesce(p->>'action','upsert')='delete' then
     delete from public.offers where id=(p->>'id')::uuid and business_id=s.business_id;
     if not found then raise exception 'Offer no longer exists'; end if;
    else
     v_content_id:=coalesce(nullif(p->>'id','')::uuid,gen_random_uuid());
     insert into public.offers(id,business_id,title,description,image_url,valid_from,valid_to,status)
     values(v_content_id,s.business_id,btrim(p->>'title'),nullif(btrim(p->>'description'),''),nullif(btrim(p->>'image_url'),''),
      (p->>'valid_from')::date,(p->>'valid_to')::date,coalesce(p->>'status','active'))
     on conflict(id) do update set title=excluded.title,description=excluded.description,image_url=excluded.image_url,
      valid_from=excluded.valid_from,valid_to=excluded.valid_to,status=excluded.status,updated_at=now()
     where public.offers.business_id=s.business_id;
     if not found then raise exception 'Offer could not be applied to this business'; end if;
    end if;
   elsif s.type='owner_service' then
    update public.businesses set services_en=array(select jsonb_array_elements_text(p->'services_en')),
     services_ur=array(select jsonb_array_elements_text(p->'services_ur')),updated_at=now() where id=s.business_id;
   end if;
   insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path,is_read,created_at)
   values(s.submitted_by,'general','Your content request was approved','آپ کی مواد کی درخواست منظور ہو گئی',
    'Your submitted business content has been approved and applied.','آپ کا بھیجا گیا کاروباری مواد منظور کر کے لاگو کر دیا گیا ہے۔','/owner',false,now());
  end if;
  update public.submissions set status='done',updated_at=now() where id=p_submission_id;
 else
  update public.submissions set status='rejected',updated_at=now() where id=p_submission_id;
 end if;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details)
 values(auth.uid(),'submission.'||p_action,'submissions',p_submission_id::text,
  jsonb_build_object('type',s.type,'business_id',s.business_id,'submitted_by',s.submitted_by));
end
$function$;
create or replace function public.approve_submission(p_submission_id uuid,p_action text)
returns void language sql set search_path=''
as $function$ select private.approve_submission(p_submission_id,p_action) $function$;

create table if not exists public.owner_public_profile_businesses(
 owner_id uuid not null references public.profiles(id) on delete cascade,
 business_id uuid not null references public.businesses(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(owner_id,business_id)
);
create index if not exists idx_owner_public_profile_businesses_business on public.owner_public_profile_businesses(business_id);
alter table public.owner_public_profile_businesses enable row level security;
revoke all on public.owner_public_profile_businesses from anon,public;
grant select on public.owner_public_profile_businesses to anon,authenticated;
grant insert,delete on public.owner_public_profile_businesses to authenticated;
drop policy if exists owner_public_profile_businesses_read on public.owner_public_profile_businesses;
create policy owner_public_profile_businesses_read on public.owner_public_profile_businesses for select
using ((select auth.uid())=owner_public_profile_businesses.owner_id or private.is_super_admin()
 or private.staff_has_permission('owners.create')
 or (exists(select 1 from public.owner_public_profile_directory d where d.owner_id=owner_public_profile_businesses.owner_id)
 and exists(select 1 from public.businesses b where b.id=owner_public_profile_businesses.business_id
  and b.owner_id=owner_public_profile_businesses.owner_id and b.status='published')));
create policy owner_public_profile_businesses_insert on public.owner_public_profile_businesses for insert to authenticated
with check ((select auth.uid())=owner_id and exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid()) and b.status='published'));
create policy owner_public_profile_businesses_delete on public.owner_public_profile_businesses for delete to authenticated
using ((select auth.uid())=owner_id and exists(select 1 from public.businesses b where b.id=business_id and b.owner_id=(select auth.uid())));

create or replace function private.set_owner_public_profile_businesses(p_business_ids uuid[])
returns void language plpgsql security definer set search_path=''
as $function$
declare v_owner uuid:=auth.uid(); v_count integer;
begin
 if v_owner is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if coalesce(cardinality(p_business_ids),0)>50 then raise exception 'You can select up to 50 businesses'; end if;
 select count(*) into v_count from public.businesses b where b.owner_id=v_owner and b.status='published' and b.id=any(coalesce(p_business_ids,'{}'::uuid[]));
 if v_count<>coalesce(cardinality(p_business_ids),0) then raise exception 'Only your published businesses can be selected'; end if;
 insert into public.owner_public_profile_businesses(owner_id,business_id)
 select v_owner,x from unnest(coalesce(p_business_ids,'{}'::uuid[])) x on conflict(owner_id,business_id) do nothing;
 delete from public.owner_public_profile_businesses m where m.owner_id=v_owner and not(m.business_id=any(coalesce(p_business_ids,'{}'::uuid[])));
end
$function$;
revoke all on function private.set_owner_public_profile_businesses(uuid[]) from public;
grant execute on function private.set_owner_public_profile_businesses(uuid[]) to authenticated;
create or replace function public.set_owner_public_profile_businesses(p_business_ids uuid[])
returns void language sql security invoker set search_path=''
as $function$ select private.set_owner_public_profile_businesses(p_business_ids) $function$;
revoke all on function public.set_owner_public_profile_businesses(uuid[]) from public;
grant execute on function public.set_owner_public_profile_businesses(uuid[]) to authenticated;
