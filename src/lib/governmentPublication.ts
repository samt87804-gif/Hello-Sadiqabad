import { isSafeGovernmentJobUrl } from './governmentJobs';

export interface GovernmentPublicationFields {
  titleUr?: string | null;
  summaryEn?: string | null;
  summaryUr?: string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
  sourceUrl?: string | null;
  verifiedAt?: string | null;
  qualificationEn?: string | null;
  qualificationUr?: string | null;
  experienceEn?: string | null;
  experienceUr?: string | null;
  ageEn?: string | null;
  ageUr?: string | null;
  domicileEn?: string | null;
  domicileUr?: string | null;
  quotaEn?: string | null;
  quotaUr?: string | null;
  otherEligibilityEn?: string | null;
  otherEligibilityUr?: string | null;
  benefitDetailsEn?: string | null;
  benefitDetailsUr?: string | null;
  eligibilityEn?: string | null;
  eligibilityUr?: string | null;
  requiredDocumentsEn?: string[];
  requiredDocumentsUr?: string[];
  applicationStepsEn?: string | null;
  applicationStepsUr?: string | null;
  feesEn?: string | null;
  feesUr?: string | null;
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
  if (fields.qualificationEn !== undefined && !fields.qualificationUr?.trim()) errors.push('Urdu qualification details are required.');
  const optionalPairs: Array<[string | null | undefined, string | null | undefined, string]> = [
    [fields.experienceEn, fields.experienceUr, 'experience'], [fields.ageEn, fields.ageUr, 'age'],
    [fields.domicileEn, fields.domicileUr, 'domicile'], [fields.quotaEn, fields.quotaUr, 'quota'],
    [fields.otherEligibilityEn, fields.otherEligibilityUr, 'additional eligibility'],
    [fields.applicationStepsEn, fields.applicationStepsUr, 'application steps'], [fields.feesEn, fields.feesUr, 'fees / repayment'],
  ];
  for (const [english, urdu, label] of optionalPairs) if (english?.trim() && !urdu?.trim()) errors.push('Urdu ' + label + ' details are required.');
  if (fields.benefitDetailsEn !== undefined && !fields.benefitDetailsUr?.trim()) errors.push('Urdu benefit details are required.');
  if (fields.eligibilityEn !== undefined && !fields.eligibilityUr?.trim()) errors.push('Urdu eligibility details are required.');
  if (fields.requiredDocumentsEn?.length && (fields.requiredDocumentsUr?.length !== fields.requiredDocumentsEn.length || fields.requiredDocumentsUr.some((value) => !value.trim()))) errors.push('Every required document needs a matching Urdu translation.');
  return errors;
}
