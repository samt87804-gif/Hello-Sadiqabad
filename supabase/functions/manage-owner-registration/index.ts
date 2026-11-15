import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
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

async function getActor(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = /^Bearer\s+(.+)$/i.exec(authHeader.trim())?.[1]?.trim() ?? null;
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

async function canManageOwners(userId: string) {
  const { data: profile, error } = await db.from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (error || !profile || profile.is_active !== true) return false;
  if (profile.role === "super_admin") return true;
  if (profile.role !== "staff") return false;
  const { data: staff } = await db.from("staff_members").select("staff_types,permissions,is_active").eq("user_id", userId).maybeSingle();
  if (!staff || staff.is_active !== true) return false;
  const overrides = staff.permissions && typeof staff.permissions === "object" ? staff.permissions : {};
  return overrides["owners.create"] === true ||
    (overrides["owners.create"] !== false && (staff.staff_types ?? []).includes("sales_onboarding"));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  let lockedId: string | null = null;
  try {
    const actor = await getActor(req);
    if (!actor) return response(req, { ok: false, error: "Unauthorized" }, 401);
    if (!(await canManageOwners(actor.id))) return response(req, { ok: false, error: "Permission denied" }, 403);
    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const requestId = typeof body?.request_id === "string" ? body.request_id : "";
    const action = body?.action;
    const note = typeof body?.admin_note === "string" ? body.admin_note.trim().slice(0, 1000) : null;
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["approve", "reject"].includes(String(action))) {
      return response(req, { ok: false, error: "Invalid request details" }, 400);
    }
    const { data: request, error: readError } = await db.from("owner_registration_requests")
      .select("*").eq("id", requestId).maybeSingle();
    if (readError || !request) return response(req, { ok: false, error: "Registration request not found" }, 404);
    if (request.status !== "pending") return response(req, { ok: false, error: "This request has already been reviewed or is being processed" }, 409);

    if (action === "reject") {
      const { data: rejected, error } = await db.from("owner_registration_requests").update({
        status: "rejected", reviewed_by: actor.id, reviewed_at: new Date().toISOString(),
        admin_note: note, updated_at: new Date().toISOString(),
      }).eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
      if (error) throw error;
      if (!rejected) return response(req, { ok: false, error: "This request is already being processed" }, 409);
      return response(req, { ok: true, status: "rejected" });
    }

    const { data: locked, error: lockError } = await db.from("owner_registration_requests")
      .update({ status: "processing", admin_note: note, updated_at: new Date().toISOString() })
      .eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
    if (lockError || !locked) return response(req, { ok: false, error: "This request is already being processed" }, 409);
    lockedId = requestId;

    const siteUrl = (Deno.env.get("SITE_URL") ?? "https://hello-sadiqabad-2bs.pages.dev").replace(/\/$/, "");
    const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(request.email, {
      data: { full_name: request.full_name },
      redirectTo: siteUrl + "/reset-password",
    });
    if (inviteError || !invited.user) throw inviteError ?? new Error("Invitation could not be created");

    const { error: profileError } = await db.from("profiles").upsert({
      id: invited.user.id, role: "owner", full_name: request.full_name, phone: request.phone,
      must_change_password: false, is_active: true, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profileError) {
      await db.auth.admin.deleteUser(invited.user.id);
      throw new Error("Owner profile could not be provisioned; the invitation was rolled back");
    }

    const { error: updateError } = await db.from("owner_registration_requests").update({
      status: "approved", reviewed_by: actor.id, reviewed_at: new Date().toISOString(),
      admin_note: note, updated_at: new Date().toISOString(),
    }).eq("id", requestId).eq("status", "processing");
    if (updateError) {
      await db.auth.admin.deleteUser(invited.user.id);
      throw updateError;
    }
    await db.from("audit_logs").insert({
      actor_id: actor.id, action: "owner_registration.approve", entity: "owner_registration_requests",
      entity_id: requestId, details: { owner_user_id: invited.user.id, email: request.email },
    });
    return response(req, { ok: true, status: "approved" });
  } catch (error) {
    if (lockedId) {
      await db.from("owner_registration_requests").update({
        status: "pending", updated_at: new Date().toISOString(),
      }).eq("id", lockedId).eq("status", "processing");
    }
    return response(req, { ok: false, error: error instanceof Error ? error.message : "Request processing failed" }, 400);
  }
});
