/**
 * Hello Sadiqabad - Offer Status, Expiry, and Plan Limit Utilities
 * Enforces Pakistan Standard Time (Asia/Karachi, UTC+5) for consistent
 * offer validity checks across Owner Portal and public pages.
 */

export type EffectiveOfferStatus = 'active' | 'paused' | 'expired' | 'upcoming';

/**
 * Returns current date string 'YYYY-MM-DD' in Asia/Karachi timezone.
 */
export function getPakistanDateString(now: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(now);
  } catch {
    // Fallback if Intl timeZone is unsupported
    const offsetMs = 5 * 60 * 60 * 1000; // Asia/Karachi UTC+5
    const karachiDate = new Date(now.getTime() + offsetMs);
    return karachiDate.toISOString().slice(0, 10);
  }
}

/**
 * Normalizes ISO date string or timestamp to 'YYYY-MM-DD'.
 */
export function normalizeDateOnly(dateStr: string): string {
  if (!dateStr) return '';
  return dateStr.trim().slice(0, 10);
}

/**
 * Calculates effective offer status using:
 * - Stored offer status ('active' | 'paused')
 * - Valid From date
 * - Valid To date
 * - Pakistan local date (Asia/Karachi)
 *
 * Rules:
 * - If paused, it stays 'paused' regardless of dates.
 * - If valid_to < today, it is 'expired' (must not count toward active usage).
 * - If valid_from > today, it is 'upcoming' (future offers do not appear as currently valid).
 * - If active and valid_from <= today <= valid_to, it is 'active'.
 */
export function getEffectiveOfferStatus(
  offer: { status: string; valid_from: string; valid_to: string },
  todayStr: string = getPakistanDateString()
): EffectiveOfferStatus {
  // Paused status always takes priority: paused offers must remain paused
  if (offer.status === 'paused') {
    return 'paused';
  }

  const from = normalizeDateOnly(offer.valid_from);
  const to = normalizeDateOnly(offer.valid_to);

  // If valid_to is in the past, it is expired
  if (to && to < todayStr) {
    return 'expired';
  }

  // If valid_from is in the future, it is upcoming
  if (from && from > todayStr) {
    return 'upcoming';
  }

  // Otherwise, it is currently active
  return 'active';
}

/**
 * Checks if an offer is currently valid (effective status is 'active').
 * Expired, paused, and future/upcoming offers return false.
 */
export function isOfferCurrentlyValid(
  offer: { status: string; valid_from: string; valid_to: string },
  todayStr: string = getPakistanDateString()
): boolean {
  return getEffectiveOfferStatus(offer, todayStr) === 'active';
}

/**
 * Plan Offer Limits:
 * - Free: 0 offers
 * - Basic: 2 offers
 * - Premium: 10 offers
 */
export function getPlanOfferLimit(planCode?: string | null): number {
  const code = (planCode ?? '').toLowerCase().trim();
  if (code === 'premium') return 10;
  if (code === 'basic') return 2;
  return 0; // free or unspecified
}

/**
 * Counts how many offers currently have an effective 'active' status.
 * Expired and paused offers are excluded and do NOT count toward plan limits.
 */
export function countEffectiveActiveOffers(
  offers: Array<{ status: string; valid_from: string; valid_to: string }>,
  todayStr: string = getPakistanDateString()
): number {
  return offers.filter((o) => getEffectiveOfferStatus(o, todayStr) === 'active').length;
}
