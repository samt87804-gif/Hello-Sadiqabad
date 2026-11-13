import type { DayKey, OpeningHoursJson, TimeRange } from '../types/directory';

export const ORDERED_DAYS: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DEFAULT_DAY_RANGE: TimeRange[] = [{ open: '09:00', close: '22:00' }];

export const JUMMAH_SPLIT_FRIDAY: TimeRange[] = [
  { open: '09:00', close: '12:30' },
  { open: '14:30', close: '22:00' },
];

export function cloneDayRanges(ranges: TimeRange[] | undefined): TimeRange[] {
  return (ranges ?? []).map((r) => ({ open: r.open, close: r.close }));
}

export function applyMondayToWeek(
  hours: OpeningHoursJson,
  preserveFriday = false
): OpeningHoursJson {
  const monday = cloneDayRanges(hours.mon?.length ? hours.mon : DEFAULT_DAY_RANGE);
  const next: OpeningHoursJson = { ...hours, mon: monday };

  for (const day of ORDERED_DAYS) {
    if (day === 'mon') continue;
    if (day === 'fri' && preserveFriday) {
      continue;
    }
    next[day] = cloneDayRanges(monday);
  }
  return next;
}

export function applyJummahSplitToFriday(hours: OpeningHoursJson): OpeningHoursJson {
  return {
    ...hours,
    is_24_7: false,
    fri: cloneDayRanges(JUMMAH_SPLIT_FRIDAY),
  };
}

export function validateOpeningHoursRanges(hours: OpeningHoursJson): string | null {
  if (hours.is_24_7) return null;

  for (const day of ORDERED_DAYS) {
    const ranges = hours[day] ?? [];
    for (const r of ranges) {
      if (!r.open || !r.close) {
        return `Please complete both open and close times for ${day.toUpperCase()}.`;
      }
      if (r.open >= r.close) {
        return `Closing time must be later than opening time for ${day.toUpperCase()} (${r.open} – ${r.close}).`;
      }
    }
  }
  return null;
}
