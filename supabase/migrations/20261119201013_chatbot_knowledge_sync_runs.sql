create table public.chatbot_knowledge_sync_runs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null default 'running'
    check (status in ('running', 'success', 'failed')),
  triggered_by uuid references public.profiles(id) on delete set null,
  source_status jsonb not null default '{}'::jsonb,
  source_counts jsonb not null default '{}'::jsonb,
  total_records integer not null default 0 check (total_records >= 0),
  error_summary text,
  created_at timestamptz not null default now()
);

create index chatbot_knowledge_sync_runs_started_at_idx
  on public.chatbot_knowledge_sync_runs (started_at desc);

alter table public.chatbot_knowledge_sync_runs enable row level security;

revoke all on table public.chatbot_knowledge_sync_runs from anon, authenticated;
grant select, insert, update on table public.chatbot_knowledge_sync_runs to authenticated;

create policy chatbot_sync_runs_super_admin_select
  on public.chatbot_knowledge_sync_runs
  for select to authenticated
  using (
    triggered_by = (select auth.uid())
    or exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'super_admin'
        and p.is_active = true
    )
  );

create policy chatbot_sync_runs_super_admin_insert
  on public.chatbot_knowledge_sync_runs
  for insert to authenticated
  with check (
    triggered_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'super_admin'
        and p.is_active = true
    )
  );

create policy chatbot_sync_runs_super_admin_update
  on public.chatbot_knowledge_sync_runs
  for update to authenticated
  using (
    triggered_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'super_admin'
        and p.is_active = true
    )
  )
  with check (
    triggered_by = (select auth.uid())
    and exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'super_admin'
        and p.is_active = true
    )
  );
