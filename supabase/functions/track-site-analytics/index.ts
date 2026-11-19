import { createClient } from "npm:@supabase/supabase-js@2";
import { readJsonObject } from "../_shared/validation.ts";
import { validateSiteAnalyticsEnvelope } from "../_shared/siteAnalyticsValidation.ts";
import { classifySiteAnalyticsPath } from "../_shared/siteAnalyticsPath.ts";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");

const db = createClient(url, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

function reply(req: Request, data: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.includes(origin)) {
    return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  }
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Headers"] = "authorization, x-client-info, apikey, content-type";
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Vary"] = "Origin";
  }
  return Response.json(data, { status, headers });
}

async function hmacHex(value: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(serviceRoleKey!),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, "0")).join("");
}


function safeLabel(value: unknown, max = 100): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.normalize("NFKC").trim().replace(/[^\p{L}\p{N} ._-]/gu, "").slice(0, max);
  return cleaned || null;
}

function safeSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().toLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleaned) ? cleaned.slice(0, 100) : null;
}

function sanitizeUtm(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const item = value as Record<string, unknown>;
  return {
    source: safeLabel(item.source),
    medium: safeLabel(item.medium),
    campaign: safeLabel(item.campaign),
    content: safeLabel(item.content),
  };
}

function sanitizeFilters(value: unknown, eventName: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const item = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};

  if (eventName === "search_summary") {
    const category = safeSlug(item.category);
    const area = safeSlug(item.area);
    if (category) result.category = category;
    if (area) result.area = area;
    for (const key of ["open", "verified", "offer", "delivery"] as const) {
      if (typeof item[key] === "boolean") result[key] = item[key];
    }
    if (Number.isInteger(item.rating) && Number(item.rating) >= 0 && Number(item.rating) <= 5) result.rating = Number(item.rating);
    if (["relevance", "rating", "nearest", "newest"].includes(String(item.sort))) result.sort = item.sort;
  } else if (eventName === "cta_click") {
    if (["call", "whatsapp", "directions", "website"].includes(String(item.cta))) result.cta = item.cta;
  } else if (eventName === "content_share") {
    if (["business", "news", "authority_profile"].includes(String(item.content_type))) result.content_type = item.content_type;
    if (["whatsapp", "facebook", "copy", "native"].includes(String(item.action))) result.action = item.action;
  }
  return result;
}

function parseReferrerHost(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.hostname.toLowerCase().slice(0, 255) || null;
  } catch {
    return null;
  }
}

function channelFor(referrerHost: string | null, utm: ReturnType<typeof sanitizeUtm>) {
  if (utm.source || utm.medium || utm.campaign) return "campaign";
  if (!referrerHost) return "direct";
  if (/(^|\.)(google|bing|yahoo|duckduckgo)\./i.test(referrerHost)) return "search";
  if (/(^|\.)(facebook|instagram|tiktok|twitter|x|linkedin|pinterest|reddit|whatsapp)\./i.test(referrerHost)) return "social";
  return "referral";
}

function userAgentInfo(ua: string) {
  const deviceClass = /ipad|tablet/i.test(ua) ? "tablet" :
    /mobile|iphone|ipod|android/i.test(ua) ? "mobile" : "desktop";
  const browserFamily = /edg\//i.test(ua) ? "Edge" :
    /firefox\//i.test(ua) ? "Firefox" :
    /chrome\//i.test(ua) && !/edg\//i.test(ua) ? "Chrome" :
    /safari\//i.test(ua) && !/chrome\//i.test(ua) ? "Safari" : "Other";
  const osFamily = /android/i.test(ua) ? "Android" :
    /iphone|ipad|ipod/i.test(ua) ? "iOS" :
    /windows/i.test(ua) ? "Windows" :
    /mac os/i.test(ua) ? "macOS" :
    /linux/i.test(ua) ? "Linux" : "Other";
  return { deviceClass, browserFamily, osFamily };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return reply(req, { ok: true });
  if (req.method !== "POST") return reply(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await readJsonObject(req, 4_096);
    if (!body) return reply(req, { ok: false, error: "Invalid or oversized request body" }, 400);

    const ip = req.headers.get("cf-connecting-ip");
    if (!ip || ip.length > 128) return reply(req, { ok: false, error: "Rate limit identity unavailable" }, 429);
    const rateKey = await hmacHex(`site-analytics-rate:${ip}`);
    const { data: rateAllowed, error: rateError } = await db.rpc("check_rate_limit", {
      p_key: `site-analytics:${rateKey}`,
      p_limit: 1200,
      p_window_seconds: 3600,
    });
    if (rateError || rateAllowed !== true) {
      return reply(req, { ok: false, error: "Rate limit exceeded" }, 429);
    }

    const userAgent = req.headers.get("user-agent") ?? "";
    if (!userAgent || /bot|crawler|spider|facebookexternalhit|twitterbot|slackbot|discordbot|googlebot|bingbot|linkedinbot|pinterestbot|telegrambot|preview/i.test(userAgent)) {
      return reply(req, { ok: true, ignored: true });
    }

    const envelope = validateSiteAnalyticsEnvelope(body);
    if (!envelope.ok) return reply(req, { ok: false, error: envelope.reason }, 400);

    const { eventName, activeSeconds, resultsCount, entityType, entityId } = envelope.value;

    const route = classifySiteAnalyticsPath(body.page_path);
    if (!route) return reply(req, { ok: true, ignored: true });

    const filters = sanitizeFilters(body.filters, eventName);
    if (eventName === "cta_click" && !filters.cta) return reply(req, { ok: false, error: "Invalid CTA event" }, 400);
    if (eventName === "content_share" && (!filters.content_type || !filters.action)) {
      return reply(req, { ok: false, error: "Invalid share event" }, 400);
    }

    const utm = sanitizeUtm(body.utm);
    const referrerHost = parseReferrerHost(body.referrer);
    const channel = channelFor(referrerHost, utm);
    const ua = userAgentInfo(userAgent);
    const country = (req.headers.get("cf-ipcountry") ?? "").toUpperCase();
    const countryCode = /^[A-Z]{2}$/.test(country) ? country : null;

    const [visitorHash, sessionHash] = await Promise.all([
      hmacHex(`visitor:${body.visitor_id}`),
      hmacHex(`session:${body.session_id}`),
    ]);

    const event = {
      event_id: body.event_id,
      event_name: eventName,
      visitor_hash: visitorHash,
      session_hash: sessionHash,
      page_path: route.path,
      page_type: route.pageType,
      entity_type: entityType,
      entity_id: entityId,
      referrer_host: referrerHost,
      channel,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_content: utm.content,
      device_class: ua.deviceClass,
      browser_family: ua.browserFamily,
      os_family: ua.osFamily,
      country_code: countryCode,
      active_seconds: Number(activeSeconds),
      results_count: resultsCount,
      filters,
    };

    const { data, error } = await db.rpc("record_site_analytics_event", { p_event: event });
    if (error) return reply(req, { ok: false, error: "Could not record analytics event" }, 503);
    return reply(req, { ok: true, duplicate: data === false });
  } catch {
    return reply(req, { ok: false, error: "Could not process analytics event" }, 500);
  }
});
