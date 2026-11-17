import React, { useState } from 'react';
import { AlertCircle, Copy, MoonStar, Plus, Trash2 } from 'lucide-react';
import type { DayKey, OpeningHoursJson } from '../../types/database';
import {
  applyJummahSplitToFriday,
  applyMondayToWeek,
  DEFAULT_DAY_RANGE,
  validateOpeningHoursRanges,
} from '../../lib/hours';
import { Button } from '../ui/Button';

const DAYS: Array<{ key: DayKey; label: string; ur: string }> = [
  { key: 'mon', label: 'Monday', ur: 'پیر' },
  { key: 'tue', label: 'Tuesday', ur: 'منگل' },
  { key: 'wed', label: 'Wednesday', ur: 'بدھ' },
  { key: 'thu', label: 'Thursday', ur: 'جمعرات' },
  { key: 'fri', label: 'Friday', ur: 'جمعۃ المبارک' },
  { key: 'sat', label: 'Saturday', ur: 'ہفتہ' },
  { key: 'sun', label: 'Sunday', ur: 'اتوار' },
];

export function HoursEditor({
  value,
  isOpen24h,
  onChange,
  onChange24h,
  showApplyToAll = false,
}: {
  value: OpeningHoursJson;
  isOpen24h: boolean;
  onChange: (next: OpeningHoursJson) => void;
  onChange24h: (val: boolean) => void;
  showApplyToAll?: boolean;
}) {
  const [bulkOpen, setBulkOpen] = useState('09:00');
  const [bulkClose, setBulkClose] = useState('22:00');
  const [bulkError, setBulkError] = useState('');
  const rangeError = !isOpen24h ? validateOpeningHoursRanges(value) : null;

  const toggleDay = (day: DayKey, openDay: boolean) => {
    const next = { ...value };
    next[day] = openDay ? DEFAULT_DAY_RANGE.map((r) => ({ ...r })) : [];
    onChange(next);
  };

  const updateRange = (day: DayKey, idx: number, field: 'open' | 'close', val: string) => {
    const next = { ...value };
    const ranges = [...(next[day] ?? [])];
    ranges[idx] = { ...ranges[idx], [field]: val };
    next[day] = ranges;
    onChange(next);
  };

  const addRange = (day: DayKey) => {
    const next = { ...value };
    const ranges = [...(next[day] ?? [])];
    ranges.push({ open: '14:30', close: '22:00' });
    next[day] = ranges;
    onChange(next);
  };

  const removeRange = (day: DayKey, idx: number) => {
    const next = { ...value };
    const ranges = [...(next[day] ?? [])];
    ranges.splice(idx, 1);
    next[day] = ranges;
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-surface-container-low">
        <label className="flex items-center gap-2.5 text-sm font-semibold text-on-surface cursor-pointer">
          <input
            type="checkbox"
            checked={isOpen24h}
            onChange={(e) => onChange24h(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          <div>
            <span>Open 24 Hours / 7 Days</span>
            <p className="text-[11px] font-normal text-on-surface-variant">
              Ideal for hospitals, pharmacies &amp; fuel stations
            </p>
          </div>
        </label>

        {!isOpen24h && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange(applyMondayToWeek(value, true))}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Mon → Week (Keep Fri)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange(applyMondayToWeek(value, false))}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
            >
              Apply Mon to All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onChange(applyJummahSplitToFriday(value))}
              leftIcon={<MoonStar className="w-3.5 h-3.5 text-secondary" />}
            >
              Jummah Break Preset
            </Button>
          </div>
        )}
      </div>

      {rangeError && (
        <div
          role="alert"
          className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{rangeError}</span>
        </div>
      )}

      {!isOpen24h && showApplyToAll && (
        <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
          <div>
            <p className="text-sm font-bold text-on-surface">Set the same hours for all days</p>
            <p className="text-xs text-on-surface-variant">Choose opening and closing time, then apply. You can still edit any day separately below.</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface">
              Opening time
              <input
                type="time"
                value={bulkOpen}
                onChange={(e) => { setBulkOpen(e.target.value); setBulkError(''); }}
                className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm tabular-nums"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-semibold text-on-surface">
              Closing time
              <input
                type="time"
                value={bulkClose}
                onChange={(e) => { setBulkClose(e.target.value); setBulkError(''); }}
                className="h-10 px-3 rounded-lg border border-outline-variant bg-surface text-sm tabular-nums"
              />
            </label>
            <Button
              size="sm"
              disabled={!bulkOpen || !bulkClose || bulkOpen >= bulkClose}
              onClick={() => {
                if (!bulkOpen || !bulkClose || bulkOpen >= bulkClose) {
                  setBulkError('Closing time must be later than opening time.');
                  return;
                }
                const range = { open: bulkOpen, close: bulkClose };
                onChange({
                  ...value,
                  mon: [{ ...range }],
                  tue: [{ ...range }],
                  wed: [{ ...range }],
                  thu: [{ ...range }],
                  fri: [{ ...range }],
                  sat: [{ ...range }],
                  sun: [{ ...range }],
                  is_24_7: false,
                });
                setBulkError('');
              }}
            >
              Apply to All
            </Button>
          </div>
          {bulkError && <p role="alert" className="text-xs font-semibold text-error">{bulkError}</p>}
        </div>
      )}

      {!isOpen24h && (
        <div className="space-y-2.5">
          {DAYS.map((d) => {
            const ranges = value[d.key] ?? [];
            const isOpen = ranges.length > 0;
            const isSplitFriday = d.key === 'fri' && ranges.length > 1;
            return (
              <div
                key={d.key}
                className="p-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center justify-between sm:w-48 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOpen}
                      onChange={(e) => toggleDay(d.key, e.target.checked)}
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                    <span className="text-sm font-semibold text-on-surface">{d.label}</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    {isSplitFriday && (
                      <span className="px-1.5 py-0.5 rounded bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold">
                        Jummah
                      </span>
                    )}
                    <span className="font-urdu text-xs text-on-surface-variant">{d.ur}</span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  {!isOpen ? (
                    <span className="text-xs font-medium text-outline">Closed / بند</span>
                  ) : (
                    ranges.map((r, idx) => {
                      const bad = Boolean(r.open && r.close && r.open >= r.close);
                      return (
                        <div key={idx} className="flex items-center gap-2 flex-wrap">
                          <input
                            type="time"
                            value={r.open}
                            onChange={(e) => updateRange(d.key, idx, 'open', e.target.value)}
                            className={`h-9 px-2.5 rounded-lg border bg-surface text-xs font-semibold tabular-nums ${
                              bad ? 'border-error text-error' : 'border-outline-variant'
                            }`}
                          />
                          <span className="text-xs text-on-surface-variant">to</span>
                          <input
                            type="time"
                            value={r.close}
                            onChange={(e) => updateRange(d.key, idx, 'close', e.target.value)}
                            className={`h-9 px-2.5 rounded-lg border bg-surface text-xs font-semibold tabular-nums ${
                              bad ? 'border-error text-error' : 'border-outline-variant'
                            }`}
                          />
                          {ranges.length > 1 && (
                            <button
                              type="button"
                              aria-label="Remove split shift"
                              onClick={() => removeRange(d.key, idx)}
                              className="p-1.5 text-error hover:bg-error-container/40 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {isOpen && ranges.length < 2 && (
                  <button
                    type="button"
                    onClick={() => addRange(d.key)}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-center cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Break / Split
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
