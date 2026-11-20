create table public.government_scheme_revisions (
 id uuid primary key default gen_random_uuid(),
 scheme_id uuid not null references public.government_schemes(id) on delete restrict,
 change_type text not null check (change_type in ('INSERT','UPDATE')),
 previous_snapshot jsonb,
 new_snapshot jsonb not null,
 changed_by uuid references auth.users(id) on delete set null,
 changed_at timestamptz not null default now()
);
comment on table public.government_scheme_revisions is 'Append-only admin-only snapshots of material Government Scheme record changes.';
create index government_scheme_revisions_scheme_idx on public.government_scheme_revisions(scheme_id,changed_at desc);
create index government_scheme_revisions_changed_by_idx on public.government_scheme_revisions(changed_by);
alter table public.government_scheme_revisions enable row level security;
revoke all on table public.government_scheme_revisions from anon,authenticated;
grant select on table public.government_scheme_revisions to authenticated;
create policy government_scheme_revisions_admin_read on public.government_scheme_revisions
 for select to authenticated using (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'));

create or replace function public.record_government_scheme_revision()
returns trigger language plpgsql security definer set search_path=''
as $function$
begin
 insert into public.government_scheme_revisions(scheme_id,change_type,previous_snapshot,new_snapshot,changed_by)
 values(new.id,tg_op,case when tg_op='UPDATE' then to_jsonb(old) else null end,to_jsonb(new),auth.uid());
 return new;
end
$function$;
revoke all on function public.record_government_scheme_revision() from public,anon,authenticated;
create trigger trg_government_scheme_revision after insert or update on public.government_schemes
 for each row execute function public.record_government_scheme_revision();

insert into public.government_scheme_revisions(scheme_id,change_type,previous_snapshot,new_snapshot,changed_by)
select id,'INSERT',null,to_jsonb(s),null from public.government_schemes s
where not exists(select 1 from public.government_scheme_revisions r where r.scheme_id=s.id);