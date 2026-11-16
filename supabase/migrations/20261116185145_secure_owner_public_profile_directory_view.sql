-- Keep the public owner-profile directory view in the caller's security context.
-- The view must respect the caller's RLS policies instead of inheriting owner privileges.
alter view public.owner_public_profile_directory
  set (security_barrier = true, security_invoker = true);

revoke all on public.owner_public_profile_directory from anon, authenticated;
grant select on public.owner_public_profile_directory to anon, authenticated;
