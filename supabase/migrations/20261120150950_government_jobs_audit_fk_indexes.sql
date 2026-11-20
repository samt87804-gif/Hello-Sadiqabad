create index government_jobs_created_by_idx on public.government_jobs (created_by) where created_by is not null;
create index government_jobs_updated_by_idx on public.government_jobs (updated_by) where updated_by is not null;
create index government_jobs_published_by_idx on public.government_jobs (published_by) where published_by is not null;
