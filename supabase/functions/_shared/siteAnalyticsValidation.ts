import { isValidUuid } from "./validation.ts";

export const SITE_ANALYTICS_EVENT_NAMES = [
  "page_view",
  "engagement",
  "cta_click",
  "content_share",
  "search_summary",
] as const;

const allowedTopLevel = new Set([
  "event_id", "event_name", "visitor_id", "session_id", "page_path",
  "entity_type", "entity_id", "referrer", "utm", "filters",
  "active_seconds", "results_count",
]);

const allowedEntityTypes = new Set([
  "business", "news", "authority_profile", "category", "area",
]);

export type SiteAnalyticsEnvelope = {
  eventName: typeof SITE_ANALYTICS_EVENT_NAMES[number];
  activeSeconds: number;
  resultsCount: number | null;
  entityType: string | null;
  entityId: string | null;
};

export type SiteAnalyticsEnvelopeResult =
  | { ok: true; value: SiteAnalyticsEnvelope }
  | { ok: false; reason: string };

/** Validates the public collector envelope before any database write. */
export function validateSiteAnalyticsEnvelope(
  body: Record<string, unknown>,
): SiteAnalyticsEnvelopeResult {
  if (Object.keys(body).some((key) => !allowedTopLevel.has(key))) {
    return { ok: false, reason: "Unsupported analytics fields" };
  }

  if (!isValidUuid(body.event_id) || !isValidUuid(body.visitor_id) ||
      !isValidUuid(body.session_id) ||
      typeof body.event_name !== "string" ||
      !SITE_ANALYTICS_EVENT_NAMES.includes(body.event_name as typeof SITE_ANALYTICS_EVENT_NAMES[number])) {
    return { ok: false, reason: "Invalid event contract" };
  }

  const eventName = body.event_name as SiteAnalyticsEnvelope["eventName"];
  const activeSeconds = body.active_seconds === undefined ? 0 : body.active_seconds;
  if (!Number.isInteger(activeSeconds) || Number(activeSeconds) < 0 || Number(activeSeconds) > 30) {
    return { ok: false, reason: "Invalid engagement duration" };
  }

  const resultsCount = body.results_count === undefined ? null : body.results_count;
  if (resultsCount !== null &&
      (!Number.isInteger(resultsCount) || Number(resultsCount) < 0 || Number(resultsCount) > 100_000)) {
    return { ok: false, reason: "Invalid search result count" };
  }
  if (eventName === "search_summary" && resultsCount === null) {
    return { ok: false, reason: "Invalid search summary" };
  }
  if (eventName === "engagement" && Number(activeSeconds) < 1) {
    return { ok: false, reason: "Invalid engagement duration" };
  }

  const entityType = typeof body.entity_type === "string" ? body.entity_type : null;
  const entityId = body.entity_id === undefined || body.entity_id === null ? null : body.entity_id;
  if (entityType !== null && !allowedEntityTypes.has(entityType)) {
    return { ok: false, reason: "Invalid content type" };
  }
  if (entityId !== null && (!isValidUuid(entityId) || !entityType)) {
    return { ok: false, reason: "Invalid content reference" };
  }

  return {
    ok: true,
    value: {
      eventName,
      activeSeconds: Number(activeSeconds),
      resultsCount: resultsCount === null ? null : Number(resultsCount),
      entityType,
      entityId: entityId as string | null,
    },
  };
}
