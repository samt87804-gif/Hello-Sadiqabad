create or replace function public.clear_legacy_business_owner_profile_fields()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  -- Owner identity is now stored in owner_public_profiles and exposed only
  -- through the field-redacting public directory view.
  new.owner_name := null;
  new.owner_photo_url := null;
  return new;
end;
$$;

drop trigger if exists trg_clear_legacy_business_owner_profile_fields on public.businesses;
create trigger trg_clear_legacy_business_owner_profile_fields
before insert or update of owner_name, owner_photo_url on public.businesses
for each row execute function public.clear_legacy_business_owner_profile_fields();

comment on function public.clear_legacy_business_owner_profile_fields() is
'Prevents legacy owner identity fields on public business rows from bypassing owner profile privacy controls.';
