create or replace function public.admin_live_visitor_count()
returns integer
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_count integer;
begin
  if auth.uid() is null
     or (not private.is_super_admin() and not private.staff_has_permission('analytics.view')) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  select count(*)::integer
    into v_count
  from public.site_analytics_sessions s
  where s.last_seen_at >= now() - interval '5 minutes';

  return coalesce(v_count, 0);
end;
$function$;

revoke all on function public.admin_live_visitor_count() from public, anon;
grant execute on function public.admin_live_visitor_count() to authenticated;
comment on function public.admin_live_visitor_count() is 'Returns only an aggregate count of sessions active in the last five minutes; requires analytics.view.';
