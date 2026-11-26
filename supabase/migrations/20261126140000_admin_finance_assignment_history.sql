
create or replace function public.admin_finance_assignments(
  p_search text default null,
  p_plan text default null,
  p_source text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  v_result jsonb;
begin
  if not private.is_super_admin() then
    raise exception 'Only Super Admin can view plan assignment history';
  end if;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.assigned_at desc),'[]'::jsonb)
  into v_result
  from (
    select
      a.id as assignment_id,
      a.business_id,
      a.business_name,
      a.owner_id,
      coalesce(p.full_name,'') as owner_name,
      a.plan_code,
      a.standard_price_pkr,
      a.agreed_fee_pkr,
      a.waived_amount_pkr,
      coalesce(sum(r.amount_pkr),0) as received_pkr,
      a.agreed_fee_pkr-coalesce(sum(r.amount_pkr),0) as outstanding_pkr,
      a.period_start,
      a.period_end,
      a.source,
      a.assignment_kind,
      a.assigned_at,
      coalesce(rec.full_name,'') as assigned_by_name,
      a.internal_note
    from private.plan_assignments a
    left join private.plan_receipts r on r.assignment_id=a.id
    left join public.profiles p on p.id=a.owner_id
    left join public.profiles rec on rec.id=a.assigned_by
    where
      (p_search is null or btrim(p_search)='' or
       a.business_name ilike '%'||btrim(p_search)||'%' or
       coalesce(p.full_name,'') ilike '%'||btrim(p_search)||'%')
      and (p_plan is null or p_plan='' or a.plan_code=p_plan)
      and (p_source is null or p_source='' or a.source=p_source)
    group by a.id,p.full_name,rec.full_name
    order by a.assigned_at desc
    limit 1000
  ) q;

  return v_result;
end;
$$;

revoke all on function public.admin_finance_assignments(text,text,text) from public,anon;
grant execute on function public.admin_finance_assignments(text,text,text) to authenticated;
