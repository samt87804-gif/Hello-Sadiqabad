alter table public.government_schemes
 add constraint government_schemes_open_intake_requires_official_portal
 check (intake_status <> 'open' or (official_apply_url is not null and next_review_at is not null));