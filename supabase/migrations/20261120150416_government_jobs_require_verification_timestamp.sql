alter table public.government_jobs drop constraint government_jobs_published_source_required;
alter table public.government_jobs add constraint government_jobs_published_source_required check (
 status not in ('published','closed','expired') or (
  source_name is not null and char_length(source_name) between 2 and 180
  and source_url is not null and public.is_valid_https_url(source_url) and verified_at is not null
 )
);
