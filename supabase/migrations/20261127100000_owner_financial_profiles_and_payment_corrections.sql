-- Owner financial profiles, payment correction requests and approved profile changes.
create table if not exists private.plan_receipt_adjustments (
 id uuid primary key default gen_random_uuid(),
 receipt_id uuid not null references private.plan_receipts(id) on delete restrict,
 assignment_id uuid not null references private.plan_assignments(id) on delete restrict,
 delta_pkr numeric(12,2) not null check(delta_pkr<>0),
 adjustment_type text not null check(adjustment_type in ('correction','reversal')),
 reason text not null check(char_length(btrim(reason)) between 5 and 1000),
 correction_request_id uuid,
 created_by uuid not null references auth.users(id) on delete restrict,
 created_at timestamptz not null default now()
);
create index if not exists plan_receipt_adjustments_receipt_idx on private.plan_receipt_adjustments(receipt_id,created_at);
create index if not exists plan_receipt_adjustments_assignment_idx on private.plan_receipt_adjustments(assignment_id);

create table if not exists private.owner_payment_correction_requests (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete restrict,
 receipt_id uuid not null references private.plan_receipts(id) on delete restrict,
 requested_amount_pkr numeric(12,2) not null check(requested_amount_pkr>=0),
 reason text not null check(char_length(btrim(reason)) between 10 and 1000),
 evidence_reference text check(evidence_reference is null or char_length(evidence_reference)<=240),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 admin_response text, reviewed_by uuid references auth.users(id) on delete restrict,
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists owner_payment_correction_one_pending_idx on private.owner_payment_correction_requests(owner_id,receipt_id) where status='pending';
create index if not exists owner_payment_correction_owner_idx on private.owner_payment_correction_requests(owner_id,created_at desc);

create table if not exists private.owner_profile_change_requests (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete restrict,
 current_full_name text, current_phone text, requested_full_name text, requested_phone text,
 reason text not null check(char_length(btrim(reason)) between 5 and 1000),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 admin_response text, reviewed_by uuid references auth.users(id) on delete restrict,
 reviewed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check(requested_full_name is not null or requested_phone is not null),
 check(requested_full_name is null or char_length(btrim(requested_full_name)) between 2 and 120),
 check(requested_phone is null or char_length(btrim(requested_phone)) between 7 and 40)
);
create unique index if not exists owner_profile_change_one_pending_idx on private.owner_profile_change_requests(owner_id) where status='pending';
create index if not exists owner_profile_change_owner_idx on private.owner_profile_change_requests(owner_id,created_at desc);

alter table private.plan_receipt_adjustments enable row level security;
alter table private.owner_payment_correction_requests enable row level security;
alter table private.owner_profile_change_requests enable row level security;
revoke all on private.plan_receipt_adjustments,private.owner_payment_correction_requests,private.owner_profile_change_requests from public,anon,authenticated;
drop policy if exists plan_receipt_adjustments_deny_all on private.plan_receipt_adjustments;
create policy plan_receipt_adjustments_deny_all on private.plan_receipt_adjustments for all using(false) with check(false);
drop policy if exists owner_payment_correction_requests_deny_all on private.owner_payment_correction_requests;
create policy owner_payment_correction_requests_deny_all on private.owner_payment_correction_requests for all using(false) with check(false);
drop policy if exists owner_profile_change_requests_deny_all on private.owner_profile_change_requests;
create policy owner_profile_change_requests_deny_all on private.owner_profile_change_requests for all using(false) with check(false);

create or replace function private.prevent_plan_receipt_adjustment_mutation()
returns trigger language plpgsql set search_path=''
as $$ begin raise exception 'Receipt adjustments are append-only'; end; $$;
revoke all on function private.prevent_plan_receipt_adjustment_mutation() from public,anon,authenticated,service_role;
drop trigger if exists plan_receipt_adjustments_immutable on private.plan_receipt_adjustments;
create trigger plan_receipt_adjustments_immutable before update or delete on private.plan_receipt_adjustments
for each row execute function private.prevent_plan_receipt_adjustment_mutation();

-- SECURITY DEFINER approval functions execute as postgres; direct Owner self-edits do not.
create or replace function private.guard_owner_profile_self_edit()
returns trigger language plpgsql set search_path=''
as $$
begin
 if (new.full_name is distinct from old.full_name or new.phone is distinct from old.phone)
 and auth.uid() is not null and auth.uid()=old.id
 and current_user not in ('postgres','service_role')
 and not private.is_super_admin() then
  raise exception 'Owner profile changes require Admin approval';
 end if;
 return new;
end;
$$;
revoke all on function private.guard_owner_profile_self_edit() from public,anon,authenticated,service_role;
drop trigger if exists trg_guard_owner_profile_self_edit on public.profiles;
create trigger trg_guard_owner_profile_self_edit before update of full_name,phone on public.profiles
for each row execute function private.guard_owner_profile_self_edit();

create or replace function public.owner_my_payment_history()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_owner uuid:=auth.uid(); v_result jsonb;
begin
 if v_owner is null or not exists(select 1 from public.profiles where id=v_owner and role='owner' and is_active) then raise exception 'Active Owner account required'; end if;
 select jsonb_build_object(
 'business_count',(select count(*) from public.businesses b where b.owner_id=v_owner),
 'paid_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r left join lateral(select sum(a.delta_pkr) delta from private.plan_receipt_adjustments a where a.receipt_id=r.id)x on true where r.owner_id=v_owner),
 'outstanding_pkr',(select coalesce(sum(a.agreed_fee_pkr-z.received),0) from private.plan_assignments a cross join lateral(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) received from private.plan_receipts r left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true where r.assignment_id=a.id)z where a.owner_id=v_owner and a.plan_code in('basic','premium')),
 'active_paid_plans',(select count(*) from public.businesses b where b.owner_id=v_owner and b.plan_code in('basic','premium') and b.plan_expires_at>now()),
 'businesses',(select coalesce(jsonb_agg(jsonb_build_object('business_id',b.id,'business_name',b.name_en,'plan_code',b.plan_code,'plan_expires_at',b.plan_expires_at) order by b.name_en),'[]'::jsonb) from public.businesses b where b.owner_id=v_owner),
 'receipts',(select coalesce(jsonb_agg(to_jsonb(q) order by q.received_at desc),'[]'::jsonb) from(
   select r.id receipt_id,r.assignment_id,r.business_id,r.business_name,a.plan_code,a.period_start,a.period_end,
   r.amount_pkr original_amount_pkr,r.amount_pkr+coalesce(x.delta,0) amount_pkr,coalesce(x.delta,0) adjustment_total_pkr,
   r.payment_method,r.transaction_reference,r.received_at,r.recorded_at,r.receipt_source
   from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id
   left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
   where r.owner_id=v_owner)q),
 'payment_correction_requests',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from(
   select id,receipt_id,requested_amount_pkr,reason,evidence_reference,status,admin_response,created_at,reviewed_at
   from private.owner_payment_correction_requests where owner_id=v_owner)q),
 'profile_change_requests',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from(
   select id,current_full_name,current_phone,requested_full_name,requested_phone,reason,status,admin_response,created_at,reviewed_at
   from private.owner_profile_change_requests where owner_id=v_owner)q)
 ) into v_result;
 return v_result;
end; $$;

create or replace function public.owner_submit_payment_correction_request(p_receipt_id uuid,p_requested_amount_pkr numeric,p_reason text,p_evidence_reference text default null)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_owner uuid:=auth.uid(); v_id uuid;
begin
 if v_owner is null or not exists(select 1 from public.profiles where id=v_owner and role='owner' and is_active) then raise exception 'Active Owner account required'; end if;
 if p_receipt_id is null or p_requested_amount_pkr is null or p_requested_amount_pkr<0 then raise exception 'Enter a valid corrected amount'; end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 10 and 1000 then raise exception 'Explain the correction in 10 to 1000 characters'; end if;
 if p_evidence_reference is not null and char_length(p_evidence_reference)>240 then raise exception 'Reference is too long'; end if;
 if not exists(select 1 from private.plan_receipts where id=p_receipt_id and owner_id=v_owner) then raise exception 'Receipt not found for this Owner'; end if;
 insert into private.owner_payment_correction_requests(owner_id,receipt_id,requested_amount_pkr,reason,evidence_reference)
 values(v_owner,p_receipt_id,p_requested_amount_pkr,btrim(p_reason),nullif(btrim(p_evidence_reference),'')) returning id into v_id;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(v_owner,'owner.payment_correction_requested','plan_receipts',p_receipt_id::text,jsonb_build_object('request_id',v_id,'requested_amount_pkr',p_requested_amount_pkr));
 return v_id;
exception when unique_violation then raise exception 'A correction request for this receipt is already pending';
end; $$;

create or replace function public.owner_submit_profile_change_request(p_full_name text,p_phone text,p_reason text)
returns uuid language plpgsql security definer set search_path=''
as $$
declare v_owner uuid:=auth.uid(); v_profile public.profiles%rowtype; v_name text; v_phone text; v_id uuid;
begin
 if v_owner is null then raise exception 'Sign in required'; end if;
 select * into v_profile from public.profiles where id=v_owner and role='owner' and is_active;
 if not found then raise exception 'Active Owner account required'; end if;
 v_name:=nullif(btrim(p_full_name),''); v_phone:=nullif(btrim(p_phone),'');
 if v_name is not null and char_length(v_name) not between 2 and 120 then raise exception 'Full Name must be 2 to 120 characters'; end if;
 if v_phone is not null and char_length(v_phone) not between 7 and 40 then raise exception 'Phone must be 7 to 40 characters'; end if;
 if v_name is not distinct from v_profile.full_name then v_name:=null; end if;
 if v_phone is not distinct from v_profile.phone then v_phone:=null; end if;
 if v_name is null and v_phone is null then raise exception 'No profile changes detected'; end if;
 if p_reason is null or char_length(btrim(p_reason)) not between 5 and 1000 then raise exception 'Please explain why you need this change'; end if;
 insert into private.owner_profile_change_requests(owner_id,current_full_name,current_phone,requested_full_name,requested_phone,reason)
 values(v_owner,v_profile.full_name,v_profile.phone,v_name,v_phone,btrim(p_reason)) returning id into v_id;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(v_owner,'owner.profile_change_requested','profiles',v_owner::text,jsonb_build_object('request_id',v_id));
 return v_id;
exception when unique_violation then raise exception 'A profile change request is already pending';
end; $$;

create or replace function public.admin_owner_financial_profile(p_owner_id uuid)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view Owner financial profiles'; end if;
 if not exists(select 1 from public.profiles where id=p_owner_id and role='owner') then raise exception 'Owner not found'; end if;
 select jsonb_build_object(
 'owner',(select to_jsonb(p)||jsonb_build_object('email',u.email) from public.profiles p left join auth.users u on u.id=p.id where p.id=p_owner_id),
 'summary',jsonb_build_object(
  'business_count',(select count(*) from public.businesses where owner_id=p_owner_id),
  'paid_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r left join lateral(select sum(a.delta_pkr) delta from private.plan_receipt_adjustments a where a.receipt_id=r.id)x on true where r.owner_id=p_owner_id),
  'outstanding_pkr',(select coalesce(sum(a.agreed_fee_pkr-z.received),0) from private.plan_assignments a cross join lateral(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) received from private.plan_receipts r left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true where r.assignment_id=a.id)z where a.owner_id=p_owner_id and a.plan_code in('basic','premium')),
  'waived_pkr',(select coalesce(sum(waived_amount_pkr),0) from private.plan_assignments where owner_id=p_owner_id)),
 'businesses',(select coalesce(jsonb_agg(to_jsonb(b) order by b.name_en),'[]'::jsonb) from public.businesses b where b.owner_id=p_owner_id),
 'assignments',(select coalesce(jsonb_agg(to_jsonb(q) order by q.assigned_at desc),'[]'::jsonb) from(
  select a.*,coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) received_pkr,a.agreed_fee_pkr-coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) outstanding_pkr
  from private.plan_assignments a left join private.plan_receipts r on r.assignment_id=a.id
  left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
  where a.owner_id=p_owner_id group by a.id)q),
 'receipts',(select coalesce(jsonb_agg(to_jsonb(q) order by q.received_at desc),'[]'::jsonb) from(
  select r.*,a.plan_code,a.period_start,a.period_end,coalesce(x.delta,0) adjustment_total_pkr,r.amount_pkr+coalesce(x.delta,0) net_amount_pkr,
  coalesce((select jsonb_agg(to_jsonb(ad) order by ad.created_at) from private.plan_receipt_adjustments ad where ad.receipt_id=r.id),'[]'::jsonb) adjustments
  from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id
  left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
  where r.owner_id=p_owner_id)q),
 'payment_correction_requests',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from(
  select r.*,p.full_name reviewer_name from private.owner_payment_correction_requests r left join public.profiles p on p.id=r.reviewed_by where r.owner_id=p_owner_id)q),
 'profile_change_requests',(select coalesce(jsonb_agg(to_jsonb(q) order by q.created_at desc),'[]'::jsonb) from(
  select r.*,p.full_name reviewer_name from private.owner_profile_change_requests r left join public.profiles p on p.id=r.reviewed_by where r.owner_id=p_owner_id)q),
 'audit',(select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc),'[]'::jsonb) from(
  select l.* from public.audit_logs l where (l.entity='profiles' and l.entity_id=p_owner_id::text)
  or (l.entity='businesses' and l.entity_id in(select id::text from public.businesses where owner_id=p_owner_id))
  order by l.created_at desc limit 100)x)
 ) into v_result;
 return v_result;
end; $$;

create or replace function public.admin_review_owner_payment_correction(p_request_id uuid,p_decision text,p_admin_response text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_req private.owner_payment_correction_requests%rowtype; v_receipt private.plan_receipts%rowtype; v_assignment private.plan_assignments%rowtype;
 v_current numeric(12,2); v_other numeric(12,2); v_delta numeric(12,2); v_adjustment uuid; v_response text;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can review payment corrections'; end if;
 if p_decision not in('approve','reject') then raise exception 'Choose approve or reject'; end if;
 v_response:=nullif(btrim(p_admin_response),''); if v_response is not null and char_length(v_response)>1000 then raise exception 'Admin response is too long'; end if;
 select * into v_req from private.owner_payment_correction_requests where id=p_request_id for update;
 if not found or v_req.status<>'pending' then raise exception 'Pending correction request not found'; end if;
 if p_decision='approve' then
  select * into v_receipt from private.plan_receipts where id=v_req.receipt_id for update;
  select * into v_assignment from private.plan_assignments where id=v_receipt.assignment_id for update;
  select v_receipt.amount_pkr+coalesce(sum(delta_pkr),0) into v_current from private.plan_receipt_adjustments where receipt_id=v_receipt.id;
  v_current:=coalesce(v_current,v_receipt.amount_pkr);
  select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) into v_other from private.plan_receipts r
  left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
  where r.assignment_id=v_assignment.id and r.id<>v_receipt.id;
  if v_req.requested_amount_pkr>v_assignment.agreed_fee_pkr-v_other then raise exception 'Corrected receipt would exceed remaining agreed plan fee'; end if;
  v_delta:=v_req.requested_amount_pkr-v_current;
  if v_delta<>0 then
   insert into private.plan_receipt_adjustments(receipt_id,assignment_id,delta_pkr,adjustment_type,reason,correction_request_id,created_by)
   values(v_receipt.id,v_assignment.id,v_delta,case when v_req.requested_amount_pkr=0 then 'reversal' else 'correction' end,coalesce(v_response,v_req.reason),v_req.id,auth.uid())
   returning id into v_adjustment;
  end if;
  update private.owner_payment_correction_requests set status='approved',admin_response=v_response,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_req.id;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(auth.uid(),
   case when v_req.requested_amount_pkr=0 then 'plan_payment.receipt_reversed' else 'plan_payment.receipt_corrected' end,
   'plan_receipts',v_receipt.id::text,jsonb_build_object('request_id',v_req.id,'adjustment_id',v_adjustment,'original_amount_pkr',v_receipt.amount_pkr,'previous_net_amount_pkr',v_current,'corrected_amount_pkr',v_req.requested_amount_pkr,'delta_pkr',v_delta));
  return jsonb_build_object('request_id',v_req.id,'status','approved','adjustment_id',v_adjustment,'corrected_amount_pkr',v_req.requested_amount_pkr);
 else
  update private.owner_payment_correction_requests set status='rejected',admin_response=coalesce(v_response,'Not approved'),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_req.id;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(auth.uid(),'owner.payment_correction_rejected','plan_receipts',v_req.receipt_id::text,jsonb_build_object('request_id',v_req.id,'response',coalesce(v_response,'Not approved')));
  return jsonb_build_object('request_id',v_req.id,'status','rejected');
 end if;
end; $$;

create or replace function public.admin_review_owner_profile_change_request(p_request_id uuid,p_decision text,p_admin_response text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_req private.owner_profile_change_requests%rowtype; v_response text;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can review Owner profile changes'; end if;
 if p_decision not in('approve','reject') then raise exception 'Choose approve or reject'; end if;
 v_response:=nullif(btrim(p_admin_response),''); if v_response is not null and char_length(v_response)>1000 then raise exception 'Admin response is too long'; end if;
 select * into v_req from private.owner_profile_change_requests where id=p_request_id for update;
 if not found or v_req.status<>'pending' then raise exception 'Pending profile change request not found'; end if;
 if p_decision='approve' then
  update public.profiles set full_name=coalesce(v_req.requested_full_name,full_name),phone=coalesce(v_req.requested_phone,phone),updated_at=now() where id=v_req.owner_id and role='owner';
  update private.owner_profile_change_requests set status='approved',admin_response=v_response,reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_req.id;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(auth.uid(),'owner.profile_change_approved','profiles',v_req.owner_id::text,
   jsonb_build_object('request_id',v_req.id,'old_full_name',v_req.current_full_name,'new_full_name',v_req.requested_full_name,'old_phone',v_req.current_phone,'new_phone',v_req.requested_phone));
  return jsonb_build_object('request_id',v_req.id,'status','approved');
 else
  update private.owner_profile_change_requests set status='rejected',admin_response=coalesce(v_response,'Not approved'),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=v_req.id;
  insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(auth.uid(),'owner.profile_change_rejected','profiles',v_req.owner_id::text,jsonb_build_object('request_id',v_req.id,'response',coalesce(v_response,'Not approved')));
  return jsonb_build_object('request_id',v_req.id,'status','rejected');
 end if;
end; $$;

-- Recalculate all existing Finance RPCs using the net value of immutable receipts and adjustments.
create or replace function public.admin_finance_dashboard()
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_today timestamptz:=date_trunc('day',now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi';
 v_month timestamptz:=date_trunc('month',now() at time zone 'Asia/Karachi') at time zone 'Asia/Karachi'; v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view financial reports'; end if;
 select jsonb_build_object(
 'received_today_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r left join lateral(select sum(a.delta_pkr) delta from private.plan_receipt_adjustments a where a.receipt_id=r.id)x on true where r.received_at>=v_today),
 'received_month_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r left join lateral(select sum(a.delta_pkr) delta from private.plan_receipt_adjustments a where a.receipt_id=r.id)x on true where r.received_at>=v_month),
 'received_lifetime_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r left join lateral(select sum(a.delta_pkr) delta from private.plan_receipt_adjustments a where a.receipt_id=r.id)x on true),
 'outstanding_pkr',(select coalesce(sum(a.agreed_fee_pkr-z.received),0) from private.plan_assignments a cross join lateral(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) received from private.plan_receipts r left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true where r.assignment_id=a.id)z where a.plan_code in('basic','premium')),
 'waived_lifetime_pkr',(select coalesce(sum(waived_amount_pkr),0) from private.plan_assignments),
 'basic_collections_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true where a.plan_code='basic'),
 'premium_collections_pkr',(select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true where a.plan_code='premium'),
 'payment_methods',(select coalesce(jsonb_object_agg(m.payment_method,m.total),'{}'::jsonb) from(select r.payment_method,sum(r.amount_pkr+coalesce(x.delta,0)) total from private.plan_receipts r left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true group by r.payment_method)m),
 'assignment_kinds',(select coalesce(jsonb_object_agg(k.assignment_kind,k.total),'{}'::jsonb) from(select assignment_kind,count(*) total from private.plan_assignments group by assignment_kind)k),
 'active_paid_subscriptions',(select count(*) from public.businesses where plan_code in('basic','premium') and plan_expires_at>now()),
 'expiring_in_14_days',(select count(*) from public.businesses where plan_code in('basic','premium') and plan_expires_at>now() and plan_expires_at<=now()+interval '14 days')
 ) into v_result;
 return v_result;
end; $$;

create or replace function public.admin_finance_ledger(p_search text default null,p_plan text default null,p_method text default null,p_source text default null,p_from timestamptz default null,p_to timestamptz default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view financial ledger'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.received_at desc),'[]'::jsonb) into v_result from(
 select r.id receipt_id,r.assignment_id,r.business_id,r.business_name,r.owner_id,coalesce(p.full_name,'') owner_name,a.plan_code,a.period_start,a.period_end,
 r.amount_pkr original_amount_pkr,r.amount_pkr+coalesce(x.delta,0) amount_pkr,coalesce(x.delta,0) adjustment_total_pkr,
 r.payment_method,r.transaction_reference,r.received_at,r.recorded_at,coalesce(rec.full_name,'') recorded_by_name,r.receipt_source,a.source assignment_source,
 coalesce((select jsonb_agg(to_jsonb(ad) order by ad.created_at) from private.plan_receipt_adjustments ad where ad.receipt_id=r.id),'[]'::jsonb) adjustments
 from private.plan_receipts r join private.plan_assignments a on a.id=r.assignment_id left join public.profiles p on p.id=r.owner_id left join public.profiles rec on rec.id=r.recorded_by
 left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
 where (p_search is null or btrim(p_search)='' or r.business_name ilike '%'||btrim(p_search)||'%' or coalesce(p.full_name,'') ilike '%'||btrim(p_search)||'%' or coalesce(r.transaction_reference,'') ilike '%'||btrim(p_search)||'%')
 and (p_plan is null or p_plan='' or a.plan_code=p_plan) and (p_method is null or p_method='' or r.payment_method=p_method)
 and (p_source is null or p_source='' or r.receipt_source=p_source) and (p_from is null or r.received_at>=p_from) and (p_to is null or r.received_at<p_to)
 order by r.received_at desc limit 1000)q;
 return v_result;
end; $$;

create or replace function public.admin_finance_balances(p_search text default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view outstanding balances'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.assigned_at desc),'[]'::jsonb) into v_result from(
 select a.id assignment_id,a.business_id,a.business_name,a.owner_id,coalesce(p.full_name,'') owner_name,a.plan_code,a.standard_price_pkr,a.agreed_fee_pkr,a.waived_amount_pkr,
 coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) received_pkr,a.agreed_fee_pkr-coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) outstanding_pkr,
 a.period_start,a.period_end,a.source,a.assignment_kind,a.assigned_at,a.internal_note
 from private.plan_assignments a left join private.plan_receipts r on r.assignment_id=a.id
 left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true left join public.profiles p on p.id=a.owner_id
 where a.plan_code in('basic','premium') and (p_search is null or btrim(p_search)='' or a.business_name ilike '%'||btrim(p_search)||'%' or coalesce(p.full_name,'') ilike '%'||btrim(p_search)||'%')
 group by a.id,p.full_name having a.agreed_fee_pkr-coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0)>0 order by a.assigned_at desc limit 500)q;
 return v_result;
end; $$;

create or replace function public.admin_finance_assignments(p_search text default null,p_plan text default null,p_source text default null)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare v_result jsonb;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can view plan assignment history'; end if;
 select coalesce(jsonb_agg(to_jsonb(q) order by q.assigned_at desc),'[]'::jsonb) into v_result from(
 select a.id assignment_id,a.business_id,a.business_name,a.owner_id,coalesce(p.full_name,'') owner_name,a.plan_code,a.standard_price_pkr,a.agreed_fee_pkr,a.waived_amount_pkr,
 coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) received_pkr,a.agreed_fee_pkr-coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) outstanding_pkr,
 a.period_start,a.period_end,a.source,a.assignment_kind,a.assigned_at,coalesce(rec.full_name,'') assigned_by_name,a.internal_note
 from private.plan_assignments a left join private.plan_receipts r on r.assignment_id=a.id
 left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true
 left join public.profiles p on p.id=a.owner_id left join public.profiles rec on rec.id=a.assigned_by
 where (p_search is null or btrim(p_search)='' or a.business_name ilike '%'||btrim(p_search)||'%' or coalesce(p.full_name,'') ilike '%'||btrim(p_search)||'%')
 and (p_plan is null or p_plan='' or a.plan_code=p_plan) and (p_source is null or p_source='' or a.source=p_source)
 group by a.id,p.full_name,rec.full_name order by a.assigned_at desc limit 1000)q;
 return v_result;
end; $$;

create or replace function public.admin_record_plan_installment(p_assignment_id uuid,p_amount_pkr numeric,p_payment_method text,p_transaction_reference text default null,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v_assignment private.plan_assignments%rowtype; v_received numeric(12,2); v_amount numeric(12,2); v_reference text; v_outstanding numeric(12,2); v_receipt_id uuid;
begin
 if not private.is_super_admin() then raise exception 'Only Super Admin can record instalments'; end if;
 v_amount:=coalesce(p_amount_pkr,0); v_reference:=nullif(btrim(p_transaction_reference),'');
 if p_assignment_id is null or v_amount<=0 then raise exception 'Enter a valid instalment amount'; end if;
 if p_payment_method not in('jazzcash','easypaisa','ubl','bank_transfer','cash','other') then raise exception 'Choose a valid payment method'; end if;
 if p_admin_note is not null and char_length(p_admin_note)>1000 then raise exception 'Admin note is too long'; end if;
 if v_reference is not null and char_length(v_reference)>120 then raise exception 'Reference is too long'; end if;
 if p_payment_method in('jazzcash','easypaisa','ubl','bank_transfer') and v_reference is null then raise exception 'Enter the transaction/reference number'; end if;
 select * into v_assignment from private.plan_assignments where id=p_assignment_id for update;
 if not found or v_assignment.plan_code='free' then raise exception 'Paid plan assignment not found'; end if;
 select coalesce(sum(r.amount_pkr+coalesce(x.delta,0)),0) into v_received from private.plan_receipts r
 left join lateral(select sum(ad.delta_pkr) delta from private.plan_receipt_adjustments ad where ad.receipt_id=r.id)x on true where r.assignment_id=v_assignment.id;
 v_outstanding:=v_assignment.agreed_fee_pkr-v_received;
 if v_amount>v_outstanding then raise exception 'Instalment exceeds outstanding balance: Rs. %',v_outstanding; end if;
 insert into private.plan_receipts(assignment_id,business_id,business_name,owner_id,amount_pkr,payment_method,transaction_reference,received_at,recorded_by,receipt_source,internal_note)
 values(v_assignment.id,v_assignment.business_id,v_assignment.business_name,v_assignment.owner_id,v_amount,p_payment_method,v_reference,now(),auth.uid(),'installment',nullif(btrim(p_admin_note),'')) returning id into v_receipt_id;
 insert into public.audit_logs(actor_id,action,entity,entity_id,details) values(auth.uid(),'plan_payment.installment_recorded','plan_assignments',v_assignment.id::text,
 jsonb_build_object('receipt_id',v_receipt_id,'business_id',v_assignment.business_id,'amount_pkr',v_amount,'payment_method',p_payment_method,'transaction_reference',v_reference,'outstanding_before_pkr',v_outstanding,'outstanding_after_pkr',v_outstanding-v_amount));
 return jsonb_build_object('receipt_id',v_receipt_id,'assignment_id',v_assignment.id,'received_pkr',v_received+v_amount,'outstanding_pkr',v_outstanding-v_amount);
end; $$;

revoke all on function public.owner_my_payment_history() from public,anon;
revoke all on function public.owner_submit_payment_correction_request(uuid,numeric,text,text) from public,anon;
revoke all on function public.owner_submit_profile_change_request(text,text,text) from public,anon;
revoke all on function public.admin_owner_financial_profile(uuid) from public,anon;
revoke all on function public.admin_review_owner_payment_correction(uuid,text,text) from public,anon;
revoke all on function public.admin_review_owner_profile_change_request(uuid,text,text) from public,anon;
revoke all on function public.admin_finance_dashboard() from public,anon;
revoke all on function public.admin_finance_ledger(text,text,text,text,timestamptz,timestamptz) from public,anon;
revoke all on function public.admin_finance_balances(text) from public,anon;
revoke all on function public.admin_finance_assignments(text,text,text) from public,anon;
revoke all on function public.admin_record_plan_installment(uuid,numeric,text,text,text) from public,anon;
grant execute on function public.owner_my_payment_history() to authenticated;
grant execute on function public.owner_submit_payment_correction_request(uuid,numeric,text,text) to authenticated;
grant execute on function public.owner_submit_profile_change_request(text,text,text) to authenticated;
grant execute on function public.admin_owner_financial_profile(uuid) to authenticated;
grant execute on function public.admin_review_owner_payment_correction(uuid,text,text) to authenticated;
grant execute on function public.admin_review_owner_profile_change_request(uuid,text,text) to authenticated;
grant execute on function public.admin_finance_dashboard() to authenticated;
grant execute on function public.admin_finance_ledger(text,text,text,text,timestamptz,timestamptz) to authenticated;
grant execute on function public.admin_finance_balances(text) to authenticated;
grant execute on function public.admin_finance_assignments(text,text,text) to authenticated;
grant execute on function public.admin_record_plan_installment(uuid,numeric,text,text,text) to authenticated;
