import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BrainCircuit, CheckCircle2, Clock3, LoaderCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { getSupabaseClient } from '../../lib/supabase';
import { Card, Badge } from '../ui/Surface';
import { useToast } from '../ui/Toast';

type SyncRun = {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'failed';
  stage: string;
  progress_percent: number;
  source_status: Record<string, string>;
  source_counts: Record<string, number>;
  total_records: number;
  error_summary: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  business_directory: 'Published businesses',
  categories: 'Categories',
  areas: 'Sadiqabad areas',
  emergency_contacts: 'Emergency contacts / helplines',
  local_authorities: 'Local authorities',
  owner_public_profile_directory: 'Public owner profiles',
  authority_profiles: 'Authority profiles',
  news_articles: 'Published news',
  pages: 'Published website pages',
  business_products: 'Business products',
  offers: 'Current offers',
  announcements: 'Active announcements',
  site_settings: 'Public website settings',
};

function formatDate(value?: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Karachi',
  }).format(date);
}

async function getAccessToken() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Live Supabase session is not available. Demo mode cannot run a production sync.');
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again to refresh chatbot knowledge.');
  return token;
}

export function AdminChatbotKnowledge() {
  const { showToast } = useToast();
  const [runs, setRuns] = useState<SyncRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/chat/sync', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error || 'Chatbot sync history could not be loaded.');
      setRuns(Array.isArray(body.runs) ? body.runs : []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Chatbot sync history could not be loaded.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { void loadRuns(); }, [loadRuns]);

  const runFullRefresh = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const token = await getAccessToken();
      const response = await fetch('/api/chat/sync', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mode: 'full' }),
      });
      const body = await response.json();
      await loadRuns();
      if (!response.ok) throw new Error(body?.error || 'Chatbot knowledge refresh failed.');
      showToast('Chatbot ki public knowledge successfully refresh ho gayi.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Chatbot knowledge refresh failed.', 'error');
    } finally {
      setSyncing(false);
    }
  };

  const lastSuccess = runs.find((run) => run.status === 'success');
  const latestRun = runs[0];

  return (
    <div className="space-y-5">
      <Card className="p-4 sm:p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-lg font-bold">Chatbot Knowledge Centre</h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Public businesses, categories, areas, news aur website information ka secure full refresh.
            </p>
          </div>
          <Badge variant="success">Super Admin</Badge>
        </div>

        <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low p-3 flex gap-2.5">
          <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-xs text-on-surface-variant">
            Sirf published aur public information refresh hoti hai. Private admin/owner records include nahi hote.
            Yeh retrieval knowledge ko refresh karta hai; AI model ke weights ki fine-tuning nahi karta.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-outline-variant/50 p-3">
            <p className="text-[11px] text-on-surface-variant">Last successful full refresh</p>
            <p className="text-sm font-bold mt-1">{lastSuccess ? formatDate(lastSuccess.completed_at) : 'No successful manual refresh yet'}</p>
          </div>
          <div className="rounded-xl border border-outline-variant/50 p-3">
            <p className="text-[11px] text-on-surface-variant">Latest refresh status</p>
            <div className="mt-1 flex items-center gap-2">
              {latestRun ? (
                <>
                  <Badge variant={latestRun.status === 'success' ? 'success' : latestRun.status === 'failed' ? 'danger' : 'warning'}>
                    {latestRun.status}
                  </Badge>
                  <span className="text-xs text-on-surface-variant">{formatDate(latestRun.started_at)}</span>
                </>
              ) : <span className="text-sm font-semibold">Not run yet</span>}
            </div>
          </div>
        </div>

        {syncing && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2" role="status" aria-live="polite">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <LoaderCircle className="w-4 h-4 animate-spin" />
              Public knowledge sources refresh ho rahe hain…
            </div>
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full w-1/2 bg-primary rounded-full animate-pulse" />
            </div>
            <p className="text-[11px] text-on-surface-variant">Is process ke dauran page band na karein.</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={runFullRefresh}
            disabled={syncing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary px-4 py-3 text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {syncing ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncing ? 'Refreshing public knowledge…' : 'Train / Sync Latest Information to Chatbot'}
          </button>
          <button
            type="button"
            onClick={() => void loadRuns()}
            disabled={loading || syncing}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-4 py-3 text-sm font-semibold hover:bg-surface-container-low disabled:opacity-50"
          >
            <Clock3 className="w-4 h-4" />
            Refresh status
          </button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-bold text-sm">Latest source-by-source report</h3>
          {latestRun && <Badge variant={latestRun.status === 'success' ? 'success' : latestRun.status === 'failed' ? 'danger' : 'warning'}>{latestRun.status}</Badge>}
        </div>
        {loading ? (
          <p className="text-sm text-on-surface-variant">Loading sync report…</p>
        ) : !latestRun ? (
          <p className="text-sm text-on-surface-variant">Abhi manual sync nahi hui. Chatbot normal chat requests par public information live retrieve karta rehta hai.</p>
        ) : (
          <>
            {latestRun.stage && <p className="text-xs text-on-surface-variant">{latestRun.stage}</p>}
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${Math.max(0, Math.min(100, latestRun.progress_percent || 0))}%` }} />
            </div>
            <p className="text-[11px] text-on-surface-variant">{latestRun.progress_percent || 0}% · {latestRun.total_records.toLocaleString('en-PK')} records across sources</p>
            <div className="divide-y divide-outline-variant/40">
              {Object.entries(SOURCE_LABELS).map(([key, label]) => {
                const status = latestRun.source_status?.[key] || 'not_reported';
                const count = latestRun.source_counts?.[key] ?? (key === 'business_directory' ? latestRun.source_counts?.businesses : undefined);
                return (
                  <div key={key} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium">{label}</p>
                      <p className="text-[10px] text-on-surface-variant">{count === undefined ? 'Record count unavailable' : `${Number(count).toLocaleString('en-PK')} records`}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {status === 'loaded' ? <CheckCircle2 className="w-4 h-4 text-success" /> : status === 'unavailable' ? <AlertCircle className="w-4 h-4 text-error" /> : <Clock3 className="w-4 h-4 text-on-surface-variant" />}
                      <span className="text-[11px] capitalize text-on-surface-variant">{status.replaceAll('_', ' ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            {latestRun.error_summary && (
              <div className="rounded-xl bg-error-container/40 text-error p-3 text-xs">
                <strong>Refresh error:</strong> {latestRun.error_summary}
              </div>
            )}
          </>
        )}
      </Card>

      <Card className="p-4 sm:p-5 space-y-3">
        <h3 className="font-bold text-sm">Recent refresh history</h3>
        {runs.length === 0 ? <p className="text-xs text-on-surface-variant">No refresh history yet.</p> : runs.slice(0, 5).map((run) => (
          <div key={run.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-outline-variant/40 last:border-0 pb-2 last:pb-0">
            <div>
              <p className="text-xs font-semibold">{formatDate(run.started_at)}</p>
              <p className="text-[10px] text-on-surface-variant">{run.stage || 'Knowledge refresh'}</p>
            </div>
            <Badge variant={run.status === 'success' ? 'success' : run.status === 'failed' ? 'danger' : 'warning'}>{run.status}</Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}
