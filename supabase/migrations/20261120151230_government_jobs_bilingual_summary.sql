alter table public.government_jobs
 add column summary_en text,
 add column summary_ur text;
alter table public.government_jobs
 add constraint government_jobs_summary_en_length check (summary_en is null or char_length(summary_en) between 20 and 600),
 add constraint government_jobs_summary_ur_length check (summary_ur is null or char_length(summary_ur) <= 600),
 add constraint government_jobs_published_summary_required check (
  status not in ('published','closed','expired')
  or (summary_en is not null and char_length(summary_en) between 20 and 600)
 );
comment on column public.government_jobs.summary_en is 'Editorial English summary; required before public publication.';
comment on column public.government_jobs.summary_ur is 'Optional Urdu summary for bilingual public display.';
