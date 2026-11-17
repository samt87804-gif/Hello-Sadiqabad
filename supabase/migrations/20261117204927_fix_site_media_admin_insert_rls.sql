-- The Storage API does not reliably expose size/mimetype metadata to the INSERT
-- RLS WITH CHECK expression on every upload path. Keep the strict admin identity,
-- bucket and per-user folder checks; the browser uploader still converts to WebP
-- and enforces the 8 MiB compressed-file limit before sending.
alter policy site_media_admin_insert
on storage.objects
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'site-media'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (
    private.is_super_admin()
    or private.staff_has_permission('settings.manage'::text)
    or private.staff_has_permission('business.create'::text)
    or private.staff_has_permission('business.publish'::text)
    or private.staff_has_permission('ads.review'::text)
    or private.staff_has_permission('announcements.manage'::text)
  )
);