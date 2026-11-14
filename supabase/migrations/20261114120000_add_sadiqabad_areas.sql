-- Add Sadiqabad neighborhoods and commercial localities discovered in the supplied Google Places exports.
-- Existing areas are preserved; slug uniqueness makes this migration safe to re-run.
insert into public.areas (city_id, name_en, name_ur, slug)
select city.id, area.name_en, area.name_ur, area.slug
from public.cities as city
cross join (values
  (city.id, 'Al Falah Town', 'الفلاح ٹاؤن', 'al-falah-town'),
  (city.id, 'Ajmal Town', 'اجمل ٹاؤن', 'ajmal-town'),
  (city.id, 'Satellite Town', 'سیٹلائٹ ٹاؤن', 'satellite-town'),
  (city.id, 'Shadman City', 'شادمان سٹی', 'shadman-city'),
  (city.id, 'Shoaib Colony', 'شعیب کالونی', 'shoaib-colony'),
  (city.id, 'Dhaka Colony Kachi Abadi', 'ڈھاکہ کالونی کچی آبادی', 'dhaka-colony-kachi-abadi'),
  (city.id, 'Mazhar Farid Colony', 'مظہر فرید کالونی', 'mazhar-farid-colony'),
  (city.id, 'Arif Town', 'عارف ٹاؤن', 'arif-town'),
  (city.id, 'Arain Colony', 'آرائیں کالونی', 'arain-colony'),
  (city.id, 'Rao Town', 'راؤ ٹاؤن', 'rao-town'),
  (city.id, 'Mujahid Colony', 'مجاہد کالونی', 'mujahid-colony'),
  (city.id, 'Faiz Colony', 'فیض کالونی', 'faiz-colony'),
  (city.id, 'Azizabad', 'عزیز آباد', 'azizabad'),
  (city.id, 'Ghafoorabad', 'غفور آباد', 'ghafoorabad'),
  (city.id, 'Chandrami', 'چندرامی', 'chandrami'),
  (city.id, 'Khalid Bazar', 'خالد بازار', 'khalid-bazar'),
  (city.id, 'Qazfi Bazar', 'قذافی بازار', 'qazfi-bazar'),
  (city.id, 'Faisal Bazar', 'فیصل بازار', 'faisal-bazar'),
  (city.id, 'Sarafa Bazar', 'صرافہ بازار', 'sarafa-bazar'),
  (city.id, 'Kothi Mohalla', 'کوٹھی محلہ', 'kothi-mohalla'),
  (city.id, 'Ghalla Mandi', 'غلہ منڈی', 'ghalla-mandi'),
  (city.id, 'Fazal Market', 'فضل مارکیٹ', 'fazal-market'),
  (city.id, 'Adalat Chowk', 'عدالت چوک', 'adalat-chowk'),
  (city.id, 'Melad Chowk', 'میلاد چوک', 'melad-chowk'),
  (city.id, 'Sajawal Pol', 'سجاول پول', 'sajawal-pol'),
  (city.id, 'Punjab Cinema Road', 'پنجاب سینما روڈ', 'punjab-cinema-road'),
  (city.id, 'Hospital Road', 'ہسپتال روڈ', 'hospital-road'),
  (city.id, 'Manthar Road', 'منتھر روڈ', 'manthar-road'),
  (city.id, 'Allama Iqbal Road', 'علامہ اقبال روڈ', 'allama-iqbal-road'),
  (city.id, 'Haq Town', 'حق ٹاؤن', 'haq-town'),
  (city.id, 'Ilyas Colony', 'الیاس کالونی', 'ilyas-colony'),
  (city.id, 'Mian Ghulam Rasool Colony', 'میاں غلام رسول کالونی', 'mian-ghulam-rasool-colony'),
  (city.id, 'Laghari Colony', 'لغاری کالونی', 'laghari-colony'),
  (city.id, 'Green View', 'گرین ویو', 'green-view')
) as area(name_en, name_ur, slug)
where city.slug = 'sadiqabad'
on conflict (city_id, slug) do nothing;
