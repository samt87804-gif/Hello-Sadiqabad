import React, { useCallback, useEffect, useState } from 'react';
import { BriefcaseBusiness, CalendarDays, RefreshCw, Send } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getSupabaseClient } from '../../lib/supabase';
import { fetchAllAreas, fetchOwnerListings } from '../../lib/api';
import type { AreaRow } from '../../types/database';
import type { BusinessPublicView } from '../../types/directory';
import { AppHeader } from '../../components/layout/AppHeader';
import { AppFooter } from '../../components/layout/AppFooter';
import { OwnerNav } from '../../components/owner/OwnerNav';
import { Badge, Card } from '../../components/ui/Surface';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';

type SdkJobStatus = 'draft' | 'pending_review' | 'changes_requested' | 'rejected' | 'published' | 'unpublished' | 'closed' | 'expired' | 'archived';
interface OwnerSdkJob {
  id: string;
  slug: string;
  source_business_id: string;
  area_id: string | null;
  work_location_en: string | null;
  work_location_ur: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_disclosed: boolean;
  description_en: string;
  description_ur: string | null;
  duties_en: string | null;
  duties_ur: string | null;
  qualifications_en: string | null;
  qualifications_ur: string | null;
  experience_en: string | null;
  experience_ur: string | null;
  working_hours_en: string | null;
  working_hours_ur: string | null;
  benefits_en: string | null;
  benefits_ur: string | null;
  title_en: string;
  title_ur: string | null;
  summary_en: string;
  summary_ur: string | null;
  job_category: string;
  vacancy_count: number;
  job_type: string;
  closing_date: string | null;
  status: SdkJobStatus;
  submitted_at: string;
  created_at: string;
  pending_media_path: string | null;
  approved_image_url: string | null;
  owner_feedback: string | null;
}

const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship', 'Apprenticeship'];

function makeSlug(value: string): string {
  const base = value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'local-job';
  return base + '-' + crypto.randomUUID().slice(0, 8);
}

const statusLabel: Record<SdkJobStatus, string> = {
  draft: 'Draft', pending_review: 'Pending Admin Review', changes_requested: 'Changes Requested',
  rejected: 'Rejected', published: 'Published', unpublished: 'Unpublished',
  closed: 'Closed', expired: 'Expired', archived: 'Archived',
};

function statusVariant(status: SdkJobStatus): 'success' | 'warning' | 'danger' | 'neutral' {
  if (status === 'published') return 'success';
  if (status === 'rejected') return 'danger';
  if (status === 'pending_review' || status === 'changes_requested') return 'warning';
  return 'neutral';
}

export function OwnerSdkJobs() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [businesses, setBusinesses] = useState<BusinessPublicView[]>([]);
  const [areas, setAreas] = useState<AreaRow[]>([]);
  const [jobs, setJobs] = useState<OwnerSdkJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingJobHasPoster, setEditingJobHasPoster] = useState(false);
  const [uploadingPosterJobId, setUploadingPosterJobId] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [titleUr, setTitleUr] = useState('');
  const [summaryEn, setSummaryEn] = useState('');
  const [summaryUr, setSummaryUr] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionUr, setDescriptionUr] = useState('');
  const [category, setCategory] = useState('');
  const [vacancies, setVacancies] = useState('1');
  const [jobType, setJobType] = useState('Full-time');
  const [areaId, setAreaId] = useState('');
  const [locationEn, setLocationEn] = useState('');
  const [locationUr, setLocationUr] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [salaryDisclosed, setSalaryDisclosed] = useState(false);
  const [dutiesEn, setDutiesEn] = useState('');
  const [dutiesUr, setDutiesUr] = useState('');
  const [qualificationsEn, setQualificationsEn] = useState('');
  const [qualificationsUr, setQualificationsUr] = useState('');
  const [experienceEn, setExperienceEn] = useState('');
  const [experienceUr, setExperienceUr] = useState('');
  const [hoursEn, setHoursEn] = useState('');
  const [hoursUr, setHoursUr] = useState('');
  const [benefitsEn, setBenefitsEn] = useState('');
  const [benefitsUr, setBenefitsUr] = useState('');
  const [closingDate, setClosingDate] = useState('');

  const reload = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured on this device.');
      const [owned, allAreas, result] = await Promise.all([
        fetchOwnerListings(user.id),
        fetchAllAreas(),
        client.from('sdk_jobs')
          .select('id,slug,source_business_id,area_id,title_en,title_ur,summary_en,summary_ur,description_en,description_ur,job_category,vacancy_count,job_type,work_location_en,work_location_ur,salary_min,salary_max,salary_disclosed,duties_en,duties_ur,qualifications_en,qualifications_ur,experience_en,experience_ur,working_hours_en,working_hours_ur,benefits_en,benefits_ur,closing_date,status,submitted_at,created_at,pending_media_path,approved_image_url,owner_feedback')
          .eq('employer_owner_id', user.id)
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      if (result.error) throw result.error;
      setBusinesses(owned.filter((business) => business.status === 'published'));
      setAreas(allAreas.filter((area) => area.is_active));
      setJobs((result.data ?? []) as OwnerSdkJob[]);
      setSelectedBusiness((current) => owned.some((business) => business.id === current && business.status === 'published') ? current : owned.find((business) => business.status === 'published')?.id || '');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'SDK Jobs could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => { void reload(); }, [reload]);

  const resetForm = () => {
    setTitleEn(''); setTitleUr(''); setSummaryEn(''); setSummaryUr('');
    setDescriptionEn(''); setDescriptionUr(''); setCategory(''); setVacancies('1');
    setJobType('Full-time'); setAreaId(''); setLocationEn(''); setLocationUr('');
    setSalaryMin(''); setSalaryMax(''); setSalaryDisclosed(false);
    setDutiesEn(''); setDutiesUr(''); setQualificationsEn(''); setQualificationsUr('');
    setExperienceEn(''); setExperienceUr(''); setHoursEn(''); setHoursUr('');
    setBenefitsEn(''); setBenefitsUr(''); setClosingDate(''); setPosterFile(null); setEditingJobId(null); setEditingJobHasPoster(false);
  };

  const beginEdit = (job: OwnerSdkJob) => {
    setEditingJobId(job.id);
    setEditingJobHasPoster(Boolean(job.pending_media_path || job.approved_image_url));
    setSelectedBusiness(job.source_business_id);
    setTitleEn(job.title_en); setTitleUr(job.title_ur || '');
    setSummaryEn(job.summary_en); setSummaryUr(job.summary_ur || '');
    setDescriptionEn(job.description_en); setDescriptionUr(job.description_ur || '');
    setCategory(job.job_category); setVacancies(String(job.vacancy_count)); setJobType(job.job_type);
    setAreaId(job.area_id || ''); setLocationEn(job.work_location_en || ''); setLocationUr(job.work_location_ur || '');
    setSalaryMin(job.salary_min === null ? '' : String(job.salary_min));
    setSalaryMax(job.salary_max === null ? '' : String(job.salary_max));
    setSalaryDisclosed(job.salary_disclosed);
    setDutiesEn(job.duties_en || ''); setDutiesUr(job.duties_ur || '');
    setQualificationsEn(job.qualifications_en || ''); setQualificationsUr(job.qualifications_ur || '');
    setExperienceEn(job.experience_en || ''); setExperienceUr(job.experience_ur || '');
    setHoursEn(job.working_hours_en || ''); setHoursUr(job.working_hours_ur || '');
    setBenefitsEn(job.benefits_en || ''); setBenefitsUr(job.benefits_ur || '');
    setClosingDate(job.closing_date || ''); setPosterFile(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const uploadPoster = async (jobId: string, file: File): Promise<boolean> => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size <= 0 || file.size > 5 * 1024 * 1024) {
      showToast('Poster JPEG, PNG ya WebP ho aur size 5 MB se zyada na ho.', 'error');
      return false;
    }
    setUploadingPosterJobId(jobId);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client.functions.invoke('create-sdk-job-poster-upload', {
        body: { job_id: jobId, mime_type: file.type, file_size_bytes: file.size },
      });
      if (error) throw error;
      if (!data?.ok || !data?.data?.path || !data?.data?.token) {
        throw new Error(data?.error || 'Secure poster upload could not be prepared.');
      }
      const { error: uploadError } = await client.storage.from('hs-pending-business-media')
        .uploadToSignedUrl(data.data.path, data.data.token, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: attachError } = await client.from('sdk_jobs')
        .update({ pending_media_path: data.data.path }).eq('id', jobId).select('id').single();
      if (attachError) throw attachError;
      showToast('Poster private storage mein upload ho gaya. Ab Admin review karega.', 'success');
      await reload();
      return true;
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Poster upload failed. You can retry from the job request below.', 'error');
      return false;
    } finally {
      setUploadingPosterJobId(null);
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    if (!selectedBusiness) {
      showToast('Select one of your published businesses first.', 'error');
      return;
    }
    const min = salaryMin.trim() ? Number(salaryMin) : null;
    const max = salaryMax.trim() ? Number(salaryMax) : null;
    const count = Number(vacancies);
    if (!Number.isInteger(count) || count < 1 || count > 10000) {
      showToast('Enter a valid number of vacancies.', 'error'); return;
    }
    if (min !== null && (!Number.isFinite(min) || min < 0) || max !== null && (!Number.isFinite(max) || max < 0) || min !== null && max !== null && min > max) {
      showToast('Enter a valid salary range.', 'error'); return;
    }
    setSaving(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured.');
      const jobPayload = {
        source_business_id: selectedBusiness,
        title_en: titleEn.trim(),
        title_ur: titleUr.trim() || null,
        summary_en: summaryEn.trim(),
        summary_ur: summaryUr.trim() || null,
        description_en: descriptionEn.trim(),
        description_ur: descriptionUr.trim() || null,
        job_category: category.trim(),
        vacancy_count: count,
        job_type: jobType,
        area_id: areaId || null,
        work_location_en: locationEn.trim() || null,
        work_location_ur: locationUr.trim() || null,
        salary_min: min,
        salary_max: max,
        salary_disclosed: salaryDisclosed,
        duties_en: dutiesEn.trim() || null,
        duties_ur: dutiesUr.trim() || null,
        qualifications_en: qualificationsEn.trim() || null,
        qualifications_ur: qualificationsUr.trim() || null,
        experience_en: experienceEn.trim() || null,
        experience_ur: experienceUr.trim() || null,
        working_hours_en: hoursEn.trim() || null,
        working_hours_ur: hoursUr.trim() || null,
        benefits_en: benefitsEn.trim() || null,
        benefits_ur: benefitsUr.trim() || null,
        closing_date: closingDate || null,
      };
      const { data: created, error } = editingJobId
        ? await client.from('sdk_jobs').update(jobPayload).eq('id', editingJobId).select('id').single()
        : await client.from('sdk_jobs').insert({ slug: makeSlug(titleEn), ...jobPayload }).select('id').single();
      if (error) throw error;
      if (posterFile && created?.id) await uploadPoster(created.id, posterFile);
      showToast(editingJobId ? 'Corrections resubmitted. Your job is back in the Admin review queue.' : 'Job request submitted. It will stay private until Admin review and publication.', 'success');
      resetForm();
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Job could not be submitted.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm text-on-surface';
  const labelClass = 'block text-xs font-semibold text-on-surface-variant mb-1.5';
  const input = (label: string, value: string, set: (v: string) => void, required = false, type = 'text', maxLength?: number) => (
    <label className="block"><span className={labelClass}>{label}{required ? ' *' : ''}</span><input className={fieldClass} type={type} value={value} onChange={(e) => set(e.target.value)} required={required} maxLength={maxLength} /></label>
  );
  const textarea = (label: string, value: string, set: (v: string) => void, required = false, maxLength = 12000) => (
    <label className="block"><span className={labelClass}>{label}{required ? ' *' : ''}</span><textarea className={fieldClass + ' min-h-24 resize-y'} value={value} onChange={(e) => set(e.target.value)} required={required} maxLength={maxLength} /></label>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <AppHeader />
      <div className="pt-[93px] sm:pt-[102px]"><div className="px-4"><p className="text-xs text-on-surface-variant">Owner Portal / SDK Jobs</p></div></div>
      <div className="flex-1 flex flex-col lg:flex-row pb-20">
        <OwnerNav />
        <main className="flex-1 p-4 sm:p-6 pb-10 max-w-5xl w-full mx-auto space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h1 className="text-xl font-bold">SDK Jobs — {editingJobId ? 'Edit & Resubmit' : 'Post a Vacancy'}</h1><p className="text-sm text-on-surface-variant mt-1">Apni business ki vacancy submit karein. Har job Admin approval ke baad hi public hogi.</p></div>
            <Button variant="outline" size="sm" onClick={() => void reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
          </div>
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center gap-2"><BriefcaseBusiness className="w-5 h-5 text-primary" /><h2 className="font-bold">Your SDK Jobs requests</h2></div>
            {loading ? <p className="text-sm text-on-surface-variant">Loading your jobs…</p> : jobs.length === 0 ? <p className="text-sm text-on-surface-variant">Abhi koi job submit nahi ki gayi.</p> : <div className="space-y-2">{jobs.map((job) => <div key={job.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-outline-variant/40 p-3"><div className="min-w-0"><p className="font-semibold text-sm">{job.title_en}</p><p className="text-xs text-on-surface-variant">{job.job_category} · {job.vacancy_count} vacancy · {job.closing_date ? 'Closes ' + job.closing_date : 'No closing date'}</p></div><Badge variant={statusVariant(job.status)}>{statusLabel[job.status]}</Badge></div>)}</div>}
          </Card>
          {businesses.length === 0 ? <Card className="p-6 space-y-2"><h2 className="font-bold">Published business required</h2><p className="text-sm text-on-surface-variant">SDK Jobs post karne ke liye aapke account ke sath kam az kam aik published business linked hona zaroori hai. Eligibility server par bhi verify hoti hai.</p></Card> : (
            <Card className="p-4 sm:p-6">
              <form onSubmit={submit} className="space-y-5">
                <section className="space-y-3"><h2 className="font-bold">{editingJobId ? 'Correct the requested job details' : 'Business & vacancy details'}</h2>
                  <label className="block"><span className={labelClass}>Post on behalf of business *</span><select className={fieldClass} value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} required>{businesses.map((business) => <option key={business.id} value={business.id}>{business.name_en}</option>)}</select></label>
                  <div className="grid sm:grid-cols-2 gap-3">{input('Job title (English)',titleEn,setTitleEn,true,'text',180)}{input('Job title (Urdu)',titleUr,setTitleUr,false,'text',180)}{input('Job category',category,setCategory,true,'text',100)}
                    <label className="block"><span className={labelClass}>Job type *</span><select className={fieldClass} value={jobType} onChange={(e)=>setJobType(e.target.value)}>{JOB_TYPES.map((type)=><option key={type}>{type}</option>)}</select></label>
                    {input('Number of vacancies',vacancies,setVacancies,true,'number')}{input('Closing date',closingDate,setClosingDate,false,'date')}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">{textarea('Short summary (English)',summaryEn,setSummaryEn,true,360)}{textarea('Short summary (Urdu)',summaryUr,setSummaryUr,false,360)}{textarea('Full job description (English)',descriptionEn,setDescriptionEn,true)}{textarea('Full job description (Urdu)',descriptionUr,setDescriptionUr)}</div>
                </section>
                <section className="space-y-3 border-t border-outline-variant/40 pt-4"><h2 className="font-bold">Location & compensation</h2>
                  <div className="grid sm:grid-cols-2 gap-3"><label className="block"><span className={labelClass}>Area</span><select className={fieldClass} value={areaId} onChange={(e)=>setAreaId(e.target.value)}><option value="">Select area (optional)</option>{areas.map((area)=><option key={area.id} value={area.id}>{area.name_en}</option>)}</select></label>{input('Work location (English)',locationEn,setLocationEn)}{input('Work location (Urdu)',locationUr,setLocationUr)}{input('Minimum salary (PKR)',salaryMin,setSalaryMin,false,'number')}{input('Maximum salary (PKR)',salaryMax,setSalaryMax,false,'number')}</div>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={salaryDisclosed} onChange={(e)=>setSalaryDisclosed(e.target.checked)} /> Show salary range publicly if provided</label>
                </section>
                <section className="space-y-3 border-t border-outline-variant/40 pt-4"><h2 className="font-bold">Job poster (optional, required before publication)</h2>{editingJobHasPoster ? <p className="text-xs text-on-surface-variant">Is request ke sath poster pehle se attached hai. Agar Admin poster reject karega to request list se naya poster upload kar sakenge.</p> : <label className="block"><span className={labelClass}>Upload JPEG, PNG or WebP — maximum 5 MB</span><input className={fieldClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPosterFile(e.target.files?.[0] ?? null)} /><span className="text-xs text-on-surface-variant">{posterFile ? posterFile.name : 'Poster pehle private storage mein jayega; Admin approval ke baad hi public hoga.'}</span></label>}</section>
                <section className="space-y-3 border-t border-outline-variant/40 pt-4"><h2 className="font-bold">Requirements & work conditions</h2><div className="grid sm:grid-cols-2 gap-3">{textarea('Duties (English)',dutiesEn,setDutiesEn)}{textarea('Duties (Urdu)',dutiesUr,setDutiesUr)}{textarea('Qualifications (English)',qualificationsEn,setQualificationsEn)}{textarea('Qualifications (Urdu)',qualificationsUr,setQualificationsUr)}{textarea('Experience (English)',experienceEn,setExperienceEn, false, 2000)}{textarea('Experience (Urdu)',experienceUr,setExperienceUr,false,2000)}{input('Working hours / shift (English)',hoursEn,setHoursEn)}{input('Working hours / shift (Urdu)',hoursUr,setHoursUr)}{textarea('Benefits (English)',benefitsEn,setBenefitsEn,false,3000)}{textarea('Benefits (Urdu)',benefitsUr,setBenefitsUr,false,3000)}</div>
                </section>
                <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs text-on-surface-variant space-y-1"><p className="font-bold text-on-surface">Important — Admin review required</p><p>Submission public nahi hoti. Admin approval aur approved job poster/image ke baghair listing publish nahi hogi. Poster optional taur par abhi attach kar sakte hain ya submission ke baad request list se upload kar sakte hain.</p><p>Public listing par aapka naam, business identity, phone, WhatsApp ya email show nahi hoga. Candidate contact CTA Admin ke approved WhatsApp par hoga.</p></div>
                <div className="flex justify-end gap-2">{editingJobId && <Button type="button" variant="outline" disabled={saving} onClick={resetForm}>Cancel edit</Button>}<Button type="submit" disabled={saving || loading} leftIcon={<Send className="w-4 h-4" />}>{saving ? 'Submitting…' : editingJobId ? 'Resubmit for Admin review' : 'Submit job for review'}</Button></div>
              </form>
            </Card>
          )}
        </main>
      </div>
      <AppFooter variant="portal" withBottomNavOffset={false} />
    </div>
  );
}
