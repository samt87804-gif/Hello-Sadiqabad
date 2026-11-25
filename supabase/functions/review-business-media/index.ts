import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
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

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const token = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "")?.[1]?.trim();
    if (!token) return response(req, { ok: false, error: "Unauthorized" }, 401);
    const { data: auth, error: authError } = await db.auth.getUser(token);
    if (authError || !auth.user) return response(req, { ok: false, error: "Unauthorized" }, 401);
    const { data: profile } = await db.from("profiles").select("role,is_active").eq("id", auth.user.id).maybeSingle();
    let permitted = profile?.role === "super_admin" && profile.is_active === true;
    if (!permitted && profile?.role === "staff" && profile.is_active === true) {
      const { data: staff } = await db.from("staff_members").select("staff_types,permissions,is_active").eq("user_id", auth.user.id).maybeSingle();
      permitted = Boolean(staff?.is_active && (
        staff.permissions?.["moderation.review"] === true ||
        (staff.permissions?.["moderation.review"] !== false && ["moderator", "support"].some((type) => (staff.staff_types ?? []).includes(type)))
      ));
    }
    if (!permitted) return response(req, { ok: false, error: "Permission denied" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const assetId = typeof body?.asset_id === "string" ? body.asset_id : "";
    const action = body?.action;
    const note = typeof body?.admin_note === "string" ? body.admin_note.trim().slice(0, 1000) : null;
    if (!/^[0-9a-f-]{36}$/i.test(assetId) || !["approved_published", "rejected", "unpublished"].includes(String(action))) {
      return response(req, { ok: false, error: "Invalid media review request" }, 400);
    }

    const { data: asset, error: assetError } = await db.from("business_media_assets").select("*").eq("id", assetId).maybeSingle();
    if (assetError || !asset) return response(req, { ok: false, error: "Business media asset not found" }, 404);
    let businessId = asset.business_id as string | null;
    if (!businessId && asset.submission_id) {
      const { data: submission } = await db.from("submissions").select("business_id").eq("id", asset.submission_id).maybeSingle();
      businessId = submission?.business_id ?? null;
    }
    if (action === "approved_published" && !businessId) {
      return response(req, { ok: false, error: "Approve the required business fields first; the business is not published yet" }, 409);
    }

    const extension = asset.mime_type === "image/jpeg" ? "jpg" : asset.mime_type === "image/png" ? "png" : "webp";
    const publicPath = businessId ? `businesses/${businessId}/${asset.media_field}/${asset.id}.${extension}` : null;
    if (action === "approved_published" && businessId && publicPath) {
      const { error: copyError } = await db.storage.from(asset.bucket_id).copy(asset.storage_path, publicPath, { destinationBucket: "Hello Sadiqabad" });
      if (copyError) throw copyError;
      const { data: publicData } = db.storage.from("Hello Sadiqabad").getPublicUrl(publicPath);
      const column = asset.media_field === "logo" ? "logo_url" : "cover_url";
      const { error: businessError } = await db.from("businesses").update({ [column]: publicData.publicUrl, updated_at: new Date().toISOString() }).eq("id", businessId);
      if (businessError) {
        await db.storage.from("Hello Sadiqabad").remove([publicPath]);
        throw businessError;
      }
    } else if (action === "unpublished" && businessId && publicPath) {
      const column = asset.media_field === "logo" ? "logo_url" : "cover_url";
      const { data: business } = await db.from("businesses").select("logo_url,cover_url").eq("id", businessId).maybeSingle();
      const currentUrl = asset.media_field === "logo" ? business?.logo_url : business?.cover_url;
      if (currentUrl?.includes(publicPath)) {
        const { error: clearError } = await db.from("businesses").update({ [column]: null, updated_at: new Date().toISOString() }).eq("id", businessId);
        if (clearError) throw clearError;
        await db.storage.from("Hello Sadiqabad").remove([publicPath]);
      }
    }

    const { error: updateError } = await db.from("business_media_assets").update({
      status: action, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString(),
      admin_note: note, updated_at: new Date().toISOString(),
    }).eq("id", assetId);
    if (updateError) throw updateError;
    await db.from("business_image_change_requests").update({
      status: action, reviewed_by: auth.user.id, reviewed_at: new Date().toISOString(), admin_note: note,
    }).eq("media_asset_id", assetId);
    await db.from("audit_logs").insert({
      actor_id: auth.user.id, action: "business_media." + String(action),
      entity: "business_media_assets", entity_id: assetId,
      details: { business_id: businessId, media_field: asset.media_field, storage_path: asset.storage_path },
    });
    return response(req, { ok: true, status: action });
  } catch (error) {
    return response(req, { ok: false, error: error instanceof Error ? error.message : "Media review failed" }, 400);
  }
});
