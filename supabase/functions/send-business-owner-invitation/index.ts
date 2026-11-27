import { createClient } from "npm:@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service configuration");

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173")
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

async function getActor(req: Request) {
  const authorization = req.headers.get("authorization") ?? "";
  const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : null;
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

async function canReviewBusiness(userId: string) {
  const { data: profile, error } = await db.from("profiles")
    .select("role,is_active").eq("id", userId).maybeSingle();
  if (error || !profile || profile.is_active !== true) return false;
  if (profile.role === "super_admin") return true;
  if (profile.role !== "staff") return false;
  const { data: staff } = await db.from("staff_members")
    .select("staff_types,permissions,is_active").eq("user_id", userId).maybeSingle();
  if (!staff || staff.is_active !== true) return false;
  const overrides = staff.permissions && typeof staff.permissions === "object" ? staff.permissions : {};
  return overrides["moderation.review"] === true ||
    (overrides["moderation.review"] !== false && ["moderator", "support"].some((type) => (staff.staff_types ?? []).includes(type)));
}

async function findAuthUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => (user.email ?? "").toLowerCase() === normalized);
    if (match) return match;
    if (data.users.length < 1000) return null;
  }
  throw new Error("Could not safely confirm whether an Owner account already exists. Retry later.");
}

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "Owner invitation failed";
  return message.replace(/[\r\n]+/g, " ").slice(0, 1000);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);

  let lockedRequestId: string | null = null;
  let ownerUserId: string | null = null;
  let createdAuthUser = false;
  try {
    const actor = await getActor(req);
    if (!actor) return response(req, { ok: false, error: "Unauthorized" }, 401);
    if (!(await canReviewBusiness(actor.id))) return response(req, { ok: false, error: "Permission denied" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const requestId = typeof body?.request_id === "string" ? body.request_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) {
      return response(req, { ok: false, error: "Invalid Owner invitation request" }, 400);
    }

    const { data: request, error: readError } = await db.from("owner_registration_requests")
      .select("id,full_name,email,phone,business_id,submission_id,status,invitation_requested,invitation_status,invitation_processing_started_at,invitation_attempts,invitation_user_id")
      .eq("id", requestId).maybeSingle();
    if (readError || !request) return response(req, { ok: false, error: "Linked Owner contact record not found" }, 404);
    if (!request.submission_id) return response(req, { ok: false, error: "Only Add Business-linked Owner invitations are handled here" }, 400);
    if (!request.invitation_requested) return response(req, { ok: false, error: "The Admin has not requested this Owner invitation" }, 409);
    if (request.status === "rejected") return response(req, { ok: false, error: "This Owner request was rejected" }, 409);
    if (request.status === "approved" && request.invitation_status === "sent") {
      return response(req, { ok: true, status: "sent", already_sent: true });
    }

    if (!request.business_id) {
      await db.from("owner_registration_requests").update({
        invitation_status: "waiting_for_business",
        updated_at: new Date().toISOString(),
      }).eq("id", requestId).eq("invitation_requested", true);
      return response(req, { ok: true, status: "waiting_for_business" });
    }

    const { data: business, error: businessError } = await db.from("businesses")
      .select("id,owner_id,status").eq("id", request.business_id).maybeSingle();
    if (businessError || !business || business.status !== "published") {
      await db.from("owner_registration_requests").update({
        invitation_status: "waiting_for_business",
        updated_at: new Date().toISOString(),
      }).eq("id", requestId).eq("invitation_requested", true);
      return response(req, { ok: true, status: "waiting_for_business" });
    }

    if (business.owner_id) {
      if (request.invitation_user_id && business.owner_id === request.invitation_user_id) {
        await db.from("owner_registration_requests").update({
          status: "approved",
          invitation_status: "sent",
          invitation_sent_at: new Date().toISOString(),
          invitation_processing_started_at: null,
          updated_at: new Date().toISOString(),
        }).eq("id", requestId);
        return response(req, { ok: true, status: "sent", already_linked: true });
      }
      return response(req, { ok: false, error: "This business is already assigned to another Owner" }, 409);
    }

    if (!["pending", "failed", "waiting_for_business", "processing"].includes(request.invitation_status)) {
      return response(req, { ok: false, error: "This invitation is not in a retryable state" }, 409);
    }
    if (request.status === "processing" || request.invitation_status === "processing") {
      const startedAt = request.invitation_processing_started_at
        ? new Date(request.invitation_processing_started_at).getTime()
        : 0;
      const stale = startedAt > 0 && Date.now() - startedAt > 15 * 60 * 1000;
      if (!stale) return response(req, { ok: false, error: "This Owner invitation is already being processed" }, 409);
    }
    if (request.status !== "pending" && request.status !== "processing") {
      return response(req, { ok: false, error: "This Owner request is not available for invitation" }, 409);
    }

    const now = new Date().toISOString();
    let claimQuery = db.from("owner_registration_requests")
      .update({
        status: "processing",
        invitation_status: "processing",
        invitation_processing_started_at: now,
        invitation_attempts: (request.invitation_attempts ?? 0) + 1,
        invitation_last_error: null,
        updated_at: now,
      })
      .eq("id", requestId)
      .eq("status", request.status);
    if (request.status === "processing") {
      claimQuery = request.invitation_processing_started_at
        ? claimQuery.eq("invitation_processing_started_at", request.invitation_processing_started_at)
        : claimQuery.is("invitation_processing_started_at", null);
    }
    const { data: claimed, error: claimError } = await claimQuery
      .select("id")
      .maybeSingle();
    if (claimError || !claimed) return response(req, { ok: false, error: "This Owner invitation was claimed by another Admin action" }, 409);
    lockedRequestId = requestId;

    let authUser = null;
    if (request.invitation_user_id) {
      const { data, error } = await db.auth.admin.getUserById(request.invitation_user_id);
      if (!error && data.user) authUser = data.user;
    }
    if (!authUser) {
      authUser = await findAuthUserByEmail(request.email);
    }

    const siteUrlRaw = Deno.env.get("SITE_URL") ?? "https://hellosadiqabad.com";
    const siteUrl = siteUrlRaw.endsWith("/") ? siteUrlRaw.slice(0, -1) : siteUrlRaw;

    if (!authUser) {
      const { data: invited, error: inviteError } = await db.auth.admin.inviteUserByEmail(request.email, {
        data: { full_name: request.full_name },
        redirectTo: siteUrl + "/reset-password",
      });
      if (inviteError || !invited.user) {
        // Recover safely if Auth created the invite but the response was interrupted.
        authUser = await findAuthUserByEmail(request.email);
        if (!authUser) throw inviteError ?? new Error("Invitation could not be created");
      } else {
        authUser = invited.user;
        createdAuthUser = true;
      }
    }
    ownerUserId = authUser.id;

    const { error: persistUserError } = await db.from("owner_registration_requests").update({
      invitation_user_id: ownerUserId,
      updated_at: new Date().toISOString(),
    }).eq("id", requestId).eq("status", "processing");
    if (persistUserError) throw persistUserError;

    const { data: existingProfile, error: profileReadError } = await db.from("profiles")
      .select("role,is_active").eq("id", ownerUserId).maybeSingle();
    if (profileReadError) throw profileReadError;
    if (existingProfile && ["super_admin", "staff"].includes(existingProfile.role)) {
      throw new Error("This email already belongs to a staff or Admin account and cannot be converted to a business Owner");
    }
    if (existingProfile?.role === "owner" && existingProfile.is_active === false) {
      throw new Error("This Owner account is inactive. Reactivate it from Owners before assigning this business");
    }

    const { error: profileInsertError } = await db.from("profiles").upsert({
      id: ownerUserId,
      role: "owner",
      full_name: request.full_name,
      phone: request.phone,
      must_change_password: false,
      is_active: true,
      updated_at: new Date().toISOString(),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (profileInsertError) throw new Error("Owner profile could not be created: " + safeError(profileInsertError));

    const { data: provisionedProfile, error: provisionedProfileError } = await db.from("profiles")
      .select("role,is_active").eq("id", ownerUserId).maybeSingle();
    if (provisionedProfileError || !provisionedProfile) {
      throw new Error("Owner profile could not be verified: " + safeError(provisionedProfileError));
    }
    if (["super_admin", "staff"].includes(provisionedProfile.role)) {
      throw new Error("This email belongs to a staff or Admin account and cannot be converted to a business Owner");
    }
    if (provisionedProfile.role === "owner" && provisionedProfile.is_active === false) {
      throw new Error("This Owner account is inactive. Reactivate it from Owners before assigning this business");
    }
    if (provisionedProfile.role !== "owner" || provisionedProfile.is_active !== true) {
      const { error: profileUpdateError } = await db.from("profiles").update({
        role: "owner", is_active: true, must_change_password: false, updated_at: new Date().toISOString(),
      }).eq("id", ownerUserId);
      if (profileUpdateError) throw new Error("Owner profile could not be activated: " + safeError(profileUpdateError));
    }

    const { data: finalized, error: finalizeError } = await db.rpc("finalize_owner_registration", {
      p_request_id: requestId,
      p_action: "approve",
      p_actor_id: actor.id,
      p_owner_user_id: ownerUserId,
      p_admin_note: null,
    });
    if (finalizeError) {
      const { data: latestRequest } = await db.from("owner_registration_requests")
        .select("status").eq("id", requestId).maybeSingle();
      const { data: latestBusiness } = await db.from("businesses")
        .select("owner_id").eq("id", request.business_id).maybeSingle();
      if (latestRequest?.status === "approved" && latestBusiness?.owner_id === ownerUserId) {
        await db.from("owner_registration_requests").update({
          invitation_status: "sent",
          invitation_sent_at: new Date().toISOString(),
          invitation_processing_started_at: null,
          invitation_last_error: null,
          invitation_user_id: ownerUserId,
          updated_at: new Date().toISOString(),
        }).eq("id", requestId);
        lockedRequestId = null;
        return response(req, { ok: true, status: "sent", recovered: true });
      }
      throw finalizeError;
    }
    if (finalized !== true) throw new Error("Owner registration was not finalized");

    const { error: sentError } = await db.from("owner_registration_requests").update({
      invitation_status: "sent",
      invitation_sent_at: new Date().toISOString(),
      invitation_processing_started_at: null,
      invitation_last_error: null,
      invitation_user_id: ownerUserId,
      updated_at: new Date().toISOString(),
    }).eq("id", requestId).eq("status", "approved");
    if (sentError) throw sentError;

    lockedRequestId = null;
    return response(req, { ok: true, status: "sent", owner_user_id: ownerUserId });
  } catch (error) {
    let rollbackFailed = false;
    if (createdAuthUser && ownerUserId) {
      const { error: deleteError } = await db.auth.admin.deleteUser(ownerUserId);
      rollbackFailed = Boolean(deleteError);
    }

    if (lockedRequestId && !rollbackFailed) {
      const { data: latest } = await db.from("owner_registration_requests")
        .select("status,business_id,invitation_user_id").eq("id", lockedRequestId).maybeSingle();
      const { data: linkedBusiness } = latest?.business_id
        ? await db.from("businesses").select("owner_id").eq("id", latest.business_id).maybeSingle()
        : { data: null };
      if (latest?.status === "approved" && ownerUserId && linkedBusiness?.owner_id === ownerUserId) {
        await db.from("owner_registration_requests").update({
          invitation_status: "sent",
          invitation_sent_at: new Date().toISOString(),
          invitation_processing_started_at: null,
          invitation_last_error: null,
          invitation_user_id: ownerUserId,
          updated_at: new Date().toISOString(),
        }).eq("id", lockedRequestId);
        return response(req, { ok: true, status: "sent", recovered: true });
      }
      await db.from("owner_registration_requests").update({
        status: "pending",
        invitation_status: "failed",
        invitation_processing_started_at: null,
        invitation_user_id: createdAuthUser ? null : ownerUserId,
        invitation_last_error: safeError(error),
        updated_at: new Date().toISOString(),
      }).eq("id", lockedRequestId).eq("status", "processing");
    } else if (lockedRequestId && rollbackFailed) {
      await db.from("owner_registration_requests").update({
        invitation_last_error: "Auth invite rollback failed; manual recovery is required. " + safeError(error),
        updated_at: new Date().toISOString(),
      }).eq("id", lockedRequestId).eq("status", "processing");
    }

    return response(req, {
      ok: false,
      error: rollbackFailed
        ? "Invitation rollback needs manual recovery. The request remains locked to prevent duplicate invitations."
        : safeError(error),
    }, rollbackFailed ? 500 : 400);
  }
});
