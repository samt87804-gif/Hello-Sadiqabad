
create or replace function private.guard_business_plan_fields()
returns trigger
language plpgsql
set search_path=''
as $$
begin
  if new.plan_code is distinct from old.plan_code
     or new.plan_expires_at is distinct from old.plan_expires_at then
    if current_user not in ('postgres','service_role') then
      raise exception 'Business plan changes must use the audited plan assignment or verified Owner payment workflow';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.guard_business_plan_fields() from public,anon,authenticated,service_role;
drop trigger if exists businesses_guard_plan_financial_assignment on public.businesses;
create trigger businesses_guard_plan_financial_assignment
before update of plan_code,plan_expires_at on public.businesses
for each row execute function private.guard_business_plan_fields();

drop policy if exists plan_assignments_deny_direct_access on private.plan_assignments;
create policy plan_assignments_deny_direct_access on private.plan_assignments
for all to public using (false) with check (false);
drop policy if exists plan_receipts_deny_direct_access on private.plan_receipts;
create policy plan_receipts_deny_direct_access on private.plan_receipts
for all to public using (false) with check (false);
