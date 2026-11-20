create index if not exists government_schemes_created_by_idx on public.government_schemes(created_by);
create index if not exists government_schemes_updated_by_idx on public.government_schemes(updated_by);
create index if not exists government_schemes_published_by_idx on public.government_schemes(published_by);
create index if not exists government_scheme_reports_reviewed_by_idx on public.government_scheme_reports(reviewed_by);