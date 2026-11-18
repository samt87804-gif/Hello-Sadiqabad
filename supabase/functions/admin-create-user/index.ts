import { createClient } from "npm:@supabase/supabase-js@2";
import { extractBearerToken, isValidEmail, isValidUuid } from "../_shared/validation.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!supabaseUrl || !serviceRoleKey) throw new Error("Missing Supabase service configuration");

const db = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
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

async function caller(req: Request) {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return null;
  const { data, error } = await db.auth.getUser(token);
  return error ? null : data.user;
}

async function permission(userId: string) {
  const { data: profile, error: profileError } = await db
    .from("profiles").select("role,is_active").eq("id", userId).maybeSingle();
  if (profileError || !profile || profile.is_active !== true) {
    return { allowed: false, root: false };
  }
  if (profile.role === "super_admin") return { allowed: true, root: true };
  if (profile.role !== "staff") return { allowed: false, root: false };

  const { data: staff, error: staffError } = await db
    .from("staff_members").select("staff_types,permissions,is_active")
    .eq("user_id", userId).maybeSingle();
  if (staffError || !staff || staff.is_active !== true) {
    return { allowed: false, root: false };
  }
  const inferred = Array.isArray(staff.staff_types) && staff.staff_types.includes("sales_onboarding");
  const overrides = staff.permissions && typeof staff.permissions === "object" ? staff.permissions : {};
  const override = overrides["owners.create"] ?? overrides["all"];
  return { allowed: override === true || (override !== false && inferred), root: false };
}

async function rollbackCreatedUser(userId: string) {
  // Best-effort compensation: avoid leaving a login behind when provisioning fails.
  await db.auth.admin.deleteUser(userId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const actor = await caller(req);
    if (!actor) return response(req, { ok: false, error: "Unauthorized" }, 401);
    const actorPermission = await permission(actor.id);
    if (!actorPermission.allowed) return response(req, { ok: false, error: "Permission denied" }, 403);

    let body: Record<string, unknown>;
    try {
      const parsed = await req.json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return response(req, { ok: false, error: "Invalid request body" }, 400);
      }
      body = parsed as Record<string, unknown>;
    } catch {
      return response(req, { ok: false, error: "Invalid JSON body" }, 400);
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const role = typeof body.role === "string" ? body.role : "owner";
    const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : null;
    const assignBusinessId = body.assign_business_id;

    if (!isValidEmail(email) || email.length > 254 ||
      password.length < 12 || password.length > 128 ||
      fullName.length < 2 || fullName.length > 120 ||
      !["owner", "staff", "super_admin"].includes(role) ||
      (phone !== null && phone.length < 5)) {
      return response(req, { ok: false, error: "Invalid user details. Password must be at least 12 characters." }, 400);
    }
    if ((role === "super_admin" || role === "staff") && !actorPermission.root) {
      return response(req, { ok: false, error: "Only a super admin can create staff or admin accounts" }, 403);
    }
    if (assignBusinessId !== undefined &&
      (role !== "owner" || !isValidUuid(assignBusinessId))) {
      return response(req, { ok: false, error: "A valid business can only be assigned to an owner account" }, 400);
    }
    if (typeof assignBusinessId === "string") {
      const { data: selectedBusiness, error: selectedBusinessError } = await db.from("businesses")
        .select("id,owner_id").eq("id", assignBusinessId).maybeSingle();
      if (selectedBusinessError) {
        return response(req, { ok: false, error: "The selected listing could not be checked. Please refresh and try again." }, 500);
      }
      if (!selectedBusiness) {
        return response(req, { ok: false, error: "The selected listing no longer exists. Please refresh and choose another listing." }, 404);
      }
      if (selectedBusiness.owner_id !== null) {
        return response(req, { ok: false, error: "This listing is already assigned to another owner. Please choose an unassigned listing." }, 409);
      }
    }

    if (role === "staff" && body.staff_types !== undefined &&
      (!Array.isArray(body.staff_types) || body.staff_types.some((item) =>
        !["data_entry", "importer", "sales_onboarding", "listing_manager", "moderator", "support"].includes(String(item))
      ))) {
      return response(req, { ok: false, error: "Invalid staff types" }, 400);
    }
    if (role === "staff" && body.permissions !== undefined &&
      (!body.permissions || typeof body.permissions !== "object" || Array.isArray(body.permissions))) {
      return response(req, { ok: false, error: "Invalid staff permissions" }, 400);
    }

    const { data: created, error: createError } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) {
      return response(req, { ok: false, error: createError?.message ?? "Could not create account" }, 400);
    }

    const userId = created.user.id;
    const { error: profileError } = await db.from("profiles").upsert({
      id: userId,
      role,
      full_name: fullName,
      phone,
      must_change_password: true,
    });
    if (profileError) {
      await rollbackCreatedUser(userId);
      return response(req, { ok: false, error: "Account profile could not be created; account creation was rolled back." }, 500);
    }

    if (role === "staff") {
      const { error: staffError } = await db.from("staff_members").upsert({
        user_id: userId,
        staff_types: Array.isArray(body.staff_types) ? body.staff_types : [],
        permissions: body.permissions ?? {},
        is_active: true,
      });
      if (staffError) {
        await rollbackCreatedUser(userId);
        return response(req, { ok: false, error: "Staff permissions could not be saved; account creation was rolled back." }, 500);
      }
    }

    if (typeof assignBusinessId === "string") {
      const { data: business, error: businessError } = await db.from("businesses")
        .update({ owner_id: userId }).eq("id", assignBusinessId).is("owner_id", null)
        .select("id,owner_id").maybeSingle();
      if (businessError || !business || business.owner_id !== userId) {
        await rollbackCreatedUser(userId);
        return response(req, {
          ok: false,
          error: businessError
            ? "The listing could not be assigned. The new owner account was rolled back; please retry."
            : "This listing was assigned elsewhere before the request completed. The new owner account was rolled back; please choose another listing.",
        }, businessError ? 500 : 409);
      }
    }

    return response(req, { ok: true, data: { user_id: userId } });
  } catch {
    return response(req, { ok: false, error: "Account provisioning failed unexpectedly." }, 500);
  }
});
