-- Tighten validation for owner-submitted catalogue, service and offer requests.
create or replace function private.submit_owner_content_request(p_business_id uuid,p_type text,p_payload jsonb)
returns uuid language plpgsql security definer set search_path=''
as $function$
declare v_owner uuid; v_action text; v_id uuid; v_services_en text[]; v_services_ur text[];
 v_name text; v_price numeric; v_image text; v_valid_from date; v_valid_to date; v_sort_order integer; v_is_active boolean;
begin
 if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
 if p_type not in ('owner_product','owner_service','owner_offer') then raise exception 'Unsupported owner content type'; end if;
 if p_payload is null or jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>8192 then raise exception 'Invalid or oversized content request'; end if;
 select b.owner_id into v_owner from public.businesses b where b.id=p_business_id for update;
 if not found or v_owner is distinct from auth.uid() then raise exception 'You do not own this business' using errcode='42501'; end if;
 v_action:=coalesce(p_payload->>'action','upsert');
 if p_type='owner_product' then
  if v_action not in ('upsert','delete') then raise exception 'Invalid product action'; end if;
  if p_payload ? 'id' then
   begin v_id:=(p_payload->>'id')::uuid; exception when others then raise exception 'Invalid product ID'; end;
   if not exists(select 1 from public.business_products where id=v_id and business_id=p_business_id) then raise exception 'Product not found for this business'; end if;
  end if;
  if v_action='upsert' then
   v_name:=btrim(coalesce(p_payload->>'name_en',''));
   if char_length(v_name)<2 or char_length(v_name)>120 then raise exception 'Product name must be 2–120 characters'; end if;
   if coalesce(p_payload->>'name_ur','')<>'' and char_length(p_payload->>'name_ur')>120 then raise exception 'Urdu product name is too long'; end if;
   if coalesce(p_payload->>'description_en','')<>'' and char_length(p_payload->>'description_en')>1000 then raise exception 'Product description is too long'; end if;
   if coalesce(p_payload->>'description_ur','')<>'' and char_length(p_payload->>'description_ur')>1000 then raise exception 'Urdu product description is too long'; end if;
   if nullif(p_payload->>'price','') is not null then begin v_price:=(p_payload->>'price')::numeric; exception when others then raise exception 'Invalid product price'; end; if v_price<0 then raise exception 'Product price cannot be negative'; end if; end if;
   if nullif(p_payload->>'sort_order','') is not null then begin v_sort_order:=(p_payload->>'sort_order')::integer; exception when others then raise exception 'Invalid product sort order'; end; end if;
   if nullif(p_payload->>'is_active','') is not null then begin v_is_active:=(p_payload->>'is_active')::boolean; exception when others then raise exception 'Invalid product visibility'; end; end if;
   v_image:=nullif(btrim(p_payload->>'image_url'),'');
   if v_image is not null and not public.is_valid_https_url(v_image) then raise exception 'Product image must use HTTPS'; end if;
  end if;
 elsif p_type='owner_offer' then
  if v_action not in ('upsert','delete') then raise exception 'Invalid offer action'; end if;
  if p_payload ? 'id' then
   begin v_id:=(p_payload->>'id')::uuid; exception when others then raise exception 'Invalid offer ID'; end;
   if not exists(select 1 from public.offers where id=v_id and business_id=p_business_id) then raise exception 'Offer not found for this business'; end if;
  end if;
  if v_action='upsert' then
   if char_length(btrim(coalesce(p_payload->>'title','')))<2 or char_length(btrim(coalesce(p_payload->>'title','')))>160 then raise exception 'Offer title must be 2–160 characters'; end if;
   if coalesce(p_payload->>'description','')<>'' and char_length(p_payload->>'description')>1500 then raise exception 'Offer description is too long'; end if;
   v_image:=nullif(btrim(p_payload->>'image_url'),'');
   if v_image is not null and not public.is_valid_https_url(v_image) then raise exception 'Offer image must use HTTPS'; end if;
   begin v_valid_from:=(p_payload->>'valid_from')::date; v_valid_to:=(p_payload->>'valid_to')::date; exception when others then raise exception 'Offer dates are invalid'; end;
   if v_valid_to<v_valid_from then raise exception 'Offer end date must be on or after start date'; end if;
   if coalesce(p_payload->>'status','active') not in ('active','paused') then raise exception 'Invalid offer status'; end if;
  end if;
 elsif p_type='owner_service' then
  if v_action<>'upsert' then raise exception 'Invalid service request action'; end if;
  if jsonb_typeof(p_payload->'services_en') is distinct from 'array' or jsonb_typeof(p_payload->'services_ur') is distinct from 'array' then raise exception 'Service lists must be arrays'; end if;
  select coalesce(array_agg(btrim(value) order by ord),'{}'::text[]) into v_services_en from jsonb_array_elements_text(p_payload->'services_en') with ordinality as x(value,ord) where btrim(value)<>'';
  select coalesce(array_agg(btrim(value) order by ord),'{}'::text[]) into v_services_ur from jsonb_array_elements_text(p_payload->'services_ur') with ordinality as x(value,ord) where btrim(value)<>'';
  if cardinality(v_services_en)>2 or cardinality(v_services_ur)>2 then raise exception 'A maximum of two services is allowed'; end if;
  if exists(select 1 from unnest(v_services_en||v_services_ur) s where char_length(s)>100) then raise exception 'Service names must be 100 characters or fewer'; end if;
 end if;
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
