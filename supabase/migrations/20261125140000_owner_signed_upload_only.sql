-- Owner profile-image changes must use the authenticated, rate-limited signed-upload flow.
-- The old direct INSERT policy allowed any authenticated account to fill the private bucket
-- without creating a quota request. Signed upload URLs are issued only after owner/business checks.
begin;

drop policy if exists hs_pending_media_owner_upload on storage.objects;

commit;
