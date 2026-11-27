-- Fix profile self-edit guard access without exposing the private schema.
create or replace function private.guard_owner_profile_self_edit()
returns trigger language plpgsql security definer set search_path = ''
as $function$
declare v_jwt_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if (new.full_name is distinct from old.full_name or new.phone is distinct from old.phone)
     and auth.uid() is not null and auth.uid() = old.id
     and v_jwt_role <> 'service_role'
     and not private.is_super_admin() then
    raise exception 'Owner profile changes require Admin approval';
  end if;
  return new;
end
$function$;
revoke all on function private.guard_owner_profile_self_edit() from public, anon, authenticated, service_role;

-- Admin-only complete reader for Moderation Queue and Data Quality.
create or replace function public.admin_moderation_submissions()
returns setof public.submissions
language plpgsql stable security definer set search_path = ''
as $function$
begin
  if auth.uid() is null
     or not (private.is_super_admin() or private.staff_has_permission('moderation.review')) then
    raise exception 'Permission denied' using errcode = '42501';
  end if;
  return query select s.* from public.submissions s order by s.created_at desc;
end
$function$;
revoke all on function public.admin_moderation_submissions() from public, anon;
grant execute on function public.admin_moderation_submissions() to authenticated;
