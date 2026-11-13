import type { DayKey, OpeningHoursJson } from '../types/database';

export type OpenState = 'open' | 'closed' | 'open_24h' | 'not_listed';

export interface OpenNowResult {
  state: OpenState;
  labelEn: string;
  labelUr: string;
  detailEn?: string;
  detailUr?: string;
  todayDayKey: DayKey;
}

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function parseMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

export function formatTime12h(hhmm: string): string {
  const mins = parseMinutes(hhmm);
  if (mins === null) return hhmm;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function getKarachiClockParts(date: Date = new Date()): {
  dayKey: DayKey;
  minutesSinceMidnight: number;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Karachi',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const weekdayStr = parts.find((p) => p.type === 'weekday')?.value ?? 'Mon';
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minuteStr = parts.find((p) => p.type === 'minute')?.value ?? '00';

  const weekdayMap: Record<string, DayKey> = {
    Sun: 'sun',
    Mon: 'mon',
    Tue: 'tue',
    Wed: 'wed',
    Thu: 'thu',
    Fri: 'fri',
    Sat: 'sat',
  };

  const dayKey = weekdayMap[weekdayStr] ?? DAY_KEYS[date.getDay()];
  const hour = Number(hourStr) % 24;
  const minute = Number(minuteStr);
  return {
    dayKey,
    minutesSinceMidnight: hour * 60 + minute,
  };
}

export function getOpenStatus(
  openingHours: OpeningHoursJson | null | undefined,
  isOpen24h: boolean,
  now: Date = new Date()
): OpenNowResult {
  const { dayKey, minutesSinceMidnight } = getKarachiClockParts(now);

  if (isOpen24h) {
    return {
      state: 'open_24h',
      labelEn: 'Open 24 Hours',
      labelUr: '24 گھنٹے کھلا',
      todayDayKey: dayKey,
    };
  }

  if (!openingHours || Object.keys(openingHours).length === 0) {
    return {
      state: 'not_listed',
      labelEn: 'Hours not listed',
      labelUr: 'اوقات درج نہیں',
      todayDayKey: dayKey,
    };
  }

  const todayRanges = openingHours[dayKey] ?? [];

  for (const range of todayRanges) {
    const start = parseMinutes(range.open);
    const end = parseMinutes(range.close);
    if (start === null || end === null) continue;

    const isInRange =
      end >= start
        ? minutesSinceMidnight >= start && minutesSinceMidnight < end
        : minutesSinceMidnight >= start || minutesSinceMidnight < end;

    if (isInRange) {
      return {
        state: 'open',
        labelEn: 'Open Now',
        labelUr: 'ابھی کھلا ہے',
        detailEn: `Closes ${formatTime12h(range.close)}`,
        detailUr: `${formatTime12h(range.close)} تک کھلا`,
        todayDayKey: dayKey,
      };
    }
  }

  // Check if it opens later today
  const upcomingToday = todayRanges
    .map((r) => ({ r, start: parseMinutes(r.open) }))
    .filter((x): x is { r: { open: string; close: string }; start: number } => x.start !== null && x.start > minutesSinceMidnight)
    .sort((a, b) => a.start - b.start)[0];

  if (upcomingToday) {
    return {
      state: 'closed',
      labelEn: 'Closed',
      labelUr: 'بند ہے',
      detailEn: `Opens at ${formatTime12h(upcomingToday.r.open)}`,
      detailUr: `${formatTime12h(upcomingToday.r.open)} پر کھلے گا`,
      todayDayKey: dayKey,
    };
  }

  return {
    state: 'closed',
    labelEn: 'Closed',
    labelUr: 'بند ہے',
    detailEn: todayRanges.length === 0 ? 'Closed today' : 'Closed for today',
    detailUr: 'آج بند ہے',
    todayDayKey: dayKey,
  };
}
