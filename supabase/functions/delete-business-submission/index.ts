import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!url || !serviceRoleKey || !anonKey) throw new Error("Missing Supabase service configuration");

const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173")
  .split(",").map((value) => value.trim()).filter(Boolean);

function reply(req: Request, data: unknown, status = 200) {
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

function bearer(req: Request) {
  const value = req.headers.get("authorization") ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return reply(req, { ok: true });
  if (req.method !== "POST") return reply(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const token = bearer(req);
    if (!token) return reply(req, { ok: false, error: "Unauthorized" }, 401);

    const { data: authData, error: authError } = await db.auth.getUser(token);
    const actor = authData.user;
    if (authError || !actor) return reply(req, { ok: false, error: "Unauthorized" }, 401);

    const { data: profile, error: profileError } = await db.from("profiles")
      .select("role,is_active").eq("id", actor.id).maybeSingle();
    if (profileError || !profile || profile.role !== "super_admin" || profile.is_active !== true) {
      return reply(req, { ok: false, error: "Only an active Super Admin can delete a business registration request." }, 403);
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const submissionId = typeof body?.submission_id === "string" ? body.submission_id : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId)) {
      return reply(req, { ok: false, error: "Invalid business request reference." }, 400);
    }

    const { data: submission, error: submissionError } = await db.from("submissions")
      .select("id,type,status,business_id").eq("id", submissionId).maybeSingle();
    if (submissionError || !submission || submission.type !== "new_business") {
      return reply(req, { ok: false, error: "Business registration request was not found." }, 404);
    }
    if (!["new", "in_review"].includes(submission.status) || submission.business_id) {
      return reply(req, { ok: false, error: "Only an unapproved request without a created business listing can be deleted." }, 409);
    }

    const { data: ownerRequest, error: ownerError } = await db.from("owner_registration_requests")
      .select("id,status,invitation_status,direct_auth_user_id").eq("submission_id", submissionId).maybeSingle();
    if (ownerError) throw ownerError;
    if (ownerRequest?.direct_auth_user_id) {
      const { data: authTarget, error: authTargetError } = await db.auth.admin.getUserById(ownerRequest.direct_auth_user_id);
      if (authTargetError || !authTarget.user ||
          authTarget.user.app_metadata?.owner_registration_status !== "pending_admin_approval") {
        return reply(req, { ok: false, error: "The linked Auth account is not a pending direct-registration account; deletion is blocked for safety." }, 409);
      }
    }

    const userDb = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: deleted, error: deleteError } = await userDb.rpc("admin_delete_pending_business_submission", {
      p_submission_id: submissionId,
    });
    if (deleteError) {
      return reply(req, { ok: false, error: deleteError.message || "Business request could not be deleted." }, 409);
    }
    if (!deleted?.ok) return reply(req, { ok: false, error: "Business request deletion could not be verified." }, 409);

    const cleanupWarnings: string[] = [];
    const storagePaths = Array.isArray(deleted.storage_paths)
      ? deleted.storage_paths.filter((path: unknown): path is string => typeof path === "string" && path.length > 0)
      : [];
    if (storagePaths.length) {
      const { error: storageError } = await db.storage.from("hs-pending-business-media").remove(storagePaths);
      if (storageError) cleanupWarnings.push("The request was deleted, but one or more private image files need storage cleanup.");
    }

    const directAuthUserId = typeof deleted.direct_auth_user_id === "string" ? deleted.direct_auth_user_id : null;
    if (directAuthUserId) {
      const { error: authDeleteError } = await db.auth.admin.deleteUser(directAuthUserId);
      if (authDeleteError) cleanupWarnings.push("The request was deleted, but its inactive pending Auth account could not be removed automatically.");
    }

    return reply(req, {
      ok: true,
      deleted: true,
      cleanup_warning: cleanupWarnings.length ? cleanupWarnings.join(" ") : null,
    });
  } catch (error) {
    return reply(req, { ok: false, error: error instanceof Error ? error.message : "Business request deletion failed." }, 400);
  }
});
