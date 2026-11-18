import { createClient } from "npm:@supabase/supabase-js@2";
import { extractBearerToken, isValidUuid } from "../_shared/validation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const token = extractBearerToken(req.headers.get("authorization"));
    if (!token) return response(req, { ok: false, error: "Unauthorized" }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return response(req, { ok: false, error: "Unauthorized" }, 401);
    const actorId = auth.user.id;
    const { data: actor, error: actorError } = await db.from("profiles").select("role,is_active").eq("id", actorId).maybeSingle();
    if (actorError || !actor || actor.is_active !== true) return response(req, { ok: false, error: "Permission denied" }, 403);
    let allowed = actor.role === "super_admin";
    if (actor.role === "staff") {
      const { data: staff, error } = await db.from("staff_members").select("staff_types,permissions,is_active").eq("user_id", actorId).maybeSingle();
      if (!error && staff?.is_active === true) {
        const overrides = staff.permissions && typeof staff.permissions === "object" ? staff.permissions : {};
        const inferred = Array.isArray(staff.staff_types) && staff.staff_types.includes("sales_onboarding");
        const override = overrides["owners.manage"] ?? overrides["owners.create"] ?? overrides["all"];
        allowed = override === true || (override !== false && inferred);
      }
    }
    if (!allowed) return response(req, { ok: false, error: "Permission denied" }, 403);

    let body: Record<string, unknown>;
    try { const parsed = await req.json(); if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error(); body = parsed as Record<string, unknown>; }
    catch { return response(req, { ok: false, error: "Invalid request body" }, 400); }
    const ownerId = typeof body.owner_id === "string" ? body.owner_id : "";
    const businessIds = body.business_ids;
    if (!isValidUuid(ownerId) || !Array.isArray(businessIds) || businessIds.length > 500 ||
      businessIds.some((id) => typeof id !== "string" || !isValidUuid(id)) ||
      new Set(businessIds).size !== businessIds.length) {
      return response(req, { ok: false, error: "Select a valid owner and listing set (maximum 500)." }, 400);
    }
    const { data: owner, error: ownerError } = await db.from("profiles").select("id,role,is_active").eq("id", ownerId).maybeSingle();
    if (ownerError || !owner || owner.role !== "owner" || owner.is_active !== true) return response(req, { ok: false, error: "Active owner account not found." }, 404);

    const { data: currentRows, error: currentError } = await db.from("businesses").select("id").eq("owner_id", ownerId);
    if (currentError) return response(req, { ok: false, error: "Could not load the owner's current listings." }, 500);
    const currentIds = (currentRows ?? []).map((row) => row.id as string);
    const desiredIds = businessIds as string[];
    const additions = desiredIds.filter((id) => !currentIds.includes(id));
    const removals = currentIds.filter((id) => !desiredIds.includes(id));

    if (desiredIds.length) {
      const { data: selected, error: selectedError } = await db.from("businesses").select("id,owner_id").in("id", desiredIds);
      if (selectedError || (selected ?? []).length !== desiredIds.length) return response(req, { ok: false, error: "One or more selected listings no longer exist. Refresh and try again." }, 404);
      if ((selected ?? []).some((row) => row.owner_id !== null && row.owner_id !== ownerId)) return response(req, { ok: false, error: "A selected listing is already assigned to another owner. It was not transferred." }, 409);
    }

    let newlyAssigned: string[] = [];
    if (additions.length) {
      const { data: updated, error } = await db.from("businesses").update({ owner_id: ownerId }).in("id", additions).is("owner_id", null).select("id");
      newlyAssigned = (updated ?? []).map((row) => row.id as string);
      if (error || newlyAssigned.length !== additions.length) {
        if (newlyAssigned.length) await db.from("businesses").update({ owner_id: null }).in("id", newlyAssigned).eq("owner_id", ownerId);
        return response(req, { ok: false, error: "Some listings changed ownership while saving. No new assignments were kept; refresh and try again." }, 409);
      }
    }
    if (removals.length) {
      const { error } = await db.from("businesses").update({ owner_id: null }).in("id", removals).eq("owner_id", ownerId);
      if (error) {
        if (newlyAssigned.length) await db.from("businesses").update({ owner_id: null }).in("id", newlyAssigned).eq("owner_id", ownerId);
        return response(req, { ok: false, error: "Could not finish removing old assignments. Please refresh and retry." }, 500);
      }
    }
    return response(req, { ok: true, data: { assigned_count: desiredIds.length } });
  } catch {
    return response(req, { ok: false, error: "Owner listing update failed unexpectedly." }, 500);
  }
});
