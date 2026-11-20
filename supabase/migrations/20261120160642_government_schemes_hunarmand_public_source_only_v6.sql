update public.government_schemes
set source_document_url=null,
source_name='Benazir Income Support Programme — Benazir Hunarmand Portal',
eligibility_text='The current public official portal states that applicants must be registered in the BISP Dynamic Registry, have at least Matric education, be aged 18–40, and only one person per family may register. The public portal page reviewed does not confirm current training seats or district coverage for Sadiqabad / Rahim Yar Khan; confirm local availability through the official portal or BISP Tehsil Office before travelling. Registration does not guarantee selection.',
application_steps='Register only through the official Benazir Hunarmand portal or follow its current instructions for the nearest Tehsil Office. The portal says registration is reviewed and eligible applicants are selected. Confirm current course and district availability for Sadiqabad / Rahim Yar Khan before travelling. Do not pay agents.',
verified_at=now(),next_review_at=now()+interval '7 days',updated_at=now()
where slug='benazir-hunarmand-programme';