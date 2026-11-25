import { createClient } from "npm:@supabase/supabase-js@2";
function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function hashRateKey(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readJsonObject(req: Request, maxBytes = 16_384): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    await req.body?.cancel();
    return null;
  }
  const reader = req.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

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
    const mediaSessionHash = await hashRateKey(sessionId);
    const sessionAllowed = await limited(`suggestion:session:${sessionId}`, 5, 3600);
    if (!sessionAllowed) return reply(req, { ok: false, error: "Please try again later" }, 429);

    if (validString(body.contact_phone, 5, 30)) {
      const phoneIdentity = await hashRateKey(contactPhoneDigits);
      if (!await limited(`suggestion:phone:${phoneIdentity}`, 3, 86_400)) {
        return reply(req, { ok: false, error: "Please try again later" }, 429);
      }
    }

    const submittedPayload = body.payload as Record<string, unknown>;
    const payload = { ...submittedPayload };
    const rawMediaInput = payload.media_assets;
    if (rawMediaInput !== undefined && !Array.isArray(rawMediaInput)) {
      return reply(req, { ok: false, error: "Invalid business image metadata" }, 400);
    }
    const mediaInput = Array.isArray(rawMediaInput) ? rawMediaInput : [];
    delete payload.media_assets;
    const ownerEmail = typeof submittedPayload.owner_email === "string" ? submittedPayload.owner_email.trim().toLowerCase() : "";
    delete payload.owner_email;
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

    if (body.type === "new_business") {
      if (!validString(payload.owner_name, 2, 100) || !/^[^\s@]+@gmail\.com$/i.test(ownerEmail)) {
        return reply(req, { ok: false, error: "A valid owner name and Gmail address are required" }, 400);
      }
      if (!validString(payload.name_en, 2, 120) || !isValidUuid(payload.category_id) ||
          !isValidUuid(payload.area_id) || !validString(payload.phone_primary, 10, 30) ||
          !validString(payload.address_en, 4, 250)) {
        return reply(req, { ok: false, error: "Complete the required business name, category, area, phone and address fields" }, 400);
      }
      if (!Array.isArray(mediaInput) || mediaInput.length > 2) {
        return reply(req, { ok: false, error: "Invalid business image metadata" }, 400);
      }
    }

    const { data: inserted, error: insertError } = await db.from("submissions").insert({
      type: body.type,
      business_id: businessId,
      payload,
      contact_name: typeof body.contact_name === "string" ? body.contact_name.trim().slice(0, 100) : null,
      contact_phone: typeof body.contact_phone === "string" ? body.contact_phone.trim().slice(0, 30) : null,
      submitted_by: submittedBy,
      status: "new",
    }).select("id").single();
    if (insertError || !inserted?.id) return reply(req, { ok: false, error: "Could not submit request" }, 400);

    if (body.type === "new_business") {
      try {
        if (!submittedBy) {
          const { error: ownerRequestError } = await db.from("owner_registration_requests").insert({
            full_name: String(submittedPayload.owner_name).trim().slice(0, 120),
            email: ownerEmail,
            phone: String(body.contact_phone ?? submittedPayload.phone_primary).trim().slice(0, 30),
            business_name: String(submittedPayload.name_en).trim().slice(0, 160),
            submission_id: inserted.id,
            status: "pending",
          });
          if (ownerRequestError) throw ownerRequestError;
        }

        for (const item of mediaInput as Array<Record<string, unknown>>) {
          const field = item.media_field;
          const storagePath = item.storage_path;
          const mime = item.mime_type;
          const size = Number(item.file_size_bytes);
          const pathMatch = typeof storagePath === "string"
            ? /^pending[/]([a-f0-9]{64})[/]([0-9a-f-]{36})[/](logo|cover)[.](jpg|png|webp)$/i.exec(storagePath)
            : null;
          if (!(["logo", "cover"].includes(String(field)) &&
                pathMatch && pathMatch[1] === mediaSessionHash && pathMatch[3] === field &&
                ["image/jpeg", "image/png", "image/webp"].includes(String(mime)) &&
                Number.isInteger(size) && size > 0 && size <= 5 * 1024 * 1024)) {
            throw new Error("Invalid business image upload");
          }
          const parts = storagePath.split("/");
          const { data: objects, error: objectError } = await db.storage
            .from("hs-pending-business-media").list("pending/" + parts[1] + "/" + parts[2]);
          const uploadedObject = objects?.find((object) => object.name === parts[3]);
          const objectMetadata = uploadedObject?.metadata as Record<string, unknown> | null | undefined;
          const actualSize = Number(objectMetadata?.size ?? objectMetadata?.contentLength);
          const actualMime = objectMetadata?.mimetype;
          if (objectError || !uploadedObject || actualSize !== size || actualMime !== mime) {
            throw new Error("The uploaded business image does not match its declared file type or size");
          }
          const { error: mediaError } = await db.from("business_media_assets").insert({
            submission_id: inserted.id,
            media_field: field,
            bucket_id: "hs-pending-business-media",
            storage_path: storagePath,
            mime_type: mime,
            file_size_bytes: size,
            status: "pending_review",
          });
          if (mediaError) throw mediaError;
        }
      } catch (workflowError) {
        await db.from("owner_registration_requests").delete().eq("submission_id", inserted.id);
        await db.from("submissions").delete().eq("id", inserted.id);
        const paths = (mediaInput as Array<Record<string, unknown>>)
          .map((item) => item.storage_path)
          .filter((path): path is string => typeof path === "string" &&
            new RegExp(`^pending/${mediaSessionHash}/[0-9a-f-]{36}/(logo|cover)\\.(jpg|png|webp)import { createClient } from "npm:@supabase/supabase-js@2";
function extractBearerToken(header: string | null): string | null {
  if (!header) return null;
  const match = /^Bearer\\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function isValidUuid(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function hashRateKey(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readJsonObject(req: Request, maxBytes = 16_384): Promise<Record<string, unknown> | null> {
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    await req.body?.cancel();
    return null;
  }
  const reader = req.body?.getReader();
  if (!reader) return null;
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    return null;
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : null;
  } catch {
    return null;
  }
}

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
    const mediaSessionHash = await hashRateKey(sessionId);
    const sessionAllowed = await limited(`suggestion:session:${sessionId}`, 5, 3600);
    if (!sessionAllowed) return reply(req, { ok: false, error: "Please try again later" }, 429);

    if (validString(body.contact_phone, 5, 30)) {
      const phoneIdentity = await hashRateKey(contactPhoneDigits);
      if (!await limited(`suggestion:phone:${phoneIdentity}`, 3, 86_400)) {
        return reply(req, { ok: false, error: "Please try again later" }, 429);
      }
    }

    const submittedPayload = body.payload as Record<string, unknown>;
    const payload = { ...submittedPayload };
    const rawMediaInput = payload.media_assets;
    if (rawMediaInput !== undefined && !Array.isArray(rawMediaInput)) {
      return reply(req, { ok: false, error: "Invalid business image metadata" }, 400);
    }
    const mediaInput = Array.isArray(rawMediaInput) ? rawMediaInput : [];
    delete payload.media_assets;
    const ownerEmail = typeof submittedPayload.owner_email === "string" ? submittedPayload.owner_email.trim().toLowerCase() : "";
    delete payload.owner_email;
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

    if (body.type === "new_business") {
      if (!validString(payload.owner_name, 2, 100) || !/^[^\s@]+@gmail\.com$/i.test(ownerEmail)) {
        return reply(req, { ok: false, error: "A valid owner name and Gmail address are required" }, 400);
      }
      if (!validString(payload.name_en, 2, 120) || !isValidUuid(payload.category_id) ||
          !isValidUuid(payload.area_id) || !validString(payload.phone_primary, 10, 30) ||
          !validString(payload.address_en, 4, 250)) {
        return reply(req, { ok: false, error: "Complete the required business name, category, area, phone and address fields" }, 400);
      }
      if (!Array.isArray(mediaInput) || mediaInput.length > 2) {
        return reply(req, { ok: false, error: "Invalid business image metadata" }, 400);
      }
    }

    const { data: inserted, error: insertError } = await db.from("submissions").insert({
      type: body.type,
      business_id: businessId,
      payload,
      contact_name: typeof body.contact_name === "string" ? body.contact_name.trim().slice(0, 100) : null,
      contact_phone: typeof body.contact_phone === "string" ? body.contact_phone.trim().slice(0, 30) : null,
      submitted_by: submittedBy,
      status: "new",
    }).select("id").single();
    if (insertError || !inserted?.id) return reply(req, { ok: false, error: "Could not submit request" }, 400);

    if (body.type === "new_business") {
      try {
        if (!submittedBy) {
          const { error: ownerRequestError } = await db.from("owner_registration_requests").insert({
            full_name: String(submittedPayload.owner_name).trim().slice(0, 120),
            email: ownerEmail,
            phone: String(body.contact_phone ?? submittedPayload.phone_primary).trim().slice(0, 30),
            business_name: String(submittedPayload.name_en).trim().slice(0, 160),
            submission_id: inserted.id,
            status: "pending",
          });
          if (ownerRequestError) throw ownerRequestError;
        }

        for (const item of mediaInput as Array<Record<string, unknown>>) {
          const field = item.media_field;
          const storagePath = item.storage_path;
          const mime = item.mime_type;
          const size = Number(item.file_size_bytes);
          const pathMatch = typeof storagePath === "string"
            ? /^pending\\/([a-f0-9]{64})\\/([0-9a-f-]{36})\\/(logo|cover)\\.(jpg|png|webp)$/i.exec(storagePath)
            : null;
          if (!(["logo", "cover"].includes(String(field)) &&
                pathMatch && pathMatch[1] === mediaSessionHash && pathMatch[3] === field &&
                ["image/jpeg", "image/png", "image/webp"].includes(String(mime)) &&
                Number.isInteger(size) && size > 0 && size <= 5 * 1024 * 1024)) {
            throw new Error("Invalid business image upload");
          }
          const parts = storagePath.split("/");
          const { data: objects, error: objectError } = await db.storage
            .from("hs-pending-business-media").list("pending/" + parts[1] + "/" + parts[2]);
          const uploadedObject = objects?.find((object) => object.name === parts[3]);
          const objectMetadata = uploadedObject?.metadata as Record<string, unknown> | null | undefined;
          const actualSize = Number(objectMetadata?.size ?? objectMetadata?.contentLength);
          const actualMime = objectMetadata?.mimetype;
          if (objectError || !uploadedObject || actualSize !== size || actualMime !== mime) {
            throw new Error("The uploaded business image does not match its declared file type or size");
          }
          const { error: mediaError } = await db.from("business_media_assets").insert({
            submission_id: inserted.id,
            media_field: field,
            bucket_id: "hs-pending-business-media",
            storage_path: storagePath,
            mime_type: mime,
            file_size_bytes: size,
            status: "pending_review",
          });
          if (mediaError) throw mediaError;
        }
      } catch (workflowError) {
        await db.from("owner_registration_requests").delete().eq("submission_id", inserted.id);
        await db.from("submissions").delete().eq("id", inserted.id);
, "i").test(path));
        if (paths.length) await db.storage.from("hs-pending-business-media").remove(paths);
        return reply(req, { ok: false, error: workflowError instanceof Error ? workflowError.message : "Business submission could not be completed" }, 400);
      }
    }
    return reply(req, { ok: true, data: { submission_id: inserted.id } });
  } catch {
    return reply(req, { ok: false, error: "Could not process submission" }, 500);
  }
});
