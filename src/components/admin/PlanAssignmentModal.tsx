import React, { useEffect, useState } from 'react';
import type { BusinessPublicView } from '../../types/directory';
import type { PlanCode } from '../../types/database';
import { assignBusinessPlan } from '../../lib/api';
import { formatDateShort } from '../../lib/format';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';

const STANDARD_PRICES: Record<PlanCode, number> = { free: 0, basic: 700, premium: 1500 };
const money = (value: number) => 'Rs. ' + value.toLocaleString('en-PK', { maximumFractionDigits: 2 });

export function PlanAssignmentModal({
  business,
  onClose,
  onSuccess,
}: {
  business: BusinessPublicView | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const { showToast } = useToast();
  const [planCode, setPlanCode] = useState<PlanCode>('free');
  const [agreedFee, setAgreedFee] = useState('0');
  const [receivedNow, setReceivedNow] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!business) return;
    setPlanCode(business.plan_code);
    setAgreedFee(String(STANDARD_PRICES[business.plan_code]));
    setReceivedNow('0');
    setPaymentMethod('');
    setReference('');
    setNote('');
  }, [business?.id]);

  const standardPrice = STANDARD_PRICES[planCode];
  const agreed = Number(agreedFee);
  const received = Number(receivedNow);
  const validAmounts = Number.isFinite(agreed) && Number.isFinite(received) &&
    agreed >= 0 && agreed <= standardPrice && received >= 0 && received <= agreed;
  const waived = Math.max(0, standardPrice - (Number.isFinite(agreed) ? agreed : 0));
  const outstanding = Math.max(0, (Number.isFinite(agreed) ? agreed : 0) - (Number.isFinite(received) ? received : 0));
  const digitalMethod = ['jazzcash', 'easypaisa', 'ubl', 'bank_transfer'].includes(paymentMethod);
  const needsReason = agreed < standardPrice;
  const currentExpiry = business?.plan_expires_at && Date.parse(business.plan_expires_at) > Date.now()
    ? formatDateShort(business.plan_expires_at)
    : 'Today';
  const activationText = planCode === 'free'
    ? 'Free plan has no expiry date.'
    : 'The paid period starts from ' + currentExpiry + ' (whichever is later than today) and runs for one month.';

  const changePlan = (value: string) => {
    const next = value as PlanCode;
    setPlanCode(next);
    setAgreedFee(String(STANDARD_PRICES[next]));
    setReceivedNow('0');
    setPaymentMethod('');
    setReference('');
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!business || saving) return;
    if (!validAmounts) {
      showToast('Agreed fee aur received amount check karein. Received amount fee se zyada nahi ho sakti.', 'error');
      return;
    }
    if (needsReason && !note.trim()) {
      showToast('Discount ya waiver ki wajah likhna zaroori hai.', 'error');
      return;
    }
    if (received > 0 && !paymentMethod) {
      showToast('Received payment ka method select karein.', 'error');
      return;
    }
    if (received > 0 && digitalMethod && !reference.trim()) {
      showToast('Digital payment ka transaction/reference number darj karein.', 'error');
      return;
    }
    setSaving(true);
    try {
      await assignBusinessPlan({
        businessId: business.id,
        planCode,
        agreedFeePkr: agreed,
        receivedNowPkr: received,
        paymentMethod: received > 0 ? paymentMethod : null,
        transactionReference: received > 0 ? reference : null,
        adminNote: note,
      });
      showToast(business.name_en + ' ka ' + planCode.toUpperCase() + ' plan assign ho gaya.', 'success');
      await onSuccess();
      onClose();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Plan assign nahi ho saka.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={Boolean(business)}
      onClose={() => !saving && onClose()}
      title={business ? 'Assign / Change Plan — ' + business.name_en : 'Assign / Change Plan'}
      maxWidthClass="max-w-2xl"
    >
      {business && (
        <form onSubmit={submit} className="space-y-4">
          <div className="rounded-xl bg-surface-container-low p-3 text-sm">
            <p className="font-bold text-on-surface">{business.name_en}</p>
            <p className="text-xs text-on-surface-variant mt-1">
              Current plan: {business.plan_code.toUpperCase()}
              {business.plan_expires_at ? ' · Expiry: ' + formatDateShort(business.plan_expires_at) : ' · No expiry date'}
            </p>
          </div>

          <Select label="New Plan" value={planCode} onChange={(event) => changePlan(event.target.value)}>
            <option value="free">Free — Rs. 0</option>
            <option value="basic">Basic — Rs. 700 / month</option>
            <option value="premium">Premium — Rs. 1,500 / month</option>
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Standard monthly price (Rs.)" value={String(standardPrice)} readOnly />
            <Input
              label="Agreed / chargeable fee (Rs.)"
              type="number" min="0" max={standardPrice} step="0.01" required
              value={agreedFee} onChange={(event) => setAgreedFee(event.target.value)}
            />
            <Input
              label="Amount received now (Rs.)"
              type="number" min="0" max={Number.isFinite(agreed) ? agreed : standardPrice}
              step="0.01" required value={receivedNow}
              onChange={(event) => setReceivedNow(event.target.value)}
            />
            {received > 0 && (
              <Select label="Payment method" required value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
                <option value="">Select method</option>
                <option value="jazzcash">JazzCash</option>
                <option value="easypaisa">Easypaisa</option>
                <option value="ubl">UBL</option>
                <option value="bank_transfer">Other bank transfer</option>
                <option value="cash">Cash</option>
                <option value="other">Other</option>
              </Select>
            )}
          </div>

          {received > 0 && (
            <Input
              label={'Transaction / reference number ' + (digitalMethod ? '(required)' : '(optional)')}
              value={reference} maxLength={120}
              onChange={(event) => setReference(event.target.value)}
              required={digitalMethod}
            />
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              ['Standard', standardPrice],
              ['Waived / discount', waived],
              ['Received', Number.isFinite(received) ? received : 0],
              ['Outstanding', outstanding],
            ].map(([label, value]) => (
              <div key={String(label)} className="rounded-xl border border-outline-variant/50 p-3">
                <p className="text-[10px] text-on-surface-variant">{label}</p>
                <p className="text-sm font-extrabold tabular-nums mt-1">{money(Number(value))}</p>
              </div>
            ))}
          </div>

          <p className="text-xs text-on-surface-variant">{activationText}</p>
          {needsReason ? (
            <Textarea
              label="Reason for discount / waiver (required)"
              rows={3} maxLength={1000} required value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Write why the fee is reduced or fully waived..."
            />
          ) : (
            <Textarea
              label="Internal Admin note (optional)"
              rows={2} maxLength={1000} value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Internal note..."
            />
          )}

          {!validAmounts && <p className="text-xs text-error">Amounts invalid hain. Received amount agreed fee se zyada nahi ho sakti.</p>}
          <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/30">
            <Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={!validAmounts}>Confirm Plan Assignment</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
