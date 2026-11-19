import React, { useEffect, useMemo, useState } from 'react';
import { Activity, BarChart3, Download, Eye, MonitorSmartphone, Users } from 'lucide-react';
import { fetchAdminLiveVisitorCount, fetchSiteAnalyticsReport, type SiteAnalyticsReport } from '../../lib/api';
import { Card } from '../ui/Surface';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

type RangeDays = 7 | 30 | 90;

function Metric({ label, value, icon: Icon, detail }: {
  label: string; value: string; icon: React.ElementType; detail?: string;
}) {
  return (
    <Card className="p-4 space-y-2">
      <div className="flex items-center justify-between text-on-surface-variant">
        <span className="text-xs font-semibold">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-2xl font-black tabular-nums text-on-surface">{value}</div>
      {detail && <div className="text-[11px] text-on-surface-variant">{detail}</div>}
    </Card>
  );
}

function HorizontalRows({ title, rows, labelKey, valueKey }: {
  title: string;
  rows: Array<Record<string, unknown>>;
  labelKey: string;
  valueKey: string;
}) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey]) || 0));
  return (
    <Card className="p-4 space-y-3">
      <h3 className="text-sm font-bold text-on-surface">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-xs text-on-surface-variant">No recorded activity in this period.</p>
      ) : rows.map((row, index) => {
        const value = Number(row[valueKey]) || 0;
        return (
          <div key={String(row[labelKey]) + index} className="space-y-1">
            <div className="flex justify-between gap-3 text-xs">
              <span className="truncate text-on-surface">{String(row[labelKey])}</span>
              <strong className="tabular-nums text-on-surface">{value.toLocaleString()}</strong>
            </div>
            <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
              <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, (value / max) * 100)}%` }} />
            </div>
          </div>
        );
      })}
    </Card>
  );
}

export function AdvancedAnalyticsPanel() {
  const { showToast } = useToast();
  const [days, setDays] = useState<RangeDays>(30);
  const [report, setReport] = useState<SiteAnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveVisitors, setLiveVisitors] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchSiteAnalyticsReport(days).then((data) => {
      if (!cancelled) setReport(data);
    }).catch((reason) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : 'Could not load site analytics.');
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [days]);

  const exportCsv = () => {
    if (!report) return;
    const rows = [
      ['date', 'page_views', 'searches', 'cta_clicks', 'content_shares'],
      ...report.daily.map((item) => [item.date, item.page_views, item.searches, item.cta_clicks, item.content_shares]),
    ];
    const csvCell = (value: unknown) => {
      const raw = String(value ?? '');
      // Prefix spreadsheet formula starters so exported text cannot execute as a formula.
      const safe = /^[\\t\\r\\n ]*[=+@-]/.test(raw) ? `'${raw}` : raw;
      return /[",\\r\\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
    };
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\\r\\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `hello-sadiqabad-site-analytics-${days}d.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    showToast('Site analytics CSV exported.', 'success');
  };

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      void fetchAdminLiveVisitorCount()
        .then((count) => { if (!cancelled) setLiveVisitors(count); })
        .catch(() => { if (!cancelled) setLiveVisitors(null); });
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  const maxDaily = useMemo(() => Math.max(1, ...(report?.daily ?? []).map((d) => d.page_views)), [report]);
  const summary = report?.summary;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-on-surface">Advanced Site Analytics</h2>
          <p className="text-xs text-on-surface-variant">Privacy-minimized first-party activity · Asia/Karachi</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-surface-container-low p-1 gap-1">
            {([7, 30, 90] as const).map((value) => (
              <button key={value} type="button" onClick={() => setDays(value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${days === value ? 'bg-primary text-on-primary' : 'text-on-surface-variant'}`}>
                {value}d
              </button>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv} disabled={!report}>
            <Download className="w-4 h-4 mr-1" /> Export CSV
          </Button>
        </div>
      </div>

      {loading && <Card className="p-6 text-sm text-on-surface-variant">Loading live site analytics…</Card>}
      {!loading && error && (
        <Card className="p-5 border border-error/30 space-y-2">
          <p className="text-sm font-semibold text-error">Analytics report unavailable</p>
          <p className="text-xs text-on-surface-variant">{error}</p>
        </Card>
      )}
      {!loading && report && summary && (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
            <Metric label="Live Visitors" value={liveVisitors === null ? "—" : liveVisitors.toLocaleString()} icon={Activity} detail="Active in last 5 minutes · refreshes every 30s" />
            <Metric label="Page Views" value={summary.page_views.toLocaleString()} icon={Eye} />
            <Metric label="Unique Visitors" value={summary.unique_visitors.toLocaleString()} icon={Users} detail="Pseudonymous, 30-day browser ID" />
            <Metric label="Sessions" value={summary.sessions.toLocaleString()} icon={Activity} />
            <Metric label="Avg. Engagement" value={`${summary.avg_engagement_seconds}s`} icon={BarChart3} detail={`${summary.pages_per_session} pages per session`} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2 p-4 space-y-3">
              <h3 className="text-sm font-bold text-on-surface">Daily Page Views</h3>
              {report.daily.length === 0 ? (
                <p className="text-xs text-on-surface-variant">No page-view events recorded yet.</p>
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto">
                  {report.daily.map((day) => (
                    <div key={day.date} className="min-w-3 flex-1 flex flex-col items-center justify-end gap-1 h-full">
                      <span className="text-[9px] tabular-nums text-on-surface-variant">{day.page_views}</span>
                      <div title={`${day.date}: ${day.page_views} views`} className="w-full max-w-5 rounded-t bg-primary"
                        style={{ height: `${Math.max(2, (day.page_views / maxDaily) * 100)}%` }} />
                      <span className="text-[8px] text-on-surface-variant [writing-mode:vertical-rl]">{day.date.slice(5)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card className="p-4 space-y-3">
              <h3 className="text-sm font-bold text-on-surface">Search & Engagement</h3>
              <div className="flex justify-between text-xs"><span>Searches</span><strong>{report.search.searches.toLocaleString()}</strong></div>
              <div className="flex justify-between text-xs"><span>Zero-result searches</span><strong>{report.search.zero_result_searches.toLocaleString()}</strong></div>
              <div className="flex justify-between text-xs"><span>Returning visitors</span><strong>{summary.returning_visitors.toLocaleString()}</strong></div>
              {report.engagement.map((item) => (
                <div key={item.event_name} className="flex justify-between text-xs">
                  <span>{item.event_name.replace('_', ' ')}</span><strong>{item.total.toLocaleString()}</strong>
                </div>
              ))}
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HorizontalRows title="Top Pages" rows={report.top_pages as unknown as Array<Record<string, unknown>>} labelKey="page_path" valueKey="views" />
            <HorizontalRows title="Acquisition Channels" rows={report.channels as unknown as Array<Record<string, unknown>>} labelKey="channel" valueKey="page_views" />
            <HorizontalRows title="Devices" rows={report.devices as unknown as Array<Record<string, unknown>>} labelKey="device_class" valueKey="page_views" />
          </div>
        </>
      )}
      <Card className="p-4 flex gap-3 items-start">
        <MonitorSmartphone className="w-5 h-5 text-primary shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-bold text-on-surface">Privacy and data availability</p>
          <p className="text-xs text-on-surface-variant">No raw IP addresses, names, phone numbers, precise locations or individual visitor activity are shown. Analytics starts when the production tracking flag is enabled; historical traffic is not backfilled.</p>
        </div>
      </Card>
    </section>
  );
}
