-- Replace the owner-executed public projection with an invoker-security view.
-- Anon receives only allowlisted public columns on the base table, protected by
-- a published-only RLS policy; employer linkage and moderation columns remain
-- inaccessible. This avoids a SECURITY DEFINER view and satisfies the advisor.

drop policy if exists sdk_jobs_public_read on public.sdk_jobs;
create policy sdk_jobs_public_read on public.sdk_jobs
for select to anon
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
  and (closing_date is null or closing_date >= (now() at time zone 'Asia/Karachi')::date)
);

grant select (
  slug,
  title_en,
  title_ur,
  summary_en,
  summary_ur,
  description_en,
  description_ur,
  job_category,
  vacancy_count,
  job_type,
  area_id,
  work_location_en,
  work_location_ur,
  salary_min,
  salary_max,
  salary_disclosed,
  duties_en,
  duties_ur,
  qualifications_en,
  qualifications_ur,
  experience_en,
  experience_ur,
  working_hours_en,
  working_hours_ur,
  benefits_en,
  benefits_ur,
  closing_date,
  approved_image_url,
  published_at,
  status
) on public.sdk_jobs to anon;

create or replace view public.sdk_jobs_public
with (security_barrier = true, security_invoker = true)
as
select
  j.slug,
  j.title_en,
  j.title_ur,
  j.summary_en,
  j.summary_ur,
  j.description_en,
  j.description_ur,
  j.job_category,
  j.vacancy_count,
  j.job_type,
  a.name_en as area_name_en,
  a.name_ur as area_name_ur,
  j.work_location_en,
  j.work_location_ur,
  case when j.salary_disclosed then j.salary_min else null end as salary_min,
  case when j.salary_disclosed then j.salary_max else null end as salary_max,
  j.salary_disclosed,
  j.duties_en,
  j.duties_ur,
  j.qualifications_en,
  j.qualifications_ur,
  j.experience_en,
  j.experience_ur,
  j.working_hours_en,
  j.working_hours_ur,
  j.benefits_en,
  j.benefits_ur,
  j.closing_date,
  j.approved_image_url as image_url,
  j.published_at
from public.sdk_jobs j
left join public.areas a on a.id = j.area_id
where j.status = 'published'
  and j.published_at is not null
  and j.published_at <= now()
  and (j.closing_date is null or j.closing_date >= (now() at time zone 'Asia/Karachi')::date);

revoke all on public.sdk_jobs_public from anon, authenticated;
grant select on public.sdk_jobs_public to anon, authenticated;
