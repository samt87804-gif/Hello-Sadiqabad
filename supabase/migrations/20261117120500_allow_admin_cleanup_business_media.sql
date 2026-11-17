-- Allow any authorized business manager to remove an image from a listing,
-- even when a different authorized admin originally uploaded it.

drop policy if exists "business_media_admin_delete" on storage.objects;

create policy "business_media_admin_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'business-media'
  and (
    private.is_super_admin()
    or private.staff_has_permission('business.create')
    or private.staff_has_permission('business.publish')
  )
);
