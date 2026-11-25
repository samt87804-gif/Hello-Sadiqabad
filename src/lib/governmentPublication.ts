import { isSafeGovernmentJobUrl } from './governmentJobs';

export interface GovernmentPublicationFields {
  titleUr?: string | null;
  summaryEn?: string | null;
  summaryUr?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  verifiedAt?: string | null;
}

export function getGovernmentPublicationErrors(fields: GovernmentPublicationFields): string[] {
  const errors: string[] = [];
  if (!fields.titleUr?.trim()) errors.push('Urdu title is required before publication.');
  if (!fields.summaryEn?.trim() || fields.summaryEn.trim().length < 20) errors.push('English summary must contain at least 20 characters.');
  if (!fields.summaryUr?.trim() || fields.summaryUr.trim().length < 20) errors.push('Urdu summary must contain at least 20 characters.');
  if (!fields.imageUrl?.trim() || !isSafeGovernmentJobUrl(fields.imageUrl)) errors.push('An official poster image with a valid HTTPS URL is required.');
  if (!fields.sourceName?.trim()) errors.push('Official source name is required.');
  if (!fields.sourceUrl?.trim() || !isSafeGovernmentJobUrl(fields.sourceUrl)) errors.push('A valid official HTTPS source URL is required.');
  if (!fields.verifiedAt) errors.push('A source verification date is required.');
  return errors;
}
