-- Only authorized admin staff may create new public site-media objects.
-- Public read is inherited from the existing public Storage bucket; no owner/anon write is granted.
create policy site_media_admin_insert
on storage.objects
for insert
to authenticated
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
