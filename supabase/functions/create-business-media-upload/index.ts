import { createClient } from "npm:@supabase/supabase-js@2";
function hashRateKey(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  return crypto.subtle.digest("SHA-256", bytes).then((digest) =>
    Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")
  );
}

async function readJsonObject(req: Request, maxBytes: number): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    await req.body?.cancel();
    return null;
  }
  const reader = req.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service configuration");

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = "hs-pending-business-media";
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

function response(req: Request, data: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.includes(origin)) {
    return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  }
  return Response.json(data, {
    status,
    headers: {
      "Access-Control-Allow-Origin": origin || allowedOrigins[0],
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Vary": "Origin",
      "Cache-Control": "no-store",
    },
  });
}

async function limited(key: string, limit: number, seconds: number) {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: seconds,
  });
  return !error && data === true;
}

function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const value = header.trim();
  if (!value.toLowerCase().startsWith("bearer ")) return null;
  return value.slice(7).trim() || null;
}
function isValidUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function pakistanMonthRange() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Karachi", year: "numeric", month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const start = new Date(`${year}-${month}-01T00:00:00+05:00`);
  const end = new Date(Date.UTC(Number(year), Number(month), 1) - 5 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await readJsonObject(req, 4_096);
    if (!body) return response(req, { ok: false, error: "Invalid request" }, 400);

    const field = body.media_field;
    const mime = body.mime_type;
    const size = Number(body.file_size_bytes);
    const mode = body.mode === "owner_change" ? "owner_change" : "submission";
    const sessionId = body.session_id;

    if (!["logo", "cover", "gallery"].includes(String(field)) ||
        !["image/jpeg", "image/png", "image/webp"].includes(String(mime)) ||
        !Number.isInteger(size) || size <= 0 || size > 5 * 1024 * 1024) {
      return response(req, { ok: false, error: "Invalid image upload details" }, 400);
    }

    const ip = req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (ip) {
      const ipKey = await hashRateKey(ip);
      if (!await limited(`business-media:ip:${ipKey}`, 8, 3_600)) {
        return response(req, { ok: false, error: "Too many image uploads. Please try again later." }, 429);
      }
    }

    const extension = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
    let storagePath: string;

    if (mode === "owner_change") {
      if (!isValidUuid(body.business_id)) {
        return response(req, { ok: false, error: "A valid business is required for an owner image change" }, 400);
      }
      const token = extractBearerToken(req.headers.get("authorization"));
      if (!token) return response(req, { ok: false, error: "Please sign in to change business images" }, 401);
      const { data: auth, error: authError } = await db.auth.getUser(token);
      if (authError || !auth.user) return response(req, { ok: false, error: "Please sign in to change business images" }, 401);

      const { data: profile, error: profileError } = await db.from("profiles")
        .select("role,is_active").eq("id", auth.user.id).maybeSingle();
      if (profileError || profile?.role !== "owner" || profile.is_active !== true) {
        return response(req, { ok: false, error: "An active approved owner account is required" }, 403);
      }

      const { data: business, error: businessError } = await db.from("businesses")
        .select("id,owner_id,status,plan_code")
        .eq("id", body.business_id).eq("owner_id", auth.user.id).maybeSingle();
      if (businessError || !business || business.status !== "published") {
        return response(req, { ok: false, error: "You can change images only for your own published business" }, 403);
      }

      if (field === "cover") {
        const { data: plan, error: planError } = await db.from("plans")
          .select("features").eq("code", business.plan_code).maybeSingle();
        if (planError || !plan?.features?.cover) {
          return response(req, { ok: false, error: "A Basic or Premium plan is required to request a cover image" }, 403);
        }
      }
      if (field === "gallery") {
        const { data: plan, error: planError } = await db.from("plans")
          .select("limits").eq("code", business.plan_code).eq("is_active", true).maybeSingle();
        if (planError || !plan) return response(req, { ok: false, error: "Gallery plan allowance could not be checked" }, 503);
        const maxGallery = Number(plan.limits?.gallery ?? 0);
        const { data: current, error: businessReadError } = await db.from("businesses")
          .select("gallery_urls").eq("id", business.id).maybeSingle();
        if (businessReadError || !current) return response(req, { ok: false, error: "Gallery details could not be checked" }, 503);
        const { count: pendingCount, error: pendingError } = await db.from("business_media_assets")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business.id).eq("media_field", "gallery")
          .in("status", ["pending_review", "approved_pending_promotion"]);
        if (pendingError) return response(req, { ok: false, error: "Pending gallery uploads could not be checked" }, 503);
        if (maxGallery <= 0 || (current.gallery_urls?.length ?? 0) + (pendingCount ?? 0) >= maxGallery) {
          return response(req, { ok: false, error: "Your current plan gallery limit has been reached" }, 403);
        }
      } else {
        const month = pakistanMonthRange();
        const { count, error: usageError } = await db.from("business_image_change_requests")
          .select("id", { count: "exact", head: true })
          .eq("business_id", business.id)
          .eq("owner_id", auth.user.id)
          .gte("requested_at", month.start)
          .lt("requested_at", month.end);
        if (usageError) return response(req, { ok: false, error: "Image-change allowance could not be checked" }, 503);
        if ((count ?? 0) >= 2) {
          return response(req, { ok: false, error: "Monthly image-change limit reached (2 per business)" }, 429);
        }
      }

      const ownerKey = await hashRateKey(`${auth.user.id}:${business.id}`);
      if (!await limited(`business-media:owner:${ownerKey}`, 5, 3_600)) {
        return response(req, { ok: false, error: "Too many image-change attempts. Please try again later." }, 429);
      }
      storagePath = `owners/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
    } else {
      if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 128) {
        return response(req, { ok: false, error: "Invalid upload session" }, 400);
      }
      const sessionKey = await hashRateKey(sessionId);
      if (!await limited(`business-media:session:${sessionKey}`, 4, 3_600)) {
        return response(req, { ok: false, error: "Too many image uploads for this session. Please try again later." }, 429);
      }
      storagePath = `pending/${sessionKey}/${crypto.randomUUID()}/${field}.${extension}`;
    }

    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(storagePath, { upsert: false });
    if (error || !data?.token || !data?.signedUrl) {
      return response(req, { ok: false, error: "A secure image upload could not be prepared" }, 503);
    }

    return response(req, {
      ok: true,
      data: { path: storagePath, token: data.token, signed_url: data.signedUrl },
    });
  } catch {
    return response(req, { ok: false, error: "Could not prepare image upload" }, 500);
  }
});
