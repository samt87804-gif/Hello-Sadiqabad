import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock3, Mail, Phone, RefreshCw, XCircle } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/FormFields';
import { useToast } from '../ui/Toast';

interface OwnerRegistrationRequest {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  business_name: string | null;
  status: 'pending' | 'processing' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
}

export function OwnerRegistrationRequests() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<OwnerRegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});

  const reload = useCallback(async () => {
    const client = getSupabaseClient();
    if (!client) return;
    setLoading(true);
    try {
      const { data, error } = await client.from('owner_registration_requests')
        .select('id,full_name,email,phone,business_name,status,admin_note,created_at')
        .order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setRequests((data ?? []) as OwnerRegistrationRequest[]);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not load owner requests.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void reload(); }, [reload]);

  const review = async (requestId: string, action: 'approve' | 'reject') => {
    const client = getSupabaseClient();
    if (!client) return;
    setBusyId(requestId);
    try {
      const { data, error } = await client.functions.invoke('manage-owner-registration', {
        body: { request_id: requestId, action, admin_note: notes[requestId]?.trim() || null },
      });
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || 'The request could not be processed.');
      showToast(action === 'approve'
        ? 'Owner approved. An account activation invitation has been emailed.'
        : 'Owner registration request rejected.', 'success');
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not process the request.', 'error');
    } finally {
      setBusyId('');
    }
  };

  const pending = requests.filter((request) => request.status === 'pending' || request.status === 'processing');
  const reviewed = requests.filter((request) => request.status === 'approved' || request.status === 'rejected');

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface">Owner Registration Requests</h2>
          <p className="text-xs text-on-surface-variant mt-1">Review requests before any Owner Portal account is created.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void reload()} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
      </div>
      {loading ? <Card className="p-6 text-sm text-on-surface-variant">Loading requests…</Card> :
        pending.length === 0 ? <Card className="p-6 text-sm text-on-surface-variant">No pending owner registration requests.</Card> :
        <div className="space-y-3">
          {pending.map((request) => (
            <Card key={request.id} className="p-4 sm:p-5 space-y-3">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="font-bold text-on-surface">{request.full_name}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2"><Mail className="w-3.5 h-3.5" />{request.email}</p>
                  <p className="text-xs text-on-surface-variant mt-1 flex items-center gap-2"><Phone className="w-3.5 h-3.5" />{request.phone}</p>
                  {request.business_name && <p className="text-xs text-primary mt-1">Business: {request.business_name}</p>}
                  <p className="text-[11px] text-outline mt-2">Submitted {new Date(request.created_at).toLocaleString()}</p>
                </div>
                <span className="text-[11px] font-bold rounded-full px-2.5 py-1 bg-secondary-container text-on-secondary-container inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" /> {request.status}
                </span>
              </div>
              <Textarea rows={2} value={notes[request.id] ?? request.admin_note ?? ''} onChange={(e) => setNotes((current) => ({ ...current, [request.id]: e.target.value }))} placeholder="Optional Admin note" />
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" loading={busyId === request.id} disabled={Boolean(busyId) || request.status !== 'pending'} onClick={() => void review(request.id, 'approve')} leftIcon={<CheckCircle2 className="w-4 h-4" />}>Approve &amp; Send Invitation</Button>
                <Button size="sm" variant="danger" loading={busyId === request.id} disabled={Boolean(busyId) || request.status !== 'pending'} onClick={() => void review(request.id, 'reject')} leftIcon={<XCircle className="w-4 h-4" />}>Reject</Button>
              </div>
            </Card>
          ))}
        </div>
      }
      {reviewed.length > 0 && (
        <section className="space-y-2">
          <h3 className="font-bold text-sm text-on-surface">Previously Reviewed ({reviewed.length})</h3>
          {reviewed.slice(0, 20).map((request) => (
            <Card key={request.id} className="p-3 flex flex-wrap justify-between gap-2">
              <div><p className="text-sm font-semibold">{request.full_name}</p><p className="text-xs text-on-surface-variant">{request.email}</p></div>
              <span className="text-xs font-bold capitalize">{request.status}</span>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
