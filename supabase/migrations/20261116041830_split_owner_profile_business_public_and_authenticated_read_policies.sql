-- Anonymous visitors must not need authenticated-only helper function privileges.
drop policy if exists owner_public_profile_businesses_read on public.owner_public_profile_businesses;
create policy owner_public_profile_businesses_public_read on public.owner_public_profile_businesses for select to anon
using (
 exists(select 1 from public.owner_public_profile_directory d where d.owner_id=owner_public_profile_businesses.owner_id)
 and exists(select 1 from public.businesses b where b.id=owner_public_profile_businesses.business_id
  and b.owner_id=owner_public_profile_businesses.owner_id and b.status='published')
);
create policy owner_public_profile_businesses_authenticated_read on public.owner_public_profile_businesses for select to authenticated
using (
 (select auth.uid())=owner_public_profile_businesses.owner_id
 or private.is_super_admin() or private.staff_has_permission('owners.create')
 or (
  exists(select 1 from public.owner_public_profile_directory d where d.owner_id=owner_public_profile_businesses.owner_id)
  and exists(select 1 from public.businesses b where b.id=owner_public_profile_businesses.business_id
   and b.owner_id=owner_public_profile_businesses.owner_id and b.status='published')
 )
);
