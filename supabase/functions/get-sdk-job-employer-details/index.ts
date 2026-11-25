import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173")
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const token = bearer(req);
    if (!token) return response(req, { ok: false, error: "Admin authentication required" }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return response(req, { ok: false, error: "Admin authentication required" }, 401);
    const { data: profile, error: profileError } = await db.from("profiles")
      .select("role,is_active").eq("id", auth.user.id).maybeSingle();
    if (profileError || !profile || profile.is_active !== true) return response(req, { ok: false, error: "Active Admin access required" }, 403);
    let permitted = profile.role === "super_admin";
    if (!permitted && profile.role === "staff") {
      const { data: staff, error: staffError } = await db.from("staff_members")
        .select("permissions,is_active").eq("user_id", auth.user.id).maybeSingle();
      permitted = !staffError && staff?.is_active === true && staff.permissions?.["sdk_jobs.manage"] === true;
    }
    if (!permitted) return response(req, { ok: false, error: "sdk_jobs.manage permission is required" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || !uuid(body.job_id)) return response(req, { ok: false, error: "Invalid job identifier" }, 400);
    const { data: job, error: jobError } = await db.from("sdk_jobs")
      .select("id,employer_owner_id,source_business_id").eq("id", body.job_id).maybeSingle();
    if (jobError || !job) return response(req, { ok: false, error: "SDK Job not found" }, 404);

    const [businessResult, ownerResult, authOwnerResult] = await Promise.all([
      db.from("businesses").select("name_en,name_ur,phone_primary,whatsapp,email").eq("id", job.source_business_id).maybeSingle(),
      db.from("profiles").select("full_name,phone").eq("id", job.employer_owner_id).maybeSingle(),
      db.auth.admin.getUserById(job.employer_owner_id),
    ]);
    if (businessResult.error || ownerResult.error || authOwnerResult.error || !businessResult.data) {
      return response(req, { ok: false, error: "Private employer details could not be loaded" }, 503);
    }
    return response(req, {
      ok: true,
      business: businessResult.data,
      owner: {
        full_name: ownerResult.data?.full_name ?? null,
        phone: ownerResult.data?.phone ?? null,
        email: authOwnerResult.data.user?.email ?? null,
      },
    });
  } catch {
    return response(req, { ok: false, error: "Private employer details could not be loaded" }, 500);
  }
});
