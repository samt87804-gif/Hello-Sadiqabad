-- Restrict admin business image uploads to each staff member's own folder.
-- The bucket is public for image delivery; object writes/deletes remain authenticated and permission-gated.

create policy "business_media_admin_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'business-media'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (
    private.is_super_admin()
    or private.staff_has_permission('business.create')
    or private.staff_has_permission('business.publish')
  )
);

create policy "business_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'business-media'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (
    private.is_super_admin()
    or private.staff_has_permission('business.create')
    or private.staff_has_permission('business.publish')
  )
);
