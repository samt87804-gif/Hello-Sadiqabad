import { createClient } from "npm:@supabase/supabase-js@2";

const url = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
if (!url || !serviceRoleKey || !anonKey) throw new Error("Missing Supabase service configuration");
const adminDb = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const privateBucket = "hs-pending-business-media";
const publicBucket = "Hello Sadiqabad";
const maxBytes = 5 * 1024 * 1024;
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
function bearer(req: Request) {
  const value = req.headers.get("authorization") ?? "";
  return value.toLowerCase().startsWith("bearer ") ? value.slice(7).trim() : null;
}
function uuid(value: unknown): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
function sniff(bytes: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") return "image/webp";
  return null;
}
async function removeIfPresent(bucket: string, path: string) {
  const slash = path.lastIndexOf("/");
  const { data, error } = await adminDb.storage.from(bucket).list(path.slice(0, slash));
  if (error) throw error;
  if ((data ?? []).some((entry) => entry.name === path.slice(slash + 1))) {
    const { error: removeError } = await adminDb.storage.from(bucket).remove([path]);
    if (removeError) throw removeError;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return response(req, { ok: true });
  if (req.method !== "POST") return response(req, { ok: false, error: "Method not allowed" }, 405);
  let copiedPath: string | null = null;
  try {
    const token = bearer(req);
    if (!token) return response(req, { ok: false, error: "Sign in with an Admin account" }, 401);
    const { data: auth, error: authError } = await adminDb.auth.getUser(token);
    if (authError || !auth.user) return response(req, { ok: false, error: "Sign in with an Admin account" }, 401);

    const { data: profile, error: profileError } = await adminDb.from("profiles")
      .select("role,is_active").eq("id", auth.user.id).maybeSingle();
    if (profileError || !profile || profile.is_active !== true) return response(req, { ok: false, error: "Active Admin access is required" }, 403);
    let permitted = profile.role === "super_admin";
    if (!permitted && profile.role === "staff") {
      const { data: staff, error: staffError } = await adminDb.from("staff_members")
        .select("permissions,is_active").eq("user_id", auth.user.id).maybeSingle();
      permitted = !staffError && staff?.is_active === true && staff.permissions?.["sdk_jobs.manage"] === true;
    }
    if (!permitted) return response(req, { ok: false, error: "sdk_jobs.manage permission is required" }, 403);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || !uuid(body.job_id) || !["approve", "reject"].includes(String(body.action))) {
      return response(req, { ok: false, error: "Invalid poster review action" }, 400);
    }
    const { data: job, error: jobError } = await adminDb.from("sdk_jobs")
      .select("id,slug,employer_owner_id,pending_media_path,approved_image_url,status")
      .eq("id", body.job_id).maybeSingle();
    if (jobError || !job) return response(req, { ok: false, error: "SDK Job not found" }, 404);
    if (job.status !== "pending_review" || !job.pending_media_path) {
      return response(req, { ok: false, error: "This job has no poster awaiting review" }, 409);
    }
    const expectedPrefix = `sdk-jobs/pending/${job.id}/${job.employer_owner_id}/`;
    if (!job.pending_media_path.startsWith(expectedPrefix) ||
        !/^[0-9a-f-]{36}[.](jpg|png|webp)$/i.test(job.pending_media_path.slice(expectedPrefix.length))) {
      return response(req, { ok: false, error: "Pending poster path failed ownership validation" }, 403);
    }

    const userDb = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    if (body.action === "reject") {
      const { error: updateError } = await userDb.from("sdk_jobs")
        .update({ pending_media_path: null })
        .eq("id", job.id).eq("status", "pending_review").select("id").single();
      if (updateError) return response(req, { ok: false, error: "Poster rejection could not be saved" }, 409);
      await removeIfPresent(privateBucket, job.pending_media_path).catch(() => undefined);
      await adminDb.from("sdk_job_status_history").insert({
        job_id: job.id, actor_id: auth.user.id, action: "poster_rejected",
        old_status: job.status, new_status: job.status,
      });
      return response(req, { ok: true, action: "reject" });
    }

    const { data: object, error: downloadError } = await adminDb.storage.from(privateBucket).download(job.pending_media_path);
    if (downloadError || !object) return response(req, { ok: false, error: "Private poster file is missing or unreadable" }, 409);
    if (object.size <= 0 || object.size > maxBytes) return response(req, { ok: false, error: "Poster must be 5 MB or smaller" }, 400);
    const bytes = new Uint8Array(await object.arrayBuffer());
    const mime = sniff(bytes);
    if (!mime) return response(req, { ok: false, error: "Poster content is not a valid JPEG, PNG or WebP image" }, 400);
    const extension = mime === "image/jpeg" ? "jpg" : mime === "image/png" ? "png" : "webp";
    if (!job.pending_media_path.toLowerCase().endsWith("." + extension)) {
      return response(req, { ok: false, error: "Poster file extension does not match its actual image type" }, 400);
    }

    const publicPath = `sdk-jobs/${job.slug}/${crypto.randomUUID()}.${extension}`;
    const { error: copyError } = await adminDb.storage.from(privateBucket)
      .copy(job.pending_media_path, publicPath, { destinationBucket: publicBucket });
    if (copyError) return response(req, { ok: false, error: "Approved poster could not be promoted to public media" }, 503);
    copiedPath = publicPath;
    const { data: publicData } = adminDb.storage.from(publicBucket).getPublicUrl(publicPath);
    const { data: updated, error: updateError } = await userDb.from("sdk_jobs")
      .update({ approved_image_url: publicData.publicUrl, pending_media_path: null })
      .eq("id", job.id).eq("status", "pending_review").select("id").single();
    if (updateError || !updated) {
      await removeIfPresent(publicBucket, publicPath).catch(() => undefined);
      copiedPath = null;
      return response(req, { ok: false, error: "Poster was copied but approval could not be recorded; public copy was rolled back" }, 409);
    }

    await removeIfPresent(privateBucket, job.pending_media_path).catch(() => undefined);
    await adminDb.from("sdk_job_status_history").insert({
      job_id: job.id, actor_id: auth.user.id, action: "poster_approved",
      old_status: job.status, new_status: job.status,
    });
    copiedPath = null;
    return response(req, { ok: true, action: "approve", image_url: publicData.publicUrl });
  } catch {
    if (copiedPath) await removeIfPresent(publicBucket, copiedPath).catch(() => undefined);
    return response(req, { ok: false, error: "SDK Jobs poster review failed" }, 500);
  }
});
