create index if not exists idx_submissions_owner_created
  on public.submissions (submitted_by, created_at desc)
  where submitted_by is not null;

drop policy if exists submissions_owner_read on public.submissions;
create policy submissions_owner_read
  on public.submissions
  for select
  to authenticated
  using (
    submitted_by = (select auth.uid())
    and type in ('new_business', 'claim', 'plan_upgrade')
  );

create or replace function public.enforce_offer_plan_limit()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  max_offers integer;
  used_active integer;
begin
  if auth.uid() is not null
     and (private.is_super_admin() or private.staff_has_permission('tiers.manage')) then
    return new;
  end if;

  if not private.is_owner_of(new.business_id) then
    raise exception 'Only the business owner can manage offers'
      using errcode = '42501';
  end if;

  if new.status = 'active'
     and new.valid_from <= current_date
     and new.valid_to >= current_date then
    select coalesce((p.limits->>'offers')::integer, 0)
      into max_offers
      from public.plans p
      where p.code = private.effective_plan(new.business_id);

    select count(*)::integer
      into used_active
      from public.offers o
      where o.business_id = new.business_id
        and o.id <> coalesce(new.id, '00000000-0000-0000-0000-000000000000'::uuid)
        and o.status = 'active'
        and o.valid_from <= current_date
        and o.valid_to >= current_date;

    if used_active >= coalesce(max_offers, 0) then
      raise exception 'Your plan active offer limit has been reached'
        using errcode = '23514';
    end if;
  end if;

  return new;
end
$function$;
