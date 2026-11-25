import { createClient } from "npm:@supabase/supabase-js@2";
import { hashRateKey, readJsonObject } from "../_shared/validation.ts";

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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await readJsonObject(req, 4_096);
    if (!body) return response(req, { ok: false, error: "Invalid request" }, 400);

    const field = body.media_field;
    const mime = body.mime_type;
    const size = Number(body.file_size_bytes);
    const sessionId = body.session_id;

    if (!["logo", "cover"].includes(String(field)) ||
        !["image/jpeg", "image/png", "image/webp"].includes(String(mime)) ||
        !Number.isInteger(size) || size <= 0 || size > 5 * 1024 * 1024 ||
        typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 128) {
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

    const sessionKey = await hashRateKey(sessionId);
    if (!await limited(`business-media:session:${sessionKey}`, 4, 3_600)) {
      return response(req, { ok: false, error: "Too many image uploads for this session. Please try again later." }, 429);
    }

    const extension = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
    const storagePath = `pending/${crypto.randomUUID()}/${field}.${extension}`;
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
