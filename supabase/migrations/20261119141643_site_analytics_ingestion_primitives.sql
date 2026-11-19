create table private.analytics_gateway_tokens (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table private.analytics_gateway_tokens enable row level security;
revoke all on table private.analytics_gateway_tokens from public, anon, authenticated, service_role;

create or replace function public.verify_analytics_gateway_token(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select p_token is not null
    and length(p_token) between 32 and 512
    and exists (
      select 1
      from private.analytics_gateway_tokens t
      where t.is_active
        and t.token_hash = encode(extensions.digest(convert_to(p_token, 'UTF8'), 'sha256'), 'hex')
    );
$function$;
revoke all on function public.verify_analytics_gateway_token(text) from public, anon, authenticated;
grant execute on function public.verify_analytics_gateway_token(text) to service_role;

create or replace function public.record_site_analytics_event(p_event jsonb)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $function$
declare
  e record;
  inserted_event_id uuid;
begin
  if jsonb_typeof(p_event) <> 'object' then
    raise exception 'Invalid analytics event' using errcode = '22023';
  end if;

  select * into e
  from jsonb_to_record(p_event) as x(
    event_id uuid,
    event_name text,
    visitor_hash text,
    session_hash text,
    page_path text,
    page_type text,
    entity_type text,
    entity_id uuid,
    referrer_host text,
    channel text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    utm_content text,
    device_class text,
    browser_family text,
    os_family text,
    country_code text,
    active_seconds smallint,
    results_count integer,
    filters jsonb
  );

  if e.event_id is null or e.event_name is null or e.session_hash is null
     or e.visitor_hash is null or e.page_path is null or e.page_type is null then
    raise exception 'Missing required analytics fields' using errcode = '22023';
  end if;

  insert into public.site_analytics_events (
    event_id,event_name,visitor_hash,session_hash,page_path,page_type,
    entity_type,entity_id,referrer_host,channel,utm_source,utm_medium,
    utm_campaign,utm_content,device_class,browser_family,os_family,
    country_code,active_seconds,results_count,filters
  ) values (
    e.event_id,e.event_name,e.visitor_hash,e.session_hash,e.page_path,e.page_type,
    e.entity_type,e.entity_id,e.referrer_host,coalesce(e.channel,'unknown'),
    e.utm_source,e.utm_medium,e.utm_campaign,e.utm_content,e.device_class,
    e.browser_family,e.os_family,e.country_code,coalesce(e.active_seconds,0),
    e.results_count,coalesce(e.filters,'{}'::jsonb)
  )
  on conflict (event_id) do nothing
  returning id into inserted_event_id;

  if inserted_event_id is null then
    return false;
  end if;

  insert into public.site_analytics_sessions (
    session_hash,visitor_hash,started_at,last_seen_at,landing_path,exit_path,
    page_views,active_seconds,referrer_host,channel,utm_source,utm_medium,
    utm_campaign,utm_content,device_class,browser_family,os_family,country_code
  ) values (
    e.session_hash,e.visitor_hash,now(),now(),e.page_path,e.page_path,
    case when e.event_name='page_view' then 1 else 0 end,
    coalesce(e.active_seconds,0),e.referrer_host,coalesce(e.channel,'unknown'),
    e.utm_source,e.utm_medium,e.utm_campaign,e.utm_content,e.device_class,
    e.browser_family,e.os_family,e.country_code
  )
  on conflict (session_hash) do update set
    last_seen_at = greatest(public.site_analytics_sessions.last_seen_at, excluded.last_seen_at),
    exit_path = excluded.exit_path,
    page_views = public.site_analytics_sessions.page_views + excluded.page_views,
    active_seconds = public.site_analytics_sessions.active_seconds + excluded.active_seconds,
    updated_at = now();

  return true;
end;
$function$;

revoke all on function public.record_site_analytics_event(jsonb) from public, anon, authenticated;
grant execute on function public.record_site_analytics_event(jsonb) to service_role;

comment on function public.verify_analytics_gateway_token(text) is 'Reserved server-to-server token verifier; executable only by service_role.';
comment on function public.record_site_analytics_event(jsonb) is 'Atomic deduplicated analytics event insert and session aggregate update; executable only by service_role.';
