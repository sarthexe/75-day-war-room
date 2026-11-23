import { createClient, SupabaseClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const rawKey = (
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY as string | undefined)
)?.trim();

export const hasSupabaseUrl = Boolean(rawUrl);
export const hasSupabaseKey = Boolean(rawKey);
export const isCloudConfigured = hasSupabaseUrl && hasSupabaseKey;

export const SYNC_TABLE = 'war_room_states';

export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(rawUrl as string, rawKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
