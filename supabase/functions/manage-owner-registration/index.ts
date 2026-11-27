import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Owner profile provisioning failed";
  return message.replace(/[\\r\\n]+/g, " ").slice(0, 500);
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

async function getActor(req: Request) {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.toLowerCase().startsWith("bearer ") ? authHeader.slice(7).trim() : null;
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
  let invitedUserId: string | null = null;
  let note: string | null = null;
  try {
    const actor = await getActor(req);
    if (!actor) return response(req, { ok: false, error: "Unauthorized" }, 401);
    if (!(await canManageOwners(actor.id))) return response(req, { ok: false, error: "Permission denied" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const requestId = typeof body?.request_id === "string" ? body.request_id : "";
    const action = body?.action;
    note = typeof body?.admin_note === "string" ? body.admin_note.trim().slice(0, 1000) : null;
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || !["approve", "reject"].includes(String(action))) {
      return response(req, { ok: false, error: "Invalid request details" }, 400);
    }

    const { data: request, error: readError } = await db.from("owner_registration_requests")
      .select("id,full_name,email,phone,business_name,business_id,submission_id,status")
      .eq("id", requestId).maybeSingle();
    if (readError || !request) return response(req, { ok: false, error: "Registration request not found" }, 404);
    if (request.submission_id) {
      return response(req, { ok: false, error: "Add Business-linked Owner invitations are managed inside Business Field Approval" }, 409);
    }
    if (request.status !== "pending") {
      return response(req, { ok: false, error: "This request has already been reviewed or is being processed" }, 409);
    }

    if (action === "reject") {
      const { data: changed, error } = await db.rpc("finalize_owner_registration", {
        p_request_id: requestId,
        p_action: "reject",
        p_actor_id: actor.id,
        p_owner_user_id: null,
        p_admin_note: note,
      });
      if (error) throw error;
      if (changed !== true) return response(req, { ok: false, error: "This request has already been reviewed" }, 409);
      return response(req, { ok: true, status: "rejected" });
    }

    if (request.submission_id && !request.business_id) {
      return response(req, { ok: false, error: "The business must pass field approval and be published before an owner invitation can be sent" }, 409);
    }
    if (request.business_id) {
      const { data: eligibleBusiness, error: businessError } = await db.from("businesses")
        .select("id,owner_id,status").eq("id", request.business_id).maybeSingle();
      if (businessError || !eligibleBusiness || eligibleBusiness.status !== "published" || eligibleBusiness.owner_id) {
        return response(req, { ok: false, error: "The reviewed business is not available for owner assignment" }, 409);
      }
    }

    const { data: locked, error: lockError } = await db.from("owner_registration_requests")
      .update({ status: "processing", admin_note: note, updated_at: new Date().toISOString() })
      .eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
    if (lockError || !locked) return response(req, { ok: false, error: "This request is already being processed" }, 409);
    lockedId = requestId;

    const siteUrlRaw = Deno.env.get("SITE_URL") ?? "https://hellosadiqabad.com";
    const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;
    const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(request.email, {
      data: { full_name: request.full_name },
      redirectTo: siteUrl + "/reset-password",
    });
    if (inviteError || !invited.user) throw inviteError ?? new Error("Invitation could not be created");
    invitedUserId = invited.user.id;

    const { error: profileError } = await db.from("profiles").upsert({
      id: invitedUserId, role: "owner", full_name: request.full_name, phone: request.phone,
      must_change_password: false, is_active: true, updated_at: new Date().toISOString(),
    }, { onConflict: "id" });
    if (profileError) throw new Error("Owner profile could not be provisioned");

    const { data: finalized, error: finalizeError } = await db.rpc("finalize_owner_registration", {
      p_request_id: requestId,
      p_action: "approve",
      p_actor_id: actor.id,
      p_owner_user_id: invitedUserId,
      p_admin_note: note,
    });

    if (finalizeError) {
      // A network error can occur after the database transaction committed; verify before rollback.
      const { data: latestRequest } = await db.from("owner_registration_requests")
        .select("status").eq("id", requestId).maybeSingle();
      let linked = !request.business_id;
      if (request.business_id) {
        const { data: latestBusiness } = await db.from("businesses")
          .select("owner_id").eq("id", request.business_id).maybeSingle();
        linked = latestBusiness?.owner_id === invitedUserId;
      }
      if (latestRequest?.status === "approved" && linked) {
        lockedId = null;
        invitedUserId = null;
        return response(req, { ok: true, status: "approved" });
      }
      throw finalizeError;
    }
    if (finalized !== true) throw new Error("Owner registration was not finalized");
    lockedId = null;
    invitedUserId = null;
    return response(req, { ok: true, status: "approved" });
  } catch (error) {
    let rollbackFailed = false;
    if (invitedUserId) {
      const { error: deleteError } = await db.auth.admin.deleteUser(invitedUserId);
      rollbackFailed = Boolean(deleteError);
    }
    if (lockedId && !rollbackFailed) {
      await db.from("owner_registration_requests").update({
        status: "pending", admin_note: note ?? null, updated_at: new Date().toISOString(),
      }).eq("id", lockedId).eq("status", "processing");
    } else if (lockedId && rollbackFailed) {
      await db.from("owner_registration_requests").update({
        admin_note: "Automatic invitation rollback failed; manual recovery is required.",
        updated_at: new Date().toISOString(),
      }).eq("id", lockedId).eq("status", "processing");
    }
    return response(req, {
      ok: false,
      error: rollbackFailed
        ? "Invitation rollback needs manual recovery. The request has been left locked to prevent duplicate invitations."
        : error instanceof Error ? error.message : "Request processing failed",
    }, rollbackFailed ? 500 : 400);
  }
});
