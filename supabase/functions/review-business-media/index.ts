import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
if (!url || !serviceRoleKey) throw new Error("Missing Supabase service configuration");
const db = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const pendingBucket = "hs-pending-business-media";
const publicBucket = "Hello Sadiqabad";
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

async function hasObject(bucket: string, path: string): Promise<boolean> {
  const slash = path.lastIndexOf("/");
  if (slash < 1) return false;
  const folder = path.slice(0, slash);
  const fileName = path.slice(slash + 1);
  const { data, error } = await db.storage.from(bucket).list(folder);
  if (error) throw error;
  return (data ?? []).some((item) => item.name === fileName);
}

async function removeIfPresent(bucket: string, path: string) {
  if (!await hasObject(bucket, path)) return;
  const { error } = await db.storage.from(bucket).remove([path]);
  if (error) throw error;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  try {
    const authorization = req.headers.get("authorization") ?? "";
    const token = authorization.toLowerCase().startsWith("bearer ") ? authorization.slice(7).trim() : null;
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

    const { data: asset, error: assetError } = await db.from("business_media_assets")
      .select("id,submission_id,business_id,media_field,bucket_id,storage_path,mime_type,status")
      .eq("id", assetId).maybeSingle();
    if (assetError || !asset) return response(req, { ok: false, error: "Business media asset not found" }, 404);
    if (asset.bucket_id !== pendingBucket || !["logo", "cover", "gallery"].includes(asset.media_field)) {
      return response(req, { ok: false, error: "Invalid private media asset" }, 400);
    }
    if (asset.status === "rejected" && action === "approved_published") {
      return response(req, { ok: false, error: "Rejected media cannot be published" }, 409);
    }
    if (action === "unpublished" && !["approved_published", "removal_requested"].includes(asset.status)) {
      return response(req, { ok: false, error: "Only a published image can be unpublished" }, 409);
    }

    let businessId = asset.business_id as string | null;
    if (!businessId && asset.submission_id) {
      const { data: submission, error } = await db.from("submissions")
        .select("business_id").eq("id", asset.submission_id).maybeSingle();
      if (error) throw error;
      businessId = submission?.business_id ?? null;
    }

    const extension = asset.mime_type === "image/jpeg" ? "jpg" : asset.mime_type === "image/png" ? "png" : "webp";
    const publicPath = businessId ? `businesses/${businessId}/${asset.media_field}/${asset.id}.${extension}` : null;
    const column = asset.media_field === "logo" ? "logo_url" : "cover_url";
    let approvalRollback: { businessId: string; column: string; previousUrl: string | null; publicUrl: string; publicPath: string } | null = null;

    if (action === "approved_published") {
      if (!businessId || !publicPath) {
        const { data: deferred, error: deferError } = await db.rpc("finalize_business_media_review", {
          p_asset_id: assetId,
          p_action: "approved_pending_promotion",
          p_actor_id: auth.user.id,
          p_admin_note: note,
        });
        if (deferError) throw deferError;
        return response(req, { ok: true, status: "approved_pending_promotion", waiting_for_business: true, changed: deferred === true });
      }
      const { data: business, error: businessReadError } = await db.from("businesses")
        .select("id,status,plan_code,logo_url,cover_url,gallery_urls").eq("id", businessId).maybeSingle();
      if (businessReadError) throw businessReadError;
      if (!business || business.status !== "published") {
        const { data: deferred, error: deferError } = await db.rpc("finalize_business_media_review", {
          p_asset_id: assetId,
          p_action: "approved_pending_promotion",
          p_actor_id: auth.user.id,
          p_admin_note: note,
        });
        if (deferError) throw deferError;
        return response(req, { ok: true, status: "approved_pending_promotion", waiting_for_business: true, changed: deferred === true });
      }
      if (asset.media_field === "cover") {
        const { data: plan, error: planError } = await db.from("plans").select("features").eq("code", business.plan_code).maybeSingle();
        if (planError) throw planError;
        if (!plan?.features?.cover) {
          const { data: deferred, error: deferError } = await db.rpc("finalize_business_media_review", {
            p_asset_id: assetId,
            p_action: "approved_pending_promotion",
            p_actor_id: auth.user.id,
            p_admin_note: note,
          });
          if (deferError) throw deferError;
          return response(req, { ok: true, status: "approved_pending_promotion", waiting_for_plan: true, changed: deferred === true });
        }
      }

      if (asset.media_field === "gallery") {
        const { data: plan, error: planError } = await db.from("plans").select("limits").eq("code", business.plan_code).maybeSingle();
        if (planError) throw planError;
        const maxGallery = Number(plan?.limits?.gallery ?? 0);
        if (maxGallery <= 0 || (business.gallery_urls ?? []).length >= maxGallery) {
          const { data: deferred, error: deferError } = await db.rpc("finalize_business_media_review", {
            p_asset_id: assetId, p_action: "approved_pending_promotion",
            p_actor_id: auth.user.id, p_admin_note: note,
          });
          if (deferError) throw deferError;
          return response(req, { ok: true, status: "approved_pending_promotion", waiting_for_plan: true, changed: deferred === true });
        }
      }
      const previousUrl = (asset.media_field === "logo" ? business.logo_url : business.cover_url) ?? null;
      if (!await hasObject(publicBucket, publicPath)) {
        const { error: copyError } = await db.storage.from(pendingBucket).copy(asset.storage_path, publicPath, { destinationBucket: publicBucket });
        if (copyError && !await hasObject(publicBucket, publicPath)) throw copyError;
      }
      const { data: publicData } = db.storage.from(publicBucket).getPublicUrl(publicPath);
      const updatePayload = asset.media_field === "gallery"
        ? { gallery_urls: [...new Set([...(business.gallery_urls ?? []), publicData.publicUrl])], updated_at: new Date().toISOString() }
        : { [column]: publicData.publicUrl, updated_at: new Date().toISOString() };
      const { data: updatedBusiness, error: businessUpdateError } = await db.from("businesses")
        .update(updatePayload).eq("id", businessId).eq("status", "published").select("id").maybeSingle();
      if (businessUpdateError || !updatedBusiness) {
        await removeIfPresent(publicBucket, publicPath).catch(() => undefined);
        throw businessUpdateError ?? new Error("The published business could not be updated");
      }
      approvalRollback = { businessId, column, previousUrl, publicUrl: publicData.publicUrl, publicPath };
    } else if ((action === "unpublished" || action === "rejected") && businessId && publicPath) {
      if (asset.media_field === "gallery" && action === "unpublished") {
        const { data: business, error: businessReadError } = await db.from("businesses")
          .select("gallery_urls").eq("id", businessId).maybeSingle();
        if (businessReadError) throw businessReadError;
        const nextGallery = (business?.gallery_urls ?? []).filter((value: string) => !value.includes(publicPath));
        const { error: updateError } = await db.from("businesses")
          .update({ gallery_urls: nextGallery, updated_at: new Date().toISOString() }).eq("id", businessId);
        if (updateError) throw updateError;
      } else if (asset.media_field !== "gallery") {
        const { data: business, error: businessReadError } = await db.from("businesses")
          .select("logo_url,cover_url").eq("id", businessId).maybeSingle();
        if (businessReadError) throw businessReadError;
        const currentUrl = asset.media_field === "logo" ? business?.logo_url : business?.cover_url;
        if (currentUrl?.includes(publicPath)) {
          const { error: clearError } = await db.from("businesses")
            .update({ [column]: null, updated_at: new Date().toISOString() }).eq("id", businessId);
          if (clearError) throw clearError;
        }
      }
      await removeIfPresent(publicBucket, publicPath);
    }

    const { data: finalized, error: finalizeError } = await db.rpc("finalize_business_media_review", {
      p_asset_id: assetId,
      p_action: action,
      p_actor_id: auth.user.id,
      p_admin_note: note,
    });
    if (finalizeError) {
      const { data: latestAsset } = await db.from("business_media_assets").select("status").eq("id", assetId).maybeSingle();
      if (latestAsset?.status !== action) {
        if (action === "approved_published" && approvalRollback) {
          if (asset.media_field === "gallery") {
            const { data: latestBusiness } = await db.from("businesses")
              .select("gallery_urls").eq("id", approvalRollback.businessId).maybeSingle();
            const restoredGallery = (latestBusiness?.gallery_urls ?? []).filter((value: string) => !value.includes(approvalRollback.publicPath));
            await db.from("businesses").update({ gallery_urls: restoredGallery, updated_at: new Date().toISOString() })
              .eq("id", approvalRollback.businessId);
          } else {
            await db.from("businesses").update({
              [approvalRollback.column]: approvalRollback.previousUrl,
              updated_at: new Date().toISOString(),
            }).eq("id", approvalRollback.businessId).eq(approvalRollback.column, approvalRollback.publicUrl);
          }
          await removeIfPresent(publicBucket, approvalRollback.publicPath).catch(() => undefined);
        }
        throw finalizeError;
      }
    }

    let privateCleanupPending = false;
    if (action === "rejected") {
      try {
        await removeIfPresent(pendingBucket, asset.storage_path);
      } catch {
        privateCleanupPending = true;
      }
    }

    return response(req, { ok: true, status: action, changed: finalized === true, private_cleanup_pending: privateCleanupPending });
  } catch (error) {
    return response(req, { ok: false, error: error instanceof Error ? error.message : "Media review failed" }, 400);
  }
});
