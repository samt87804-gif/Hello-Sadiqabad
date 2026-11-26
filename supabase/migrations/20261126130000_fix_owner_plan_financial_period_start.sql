
create or replace function private.record_verified_plan_upgrade_finance()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_plan text;
  v_amount numeric(12,2);
  v_expiry timestamptz;
  v_start timestamptz;
  v_assignment_id uuid;
  v_method text;
  v_reference text;
  v_business_name text;
begin
  if new.type<>'plan_upgrade' or new.status<>'done' or old.status='done'
     or coalesce((new.payload->>'payment_verified')::boolean,false) is not true then
    return new;
  end if;

  v_plan:=new.payload->>'requested_plan';
  v_amount:=(new.payload->>'monthly_amount_pkr')::numeric;
  v_expiry:=(new.payload->>'plan_expires_at')::timestamptz;
  v_method:=new.payload->>'payment_method';
  v_reference:=nullif(btrim(new.payload->>'transaction_reference'),'');
  if v_plan not in ('basic','premium')
     or v_amount<>(case v_plan when 'basic' then 700 else 1500 end)
     or v_expiry is null
     or v_method not in ('jazzcash','easypaisa','ubl')
     or v_reference is null then
    raise exception 'Verified Owner plan payment is missing valid financial details';
  end if;

  -- The Owner approval RPC extends from max(now(), previous expiry).
  -- Derive the actual purchased period start from its resulting expiry.
  v_start:=v_expiry-interval '1 month';

  select b.name_en into v_business_name
  from public.businesses b where b.id=new.business_id;
  if v_business_name is null then
    raise exception 'Business not found while recording verified plan payment';
  end if;

  insert into private.plan_assignments(
    business_id,business_name,owner_id,plan_code,standard_price_pkr,agreed_fee_pkr,
    waived_amount_pkr,period_start,period_end,source,assignment_kind,
    source_submission_id,assigned_by,assigned_at,internal_note
  ) values (
    new.business_id,v_business_name,new.submitted_by,v_plan,v_amount,v_amount,0,
    v_start,v_expiry,'owner_request',
    case when v_start>now() then 'renewal' else 'new' end,
    new.id,(new.payload->>'payment_verified_by')::uuid,
    coalesce((new.payload->>'payment_verified_at')::timestamptz,now()),
    nullif(new.admin_note,'')
  )
  on conflict(source_submission_id) do nothing
  returning id into v_assignment_id;

  if v_assignment_id is null then
    select a.id into v_assignment_id
    from private.plan_assignments a where a.source_submission_id=new.id;
  end if;

  insert into private.plan_receipts(
    assignment_id,business_id,business_name,owner_id,amount_pkr,payment_method,
    transaction_reference,received_at,recorded_by,receipt_source,source_submission_id,internal_note
  ) values (
    v_assignment_id,new.business_id,v_business_name,new.submitted_by,v_amount,v_method,v_reference,
    coalesce((new.payload->>'payment_verified_at')::timestamptz,now()),
    (new.payload->>'payment_verified_by')::uuid,'owner_request',new.id,
    'Owner-submitted payment verified by Admin'
  )
  on conflict(source_submission_id) do nothing;

  return new;
end;
$$;

update private.plan_assignments
set period_start=period_end-interval '1 month'
where source='owner_request'
  and period_end is not null
  and period_start is distinct from period_end-interval '1 month';
