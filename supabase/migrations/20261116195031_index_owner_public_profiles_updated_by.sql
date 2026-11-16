-- Add an index for the owner_public_profiles.updated_by foreign key.
-- This is additive and preserves all existing rows and RLS policies.
create index if not exists owner_public_profiles_updated_by_idx
  on public.owner_public_profiles (updated_by);
