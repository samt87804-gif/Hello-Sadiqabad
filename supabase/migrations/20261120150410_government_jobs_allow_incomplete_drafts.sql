alter table public.government_jobs alter column source_name drop not null, alter column source_url drop not null;
alter table public.government_jobs add constraint government_jobs_published_source_required check (
 status not in ('published','closed','expired') or (
  source_name is not null and char_length(source_name) between 2 and 180
  and source_url is not null and public.is_valid_https_url(source_url)
 )
);
alter table public.government_jobs drop constraint if exists government_jobs_verified_before_publish;
