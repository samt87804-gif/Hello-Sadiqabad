import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = "hs-pending-business-media";
const maxBytes = 5 * 1024 * 1024;
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

function response(req: Request, data: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.includes(origin)) return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  return Response.json(data, { status, headers: {
    "Access-Control-Allow-Origin": origin || allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", "Cache-Control": "no-store",
  }});
}
function bearer(req: Request) {
  const value = req.headers.get("authorization") ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : null;
}
function uuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
async function hash(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (v) => v.toString(16).padStart(2, "0")).join("");
}
async function limited(key: string, limit: number) {
  const { data, error } = await db.rpc("check_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: 3600 });
  return !error && data === true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const token = bearer(req);
    if (!token) return response(req, { ok: false, error: "Please sign in first" }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return response(req, { ok: false, error: "Please sign in first" }, 401);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || !uuid(body.job_id) ||
        !["image/jpeg", "image/png", "image/webp"].includes(String(body.mime_type)) ||
        !Number.isInteger(body.file_size_bytes) || Number(body.file_size_bytes) <= 0 || Number(body.file_size_bytes) > maxBytes) {
      return response(req, { ok: false, error: "Choose a JPEG, PNG or WebP poster up to 5 MB" }, 400);
    }

    const { data: profile, error: profileError } = await db.from("profiles")
      .select("role,is_active").eq("id", auth.user.id).maybeSingle();
    if (profileError || profile?.role !== "owner" || profile.is_active !== true) {
      return response(req, { ok: false, error: "An active Owner account is required" }, 403);
    }
    const { data: job, error: jobError } = await db.from("sdk_jobs")
      .select("id,employer_owner_id,status,pending_media_path")
      .eq("id", body.job_id).maybeSingle();
    if (jobError || !job || job.employer_owner_id !== auth.user.id || job.status !== "pending_review") {
      return response(req, { ok: false, error: "You can upload a poster only for your own job awaiting Admin review" }, 403);
    }

    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
    if (ip && !await limited("sdk-job-poster:ip:" + await hash(ip), 12)) {
      return response(req, { ok: false, error: "Too many poster upload attempts. Try again later." }, 429);
    }
    if (!await limited("sdk-job-poster:owner:" + await hash(auth.user.id), 6)) {
      return response(req, { ok: false, error: "Poster upload limit reached. Try again later." }, 429);
    }

    const extension = body.mime_type === "image/jpeg" ? "jpg" : body.mime_type === "image/png" ? "png" : "webp";
    const path = `sdk-jobs/pending/${job.id}/${auth.user.id}/${crypto.randomUUID()}.${extension}`;
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path, { upsert: false });
    if (error || !data?.token) return response(req, { ok: false, error: "Secure poster upload could not be prepared" }, 503);
    return response(req, { ok: true, data: { path, token: data.token } });
  } catch {
    return response(req, { ok: false, error: "Could not prepare SDK Jobs poster upload" }, 500);
  }
});
