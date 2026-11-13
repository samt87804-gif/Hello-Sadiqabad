import React from 'react';

export function SparklineSvg({
  values,
  color = 'var(--brand-600)',
  height = 36,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const w = 120;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = height - 4 - ((v - min) / span) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full h-9 overflow-visible" aria-hidden="true">
      <polyline fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" points={pts} />
    </svg>
  );
}

export function LineChartSvg({
  data,
  series,
}: {
  data: Array<Record<string, string | number>>;
  series: Array<{ key: string; label: string; color: string }>;
}) {
  if (data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-on-surface-variant">
        No analytics data yet
      </div>
    );
  }
  const w = 520;
  const h = 180;
  const padX = 24;
  const padY = 18;
  const allVals = data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)));
  const maxVal = Math.max(...allVals, 10);

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-44" role="img" aria-label="Trend line chart">
        {[0, 0.5, 1].map((t) => {
          const y = h - padY - t * (h - padY * 2);
          return (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="var(--hs-outline-variant)"
              strokeDasharray="3 3"
              strokeWidth="0.8"
            />
          );
        })}
        {series.map((s) => {
          const pts = data
            .map((d, i) => {
              const x =
                data.length === 1
                  ? w / 2
                  : padX + (i / (data.length - 1)) * (w - padX * 2);
              const val = Number(d[s.key] ?? 0);
              const y = h - padY - (val / maxVal) * (h - padY * 2);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polyline
              key={s.key}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={pts}
            />
          );
        })}
      </svg>
      <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant">
        {series.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="font-medium">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function BarChartSvg({
  items,
  color = 'var(--hs-primary)',
}: {
  items: Array<{ label: string; value: number }>;
  color?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-on-surface-variant">
        No records
      </div>
    );
  }
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-on-surface truncate max-w-[75%]">{item.label}</span>
            <span className="font-bold text-on-surface tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(4, Math.round((item.value / max) * 100))}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
