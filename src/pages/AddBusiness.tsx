import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, PlusCircle, Sparkles } from 'lucide-react';
import { fetchAllAreas, fetchAllCategories, submitPublicSuggestion } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText, isSafeGoogleMapsUrl } from '../lib/format';
import { normalizePkPhone } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import { useAuth } from '../lib/auth';
import { getSupabaseClient } from '../lib/supabase';
import type { AreaRow, CategoryRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { Card, Container, SectionHeading } from '../components/ui/Surface';
import { useToast } from '../components/ui/Toast';

const DAY_KEYS = [
  { key: 'mon', en: 'Monday', ur: 'پیر' }, { key: 'tue', en: 'Tuesday', ur: 'منگل' },
  { key: 'wed', en: 'Wednesday', ur: 'بدھ' }, { key: 'thu', en: 'Thursday', ur: 'جمعرات' },
  { key: 'fri', en: 'Friday', ur: 'جمعہ' }, { key: 'sat', en: 'Saturday', ur: 'ہفتہ' },
  { key: 'sun', en: 'Sunday', ur: 'اتوار' },
] as const;

const QUICK_FACILITIES = [
  { en: 'Home Delivery', ur: 'ہوم ڈیلیوری' },
  { en: '24/7 Service', ur: '24/7 سروس' },
  { en: 'AC Hall', ur: 'اے سی ہال' },
  { en: 'Car Parking', ur: 'کار پارکنگ' },
  { en: 'Card Accepted', ur: 'کارڈ قبول ہے' },
];

export function AddBusiness() {
  const uploadSessionId = useRef(crypto.randomUUID());
  const { showToast } = useToast();
  const { lang } = useI18n();
  const { role } = useAuth();
  const isOwner = role === 'owner';
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadataError, setMetadataError] = useState(false);
  const [metadataRetryKey, setMetadataRetryKey] = useState(0);

  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [addressEn, setAddressEn] = useState('');
  const [addressUr, setAddressUr] = useState('');
  const [landmarkEn, setLandmarkEn] = useState('');
  const [landmarkUr, setLandmarkUr] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string }>>(
    Object.fromEntries(DAY_KEYS.map((day) => [day.key, { open: '', close: '' }]))
  );
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [hp, setHp] = useState('');

  useEffect(() => {
    let active = true;
    updatePageSeo({
      title: 'Submit Your Business — Hello Sadiqabad',
      description: 'Submit your shop, clinic, or local service for review in the Sadiqabad local business directory.',
      canonicalPath: '/add-business',
    });
    setMetadataError(false);
    Promise.all([fetchAllCategories(), fetchAllAreas()]).then(([cats, ar]) => {
      if (!active) return;
      setCategories(cats);
      setAreas(ar);
      if (cats.length === 0 || ar.length === 0) setMetadataError(true);
    }).catch(() => {
      if (active) setMetadataError(true);
    });
    return () => { active = false; };
  }, [metadataRetryKey]);

  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [sameAsPhone, phone]);

  const toggleFacility = (fac: string) => {
    if (selectedFacilities.includes(fac)) {
      setSelectedFacilities((prev) => prev.filter((item) => item !== fac));
      return;
    }
    if (selectedFacilities.length >= 2) {
      showToast(lang === 'ur' ? 'زیادہ سے زیادہ 2 سہولیات منتخب کر سکتے ہیں۔' : 'You can select up to 2 facilities.', 'error');
      return;
    }
    setSelectedFacilities((prev) => prev.includes(fac) ? prev : [...prev, fac]);
  };

  const resetForm = () => {
    setNameEn('');
    setNameUr('');
    setPhone('');
    setWhatsapp('');
    setSameAsPhone(false);
    setAddressEn('');
    setAddressUr('');
    setLandmarkEn('');
    setLandmarkUr('');
    setMapUrl('');
    setOwnerName('');
    setOwnerEmail('');
    setLogoFile(null);
    setCoverFile(null);
    setOpeningHours(Object.fromEntries(DAY_KEYS.map((day) => [day.key, { open: '', close: '' }])));
    setCategoryId('');
    setAreaId('');
    setSelectedFacilities([]);
    setDescription('');
    setContactName('');
    setContactPhone('');
    setHp('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = nameEn.trim();
    if (cleanName.length < 2 || cleanName.length > 120) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم کاروبار کا درست نام درج کریں (کم از کم 2 اور زیادہ سے زیادہ 120 حروف)۔'
          : 'Please enter a valid business name (2 to 120 characters).',
        'error'
      );
      return;
    }

    const normPhone = normalizePkPhone(phone);
    if (!normPhone || normPhone.length < 10) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم درست پاکستانی فون نمبر درج کریں (مثلاً 0300-1234567 یا 068-5701234)۔'
          : 'Please enter a valid Pakistani phone number (e.g. 0300-1234567 or 068-5701234).',
        'error'
      );
      return;
    }

    const rawWhatsapp = (sameAsPhone ? phone : whatsapp).trim();
    if (rawWhatsapp && normalizePkPhone(rawWhatsapp).length < 10) {
      showToast(
        lang === 'ur'
          ? 'واٹس ایپ نمبر درست پاکستانی نمبر ہونا ضروری ہے۔'
          : 'Please enter a valid Pakistani WhatsApp number or leave it blank.',
        'error'
      );
      return;
    }

    const cleanAddress = addressEn.trim();
    if (cleanAddress.length < 4 || cleanAddress.length > 250) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم دکان کا مکمل پتہ درج کریں (کم از کم 4 حروف)۔'
          : 'Please enter a shop address and landmark (4 to 250 characters).',
        'error'
      );
      return;
    }

    if (ownerName.trim().length < 2 || ownerName.trim().length > 100) {
      showToast(lang === 'ur' ? 'مالک کا درست نام درج کریں۔' : 'Please enter the business owner name.', 'error');
      return;
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(ownerEmail.trim())) {
      showToast(lang === 'ur' ? 'براہ کرم Gmail ایڈریس درج کریں۔' : 'Please enter a valid Gmail address.', 'error');
      return;
    }
    if (mapUrl.trim() && !isSafeGoogleMapsUrl(mapUrl.trim())) {
      showToast(lang === 'ur' ? 'گوگل میپس کا درست HTTPS لنک درج کریں۔' : 'Enter a valid Google Maps URL from Google.', 'error');
      return;
    }
    for (const day of DAY_KEYS) {
      const hours = openingHours[day.key];
      if (Boolean(hours.open) !== Boolean(hours.close)) {
        showToast(lang === 'ur' ? 'ہر دن کے کھلنے اور بند ہونے کے دونوں اوقات درج کریں یا دونوں خالی چھوڑیں۔' : 'For each day, enter both opening and closing times or leave both blank.', 'error');
        return;
      }
    }
    if (description.trim().length > 500) {
      showToast(
        lang === 'ur'
          ? 'تعارف 500 حروف سے زیادہ نہیں ہو سکتا۔'
          : 'Description must be 500 characters or fewer.',
        'error'
      );
      return;
    }

    if (contactPhone.trim() && normalizePkPhone(contactPhone).length < 10) {
      showToast(
        lang === 'ur'
          ? 'رابطہ کنندہ کا فون نمبر درست نہیں ہے۔'
          : 'Please enter a valid Pakistani contact phone number.',
        'error'
      );
      return;
    }

    if (!categoryId || !areaId) {
      showToast(lang === 'ur' ? 'شعبہ اور علاقہ لوڈ نہیں ہو سکے۔ دوبارہ کوشش کریں۔' : 'Categories and areas are unavailable. Please retry loading the form.', 'error');
      return;
    }

    setSubmitting(true);
    const uploadedMediaPaths: string[] = [];
    try {
      const client = getSupabaseClient();
      const mediaAssets: Array<{ media_field: string; storage_path: string; mime_type: string; file_size_bytes: number }> = [];
      for (const [mediaField, file] of [['logo', logoFile], ['cover', coverFile]] as const) {
        if (!file) continue;
        if (!client) throw new Error('Connect to the live service before uploading business images.');
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
          throw new Error('Business images must be JPG, PNG or WebP and no larger than 5 MB.');
        }
        const { data: authorization, error: authorizationError } = await client.functions.invoke('create-business-media-upload', {
          body: {
            media_field: mediaField,
            mime_type: file.type,
            file_size_bytes: file.size,
            session_id: uploadSessionId.current,
          },
        });
        if (authorizationError || !authorization?.ok ||
            typeof authorization.data?.path !== 'string' || typeof authorization.data?.token !== 'string') {
          throw new Error(authorization?.error || authorizationError?.message || 'A secure image upload could not be prepared.');
        }
        const storagePath = authorization.data.path;
        uploadedMediaPaths.push(storagePath);
        const { error: uploadError } = await client.storage.from('hs-pending-business-media')
          .uploadToSignedUrl(storagePath, authorization.data.token, file, { contentType: file.type, upsert: false });
        if (uploadError) throw uploadError;
        mediaAssets.push({ media_field: mediaField, storage_path: storagePath, mime_type: file.type, file_size_bytes: file.size });
      }
      const hoursPayload = Object.fromEntries(DAY_KEYS.filter((day) => openingHours[day.key].open && openingHours[day.key].close).map((day) => [day.key, [{ open: openingHours[day.key].open, close: openingHours[day.key].close }]]));
      const res = await submitPublicSuggestion({
        type: 'new_business',
        payload: {
          name_en: cleanName,
          name_ur: nameUr.trim() || undefined,
          category_id: categoryId,
          area_id: areaId,
          phone_primary: phone.trim(),
          whatsapp: rawWhatsapp || undefined,
          address_en: cleanAddress,
          address_ur: addressUr.trim() || undefined,
          landmark_en: landmarkEn.trim() || undefined,
          landmark_ur: landmarkUr.trim() || undefined,
          map_url: mapUrl.trim() || undefined,
          opening_hours: Object.keys(hoursPayload).length ? hoursPayload : undefined,
          owner_name: ownerName.trim(),
          owner_email: ownerEmail.trim().toLowerCase(),
          media_assets: mediaAssets,
          services_en: selectedFacilities.length > 0 ? selectedFacilities : undefined,
          description_en: description.trim() || undefined,
        },
        contact_name: contactName.trim() || cleanName,
        contact_phone: contactPhone.trim() || phone.trim(),
        website_hp: hp,
        session_id: uploadSessionId.current,
      });
      if (!res.ok) {
        if (uploadedMediaPaths.length && client) {
          await client.functions.invoke('cleanup-business-media-upload', {
            body: { session_id: uploadSessionId.current, storage_paths: uploadedMediaPaths },
          });
        }
        showToast(
          res.error ?? (lang === 'ur' ? 'درخواست جمع نہیں ہو سکی۔' : 'Failed to submit business.'),
          'error'
        );
        return;
      }
      resetForm();
      setSubmitted(true);
      showToast(
        lang === 'ur'
          ? 'کاروبار کی درخواست جائزے کے لیے جمع کر دی گئی ہے۔'
          : 'Business submitted for moderation review!',
        'success'
      );
    } catch {
      const cleanupClient = getSupabaseClient();
      if (uploadedMediaPaths.length && cleanupClient) {
        await cleanupClient.functions.invoke('cleanup-business-media-upload', {
          body: { session_id: uploadSessionId.current, storage_paths: uploadedMediaPaths },
        }).catch(() => undefined);
      }
      showToast(
        lang === 'ur' ? 'درخواست جمع نہیں ہو سکی۔ انٹرنیٹ چیک کر کے دوبارہ کوشش کریں۔' : 'The request could not be sent. Check your connection and try again.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Container size="md" className="py-6 space-y-6">
        <SectionHeading
          title={lang === 'ur' ? 'اپنا کاروبار ہیلو صادق آباد میں شامل کریں' : 'Add Your Business to Hello Sadiqabad'}
          titleUr={lang === 'en' ? 'اپنا کاروبار شامل کرنے کی درخواست دیں' : undefined}
          subtitle={
            lang === 'ur'
              ? 'تحصیل صادق آباد کی دکانوں، ڈاکٹرز، ورکشاپس اور سروسز کی لسٹنگ کے لیے درخواست جمع کروائیں۔'
              : 'Submit a listing request for shops, doctors, workshops, and services in Tehsil Sadiqabad.'
          }
        />

        <div className="p-4 rounded-2xl bg-primary-fixed/40 border border-primary/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface space-y-1">
            <p className="font-bold">
              {isOwner
                ? (lang === 'ur' ? 'اپنے اکاؤنٹ میں دوسرا کاروبار شامل کریں' : 'Add Another Business to Your Owner Account')
                : (lang === 'ur' ? 'لسٹنگ کی درخواست اور پلان کا جائزہ' : 'Listing Request & Plan Review')}
            </p>
            <p className="text-on-surface-variant">
              {isOwner
                ? (lang === 'ur'
                  ? 'یہ نئی لسٹنگ ایڈمن کی منظوری کے بعد خودکار طور پر آپ کے اسی اونر پورٹل میں شامل ہو جائے گی۔ منظوری سے پہلے یہ عوامی ڈائریکٹری میں نظر نہیں آئے گی۔'
                  : 'Submit a separate listing for each business. Once Admin approves it, the new business is automatically linked to this same Owner Portal. It will not appear publicly before approval.')
                : (lang === 'ur'
                  ? 'ہر دکان کو مستقل پروفائل، ون ٹیپ کال بٹن اور نقشہ پن ملتا ہے۔ واٹس ایپ چیٹ، گیلری اور آفرز کے لیے منظوری کے بعد بیسک یا پریمیم پلان طلب کریں۔'
                  : 'Every shop gets a permanent profile, phone tap-to-call button, and map pin. Need WhatsApp chat, gallery photos & special offer banners? Request a Basic or Premium Plan after listing approval.')}
            </p>
          </div>
        </div>

        {metadataError && (
          <div role="alert" className="p-3 rounded-xl border border-error/30 bg-error/5 text-sm text-on-surface flex flex-wrap items-center justify-between gap-3">
            <span>{lang === 'ur' ? 'شعبہ جات یا علاقوں کی فہرست لوڈ نہیں ہو سکی۔' : 'Categories or areas could not be loaded.'}</span>
            <Button size="sm" variant="outline" onClick={() => setMetadataRetryKey((value) => value + 1)}>
              {lang === 'ur' ? 'دوبارہ کوشش' : 'Retry'}
            </Button>
          </div>
        )}

        {submitted ? (
          <Card className="p-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-tertiary mx-auto" />
            <h2 className="text-xl font-bold text-on-surface">
              {lang === 'ur' ? 'درخواست موصول ہو گئی!' : 'Submission Received!'}
            </h2>
            <p className="font-urdu text-base text-primary" dir="rtl">
              آپ کی درخواست ماڈریشن کے لیے موصول ہو گئی ہے۔
            </p>
            <p className="text-sm text-on-surface-variant max-w-md mx-auto">
              {isOwner
                ? (lang === 'ur'
                  ? 'ایڈمن کی منظوری کے بعد یہ کاروبار آپ کے موجودہ اونر اکاؤنٹ کے ساتھ منسلک ہو کر پورٹل میں دکھائی دے گا۔'
                  : 'After Admin approval, this business will be linked to your existing owner account and appear in your Owner Portal.')
                : (lang === 'ur'
                  ? 'ایڈمن جائزے اور منظوری کے بعد آپ کا کاروبار ڈائریکٹری میں شائع کر دیا جائے گا۔'
                  : 'Your listing request has been queued for admin review. Approved listings are published to the directory.')}
            </p>
            <div className="pt-2">
              <Button onClick={() => setSubmitted(false)} variant="outline">
                {lang === 'ur' ? 'مزید کاروبار شامل کریں' : 'Submit Another Business'}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={lang === 'ur' ? 'کاروبار / کلینک کا نام (انگریزی)' : 'Business / Clinic Name (English)'}
                  required
                  maxLength={120}
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g. Al-Madina Medical Store"
                />
                <Input
                  label={lang === 'ur' ? 'کاروبار کا نام (اردو — اختیاری)' : 'Business Name (Urdu — optional)'}
                  labelUr={lang === 'en' ? 'اردو نام' : undefined}
                  dir="rtl"
                  maxLength={120}
                  className="font-urdu"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  placeholder="المدینہ میڈیکل سٹور"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Input
                    id="business-category-search"
                    label={lang === 'ur' ? 'شعبہ تلاش کریں' : 'Find a category'}
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    placeholder={lang === 'ur' ? 'شعبے کا نام لکھیں' : 'Type a category name'}
                    autoComplete="off"
                  />
                  <Select
                    label={lang === 'ur' ? 'شعبہ / کیٹیگری' : 'Category'}
                    required
                    value={categoryId}
                    onChange={(e) => { setCategoryId(e.target.value); setCategorySearch(''); }}
                  >
                    <option value="">{lang === 'ur' ? 'شعبہ منتخب کریں' : 'Select a category'}</option>
                    {categories.filter((item) => {
                      const query = categorySearch.trim().toLocaleLowerCase();
                      return item.id === categoryId || !query ||
                        [item.name_en, item.name_ur, item.slug].filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
                    }).map((item) => (
                      <option key={item.id} value={item.id}>
                        {bilingualText(lang, item.name_en, item.name_ur)}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Input
                    id="business-area-search"
                    label={lang === 'ur' ? 'علاقہ تلاش کریں' : 'Find an area'}
                    value={areaSearch}
                    onChange={(e) => setAreaSearch(e.target.value)}
                    placeholder={lang === 'ur' ? 'علاقے کا نام لکھیں' : 'Type an area name'}
                    autoComplete="off"
                  />
                  <Select
                    label={lang === 'ur' ? 'علاقہ / بازار' : 'Area / Neighborhood'}
                    required
                    value={areaId}
                    onChange={(e) => { setAreaId(e.target.value); setAreaSearch(''); }}
                  >
                    <option value="">{lang === 'ur' ? 'علاقہ منتخب کریں' : 'Select an area'}</option>
                    {areas.filter((item) => {
                      const query = areaSearch.trim().toLocaleLowerCase();
                      return item.id === areaId || !query ||
                        [item.name_en, item.name_ur, item.slug].filter(Boolean).join(' ').toLocaleLowerCase().includes(query);
                    }).map((item) => (
                      <option key={item.id} value={item.id}>
                        {bilingualText(lang, item.name_en, item.name_ur)}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <Input
                  label={lang === 'ur' ? 'بنیادی فون نمبر' : 'Primary Phone Number'}
                  labelUr={lang === 'en' ? 'فون نمبر' : undefined}
                  required
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                />
                <div className="space-y-1.5">
                  <Input
                    label={lang === 'ur' ? 'واٹس ایپ نمبر (اختیاری)' : 'WhatsApp Number (optional)'}
                    dir="ltr"
                    value={sameAsPhone ? phone : whatsapp}
                    disabled={sameAsPhone}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="0300-1234567"
                  />
                  <label className="inline-flex items-center gap-2 text-xs text-on-surface-variant cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => setSameAsPhone(e.target.checked)}
                      className="w-3.5 h-3.5 accent-primary"
                    />
                    <span>{lang === 'ur' ? 'پرائمری فون نمبر جیسا ہی' : 'Same as primary phone number'}</span>
                  </label>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant" role="note">
                {lang === 'ur'
                  ? 'اگر آپ کا مطلوبہ شعبہ یا علاقہ فہرست میں موجود نہیں تو کوئی غلط متبادل منتخب نہ کریں۔ ایڈمن کو واٹس ایپ پر درخواست دیں؛ اندراج شامل ہونے کے بعد واپس آ کر فارم جمع کروائیں۔'
                  : 'If your required category or area is not listed, do not choose an incorrect substitute. WhatsApp Admin to request it; return and submit after it has been added.'}
                {' '}<a className="font-bold underline" href="https://wa.me/923283212342" target="_blank" rel="noreferrer">WhatsApp Admin</a>
              </p>
              <Input
                label={lang === 'ur' ? 'دکان کا پتہ (انگریزی)' : 'Business Address (English)'}
                required
                maxLength={250}
                value={addressEn}
                onChange={(e) => setAddressEn(e.target.value)}
                placeholder={
                  lang === 'ur'
                    ? 'دکان نمبر، بازار / روڈ، نزد مشہور جگہ، صادق آباد'
                    : 'Shop #, Market / Road, Opposite Bank/Mosque, Sadiqabad'
                }
              />
              <Input label={lang === 'ur' ? 'پتہ (اردو — اختیاری)' : 'Address (Urdu — optional)'} dir="rtl" className="font-urdu" maxLength={250} value={addressUr} onChange={(e) => setAddressUr(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={lang === 'ur' ? 'قریبی مشہور جگہ (انگریزی)' : 'Nearby Landmark (English)'} maxLength={160} value={landmarkEn} onChange={(e) => setLandmarkEn(e.target.value)} />
                <Input label={lang === 'ur' ? 'قریبی مشہور جگہ (اردو)' : 'Nearby Landmark (Urdu)'} dir="rtl" className="font-urdu" maxLength={160} value={landmarkUr} onChange={(e) => setLandmarkUr(e.target.value)} />
              </div>
              <Input label={lang === 'ur' ? 'گوگل میپس لنک (اختیاری)' : 'Google Maps Location URL (optional)'} dir="ltr" maxLength={500} value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="https://maps.google.com/..." />

              <div className="space-y-2">
                <span className="text-xs font-semibold text-on-surface block">
                  {lang === 'ur' ? 'دستیاب سہولیات (زیادہ سے زیادہ 2، اختیاری)' : 'Available Facilities (optional, up to 2)'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {QUICK_FACILITIES.map((fac) => {
                    const active = selectedFacilities.includes(fac.en);
                    return (
                      <button
                        key={fac.en}
                        type="button"
                        onClick={() => toggleFacility(fac.en)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                          active
                            ? 'bg-primary text-on-primary border-primary'
                            : 'bg-surface-container-low text-on-surface border-outline-variant/40'
                        }`}
                      >
                        {active ? '✓ ' : ''}
                        {lang === 'ur' ? fac.ur : fac.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 rounded-xl border border-outline-variant/40 p-3">
                <p className="text-xs font-bold text-on-surface">{lang === 'ur' ? 'روزانہ اوقاتِ کار (اختیاری)' : 'Daily Opening Hours (optional)'}</p>
                <div className="space-y-2">
                  {DAY_KEYS.map((day) => (
                    <div key={day.key} className="grid grid-cols-[minmax(90px,1fr)_1fr_1fr] gap-2 items-center">
                      <span className="text-xs text-on-surface-variant">{lang === 'ur' ? day.ur : day.en}</span>
                      <Input type="time" aria-label={`${day.en} opening time`} value={openingHours[day.key].open} onChange={(e) => setOpeningHours((prev) => ({ ...prev, [day.key]: { ...prev[day.key], open: e.target.value } }))} />
                      <Input type="time" aria-label={`${day.en} closing time`} value={openingHours[day.key].close} onChange={(e) => setOpeningHours((prev) => ({ ...prev, [day.key]: { ...prev[day.key], close: e.target.value } }))} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <Textarea
                  label={lang === 'ur' ? 'خدمات اور مختصر تعارف' : 'Services & Short Description'}
                  rows={3}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={
                    lang === 'ur'
                      ? 'دستیاب مصنوعات، خدمات یا ہوم ڈیلیوری کی تفصیل لکھیں...'
                      : 'Mention specialties, products, or home delivery...'
                  }
                />
                <p className="text-[11px] text-outline text-end tabular-nums">
                  {description.length}/500 {lang === 'ur' ? 'حروف' : 'characters'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={lang === 'ur' ? 'آپ کا نام (مالک / جمع کنندہ)' : 'Contact Name (Submitter / Owner)'}
                  maxLength={100}
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Haji Muhammad Aslam"
                />
                <Input
                  label={lang === 'ur' ? 'آپ کا رابطہ نمبر (اختیاری)' : 'Contact Phone (optional)'}
                  dir="ltr"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="0300-1234567"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={lang === 'ur' ? 'کاروبار کے مالک کا نام' : 'Business Owner Name'} required maxLength={100} value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
                <Input label={lang === 'ur' ? 'مالک کا Gmail' : 'Owner Gmail Address'} type="email" required maxLength={254} dir="ltr" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} placeholder="name@gmail.com" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="space-y-1 text-xs font-semibold text-on-surface">{lang === 'ur' ? 'کاروباری لوگو / پروفائل تصویر (اختیاری)' : 'Business Logo / Profile Image (optional)'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} className="block w-full text-xs mt-1" /></label>
                <label className="space-y-1 text-xs font-semibold text-on-surface">{lang === 'ur' ? 'کاروباری کور / بینر تصویر (اختیاری)' : 'Business Cover / Banner Image (optional)'}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)} className="block w-full text-xs mt-1" /></label>
              </div>

              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={hp}
                onChange={(e) => setHp(e.target.value)}
                className="hidden"
                aria-hidden="true"
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={submitting}
                leftIcon={<PlusCircle className="w-5 h-5" />}
              >
                {lang === 'ur' ? 'لسٹنگ کی درخواست جمع کروائیں' : 'Submit Listing Request'}
              </Button>
            </form>
          </Card>
        )}
      </Container>
    </AppShell>
  );
}
