export type BusinessFieldStatus = 'pending_review' | 'approved_published' | 'rejected' | 'unpublished';

export interface BusinessApprovalField {
  field_key: string;
  status: BusinessFieldStatus;
}

export interface BusinessFieldDecision {
  field_key: string;
  status: 'approved_published' | 'rejected' | 'unpublished';
  admin_note?: string;
}

export const BUSINESS_APPROVAL_CORE_FIELDS = [
  'name_en',
  'category_id',
  'area_id',
  'phone_primary',
  'address_en',
] as const;

export const BUSINESS_APPROVAL_FIELD_GROUPS = [
  {
    key: 'business',
    title: 'Business Information',
    fields: ['name_en', 'name_ur', 'category_id', 'description_en', 'description_ur', 'services_en', 'services_ur'],
  },
  {
    key: 'contact',
    title: 'Contact Information',
    fields: ['phone_primary', 'whatsapp'],
  },
  {
    key: 'location',
    title: 'Location & Address',
    fields: ['area_id', 'address_en', 'address_ur', 'landmark_en', 'landmark_ur', 'map_url'],
  },
  {
    key: 'hours',
    title: 'Opening Hours',
    fields: ['opening_hours'],
  },
] as const;

export function buildBusinessFieldDecisions(
  fields: BusinessApprovalField[],
  approvedKeys: Iterable<string>,
  rejectedReasons: Record<string, string>,
  unpublishKeys: Iterable<string>,
): BusinessFieldDecision[] {
  const byKey = new Map(fields.map((field) => [field.field_key, field]));
  const decisions: BusinessFieldDecision[] = [];
  const seen = new Set<string>();

  for (const key of approvedKeys) {
    const field = byKey.get(key);
    if (!field || key === 'owner_name' || field.status === 'approved_published' || field.status === 'rejected') continue;
    if (seen.has(key)) continue;
    decisions.push({ field_key: key, status: 'approved_published' });
    seen.add(key);
  }

  for (const [key, rawReason] of Object.entries(rejectedReasons)) {
    const field = byKey.get(key);
    const reason = rawReason.trim();
    if (!field || key === 'owner_name' || field.status === 'approved_published' || !reason) continue;
    if (seen.has(key)) continue;
    decisions.push({ field_key: key, status: 'rejected', admin_note: reason.slice(0, 1000) });
    seen.add(key);
  }

  for (const key of unpublishKeys) {
    const field = byKey.get(key);
    if (!field || key === 'owner_name' || field.status !== 'approved_published' || seen.has(key)) continue;
    decisions.push({ field_key: key, status: 'unpublished' });
    seen.add(key);
  }

  return decisions;
}

export function countApprovedCoreFields(
  fields: BusinessApprovalField[],
  newlyApprovedKeys: Iterable<string>,
  unpublishedKeys: Iterable<string> = [],
): number {
  const approved = new Set(newlyApprovedKeys);
  const unpublished = new Set(unpublishedKeys);
  const byKey = new Map(fields.map((field) => [field.field_key, field]));
  return BUSINESS_APPROVAL_CORE_FIELDS.filter((key) => {
    const status = byKey.get(key)?.status;
    return !unpublished.has(key) && (status === 'approved_published' || approved.has(key));
  }).length;
}

export function canUnpublishBusinessField(
  status: BusinessFieldStatus,
  businessStatus: string | null | undefined,
): boolean {
  return status === 'approved_published' && businessStatus === 'published';
}

export function shouldProcessOwnerInvitation(
  invitationStatus: string | null | undefined,
  businessId: string | null | undefined,
  coreReady: boolean,
): boolean {
  return Boolean(
    businessId &&
    coreReady &&
    (invitationStatus === 'pending' || invitationStatus === 'failed' || invitationStatus === 'waiting_for_business')
  );
}


export function shouldActivateDirectOwner(input: {
  directAuthUserId: string | null | undefined;
  identityVerified: boolean;
  coreReady: boolean;
  businessId: string | null | undefined;
  pendingMediaCount: number;
}): boolean {
  return Boolean(
    input.directAuthUserId &&
    input.identityVerified &&
    input.coreReady &&
    input.businessId &&
    input.pendingMediaCount === 0
  );
}
