import React from 'react';
import { Clock } from 'lucide-react';
import type { DayKey, OpeningHoursJson } from '../../types/database';
import { formatTime12h, getOpenStatus } from '../../lib/openNow';
import { useI18n } from '../../lib/i18n';

export function OpenNowBadge({
  openingHours,
  isOpen24h,
  showDetail = false,
}: {
  openingHours: OpeningHoursJson | null | undefined;
  isOpen24h: boolean;
  showDetail?: boolean;
}) {
  const { lang } = useI18n();
  const status = getOpenStatus(openingHours, isOpen24h);

  const label = lang === 'ur' ? status.labelUr : status.labelEn;
  const detail = lang === 'ur' ? status.detailUr : status.detailEn;

  const badgeStyle =
    status.state === 'open' || status.state === 'open_24h'
      ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant'
      : status.state === 'closed'
      ? 'bg-error-container text-on-error-container'
      : 'bg-surface-container text-on-surface-variant';

  const dotColor =
    status.state === 'open' || status.state === 'open_24h'
      ? 'bg-tertiary'
      : status.state === 'closed'
      ? 'bg-error'
      : 'bg-outline';

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${badgeStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />
      <span>{label}</span>
      {showDetail && detail && <span className="font-normal opacity-85">· {detail}</span>}
    </span>
  );
}

const ORDERED_DAYS: Array<{ key: DayKey; en: string; ur: string }> = [
  { key: 'mon', en: 'Monday', ur: 'پیر' },
  { key: 'tue', en: 'Tuesday', ur: 'منگل' },
  { key: 'wed', en: 'Wednesday', ur: 'بدھ' },
  { key: 'thu', en: 'Thursday', ur: 'جمعرات' },
  { key: 'fri', en: 'Friday', ur: 'جمعہ' },
  { key: 'sat', en: 'Saturday', ur: 'ہفتہ' },
  { key: 'sun', en: 'Sunday', ur: 'اتوار' },
];

export function OpeningHoursTable({
  openingHours,
  isOpen24h,
}: {
  openingHours: OpeningHoursJson | null | undefined;
  isOpen24h: boolean;
}) {
  const { lang } = useI18n();
  const status = getOpenStatus(openingHours, isOpen24h);

  if (isOpen24h) {
    return (
      <div className="p-3.5 rounded-xl bg-tertiary-fixed/50 text-on-tertiary-fixed-variant text-sm font-semibold flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0" />
        <span>
          {lang === 'ur'
            ? 'چوبیس گھنٹے کھلا رہتا ہے (ہفتے کے ساتوں دن)'
            : 'Open 24 Hours — All 7 Days'}
        </span>
      </div>
    );
  }

  if (!openingHours || Object.keys(openingHours).length === 0) {
    return (
      <p className="text-sm text-on-surface-variant">
        {lang === 'ur'
          ? 'کاروبار کے اوقات درج نہیں ہیں۔ براہ کرم کال کر کے تصدیق کریں۔'
          : 'Operating hours not listed yet. Please call ahead to confirm.'}
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {ORDERED_DAYS.map((day) => {
        const ranges = openingHours[day.key] ?? [];
        const isToday = status.todayDayKey === day.key;
        return (
          <div
            key={day.key}
            className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm ${
              isToday
                ? 'bg-surface-container font-bold text-on-surface border border-primary/25'
                : 'text-on-surface-variant'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{lang === 'ur' ? day.ur : day.en}</span>
              {isToday && (
                <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary text-[10px] font-bold">
                  Today
                </span>
              )}
            </div>
            <div className="tabular-nums text-end" dir="ltr">
              {ranges.length === 0
                ? 'Closed'
                : ranges
                    .map((r) => `${formatTime12h(r.open)} – ${formatTime12h(r.close)}`)
                    .join(' , ')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
