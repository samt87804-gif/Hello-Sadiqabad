drop policy chatbot_sync_runs_super_admin_select on public.chatbot_knowledge_sync_runs;

create policy chatbot_sync_runs_super_admin_select
  on public.chatbot_knowledge_sync_runs
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'super_admin'
        and p.is_active = true
    )
  );
