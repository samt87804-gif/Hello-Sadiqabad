import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const env =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env
    : (typeof process !== 'undefined' ? process.env : {}) ?? {};

const supabaseUrl = (env.VITE_SUPABASE_URL as string | undefined)?.trim() ?? '';
const supabaseAnonKey =
  (env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined)?.trim() ?? '';

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  defaultCitySlug: (env.VITE_DEFAULT_CITY as string | undefined)?.trim() || 'sadiqabad',
  siteUrl: (env.VITE_SITE_URL as string | undefined)?.trim() || 'https://hellosadiqabad.com',
  isConfigured: Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')),
};

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseConfig.isConfigured) return null;
  if (!client) {
    client = createClient(supabaseConfig.url, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}
