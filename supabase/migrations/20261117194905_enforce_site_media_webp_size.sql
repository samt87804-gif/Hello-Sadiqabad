-- Restrict new site-media objects to compressed WebP files no larger than 8 MiB.
alter policy site_media_admin_insert
on storage.objects
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'site-media'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and metadata->>'mimetype' = 'image/webp'
  and coalesce((metadata->>'size')::bigint, 0) between 1 and 8388608
  and (
    private.is_super_admin()
    or private.staff_has_permission('settings.manage'::text)
    or private.staff_has_permission('business.create'::text)
    or private.staff_has_permission('business.publish'::text)
    or private.staff_has_permission('ads.review'::text)
    or private.staff_has_permission('announcements.manage'::text)
  )
);
