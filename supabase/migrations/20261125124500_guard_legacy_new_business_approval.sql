-- Close the legacy all-at-once approval bypass only after the field-review UI is deployed.
begin;

create or replace function private.guard_legacy_new_business_approval()
returns trigger
language plpgsql
security definer
set search_path=''
as $function$
begin
  if old.type='new_business'
     and old.status is distinct from new.status
     and new.status='done'
     and current_setting('app.business_field_review',true) is distinct from 'true' then
    raise exception 'New business submissions must use field-level approval'
      using errcode='42501';
  end if;
  return new;
end
$function$;

revoke all on function private.guard_legacy_new_business_approval() from public, anon, authenticated;

drop trigger if exists submissions_guard_legacy_new_business_approval on public.submissions;
create trigger submissions_guard_legacy_new_business_approval
before update of status on public.submissions
for each row execute function private.guard_legacy_new_business_approval();

commit;
