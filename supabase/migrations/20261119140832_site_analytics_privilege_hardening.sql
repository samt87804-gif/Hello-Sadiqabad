revoke all on table public.site_analytics_events from service_role;
revoke all on table public.site_analytics_sessions from service_role;
grant select, insert, update on table public.site_analytics_events to service_role;
grant select, insert, update on table public.site_analytics_sessions to service_role;

revoke all on function public.admin_site_analytics_report(timestamptz,timestamptz,text,text,text,uuid)
from public, anon, service_role;
grant execute on function public.admin_site_analytics_report(timestamptz,timestamptz,text,text,text,uuid)
to authenticated;
