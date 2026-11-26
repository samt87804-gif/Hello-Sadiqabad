import { fetchPublicContext } from '../chat.js';
import { fetchWithTimeout } from '../../_shared/fetchWithTimeout.js';

const SOURCE_KEYS = [
  'business_directory',
  'categories',
  'areas',
  'emergency_contacts',
  'local_authorities',
  'owner_public_profile_directory',
  'authority_profiles',
  'news_articles',
  'pages',
  'business_products',
  'offers',
  'announcements',
  'site_settings',
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function getConfig(env) {
  const baseUrl = String(env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
  const key = String(env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
  if (!baseUrl.startsWith('https://') || !key) throw new Error('Supabase public API is not configured.');
  return { baseUrl, key };
}

function isSameOrigin(request, required = false) {
  const origin = request.headers.get('Origin');
  if (!origin) return !required;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

async function authorizeSuperAdmin(request, env) {
  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { ok: false, status: 401, error: 'Admin sign-in required.' };

  const { baseUrl, key } = getConfig(env);
  const headers = { apikey: key, Authorization: `Bearer ${token}`, Accept: 'application/json' };
  const userResponse = await fetchWithTimeout(`${baseUrl}/auth/v1/user`, { headers }, 8000);
  if (!userResponse.ok) return { ok: false, status: 401, error: 'Admin session is invalid or expired.' };
  const user = await userResponse.json();
  if (!user?.id) return { ok: false, status: 401, error: 'Admin session could not be verified.' };

  const profileUrl = new URL(`${baseUrl}/rest/v1/profiles`);
  profileUrl.searchParams.set('id', `eq.${user.id}`);
  profileUrl.searchParams.set('select', 'role,is_active');
  profileUrl.searchParams.set('limit', '1');
  const profileResponse = await fetch(profileUrl, { headers });
  if (!profileResponse.ok) return { ok: false, status: 403, error: 'Admin permissions could not be verified.' };
  const profiles = await profileResponse.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (profile?.role !== 'super_admin' || profile?.is_active !== true) {
    return { ok: false, status: 403, error: 'Only an active Super Admin can refresh chatbot knowledge.' };
  }

  return { ok: true, userId: user.id, token, baseUrl, key };
}

async function supabaseRest(admin, path, options = {}) {
  const response = await fetch(`${admin.baseUrl}/rest/v1/${path}`, {
    method: options.method || 'GET',
    headers: {
      apikey: admin.key,
      Authorization: `Bearer ${admin.token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.returnRepresentation ? { Prefer: 'return=representation' } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = null; }
  if (!response.ok) {
    const message = typeof data?.message === 'string' ? data.message : 'Admin sync status could not be saved.';
    throw new Error(message.slice(0, 300));
  }
  return data;
}

async function updateRun(admin, runId, patch) {
  const query = new URLSearchParams({ id: `eq.${runId}` });
  const rows = await supabaseRest(admin, `chatbot_knowledge_sync_runs?${query}`, {
    method: 'PATCH',
    body: patch,
    returnRepresentation: true,
  });
  if (!Array.isArray(rows) || !rows[0]) throw new Error('Chatbot sync progress could not be saved.');
  return rows[0];
}

async function fetchBusinessDirectoryCount(admin) {
  const response = await fetch(`${admin.baseUrl}/rest/v1/rpc/search_businesses`, {
    method: 'POST',
    headers: {
      apikey: admin.key,
      Authorization: `Bearer ${admin.key}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      p_query: null,
      p_category: null,
      p_area: null,
      p_open_now: false,
      p_verified: false,
      p_has_offer: false,
      p_min_rating: null,
      p_delivery: false,
      p_lat: null,
      p_lng: null,
      p_sort: 'relevance',
      p_limit: 1,
      p_offset: 0,
    }),
  });
  if (!response.ok) throw new Error('Published business directory could not be refreshed.');
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error('Published business directory returned an invalid response.');
  return Number(rows[0]?.total_count ?? 0);
}

export async function onRequestGet({ request, env }) {
  if (!isSameOrigin(request)) return json({ error: 'Cross-origin requests are not allowed.' }, 403);
  let admin;
  try {
    admin = await authorizeSuperAdmin(request, env);
  } catch {
    return json({ error: 'Admin session verification is temporarily unavailable.' }, 503);
  }
  if (!admin.ok) return json({ error: admin.error }, admin.status);

  try {
    const runs = await supabaseRest(admin, 'chatbot_knowledge_sync_runs?select=id,started_at,completed_at,status,stage,progress_percent,source_status,source_counts,total_records,error_summary&order=started_at.desc&limit=10');
    return json({ runs: Array.isArray(runs) ? runs : [] });
  } catch {
    return json({ error: 'Chatbot sync history could not be loaded.' }, 502);
  }
}

export async function onRequestPost({ request, env }) {
  if (!isSameOrigin(request, true)) return json({ error: 'A same-origin admin request is required.' }, 403);
  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 1000) return json({ error: 'Invalid sync request.' }, 413);

  let admin;
  try {
    admin = await authorizeSuperAdmin(request, env);
  } catch {
    return json({ error: 'Admin session verification is temporarily unavailable.' }, 503);
  }
  if (!admin.ok) return json({ error: admin.error }, admin.status);

  try {
    const recent = await supabaseRest(admin, 'chatbot_knowledge_sync_runs?select=id,started_at,status&status=eq.running&order=started_at.desc&limit=1');
    const latest = Array.isArray(recent) ? recent[0] : null;
    if (latest && Date.now() - new Date(latest.started_at).getTime() < 15 * 60 * 1000) {
      return json({ error: 'A chatbot knowledge refresh is already running.', run_id: latest.id }, 409);
    }
  } catch {
    return json({ error: 'Could not check the existing chatbot sync status.' }, 502);
  }

  const pendingSources = Object.fromEntries(SOURCE_KEYS.map((source) => [source, 'pending']));
  let run;
  try {
    const inserted = await supabaseRest(admin, 'chatbot_knowledge_sync_runs', {
      method: 'POST',
      body: {
        triggered_by: admin.userId,
        status: 'running',
        stage: 'Admin verified; preparing public knowledge refresh',
        progress_percent: 5,
        source_status: pendingSources,
      },
      returnRepresentation: true,
    });
    run = Array.isArray(inserted) ? inserted[0] : null;
    if (!run?.id) throw new Error('Sync run could not be started.');
  } catch {
    return json({ error: 'Could not create a secure chatbot sync record.' }, 502);
  }

  let sourceStatus = pendingSources;
  let sourceCounts = {};
  let businessCount = null;
  let knowledgeRefreshed = false;
  try {
    await updateRun(admin, run.id, {
      stage: 'Checking the published business directory',
      progress_percent: 20,
    });
    businessCount = await fetchBusinessDirectoryCount(admin);
    sourceCounts.businesses = businessCount;

    await updateRun(admin, run.id, {
      stage: 'Refreshing all public knowledge sources',
      progress_percent: 35,
    });
    const context = await fetchPublicContext(env, new URL(request.url).origin, {
      forceRefresh: true,
      requireAllSources: true,
    });

    knowledgeRefreshed = true;
    sourceStatus = { ...context.source_status, business_directory: 'loaded' };
    sourceCounts = { ...context.source_counts, businesses: businessCount };
    const totalRecords = Object.values(sourceCounts).reduce((sum, value) => sum + Number(value || 0), 0);

    await updateRun(admin, run.id, {
      stage: 'Public knowledge refreshed; saving source report',
      progress_percent: 90,
      source_status: sourceStatus,
      source_counts: sourceCounts,
      total_records: totalRecords,
    });
    const completedAt = new Date().toISOString();
    const result = await updateRun(admin, run.id, {
      status: 'success',
      stage: 'All public sources refreshed successfully',
      progress_percent: 100,
      completed_at: completedAt,
      source_status: sourceStatus,
      source_counts: sourceCounts,
      total_records: totalRecords,
      error_summary: null,
    });
    return json({ run: result });
  } catch (error) {
    if (error?.sourceStatus && typeof error.sourceStatus === 'object') {
      sourceStatus = { ...error.sourceStatus, business_directory: businessCount === null ? 'unavailable' : 'loaded' };
      if (error.sourceCounts && typeof error.sourceCounts === 'object') sourceCounts = { ...error.sourceCounts, ...(businessCount === null ? {} : { businesses: businessCount }) };
    } else if (sourceStatus.business_directory === 'pending') {
      sourceStatus = { ...sourceStatus, business_directory: 'unavailable' };
    }
    const message = (error instanceof Error ? error.message : 'Public knowledge refresh failed.').slice(0, 500);
    try {
      const failed = await updateRun(admin, run.id, {
        status: 'failed',
        stage: knowledgeRefreshed ? 'Knowledge refreshed; final status update failed' : 'Refresh failed; previous successful chatbot cache was preserved',
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        source_status: sourceStatus,
        source_counts: sourceCounts,
        total_records: Object.values(sourceCounts).reduce((sum, value) => sum + Number(value || 0), 0),
        error_summary: message,
      });
      return json({ error: message, run: failed }, 502);
    } catch {
      return json({ error: 'Refresh failed and its status could not be saved. The previous cached knowledge was not intentionally deleted.', run_id: run.id }, 502);
    }
  }
}
