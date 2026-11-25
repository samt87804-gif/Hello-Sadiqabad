import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, RefreshCw, XCircle, EyeOff } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

type FieldStatus = 'pending_review' | 'approved_published' | 'rejected' | 'unpublished';
interface FieldReview {
  id: string;
  submission_id: string;
  field_key: string;
  field_value: unknown;
  status: FieldStatus;
  admin_note: string | null;
}
interface BusinessMedia {
  id: string;
  submission_id: string | null;
  business_id: string | null;
  media_field: 'logo' | 'cover';
  storage_path: string;
  status: FieldStatus;
  created_at: string;
  preview_url?: string;
}
interface BusinessSubmission {
  id: string;
  payload: Record<string, unknown>;
  contact_name: string | null;
  contact_phone: string | null;
  status: string;
  created_at: string;
  business_id: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  name_en: 'Business name (English)', name_ur: 'Business name (Urdu)',
  category_id: 'Category', area_id: 'Area', phone_primary: 'Primary phone',
  whatsapp: 'WhatsApp', address_en: 'Address (English)', address_ur: 'Address (Urdu)',
  landmark_en: 'Landmark (English)', landmark_ur: 'Landmark (Urdu)',
  map_url: 'Google Maps URL', opening_hours: 'Opening hours',
  description_en: 'Description (English)', description_ur: 'Description (Urdu)',
  services_en: 'Facilities / Services (English)', services_ur: 'Facilities / Services (Urdu)',
  owner_name: 'Owner contact name (private; not published)',
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function BusinessFieldReviewQueue() {
  const { showToast } = useToast();
  const [submissions, setSubmissions] = useState<BusinessSubmission[]>([]);
  const [fields, setFields] = useState<FieldReview[]>([]);
  const [media, setMedia] = useState<BusinessMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');

  const reload = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data: rows, error } = await client.from('submissions')
        .select('id,payload,contact_name,contact_phone,status,created_at,business_id')
        .eq('type', 'new_business').in('status', ['new', 'in_review'])
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      const ids = (rows ?? []).map((row) => row.id);
      const { data: reviewRows, error: reviewError } = ids.length
        ? await client.from('business_field_reviews')
          .select('id,submission_id,field_key,field_value,status,admin_note')
          .in('submission_id', ids).order('field_key')
        : { data: [], error: null };
      if (reviewError) throw reviewError;
      const { data: mediaRows, error: mediaError } = await client.from('business_media_assets')
        .select('id,submission_id,business_id,media_field,storage_path,status,created_at')
        .in('status', ['pending_review', 'approved_published', 'unpublished'])
        .order('created_at', { ascending: false }).limit(100);
      if (mediaError) throw mediaError;
      const mediaWithPreviews = await Promise.all((mediaRows ?? []).map(async (asset) => {
        const { data: signed } = await client.storage.from('hs-pending-business-media')
          .createSignedUrl(asset.storage_path, 900);
        return { ...asset, preview_url: signed?.signedUrl } as BusinessMedia;
      }));
      setSubmissions((rows ?? []) as BusinessSubmission[]);
      setFields((reviewRows ?? []) as FieldReview[]);
      setMedia(mediaWithPreviews);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load business field reviews.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void reload(); }, [reload]);

  const reviewMedia = async (assetId: string, action: FieldStatus) => {
    const client = getSupabaseClient();
    if (!client) return;
    const key = 'media:' + assetId;
    setBusyKey(key);
    try {
      const { data, error } = await client.functions.invoke('review-business-media', {
        body: { asset_id: assetId, action },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'Media review failed.');
      showToast('Business image review saved.', 'success');
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not review business image.', 'error');
    } finally {
      setBusyKey('');
    }
  };

  const review = async (submissionId: string, fieldKey: string, status: FieldStatus) => {
    const client = getSupabaseClient();
    if (!client) return;
    const key = submissionId + ':' + fieldKey;
    setBusyKey(key);
    try {
      const { error } = await client.rpc('review_business_submission_field', {
        p_submission_id: submissionId,
        p_field_key: fieldKey,
        p_status: status,
        p_admin_note: null,
      });
      if (error) throw error;
      showToast('Field review saved.', 'success');
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not save field review.', 'error');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface">Business Field Approval</h2>
          <p className="text-xs text-on-surface-variant mt-1">Approve each public field separately. A listing is published only after its required fields are approved.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
      </div>
      <section className="space-y-3">
        <h3 className="text-lg font-bold text-on-surface">Business Images Awaiting Review</h3>
        {media.length === 0 ? <Card className="p-4 text-xs text-on-surface-variant">No pending business images.</Card> :
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {media.map((asset) => {
              const busy = busyKey === 'media:' + asset.id;
              const canPublish = Boolean(asset.business_id || submissions.some((item) => item.id === asset.submission_id && item.business_id));
              return (
                <Card key={asset.id} className="p-4 space-y-3">
                  {asset.preview_url ? <img src={asset.preview_url} alt={asset.media_field === 'logo' ? 'Pending business logo' : 'Pending business cover'} className="w-full h-40 object-contain rounded-xl bg-surface-container-low" /> : <div className="h-40 rounded-xl bg-surface-container-low flex items-center justify-center text-xs text-on-surface-variant">Private image preview unavailable</div>}
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold capitalize">{asset.media_field} · {asset.status.replaceAll('_', ' ')}</p>
                    <span className="text-[10px] text-on-surface-variant">{new Date(asset.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" loading={busy} disabled={Boolean(busyKey) || !canPublish} onClick={() => void reviewMedia(asset.id, 'approved_published')} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>Approve &amp; Publish</Button>
                    <Button size="sm" variant="danger" disabled={Boolean(busyKey)} onClick={() => void reviewMedia(asset.id, 'rejected')} leftIcon={<XCircle className="w-3.5 h-3.5" />}>Reject</Button>
                    {asset.status === 'approved_published' && <Button size="sm" variant="outline" disabled={Boolean(busyKey)} onClick={() => void reviewMedia(asset.id, 'unpublished')} leftIcon={<EyeOff className="w-3.5 h-3.5" />}>Unpublish</Button>}
                  </div>
                  {!canPublish && <p className="text-[11px] text-on-surface-variant">Approve required business fields before publishing this image.</p>}
                  {asset.media_field === 'cover' && <p className="text-[11px] text-on-surface-variant">Cover images can be published only after the business has an active Basic or Premium plan. Free-plan cover approvals are blocked by the server.</p>}
                </Card>
              );
            })}
          </div>
        }
      </section>
      {loading ? <Card className="p-6 text-sm text-on-surface-variant">Loading business submissions…</Card> :
        submissions.length === 0 ? <Card className="p-6 text-sm text-on-surface-variant">No pending business submissions.</Card> :
        submissions.map((submission) => {
          const submissionFields = fields.filter((field) => field.submission_id === submission.id);
          const required = ['name_en', 'category_id', 'area_id', 'phone_primary', 'address_en'];
          const approvedRequired = required.filter((fieldKey) =>
            submissionFields.some((field) => field.field_key === fieldKey && field.status === 'approved_published')).length;
          return (
            <Card key={submission.id} className="p-4 sm:p-5 space-y-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-on-surface">{String(submission.payload.name_en ?? 'New business')}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{submission.contact_name || 'Submitter'} · {submission.contact_phone || 'No contact phone'}</p>
                  <p className="text-[11px] text-outline mt-1">{new Date(submission.created_at).toLocaleString()} · {approvedRequired}/5 required fields approved</p>
                </div>
                <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-secondary-container text-on-secondary-container inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" /> {submission.status}
                </span>
              </div>
              <div className="space-y-3">
                {submissionFields.map((field) => {
                  const actionKey = submission.id + ':' + field.field_key;
                  const busy = busyKey === actionKey;
                  return (
                    <div key={field.id} className="rounded-xl border border-outline-variant/50 p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-xs font-bold text-on-surface">{FIELD_LABELS[field.field_key] ?? field.field_key}</p>
                        <span className="text-[10px] font-semibold text-on-surface-variant">{field.status.replaceAll('_', ' ')}</span>
                      </div>
                      <p className="text-sm text-on-surface break-words whitespace-pre-wrap">{formatValue(field.field_value)}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" loading={busy && field.status !== 'approved_published'} disabled={Boolean(busyKey)} onClick={() => void review(submission.id, field.field_key, 'approved_published')} leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}>Approve &amp; Publish</Button>
                        <Button size="sm" variant="danger" disabled={Boolean(busyKey)} onClick={() => void review(submission.id, field.field_key, 'rejected')} leftIcon={<XCircle className="w-3.5 h-3.5" />}>Reject</Button>
                        <Button size="sm" variant="outline" disabled={Boolean(busyKey)} onClick={() => void review(submission.id, field.field_key, 'unpublished')} leftIcon={<EyeOff className="w-3.5 h-3.5" />}>Unpublish</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })
      }
    </div>
  );
}
