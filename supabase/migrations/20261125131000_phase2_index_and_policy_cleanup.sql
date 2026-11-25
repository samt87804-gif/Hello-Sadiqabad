-- Add covering indexes for Phase 2 foreign keys and consolidate media-request read access.
begin;

create index if not exists business_field_reviews_reviewed_by_idx
  on public.business_field_reviews(reviewed_by);
create index if not exists business_image_change_requests_business_id_idx
  on public.business_image_change_requests(business_id);
create unique index if not exists business_image_change_requests_media_asset_id_key
  on public.business_image_change_requests(media_asset_id);
create index if not exists business_image_change_requests_reviewed_by_idx
  on public.business_image_change_requests(reviewed_by);
create index if not exists business_media_assets_reviewed_by_idx
  on public.business_media_assets(reviewed_by);
create index if not exists business_media_assets_uploader_id_idx
  on public.business_media_assets(uploader_id);

drop policy if exists business_image_change_requests_admin_read
  on public.business_image_change_requests;
drop policy if exists business_image_change_requests_owner_read
  on public.business_image_change_requests;
create policy business_image_change_requests_read
  on public.business_image_change_requests
  for select to authenticated
  using (
    owner_id=(select auth.uid())
    or private.staff_has_permission('moderation.review')
  );

commit;
