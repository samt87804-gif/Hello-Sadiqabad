import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Cloud,
  Crown,
  Eye,
  Info,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Save,
  Send,
  Share2,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import type {
  AreaRow,
  BusinessRow,
  CategoryRow,
  OpeningHoursJson,
  PlanRow,
} from '../../types/database';
import type { BusinessPublicView } from '../../types/directory';
import { effectivePlanCode } from '../../lib/searchFilter';
import { getSupabaseClient } from '../../lib/supabase';
import { compressBusinessImage } from '../../lib/businessMedia';
import { isValidHttpsUrl, normalizePkPhone } from '../../lib/phone';
import { validateOpeningHoursRanges } from '../../lib/hours';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { ImageWithFallback } from '../ui/ImageWithFallback';
import { useToast } from '../ui/Toast';
import { HoursEditor } from './HoursEditor';
import { LocationPicker } from './LocationPicker';
import { UrlListEditor } from './UrlListEditor';
import {
  QUICK_AMENITIES,
  STEPS,
  parseStepParam,
  type WizardStep,
} from '../../lib/listingWizard';

interface OwnerImageChangeRequest {
  id: string;
  media_field: 'logo' | 'cover' | 'gallery';
  status: string;
  requested_at: string;
}

function pakistanMonthKey(value: string | Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date(value));
  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  return `${year}-${month}`;
}

function buildInitialForm(business: BusinessPublicView): Partial<BusinessRow> {
  return {
    name_en: business.name_en,
    name_ur: business.name_ur ?? '',
    category_id: business.category_id,
    area_id: business.area_id ?? '',
    description_en: business.description_en ?? '',
    description_ur: business.description_ur ?? '',
    established_year: business.established_year ?? undefined,
    phone_primary: business.phone_primary,
    phone_secondary: business.phone_secondary ?? '',
    whatsapp: business.whatsapp ?? '',
    email: business.email ?? '',
    website_url: business.website_url ?? '',
    address_en: business.address_en ?? '',
    address_ur: business.address_ur ?? '',
    landmark_en: business.landmark_en ?? '',
    landmark_ur: business.landmark_ur ?? '',
    lat: business.lat,
    lng: business.lng,
    opening_hours: business.opening_hours ?? {},
    is_open_24h: business.is_open_24h,
    home_delivery: business.home_delivery,
    logo_url: business.logo_url ?? '',
    cover_url: business.cover_url ?? '',
    gallery_urls: business.gallery_urls ?? [],
    video_urls: business.video_urls ?? [],
    facebook_url: business.facebook_url ?? '',
    instagram_url: business.instagram_url ?? '',
    youtube_url: business.youtube_url ?? '',
    tiktok_url: business.tiktok_url ?? '',
    services_en: business.services_en ?? [],
    services_ur: business.services_ur ?? [],
    tags: business.tags ?? [],
  };
}

export function ListingEditor({
  business,
  categories,
  areas,
  plans,
  onSave,
}: {
  business: BusinessPublicView;
  categories: CategoryRow[];
  areas: AreaRow[];
  plans: PlanRow[];
  onSave: (patch: Partial<BusinessRow>) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [step, setStep] = useState<WizardStep>(() => parseStepParam(searchParams.get('step')));
  const [saving, setSaving] = useState(false);
  const [imageRequests, setImageRequests] = useState<OwnerImageChangeRequest[]>([]);
  const [loadingImageRequests, setLoadingImageRequests] = useState(false);
  const [imageChangeBusy, setImageChangeBusy] = useState<'logo' | 'cover' | 'gallery' | ''>('');
  const [logoChangeFile, setLogoChangeFile] = useState<File | null>(null);
  const [coverChangeFile, setCoverChangeFile] = useState<File | null>(null);
  const [galleryChangeFile, setGalleryChangeFile] = useState<File | null>(null);
  const [galleryRequests, setGalleryRequests] = useState<Array<{id:string;media_field:string;status:string;created_at:string}>>([]);

  const [form, setForm] = useState<Partial<BusinessRow>>(() => buildInitialForm(business));
  const [samePhone, setSamePhone] = useState(() => {
    const p1 = normalizePkPhone(business.phone_primary);
    const wa = business.whatsapp ? normalizePkPhone(business.whatsapp) : '';
    return Boolean(wa && p1 && wa === p1);
  });
  const [servicesList, setServicesList] = useState<string[]>(() => business.services_en ?? []);
  const [servicesUrText, setServicesUrText] = useState((business.services_ur ?? []).join('، '));
  const [tagsList, setTagsList] = useState<string[]>(() => business.tags ?? []);
  const [tagDraft, setTagDraft] = useState('');

  useEffect(() => {
    setForm(buildInitialForm(business));
    setServicesList(business.services_en ?? []);
    setServicesUrText((business.services_ur ?? []).join('، '));
    setTagsList(business.tags ?? []);
    const p1 = normalizePkPhone(business.phone_primary);
    const wa = business.whatsapp ? normalizePkPhone(business.whatsapp) : '';
    setSamePhone(Boolean(wa && p1 && wa === p1));
  }, [business.id]);

  useEffect(() => {
    const paramStep = searchParams.get('step');
    if (paramStep) {
      setStep(parseStepParam(paramStep));
    }
  }, [searchParams]);

  const reloadImageRequests = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoadingImageRequests(true);
    try {
      const [{ data, error }, { data: galleryData, error: galleryError }] = await Promise.all([client.from('business_image_change_requests')
        .select('id,media_field,status,requested_at')
        .eq('business_id', business.id)
        .order('requested_at', { ascending: false })
        .limit(12), client.from('business_media_assets').select('id,media_field,status,created_at').eq('business_id', business.id).eq('media_field', 'gallery').order('created_at', { ascending: false }).limit(20)]);
      if (error) throw error;
      if (galleryError) throw galleryError;
      setImageRequests((data ?? []) as OwnerImageChangeRequest[]);
      setGalleryRequests((galleryData ?? []) as Array<{id:string;media_field:string;status:string;created_at:string}>);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Image-change requests could not be loaded.', 'error');
    } finally {
      setLoadingImageRequests(false);
    }
  }, [business.id, showToast]);

  useEffect(() => { void reloadImageRequests(); }, [reloadImageRequests]);

  const goStep = (next: WizardStep) => {
    setStep(next);
    setSearchParams({ step: next }, { replace: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const effPlanCode = effectivePlanCode(business.plan_code, business.plan_expires_at);
  const activePlan = plans.find((p) => p.code === effPlanCode) ?? plans[0];
  const maxVideos = activePlan?.limits.max_videos ?? 0;
  const maxGallery = activePlan?.limits.gallery ?? 0;
  const maxSocialLinks = activePlan?.limits.social_links ?? 0;
  const canWhatsApp = activePlan?.features.whatsapp ?? false;
  const canSocial = maxSocialLinks > 0;
  const canWebsite = activePlan?.features.website_url ?? effPlanCode !== 'free';

  const update = (patch: Partial<BusinessRow>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handlePrimaryPhoneChange = (val: string) => {
    update({ phone_primary: val });
    if (samePhone && canWhatsApp) {
      update({ whatsapp: val });
    }
  };

  const toggleSamePhone = (checked: boolean) => {
    setSamePhone(checked);
    if (checked && form.phone_primary) {
      update({ whatsapp: form.phone_primary });
    }
  };

  const toggleAmenity = (nameEn: string) => {
    setServicesList((prev) => {
      if (prev.includes(nameEn)) return prev.filter((service) => service !== nameEn);
      if (prev.length >= 2) {
        showToast('A business can have a maximum of 2 services. Remove an existing service first.', 'error');
        return prev;
      }
      return [...prev, nameEn];
    });
  };

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (tagsList.includes(trimmed)) {
      setTagDraft('');
      return;
    }
    if (tagsList.length >= 15) {
      showToast('Maximum 15 search tags allowed.', 'error');
      return;
    }
    setTagsList((prev) => [...prev, trimmed]);
    setTagDraft('');
  };

  const filledSocialCount = [
    form.facebook_url,
    form.instagram_url,
    form.youtube_url,
    form.tiktok_url,
  ].filter(Boolean).length;

  const validateForm = (isSubmittingApproval: boolean): boolean => {
    if (!form.name_en?.trim()) {
      showToast('Business Name (English) is required.', 'error');
      goStep('basic');
      return false;
    }
    if (!form.category_id) {
      showToast('Please select a business category.', 'error');
      goStep('basic');
      return false;
    }
    if (!form.phone_primary?.trim()) {
      showToast('Primary calling phone is required.', 'error');
      goStep('contact');
      return false;
    }
    const norm = normalizePkPhone(form.phone_primary.trim());
    if (!norm) {
      showToast('Primary phone must be a valid Pakistani mobile or landline.', 'error');
      goStep('contact');
      return false;
    }

    if (form.whatsapp && canWhatsApp) {
      const waNorm = normalizePkPhone(form.whatsapp.trim());
      if (!waNorm) {
        showToast('WhatsApp number must be a valid Pakistani mobile number.', 'error');
        goStep('contact');
        return false;
      }
    }

    const originalServicesEn = business.services_en ?? [];
    const originalServicesUr = business.services_ur ?? [];
    const currentServicesUr = servicesUrText.split(/[,،]/).map((item) => item.trim()).filter(Boolean);
    if (servicesList.length > 2 && JSON.stringify(servicesList) !== JSON.stringify(originalServicesEn)) {
      showToast('Please reduce English services to 2 before saving. Existing legacy entries are preserved until you review them.', 'error');
      return false;
    }
    if (currentServicesUr.length > 2 && JSON.stringify(currentServicesUr) !== JSON.stringify(originalServicesUr)) {
      showToast('Please reduce Urdu services to 2 before saving.', 'error');
      return false;
    }

    if (form.opening_hours && !form.is_open_24h) {
      const hoursError = validateOpeningHoursRanges(form.opening_hours as OpeningHoursJson);
      if (hoursError) {
        showToast(`Opening hours error: ${hoursError}`, 'error');
        goStep('hours');
        return false;
      }
    }

    const httpsCheck = [
      { label: 'Website URL', val: form.website_url },
      { label: 'Facebook URL', val: form.facebook_url },
      { label: 'Instagram URL', val: form.instagram_url },
      { label: 'YouTube URL', val: form.youtube_url },
      { label: 'TikTok URL', val: form.tiktok_url },
    ];
    for (const item of httpsCheck) {
      if (item.val && item.val.trim() && !isValidHttpsUrl(item.val.trim())) {
        showToast(`${item.label} must be a valid https:// URL.`, 'error');
        return false;
      }
    }

    if (isSubmittingApproval) {
      if (!form.address_en?.trim()) {
        showToast('Street address is required before submitting for approval.', 'error');
        goStep('location');
        return false;
      }
      if (!form.lat || !form.lng) {
        showToast('Please pin your shop location on the Sadiqabad map before submitting.', 'error');
        goStep('location');
        return false;
      }
    }

    return true;
  };

  const handleSave = async (submitForApproval: boolean) => {
    if (!validateForm(submitForApproval)) return;

    setSaving(true);
    try {
      // RULE: Protected business fields (plan_code, plan_expires_at, is_verified, is_featured, owner_id)
      // are omitted from payload and cannot be modified by the owner.
      const payload: Partial<BusinessRow> = {
        name_en: form.name_en?.trim(),
        name_ur: form.name_ur?.trim() || null,
        category_id: form.category_id,
        area_id: form.area_id || null,
        description_en: form.description_en?.trim() || null,
        description_ur: form.description_ur?.trim() || null,
        established_year: form.established_year ?? null,
        phone_primary: form.phone_primary?.trim() || '',
        phone_secondary: form.phone_secondary?.trim() || null,
        whatsapp: canWhatsApp ? form.whatsapp?.trim() || null : null,
        email: form.email?.trim() || null,
        website_url: canWebsite ? form.website_url?.trim() || null : business.website_url ?? null,
        address_en: form.address_en?.trim() || null,
        address_ur: form.address_ur?.trim() || null,
        landmark_en: form.landmark_en?.trim() || null,
        landmark_ur: form.landmark_ur?.trim() || null,
        lat: form.lat,
        lng: form.lng,
        opening_hours: form.opening_hours ?? {},
        is_open_24h: Boolean(form.is_open_24h),
        home_delivery: Boolean(form.home_delivery),
        video_urls: form.video_urls ?? [],
        facebook_url: form.facebook_url?.trim() || null,
        instagram_url: form.instagram_url?.trim() || null,
        youtube_url: form.youtube_url?.trim() || null,
        tiktok_url: form.tiktok_url?.trim() || null,
        services_en: servicesList,
        services_ur: servicesUrText
          .split(/[,،]/)
          .map((s) => s.trim())
          .filter(Boolean),
        tags: tagsList,
      };

      // RULE: Only change status to pending_approval when intentionally requested from draft or rejected
      if (submitForApproval && (business.status === 'draft' || business.status === 'rejected')) {
        payload.status = 'pending_approval';
      }

      await onSave(payload);
      showToast(
        submitForApproval
          ? 'Listing submitted for admin approval! You will be notified once reviewed.'
          : business.status === 'draft' || business.status === 'rejected'
          ? 'Draft saved successfully.'
          : 'Listing changes saved successfully!',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to save listing.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const requestImageChange = async (mediaField: 'logo' | 'cover' | 'gallery', file: File | null) => {
    if (!file || imageChangeBusy) return;
    if (imageRequests.filter((request) => pakistanMonthKey(request.requested_at) === pakistanMonthKey(new Date())).length >= 2) {
      showToast('Monthly image-change limit reached (2 per business).', 'error');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      showToast('Choose a JPG, PNG or WebP image no larger than 5 MB.', 'error');
      return;
    }
    if (mediaField === 'cover' && !activePlan?.features.cover) {
      showToast('A Basic or Premium plan is required to request a cover image.', 'error');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      showToast('Connect to the live service before requesting an image change.', 'error');
      return;
    }

    setImageChangeBusy(mediaField);
    let storagePath: string | null = null;
    let requestCreated = false;
    try {
      const compressedImage = await compressBusinessImage(file, mediaField);
      const uploadFile = compressedImage.file;
      const { data: authorization, error: authorizationError } = await client.functions.invoke('create-business-media-upload', {
        body: {
          mode: 'owner_change',
          business_id: business.id,
          media_field: mediaField,
          mime_type: uploadFile.type,
          file_size_bytes: uploadFile.size,
        },
      });
      if (authorizationError || !authorization?.ok ||
          typeof authorization.data?.path !== 'string' || typeof authorization.data?.token !== 'string') {
        throw new Error(authorization?.error || authorizationError?.message || 'A secure image upload could not be prepared.');
      }

      const uploadPath = authorization.data.path;
      storagePath = uploadPath;
      const { error: uploadError } = await client.storage.from('hs-pending-business-media')
        .uploadToSignedUrl(uploadPath, authorization.data.token, uploadFile, { contentType: uploadFile.type, upsert: false });
      if (uploadError) throw uploadError;

      const { data: requestId, error: requestError } = await client.rpc('request_business_image_change', {
        p_business_id: business.id,
        p_media_field: mediaField,
        p_storage_path: storagePath,
        p_mime_type: uploadFile.type,
        p_file_size_bytes: uploadFile.size,
      });
      if (requestError || !requestId) throw requestError ?? new Error('The image-change request could not be recorded.');
      requestCreated = true;
      if (mediaField === 'logo') setLogoChangeFile(null);
      else if (mediaField === 'cover') setCoverChangeFile(null);
      else setGalleryChangeFile(null);
      showToast('Image change request sent to Admin. Your current image stays public until approval.', 'success');
      await reloadImageRequests().catch(() => undefined);
    } catch (error) {
      if (storagePath && !requestCreated) {
        await client.functions.invoke('cleanup-business-media-upload', {
          body: { mode: 'owner_change', business_id: business.id, storage_paths: [storagePath] },
        }).catch(() => undefined);
      }
      showToast(error instanceof Error ? error.message : 'The image-change request could not be sent.', 'error');
    } finally {
      setImageChangeBusy('');
    }
  };

  const canSubmitApproval = business.status === 'draft' || business.status === 'rejected';
  const previewCategory = categories.find((c) => c.id === form.category_id)?.name_en ?? '';
  const previewArea = areas.find((a) => a.id === form.area_id)?.name_en ?? 'Sadiqabad';
  const descLen = (form.description_en ?? '').length;
  const activeStepObj = STEPS.find((s) => s.id === step) ?? STEPS[0];
  const progressPct = Math.round((activeStepObj.num / STEPS.length) * 100);

  const customServiceText = useMemo(
    () =>
      servicesList
        .filter((s) => !QUICK_AMENITIES.some((q) => q.en === s))
        .join(', '),
    [servicesList]
  );

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <div className="space-y-5 pb-20">
      {/* Rejected Listing Banner with Feedback & Re-submit Guidance */}
      {business.status === 'rejected' && (
        <Card className="p-4 sm:p-5 bg-danger-container/30 border border-danger/40 text-danger space-y-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-danger">
                Listing Requires Revision Before Approval
              </h2>
              {business.rejection_reason ? (
                <p className="text-xs text-on-surface leading-relaxed">
                  <span className="font-bold text-danger">Admin Feedback: </span>
                  {business.rejection_reason}
                </p>
              ) : (
                <p className="text-xs text-on-surface leading-relaxed">
                  Your listing was reviewed by administration and requires updates. Please check the five steps below, make the necessary corrections, and click <strong>Submit for Approval</strong>.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Top Status & 5-Step Wizard Progress Bar */}
      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-extrabold text-on-surface">
                {form.name_en || business.name_en}
              </h1>
              <Badge
                variant={
                  business.status === 'published'
                    ? 'success'
                    : business.status === 'rejected'
                    ? 'danger'
                    : business.status === 'pending_approval'
                    ? 'neutral'
                    : 'warning'
                }
              >
                {business.status.toUpperCase()}
              </Badge>
              <Badge variant={effPlanCode === 'premium' ? 'gold' : 'primary'}>
                {effPlanCode.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Step {activeStepObj.num} of {STEPS.length} • {activeStepObj.label} (
              <span className="font-urdu">{activeStepObj.ur}</span>)
            </p>
          </div>
          <span className="text-xs font-extrabold text-primary tabular-nums">
            {progressPct}% Complete
          </span>
        </div>

        <div className="h-1.5 rounded-full bg-surface-container-high overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* 5-Step Wizard Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {STEPS.map((s) => {
            const isActive = s.id === step;
            const isDone = s.num < activeStepObj.num;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => goStep(s.id)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-primary text-on-primary shadow-xs'
                    : isDone
                    ? 'bg-primary-fixed/40 text-on-primary-fixed'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
                    {s.num}
                  </span>
                )}
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* STEP 1: BASIC INFO */}
      {step === 'basic' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">Basic Business Profile</h2>
                <p className="font-urdu text-xs text-primary">بنیادی کاروباری معلومات</p>
              </div>
              <Badge variant="warning">Required *</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Business Name (English) *"
                required
                value={form.name_en ?? ''}
                onChange={(e) => update({ name_en: e.target.value })}
                placeholder="e.g. Al-Madina Super Mart"
              />
              <Input
                label="Business Name (Urdu)"
                labelUr="کاروبار کا نام"
                dir="rtl"
                className="font-urdu"
                value={form.name_ur ?? ''}
                onChange={(e) => update({ name_ur: e.target.value })}
                placeholder="مثال: المدینہ سپر مارٹ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Category *"
                value={form.category_id ?? ''}
                onChange={(e) => update({ category_id: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_en}
                  </option>
                ))}
              </Select>
              <Select
                label="Neighborhood / Area"
                value={form.area_id ?? ''}
                onChange={(e) => update({ area_id: e.target.value })}
              >
                <option value="">Select Area</option>
                {areas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name_en}
                  </option>
                ))}
              </Select>
              <Input
                label="Established Year"
                type="number"
                dir="ltr"
                value={form.established_year ?? ''}
                onChange={(e) =>
                  update({ established_year: e.target.value ? Number(e.target.value) : null })
                }
                placeholder="e.g. 2012"
              />
            </div>

            <div className="p-3 rounded-xl bg-surface-container-low text-xs text-on-surface-variant">
              Owner name and profile photo are managed by Admin in the Public Owner Profile privacy settings.
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-on-surface">
                  Short Summary / Description (English)
                </label>
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    descLen > 160 ? 'text-secondary' : 'text-on-surface-variant'
                  }`}
                >
                  {descLen} / 160 recommended (max 1000)
                </span>
              </div>
              <Textarea
                rows={4}
                maxLength={1000}
                value={form.description_en ?? ''}
                onChange={(e) => update({ description_en: e.target.value })}
                placeholder="Describe your products, specialties, and why Sadiqabad customers trust you..."
              />
            </div>

            <Textarea
              label="Detailed Description (Urdu)"
              labelUr="کاروبار کی تفصیل (اردو)"
              dir="rtl"
              className="font-urdu"
              rows={4}
              value={form.description_ur ?? ''}
              onChange={(e) => update({ description_ur: e.target.value })}
              placeholder="اپنی دکان، معیاری اشیاء، اور خدمات کے بارے میں چند جملے لکھیں..."
            />
          </Card>
        </div>
      )}

      {/* STEP 2: CONTACT & SOCIAL */}
      {step === 'contact' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">Contact Information</h2>
                <p className="font-urdu text-xs text-primary">رابطے کی مکمل تفصیلات</p>
              </div>
              <Badge variant="success">1-Tap Dialing</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">
                  Primary Calling Phone *
                </label>
                <div className="relative flex items-center">
                  <span className="absolute start-3 inline-flex items-center gap-1 text-xs font-bold text-primary border-e border-outline-variant pe-2 pointer-events-none">
                    <Phone className="w-3.5 h-3.5" /> +92
                  </span>
                  <input
                    type="tel"
                    dir="ltr"
                    required
                    value={form.phone_primary ?? ''}
                    onChange={(e) => handlePrimaryPhoneChange(e.target.value)}
                    placeholder="0300-8671234"
                    className="w-full h-11 ps-20 pe-3 rounded-xl bg-surface-container-low border border-outline-variant/50 text-sm font-mono text-on-surface focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <Input
                label="Secondary / Landline"
                dir="ltr"
                value={form.phone_secondary ?? ''}
                onChange={(e) => update({ phone_secondary: e.target.value })}
                placeholder="068-5700000"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-surface-container-low space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-semibold text-on-surface">
                <input
                  type="checkbox"
                  checked={samePhone}
                  disabled={!canWhatsApp}
                  onChange={(e) => toggleSamePhone(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                <span>Same as primary calling phone (کالنگ فون اور واٹس ایپ ایک ہی نمبر ہیں)</span>
              </label>

              <div className="space-y-1">
                <div className="relative flex items-center">
                  <span className="absolute start-3 inline-flex items-center gap-1 text-xs font-bold text-[#25D366] border-e border-outline-variant pe-2 pointer-events-none">
                    <MessageCircle className="w-3.5 h-3.5" /> +92
                  </span>
                  <input
                    type="tel"
                    dir="ltr"
                    disabled={!canWhatsApp}
                    readOnly={samePhone && canWhatsApp}
                    value={form.whatsapp ?? ''}
                    onChange={(e) => update({ whatsapp: e.target.value })}
                    placeholder="0300-8671234"
                    className={`w-full h-11 ps-20 pe-3 rounded-xl border border-outline-variant/50 text-sm font-mono focus:outline-none ${
                      samePhone || !canWhatsApp
                        ? 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                        : 'bg-surface-container-lowest text-on-surface focus:border-primary'
                    }`}
                  />
                </div>
                {!canWhatsApp && (
                  <p className="text-xs text-secondary flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> WhatsApp button requires Basic or Premium plan.
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Contact Email"
                type="email"
                dir="ltr"
                value={form.email ?? ''}
                onChange={(e) => update({ email: e.target.value })}
                placeholder="shop@example.com"
              />
              <div className="space-y-1.5">
                <Input label="Website URL (HTTPS)" dir="ltr" disabled={!canWebsite} value={form.website_url ?? ''} onChange={(e) => update({ website_url: e.target.value })} placeholder="https://..." />
                {!canWebsite && <p className="text-xs text-secondary flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> Website URL Basic aur Premium plans mein available hai. Existing saved link ko preserve kiya gaya hai.</p>}
              </div>
            </div>
          </Card>

          {/* Social Profiles */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Social Media Profiles</h2>
                <p className="font-urdu text-xs text-on-surface-variant">سوشل میڈیا لنکس</p>
              </div>
              {canSocial ? (
                <Badge variant={filledSocialCount > maxSocialLinks ? 'danger' : 'primary'}>
                  {filledSocialCount} / {maxSocialLinks} used
                </Badge>
              ) : (
                <Badge variant="warning">Locked on Free</Badge>
              )}
            </div>

            {!canSocial && (
              <div className="p-3 rounded-xl bg-secondary-fixed/50 text-on-secondary-fixed text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Social profile links are unlocked on Basic and Premium plans.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Facebook Page URL"
                dir="ltr"
                disabled={!canSocial}
                value={form.facebook_url ?? ''}
                onChange={(e) => update({ facebook_url: e.target.value })}
                placeholder="https://facebook.com/..."
              />
              <Input
                label="Instagram Profile URL"
                dir="ltr"
                disabled={!canSocial}
                value={form.instagram_url ?? ''}
                onChange={(e) => update({ instagram_url: e.target.value })}
                placeholder="https://instagram.com/..."
              />
              <Input
                label="YouTube Channel URL"
                dir="ltr"
                disabled={!canSocial}
                value={form.youtube_url ?? ''}
                onChange={(e) => update({ youtube_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
              <Input
                label="TikTok Profile URL"
                dir="ltr"
                disabled={!canSocial}
                value={form.tiktok_url ?? ''}
                onChange={(e) => update({ tiktok_url: e.target.value })}
                placeholder="https://tiktok.com/@..."
              />
            </div>
          </Card>
        </div>
      )}

      {/* STEP 3: LOCATION & MAP */}
      {step === 'location' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">Store Address &amp; Sadiqabad Map Pin</h2>
                <p className="font-urdu text-xs text-primary">دکان کا پتہ اور نقشے پر درست مقام</p>
              </div>
              <Badge variant="primary">Leaflet GPS</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Street Address (English) *"
                value={form.address_en ?? ''}
                onChange={(e) => update({ address_en: e.target.value })}
                placeholder="e.g. Shop # 14, Main Rail Bazaar"
              />
              <Input
                label="Street Address (Urdu)"
                dir="rtl"
                className="font-urdu"
                value={form.address_ur ?? ''}
                onChange={(e) => update({ address_ur: e.target.value })}
                placeholder="مثال: دکان نمبر 14، مین ریل بازار"
              />
              <Input
                label="Nearby Landmark (English)"
                value={form.landmark_en ?? ''}
                onChange={(e) => update({ landmark_en: e.target.value })}
                placeholder="e.g. Near Tehsil Headquarters Hospital"
              />
              <Input
                label="Nearby Landmark (Urdu)"
                dir="rtl"
                className="font-urdu"
                value={form.landmark_ur ?? ''}
                onChange={(e) => update({ landmark_ur: e.target.value })}
                placeholder="مثال: نزد تحصیل ہیڈ کوارٹر ہسپتال"
              />
            </div>

            <LocationPicker
              lat={form.lat ?? null}
              lng={form.lng ?? null}
              onChange={({ lat, lng }) => update({ lat, lng })}
            />
          </Card>
        </div>
      )}

      {/* STEP 4: HOURS & AMENITIES */}
      {step === 'hours' && (
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">Business Opening Hours</h2>
                <p className="font-urdu text-xs text-primary">اوقات کار اور جمعہ کا وقفہ</p>
              </div>
              <Badge variant="success">Asia/Karachi Time</Badge>
            </div>

            <HoursEditor
              value={(form.opening_hours as OpeningHoursJson) ?? {}}
              isOpen24h={Boolean(form.is_open_24h)}
              onChange={(opening_hours) => update({ opening_hours })}
              onChange24h={(is_open_24h) => update({ is_open_24h })}
            />
          </Card>

          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/25 pb-3">
              <div>
                <h2 className="text-base font-bold text-on-surface">Services, Amenities &amp; Delivery</h2>
                <p className="text-xs text-on-surface-variant">Maximum 2 services per business. Existing entries above the limit remain unchanged until you remove them.</p>
                <p className="font-urdu text-xs text-on-surface-variant">دستیاب سہولیات اور ہوم ڈلیوری</p>
              </div>
              <Badge variant={servicesList.length > 2 ? 'warning' : 'primary'}>{servicesList.length} / 2 Services</Badge>
            </div>

            <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low text-sm font-bold cursor-pointer border border-outline-variant/30">
              <input
                type="checkbox"
                checked={Boolean(form.home_delivery)}
                onChange={(e) => update({ home_delivery: e.target.checked })}
                className="w-5 h-5 accent-primary cursor-pointer"
              />
              <div>
                <p className="text-on-surface">Home Delivery Service Available in Sadiqabad</p>
                <p className="font-urdu text-xs font-normal text-on-surface-variant">
                  صادق آباد شہر میں ہوم ڈلیوری کی سہولت موجود ہے
                </p>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {QUICK_AMENITIES.map((item) => {
                const checked = servicesList.includes(item.en);
                return (
                  <label
                    key={item.en}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors border ${
                      checked
                        ? 'bg-primary-fixed/25 border-primary/40'
                        : 'bg-surface-container-low border-outline-variant/30'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-on-surface">{item.en}</p>
                      <p className="font-urdu text-[11px] text-on-surface-variant">{item.ur}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleAmenity(item.en)}
                      disabled={!checked && servicesList.length >= 2}
                      className="w-4 h-4 accent-primary cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    />
                  </label>
                );
              })}
            </div>

            <Input
              label="Additional Custom Services (English, comma separated)"
              value={customServiceText}
              onChange={(e) => {
                const quickSelected = servicesList.filter((s) =>
                  QUICK_AMENITIES.some((q) => q.en === s)
                );
                const extras = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
                const nextServices = [...quickSelected, ...extras];
                if (nextServices.length > 2 && nextServices.length >= servicesList.length) {
                  showToast('Maximum 2 services allowed. Remove an existing entry first.', 'error');
                  return;
                }
                setServicesList(nextServices);
              }}
              placeholder="e.g. Meat Section, Frozen Foods, Urgent Stitching"
            />

            <Input
              label="Services & Amenities (Urdu, comma separated)"
              labelUr="سہولیات اور خدمات (اردو)"
              dir="rtl"
              className="font-urdu"
              value={servicesUrText}
              onChange={(e) => {
                const nextValue = e.target.value;
                const nextCount = nextValue.split(/[,،]/).map((item) => item.trim()).filter(Boolean).length;
                const currentCount = servicesUrText.split(/[,،]/).map((item) => item.trim()).filter(Boolean).length;
                if (nextCount > 2 && nextCount >= currentCount) {
                  showToast('Maximum 2 Urdu services allowed. Remove an existing entry first.', 'error');
                  return;
                }
                setServicesUrText(nextValue);
              }}
              placeholder="مثال: تازہ گوشت، فرروزن فوڈز"
            />

            {/* Custom Search Tags Chip Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface">
                Search Tags &amp; Urdu Keywords (press Enter or comma to add)
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/40 min-h-[48px]">
                {tagsList.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-on-primary text-xs font-semibold"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      aria-label={`Remove tag ${tag}`}
                      onClick={() => setTagsList((prev) => prev.filter((t) => t !== tag))}
                      className="hover:opacity-75 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1 flex-1 min-w-[160px]">
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        addTag(tagDraft);
                      }
                    }}
                    placeholder="Type tag & press Enter..."
                    className="flex-1 bg-transparent text-xs text-on-surface outline-none px-1 py-1"
                  />
                  {tagDraft.trim().length >= 2 && (
                    <button
                      type="button"
                      onClick={() => addTag(tagDraft)}
                      className="px-2 py-1 rounded-lg bg-primary/15 text-primary text-[11px] font-bold inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* STEP 5: MEDIA, PREVIEW & SUBMIT */}
      {step === 'preview' && (
        <div className="space-y-5">
          <Card className="p-5 space-y-4">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-on-surface">Store Images &amp; Branding</h2>
              <p className="text-xs text-on-surface-variant">
                Request a logo or cover replacement here. Admin reviews every request; your current public image remains in place until the replacement is approved. You may request up to 2 logo/cover changes per business per Pakistan calendar month.
              </p>
            </div>
            <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 space-y-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <p className="text-xs font-bold text-on-surface">Monthly image-change allowance</p>
                <Badge variant={imageRequests.filter((request) => pakistanMonthKey(request.requested_at) === pakistanMonthKey(new Date())).length >= 2 ? 'danger' : 'success'}>
                  {Math.max(0, 2 - imageRequests.filter((request) => pakistanMonthKey(request.requested_at) === pakistanMonthKey(new Date())).length)} remaining
                </Badge>
              </div>
              <p className="text-[11px] text-on-surface-variant">
                {loadingImageRequests ? 'Checking this month’s requests…' : `${imageRequests.filter((request) => pakistanMonthKey(request.requested_at) === pakistanMonthKey(new Date())).length} of 2 changes used this Pakistan calendar month (logo and cover combined).`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {business.logo_url && (
                <div className="rounded-xl border border-outline-variant/40 p-3 space-y-2">
                  <p className="text-xs font-bold">Current business logo</p>
                  <ImageWithFallback src={business.logo_url} alt={business.name_en + ' logo'} className="w-24 h-24 rounded-xl object-contain bg-surface-container-low" />
                </div>
              )}
              {business.cover_url && (
                <div className="rounded-xl border border-outline-variant/40 p-3 space-y-2">
                  <p className="text-xs font-bold">Current cover image</p>
                  <ImageWithFallback src={business.cover_url} alt={business.name_en + ' cover'} className="w-full h-28 rounded-lg object-cover" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card className="p-3 space-y-2">
                <p className="text-xs font-bold text-on-surface">Request logo replacement</p>
                <Input
                  label="New logo (JPG, PNG or WebP · max 5 MB)"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={imageChangeBusy !== '' || imageRequests.filter((request) => pakistanMonthKey(request.requested_at) === pakistanMonthKey(new Date())).length >= 2}
                  onChange={(event) => { setLogoChangeFile(event.target.files?.[0] ?? null); event.currentTarget.value = ''; }}
                />
                {logoChangeFile && <p className="text-[11px] text-on-surface-variant truncate">{logoChangeFile.name}</p>}
                <Button size="sm" fullWidth disabled={!logoChangeFile || imageChangeBusy !== ''} loading={imageChangeBusy === 'logo'} onClick={() => void requestImageChange('logo', logoChangeFile)}>Send logo for Admin review</Button>
              </Card>
              <Card className="p-3 space-y-2">
                <p className="text-xs font-bold text-on-surface">Request cover replacement</p>
                {activePlan?.features.cover ? (
                  <>
                    <Input
                      label="New cover (JPG, PNG or WebP · max 5 MB)"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={imageChangeBusy !== '' || imageRequests.filter((request) => pakistanMonthKey(request.requested_at) === pakistanMonthKey(new Date())).length >= 2}
                      onChange={(event) => { setCoverChangeFile(event.target.files?.[0] ?? null); event.currentTarget.value = ''; }}
                    />
                    {coverChangeFile && <p className="text-[11px] text-on-surface-variant truncate">{coverChangeFile.name}</p>}
                    <Button size="sm" fullWidth disabled={!coverChangeFile || imageChangeBusy !== ''} loading={imageChangeBusy === 'cover'} onClick={() => void requestImageChange('cover', coverChangeFile)}>Send cover for Admin review</Button>
                  </>
                ) : (
                  <p className="text-xs text-on-surface-variant">Cover images require an active Basic or Premium plan. <Link to="/owner/plan" className="font-bold text-primary underline">View plans</Link></p>
                )}
              </Card>
            </div>
            {imageRequests.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-on-surface">Recent image-change requests</p>
                {imageRequests.slice(0, 5).map((request) => (
                  <div key={request.id} className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant/30 px-3 py-2 text-xs">
                    <span className="capitalize">{request.media_field} · {new Date(request.requested_at).toLocaleDateString()}</span>
                    <Badge variant={request.status === 'approved_published' ? 'success' : request.status === 'rejected' ? 'danger' : 'warning'}>
                      {request.status.replaceAll('_', ' ')}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-outline-variant/40 p-3 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div><p className="text-xs font-bold text-on-surface">Manage photo gallery</p><p className="text-[11px] text-on-surface-variant">New photos stay private until Admin approval.</p></div>
                <Badge variant="neutral">{(business.gallery_urls ?? []).length} / {maxGallery} photos</Badge>
              </div>
              {maxGallery > 0 ? <>
                <Input label="Add gallery photo (JPG, PNG or WebP · max 5 MB)" type="file" accept="image/jpeg,image/png,image/webp" disabled={imageChangeBusy !== '' || (business.gallery_urls ?? []).length + galleryRequests.filter((item) => ['pending_review','approved_pending_promotion'].includes(item.status)).length >= maxGallery} onChange={(event) => { setGalleryChangeFile(event.target.files?.[0] ?? null); event.currentTarget.value = ''; }} />
                {galleryChangeFile && <p className="text-[11px] text-on-surface-variant truncate">{galleryChangeFile.name}</p>}
                <Button size="sm" fullWidth disabled={!galleryChangeFile || imageChangeBusy !== '' || (business.gallery_urls ?? []).length + galleryRequests.filter((item) => ['pending_review','approved_pending_promotion'].includes(item.status)).length >= maxGallery} loading={imageChangeBusy === 'gallery'} onClick={() => void requestImageChange('gallery', galleryChangeFile)}>Send gallery photo for Admin review</Button>
              </> : <p className="text-xs text-on-surface-variant">Photo gallery is not included in your current plan. <Link to="/owner/plan" className="font-bold text-primary underline">View plans</Link></p>}
              {galleryRequests.length > 0 && <div className="space-y-1"><p className="text-xs font-semibold">Gallery upload history</p>{galleryRequests.slice(0,5).map((item) => <div key={item.id} className="flex items-center justify-between text-xs rounded-lg bg-surface-container-low p-2"><span>{new Date(item.created_at).toLocaleDateString()}</span><Badge variant={item.status === 'approved_published' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}>{item.status.replaceAll('_',' ')}</Badge></div>)}</div>}
            </div>
            {(business.gallery_urls ?? []).length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold">Current photo gallery</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(business.gallery_urls ?? []).map((url, index) => (
                    <ImageWithFallback key={url + index} src={url} alt={business.name_en + ' gallery ' + (index + 1)} className="w-full aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              </div>
            )}
            {!business.logo_url && !business.cover_url && !(business.gallery_urls ?? []).length && (
              <p className="text-xs text-on-surface-variant rounded-lg bg-surface-container-low p-3">No business images have been added yet. Please contact Admin for image management.</p>
            )}
            <UrlListEditor
              title="Promotional Video URLs (YouTube / Vimeo)"
              urls={form.video_urls ?? []}
              maxItems={maxVideos}
              kind="video"
              onChange={(video_urls) => update({ video_urls })}
            />
          </Card>

          {/* Submission Readiness Checklist */}
          <Card className="p-5 space-y-3">
            <h2 className="text-base font-bold text-on-surface">Directory Readiness Checklist</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className={`p-3 rounded-xl flex items-center gap-2 ${form.name_en ? 'bg-primary-fixed/25 text-on-surface' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {form.name_en ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Info className="w-4 h-4 text-outline shrink-0" />}
                <span>Business Name: <strong>{form.name_en || 'Missing'}</strong></span>
              </div>
              <div className={`p-3 rounded-xl flex items-center gap-2 ${form.phone_primary ? 'bg-primary-fixed/25 text-on-surface' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {form.phone_primary ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Info className="w-4 h-4 text-outline shrink-0" />}
                <span>Phone: <strong>{form.phone_primary || 'Missing'}</strong></span>
              </div>
              <div className={`p-3 rounded-xl flex items-center gap-2 ${form.address_en ? 'bg-primary-fixed/25 text-on-surface' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {form.address_en ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Info className="w-4 h-4 text-outline shrink-0" />}
                <span>Address: <strong>{form.address_en || 'Missing'}</strong></span>
              </div>
              <div className={`p-3 rounded-xl flex items-center gap-2 ${form.lat && form.lng ? 'bg-primary-fixed/25 text-on-surface' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {form.lat && form.lng ? <CheckCircle2 className="w-4 h-4 text-primary shrink-0" /> : <Info className="w-4 h-4 text-outline shrink-0" />}
                <span>Map Coordinates: <strong>{form.lat && form.lng ? 'Pinned' : 'Not set'}</strong></span>
              </div>
            </div>
          </Card>

          {/* Live Public Profile Snapshot */}
          <Card className="p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Eye className="w-4 h-4" />
              <span>Live Public Profile Snapshot</span>
            </div>
            <div className="rounded-2xl overflow-hidden border border-outline-variant/40 bg-surface-container-low">
              {form.cover_url ? (
                <ImageWithFallback
                  src={form.cover_url}
                  alt={form.name_en || 'Cover preview'}
                  className="w-full h-40 object-cover"
                />
              ) : (
                <div className="w-full h-24 bg-gradient-to-r from-primary/20 via-primary-fixed/40 to-secondary-fixed/40" />
              )}
              <div className="p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-3">
                  {form.logo_url && (
                    <ImageWithFallback
                      src={form.logo_url}
                      alt={form.name_en || 'Logo'}
                      className="w-14 h-14 rounded-xl object-cover border border-outline-variant/40 shrink-0 bg-surface"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-lg font-extrabold text-on-surface">{form.name_en || 'Untitled Business'}</h3>
                      {business.is_verified && <BadgeCheck className="w-4 h-4 text-primary" />}
                      {form.home_delivery && <Badge variant="success">Home Delivery</Badge>}
                    </div>
                    {form.name_ur && (
                      <p className="font-urdu text-base text-primary mt-0.5" dir="rtl">
                        {form.name_ur}
                      </p>
                    )}
                    <p className="text-xs text-on-surface-variant mt-0.5">
                      {previewCategory} · {previewArea}
                      {form.established_year ? ` · Est. ${form.established_year}` : ''}
                    </p>
                  </div>
                </div>

                {form.description_en && (
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {form.description_en}
                  </p>
                )}

                <div className="flex flex-wrap gap-3 text-xs text-on-surface-variant pt-2 border-t border-outline-variant/25">
                  {form.address_en && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> {form.address_en}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 font-bold text-on-surface tabular-nums" dir="ltr">
                    <Phone className="w-3.5 h-3.5 text-primary" /> {form.phone_primary || '0300-XXXXXXX'}
                    {form.whatsapp ? ` · WA: ${form.whatsapp}` : ''}
                  </span>
                </div>

                {servicesList.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {servicesList.slice(0, 10).map((s) => (
                      <Badge key={s} variant="neutral">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Sticky Bottom Wizard Action Bar */}
      <div className="sticky bottom-14 z-30 bg-surface-container-lowest/95 backdrop-blur-md p-3 rounded-2xl border border-outline-variant/40 shadow-lg flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {stepIndex > 0 && (
            <Button
              variant="outline"
              type="button"
              onClick={() => goStep(STEPS[stepIndex - 1].id)}
              leftIcon={<ArrowLeft className="w-4 h-4 rtl:rotate-180" />}
            >
              Back
            </Button>
          )}

          {/* Save Draft Button (always available across all steps) */}
          <Button
            variant="outline"
            type="button"
            onClick={() => handleSave(false)}
            loading={saving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>
        </div>

        <div className="flex items-center gap-2 ms-auto">
          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => goStep(STEPS[stepIndex + 1].id)}
              rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              Next: {STEPS[stepIndex + 1].label}
            </Button>
          ) : canSubmitApproval ? (
            <Button
              variant="secondary"
              type="button"
              onClick={() => handleSave(true)}
              loading={saving}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit for Approval
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => handleSave(false)}
              loading={saving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
