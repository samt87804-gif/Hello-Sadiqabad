export type LegacyBusinessSlugRecord = { slug?: string | null; databaseId?: string | null };
export type CurrentBusinessSlugRecord = { id: string; slug: string };

/** Verified legacy URLs not present in the active snapshot. Live published-row checks remain mandatory. */
export const VERIFIED_LEGACY_BUSINESS_SLUGS: readonly LegacyBusinessSlugRecord[] = [
  { slug: 'the-inspire-business-academy-sadiqabad-4x0', databaseId: '0d14d4af-6434-4b3c-aec3-3de0bb669a51' },
  { slug: 'bakhtawar-memorial-hospital-hkl', databaseId: 'b880b4ec-8196-4c96-81a0-ddd9f61efd9d' },
];

/** Build aliases only when a historical slug maps unambiguously to a currently published row. */
export function buildBusinessSlugAliasMap(
  legacyRecords: readonly LegacyBusinessSlugRecord[],
  publishedBusinesses: readonly CurrentBusinessSlugRecord[],
): Map<string, string> {
  const publishedById = new Map(publishedBusinesses.map((business) => [business.id, business]));
  const candidates = new Map<string, Set<string>>();
  for (const record of legacyRecords) {
    const legacySlug = record.slug?.trim();
    const databaseId = record.databaseId?.trim();
    if (!legacySlug || !databaseId) continue;
    const current = publishedById.get(databaseId);
    if (!current || current.slug === legacySlug) continue;
    const targets = candidates.get(legacySlug) ?? new Set<string>();
    targets.add(current.slug);
    candidates.set(legacySlug, targets);
  }
  const aliases = new Map<string, string>();
  for (const [legacySlug, targets] of candidates) {
    if (targets.size === 1) aliases.set(legacySlug, [...targets][0]);
  }
  return aliases;
}

/** Prefer canonical slugs; use an alias only when its published target exists. */
export function resolveBusinessBySlug<T extends { slug: string }>(
  businesses: readonly T[], requestedSlug: string, aliases: ReadonlyMap<string, string>,
): T | null {
  const current = businesses.find((business) => business.slug === requestedSlug);
  if (current) return current;
  const canonicalSlug = aliases.get(requestedSlug);
  if (!canonicalSlug) return null;
  return businesses.find((business) => business.slug === canonicalSlug) ?? null;
}
