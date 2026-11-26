import React, { useCallback, useEffect, useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import {
  fetchAdminFinanceBalances,
  fetchAdminFinanceDashboard,
  fetchAdminFinanceLedger,
  recordPlanInstallment,
  type AdminFinanceBalance,
  type AdminFinanceReceipt,
  type AdminFinanceSummary,
} from '../../lib/api';
import { Button } from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Surface';
import { useToast } from '../ui/Toast';

const money = (value: number | string | null | undefined) =>
  'Rs. ' + Number(value ?? 0).toLocaleString('en-PK', { maximumFractionDigits: 2 });
const dateTime = (value: string | null) => value ? new Date(value).toLocaleString('en-PK') : '—';
const dateOnly = (value: string | null) => value ? new Date(value).toLocaleDateString('en-PK') : '—';
const digitalMethods = ['jazzcash', 'easypaisa', 'ubl', 'bank_transfer'];

function dateToIsoStart(value: string) {
  return value ? new Date(value + 'T00:00:00+05:00').toISOString() : null;
}
function dateToIsoExclusiveEnd(value: string) {
  if (!value) return null;
  const next = new Date(value + 'T00:00:00+05:00');
  next.setDate(next.getDate() + 1);
  return next.toISOString();
}
function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return '"' + text.replace(/"/g, '""') + '"';
}

export function AdminFinance() {
  const { showToast } = useToast();
  const [summary, setSummary] = useState<AdminFinanceSummary | null>(null);
  const [receipts, setReceipts] = useState<AdminFinanceReceipt[]>([]);
  const [balances, setBalances] = useState<AdminFinanceBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [plan, setPlan] = useState('');
  const [method, setMethod] = useState('');
  const [source, setSource] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [balanceSearch, setBalanceSearch] = useState('');
  const [installmentTarget, setInstallmentTarget] = useState<AdminFinanceBalance | null>(null);
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [installmentMethod, setInstallmentMethod] = useState('');
  const [installmentReference, setInstallmentReference] = useState('');
  const [installmentNote, setInstallmentNote] = useState('');
  const [savingInstallment, setSavingInstallment] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [dashboard, ledger, outstanding] = await Promise.all([
        fetchAdminFinanceDashboard(),
        fetchAdminFinanceLedger({
          search, plan, method, source,
          from: dateToIsoStart(fromDate),
          to: dateToIsoExclusiveEnd(toDate),
        }),
        fetchAdminFinanceBalances(balanceSearch),
      ]);
      setSummary(dashboard);
      setReceipts(ledger);
      setBalances(outstanding);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Finance data load nahi ho saka.', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, plan, method, source, fromDate, toDate, balanceSearch, showToast]);

  useEffect(() => { void reload(); }, [reload]);

  const exportCsv = () => {
    const columns = [
      'Business', 'Owner', 'Plan', 'Amount received (PKR)', 'Payment method',
      'Transaction reference', 'Received at', 'Recorded at', 'Recorded by', 'Receipt source',
      'Period start', 'Period end',
    ];
    const rows = receipts.map((row) => [
      row.business_name, row.owner_name, row.plan_code, row.amount_pkr, row.payment_method,
      row.transaction_reference, row.received_at, row.recorded_at, row.recorded_by_name,
      row.receipt_source, row.period_start, row.period_end,
    ]);
    const csv = [columns, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hello-sadiqabad-finance-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const openInstallment = (balance: AdminFinanceBalance) => {
    setInstallmentTarget(balance);
    setInstallmentAmount('');
    setInstallmentMethod('');
    setInstallmentReference('');
    setInstallmentNote('');
  };

  const submitInstallment = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!installmentTarget || savingInstallment) return;
    const amount = Number(installmentAmount);
    if (!Number.isFinite(amount) || amount <= 0 || amount > installmentTarget.outstanding_pkr) {
      showToast('Installment outstanding balance se zyada nahi ho sakti.', 'error');
      return;
    }
    if (!installmentMethod) {
      showToast('Payment method select karein.', 'error');
      return;
    }
    if (digitalMethods.includes(installmentMethod) && !installmentReference.trim()) {
      showToast('Digital payment reference darj karein.', 'error');
      return;
    }
    setSavingInstallment(true);
    try {
      await recordPlanInstallment({
        assignmentId: installmentTarget.assignment_id,
        amountPkr: amount,
        paymentMethod: installmentMethod,
        transactionReference: installmentReference,
        adminNote: installmentNote,
      });
      showToast('Installment receipt ledger mein add ho gayi.', 'success');
      setInstallmentTarget(null);
      await reload();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Installment record nahi ho saki.', 'error');
    } finally {
      setSavingInstallment(false);
    }
  };

  const metricCards: Array<[string, number]> = summary ? [
    ['Received today', summary.received_today_pkr],
    ['Received this month', summary.received_month_pkr],
    ['Received lifetime', summary.received_lifetime_pkr],
    ['Outstanding balance', summary.outstanding_pkr],
    ['Waived / discounted', summary.waived_lifetime_pkr],
    ['Basic collections', summary.basic_collections_pkr],
    ['Premium collections', summary.premium_collections_pkr],
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-on-surface">Finance & Payments</h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">Actual receipts are income. Waivers and outstanding amounts are reported separately.</p>
        </div>
        <Button variant="outline" onClick={() => void reload()} loading={loading} leftIcon={<RefreshCw className="w-4 h-4" />}>Refresh</Button>
      </div>

      {loading && !summary ? (
        <Card className="p-6 text-sm text-on-surface-variant">Loading financial records…</Card>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {metricCards.map(([label, value]) => (
              <Card key={label} className="p-4">
                <p className="text-[11px] font-semibold text-on-surface-variant">{label}</p>
                <p className="text-lg sm:text-xl font-extrabold text-on-surface tabular-nums mt-1">{money(value)}</p>
              </Card>
            ))}
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-on-surface-variant">Active paid plans</p>
              <p className="text-lg sm:text-xl font-extrabold text-on-surface tabular-nums mt-1">{summary?.active_paid_subscriptions ?? 0}</p>
            </Card>
            <Card className="p-4">
              <p className="text-[11px] font-semibold text-on-surface-variant">Expiring in 14 days</p>
              <p className="text-lg sm:text-xl font-extrabold text-on-surface tabular-nums mt-1">{summary?.expiring_in_14_days ?? 0}</p>
            </Card>
          </div>

          <Card className="p-4 space-y-3">
            <h2 className="text-sm font-bold text-on-surface">Collections breakdown</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-on-surface-variant mb-1">By payment method</p>
                {Object.entries(summary?.payment_methods ?? {}).length ? Object.entries(summary?.payment_methods ?? {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-outline-variant/30"><span className="capitalize">{key.replace('_', ' ')}</span><strong>{money(value)}</strong></div>
                )) : <p className="text-on-surface-variant">No receipts yet.</p>}
              </div>
              <div>
                <p className="text-on-surface-variant mb-1">Assignments</p>
                {Object.entries(summary?.assignment_kinds ?? {}).length ? Object.entries(summary?.assignment_kinds ?? {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-1 border-b border-outline-variant/30"><span className="capitalize">{key}</span><strong>{value}</strong></div>
                )) : <p className="text-on-surface-variant">No plan assignments yet.</p>}
              </div>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Payment ledger</h2>
                <p className="text-[11px] text-on-surface-variant">One row per actual received payment · latest 1,000 receipts</p>
              </div>
              <Button size="sm" variant="outline" onClick={exportCsv} disabled={!receipts.length} leftIcon={<Download className="w-4 h-4" />}>Export CSV</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <Input label="Search business / owner / reference" value={search} onChange={(event) => setSearch(event.target.value)} />
              <Select label="Plan" value={plan} onChange={(event) => setPlan(event.target.value)}>
                <option value="">All plans</option><option value="basic">Basic</option><option value="premium">Premium</option>
              </Select>
              <Select label="Payment method" value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="">All methods</option>
                <option value="jazzcash">JazzCash</option><option value="easypaisa">Easypaisa</option>
                <option value="ubl">UBL</option><option value="bank_transfer">Bank transfer</option>
                <option value="cash">Cash</option><option value="other">Other</option>
              </Select>
              <Select label="Receipt source" value={source} onChange={(event) => setSource(event.target.value)}>
                <option value="">All sources</option><option value="owner_request">Owner request</option>
                <option value="direct_assignment">Direct assignment</option><option value="installment">Installment</option>
              </Select>
              <Input label="From date (Pakistan time)" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
              <Input label="To date (Pakistan time)" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </div>
            <div className="flex justify-end"><Button size="sm" onClick={() => void reload()} loading={loading}>Apply filters</Button></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-xs text-left">
                <thead><tr className="border-b border-outline-variant text-on-surface-variant">
                  {['Received', 'Business / Owner', 'Plan period', 'Amount', 'Method / Reference', 'Source', 'Recorded by'].map((label) => <th key={label} className="p-2 font-semibold">{label}</th>)}
                </tr></thead>
                <tbody>
                  {receipts.map((row) => (
                    <tr key={row.receipt_id} className="border-b border-outline-variant/40">
                      <td className="p-2 whitespace-nowrap">{dateTime(row.received_at)}</td>
                      <td className="p-2"><strong>{row.business_name}</strong><div className="text-on-surface-variant">{row.owner_name || 'No owner linked'}</div></td>
                      <td className="p-2"><span className="uppercase font-bold">{row.plan_code}</span><div className="text-on-surface-variant">{dateOnly(row.period_start)} – {dateOnly(row.period_end)}</div></td>
                      <td className="p-2 font-bold tabular-nums">{money(row.amount_pkr)}</td>
                      <td className="p-2"><span className="capitalize">{row.payment_method.replace('_', ' ')}</span><div className="text-on-surface-variant">{row.transaction_reference || '—'}</div></td>
                      <td className="p-2 capitalize">{row.receipt_source.replace('_', ' ')}</td>
                      <td className="p-2">{row.recorded_by_name || 'System'}</td>
                    </tr>
                  ))}
                  {!receipts.length && <tr><td colSpan={7} className="p-6 text-center text-on-surface-variant">No receipts match these filters.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><h2 className="text-sm font-bold text-on-surface">Outstanding balances</h2><p className="text-[11px] text-on-surface-variant">Installments reduce balance; previous receipts are never edited.</p></div>
              <div className="w-full sm:max-w-xs"><Input label="Search business / owner" value={balanceSearch} onChange={(event) => setBalanceSearch(event.target.value)} /></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-xs text-left">
                <thead><tr className="border-b border-outline-variant text-on-surface-variant">
                  {['Business / Owner', 'Plan', 'Agreed fee', 'Received', 'Outstanding', 'Period', 'Action'].map((label) => <th key={label} className="p-2 font-semibold">{label}</th>)}
                </tr></thead>
                <tbody>
                  {balances.map((row) => (
                    <tr key={row.assignment_id} className="border-b border-outline-variant/40">
                      <td className="p-2"><strong>{row.business_name}</strong><div className="text-on-surface-variant">{row.owner_name || 'No owner linked'}</div></td>
                      <td className="p-2 uppercase font-bold">{row.plan_code}</td>
                      <td className="p-2">{money(row.agreed_fee_pkr)}</td>
                      <td className="p-2">{money(row.received_pkr)}</td>
                      <td className="p-2 font-extrabold text-error">{money(row.outstanding_pkr)}</td>
                      <td className="p-2">{dateOnly(row.period_start)} – {dateOnly(row.period_end)}</td>
                      <td className="p-2"><Button size="sm" onClick={() => openInstallment(row)}>Record installment</Button></td>
                    </tr>
                  ))}
                  {!balances.length && <tr><td colSpan={7} className="p-6 text-center text-on-surface-variant">No outstanding balances.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <Modal open={Boolean(installmentTarget)} onClose={() => !savingInstallment && setInstallmentTarget(null)} title="Record plan payment installment">
        {installmentTarget && (
          <form onSubmit={submitInstallment} className="space-y-3">
            <div className="rounded-xl bg-surface-container-low p-3 text-xs">
              <strong>{installmentTarget.business_name}</strong>
              <p className="text-on-surface-variant mt-1">Outstanding: {money(installmentTarget.outstanding_pkr)}</p>
            </div>
            <Input label="Amount received (Rs.)" type="number" min="0.01" max={installmentTarget.outstanding_pkr} step="0.01" required value={installmentAmount} onChange={(event) => setInstallmentAmount(event.target.value)} />
            <Select label="Payment method" required value={installmentMethod} onChange={(event) => setInstallmentMethod(event.target.value)}>
              <option value="">Select method</option><option value="jazzcash">JazzCash</option><option value="easypaisa">Easypaisa</option>
              <option value="ubl">UBL</option><option value="bank_transfer">Bank transfer</option><option value="cash">Cash</option><option value="other">Other</option>
            </Select>
            <Input label={'Transaction / reference ' + (digitalMethods.includes(installmentMethod) ? '(required)' : '(optional)')} value={installmentReference} maxLength={120} required={digitalMethods.includes(installmentMethod)} onChange={(event) => setInstallmentReference(event.target.value)} />
            <Textarea label="Internal note (optional)" rows={2} value={installmentNote} onChange={(event) => setInstallmentNote(event.target.value)} />
            <div className="flex justify-end gap-2"><Button variant="outline" disabled={savingInstallment} onClick={() => setInstallmentTarget(null)}>Cancel</Button><Button type="submit" loading={savingInstallment}>Save receipt</Button></div>
          </form>
        )}
      </Modal>
    </div>
  );
}
