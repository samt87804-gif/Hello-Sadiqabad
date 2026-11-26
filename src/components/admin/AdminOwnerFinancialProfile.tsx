import React, { useCallback, useEffect, useState } from 'react';
import { fetchAdminOwnerFinancialProfile, correctPlanReceipt, reviewOwnerPaymentCorrectionRequest, reviewOwnerProfileChangeRequest, type AdminOwnerFinancialProfile } from '../../lib/api';
import { formatDateShort } from '../../lib/format';
import { Badge, Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { Input, Textarea } from '../ui/FormFields';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

type Props = { ownerId: string; ownerName: string; onClose: () => void };
type Row = Record<string, unknown>;
const text = (row: Row, key: string) => row[key] == null ? '' : String(row[key]);
const money = (value: unknown) => 'Rs. ' + Number(value ?? 0).toLocaleString('en-PK');
const statusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' =>
  status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';

export function AdminOwnerFinancialProfile({ ownerId, ownerName, onClose }: Props) {
  const { showToast } = useToast();
  const [data, setData] = useState<AdminOwnerFinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [correctingReceipt, setCorrectingReceipt] = useState<Row | null>(null);
  const [correctedAmount, setCorrectedAmount] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [reviewResponse, setReviewResponse] = useState('');
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setData(await fetchAdminOwnerFinancialProfile(ownerId)); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Owner financial profile could not be loaded.', 'error'); }
    finally { setLoading(false); }
  }, [ownerId, showToast]);
  useEffect(() => { void reload(); }, [reload]);

  const directCorrection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!correctingReceipt || saving) return;
    const amount = Number(correctedAmount);
    if (!Number.isFinite(amount) || amount < 0 || correctionReason.trim().length < 5) {
      showToast('Valid corrected amount aur reason (kam az kam 5 characters) required hai.', 'error');
      return;
    }
    setSaving(true);
    try {
      await correctPlanReceipt({ receiptId: text(correctingReceipt, 'id'), correctedAmountPkr: amount, reason: correctionReason });
      showToast(amount === 0 ? 'Receipt reversal audited adjustment ke sath record ho gayi.' : 'Receipt correction audited adjustment ke sath record ho gayi.', 'success');
      setCorrectingReceipt(null);
      setCorrectionReason('');
      await reload();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Receipt correction failed.', 'error'); }
    finally { setSaving(false); }
  };

  const reviewPayment = async (requestId: string, decision: 'approve' | 'reject') => {
    setSaving(true);
    try {
      await reviewOwnerPaymentCorrectionRequest(requestId, decision, reviewResponse);
      setReviewResponse('');
      showToast(decision === 'approve' ? 'Payment correction approved; net receipt updated.' : 'Payment correction request rejected.', 'success');
      await reload();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Payment correction review failed.', 'error'); }
    finally { setSaving(false); }
  };

  const reviewProfile = async (requestId: string, decision: 'approve' | 'reject') => {
    setSaving(true);
    try {
      await reviewOwnerProfileChangeRequest(requestId, decision, reviewResponse);
      setReviewResponse('');
      showToast(decision === 'approve' ? 'Owner profile changes approved.' : 'Owner profile request rejected.', 'success');
      await reload();
    } catch (error) { showToast(error instanceof Error ? error.message : 'Owner profile review failed.', 'error'); }
    finally { setSaving(false); }
  };

  return (
    <Modal open onClose={onClose} title={'Owner Financial Profile — ' + ownerName}>
      <div className="max-h-[78vh] overflow-y-auto space-y-5 pr-1">
        {loading && <p className="text-sm text-on-surface-variant">Loading financial profile…</p>}
        {data && <>
          <Card className="p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div><h3 className="font-bold text-on-surface">{data.owner.full_name || 'Owner'}</h3><p className="text-xs text-on-surface-variant">{data.owner.email || data.owner.id} · {data.owner.phone || 'No phone'}</p></div>
              <Badge variant={data.owner.is_active ? 'success' : 'danger'}>{data.owner.is_active ? 'Active account' : 'Suspended account'}</Badge>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ['Businesses', String(data.summary.business_count)],
                ['Received', money(data.summary.paid_pkr)],
                ['Outstanding', money(data.summary.outstanding_pkr)],
                ['Waived', money(data.summary.waived_pkr)],
              ].map(([label, value]) => <div key={label} className="rounded-xl bg-surface-container-low p-3"><p className="text-[11px] text-on-surface-variant">{label}</p><p className="font-extrabold text-sm text-on-surface tabular-nums">{value}</p></div>)}
            </div>
          </Card>

          <section className="space-y-2">
            <h3 className="font-bold text-on-surface">Businesses ({data.businesses.length})</h3>
            {data.businesses.map((business, index) => <Card key={text(business,'id') || index} className="p-3">
              <p className="font-semibold text-sm text-on-surface">{text(business,'name_en')}</p>
              <p className="text-xs text-on-surface-variant">{text(business,'status')} · {text(business,'plan_code').toUpperCase()} · Expires {text(business,'plan_expires_at') ? formatDateShort(text(business,'plan_expires_at')) : '—'}</p>
            </Card>)}
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-on-surface">Plan & Payment Assignment History ({data.assignments.length})</h3>
            {data.assignments.map((assignment,index) => <Card key={text(assignment,'assignment_id') || index} className="p-3 space-y-1">
              <div className="flex justify-between gap-2"><p className="font-semibold text-sm">{text(assignment,'business_name')} · {text(assignment,'plan_code').toUpperCase()}</p><span className="text-xs text-on-surface-variant">{text(assignment,'assignment_kind')}</span></div>
              <p className="text-xs text-on-surface-variant">Standard {money(assignment.standard_price_pkr)} · Agreed {money(assignment.agreed_fee_pkr)} · Waived {money(assignment.waived_amount_pkr)}</p>
              <p className="text-xs text-on-surface-variant">Received {money(assignment.received_pkr)} · Outstanding {money(assignment.outstanding_pkr)}</p>
              <p className="text-[11px] text-outline">{text(assignment,'source')} · {text(assignment,'assigned_at') ? formatDateShort(text(assignment,'assigned_at')) : ''}</p>
            </Card>)}
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-on-surface">Complete Receipt History ({data.receipts.length})</h3>
            {data.receipts.map((receipt,index) => <Card key={text(receipt,'id') || index} className="p-3 space-y-2">
              <div className="flex flex-wrap justify-between gap-2">
                <div><p className="font-semibold text-sm text-on-surface">{text(receipt,'business_name')} · {text(receipt,'plan_code').toUpperCase()}</p><p className="text-xs text-on-surface-variant">{text(receipt,'payment_method')} · {text(receipt,'transaction_reference') || 'No reference'} · {text(receipt,'received_at') ? formatDateShort(text(receipt,'received_at')) : ''}</p></div>
                <div className="text-right"><p className="font-extrabold text-on-surface">{money(receipt.net_amount_pkr)}</p><p className="text-[11px] text-on-surface-variant">Original {money(receipt.amount_pkr)} · Adjustments {money(receipt.adjustment_total_pkr)}</p></div>
              </div>
              {Array.isArray(receipt.adjustments) && receipt.adjustments.map((adjustment,index) => <p key={text(adjustment as Row,'id') || index} className="text-[11px] text-on-surface-variant">Adjustment {money((adjustment as Row).delta_pkr)} · {text(adjustment as Row,'adjustment_type')} · {text(adjustment as Row,'reason')}</p>)}
              <Button size="sm" variant="outline" onClick={() => { setCorrectingReceipt(receipt); setCorrectedAmount(String(receipt.net_amount_pkr ?? receipt.amount_pkr ?? 0)); setCorrectionReason(''); }}>Correct / Reverse receipt</Button>
              {correctingReceipt && text(correctingReceipt,'id') === text(receipt,'id') && <form onSubmit={directCorrection} className="space-y-2 border-t border-outline-variant/40 pt-3">
                <Input label="Correct net amount (PKR; enter 0 to reverse)" type="number" min="0" step="0.01" value={correctedAmount} onChange={(event) => setCorrectedAmount(event.target.value)} required />
                <Textarea label="Admin correction reason" value={correctionReason} onChange={(event) => setCorrectionReason(event.target.value)} rows={2} required />
                <div className="flex justify-end gap-2"><Button type="button" size="sm" variant="outline" onClick={() => setCorrectingReceipt(null)}>Cancel</Button><Button type="submit" size="sm" disabled={saving}>{saving ? 'Saving…' : 'Save audited correction'}</Button></div>
              </form>}
            </Card>)}
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-on-surface">Owner Payment Correction Requests</h3>
            {data.payment_correction_requests.map((request,index) => <Card key={text(request,'id') || index} className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">Requested: {money(request.requested_amount_pkr)}</p><Badge variant={statusVariant(text(request,'status'))}>{text(request,'status')}</Badge></div>
              <p className="text-xs text-on-surface-variant">{text(request,'reason')}</p>
              {text(request,'evidence_reference') && <p className="text-xs text-on-surface-variant">Evidence/reference: {text(request,'evidence_reference')}</p>}
              {text(request,'admin_response') && <p className="text-xs text-on-surface-variant">Admin response: {text(request,'admin_response')}</p>}
              {text(request,'status') === 'pending' && <div className="space-y-2"><Textarea label="Admin response (optional)" value={reviewResponse} onChange={(event) => setReviewResponse(event.target.value)} rows={2} /><div className="flex gap-2 justify-end"><Button size="sm" variant="outline" disabled={saving} onClick={() => void reviewPayment(text(request,'id'),'reject')}>Reject</Button><Button size="sm" disabled={saving} onClick={() => void reviewPayment(text(request,'id'),'approve')}>Approve correction</Button></div></div>}
            </Card>)}
            {data.payment_correction_requests.length===0 && <p className="text-xs text-on-surface-variant">No correction requests.</p>}
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-on-surface">Owner Profile Change Requests</h3>
            {data.profile_change_requests.map((request,index) => <Card key={text(request,'id') || index} className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">Profile update request</p><Badge variant={statusVariant(text(request,'status'))}>{text(request,'status')}</Badge></div>
              <p className="text-xs text-on-surface-variant">Name: {text(request,'current_full_name') || '—'} → {text(request,'requested_full_name') || 'No change'}</p>
              <p className="text-xs text-on-surface-variant">Phone: {text(request,'current_phone') || '—'} → {text(request,'requested_phone') || 'No change'}</p>
              <p className="text-xs text-on-surface-variant">{text(request,'reason')}</p>
              {text(request,'admin_response') && <p className="text-xs text-on-surface-variant">Admin response: {text(request,'admin_response')}</p>}
              {text(request,'status') === 'pending' && <div className="space-y-2"><Textarea label="Admin response (optional)" value={reviewResponse} onChange={(event) => setReviewResponse(event.target.value)} rows={2} /><div className="flex gap-2 justify-end"><Button size="sm" variant="outline" disabled={saving} onClick={() => void reviewProfile(text(request,'id'),'reject')}>Reject</Button><Button size="sm" disabled={saving} onClick={() => void reviewProfile(text(request,'id'),'approve')}>Approve profile change</Button></div></div>}
            </Card>)}
            {data.profile_change_requests.length===0 && <p className="text-xs text-on-surface-variant">No profile change requests.</p>}
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-on-surface">Admin Audit Trail</h3>
            {data.audit.slice(0,30).map((entry,index) => <p key={text(entry,'id') || index} className="text-xs text-on-surface-variant border-b border-outline-variant/30 py-1">{text(entry,'action')} · {text(entry,'entity')} · {text(entry,'created_at') ? formatDateShort(text(entry,'created_at')) : ''}</p>)}
            {data.audit.length===0 && <p className="text-xs text-on-surface-variant">No related audit events found.</p>}
          </section>
        </>}
        <div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => void reload()}>Refresh profile</Button><Button size="sm" onClick={onClose}>Close</Button></div>
      </div>
    </Modal>
  );
}
