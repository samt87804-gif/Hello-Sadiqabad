drop policy if exists submissions_owner_read on public.submissions;
drop policy if exists submissions_read on public.submissions;

create policy submissions_read
  on public.submissions
  for select
  to authenticated
  using (
    private.is_super_admin()
    or private.staff_has_permission('moderation.review')
    or (
      submitted_by = (select auth.uid())
      and type in ('new_business', 'claim', 'plan_upgrade')
    )
  );

drop index if exists public.idx_submissions_owner_created;
