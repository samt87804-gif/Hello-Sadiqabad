
create schema if not exists private;
create table if not exists private.plan_assignments (
 id uuid primary key default gen_random_uuid(),
 business_id uuid references public.businesses(id) on delete set null,
 business_name text not null, owner_id uuid references auth.users(id) on delete set null,
 plan_code text not null check(plan_code in ('free','basic','premium')),
 standard_price_pkr numeric(12,2) not null check(standard_price_pkr>=0),
 agreed_fee_pkr numeric(12,2) not null check(agreed_fee_pkr>=0 and agreed_fee_pkr<=standard_price_pkr),
 waived_amount_pkr numeric(12,2) not null check(waived_amount_pkr>=0),
 period_start timestamptz, period_end timestamptz,
 source text not null check(source in ('admin','owner_request')),
 assignment_kind text not null check(assignment_kind in ('new','renewal','change','free','unknown')),
 source_submission_id uuid unique references public.submissions(id) on delete restrict,
 assigned_by uuid references auth.users(id) on delete set null,
 assigned_at timestamptz not null default now(), internal_note text,
 constraint plan_assignment_waiver_math check(waived_amount_pkr=standard_price_pkr-agreed_fee_pkr),
 constraint plan_assignment_period_check check(
  (plan_code='free' and period_start is null and period_end is null and standard_price_pkr=0 and agreed_fee_pkr=0)
  or (plan_code in ('basic','premium') and period_start is not null and period_end is not null and period_end>period_start))
);
create table if not exists private.plan_receipts (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references private.plan_assignments(id) on delete restrict,
 business_id uuid references public.businesses(id) on delete set null,
 business_name text not null, owner_id uuid references auth.users(id) on delete set null,
 amount_pkr numeric(12,2) not null check(amount_pkr>0),
 payment_method text not null check(payment_method in ('jazzcash','easypaisa','ubl','bank_transfer','cash','other')),
 transaction_reference text, received_at timestamptz not null default now(),
 recorded_at timestamptz not null default now(),
 recorded_by uuid references auth.users(id) on delete set null,
 receipt_source text not null check(receipt_source in ('owner_request','direct_assignment','installment')),
 source_submission_id uuid unique references public.submissions(id) on delete restrict,
 internal_note text
);
create index if not exists plan_assignments_business_period_idx on private.plan_assignments(business_id,assigned_at desc);
create index if not exists plan_receipts_assignment_received_idx on private.plan_receipts(assignment_id,received_at desc);
create index if not exists plan_receipts_received_at_idx on private.plan_receipts(received_at desc);
alter table private.plan_assignments enable row level security;
alter table private.plan_receipts enable row level security;
revoke all on private.plan_assignments,private.plan_receipts from public,anon,authenticated,service_role;

create or replace function private.reject_plan_receipt_mutation()
returns trigger language plpgsql security definer set search_path=''
as $$ begin raise exception 'Financial receipt records are append-only'; end; $$;
revoke all on function private.reject_plan_receipt_mutation() from public,anon,authenticated,service_role;
drop trigger if exists plan_receipts_immutable on private.plan_receipts;
create trigger plan_receipts_immutable before update or delete on private.plan_receipts
for each row execute function private.reject_plan_receipt_mutation();

create or replace function private.record_verified_plan_upgrade_finance()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_plan text; v_amount numeric(12,2); v_expiry timestamptz; v_start timestamptz;
v_assignment_id uuid; v_method text; v_reference text; v_business_name text;
begin
 if new.type<>'plan_upgrade' or new.status<>'done' or old.status='done'
 or coalesce((new.payload->>'payment_verified')::boolean,false) is not true then return new; end if;
 v_plan:=new.payload->>'requested_plan'; v_amount:=(new.payload->>'monthly_amount_pkr')::numeric;
 v_expiry:=(new.payload->>'plan_expires_at')::timestamptz;
 v_start:=coalesce((new.payload->>'activated_at')::timestamptz,now());
 v_method:=new.payload->>'payment_method'; v_reference:=nullif(btrim(new.payload->>'transaction_reference'),'');
 if v_plan not in ('basic','premium') or v_amount<>(case v_plan when 'basic' then 700 else 1500 end)
 or v_expiry is null or v_method not in ('jazzcash','easypaisa','ubl') or v_reference is null
 then raise exception 'Verified Owner plan payment is missing valid financial details'; end if;
 select b.name_en into v_business_name from public.businesses b where b.id=new.business_id;
 if v_business_name is null then raise exception 'Business not found while recording verified plan payment'; end if;
 insert into private.plan_assignments(business_id,business_name,owner_id,plan_code,standard_price_pkr,agreed_fee_pkr,
 waived_amount_pkr,period_start,period_end,source,assignment_kind,source_submission_id,assigned_by,assigned_at,internal_note)
 values(new.business_id,v_business_name,new.submitted_by,v_plan,v_amount,v_amount,0,v_start,v_expiry,'owner_request',
 case when v_start>now() then 'renewal' else 'new' end,new.id,
 (new.payload->>'payment_verified_by')::uuid,coalesce((new.payload->>'payment_verified_at')::timestamptz,now()),
 nullif(new.admin_note,''))
 on conflict(source_submission_id) do nothing returning id into v_assignment_id;
 if v_assignment_id is null then select a.id into v_assignment_id from private.plan_assignments a where a.source_submission_id=new.id; end if;
 insert into private.plan_receipts(assignment_id,business_id,business_name,owner_id,amount_pkr,payment_method,
 transaction_reference,received_at,recorded_by,receipt_source,source_submission_id,internal_note)
 values(v_assignment_id,new.business_id,v_business_name,new.submitted_by,v_amount,v_method,v_reference,
 coalesce((new.payload->>'payment_verified_at')::timestamptz,now()),
 (new.payload->>'payment_verified_by')::uuid,'owner_request',new.id,'Owner-submitted payment verified by Admin')
 on conflict(source_submission_id) do nothing;
 return new;
end; $$;
revoke all on function private.record_verified_plan_upgrade_finance() from public,anon,authenticated,service_role;
drop trigger if exists submissions_record_verified_plan_upgrade_finance on public.submissions;
create trigger submissions_record_verified_plan_upgrade_finance after update of status on public.submissions
for each row execute function private.record_verified_plan_upgrade_finance();

create or replace function public.admin_assign_business_plan(
 p_business_id uuid,p_plan_code text,p_agreed_fee_pkr numeric,p_received_now_pkr numeric,
 p_payment_method text default null,p_transaction_reference text default null,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_business public.businesses%rowtype; v_standard numeric(12,2); v_fee numeric(12,2);
v_received numeric(12,2); v_waived numeric(12,2); v_start timestamptz; v_end timestamptz;
v_assignment_id uuid; v_kind text; v_reference text;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can assign business plans'; end if;
 if p_business_id is null or p_plan_code is null or p_plan_code not in ('free','basic','premium') then raise exception 'Choose a business and a valid plan'; end if;
 v_standard:=case p_plan_code when 'basic' then 700 when 'premium' then 1500 else 0 end;
 v_fee:=coalesce(p_agreed_fee_pkr,-1); v_received:=coalesce(p_received_now_pkr,-1); v_reference:=nullif(btrim(p_transaction_reference),'');
 if v_fee<0 or v_fee>v_standard then raise exception 'Agreed fee must be between Rs. 0 and the standard plan price'; end if;
 if v_received<0 or v_received>v_fee then raise exception 'Received amount cannot exceed the agreed fee'; end if;
 if p_plan_code='free' and (v_fee<>0 or v_received<>0) then raise exception 'Free plan must have zero fee and zero payment'; end if;
 if v_received>0 and (p_payment_method is null or p_payment_method not in ('jazzcash','easypaisa','ubl','bank_transfer','cash','other'))
 then raise exception 'Choose a valid payment method for the amount received'; end if;
 if v_fee<v_standard and nullif(btrim(p_admin_note),'') is null then raise exception 'A reason is required when the plan fee is discounted or waived'; end if;
 if p_admin_note is not null and char_length(p_admin_note)>1000 then raise exception 'Admin note is too long'; end if;
 if v_reference is not null and char_length(v_reference)>120 then raise exception 'Transaction reference is too long'; end if;
 if v_received>0 and p_payment_method in ('jazzcash','easypaisa','ubl','bank_transfer') and v_reference is null then raise exception 'Enter the transaction/reference number for this payment'; end if;
 select * into v_business from public.businesses b where b.id=p_business_id for update;
 if not found then raise exception 'Business not found'; end if;
 if p_plan_code='free' then v_start:=null; v_end:=null; v_kind:='free';
 else
  v_start:=greatest(now(),coalesce(v_business.plan_expires_at,now())); v_end:=v_start+interval '1 month';
  v_kind:=case when private.effective_plan(v_business.id)=p_plan_code and v_business.plan_expires_at>now() then 'renewal'
   when private.effective_plan(v_business.id)='free' then 'new' else 'change' end;
 end if;
 v_waived:=v_standard-v_fee;
 insert into private.plan_assignments(business_id,business_name,owner_id,plan_code,standard_price_pkr,agreed_fee_pkr,
 waived_amount_pkr,period_start,period_end,source,assignment_kind,assigned_by,internal_note)
 values(v_business.id,v_business.name_en,v_business.owner_id,p_plan_code,v_standard,v_fee,v_waived,
 v_start,v_end,'admin',v_kind,auth.uid(),nullif(btrim(p_admin_note),'')) returning id into v_assignment_id;
 update public.businesses set plan_code=p_plan_code,plan_expires_at=v_end,updated_at=now() where id=v_business.id;
 if v_received>0 then
  insert into private.plan_receipts(assignment_id,business_id,business_name,owner_id,amount_pkr,payment_method,
  transaction_reference,received_at,recorded_by,receipt_source,internal_note)
  values(v_assignment_id,v_business.id,v_business.name_en,v_business.owner_id,v_received,p_payment_method,
  v_reference,now(),auth.uid(),'direct_assignment',nullif(btrim(p_admin_note),''));
 end if;
 if v_business.owner_id is not null then
  insert into public.notifications(user_id,type,title_en,title_ur,body_en,body_ur,link_path,is_read,created_at)
  values(v_business.owner_id,'general','Your '||upper(p_plan_code)||' plan has been assigned',
  'آپ کا '||case p_plan_code when 'free' then 'فری' when 'basic' then 'بیسک' else 'پریمیم' end||' پلان تبدیل کر دیا گیا ہے',
  case when p_plan_code='free' then 'Your business is now on the Free plan.'
   else 'Your plan is active until '||to_char(v_end at time zone 'Asia/Karachi','DD Mon YYYY')||'.' end,
  'آپ کے کاروبار کا پلان اپ ڈیٹ کر دیا گیا ہے۔','/owner/plan',false,now());
 end if;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details)
 values(auth.uid(),'business.plan_assigned','businesses',v_business.id::text,
 jsonb_build_object('assignment_id',v_assignment_id,'previous_plan',v_business.plan_code,'plan_code',p_plan_code,
 'standard_price_pkr',v_standard,'agreed_fee_pkr',v_fee,'waived_amount_pkr',v_waived,
 'received_now_pkr',v_received,'outstanding_pkr',v_fee-v_received,'payment_method',p_payment_method,
 'transaction_reference',v_reference,'period_start',v_start,'period_end',v_end));
 return jsonb_build_object('assignment_id',v_assignment_id,'business_id',v_business.id,'plan_code',p_plan_code,
 'period_start',v_start,'period_end',v_end,'standard_price_pkr',v_standard,'agreed_fee_pkr',v_fee,
 'waived_amount_pkr',v_waived,'received_pkr',v_received,'outstanding_pkr',v_fee-v_received);
end; $$;

create or replace function public.admin_record_plan_installment(
 p_assignment_id uuid,p_amount_pkr numeric,p_payment_method text,
 p_transaction_reference text default null,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_assignment private.plan_assignments%rowtype; v_received numeric(12,2);
v_amount numeric(12,2); v_reference text; v_outstanding numeric(12,2); v_receipt_id uuid;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can record instalments'; end if;
 v_amount:=coalesce(p_amount_pkr,0); v_reference:=nullif(btrim(p_transaction_reference),'');
 if p_assignment_id is null or v_amount<=0 then raise exception 'Enter a valid instalment amount'; end if;
 if p_payment_method is null or p_payment_method not in ('jazzcash','easypaisa','ubl','bank_transfer','cash','other') then raise exception 'Choose a valid payment method'; end if;
 if p_admin_note is not null and char_length(p_admin_note)>1000 then raise exception 'Admin note is too long'; end if;
 if v_reference is not null and char_length(v_reference)>120 then raise exception 'Transaction reference is too long'; end if;
 if p_payment_method in ('jazzcash','easypaisa','ubl','bank_transfer') and v_reference is null then raise exception 'Enter the transaction/reference number for this payment'; end if;
 select * into v_assignment from private.plan_assignments a where a.id=p_assignment_id for update;
 if not found or v_assignment.plan_code='free' then raise exception 'Paid plan assignment not found'; end if;
 select coalesce(sum(r.amount_pkr),0) into v_received from private.plan_receipts r where r.assignment_id=v_assignment.id;
 v_outstanding:=v_assignment.agreed_fee_pkr-v_received;
 if v_amount>v_outstanding then raise exception 'Instalment exceeds outstanding balance: Rs. %',v_outstanding; end if;
 insert into private.plan_receipts(assignment_id,business_id,business_name,owner_id,amount_pkr,payment_method,
 transaction_reference,received_at,recorded_by,receipt_source,internal_note)
 values(v_assignment.id,v_assignment.business_id,v_assignment.business_name,v_assignment.owner_id,
 v_amount,p_payment_method,v_reference,now(),auth.uid(),'installment',nullif(btrim(p_admin_note),'')) returning id into v_receipt_id;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details)
 values(auth.uid(),'plan_payment.installment_recorded','plan_assignments',v_assignment.id::text,
 jsonb_build_object('receipt_id',v_receipt_id,'business_id',v_assignment.business_id,'amount_pkr',v_amount,
 'payment_method',p_payment_method,'transaction_reference',v_reference,'outstanding_before_pkr',v_outstanding,
 'outstanding_after_pkr',v_outstanding-v_amount));
 return jsonb_build_object('receipt_id',v_receipt_id,'assignment_id',v_assignment.id,
 'received_pkr',v_received+v_amount,'outstanding_pkr',v_outstanding-v_amount);
end; $$;


create or replace function public.admin_finance_dashboard()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_today timestamptz:=date_trunc('day',now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
v_month timestamptz:=date_trunc('month',now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view financial reports'; end if;
 select jsonb_build_object(
 'received_today_pkr',(select coalesce(sum(r.amount_pkr),0) from private.plan_receipts r where r.received_at>=v_today),
 'received_month_pkr',(select coalesce(sum(r.amount_pkr),0) from private.plan_receipts r where r.received_at>=v_month),
 'received_lifetime_pkr',(select coalesce(sum(r.amount_pkr),0) from private.plan_receipts r),
 'outstanding_pkr',(select coalesce(sum(a.agreed_fee_pkr-x.received),0) from private.plan_assignments a
 cross join lateral(select coalesce(sum(r.amount_pkr),0) received from private.plan_receipts r where r.assignment_id=a.id)x),
 'waived_lifetime_pkr',(select coalesce(sum(a.waived_amount_pkr),0) from private.plan_assignments a),
 'basic_collections_pkr',(select coalesce(sum(r.amount_pkr),0) from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id where a.plan_code='basic'),
 'premium_collections_pkr',(select coalesce(sum(r.amount_pkr),0) from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id where a.plan_code='premium'),
 'payment_methods',(select coalesce(jsonb_object_agg(m.payment_method,m.total),'{}'::jsonb) from
 (select r.payment_method,sum(r.amount_pkr) total from private.plan_receipts r group by r.payment_method)m),
 'assignment_kinds',(select coalesce(jsonb_object_agg(k.assignment_kind,k.total),'{}'::jsonb) from
 (select a.assignment_kind,count(*) total from private.plan_assignments a group by a.assignment_kind)k),
 'active_paid_subscriptions',(select count(*) from public.businesses b where b.plan_code in ('basic','premium') and b.plan_expires_at>now()),
 'expiring_in_14_days',(select count(*) from public.businesses b where b.plan_code in ('basic','premium') and b.plan_expires_at>now() and b.plan_expires_at<=now()+interval '14 days')
 ) into v_result;
 return v_result;
end; $$;

create or replace function public.admin_finance_ledger(
 p_search text default null,p_plan text default null,p_method text default null,p_source text default null,
 p_from timestamptz default null,p_to timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view financial ledger'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.received_at desc),'[]'::jsonb) into v_result
 from (select r.id receipt_id,r.assignment_id,r.business_id,r.business_name,r.owner_id,
 coalesce(p.full_name,'') owner_name,a.plan_code,a.period_start,a.period_end,r.amount_pkr,r.payment_method,
 r.transaction_reference,r.received_at,r.recorded_at,coalesce(rec.full_name,'') recorded_by_name,
 r.receipt_source,a.source assignment_source
 from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id
 left join public.profiles p on p.id=r.owner_id left join public.profiles rec on rec.id=r.recorded_by
 where (p_search is null or btrim(p_search)='' or r.business_name ilike '%'||btrim(p_search)||'%'
 or coalesce(p.full_name,'') ilike '%'||btrim(p_search)||'%' or coalesce(r.transaction_reference,'') ilike '%'||btrim(p_search)||'%')
 and (p_plan is null or p_plan='' or a.plan_code=p_plan)
 and (p_method is null or p_method='' or r.payment_method=p_method)
 and (p_source is null or p_source='' or r.receipt_source=p_source)
 and (p_from is null or r.received_at>=p_from) and (p_to is null or r.received_at<p_to)
 order by r.received_at desc limit 1000) q;
 return v_result;
end; $$;

create or replace function public.admin_finance_balances(p_search text default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view outstanding balances'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.assigned_at desc),'[]'::jsonb) into v_result
 from (select a.id assignment_id,a.business_id,a.business_name,a.owner_id,coalesce(p.full_name,'') owner_name,
 a.plan_code,a.standard_price_pkr,a.agreed_fee_pkr,a.waived_amount_pkr,coalesce(sum(r.amount_pkr),0) received_pkr,
 a.agreed_fee_pkr-coalesce(sum(r.amount_pkr),0) outstanding_pkr,a.period_start,a.period_end,a.source,a.assignment_kind,
 a.assigned_at,a.internal_note
 from private.plan_assignments a left join private.plan_receipts r on r.assignment_id=a.id
 left join public.profiles p on p.id=a.owner_id
 where a.plan_code in ('basic','premium') and (p_search is null or btrim(p_search)='' or
 a.business_name ilike '%'||btrim(p_search)||'%' or coalesce(p.full_name,'') ilike '%'||btrim(p_search)||'%')
 group by a.id,p.full_name having a.agreed_fee_pkr-coalesce(sum(r.amount_pkr),0)>0
 order by a.assigned_at desc limit 500) q;
 return v_result;
end; $$;

revoke all on function public.admin_assign_business_plan(uuid,text,numeric,numeric,text,text,text) from public,anon;
revoke all on function public.admin_record_plan_installment(uuid,numeric,text,text,text) from public,anon;
revoke all on function public.admin_finance_dashboard() from public,anon;
revoke all on function public.admin_finance_ledger(text,text,text,text,timestamptz,timestamptz) from public,anon;
revoke all on function public.admin_finance_balances(text) from public,anon;
grant execute on function public.admin_assign_business_plan(uuid,text,numeric,numeric,text,text,text) to authenticated;
grant execute on function public.admin_record_plan_installment(uuid,numeric,text,text,text) to authenticated;
grant execute on function public.admin_finance_dashboard() to authenticated;
grant execute on function public.admin_finance_ledger(text,text,text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.admin_finance_balances(text) to authenticated;

insert into private.plan_assignments(business_id,business_name,owner_id,plan_code,standard_price_pkr,agreed_fee_pkr,
 waived_amount_pkr,period_start,period_end,source,assignment_kind,source_submission_id,assigned_by,assigned_at,internal_note)
select s.business_id,b.name_en,s.submitted_by,s.payload->>'requested_plan',
 case s.payload->>'requested_plan' when 'basic' then 700 else 1500 end,
 case s.payload->>'requested_plan' when 'basic' then 700 else 1500 end,0,
 coalesce((s.payload->>'activated_at')::timestamptz,s.created_at),(s.payload->>'plan_expires_at')::timestamptz,
 'owner_request','unknown',s.id,(s.payload->>'payment_verified_by')::uuid,
 coalesce((s.payload->>'payment_verified_at')::timestamptz,s.updated_at),'Historical verified Owner plan payment'
from public.submissions s join public.businesses b on b.id=s.business_id
where s.type='plan_upgrade' and s.status='done' and coalesce((s.payload->>'payment_verified')::boolean,false)=true
and s.payload->>'requested_plan' in ('basic','premium')
and (s.payload->>'monthly_amount_pkr')::numeric=case s.payload->>'requested_plan' when 'basic' then 700 else 1500 end
and nullif(btrim(s.payload->>'transaction_reference'),'') is not null
and s.payload->>'payment_method' in ('jazzcash','easypaisa','ubl') and s.payload->>'plan_expires_at' is not null
on conflict(source_submission_id) do nothing;

insert into private.plan_receipts(assignment_id,business_id,business_name,owner_id,amount_pkr,payment_method,
 transaction_reference,received_at,recorded_by,receipt_source,source_submission_id,internal_note)
select a.id,s.business_id,b.name_en,s.submitted_by,(s.payload->>'monthly_amount_pkr')::numeric,
 s.payload->>'payment_method',nullif(btrim(s.payload->>'transaction_reference'),''),
 coalesce((s.payload->>'payment_verified_at')::timestamptz,s.updated_at),
 (s.payload->>'payment_verified_by')::uuid,'owner_request',s.id,'Historical Owner payment verified by Admin'
from public.submissions s join public.businesses b on b.id=s.business_id
join private.plan_assignments a on a.source_submission_id=s.id
where s.type='plan_upgrade' and s.status='done' and coalesce((s.payload->>'payment_verified')::boolean,false)=true
and s.payload->>'requested_plan' in ('basic','premium')
and (s.payload->>'monthly_amount_pkr')::numeric=case s.payload->>'requested_plan' when 'basic' then 700 else 1500 end
and nullif(btrim(s.payload->>'transaction_reference'),'') is not null
and s.payload->>'payment_method' in ('jazzcash','easypaisa','ubl')
on conflict(source_submission_id) do nothing;
