-- Add a narrowly scoped Admin-only reader for private business submission notes.
-- The later access-hardening migration removes direct authenticated SELECT on admin_note.
create or replace function public.admin_submission_private_notes(p_submission_ids uuid[])
returns table(submission_id uuid, admin_note text)
language plpgsql
stable
security definer
set search_path=''
as $function$
begin
  if auth.uid() is null
     or not (private.is_super_admin() or private.staff_has_permission('moderation.review')) then
    raise exception 'Permission denied' using errcode='42501';
  end if;

  if p_submission_ids is null or cardinality(p_submission_ids) > 100 then
    raise exception 'Invalid submission note request';
  end if;

  return query
  select s.id, s.admin_note
  from public.submissions s
  where s.id = any(p_submission_ids)
    and s.type = 'new_business'
    and s.admin_note is not null;
end
$function$;

revoke all on function public.admin_submission_private_notes(uuid[]) from public, anon;
grant execute on function public.admin_submission_private_notes(uuid[]) to authenticated;
