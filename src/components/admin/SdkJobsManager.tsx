import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { getSupabaseClient } from '../../lib/supabase';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

type JobStatus = 'draft' | 'pending_review' | 'changes_requested' | 'rejected' | 'published' | 'unpublished' | 'closed' | 'expired' | 'archived';
interface AdminSdkJob {
  id: string; slug: string; employer_owner_id: string; source_business_id: string;
  title_en: string; title_ur: string | null; summary_en: string; summary_ur: string | null;
  description_en: string; description_ur: string | null; job_category: string;
  vacancy_count: number; job_type: string; work_location_en: string | null;
  work_location_ur: string | null; salary_min: number | null; salary_max: number | null;
  salary_disclosed: boolean; qualifications_en: string | null; qualifications_ur: string | null;
  experience_en: string | null; experience_ur: string | null; duties_en: string | null; duties_ur: string | null;
  working_hours_en: string | null; working_hours_ur: string | null; benefits_en: string | null; benefits_ur: string | null;
  closing_date: string | null; pending_media_path: string | null;
  approved_image_url: string | null; status: JobStatus; submitted_at: string;
}
interface JobHistory { id: string; action: string; old_status: string | null; new_status: string | null; created_at: string; }
interface JobNote { id: string; note: string; created_at: string; }
interface PrivateEmployerDetails {
  business: { name_en: string; name_ur: string | null; phone_primary: string | null; whatsapp: string | null; email: string | null };
  owner: { full_name: string | null; phone: string | null; email: string | null };
}

const labels: Record<JobStatus, string> = {
  draft:'Draft', pending_review:'Pending review', changes_requested:'Changes requested',
  rejected:'Rejected', published:'Published', unpublished:'Unpublished',
  closed:'Closed', expired:'Expired', archived:'Archived',
};
const variant = (status: JobStatus): 'success'|'warning'|'danger'|'neutral' =>
  status === 'published' ? 'success' : status === 'rejected' ? 'danger' :
  status === 'pending_review' || status === 'changes_requested' ? 'warning' : 'neutral';

export function SdkJobsManager() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [jobs, setJobs] = useState<AdminSdkJob[]>([]);
  const [selected, setSelected] = useState<AdminSdkJob | null>(null);
  const [history, setHistory] = useState<JobHistory[]>([]);
  const [notes, setNotes] = useState<JobNote[]>([]);
  const [posterPreviewUrl, setPosterPreviewUrl] = useState<string | null>(null);
  const [employerDetails, setEmployerDetails] = useState<PrivateEmployerDetails | null>(null);
  const [privacyReviewed, setPrivacyReviewed] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client.from('sdk_jobs').select('*').order('submitted_at', { ascending: false }).limit(200);
      if (error) throw error;
      const rows = (data ?? []) as AdminSdkJob[];
      setJobs(rows);
      setSelected((current) => current ? rows.find((row) => row.id === current.id) ?? null : null);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'SDK Jobs queue could not be loaded.', 'error');
    } finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { void reload(); }, [reload]);

  const loadDetail = async (job: AdminSdkJob) => {
    setSelected(job); setNote(''); setPosterPreviewUrl(null); setPrivacyReviewed(false); setEmployerDetails(null);
    const client = getSupabaseClient();
    if (!client) return;
    const [employer, poster, historyResult, notesResult] = await Promise.all([
      client.functions.invoke('get-sdk-job-employer-details', { body: { job_id: job.id } }),
      job.pending_media_path
        ? client.storage.from('hs-pending-business-media').createSignedUrl(job.pending_media_path, 300)
        : Promise.resolve({ data: null, error: null }),
      client.from('sdk_job_status_history').select('id,action,old_status,new_status,created_at').eq('job_id', job.id).order('created_at', { ascending: false }).limit(30),
      client.from('sdk_job_admin_notes').select('id,note,created_at').eq('job_id', job.id).order('created_at', { ascending: false }).limit(30),
    ]);
    if (employer.data?.ok) setEmployerDetails(employer.data as PrivateEmployerDetails);
    else if (employer.error) showToast('Private employer details could not be loaded.', 'error');
    if (job.pending_media_path && poster.data?.signedUrl) setPosterPreviewUrl(poster.data.signedUrl);
    else if (job.approved_image_url) setPosterPreviewUrl(job.approved_image_url);
    if (historyResult.error) showToast('Status history could not be loaded.', 'error');
    else setHistory((historyResult.data ?? []) as JobHistory[]);
    if (notesResult.error) showToast('Admin notes could not be loaded.', 'error');
    else setNotes((notesResult.data ?? []) as JobNote[]);
  };

  const changeStatus = async (status: JobStatus) => {
    if (!selected || !user) return;
    if (status === 'published' && !selected.approved_image_url) {
      showToast('Publication is blocked until an approved public poster is attached.', 'error'); return;
    }
    setSaving(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured.');
      const now = new Date().toISOString();
      const { data, error } = await client.from('sdk_jobs').update({
        status, reviewed_by: user.id, reviewed_at: now,
        published_at: status === 'published' ? now : null,
      }).eq('id', selected.id).select('*').single();
      if (error) throw error;
      showToast('SDK Job status updated.', 'success');
      await reload();
      if (data) await loadDetail(data as AdminSdkJob);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Status could not be updated.', 'error');
    } finally { setSaving(false); }
  };

  const publishJob = async () => {
    if (!selected || !user || !privacyReviewed) return;
    setSaving(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client.functions.invoke('publish-sdk-job', { body: { job_id: selected.id } });
      if (error) throw error;
      if (!data?.ok) {
        const blockers = Array.isArray(data?.blockers) ? data.blockers.join('; ') : '';
        throw new Error([data?.error || 'Job publication failed.', blockers].filter(Boolean).join(' — '));
      }
      showToast('Job published after employer-privacy checks.', 'success');
      await reload();
      await loadDetail({ ...selected, status: 'published', pending_media_path: null });
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Job could not be published.', 'error');
    } finally { setSaving(false); }
  };

  const reviewPoster = async (action: 'approve' | 'reject') => {
    if (!selected || !user) return;
    setSaving(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured.');
      const { data, error } = await client.functions.invoke('review-sdk-job-poster', { body: { job_id: selected.id, action } });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Poster review failed.');
      showToast(action === 'approve' ? 'Poster approved and promoted to public media. Job is still awaiting publication.' : 'Poster rejected. Owner can upload another poster.', 'success');
      const next = { ...selected, pending_media_path: null, approved_image_url: action === 'approve' ? (data.image_url as string) : null };
      await reload();
      await loadDetail(next);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Poster review failed.', 'error');
    } finally { setSaving(false); }
  };

  const saveNote = async () => {
    if (!selected || !user || !note.trim()) return;
    setSaving(true);
    try {
      const client = getSupabaseClient();
      if (!client) throw new Error('Supabase is not configured.');
      const { error } = await client.from('sdk_job_admin_notes').insert({ job_id: selected.id, author_id: user.id, note: note.trim() });
      if (error) throw error;
      setNote('');
      const { data, error: readError } = await client.from('sdk_job_admin_notes').select('id,note,created_at').eq('job_id', selected.id).order('created_at', { ascending: false }).limit(30);
      if (readError) throw readError;
      setNotes((data ?? []) as JobNote[]);
      showToast('Private Admin note saved.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Admin note could not be saved.', 'error');
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">SDK Jobs Moderation</h2><p className="text-xs text-on-surface-variant">Private owner linkage and review controls. Only staff with sdk_jobs.manage can access this queue.</p></div><Button size="sm" variant="outline" onClick={() => void reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button></div>
      {loading ? <Card className="p-5">Loading SDK Jobs…</Card> : jobs.length === 0 ? <Card className="p-8 text-center text-sm text-on-surface-variant">No SDK Jobs submissions yet.</Card> : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] gap-4">
          <div className="space-y-2">{jobs.map((job) => <button type="button" key={job.id} onClick={() => void loadDetail(job)} className={'w-full text-left rounded-2xl border p-4 transition-colors '+(selected?.id===job.id?'border-primary bg-primary/5':'border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50')}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-bold text-sm">{job.title_en}</p><p className="text-xs text-on-surface-variant mt-1">{job.job_category} · {job.vacancy_count} vacancies · {job.job_type}</p><p className="text-[11px] text-on-surface-variant mt-1">Submitted {new Date(job.submitted_at).toLocaleString()}</p></div><Badge variant={variant(job.status)}>{labels[job.status]}</Badge></div></button>)}</div>
          {selected ? <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2"><h3 className="font-bold">Review job</h3><Badge variant={variant(selected.status)}>{labels[selected.status]}</Badge></div>
            <div className="space-y-1"><p className="font-bold">{selected.title_en}</p>{selected.title_ur && <p className="font-urdu text-sm" dir="rtl">{selected.title_ur}</p>}<p className="text-xs text-on-surface-variant">{selected.summary_en}</p>{selected.summary_ur && <p className="font-urdu text-xs" dir="rtl">{selected.summary_ur}</p>}</div>
            <div className="rounded-xl bg-surface-container-low p-3 text-xs space-y-1"><p className="font-bold flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Private employer linkage — Admin only</p><p>Owner: {employerDetails?.owner.full_name || 'Name not available'}</p><p>Owner email: {employerDetails?.owner.email || 'Not available'}</p><p>Owner phone: {employerDetails?.owner.phone || 'Not available'}</p><p>Business: {employerDetails?.business.name_en || 'Name not available'}</p><p>Business phone: {employerDetails?.business.phone_primary || 'Not available'}</p><p>Business WhatsApp: {employerDetails?.business.whatsapp || 'Not available'}</p><p>Business email: {employerDetails?.business.email || 'Not available'}</p><p>Owner user ID: {selected.employer_owner_id}</p><p>Source business ID: {selected.source_business_id}</p><p>Job record ID: {selected.id}</p><p>Pending media path: {selected.pending_media_path || 'No poster uploaded'}</p><p>Approved public poster: {selected.approved_image_url ? 'Attached' : 'Not attached'}</p></div>
            {posterPreviewUrl && <div className="space-y-2"><p className="text-xs font-bold">{selected.pending_media_path ? 'Private pending poster preview' : 'Approved public poster'}</p><img src={posterPreviewUrl} alt="SDK Job poster preview" className="w-full max-h-64 object-contain rounded-xl border border-outline-variant/40 bg-surface-container-low" />{selected.pending_media_path && <div className="flex flex-wrap gap-2"><Button size="sm" disabled={saving} onClick={() => void reviewPoster('approve')}>Approve poster</Button><Button size="sm" variant="danger" disabled={saving} onClick={() => void reviewPoster('reject')}>Reject poster</Button></div>}</div>}
            <div className="space-y-1"><p className="text-xs font-bold">Full description</p><p className="text-sm whitespace-pre-wrap">{selected.description_en}</p>{selected.description_ur && <p className="font-urdu text-sm whitespace-pre-wrap" dir="rtl">{selected.description_ur}</p>}</div>
            <div className="grid grid-cols-2 gap-2 text-xs"><p>Location: {selected.work_location_en || 'Not specified'}</p><p>Closing: {selected.closing_date || 'Not specified'}</p><p>Salary disclosed: {selected.salary_disclosed ? 'Yes' : 'No'}</p><p>Salary range: {selected.salary_disclosed ? [selected.salary_min, selected.salary_max].filter((v) => v !== null).join(' – ') || 'Not specified' : 'Hidden'}</p></div>
            {[['Duties',selected.duties_en,selected.duties_ur],['Qualifications',selected.qualifications_en,selected.qualifications_ur],['Experience',selected.experience_en,selected.experience_ur],['Working hours',selected.working_hours_en,selected.working_hours_ur],['Benefits',selected.benefits_en,selected.benefits_ur]].map(([label,en,ur]) => (en || ur) ? <section key={String(label)} className="space-y-1"><p className="text-xs font-bold">{label}</p><p className="text-sm whitespace-pre-wrap">{en || ''}</p>{ur && <p className="font-urdu text-sm whitespace-pre-wrap" dir="rtl">{ur}</p>}</section> : null)}
            {selected.status === 'pending_review' && selected.approved_image_url && <label className="flex items-start gap-2 rounded-xl border border-outline-variant/40 p-3 text-xs"><input type="checkbox" checked={privacyReviewed} onChange={(event) => setPrivacyReviewed(event.target.checked)} className="mt-0.5" /><span>I have reviewed every public text field AND the poster image. Neither reveals the employer/business identity, owner name, phone, email or external contact details. Server-side text privacy checks will also run.</span></label>}
            <div className="flex flex-wrap gap-2 border-t border-outline-variant/40 pt-3">
              {selected.status === 'pending_review' && <><Button size="sm" variant="outline" disabled={saving} onClick={() => void changeStatus('changes_requested')}>Request correction</Button><Button size="sm" variant="danger" disabled={saving} onClick={() => void changeStatus('rejected')}>Reject</Button><Button size="sm" disabled={saving || !selected.approved_image_url || !privacyReviewed} onClick={() => void publishJob()}>Publish after privacy check</Button></>}
              {selected.status === 'published' && <Button size="sm" variant="outline" disabled={saving} onClick={() => void changeStatus('unpublished')}>Unpublish</Button>}
              {['published','pending_review','changes_requested'].includes(selected.status) && <Button size="sm" variant="outline" disabled={saving} onClick={() => void changeStatus('closed')}>Close job</Button>}
              {['closed','unpublished','rejected','changes_requested'].includes(selected.status) && <Button size="sm" variant="outline" disabled={saving} onClick={() => void changeStatus('pending_review')}>Return to review</Button>}
              {selected.status !== 'archived' && <Button size="sm" variant="ghost" disabled={saving} onClick={() => void changeStatus('archived')}>Archive</Button>}
            </div>
            {!selected.approved_image_url && <p className="text-xs text-warning">Publish is blocked until Admin approves and promotes a valid private poster.</p>}
            <div className="border-t border-outline-variant/40 pt-3 space-y-2"><h4 className="text-sm font-bold">Private Admin notes</h4><textarea className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm" rows={3} maxLength={4000} value={note} onChange={(e)=>setNote(e.target.value)} placeholder="Internal note — never visible to Owner or public" /><div className="flex justify-end"><Button size="sm" disabled={saving || !note.trim()} onClick={() => void saveNote()}>Save private note</Button></div>{notes.map((item)=><div key={item.id} className="rounded-lg bg-surface-container-low p-2 text-xs"><p>{item.note}</p><p className="text-[10px] text-on-surface-variant mt-1">{new Date(item.created_at).toLocaleString()}</p></div>)}</div>
            <div className="border-t border-outline-variant/40 pt-3 space-y-2"><h4 className="text-sm font-bold">Status history</h4>{history.length===0?<p className="text-xs text-on-surface-variant">No history loaded.</p>:history.map((item)=><div key={item.id} className="flex justify-between gap-2 text-xs"><span>{item.action}: {item.old_status || '—'} → {item.new_status || '—'}</span><span className="text-on-surface-variant">{new Date(item.created_at).toLocaleString()}</span></div>)}</div>
          </Card> : <Card className="p-8 text-sm text-on-surface-variant">Select a job to inspect its submission and private review history.</Card>}
        </div>
      )}
    </div>
  );
}
