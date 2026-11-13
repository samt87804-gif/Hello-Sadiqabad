import React, { useEffect, useState } from 'react';
import { CheckCircle2, PlusCircle, Sparkles } from 'lucide-react';
import { fetchAllAreas, fetchAllCategories, submitPublicSuggestion } from '../lib/api';
import { useI18n } from '../lib/i18n';
import { bilingualText } from '../lib/format';
import { normalizePkPhone } from '../lib/phone';
import { updatePageSeo } from '../lib/seo';
import type { AreaRow, CategoryRow } from '../types/database';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Input, Select, Textarea } from '../components/ui/FormFields';
import { Card, Container, SectionHeading } from '../components/ui/Surface';
import { useToast } from '../components/ui/Toast';

const QUICK_FACILITIES = [
  { en: 'Home Delivery', ur: 'ہوم ڈیلیوری' },
  { en: '24/7 Service', ur: '24/7 سروس' },
  { en: 'AC Hall', ur: 'اے سی ہال' },
  { en: 'Car Parking', ur: 'کار پارکنگ' },
  { en: 'Card Accepted', ur: 'کارڈ قبول ہے' },
];

export function AddBusiness() {
  const { showToast } = useToast();
  const { lang } = useI18n();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [areaId, setAreaId] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [addressEn, setAddressEn] = useState('');
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [hp, setHp] = useState('');

  useEffect(() => {
    updatePageSeo({
      title: 'Add Your Business Free — Hello Sadiqabad',
      description: 'Submit your shop, clinic, or local service to the Sadiqabad local business directory for free.',
      canonicalPath: '/add-business',
    });
    Promise.all([fetchAllCategories(), fetchAllAreas()]).then(([cats, ar]) => {
      setCategories(cats);
      setAreas(ar);
      if (cats[0]) setCategoryId(cats[0].id);
      if (ar[0]) setAreaId(ar[0].id);
    });
  }, []);

  useEffect(() => {
    if (sameAsPhone) {
      setWhatsapp(phone);
    }
  }, [sameAsPhone, phone]);

  const toggleFacility = (fac: string) => {
    setSelectedFacilities((prev) =>
      prev.includes(fac) ? prev.filter((item) => item !== fac) : [...prev, fac]
    );
  };

  const resetForm = () => {
    setNameEn('');
    setNameUr('');
    setPhone('');
    setWhatsapp('');
    setSameAsPhone(false);
    setAddressEn('');
    setSelectedFacilities([]);
    setDescription('');
    setContactName('');
    setContactPhone('');
    setHp('');
    if (categories[0]) setCategoryId(categories[0].id);
    if (areas[0]) setAreaId(areas[0].id);
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

    setSubmitting(true);
    try {
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
          services_en: selectedFacilities.length > 0 ? selectedFacilities : undefined,
          description_en: description.trim() || undefined,
        },
        contact_name: contactName.trim() || cleanName,
        contact_phone: contactPhone.trim() || phone.trim(),
        website_hp: hp,
      });
      if (!res.ok) {
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <Container size="md" className="py-6 space-y-6">
        <SectionHeading
          title={lang === 'ur' ? 'اپنا کاروبار ہیلو صادق آباد میں شامل کریں' : 'Add Your Business to Hello Sadiqabad'}
          titleUr={lang === 'en' ? 'اپنا کاروبار مفت میں شامل کریں' : undefined}
          subtitle={
            lang === 'ur'
              ? 'تحصیل صادق آباد کی دکانوں، ڈاکٹرز، ورکشاپس اور سروسز کے لیے مفت بنیادی لسٹنگ۔'
              : 'Free basic directory listing for shops, doctors, workshops, and services in Tehsil Sadiqabad.'
          }
        />

        <div className="p-4 rounded-2xl bg-primary-fixed/40 border border-primary/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs text-on-surface space-y-1">
            <p className="font-bold">
              {lang === 'ur' ? 'مقامی کاروباروں کے لیے ہمیشہ مفت' : 'Always Free for Local Businesses'}
            </p>
            <p className="text-on-surface-variant">
              {lang === 'ur'
                ? 'ہر دکان کو مستقل پروفائل، ون ٹیپ کال بٹن اور نقشہ پن ملتا ہے۔ واٹس ایپ چیٹ، گیلری اور آفرز کے لیے منظوری کے بعد بیسک یا پریمیم پلان طلب کریں۔'
                : 'Every shop gets a permanent profile, phone tap-to-call button, and map pin. Need WhatsApp chat, gallery photos & special offer banners? Request a Basic or Premium Plan after listing approval.'}
            </p>
          </div>
        </div>

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
              {lang === 'ur'
                ? 'ایڈمن جائزے اور منظوری کے بعد آپ کا کاروبار ڈائریکٹری میں شائع کر دیا جائے گا۔'
                : 'Your listing request has been queued for admin review. Approved listings are published to the directory.'}
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
                <Select
                  label={lang === 'ur' ? 'شعبہ / کیٹیگری' : 'Category'}
                  required
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {bilingualText(lang, c.name_en, c.name_ur)}
                    </option>
                  ))}
                </Select>
                <Select
                  label={lang === 'ur' ? 'علاقہ / بازار' : 'Area / Neighborhood'}
                  value={areaId}
                  onChange={(e) => setAreaId(e.target.value)}
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {bilingualText(lang, a.name_en, a.name_ur)}
                    </option>
                  ))}
                </Select>
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

              <Input
                label={lang === 'ur' ? 'دکان کا پتہ اور قریبی مشہور جگہ' : 'Shop Address & Nearest Landmark'}
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

              <div className="space-y-2">
                <span className="text-xs font-semibold text-on-surface block">
                  {lang === 'ur' ? 'دستیاب سہولیات (اختیاری)' : 'Available Facilities (optional)'}
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
                {lang === 'ur' ? 'مفت لسٹنگ جمع کروائیں' : 'Submit Free Listing'}
              </Button>
            </form>
          </Card>
        )}
      </Container>
    </AppShell>
  );
}
