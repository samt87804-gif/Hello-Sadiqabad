import { createClient } from "npm:@supabase/supabase-js@2";
import { extractBearerToken, hashRateKey, isValidUuid, readJsonObject } from "../_shared/validation.ts";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const allowedOrigins = (Deno.env.get("ALLOWED_ORIGINS") ??
  "https://hello-sadiqabad-2bs.pages.dev,https://hellosadiqabad.com,https://www.hellosadiqabad.com,http://localhost:3000,http://localhost:5173,http://127.0.0.1:5173")
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

async function limited(key: string, limit: number, seconds: number) {
  const { data, error } = await db.rpc("check_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: seconds,
  });
  return !error && data === true;
}

function validString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}

async function authenticatedOwnerId(req: Request): Promise<string | null> {
  const token = extractBearerToken(req.headers.get("authorization"));
  if (!token) return null;
  const { data: authData, error: authError } = await db.auth.getUser(token);
  if (authError || !authData.user) return null;

  const { data: profile, error: profileError } = await db.from("profiles")
    .select("role,is_active").eq("id", authData.user.id).maybeSingle();
  if (profileError || profile?.role !== "owner" || profile.is_active !== true) return null;
  return authData.user.id;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return reply(req, { ok: true });
  if (req.method !== "POST") return reply(req, { ok: false, error: "Method not allowed" }, 405);

  try {
    const body = await readJsonObject(req, 12_288);
    if (!body) return reply(req, { ok: false, error: "Invalid or oversized request body" }, 400);
    if (body.website_hp) return reply(req, { ok: true });

    const types = ["new_business", "correction", "claim", "phone_suggestion", "report", "broken_image", "plan_upgrade"];
    if (typeof body.type !== "string" || !types.includes(body.type) ||
      !body.payload || typeof body.payload !== "object" || Array.isArray(body.payload)) {
      return reply(req, { ok: false, error: "Invalid submission" }, 400);
    }
    if (new TextEncoder().encode(JSON.stringify(body.payload)).byteLength > 8_192) {
      return reply(req, { ok: false, error: "Submission details are too large" }, 400);
    }
    if (body.business_id !== undefined && body.business_id !== null && !isValidUuid(body.business_id)) {
      return reply(req, { ok: false, error: "Invalid business reference" }, 400);
    }
    if (body.contact_name !== undefined && body.contact_name !== null && !validString(body.contact_name, 2, 100)) {
      return reply(req, { ok: false, error: "Invalid contact name" }, 400);
    }
    if (body.contact_phone !== undefined && body.contact_phone !== null && !validString(body.contact_phone, 5, 30)) {
      return reply(req, { ok: false, error: "Invalid contact phone" }, 400);
    }
    const contactPhoneDigits = typeof body.contact_phone === "string" ? body.contact_phone.replace(/\D/g, "") : "";
    if (typeof body.contact_phone === "string" && contactPhoneDigits.length < 5) {
      return reply(req, { ok: false, error: "Invalid contact phone" }, 400);
    }

    const sessionId = validString(body.session_id, 8, 128) ? body.session_id : "anonymous";
    const sessionAllowed = await limited(`suggestion:session:${sessionId}`, 5, 3600);
    if (!sessionAllowed) return reply(req, { ok: false, error: "Please try again later" }, 429);

    if (validString(body.contact_phone, 5, 30)) {
      const phoneIdentity = await hashRateKey(contactPhoneDigits);
      if (!await limited(`suggestion:phone:${phoneIdentity}`, 3, 86_400)) {
        return reply(req, { ok: false, error: "Please try again later" }, 429);
      }
    }

    const payload = body.payload as Record<string, unknown>;
    const businessId = typeof body.business_id === "string" ? body.business_id : null;
    let submittedBy: string | null = null;

    if (body.type === "plan_upgrade") {
      submittedBy = await authenticatedOwnerId(req);
      if (!submittedBy) {
        return reply(req, { ok: false, error: "Please sign in with your active owner account to request a plan upgrade" }, 403);
      }
      if (!businessId) {
        return reply(req, { ok: false, error: "A business listing is required for a plan upgrade" }, 400);
      }
      if (payload.requested_plan !== "basic" && payload.requested_plan !== "premium") {
        return reply(req, { ok: false, error: "Choose a valid upgrade plan" }, 400);
      }
      const { data: ownedBusiness, error: ownershipError } = await db.from("businesses")
        .select("id")
        .eq("id", businessId)
        .eq("owner_id", submittedBy)
        .maybeSingle();
      if (ownershipError || !ownedBusiness) {
        return reply(req, { ok: false, error: "You can only request an upgrade for a business linked to your account" }, 403);
      }
    } else if (body.type === "claim" || body.type === "new_business") {
      submittedBy = await authenticatedOwnerId(req);
    }

    const { error: insertError } = await db.from("submissions").insert({
      type: body.type,
      business_id: businessId,
      payload,
      contact_name: typeof body.contact_name === "string" ? body.contact_name.trim().slice(0, 100) : null,
      contact_phone: typeof body.contact_phone === "string" ? body.contact_phone.trim().slice(0, 30) : null,
      submitted_by: submittedBy,
      status: "new",
    });
    if (insertError) return reply(req, { ok: false, error: "Could not submit request" }, 400);
    return reply(req, { ok: true });
  } catch {
    return reply(req, { ok: false, error: "Could not process submission" }, 500);
  }
});
