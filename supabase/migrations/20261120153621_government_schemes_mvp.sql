create table public.government_schemes (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title_en text not null, title_ur text, summary_en text, summary_ur text,
 government_scope text not null check (government_scope in ('punjab','federal')),
 category text not null check (category in ('housing','business_finance','agriculture','education','social_protection','skills','health','other')),
 benefit_type text not null check (benefit_type in ('grant','loan','cash_transfer','subsidy','training','housing','service','other')),
 benefit_details text not null, eligibility_text text not null, required_documents text[] not null default '{}', application_steps text, fees_and_repayment text,
 official_apply_url text, source_name text, source_url text, source_document_url text,
 intake_status text not null default 'unconfirmed' check (intake_status in ('unconfirmed','upcoming','open','paused','closed','expired','cancelled')),
 application_open_at date, deadline_at date,
 status text not null default 'draft' check (status in ('draft','published','archived')), published_at timestamptz, verified_at timestamptz, next_review_at timestamptz,
 created_by uuid references auth.users(id) on delete set null, updated_by uuid references auth.users(id) on delete set null,
 published_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint government_schemes_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 constraint government_schemes_title_length check (char_length(title_en) between 3 and 180),
 constraint government_schemes_title_ur_length check (title_ur is null or char_length(title_ur) <= 180),
 constraint government_schemes_summary_en_length check (summary_en is null or char_length(summary_en) between 20 and 800),
 constraint government_schemes_summary_ur_length check (summary_ur is null or char_length(summary_ur) <= 800),
 constraint government_schemes_benefit_length check (char_length(benefit_details) between 10 and 6000),
 constraint government_schemes_eligibility_length check (char_length(eligibility_text) between 10 and 6000),
 constraint government_schemes_application_steps_length check (application_steps is null or char_length(application_steps) <= 6000),
 constraint government_schemes_fees_length check (fees_and_repayment is null or char_length(fees_and_repayment) <= 3000),
 constraint government_schemes_source_name_length check (source_name is null or char_length(source_name) between 2 and 180),
 constraint government_schemes_source_url_https check (source_url is null or public.is_valid_https_url(source_url)),
 constraint government_schemes_source_document_url_https check (source_document_url is null or public.is_valid_https_url(source_document_url)),
 constraint government_schemes_apply_url_https check (official_apply_url is null or public.is_valid_https_url(official_apply_url)),
 constraint government_schemes_date_order check (application_open_at is null or deadline_at is null or application_open_at <= deadline_at),
 constraint government_schemes_publish_gate check (status <> 'published' or (published_at is not null and summary_en is not null and char_length(summary_en)>=20 and source_name is not null and source_url is not null and verified_at is not null))
);
comment on table public.government_schemes is 'Official-source-verified Punjab and Federal government schemes. Only published rows are public; intake status is separate from publication status.';
comment on column public.government_schemes.intake_status is 'Application intake state. unconfirmed means the current intake window has not been independently confirmed; never display as Apply Now.';
comment on column public.government_schemes.required_documents is 'Public-facing checklist only; never request users to send these documents to Hello Sadiqabad.';
create index government_schemes_public_idx on public.government_schemes (government_scope, category, intake_status, updated_at desc) where status='published' and published_at is not null;
create index government_schemes_admin_idx on public.government_schemes (status, updated_at desc);
create index government_schemes_deadline_idx on public.government_schemes (deadline_at asc) where status='published' and deadline_at is not null;
alter table public.government_schemes enable row level security;
revoke all on table public.government_schemes from anon, authenticated;
grant select on table public.government_schemes to anon;
grant select, insert, update on table public.government_schemes to authenticated;
create policy government_schemes_public_read on public.government_schemes for select to anon using (status='published' and published_at is not null and published_at<=now());
create policy government_schemes_authenticated_read on public.government_schemes for select to authenticated using ((status='published' and published_at is not null and published_at<=now()) or private.is_super_admin() or private.staff_has_permission('government_schemes.manage'));
create policy government_schemes_admin_insert on public.government_schemes for insert to authenticated with check (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'));
create policy government_schemes_admin_update on public.government_schemes for update to authenticated using (private.is_super_admin() or private.staff_has_permission('government_schemes.manage')) with check (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'));
create trigger trg_updated_at_government_schemes before update on public.government_schemes for each row execute function public.handle_updated_at();
create trigger trg_audit_record_government_schemes after insert or update on public.government_schemes for each row execute function public.audit_log_record();

create table public.government_scheme_reports (
 id uuid primary key default gen_random_uuid(), scheme_id uuid not null references public.government_schemes(id) on delete restrict,
 reason text not null check (reason in ('incorrect_information','broken_official_link','intake_status_changed','other')),
 note text, report_hour timestamptz not null default date_trunc('hour',now()), reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id) on delete set null, review_note text, created_at timestamptz not null default now(),
 constraint government_scheme_reports_note_length check (note is null or char_length(note)<=500),
 constraint government_scheme_reports_review_note_length check (review_note is null or char_length(review_note)<=500),
 constraint government_scheme_reports_one_per_reason_per_hour unique (scheme_id,reason,report_hour)
);
comment on table public.government_scheme_reports is 'Minimal anonymous scheme accuracy reports. Never collect CNIC, phone, email, OTP, bank or application data.';
create index government_scheme_reports_queue_idx on public.government_scheme_reports (reviewed_at,created_at desc);
create index government_scheme_reports_scheme_idx on public.government_scheme_reports (scheme_id,created_at desc);
alter table public.government_scheme_reports enable row level security;
revoke all on table public.government_scheme_reports from anon,authenticated;
grant insert (scheme_id,reason,note) on public.government_scheme_reports to anon;
grant select,update on public.government_scheme_reports to authenticated;
create policy government_scheme_reports_public_insert on public.government_scheme_reports for insert to anon with check (exists(select 1 from public.government_schemes s where s.id=scheme_id and s.status='published' and s.published_at is not null and s.published_at<=now()));
create policy government_scheme_reports_admin_read on public.government_scheme_reports for select to authenticated using (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'));
create policy government_scheme_reports_admin_update on public.government_scheme_reports for update to authenticated using (private.is_super_admin() or private.staff_has_permission('government_schemes.manage')) with check (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'));

create or replace function public.my_permissions() returns jsonb language sql stable set search_path to '' as $function$
select jsonb_build_object(
 'role',p.role,
 'is_active',p.is_active and (case when p.role='staff' then coalesce(s.is_active,false) else true end),
 'staff_types',coalesce(s.staff_types,'{}'::text[]),
 'permissions',case when p.role='super_admin' and p.is_active then
 to_jsonb(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage','government_jobs.manage','government_schemes.manage'])
 else coalesce((select jsonb_agg(z.perm) from unnest(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage','government_jobs.manage','government_schemes.manage']) as z(perm) where private.staff_has_permission(z.perm)),'[]'::jsonb) end
)
from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=(select auth.uid())
$function$;