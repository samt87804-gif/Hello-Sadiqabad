select cron.schedule(
  'site-analytics-retention-90d',
  '0 22 * * 0',
  $job$
    delete from public.site_analytics_events
    where created_at < now() - interval '90 days';
    delete from public.site_analytics_sessions
    where last_seen_at < now() - interval '90 days';
  $job$
);
