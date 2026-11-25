alter table public.government_schemes
  add column if not exists image_url text;

comment on column public.government_schemes.image_url is
  'Admin-uploaded official government scheme poster, published with the verified bilingual scheme record.';

create or replace function private.enforce_government_content_publication_gate()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
declare
  is_new_publication boolean := false;
begin
  if tg_op = 'INSERT' then
    is_new_publication := true;
  elsif tg_op = 'UPDATE' then
    is_new_publication := old.status is distinct from 'published';
  end if;

  if new.status = 'published' and is_new_publication then
    if nullif(btrim(new.title_ur), '') is null then
      raise exception 'Urdu title is required before publication.' using errcode = '23514';
    end if;
    if nullif(btrim(new.summary_en), '') is null or char_length(btrim(new.summary_en)) < 20 then
      raise exception 'English summary must contain at least 20 characters before publication.' using errcode = '23514';
    end if;
    if nullif(btrim(new.summary_ur), '') is null or char_length(btrim(new.summary_ur)) < 20 then
      raise exception 'Urdu summary must contain at least 20 characters before publication.' using errcode = '23514';
    end if;
    if nullif(btrim(new.image_url), '') is null or not public.is_valid_https_url(new.image_url) then
      raise exception 'An official poster image with a valid HTTPS URL is required before publication.' using errcode = '23514';
    end if;
    if nullif(btrim(new.source_name), '') is null or nullif(btrim(new.source_url), '') is null
      or not public.is_valid_https_url(new.source_url) or new.verified_at is null then
      raise exception 'An official HTTPS source and verification date are required before publication.' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_government_jobs_publication_gate on public.government_jobs;
create trigger trg_government_jobs_publication_gate
before insert or update on public.government_jobs
for each row execute function private.enforce_government_content_publication_gate();

drop trigger if exists trg_government_schemes_publication_gate on public.government_schemes;
create trigger trg_government_schemes_publication_gate
before insert or update on public.government_schemes
for each row execute function private.enforce_government_content_publication_gate();

create policy government_scheme_images_admin_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-schemes'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'))
);

create policy government_scheme_images_admin_update
on storage.objects for update to authenticated
using (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-schemes'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'))
)
with check (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-schemes'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'))
);

create policy government_scheme_images_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'Hello Sadiqabad'
  and (storage.foldername(name))[1] = 'government-schemes'
  and (storage.foldername(name))[2] = (select auth.uid())::text
  and (private.is_super_admin() or private.staff_has_permission('government_schemes.manage'))
);
