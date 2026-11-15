create table if not exists public.business_products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name_en text not null,
  name_ur text,
  description_en text,
  description_ur text,
  price numeric(12,2),
  image_url text,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_products_name_en_length check (char_length(btrim(name_en)) between 2 and 120),
  constraint business_products_name_ur_length check (name_ur is null or char_length(name_ur) <= 120),
  constraint business_products_description_en_length check (description_en is null or char_length(description_en) <= 1000),
  constraint business_products_description_ur_length check (description_ur is null or char_length(description_ur) <= 1000),
  constraint business_products_price_nonnegative check (price is null or price >= 0),
  constraint business_products_image_https check (public.is_valid_https_url(image_url))
);

create index if not exists idx_business_products_business_sort
  on public.business_products (business_id, sort_order, created_at);

alter table public.business_products enable row level security;

revoke all on public.business_products from anon, public;
revoke all on public.business_products from authenticated;
grant select on public.business_products to anon, authenticated;
grant insert, update, delete on public.business_products to authenticated;
grant all on public.business_products to service_role;

drop policy if exists business_products_public_read on public.business_products;
create policy business_products_public_read
  on public.business_products
  for select
  to anon, authenticated
  using (
    is_active
    and exists (
      select 1 from public.businesses b
      where b.id = business_products.business_id
        and b.status = 'published'
    )
  );

drop policy if exists business_products_owner_read on public.business_products;
create policy business_products_owner_read
  on public.business_products
  for select
  to authenticated
  using (
    private.is_owner_of(business_id)
    or private.is_super_admin()
    or private.staff_has_permission('business.publish')
  );

drop policy if exists business_products_owner_insert on public.business_products;
create policy business_products_owner_insert
  on public.business_products
  for insert
  to authenticated
  with check (
    private.is_owner_of(business_id)
    or private.is_super_admin()
    or private.staff_has_permission('business.publish')
  );

drop policy if exists business_products_owner_update on public.business_products;
create policy business_products_owner_update
  on public.business_products
  for update
  to authenticated
  using (
    private.is_owner_of(business_id)
    or private.is_super_admin()
    or private.staff_has_permission('business.publish')
  )
  with check (
    private.is_owner_of(business_id)
    or private.is_super_admin()
    or private.staff_has_permission('business.publish')
  );

drop policy if exists business_products_owner_delete on public.business_products;
create policy business_products_owner_delete
  on public.business_products
  for delete
  to authenticated
  using (
    private.is_owner_of(business_id)
    or private.is_super_admin()
    or private.staff_has_permission('business.publish')
  );

create or replace function public.enforce_business_product_limit()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  product_count integer;
begin
  if auth.uid() is not null
     and (private.is_super_admin() or private.staff_has_permission('business.publish')) then
    return new;
  end if;

  perform 1
    from public.businesses b
    where b.id = new.business_id
    for update;

  if not found then
    raise exception 'Business listing not found'
      using errcode = '23503';
  end if;

  if tg_op = 'UPDATE' and old.business_id = new.business_id then
    return new;
  end if;

  if tg_op = 'INSERT' then
    select count(*)::integer into product_count
    from public.business_products p
    where p.business_id = new.business_id;
  else
    select count(*)::integer into product_count
    from public.business_products p
    where p.business_id = new.business_id
      and p.id <> old.id;
  end if;

  if product_count >= 2 then
    raise exception 'Each business can have a maximum of 2 products'
      using errcode = '23514';
  end if;

  return new;
end
$function$;

drop trigger if exists enforce_business_product_limit on public.business_products;
create trigger enforce_business_product_limit
before insert or update of business_id
on public.business_products
for each row execute function public.enforce_business_product_limit();

create or replace function public.enforce_business_service_limit()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if auth.uid() is null
     or new.owner_id is distinct from (select auth.uid()) then
    return new;
  end if;

  if new.services_en is distinct from old.services_en
     and cardinality(new.services_en) > 2 then
    raise exception 'Each business can have a maximum of 2 English services'
      using errcode = '23514';
  end if;

  if new.services_ur is distinct from old.services_ur
     and cardinality(new.services_ur) > 2 then
    raise exception 'Each business can have a maximum of 2 Urdu services'
      using errcode = '23514';
  end if;

  return new;
end
$function$;

drop trigger if exists enforce_business_service_limit on public.businesses;
create trigger enforce_business_service_limit
before update of services_en, services_ur
on public.businesses
for each row execute function public.enforce_business_service_limit();
