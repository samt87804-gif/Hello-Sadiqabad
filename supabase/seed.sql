-- Hello Sadiqabad initial seed data. Safe to run more than once.
insert into public.cities(name_en,name_ur,slug,center_lat,center_lng,is_active)
values('Sadiqabad','صادق آباد','sadiqabad',28.3062,70.1308,true)
on conflict(slug) do update set name_en=excluded.name_en,name_ur=excluded.name_ur,center_lat=excluded.center_lat,center_lng=excluded.center_lng,is_active=true;

insert into public.plans(code,name_en,name_ur,limits,features,price_note,sort_order,is_active) values
('free','Free','مفت','{"gallery":0,"max_photos":0,"videos":0,"max_videos":0,"social_links":0,"offers":0,"search_priority":1}','{"whatsapp":false,"cover":false,"gallery":false,"videos":false,"social_links":false,"offers":false,"inquiry":false,"verified_badge":false,"qr":false,"analytics_full":false}','Free forever',1,true),
('basic','Basic','بیسک','{"gallery":5,"max_photos":5,"videos":1,"max_videos":1,"social_links":3,"offers":2,"search_priority":2}','{"whatsapp":true,"cover":true,"gallery":true,"videos":true,"social_links":true,"offers":true,"inquiry":true,"verified_badge":true,"qr":true,"analytics_full":false}','Contact team for pricing',2,true),
('premium','Premium','پریمیم','{"gallery":15,"max_photos":15,"videos":3,"max_videos":3,"social_links":999,"offers":10,"search_priority":3}','{"whatsapp":true,"cover":true,"gallery":true,"videos":true,"social_links":true,"offers":true,"inquiry":true,"verified_badge":true,"qr":true,"analytics_full":true}','Contact team for pricing',3,true)
on conflict(code) do update set name_en=excluded.name_en,name_ur=excluded.name_ur,limits=excluded.limits,features=excluded.features,price_note=excluded.price_note,sort_order=excluded.sort_order,is_active=true;

insert into public.categories(name_en,name_ur,slug,icon,color,sort_order,synonyms,is_active) values
('Hospitals','ہسپتال','hospitals','hospital','red',1,array['hospital','clinic','emergency','ہسپتال','اسپتال'],true),
('Doctors','ڈاکٹرز','doctors','stethoscope','blue',2,array['doctor','doctar','physician','طبیب','ڈاکٹر'],true),
('Pharmacies','فارمیسیز','pharmacies','pill','green',3,array['pharmacy','medical store','dawai','medicine','دوا','میڈیکل'],true),
('Schools','اسکولز','schools','graduation-cap','blue',4,array['school','college','academy','اسکول','تعلیمی ادارہ'],true),
('Restaurants','ریسٹورنٹس','restaurants','utensils','orange',5,array['restaurant','food','hotel','biryani','کھانا','ریسٹورنٹ'],true),
('Groceries','کریانہ اسٹورز','groceries','shopping-basket','green',6,array['grocery','karyana','mart','store','کریانہ'],true),
('Electronics','الیکٹرونکس','electronics','tv','purple',7,array['electronics','electric','الیکٹرونکس'],true),
('Mobile Shops','موبائل شاپس','mobile-shops','smartphone','blue',8,array['mobile','phone shop','موبائل'],true),
('Clothing','کپڑے','clothing','shirt','pink',9,array['clothes','garments','boutique','کپڑے'],true),
('Auto & Workshops','آٹو اور ورکشاپس','auto-workshops','car','slate',10,array['mechanic','workshop','car repair','مکینک'],true),
('Banks & ATMs','بینک اور اے ٹی ایم','banks-atms','landmark','cyan',11,array['bank','atm','بینک'],true),
('Real Estate','رئیل اسٹیٹ','real-estate','house','amber',12,array['property','plot','estate','پراپرٹی'],true),
('Services','سروسز','services','briefcase-business','teal',13,array['service','services','خدمات'],true)
on conflict(slug) do update set name_en=excluded.name_en,name_ur=excluded.name_ur,icon=excluded.icon,color=excluded.color,sort_order=excluded.sort_order,synonyms=excluded.synonyms,is_active=true;

insert into public.emergency_contacts(city_id,name_en,name_ur,phone,category,icon,sort_order,is_active)
select c.id,v.name_en,v.name_ur,v.phone,v.category,v.icon,v.sort_order,true
from public.cities c cross join (values
('Rescue 1122','ریسکیو 1122','1122','rescue','ambulance',1),
('Police','پولیس','15','police','shield',2),
('Fire Brigade','فائر بریگیڈ','16','fire','flame',3),
('Edhi Ambulance','ایدھی ایمبولینس','115','ambulance','ambulance',4)
) as v(name_en,name_ur,phone,category,icon,sort_order)
where c.slug='sadiqabad'
on conflict(name_en,phone) do update set city_id=excluded.city_id,name_ur=excluded.name_ur,category=excluded.category,icon=excluded.icon,sort_order=excluded.sort_order,is_active=true;

insert into public.site_settings(key,value,description,is_public) values
('site_name','"Hello Sadiqabad"','Public site name',true),
('contact_phone','""','Official public phone; set after verification',true),
('contact_whatsapp','""','Official WhatsApp; set after verification',true),
('contact_email','"hellosadiqabadinspire@gmail.com"','Public contact email',true),
('social_links','{}','Public social links',true),
('default_language','"en"','Default interface language',true),
('owner_edits_require_approval','false','Require approval for owner listing edits',false),
('reviews_require_approval','true','Moderate public reviews before publishing',false),
('ads_enabled','true','Enable sponsored placements',true),
('maintenance_mode','false','Maintenance mode',true)
on conflict(key) do nothing;

insert into public.pages(slug,title_en,title_ur,body_md_en,body_md_ur,is_published) values
('about','About Hello Sadiqabad','ہیلو صادق آباد کے بارے میں','Hello Sadiqabad is a local directory for businesses and services in Sadiqabad. Listings are reviewed before publication.','ہیلو صادق آباد، صادق آباد کے کاروباروں اور خدمات کی مقامی ڈائریکٹری ہے۔ لسٹنگ شائع کرنے سے پہلے اس کا جائزہ لیا جاتا ہے۔',true),
('advertise','Advertise','اشتہار دیں','Contact our team to discuss sponsored listings and advertising options.','اسپانسرڈ لسٹنگ اور اشتہارات کے لیے ہماری ٹیم سے رابطہ کریں۔',true),
('contact','Contact','رابطہ','Email: hellosadiqabadinspire@gmail.com.','ای میل: hellosadiqabadinspire@gmail.com',true),
('terms','Terms of Use','استعمال کی شرائط','Use this directory for general information. Business information should be verified directly with the business.','اس ڈائریکٹری کو عمومی معلومات کے لیے استعمال کریں۔ کاروبار کی معلومات کی تصدیق براہِ راست متعلقہ کاروبار سے کریں۔',true),
('privacy','Privacy Policy','رازداری کی پالیسی','The directory stores only the information required to provide its services. Analytics use random session identifiers and do not store visitor IP addresses.','ڈائریکٹری صرف خدمات فراہم کرنے کے لیے ضروری معلومات محفوظ کرتی ہے۔ تجزیاتی ڈیٹا میں بے ترتیب سیشن شناخت استعمال ہوتی ہے، وزیٹر کا IP ایڈریس محفوظ نہیں کیا جاتا۔',true),
('listing-terms','Listing Terms','لسٹنگ کی شرائط','Listings must be accurate, lawful and relevant to Sadiqabad. The team may reject or remove inaccurate listings.','لسٹنگ درست، قانونی اور صادق آباد سے متعلق ہونی چاہیے۔ انتظامیہ غلط معلومات والی لسٹنگ مسترد یا حذف کر سکتی ہے۔',true),
('refund-policy','Refund Policy','ریفنڈ پالیسی','Plans are informational at launch. No online payments are processed through this website.','ابتدائی مرحلے میں پلانز صرف معلوماتی ہیں۔ اس ویب سائٹ کے ذریعے آن لائن ادائیگی وصول نہیں کی جاتی۔',true),
('faq','Frequently Asked Questions','اکثر پوچھے گئے سوالات','For listing corrections, ownership claims or other help, use the submission form or contact our team.','لسٹنگ کی درستگی، ملکیت کے دعوے یا دیگر مدد کے لیے فارم استعمال کریں یا ہماری ٹیم سے رابطہ کریں۔',true)
on conflict(slug) do update set title_en=excluded.title_en,title_ur=excluded.title_ur,body_md_en=excluded.body_md_en,body_md_ur=excluded.body_md_ur,is_published=true;

-- Promote only the existing, confirmed admin account; no new Auth user is created here.
insert into public.profiles(id,role,full_name,must_change_password,is_active)
select id,'super_admin','Hello Sadiqabad Administrator',false,true
from auth.users where lower(email)=lower('hellosadiqabadinspire@gmail.com')
on conflict(id) do update set role='super_admin',full_name='Hello Sadiqabad Administrator',must_change_password=false,is_active=true,updated_at=now();

-- Areas are intentionally not seeded until the admin confirms the official localities.
-- No demo/TEST businesses are inserted into production.
