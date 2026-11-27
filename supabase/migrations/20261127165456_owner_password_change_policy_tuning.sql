drop policy if exists owner_password_change_admin_read on public.owner_password_change_requests;
drop policy if exists owner_password_change_owner_read on public.owner_password_change_requests;

create policy owner_password_change_read
  on public.owner_password_change_requests for select to authenticated
  using (
    (select auth.uid()) = user_id
    or private.is_super_admin()
    or private.staff_has_permission('moderation.review')
  );

create index if not exists owner_password_change_requests_reviewed_by_idx
  on public.owner_password_change_requests(reviewed_by)
  where reviewed_by is not null;
