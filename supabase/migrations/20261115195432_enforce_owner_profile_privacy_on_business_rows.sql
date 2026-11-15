drop trigger if exists trg_clear_legacy_business_owner_profile_fields on public.businesses;
create trigger trg_clear_legacy_business_owner_profile_fields
before insert or update on public.businesses
for each row execute function public.clear_legacy_business_owner_profile_fields();
