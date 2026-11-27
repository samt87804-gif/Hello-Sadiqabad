-- Direct Owner registration: link the Auth identity without changing legacy invitation records.
alter table public.owner_registration_requests
  add column if not exists direct_auth_user_id uuid
    references auth.users(id) on delete set null;

create unique index if not exists owner_registration_direct_auth_user_uidx
  on public.owner_registration_requests(direct_auth_user_id)
  where direct_auth_user_id is not null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  pending_direct_owner boolean :=
    coalesce(new.raw_app_meta_data ->> 'owner_registration_status', '') = 'pending_admin_approval';
begin
  insert into public.profiles(id, role, full_name, is_active)
  values (
    new.id,
    'owner',
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    not pending_direct_owner
  )
  on conflict (id) do nothing;
  return new;
end;
$function$;

comment on column public.owner_registration_requests.direct_auth_user_id is
  'Auth identity created by the direct Add Business registration workflow; null for legacy invitation requests.';
