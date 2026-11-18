-- The plan-limit trigger is invoked as the PostgREST caller. Its invoker
-- context cannot access the private schema, even when the caller is an
-- authenticated super-admin. Run this narrowly scoped trigger function as its
-- postgres owner so its existing super-admin/staff permission checks can call
-- the SECURITY DEFINER helpers in private. Keep an empty search_path and all
-- object references schema-qualified; do not grant clients access to private.
alter function public.enforce_business_plan_limits() security definer;
alter function public.enforce_business_plan_limits() set search_path = '';
