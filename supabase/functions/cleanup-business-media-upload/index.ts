import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = "hs-pending-business-media";
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

async function hashRateKey(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readJsonObject(req: Request, maxBytes = 4_096): Promise<Record<string, unknown> | null> {
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

function response(req: Request, data: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.includes(origin)) return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  return Response.json(data, { status, headers: {
    "Access-Control-Allow-Origin": origin || allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", "Cache-Control": "no-store",
  }});
}

async function limited(key: string, limit: number, seconds: number) {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_key: key, p_limit: limit, p_window_seconds: seconds,
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const body = await readJsonObject(req);
    if (!body) return response(req, { ok: false, error: "Invalid cleanup request" }, 400);

    if (body.mode === "owner_change") {
      if (!isValidUuid(body.business_id) || !Array.isArray(body.storage_paths) ||
          body.storage_paths.length !== 1 || typeof body.storage_paths[0] !== "string") {
        return response(req, { ok: false, error: "Invalid owner image cleanup request" }, 400);
      }
      const token = extractBearerToken(req.headers.get("authorization"));
      if (!token) return response(req, { ok: false, error: "Authentication required" }, 401);
      const { data: auth, error: authError } = await db.auth.getUser(token);
      if (authError || !auth.user) return response(req, { ok: false, error: "Authentication required" }, 401);

      const { data: profile, error: profileError } = await db.from("profiles")
        .select("role,is_active").eq("id", auth.user.id).maybeSingle();
      if (profileError || profile?.role !== "owner" || profile.is_active !== true) {
        return response(req, { ok: false, error: "An active owner account is required" }, 403);
      }
      const { data: business, error: businessError } = await db.from("businesses")
        .select("id").eq("id", body.business_id).eq("owner_id", auth.user.id).maybeSingle();
      if (businessError || !business) {
        return response(req, { ok: false, error: "You can clean up uploads only for your own business" }, 403);
      }

      const path = body.storage_paths[0] as string;
      const pattern = new RegExp(`^owners/${auth.user.id}/[0-9a-f-]{36}[.](jpg|png|webp)$`, "i");
      if (!pattern.test(path)) {
        return response(req, { ok: false, error: "The requested file does not belong to this owner" }, 403);
      }

      const ip = req.headers.get("cf-connecting-ip") ??
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
      if (ip) {
        const ipHash = await hashRateKey(ip);
        if (!await limited(`business-media:cleanup:ip:${ipHash}`, 10, 3_600)) {
          return response(req, { ok: false, error: "Too many cleanup requests" }, 429);
        }
      }
      const ownerKey = await hashRateKey(`${auth.user.id}:${business.id}`);
      if (!await limited(`business-media:cleanup:owner:${ownerKey}`, 8, 3_600)) {
        return response(req, { ok: false, error: "Too many cleanup requests" }, 429);
      }

      const { data: registeredAssets, error: assetLookupError } = await db.from("business_media_assets")
        .select("id").eq("storage_path", path).limit(1);
      if (assetLookupError) return response(req, { ok: false, error: "Could not verify temporary image ownership" }, 503);
      if (registeredAssets?.length) {
        return response(req, { ok: false, error: "This image is already attached to an owner image-change request" }, 409);
      }

      const { error } = await db.storage.from(bucket).remove([path]);
      if (error) return response(req, { ok: false, error: "Temporary owner image could not be cleaned up" }, 503);
      return response(req, { ok: true });
    }

    if (typeof body.session_id !== "string" ||
        body.session_id.length < 8 || body.session_id.length > 128 ||
        !Array.isArray(body.storage_paths) || body.storage_paths.length < 1 || body.storage_paths.length > 2) {
      return response(req, { ok: false, error: "Invalid cleanup request" }, 400);
    }

    const sessionHash = await hashRateKey(body.session_id);
    const pattern = new RegExp(`^pending/${sessionHash}/[0-9a-f-]{36}/(logo|cover)[.](jpg|png|webp)$`, "i");
    const paths = body.storage_paths;
    if (!paths.every((path) => typeof path === "string" && pattern.test(path))) {
      return response(req, { ok: false, error: "The requested files do not belong to this upload session" }, 403);
    }

    const ip = req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (ip) {
      const ipHash = await hashRateKey(ip);
      if (!await limited(`business-media:cleanup:ip:${ipHash}`, 10, 3_600)) {
        return response(req, { ok: false, error: "Too many cleanup requests" }, 429);
      }
    }
    if (!await limited(`business-media:cleanup:session:${sessionHash}`, 6, 3_600)) {
      return response(req, { ok: false, error: "Too many cleanup requests" }, 429);
    }

    const { data: registeredAssets, error: assetLookupError } = await db.from("business_media_assets")
      .select("id").in("storage_path", paths as string[]).limit(1);
    if (assetLookupError) return response(req, { ok: false, error: "Could not verify temporary image ownership" }, 503);
    if (registeredAssets?.length) {
      return response(req, { ok: false, error: "These images are already attached to a business submission" }, 409);
    }

    const { error } = await db.storage.from(bucket).remove(paths as string[]);
    if (error) return response(req, { ok: false, error: "Temporary business images could not be cleaned up" }, 503);
    return response(req, { ok: true });
  } catch {
    return response(req, { ok: false, error: "Could not clean up temporary business images" }, 500);
  }
});
