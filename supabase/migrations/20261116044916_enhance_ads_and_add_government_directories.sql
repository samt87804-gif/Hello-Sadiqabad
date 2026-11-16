-- Government helpline metadata and categories.
alter table public.emergency_contacts
  add column if not exists source_url text,
  add column if not exists verified_at timestamptz;

alter table public.emergency_contacts
  drop constraint if exists emergency_contacts_category_check;
alter table public.emergency_contacts
  add constraint emergency_contacts_category_check
  check (category = any (array['rescue','police','fire','ambulance','hospital','utility','general','government']));

alter table public.emergency_contacts
  drop constraint if exists emergency_contacts_source_url_check;
alter table public.emergency_contacts
  add constraint emergency_contacts_source_url_check
  check (public.is_valid_https_url(source_url));

-- Support safe same-site campaign links as well as HTTPS destinations.
alter table public.ads
  drop constraint if exists ads_target_https;
alter table public.ads
  add constraint ads_target_https
  check (
    target_url is null
    or public.is_valid_https_url(target_url)
    or (
      char_length(target_url) <= 500
      and left(target_url, 1) = '/'
      and left(target_url, 2) <> '//'
      and target_url ~ '^/[A-Za-z0-9/_?&=#%+.-]*$'
    )
  );

alter table public.ads
  drop constraint if exists ads_placement_check;
alter table public.ads
  add constraint ads_placement_check
  check (placement = any (array[
    'homepage_top','search_sidebar','category_banner','popup',
    'emergency_banner','authorities_banner'
  ]));

create table if not exists public.local_authorities (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name_en text not null check (char_length(name_en) between 2 and 140),
  name_ur text not null check (char_length(name_ur) between 2 and 180),
  authority_type text not null check (authority_type = any (array['municipal','police','revenue','district','sanitation','other'])),
  description_en text,
  description_ur text,
  phone text,
  phone_secondary text,
  email text,
  address_en text,
  address_ur text,
  website_url text,
  map_url text,
  office_hours_en text,
  office_hours_ur text,
  source_url text not null check (public.is_valid_https_url(source_url)),
  verified_at timestamptz not null default now(),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint local_authorities_website_https check (public.is_valid_https_url(website_url)),
  constraint local_authorities_map_https check (public.is_valid_https_url(map_url)),
  constraint local_authorities_city_name_key unique (city_id, name_en)
);

create index if not exists idx_local_authorities_city_active_sort
  on public.local_authorities(city_id, is_active, sort_order, name_en);
create index if not exists idx_local_authorities_type_active
  on public.local_authorities(authority_type, is_active);

alter table public.local_authorities enable row level security;

grant select on public.local_authorities to anon, authenticated;
grant insert, update, delete on public.local_authorities to authenticated;

drop policy if exists local_authorities_public_read on public.local_authorities;
create policy local_authorities_public_read
  on public.local_authorities for select to anon
  using (is_active);

drop policy if exists local_authorities_authenticated_read on public.local_authorities;
create policy local_authorities_authenticated_read
  on public.local_authorities for select to authenticated
  using (is_active or private.is_super_admin());

drop policy if exists local_authorities_admin_insert on public.local_authorities;
create policy local_authorities_admin_insert
  on public.local_authorities for insert to authenticated
  with check (private.is_super_admin());

drop policy if exists local_authorities_admin_update on public.local_authorities;
create policy local_authorities_admin_update
  on public.local_authorities for update to authenticated
  using (private.is_super_admin())
  with check (private.is_super_admin());

drop policy if exists local_authorities_admin_delete on public.local_authorities;
create policy local_authorities_admin_delete
  on public.local_authorities for delete to authenticated
  using (private.is_super_admin());

drop trigger if exists trg_updated_at_local_authorities on public.local_authorities;
create trigger trg_updated_at_local_authorities
  before update on public.local_authorities
  for each row execute function public.handle_updated_at();

drop trigger if exists trg_audit_record_local_authorities on public.local_authorities;
create trigger trg_audit_record_local_authorities
  after insert or update or delete on public.local_authorities
  for each row execute function public.audit_log_record();

-- Refresh provenance for the existing national emergency shortcodes.
update public.emergency_contacts
set source_url = 'https://www.punjabpolice.gov.pk/emergency_help',
    verified_at = now()
where phone in ('1122','15','16')
  and source_url is null;

-- Verified provincial and district government helplines.
insert into public.emergency_contacts
  (city_id,name_en,name_ur,phone,category,icon,sort_order,is_active,description_en,description_ur,source_url,verified_at)
select c.id, v.name_en, v.name_ur, v.phone, 'government', v.icon, v.sort_order, true,
       v.description_en, v.description_ur, v.source_url, now()
from public.cities c
cross join (values
  ('District Control Room — Toll Free','ضلعی کنٹرول روم — ٹول فری','0800-33444','building-2',1,
   '24/7 District Government Rahim Yar Khan public helpline.','ضلعی حکومت رحیم یار خان کی 24/7 عوامی ہیلپ لائن۔',
   'https://rykhan.punjab.gov.pk/contact_us'),
  ('Punjab Highway Patrol Helpline','پنجاب ہائی وے پٹرول ہیلپ لائن','1124','shield-check',7,
   'Punjab Highway Patrol contact listed by the District Government Rahim Yar Khan.','ضلعی حکومت رحیم یار خان کی سرکاری رابطہ فہرست میں درج پنجاب ہائی وے پٹرول نمبر۔',
   'https://rykhan.punjab.gov.pk/contact_us'),
  ('Suthra Punjab Citizen Helpline','ستھرا پنجاب شہری ہیلپ لائن','1139','recycle',3,
   'Punjab Government helpline for cleanliness and municipal service complaints.','صفائی اور بلدیاتی خدمات کی شکایات کے لیے حکومت پنجاب کی ہیلپ لائن۔',
   'https://suthra.punjab.gov.pk/complaint.php'),
  ('IGP Police Complaint Center','آئی جی پی پولیس شکایت مرکز','1787','shield-check',4,
   'Punjab Police complaint helpline for reporting police-related complaints.','پولیس سے متعلق شکایات درج کرانے کے لیے پنجاب پولیس ہیلپ لائن۔',
   'https://www.punjabpolice.gov.pk/contact_details'),
  ('Punjab Women Toll-Free Helpline','پنجاب خواتین ٹول فری ہیلپ لائن','1043','heart-handshake',5,
   'Punjab Commission on the Status of Women helpline for women in distress and rights-related complaints.','خواتین کی مدد اور حقوق سے متعلق شکایات کے لیے پنجاب کمیشن کی ہیلپ لائن۔',
   'https://pcsw.punjab.gov.pk/system/files/PGPR-2023%20%26%202024-Web.pdf'),
  ('Local Government & Community Development Helpline','لوکل گورنمنٹ و کمیونٹی ڈویلپمنٹ ہیلپ لائن','0800-02345','landmark',6,
   'Punjab Local Government and Community Development Department information helpline.','محکمہ بلدیات و کمیونٹی ڈویلپمنٹ پنجاب کی معلوماتی ہیلپ لائن۔',
   'https://lgcd.punjab.gov.pk/facilities_available_for_obtaining_information')
) as v(name_en,name_ur,phone,icon,sort_order,description_en,description_ur,source_url)
where c.slug = 'sadiqabad'
on conflict (name_en,phone) do nothing;

-- Initial local authority directory records. Names and numbers are sourced from official government directories.
insert into public.local_authorities
  (city_id,name_en,name_ur,authority_type,description_en,description_ur,phone,phone_secondary,email,address_en,address_ur,website_url,source_url,office_hours_en,office_hours_ur,sort_order)
select c.id, v.name_en, v.name_ur, v.authority_type, v.description_en, v.description_ur,
       v.phone, v.phone_secondary, v.email, v.address_en, v.address_ur, v.website_url, v.source_url,
       v.office_hours_en, v.office_hours_ur, v.sort_order
from public.cities c
cross join (values
  ('Municipal Committee Sadiqabad','میونسپل کمیٹی صادق آباد','municipal',
   'Municipal services, sanitation, public complaints and local civic administration.','بلدیاتی خدمات، صفائی، عوامی شکایات اور شہری انتظام۔',
   '0300 6710881','0304-7283164','municipalcommitteesdk@gmail.com',
   'Sadiqabad Tehsil, Rahim Yar Khan District, Punjab, Pakistan','تحصیل صادق آباد، ضلع رحیم یار خان، پنجاب، پاکستان',
   'https://mcsadiqabad.lgpunjab.org.pk/','https://mcsadiqabad.lgpunjab.org.pk/',
   '09:00 AM–04:00 PM','صبح 9 بجے تا شام 4 بجے',1),
  ('SDPO Sadiqabad Circle','ایس ڈی پی او سرکل صادق آباد','police',
   'Police circle office contact listed in the official Punjab Police directory.','سرکل پولیس دفتر کا رابطہ، سرکاری پنجاب پولیس ڈائریکٹری کے مطابق۔',
   '068-5705445',null,null,
   'Sadiqabad, Rahim Yar Khan District, Punjab, Pakistan','صادق آباد، ضلع رحیم یار خان، پنجاب، پاکستان',
   'https://www.punjabpolice.gov.pk/node/3549','https://www.punjabpolice.gov.pk/node/3549',
   null,null,2),
  ('City Sadiqabad Police Station','تھانہ سٹی صادق آباد','police',
   'Police station contact listed in the official Punjab Police directory.','پولیس اسٹیشن کا رابطہ، سرکاری پنجاب پولیس ڈائریکٹری کے مطابق۔',
   '068-5020026',null,null,
   'Sadiqabad, Rahim Yar Khan District, Punjab, Pakistan','صادق آباد، ضلع رحیم یار خان، پنجاب، پاکستان',
   'https://www.punjabpolice.gov.pk/node/3549','https://www.punjabpolice.gov.pk/node/3549',
   null,null,3),
  ('Saddar Sadiqabad Police Station','تھانہ صدر صادق آباد','police',
   'Police station contact listed in the official Punjab Police directory.','پولیس اسٹیشن کا رابطہ، سرکاری پنجاب پولیس ڈائریکٹری کے مطابق۔',
   '068-5020027',null,null,
   'Sadiqabad, Rahim Yar Khan District, Punjab, Pakistan','صادق آباد، ضلع رحیم یار خان، پنجاب، پاکستان',
   'https://www.punjabpolice.gov.pk/node/3549','https://www.punjabpolice.gov.pk/node/3549',
   null,null,4),
  ('Tehsil Council Sadiqabad','تحصیل کونسل صادق آباد','revenue',
   'Local government body listed by the Punjab Local Government and Community Development Department. A direct public phone number is not listed in the cited directory.',
   'محکمہ بلدیات پنجاب کی سرکاری ڈائریکٹری میں درج مقامی حکومت کا ادارہ۔ حوالہ شدہ ڈائریکٹری میں براہ راست عوامی فون نمبر درج نہیں۔',
   null,null,null,
   'Sadiqabad Tehsil, Rahim Yar Khan District, Punjab, Pakistan','تحصیل صادق آباد، ضلع رحیم یار خان، پنجاب، پاکستان',
   null,'https://lgcd.punjab.gov.pk/district-rahim-yar-khan',
   null,null,5)
) as v(name_en,name_ur,authority_type,description_en,description_ur,phone,phone_secondary,email,address_en,address_ur,website_url,source_url,office_hours_en,office_hours_ur,sort_order)
where c.slug = 'sadiqabad'
on conflict (city_id,name_en) do nothing;
