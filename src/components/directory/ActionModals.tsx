import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Contact,
  Copy,
  Download,
  Facebook,
  MessageCircle,
  MessageSquare,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { BusinessPublicView } from '../../types/directory';
import type { SubmissionType } from '../../types/database';
import {
  submitPublicInquiry,
  submitPublicReview,
  submitPublicSuggestion,
  trackBusinessEvent,
} from '../../lib/api';
import { bilingualText, buildBusinessVCard } from '../../lib/format';
import { useI18n } from '../../lib/i18n';
import { normalizePkPhone } from '../../lib/phone';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { Modal } from '../ui/Modal';
import { StarRating } from '../ui/DataDisplay';
import { useToast } from '../ui/Toast';

const INQUIRY_CHIPS = [
  { en: 'What are your timings today?', ur: 'آج آپ کے کھلنے اور بند ہونے کے اوقات کیا ہیں؟' },
  { en: 'Is home delivery available?', ur: 'کیا ہوم ڈیلیوری دستیاب ہے؟' },
  { en: 'Please share latest price & stock.', ur: 'براہ کرم تازہ ترین قیمت اور دستیابی بتائیں۔' },
  { en: 'Want to book an appointment.', ur: 'ملاقات / اپائنٹمنٹ کا وقت طے کرنا ہے۔' },
];

const STAR_LABELS: Record<number, { en: string; ur: string }> = {
  1: { en: 'Poor', ur: 'ناقص' },
  2: { en: 'Fair', ur: 'مناسب' },
  3: { en: 'Good', ur: 'اچھا' },
  4: { en: 'Very Good', ur: 'بہت اچھا' },
  5: { en: 'Excellent', ur: 'شاندار' },
};

export function SendInquiryModal({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessPublicView;
}) {
  const { showToast } = useToast();
  const { lang } = useI18n();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanName = name.trim();
    const normPhone = normalizePkPhone(phone);
    const cleanMsg = message.trim();

    if (cleanName.length < 2 || cleanName.length > 80) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم اپنا درست نام درج کریں (کم از کم 2 حروف)۔'
          : 'Please enter your name (2 to 80 characters).',
        'error'
      );
      return;
    }
    if (!normPhone || normPhone.length < 10) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم درست پاکستانی موبائل یا فون نمبر درج کریں۔'
          : 'Please enter a valid Pakistani phone number.',
        'error'
      );
      return;
    }
    if (cleanMsg.length < 5 || cleanMsg.length > 1000) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم کم از کم 5 حروف پر مشتمل پیغام لکھیں۔'
          : 'Please enter a message (5 to 1,000 characters).',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPublicInquiry({
        business_id: business.id,
        name: cleanName,
        phone: phone.trim(),
        message: cleanMsg,
        website_hp: hp,
      });
      if (!res.ok) {
        showToast(
          res.error ?? (lang === 'ur' ? 'پیغام بھیجنے میں خرابی آئی۔' : 'Failed to send inquiry.'),
          'error'
        );
        return;
      }
      showToast(
        lang === 'ur'
          ? 'آپ کا پیغام کاروبار کے ان باکس میں محفوظ کر لیا گیا ہے۔'
          : 'Inquiry sent to the business inbox!',
        'success'
      );
      setName('');
      setPhone('');
      setMessage('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const bizTitle = bilingualText(lang, business.name_en, business.name_ur);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ur' ? `${bizTitle} کو پیغام بھیجیں` : `Send Inquiry to ${bizTitle}`}
      titleUr={lang === 'en' ? 'کاروبار کو براہ راست پیغام بھیجیں' : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={lang === 'ur' ? 'آپ کا نام' : 'Your Name'}
          labelUr={lang === 'en' ? 'آپ کا نام' : undefined}
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={lang === 'ur' ? 'مثلاً محمد عثمان' : 'e.g. Muhammad Usman'}
        />
        <Input
          label={lang === 'ur' ? 'موبائل نمبر' : 'Mobile Phone'}
          labelUr={lang === 'en' ? 'موبائل نمبر' : undefined}
          required
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0300-1234567"
        />
        <div className="space-y-2">
          <span className="text-[11px] font-semibold text-on-surface-variant block">
            {lang === 'ur' ? 'تیز پیغام ٹیمپلیٹس (اختیاری):' : 'Quick message templates (optional):'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {INQUIRY_CHIPS.map((chip) => {
              const chipText = lang === 'ur' ? chip.ur : chip.en;
              return (
                <button
                  key={chip.en}
                  type="button"
                  onClick={() =>
                    setMessage((prev) => {
                      if (prev.includes(chipText)) return prev;
                      return prev.trim() ? `${prev.trim()} ${chipText}` : chipText;
                    })
                  }
                  className="px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-primary-fixed text-xs font-medium text-on-surface transition-colors cursor-pointer"
                >
                  + {chipText}
                </button>
              );
            })}
          </div>
        </div>
        <Textarea
          label={lang === 'ur' ? 'آپ کا پیغام / ضرورت' : 'Your Message / Requirement'}
          labelUr={lang === 'en' ? 'آپ کا پیغام' : undefined}
          required
          rows={4}
          maxLength={1000}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            lang === 'ur'
              ? 'قیمت، سٹاک کی دستیابی، وقت یا ہوم ڈیلیوری کے بارے میں پوچھیں...'
              : 'Ask about price, stock availability, appointment time, or home delivery...'
          }
        />
        {/* Honeypot anti-spam */}
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            {lang === 'ur' ? 'منسوخ' : 'Cancel'}
          </Button>
          <Button type="submit" loading={submitting}>
            {lang === 'ur' ? 'پیغام بھیجیں' : 'Send Inquiry'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function WriteReviewModal({
  open,
  onClose,
  business,
  onSubmitted,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessPublicView;
  onSubmitted?: () => void;
}) {
  const { showToast } = useToast();
  const { lang } = useI18n();
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanAuthor = author.trim();
    const cleanComment = comment.trim();

    if (cleanAuthor.length < 2 || cleanAuthor.length > 80) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم اپنا نام درج کریں (کم از کم 2 حروف)۔'
          : 'Please enter your name (2 to 80 characters).',
        'error'
      );
      return;
    }
    if (cleanComment.length < 6 || cleanComment.length > 1000) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم کم از کم 6 حروف پر مشتمل تبصرہ لکھیں۔'
          : 'Please enter a review comment (at least 6 characters).',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPublicReview({
        business_id: business.id,
        author_name: cleanAuthor,
        rating,
        comment: cleanComment,
        website_hp: hp,
      });
      if (!res.ok) {
        showToast(
          res.error ?? (lang === 'ur' ? 'رائے جمع نہیں ہو سکی۔' : 'Could not submit review.'),
          'error'
        );
        return;
      }
      showToast(
        lang === 'ur'
          ? 'شکریہ! آپ کا تبصرہ ماڈریشن کے لیے جمع ہو گیا ہے۔'
          : 'Thank you! Your review has been submitted for moderation.',
        'success'
      );
      setAuthor('');
      setComment('');
      setRating(5);
      onSubmitted?.();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const starInfo = STAR_LABELS[rating] ?? STAR_LABELS[3];
  const bizTitle = bilingualText(lang, business.name_en, business.name_ur);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ur' ? `${bizTitle} پر رائے دیں` : `Review ${bizTitle}`}
      titleUr={lang === 'en' ? 'اپنا تجربہ اور رائے درج کریں' : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface">
              {lang === 'ur' ? 'آپ کی درجہ بندی *' : 'Your Rating *'}
            </span>
            <span className="text-xs font-bold text-primary">
              {lang === 'ur' ? starInfo.ur : starInfo.en}
            </span>
          </div>
          <StarRating rating={rating} interactive onChange={setRating} size="md" />
        </div>
        <Input
          label={lang === 'ur' ? 'آپ کا نام' : 'Your Name'}
          labelUr={lang === 'en' ? 'آپ کا نام' : undefined}
          required
          maxLength={80}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={lang === 'ur' ? 'مثلاً طارق عباس' : 'e.g. Tariq Abbas'}
        />
        <Textarea
          label={lang === 'ur' ? 'تبصرہ' : 'Review Comment'}
          labelUr={lang === 'en' ? 'تبصرہ' : undefined}
          required
          rows={4}
          maxLength={1000}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={
            lang === 'ur'
              ? 'سروس کے معیار، قیمتوں یا عملے کے رویے کے بارے میں لکھیں...'
              : 'Share service quality, prices, or staff behavior...'
          }
        />
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          className="hidden"
          aria-hidden="true"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            {lang === 'ur' ? 'منسوخ' : 'Cancel'}
          </Button>
          <Button type="submit" loading={submitting}>
            {lang === 'ur' ? 'تبصرہ جمع کروائیں' : 'Submit Review'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function SuggestCorrectionModal({
  open,
  onClose,
  business,
  initialReason = 'Phone number changed',
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessPublicView;
  initialReason?: string;
}) {
  const { showToast } = useToast();
  const { lang } = useI18n();
  const [reason, setReason] = useState(initialReason);
  const [newPhone, setNewPhone] = useState('');
  const [details, setDetails] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setReason(initialReason);
    }
  }, [open, initialReason]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanDetails = details.trim();
    const cleanNewPhone = newPhone.trim();

    if (cleanDetails.length < 6 && !cleanNewPhone) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم کم از کم 6 حروف کی تفصیل یا نیا فون نمبر درج کریں۔'
          : 'Please describe the correction (at least 6 characters) or enter a corrected phone number.',
        'error'
      );
      return;
    }

    if (cleanNewPhone && normalizePkPhone(cleanNewPhone).length < 10) {
      showToast(
        lang === 'ur'
          ? 'نیا درج کردہ پاکستانی فون نمبر درست نہیں ہے۔'
          : 'Please enter a valid Pakistani phone number.',
        'error'
      );
      return;
    }

    if (contactPhone.trim() && normalizePkPhone(contactPhone).length < 10) {
      showToast(
        lang === 'ur'
          ? 'آپ کا رابطہ نمبر درست پاکستانی نمبر نہیں ہے۔'
          : 'Your phone number does not appear to be a valid Pakistani number.',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      let subType: SubmissionType = 'correction';
      if (reason === 'Broken image / photo') subType = 'broken_image';
      else if (reason === 'Phone number changed') subType = 'phone_suggestion';
      else if (reason === 'Business permanently closed' || reason === 'Duplicate or spam listing') {
        subType = 'report';
      }

      const res = await submitPublicSuggestion({
        type: subType,
        business_id: business.id,
        payload: {
          reason,
          phone_primary: cleanNewPhone || undefined,
          details: cleanDetails,
        },
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        website_hp: hp,
      });
      if (!res.ok) {
        showToast(
          res.error ?? (lang === 'ur' ? 'رپورٹ جمع نہیں ہو سکی۔' : 'Submission failed.'),
          'error'
        );
        return;
      }
      showToast(
        lang === 'ur'
          ? 'تصحیح کی درخواست موصول ہو گئی ہے اور ماڈریشن قطار میں شامل کر دی گئی ہے۔'
          : 'Correction submitted! Our moderation team will review it.',
        'success'
      );
      setNewPhone('');
      setDetails('');
      setContactName('');
      setContactPhone('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ur' ? 'تصحیح یا غلطی کی اطلاع دیں' : 'Suggest Edit or Report Issue'}
      titleUr={lang === 'en' ? 'تصحیح یا غلطی کی اطلاع دیں' : undefined}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label={lang === 'ur' ? 'مسئلے کی قسم' : 'Issue Type'}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        >
          <option value="Phone number changed">
            {lang === 'ur' ? 'فون نمبر تبدیل ہو گیا ہے' : 'Phone number changed'}
          </option>
          <option value="Address / location wrong">
            {lang === 'ur' ? 'پتہ یا لوکیشن غلط ہے' : 'Address / location wrong'}
          </option>
          <option value="Opening hours wrong">
            {lang === 'ur' ? 'اوقات کار غلط ہیں' : 'Opening hours wrong'}
          </option>
          <option value="Business permanently closed">
            {lang === 'ur' ? 'کاروبار مستقل بند ہو چکا ہے' : 'Business permanently closed'}
          </option>
          <option value="Duplicate or spam listing">
            {lang === 'ur' ? 'ڈپلیکیٹ یا غلط اندراج' : 'Duplicate or spam listing'}
          </option>
          <option value="Broken image / photo">
            {lang === 'ur' ? 'تصویر خراب ہے یا کھل نہیں رہی' : 'Broken image / photo'}
          </option>
        </Select>
        <Input
          label={lang === 'ur' ? 'درست فون نمبر (اگر دستیاب ہو)' : 'Correct Phone Number (if applicable)'}
          dir="ltr"
          value={newPhone}
          onChange={(e) => setNewPhone(e.target.value)}
          placeholder="0300-XXXXXXX"
        />
        <Textarea
          label={lang === 'ur' ? 'تفصیلات' : 'Details'}
          required
          rows={3}
          maxLength={600}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={
            lang === 'ur'
              ? 'ماڈریٹرز کے لیے درست معلومات درج کریں...'
              : 'Provide accurate details for our moderators...'
          }
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label={lang === 'ur' ? 'آپ کا نام (اختیاری)' : 'Your Name (optional)'}
            maxLength={80}
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <Input
            label={lang === 'ur' ? 'آپ کا فون نمبر (اختیاری)' : 'Your Phone (optional)'}
            dir="ltr"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
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
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" type="button" onClick={onClose}>
            {lang === 'ur' ? 'منسوخ' : 'Cancel'}
          </Button>
          <Button type="submit" loading={submitting}>
            {lang === 'ur' ? 'تصحیح بھیجیں' : 'Submit Correction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function ClaimBusinessModal({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessPublicView;
}) {
  const { showToast } = useToast();
  const { lang } = useI18n();
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [proofNote, setProofNote] = useState('');
  const [hp, setHp] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    const cleanOwner = ownerName.trim();
    const normPhone = normalizePkPhone(ownerPhone);

    if (cleanOwner.length < 2 || cleanOwner.length > 80) {
      showToast(
        lang === 'ur'
          ? 'مالک یا مینیجر کا درست نام درج کریں (کم از کم 2 حروف)۔'
          : 'Please enter the owner or manager name (2 to 80 characters).',
        'error'
      );
      return;
    }
    if (!normPhone || normPhone.length < 10) {
      showToast(
        lang === 'ur'
          ? 'براہ کرم درست پاکستانی موبائل یا فون نمبر درج کریں۔'
          : 'Please enter a valid Pakistani phone number.',
        'error'
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitPublicSuggestion({
        type: 'claim',
        business_id: business.id,
        payload: {
          owner_name: cleanOwner,
          proof_note: proofNote.trim() || undefined,
        },
        contact_name: cleanOwner,
        contact_phone: ownerPhone.trim(),
        website_hp: hp,
      });
      if (!res.ok) {
        showToast(
          res.error ?? (lang === 'ur' ? 'ملکیت کا دعویٰ جمع نہیں ہو سکا۔' : 'Could not submit claim.'),
          'error'
        );
        return;
      }
      showToast(
        lang === 'ur'
          ? 'ملکیت کی درخواست ایڈمن کے جائزے کے لیے جمع کر دی گئی ہے۔'
          : 'Claim request submitted for admin moderation review.',
        'success'
      );
      setOwnerName('');
      setOwnerPhone('');
      setProofNote('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const bizTitle = bilingualText(lang, business.name_en, business.name_ur);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ur' ? `${bizTitle} کی ملکیت کا دعویٰ کریں` : `Claim ${bizTitle}`}
      titleUr={lang === 'en' ? 'اس کاروبار کی ملکیت کا دعویٰ کریں' : undefined}
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-primary-fixed/40 text-on-primary-fixed text-xs flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <span>
            {lang === 'ur'
              ? 'ملکیت کے تمام دعوے ایڈمن ٹیم کے جائزے کے لیے قطار میں شامل کیے جاتے ہیں اور خودکار طور پر منظور نہیں ہوتے۔'
              : 'Ownership claims are queued for manual admin review and are not automatically approved.'}
          </span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label={lang === 'ur' ? 'مالک / مینیجر کا نام' : 'Owner / Manager Name'}
            required
            maxLength={80}
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder={lang === 'ur' ? 'مثلاً حاجی محمد اسلم' : 'e.g. Haji Muhammad Aslam'}
          />
          <Input
            label={lang === 'ur' ? 'رابطہ فون نمبر' : 'Contact Phone Number'}
            required
            dir="ltr"
            value={ownerPhone}
            onChange={(e) => setOwnerPhone(e.target.value)}
            placeholder="0300-8671234"
          />
          <Textarea
            label={lang === 'ur' ? 'معاون تفصیلات (اختیاری)' : 'Supporting Details (optional)'}
            rows={3}
            maxLength={600}
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            placeholder={
              lang === 'ur'
                ? 'کاروبار سے آپ کے تعلق یا دکان کی شناخت کی تفصیل لکھیں...'
                : 'Explain your connection to this business or provide identifying details...'
            }
          />
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={hp}
            onChange={(e) => setHp(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={onClose}>
              {lang === 'ur' ? 'منسوخ' : 'Cancel'}
            </Button>
            <Button type="submit" loading={submitting}>
              {lang === 'ur' ? 'ملکیت کی درخواست بھیجیں' : 'Submit Claim Request'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

export function QrCodeModal({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessPublicView;
}) {
  const { lang } = useI18n();
  const [dataUrl, setDataUrl] = useState<string>('');
  const url = `${window.location.origin}/business/${business.slug}`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#006948', light: '#ffffff' },
    })
      .then(setDataUrl)
      .catch(() => setDataUrl(''));
  }, [open, url]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 820;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        const fallback = document.createElement('a');
        fallback.href = dataUrl;
        fallback.download = `${business.slug}-qr.png`;
        fallback.click();
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#006948';
      ctx.fillRect(0, 0, canvas.width, 130);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HELLO SADIQABAD', canvas.width / 2, 56);
      ctx.font = '18px sans-serif';
      ctx.fillStyle = '#d1fae5';
      ctx.fillText('Sadiqabad Local Business Directory', canvas.width / 2, 92);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText(business.name_en.slice(0, 34), canvas.width / 2, 190);
      ctx.fillStyle = '#475569';
      ctx.font = '20px sans-serif';
      ctx.fillText(business.area?.name_en || 'Sadiqabad', canvas.width / 2, 226);

      ctx.drawImage(img, 140, 260, 360, 360);

      ctx.fillStyle = '#006948';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(`Call: ${business.phone_primary}`, canvas.width / 2, 675);
      ctx.fillStyle = '#64748b';
      ctx.font = '16px sans-serif';
      ctx.fillText('Scan QR to open profile, timings & WhatsApp', canvas.width / 2, 725);
      ctx.fillText(url.slice(0, 56), canvas.width / 2, 760);

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `${business.slug}-poster-qr.png`;
      a.click();
    };
    img.src = dataUrl;
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ur' ? 'دکان کا کیو آر پوسٹر' : 'Business QR Poster'}
      titleUr={lang === 'en' ? 'دکان کا کیو آر پوسٹر' : undefined}
    >
      <div className="flex flex-col items-center text-center gap-4">
        <div className="w-full max-w-xs rounded-2xl overflow-hidden border border-outline-variant/40 bg-white shadow-sm">
          <div className="bg-primary text-white py-2.5 px-3">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-90">
              {lang === 'ur' ? 'ہیلو صادق آباد ڈائریکٹری' : 'Hello Sadiqabad Directory'}
            </p>
            <h4 className="font-bold text-sm truncate mt-0.5">
              {bilingualText(lang, business.name_en, business.name_ur)}
            </h4>
          </div>
          <div className="p-4 flex flex-col items-center">
            {dataUrl ? (
              <img src={dataUrl} alt={`QR code for ${business.name_en}`} className="w-48 h-48" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-muted">
                {lang === 'ur' ? 'کیو آر کوڈ تیار ہو رہا ہے…' : 'Generating QR…'}
              </div>
            )}
            <p className="text-xs font-bold text-primary mt-2" dir="ltr">
              {business.phone_primary}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5 break-all" dir="ltr">
              {url}
            </p>
          </div>
        </div>
        <Button onClick={handleDownload} leftIcon={<Download className="w-4 h-4" />} fullWidth>
          {lang === 'ur' ? 'کیو آر پوسٹر ڈاؤن لوڈ کریں (PNG)' : 'Download QR Poster PNG'}
        </Button>
      </div>
    </Modal>
  );
}

export function ShareSheet({
  open,
  onClose,
  business,
}: {
  open: boolean;
  onClose: () => void;
  business: BusinessPublicView;
}) {
  const { showToast } = useToast();
  const { lang } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/business/${business.slug}`;
  const shareText = `${business.name_en} (${business.phone_primary}) — Hello Sadiqabad Directory: ${url}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackBusinessEvent(business.id, 'share');
      showToast(lang === 'ur' ? 'لنک کاپی ہو گیا!' : 'Link copied to clipboard!', 'success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast(
        lang === 'ur'
          ? 'کاپی نہیں ہو سکا۔ لنک دستی طور پر منتخب کریں۔'
          : 'Copy failed. Select the URL manually.',
        'error'
      );
    }
  };

  const downloadVCard = () => {
    const vcf = buildBusinessVCard(business, window.location.origin);
    const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${business.slug}.vcf`;
    a.click();
    URL.revokeObjectURL(blobUrl);
    trackBusinessEvent(business.id, 'share');
    showToast(
      lang === 'ur' ? 'کانٹیکٹ کارڈ (.vcf) ڈاؤن لوڈ ہو گیا!' : 'Contact card (.vcf) saved!',
      'success'
    );
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: business.name_en, text: shareText, url });
        trackBusinessEvent(business.id, 'share');
        onClose();
      } catch {
        // user cancelled
      }
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ur' ? 'کاروبار شیئر کریں' : 'Share Business'}
      titleUr={lang === 'en' ? 'کاروبار شیئر کریں' : undefined}
    >
      <div className="space-y-4">
        <div className="p-3 rounded-xl bg-surface-container-low text-xs font-mono break-all text-on-surface-variant" dir="ltr">
          {url}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBusinessEvent(business.id, 'share')}
            className="min-h-[44px] px-4 rounded-xl bg-whatsapp text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{lang === 'ur' ? 'واٹس ایپ' : 'WhatsApp'}</span>
          </a>
          <a
            href={`sms:?body=${encodeURIComponent(shareText)}`}
            onClick={() => trackBusinessEvent(business.id, 'share')}
            className="min-h-[44px] px-4 rounded-xl bg-primary-fixed text-on-primary-fixed font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-95"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{lang === 'ur' ? 'ایس ایم ایس' : 'Direct SMS'}</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackBusinessEvent(business.id, 'share')}
            className="min-h-[44px] px-4 rounded-xl bg-[#1877F2] text-white font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-95"
          >
            <Facebook className="w-4 h-4" />
            <span>{lang === 'ur' ? 'فیس بک' : 'Facebook'}</span>
          </a>
          <button
            type="button"
            onClick={downloadVCard}
            className="min-h-[44px] px-4 rounded-xl bg-secondary-fixed text-on-secondary-fixed font-semibold text-sm flex items-center justify-center gap-2 hover:brightness-95 cursor-pointer"
          >
            <Contact className="w-4 h-4" />
            <span>{lang === 'ur' ? 'کانٹیکٹ محفوظ (.vcf)' : 'Save Contact (.vcf)'}</span>
          </button>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={copyLink}
          leftIcon={copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
        >
          {copied
            ? lang === 'ur'
              ? 'لنک کاپی ہو گیا!'
              : 'Copied!'
            : lang === 'ur'
            ? 'لنک کاپی کریں'
            : 'Copy Link'}
        </Button>

        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <Button variant="primary" fullWidth onClick={nativeShare} leftIcon={<Share2 className="w-4 h-4" />}>
            {lang === 'ur' ? 'ڈیوائس شیئر مینو' : 'Device Share Menu'}
          </Button>
        )}
      </div>
    </Modal>
  );
}
