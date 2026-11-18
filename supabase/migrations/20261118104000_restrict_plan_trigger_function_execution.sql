-- This function is only intended to run as a trigger, never as a client RPC.
revoke execute on function public.enforce_business_plan_limits()
  from public, anon, authenticated;
