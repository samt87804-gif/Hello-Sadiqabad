create or replace function private.snapshot_plan_payment_account()
returns trigger language plpgsql security definer set search_path=''
as $$
declare v_method text; v_details jsonb;
begin
  if new.type<>'plan_upgrade' then return new; end if;
  v_method:=new.payload->>'payment_method';
  if v_method not in ('jazzcash','easypaisa','ubl') then return new; end if;
  select s.value->'methods'->v_method into v_details from public.site_settings s where s.key='plan_payment_methods' and s.is_public=true;
  if v_details is not null then
    new.payload:=new.payload||jsonb_build_object(
      'payment_method_label',v_details->>'label',
      'payment_account_title',v_details->>'account_title',
      'payment_account_number',v_details->>'account_number',
      'payment_account_iban',v_details->>'iban',
      'payment_icon_url',v_details->>'icon_url'
    );
  end if;
  return new;
end; $$;
drop trigger if exists submissions_snapshot_plan_payment_account on public.submissions;
create trigger submissions_snapshot_plan_payment_account before insert on public.submissions for each row execute function private.snapshot_plan_payment_account();
revoke all on function private.snapshot_plan_payment_account() from public,anon,authenticated;
