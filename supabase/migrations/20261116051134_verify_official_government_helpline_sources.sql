-- Keep the older district landline record for audit/history, but do not show it publicly until an official current source confirms it.
update public.emergency_contacts
set is_active=false, source_url=null, verified_at=null,
    description_en='Inactive: this older district landline could not be re-confirmed on the current official directory.',
    description_ur='غیر فعال: یہ پرانا ضلعی لینڈ لائن نمبر موجودہ سرکاری ڈائریکٹری سے دوبارہ تصدیق نہیں ہو سکا۔'
where phone='068-9230389' and category='government';

update public.emergency_contacts
set source_url='https://rykhan.punjab.gov.pk/contact_us', verified_at=now()
where phone='0800-33444' and category='government';

update public.emergency_contacts
set source_url='https://www.punjabpolice.gov.pk/contact_details', verified_at=now()
where phone='1787' and category='government';

insert into public.emergency_contacts
  (city_id,name_en,name_ur,phone,category,icon,sort_order,is_active,description_en,description_ur,source_url,verified_at)
select c.id,'Patrolling Police Helpline','گشت پولیس ہیلپ لائن','1124','government','shield-check',7,true,
       'Patrolling Police contact listed by the District Government Rahim Yar Khan.',
       'ضلعی حکومت رحیم یار خان کی سرکاری رابطہ فہرست میں درج گشت پولیس نمبر۔',
       'https://rykhan.punjab.gov.pk/contact_us',now()
from public.cities c
where c.slug='sadiqabad'
on conflict (name_en,phone) do nothing;

update public.emergency_contacts
set is_active=true, source_url='https://rykhan.punjab.gov.pk/contact_us', verified_at=now()
where phone='1124' and category='government';
