create table public.government_jobs (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title_en text not null, title_ur text,
 department_name text not null, department_scope text not null default 'punjab' check (department_scope in ('punjab','federal','other')),
 job_type text not null default 'regular' check (job_type in ('regular','contract','project','internship','temporary','other')),
 scale_or_grade text, vacancy_count integer check (vacancy_count is null or vacancy_count >= 0), location_text text not null,
 districts text[] not null default '{}', sadiqabad_relevance boolean, qualification_text text not null, experience_text text,
 age_text text, domicile_text text, gender_or_quota_text text, other_eligibility_text text, application_steps text,
 application_fee_text text, apply_url text, advertisement_url text, official_case_number text, application_open_at date,
 deadline_at date, status text not null default 'draft' check (status in ('draft','published','closed','expired','cancelled')),
 published_at timestamptz, source_name text not null, source_url text not null, source_document_url text, verified_at timestamptz,
 next_review_at timestamptz, created_by uuid references auth.users(id) on delete set null,
 updated_by uuid references auth.users(id) on delete set null, published_by uuid references auth.users(id) on delete set null,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint government_jobs_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
 constraint government_jobs_title_length check (char_length(title_en) between 3 and 180),
 constraint government_jobs_title_ur_length check (title_ur is null or char_length(title_ur) <= 180),
 constraint government_jobs_department_length check (char_length(department_name) between 2 and 180),
 constraint government_jobs_location_length check (char_length(location_text) between 2 and 240),
 constraint government_jobs_qualification_length check (char_length(qualification_text) between 2 and 4000),
 constraint government_jobs_source_name_length check (char_length(source_name) between 2 and 180),
 constraint government_jobs_source_url_https check (public.is_valid_https_url(source_url)),
 constraint government_jobs_source_document_url_https check (public.is_valid_https_url(source_document_url)),
 constraint government_jobs_advertisement_url_https check (public.is_valid_https_url(advertisement_url)),
 constraint government_jobs_apply_url_https check (public.is_valid_https_url(apply_url)),
 constraint government_jobs_open_deadline_order check (application_open_at is null or deadline_at is null or application_open_at <= deadline_at),
 constraint government_jobs_published_timestamp check (status = 'draft' or status = 'cancelled' or published_at is not null),
 constraint government_jobs_verified_before_publish check (status not in ('published','closed','expired') or (verified_at is not null and source_url is not null))
);
comment on table public.government_jobs is 'Official-source-verified government vacancies. Drafts are admin-only; public rows are published/closed/expired records.';
comment on column public.government_jobs.sadiqabad_relevance is 'True/false only when the official advertisement supports the conclusion; NULL means not confirmed.';
comment on column public.government_jobs.deadline_at is 'Date-only application closing date, interpreted through the end of that day in Asia/Karachi.';
create index government_jobs_public_deadline_idx on public.government_jobs (deadline_at asc) where status in ('published','closed','expired') and published_at is not null;
create index government_jobs_admin_updated_idx on public.government_jobs (status, updated_at desc);
create index government_jobs_scope_idx on public.government_jobs (department_scope, status, deadline_at);
alter table public.government_jobs enable row level security;
revoke all on table public.government_jobs from anon, authenticated;
grant select on table public.government_jobs to anon;
grant select, insert, update on table public.government_jobs to authenticated;
create policy government_jobs_public_read on public.government_jobs for select to anon using (status in ('published','closed','expired') and published_at is not null and published_at <= now());
create policy government_jobs_authenticated_read on public.government_jobs for select to authenticated using (
 (status in ('published','closed','expired') and published_at is not null and published_at <= now())
 or private.is_super_admin() or private.staff_has_permission('government_jobs.manage')
);
create policy government_jobs_admin_insert on public.government_jobs for insert to authenticated with check (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'));
create policy government_jobs_admin_update on public.government_jobs for update to authenticated
 using (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'))
 with check (private.is_super_admin() or private.staff_has_permission('government_jobs.manage'));
create trigger trg_updated_at_government_jobs before update on public.government_jobs for each row execute function public.handle_updated_at();
create trigger trg_audit_record_government_jobs after insert or update on public.government_jobs for each row execute function public.audit_log_record();
create or replace function public.my_permissions() returns jsonb language sql stable set search_path to '' as $function$
select jsonb_build_object(
 'role',p.role,
 'is_active',p.is_active and (case when p.role='staff' then coalesce(s.is_active,false) else true end),
 'staff_types',coalesce(s.staff_types,'{}'::text[]),
 'permissions',case when p.role='super_admin' and p.is_active then
 to_jsonb(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage','government_jobs.manage'])
 else coalesce((select jsonb_agg(z.perm) from unnest(array['business.create','business.edit_own','business.publish','import.run','leads.manage','owners.create','tiers.manage','ads.review','moderation.review','support.read','analytics.view','announcements.manage','settings.manage','government_jobs.manage']) as z(perm) where private.staff_has_permission(z.perm)),'[]'::jsonb) end
) from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=(select auth.uid())
$function$;
