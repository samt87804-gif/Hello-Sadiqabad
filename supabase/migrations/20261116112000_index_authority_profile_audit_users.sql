create index if not exists idx_authority_profiles_created_by on public.authority_profiles(created_by);
create index if not exists idx_authority_profiles_updated_by on public.authority_profiles(updated_by);
drop index if exists public.idx_authority_profiles_business_ids;
