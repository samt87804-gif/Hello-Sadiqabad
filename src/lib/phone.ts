/**
 * Pakistani phone number normalization, display formatting, and URL validation.
 */

export function normalizePkPhone(input: string | null | undefined): string {
  if (!input) return '';
  const digits = input.replace(/[^\d+]/g, '');
  if (!digits) return '';

  // Handle +92 or 0092 prefix
  if (digits.startsWith('+92')) {
    const rest = digits.slice(3).replace(/^0+/, '');
    return `+92${rest}`;
  }
  if (digits.startsWith('0092')) {
    const rest = digits.slice(4).replace(/^0+/, '');
    return `+92${rest}`;
  }
  if (digits.startsWith('92') && digits.length >= 11) {
    const rest = digits.slice(2).replace(/^0+/, '');
    return `+92${rest}`;
  }
  if (digits.startsWith('0')) {
    return `+92${digits.slice(1)}`;
  }
  // Short emergency codes like 1122, 15, 16, 115, 1043, 1121
  if (digits.length <= 5) {
    return digits;
  }
  return `+92${digits}`;
}

export function formatPkPhoneDisplay(input: string | null | undefined): string {
  if (!input) return '';
  const raw = input.trim();
  const digits = raw.replace(/\D/g, '');
  if (digits.length <= 5) return digits;

  // Convert +923001234567 -> 0300-1234567 for familiar local display
  if (digits.startsWith('92') && digits.length === 12) {
    const local = `0${digits.slice(2)}`;
    if (local.startsWith('03')) {
      return `${local.slice(0, 4)}-${local.slice(4)}`;
    }
    return `${local.slice(0, 3)}-${local.slice(3)}`;
  }
  if (digits.startsWith('03') && digits.length === 11) {
    return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  }
  if (digits.startsWith('068') && digits.length >= 9) {
    return `068-${digits.slice(3)}`;
  }
  return raw;
}

export function buildTelUrl(phone: string | null | undefined): string {
  const norm = normalizePkPhone(phone);
  if (!norm) return '#';
  return `tel:${norm}`;
}

export function buildWhatsAppUrl(
  phone: string | null | undefined,
  prefillText?: string
): string {
  const norm = normalizePkPhone(phone);
  if (!norm) return '#';
  const waNumber = norm.startsWith('+') ? norm.slice(1) : norm;
  const query = prefillText ? `?text=${encodeURIComponent(prefillText)}` : '';
  return `https://wa.me/${waNumber}${query}`;
}

export function isValidHttpsUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (trimmed.length > 500) return false;
  return /^https:\/\/\S+$/i.test(trimmed);
}
