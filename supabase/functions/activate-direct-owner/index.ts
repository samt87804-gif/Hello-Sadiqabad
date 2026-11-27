import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

function reply(req: Request, data: unknown, status = 200) {
  const origin = req.headers.get("origin") ?? "";
  if (origin && !allowedOrigins.includes(origin)) return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  return Response.json(data, { status, headers: {
    "Access-Control-Allow-Origin": origin || allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Vary": "Origin", "Cache-Control": "no-store",
  }});
}

async function actorFor(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const token = header.toLowerCase().startsWith("bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

async function canReview(actorId: string) {
  const { data: profile, error } = await db.from("profiles").select("role,is_active").eq("id", actorId).maybeSingle();
  if (error || !profile || profile.is_active !== true) return false;
  if (profile.role === "super_admin") return true;
  if (profile.role !== "staff") return false;
  const { data: staff, error: staffError } = await db.from("staff_members")
    .select("staff_types,permissions,is_active").eq("user_id", actorId).maybeSingle();
  if (staffError || !staff || staff.is_active !== true) return false;
  const permissions = staff.permissions && typeof staff.permissions === "object" ? staff.permissions as Record<string, unknown> : {};
  return permissions["moderation.review"] === true ||
    (permissions["moderation.review"] !== false && (staff.staff_types ?? []).includes("moderation"));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return reply(req, { ok: true });
  if (req.method !== "POST") return reply(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const actor = await actorFor(req);
    if (!actor) return reply(req, { ok: false, error: "Unauthorized" }, 401);
    if (!await canReview(actor.id)) return reply(req, { ok: false, error: "Moderation permission required" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const requestId = typeof body?.request_id === "string" ? body.request_id : "";
    if (!/^[0-9a-f-]{36}$/i.test(requestId) || body?.identity_verified !== true) {
      return reply(req, { ok: false, error: "Confirm the Owner identity and business authority before activation." }, 400);
    }

    const { data: request, error: requestError } = await db.from("owner_registration_requests")
      .select("id,email,full_name,phone,business_name,submission_id,business_id,status,direct_auth_user_id")
      .eq("id", requestId).maybeSingle();
    if (requestError || !request || !request.direct_auth_user_id || !request.submission_id) {
      return reply(req, { ok: false, error: "Direct Owner registration was not found." }, 404);
    }

    const { data: business, error: businessError } = await db.from("businesses")
      .select("id,status,owner_id").eq("id", request.business_id).maybeSingle();
    if (businessError || !business || business.status !== "published") {
      return reply(req, { ok: false, error: "The business must be published before Owner activation." }, 409);
    }
    if (business.owner_id && business.owner_id !== request.direct_auth_user_id) {
      return reply(req, { ok: false, error: "This business is already linked to another Owner." }, 409);
    }

    const requiredFields = ["name_en", "category_id", "area_id", "phone_primary", "address_en"];
    const { data: reviews, error: reviewsError } = await db.from("business_field_reviews")
      .select("field_key,status").eq("submission_id", request.submission_id).in("field_key", requiredFields);
    if (reviewsError) throw reviewsError;
    const approved = new Set((reviews ?? []).filter((item) => item.status === "approved_published").map((item) => item.field_key));
    if (requiredFields.some((key) => !approved.has(key))) {
      return reply(req, { ok: false, error: "All five required business fields must be approved before Owner activation." }, 409);
    }

    const { count: pendingMedia, error: mediaError } = await db.from("business_media_assets")
      .select("id", { count: "exact", head: true }).eq("submission_id", request.submission_id)
      .in("status", ["pending_review", "approved_pending_promotion"]);
    if (mediaError) throw mediaError;
    if ((pendingMedia ?? 0) > 0) {
      return reply(req, { ok: false, error: "Review all submitted business images before activating this Owner." }, 409);
    }

    const { data: targetProfile, error: profileReadError } = await db.from("profiles")
      .select("id,role,is_active").eq("id", request.direct_auth_user_id).maybeSingle();
    if (profileReadError || !targetProfile || targetProfile.role !== "owner") {
      return reply(req, { ok: false, error: "The linked Owner account could not be verified." }, 409);
    }

    if (request.status !== "approved") {
      const { data: locked, error: lockError } = await db.from("owner_registration_requests")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", requestId).eq("status", "pending").select("id").maybeSingle();
      if (lockError || !locked) return reply(req, { ok: false, error: "This registration is already being reviewed." }, 409);

      const { data: finalized, error: finalizeError } = await db.rpc("finalize_owner_registration", {
        p_request_id: requestId, p_action: "approve", p_actor_id: actor.id,
        p_owner_user_id: request.direct_auth_user_id,
        p_admin_note: "Direct registration: identity and business authority manually verified before activation.",
      });
      if (finalizeError || finalized !== true) {
        const { data: latest } = await db.from("owner_registration_requests").select("status").eq("id", requestId).maybeSingle();
        if (latest?.status !== "approved") {
          await db.from("owner_registration_requests").update({ status: "pending" }).eq("id", requestId).eq("status", "processing");
          throw finalizeError ?? new Error("Owner registration could not be finalized.");
        }
      }
    } else if (business.owner_id !== request.direct_auth_user_id) {
      return reply(req, { ok: false, error: "Approved registration does not match the linked business Owner." }, 409);
    }

    const { data: authUser, error: authReadError } = await db.auth.admin.getUserById(request.direct_auth_user_id);
    if (authReadError || !authUser.user || authUser.user.email?.toLowerCase() !== request.email.toLowerCase()) {
      return reply(req, { ok: false, error: "The linked Auth identity does not match the registration email." }, 409);
    }
    const appMetadata = { ...(authUser.user.app_metadata ?? {}), owner_registration_status: "approved" };
    const { error: authUpdateError } = await db.auth.admin.updateUserById(request.direct_auth_user_id, { app_metadata: appMetadata, ban_duration: "none" });
    if (authUpdateError) throw new Error("Business was linked, but Auth activation needs a retry.");
    const { error: activateError } = await db.from("profiles").update({
      is_active: true, full_name: request.full_name, phone: request.phone, updated_at: new Date().toISOString(),
    }).eq("id", request.direct_auth_user_id).eq("role", "owner");
    if (activateError) throw new Error("Business was linked, but profile activation needs a retry.");

    await db.from("audit_logs").insert({
      actor_id: actor.id, action: "owner_direct_registration.activated",
      entity: "owner_registration_requests", entity_id: requestId,
      details: { owner_user_id: request.direct_auth_user_id, business_id: business.id, submission_id: request.submission_id, identity_verified: true },
    });
    return reply(req, { ok: true, status: "approved", business_id: business.id });
  } catch (error) {
    return reply(req, { ok: false, error: error instanceof Error ? error.message : "Owner activation failed." }, 400);
  }
});
