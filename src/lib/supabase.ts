import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { resolvePublicRuntimeConfig } from './runtimeConfig';

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' ? process.env : {}) ?? {};

export const supabaseConfig = resolvePublicRuntimeConfig(env);

// Bound all browser-side Supabase REST/Auth requests while preserving caller cancellation.
const supabaseFetch: typeof fetch = async (input, init = {}) => {
  const controller = new AbortController();
  const callerSignal = init.signal;
  const abortFromCaller = () => controller.abort(callerSignal?.reason);
  if (callerSignal?.aborted) abortFromCaller();
  else callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    controller.abort(new DOMException('Supabase request timed out.', 'TimeoutError'));
  }, 12000);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
    callerSignal?.removeEventListener('abort', abortFromCaller);
  }
};

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseConfig.isConfigured) return null;
  if (!client) {
    client = createClient(supabaseConfig.supabaseUrl, supabaseConfig.supabasePublishableKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: { fetch: supabaseFetch },
    });
  }
  return client;
}
