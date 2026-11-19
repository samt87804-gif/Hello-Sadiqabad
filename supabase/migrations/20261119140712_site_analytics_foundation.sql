create table public.site_analytics_events (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique,
  event_name text not null check (event_name in ('page_view','engagement','cta_click','content_share','search_summary')),
  schema_version smallint not null default 1 check (schema_version = 1),
  visitor_hash text check (visitor_hash is null or visitor_hash ~ '^[0-9a-f]{64}$'),
  session_hash text not null check (session_hash ~ '^[0-9a-f]{64}$'),
  page_path text not null check (
    length(page_path) between 1 and 512
    and left(page_path, 1) = '/'
    and position('?' in page_path) = 0
    and position('#' in page_path) = 0
  ),
  page_type text not null check (page_type in (
    'home','search','categories','category','area','business','offers','map',
    'emergency','government_helplines','local_authorities','authority_profiles',
    'news','announcements','static'
  )),
  entity_type text check (entity_type is null or entity_type in ('business','news','authority_profile','category','area')),
  entity_id uuid,
  referrer_host text check (referrer_host is null or length(referrer_host) <= 255),
  channel text not null default 'unknown' check (channel in ('direct','search','social','referral','campaign','unknown')),
  utm_source text check (utm_source is null or length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or length(utm_campaign) <= 100),
  utm_content text check (utm_content is null or length(utm_content) <= 100),
  device_class text check (device_class is null or device_class in ('mobile','tablet','desktop','unknown')),
  browser_family text check (browser_family is null or length(browser_family) <= 40),
  os_family text check (os_family is null or length(os_family) <= 40),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  active_seconds smallint not null default 0 check (active_seconds between 0 and 30),
  results_count integer check (results_count is null or results_count between 0 and 100000),
  filters jsonb not null default '{}'::jsonb check (jsonb_typeof(filters) = 'object'),
  created_at timestamptz not null default now()
);

create table public.site_analytics_sessions (
  session_hash text primary key check (session_hash ~ '^[0-9a-f]{64}$'),
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  landing_path text not null check (
    length(landing_path) between 1 and 512
    and left(landing_path, 1) = '/'
    and position('?' in landing_path) = 0
    and position('#' in landing_path) = 0
  ),
  exit_path text check (exit_path is null or (
    length(exit_path) between 1 and 512
    and left(exit_path, 1) = '/'
    and position('?' in exit_path) = 0
    and position('#' in exit_path) = 0
  )),
  page_views integer not null default 0 check (page_views >= 0),
  active_seconds integer not null default 0 check (active_seconds >= 0),
  referrer_host text check (referrer_host is null or length(referrer_host) <= 255),
  channel text not null default 'unknown' check (channel in ('direct','search','social','referral','campaign','unknown')),
  utm_source text check (utm_source is null or length(utm_source) <= 100),
  utm_medium text check (utm_medium is null or length(utm_medium) <= 100),
  utm_campaign text check (utm_campaign is null or length(utm_campaign) <= 100),
  utm_content text check (utm_content is null or length(utm_content) <= 100),
  device_class text check (device_class is null or device_class in ('mobile','tablet','desktop','unknown')),
  browser_family text check (browser_family is null or length(browser_family) <= 40),
  os_family text check (os_family is null or length(os_family) <= 40),
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  updated_at timestamptz not null default now(),
  check (last_seen_at >= started_at)
);

create index site_analytics_events_created_at_idx on public.site_analytics_events (created_at desc);
create index site_analytics_events_page_type_created_idx on public.site_analytics_events (page_type, created_at desc);
create index site_analytics_events_event_name_created_idx on public.site_analytics_events (event_name, created_at desc);
create index site_analytics_events_session_created_idx on public.site_analytics_events (session_hash, created_at desc);
create index site_analytics_events_visitor_created_idx on public.site_analytics_events (visitor_hash, created_at desc);
create index site_analytics_sessions_last_seen_idx on public.site_analytics_sessions (last_seen_at desc);
create index site_analytics_sessions_visitor_started_idx on public.site_analytics_sessions (visitor_hash, started_at desc);

alter table public.site_analytics_events enable row level security;
alter table public.site_analytics_sessions enable row level security;

revoke all on table public.site_analytics_events from anon, authenticated;
revoke all on table public.site_analytics_sessions from anon, authenticated;
grant select on table public.site_analytics_events to authenticated;
grant select on table public.site_analytics_sessions to authenticated;
grant select, insert, update on table public.site_analytics_events to service_role;
grant select, insert, update on table public.site_analytics_sessions to service_role;

create policy "analytics staff can read site analytics events"
on public.site_analytics_events
for select
to authenticated
using (private.is_super_admin() or private.staff_has_permission('analytics.view'));

create policy "analytics staff can read site analytics sessions"
on public.site_analytics_sessions
for select
to authenticated
using (private.is_super_admin() or private.staff_has_permission('analytics.view'));

create or replace function public.admin_site_analytics_report(
  p_start timestamptz,
  p_end timestamptz,
  p_page_type text default null,
  p_channel text default null,
  p_device_class text default null,
  p_entity_id uuid default null
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  if auth.uid() is null
     or (not private.is_super_admin() and not private.staff_has_permission('analytics.view')) then
    raise exception 'Insufficient permission' using errcode = '42501';
  end if;

  if p_start is null or p_end is null or p_end <= p_start
     or p_end - p_start > interval '90 days' then
    raise exception 'Invalid analytics date range (maximum 90 days)' using errcode = '22023';
  end if;

  if p_page_type is not null and p_page_type not in (
    'home','search','categories','category','area','business','offers','map',
    'emergency','government_helplines','local_authorities','authority_profiles',
    'news','announcements','static'
  ) then
    raise exception 'Invalid page type' using errcode = '22023';
  end if;

  if p_channel is not null and p_channel not in ('direct','search','social','referral','campaign','unknown') then
    raise exception 'Invalid channel' using errcode = '22023';
  end if;

  if p_device_class is not null and p_device_class not in ('mobile','tablet','desktop','unknown') then
    raise exception 'Invalid device class' using errcode = '22023';
  end if;

  with filtered_events as (
    select e.*
    from public.site_analytics_events e
    where e.created_at >= p_start and e.created_at < p_end
      and (p_page_type is null or e.page_type = p_page_type)
      and (p_channel is null or e.channel = p_channel)
      and (p_device_class is null or e.device_class = p_device_class)
      and (p_entity_id is null or e.entity_id = p_entity_id)
  ),
  filtered_sessions as (
    select s.*
    from public.site_analytics_sessions s
    where s.started_at < p_end and s.last_seen_at >= p_start
      and (p_page_type is null or exists (
        select 1 from filtered_events e where e.session_hash = s.session_hash and e.event_name = 'page_view'
      ))
      and (p_channel is null or s.channel = p_channel)
      and (p_device_class is null or s.device_class = p_device_class)
  ),
  daily as (
    select timezone('Asia/Karachi', e.created_at)::date as day,
      count(*) filter (where e.event_name = 'page_view') as page_views,
      count(*) filter (where e.event_name = 'cta_click') as cta_clicks,
      count(*) filter (where e.event_name = 'content_share') as content_shares,
      count(*) filter (where e.event_name = 'search_summary') as searches
    from filtered_events e
    group by 1
    order by 1
  ),
  pages as (
    select e.page_type, e.page_path,
      count(*) filter (where e.event_name = 'page_view') as views
    from filtered_events e
    where e.event_name = 'page_view'
    group by e.page_type, e.page_path
    order by views desc, e.page_path
    limit 20
  ),
  channels as (
    select e.channel, count(*) filter (where e.event_name = 'page_view') as page_views
    from filtered_events e
    group by e.channel
    order by page_views desc
  ),
  devices as (
    select coalesce(e.device_class, 'unknown') as device_class,
      count(*) filter (where e.event_name = 'page_view') as page_views
    from filtered_events e
    group by 1
    order by page_views desc
  ),
  engagement as (
    select e.event_name, count(*) as total
    from filtered_events e
    where e.event_name in ('cta_click','content_share','engagement')
    group by e.event_name
    order by e.event_name
  )
  select jsonb_build_object(
    'timezone', 'Asia/Karachi',
    'range', jsonb_build_object('start', p_start, 'end', p_end),
    'summary', jsonb_build_object(
      'page_views', (select count(*) from filtered_events where event_name = 'page_view'),
      'unique_visitors', (select count(distinct visitor_hash) from filtered_events where event_name = 'page_view' and visitor_hash is not null),
      'sessions', (select count(distinct session_hash) from filtered_events where event_name = 'page_view'),
      'avg_engagement_seconds', coalesce((select round(avg(active_seconds)::numeric, 1) from filtered_sessions), 0),
      'pages_per_session', coalesce(
        round(
          (select count(*)::numeric from filtered_events where event_name = 'page_view')
          / nullif((select count(distinct session_hash)::numeric from filtered_events where event_name = 'page_view'), 0), 2
        ), 0
      ),
      'returning_visitors', (
        select count(*) from (
          select visitor_hash from filtered_sessions
          group by visitor_hash having count(*) > 1
        ) returning_set
      )
    ),
    'daily', coalesce((select jsonb_agg(jsonb_build_object(
      'date', day, 'page_views', page_views, 'cta_clicks', cta_clicks,
      'content_shares', content_shares, 'searches', searches
    ) order by day) from daily), '[]'::jsonb),
    'top_pages', coalesce((select jsonb_agg(jsonb_build_object(
      'page_type', page_type, 'page_path', page_path, 'views', views
    ) order by views desc, page_path) from pages), '[]'::jsonb),
    'channels', coalesce((select jsonb_agg(jsonb_build_object(
      'channel', channel, 'page_views', page_views
    ) order by page_views desc) from channels), '[]'::jsonb),
    'devices', coalesce((select jsonb_agg(jsonb_build_object(
      'device_class', device_class, 'page_views', page_views
    ) order by page_views desc) from devices), '[]'::jsonb),
    'engagement', coalesce((select jsonb_agg(jsonb_build_object(
      'event_name', event_name, 'total', total
    ) order by event_name) from engagement), '[]'::jsonb),
    'search', jsonb_build_object(
      'searches', (select count(*) from filtered_events where event_name = 'search_summary'),
      'zero_result_searches', (select count(*) from filtered_events where event_name = 'search_summary' and results_count = 0)
    )
  ) into v_result;

  return v_result;
end;
$function$;

revoke all on function public.admin_site_analytics_report(timestamptz,timestamptz,text,text,text,uuid) from public, anon;
grant execute on function public.admin_site_analytics_report(timestamptz,timestamptz,text,text,text,uuid) to authenticated;

comment on table public.site_analytics_events is 'Privacy-minimized site analytics events; server-only writes and analytics.view-only reads.';
comment on table public.site_analytics_sessions is 'Privacy-minimized session aggregates; server-only writes and analytics.view-only reads.';
comment on function public.admin_site_analytics_report(timestamptz,timestamptz,text,text,text,uuid) is 'Authorized analytics.view report; maximum 90-day range, Asia/Karachi reporting dates.';
