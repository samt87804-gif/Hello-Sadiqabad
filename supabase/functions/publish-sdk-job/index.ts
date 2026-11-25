import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!url || !serviceRoleKey || !anonKey) throw new Error("Missing Supabase service configuration");
const adminDb = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
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
function normalize(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function collectPublicText(job: Record<string, unknown>) {
  return [
    job.title_en, job.title_ur, job.summary_en, job.summary_ur,
    job.description_en, job.description_ur, job.job_category,
    job.work_location_en, job.work_location_ur, job.duties_en, job.duties_ur,
    job.qualifications_en, job.qualifications_ur, job.experience_en, job.experience_ur,
    job.working_hours_en, job.working_hours_ur, job.benefits_en, job.benefits_ur,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);
}
function hasPhoneNumber(text: string) {
  const matches = text.match(/\+?\d[\d\s().-]{7,}\d/g) ?? [];
  return matches.some((match) => match.replace(/\D/g, "").length >= 9);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const token = bearer(req);
    if (!token) return response(req, { ok: false, error: "Sign in with an Admin account" }, 401);
    const { data: auth, error: authError } = await adminDb.auth.getUser(token);
    if (authError || !auth.user) return response(req, { ok: false, error: "Sign in with an Admin account" }, 401);

    const { data: profile, error: profileError } = await adminDb.from("profiles")
      .select("role,is_active").eq("id", auth.user.id).maybeSingle();
    if (profileError || !profile || profile.is_active !== true) return response(req, { ok: false, error: "Active Admin access is required" }, 403);
    let permitted = profile.role === "super_admin";
    if (!permitted && profile.role === "staff") {
      const { data: staff, error: staffError } = await adminDb.from("staff_members")
        .select("permissions,is_active").eq("user_id", auth.user.id).maybeSingle();
      permitted = !staffError && staff?.is_active === true && staff.permissions?.["sdk_jobs.manage"] === true;
    }
    if (!permitted) return response(req, { ok: false, error: "sdk_jobs.manage permission is required" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || !uuid(body.job_id)) return response(req, { ok: false, error: "Invalid job publication request" }, 400);

    const { data: job, error: jobError } = await adminDb.from("sdk_jobs").select("*").eq("id", body.job_id).maybeSingle();
    if (jobError || !job) return response(req, { ok: false, error: "SDK Job not found" }, 404);
    if (job.status !== "pending_review" || !job.approved_image_url) {
      return response(req, { ok: false, error: "Job must be awaiting review and have an approved poster before publication" }, 409);
    }
    const dateParts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Karachi", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(new Date());
    const today = `${dateParts.find((part) => part.type === "year")?.value}-${dateParts.find((part) => part.type === "month")?.value}-${dateParts.find((part) => part.type === "day")?.value}`;
    if (job.closing_date && job.closing_date < today) {
      return response(req, { ok: false, error: "The closing date has already passed. Update the vacancy before publication." }, 409);
    }

    const [businessResult, ownerResult, authOwnerResult] = await Promise.all([
      adminDb.from("businesses").select("name_en,name_ur").eq("id", job.source_business_id).maybeSingle(),
      adminDb.from("profiles").select("full_name,phone").eq("id", job.employer_owner_id).maybeSingle(),
      adminDb.auth.admin.getUserById(job.employer_owner_id),
    ]);
    if (businessResult.error || ownerResult.error || authOwnerResult.error) {
      return response(req, { ok: false, error: "Private employer details could not be verified" }, 503);
    }

    const fields = collectPublicText(job);
    const combined = normalize(fields.join(" "));
    const businessNames = [businessResult.data?.name_en, businessResult.data?.name_ur].filter((v): v is string => typeof v === "string" && normalize(v).length >= 4);
    const ownerName = typeof ownerResult.data?.full_name === "string" ? ownerResult.data.full_name.trim() : "";
    const ownerEmail = authOwnerResult.data.user?.email?.trim().toLocaleLowerCase() ?? "";
    const ownerPhoneDigits = (ownerResult.data?.phone ?? "").replace(/\D/g, "");
    const blockers: string[] = [];

    if (businessNames.some((name) => combined.includes(normalize(name)))) blockers.push("Business identity appears in public text");
    if (ownerName && normalize(ownerName).length >= 4 && combined.includes(normalize(ownerName))) blockers.push("Owner identity appears in public text");
    if (ownerEmail && fields.some((field) => field.toLocaleLowerCase().includes(ownerEmail))) blockers.push("Private owner email appears in public text");
    if (ownerPhoneDigits.length >= 9 && fields.some((field) => field.replace(/\D/g, "").includes(ownerPhoneDigits))) blockers.push("Private owner phone appears in public text");
    if (fields.some((field) => /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(field) || hasPhoneNumber(field))) blockers.push("A phone number or email appears in public text");
    if (fields.some((field) => /https?:\/\/|www\./i.test(field))) blockers.push("An external contact or website link appears in public text");

    if (blockers.length) return response(req, { ok: false, error: "Remove employer identity and private contact details before publishing.", blockers }, 422);

    const userDb = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const now = new Date().toISOString();
    const { data: updated, error: updateError } = await userDb.from("sdk_jobs")
      .update({ status: "published", reviewed_by: auth.user.id, reviewed_at: now, published_at: now })
      .eq("id", job.id).eq("status", "pending_review").select("id,slug,published_at").single();
    if (updateError || !updated) return response(req, { ok: false, error: "Job publication could not be saved. Refresh the queue and try again." }, 409);
    return response(req, { ok: true, job: updated });
  } catch {
    return response(req, { ok: false, error: "SDK Job could not be published" }, 500);
  }
});
