alter table public.chatbot_knowledge_sync_runs
  add column stage text not null default 'queued',
  add column progress_percent smallint not null default 0
    check (progress_percent between 0 and 100);
