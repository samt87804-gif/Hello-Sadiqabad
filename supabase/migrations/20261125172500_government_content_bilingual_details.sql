alter table public.government_jobs
  add column if not exists qualification_text_ur text,
  add column if not exists experience_text_ur text,
  add column if not exists age_text_ur text,
  add column if not exists domicile_text_ur text,
  add column if not exists gender_or_quota_text_ur text,
  add column if not exists other_eligibility_text_ur text,
  add column if not exists application_steps_ur text,
  add column if not exists application_fee_text_ur text;

alter table public.government_schemes
  add column if not exists benefit_details_ur text,
  add column if not exists eligibility_text_ur text,
  add column if not exists required_documents_ur text[] not null default '{}',
  add column if not exists application_steps_ur text,
  add column if not exists fees_and_repayment_ur text;

comment on column public.government_jobs.qualification_text_ur is 'Admin-verified Urdu translation of the official job qualification criteria.';
comment on column public.government_jobs.application_steps_ur is 'Admin-verified Urdu translation of official job application instructions.';
comment on column public.government_schemes.benefit_details_ur is 'Admin-verified Urdu translation of official scheme benefits and financial terms.';
comment on column public.government_schemes.eligibility_text_ur is 'Admin-verified Urdu translation of official scheme eligibility criteria.';
comment on column public.government_schemes.required_documents_ur is 'Urdu translations corresponding by array position to required_documents.';

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

    if tg_table_name = 'government_jobs' then
      if nullif(btrim(new.qualification_text_ur), '') is null then
        raise exception 'Urdu qualification criteria are required before job publication.' using errcode = '23514';
      end if;
      if nullif(btrim(new.experience_text), '') is not null and nullif(btrim(new.experience_text_ur), '') is null then
        raise exception 'Urdu experience details are required when English experience details are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.age_text), '') is not null and nullif(btrim(new.age_text_ur), '') is null then
        raise exception 'Urdu age details are required when English age details are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.domicile_text), '') is not null and nullif(btrim(new.domicile_text_ur), '') is null then
        raise exception 'Urdu domicile details are required when English domicile details are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.gender_or_quota_text), '') is not null and nullif(btrim(new.gender_or_quota_text_ur), '') is null then
        raise exception 'Urdu gender/quota details are required when English details are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.other_eligibility_text), '') is not null and nullif(btrim(new.other_eligibility_text_ur), '') is null then
        raise exception 'Urdu additional eligibility details are required when English details are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.application_steps), '') is not null and nullif(btrim(new.application_steps_ur), '') is null then
        raise exception 'Urdu application steps are required when English steps are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.application_fee_text), '') is not null and nullif(btrim(new.application_fee_text_ur), '') is null then
        raise exception 'Urdu fee details are required when English fee details are supplied.' using errcode = '23514';
      end if;
    elsif tg_table_name = 'government_schemes' then
      if nullif(btrim(new.benefit_details_ur), '') is null then
        raise exception 'Urdu scheme benefit details are required before publication.' using errcode = '23514';
      end if;
      if nullif(btrim(new.eligibility_text_ur), '') is null then
        raise exception 'Urdu scheme eligibility details are required before publication.' using errcode = '23514';
      end if;
      if cardinality(new.required_documents) > 0 and (
        cardinality(new.required_documents_ur) <> cardinality(new.required_documents)
        or exists (select 1 from unnest(new.required_documents_ur) as document where nullif(btrim(document), '') is null)
      ) then
        raise exception 'Each required document needs a corresponding Urdu translation.' using errcode = '23514';
      end if;
      if nullif(btrim(new.application_steps), '') is not null and nullif(btrim(new.application_steps_ur), '') is null then
        raise exception 'Urdu scheme application steps are required when English steps are supplied.' using errcode = '23514';
      end if;
      if nullif(btrim(new.fees_and_repayment), '') is not null and nullif(btrim(new.fees_and_repayment_ur), '') is null then
        raise exception 'Urdu scheme fees and repayment details are required when English details are supplied.' using errcode = '23514';
      end if;
    end if;
  end if;

  return new;
end;
$$;
