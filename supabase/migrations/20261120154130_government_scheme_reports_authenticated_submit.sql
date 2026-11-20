grant insert (scheme_id,reason,note) on public.government_scheme_reports to authenticated;
create policy government_scheme_reports_authenticated_insert on public.government_scheme_reports
 for insert to authenticated with check (
  exists (
   select 1 from public.government_schemes s
   where s.id=scheme_id and s.status='published' and s.published_at is not null and s.published_at<=now()
  )
 );
create trigger trg_audit_record_government_scheme_reports after update on public.government_scheme_reports
 for each row execute function public.audit_log_record();