alter table public.government_jobs add column image_url text;
comment on column public.government_jobs.image_url is 'Optional public job poster image URL stored in the Hello Sadiqabad Storage bucket.';

create policy government_job_images_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-jobs'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'))
);

create policy government_job_images_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-jobs'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'))
)
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-jobs'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'))
);

create policy government_job_images_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-jobs'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'))
);