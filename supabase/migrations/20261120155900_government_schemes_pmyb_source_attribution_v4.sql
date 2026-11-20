update public.government_schemes
set source_name='Prime Minister’s Youth Programme / Radio Pakistan — Government of Pakistan',
verified_at=now(),next_review_at=now()+interval '7 days',updated_at=now()
where slug='prime-minister-youth-business-agriculture-loan';