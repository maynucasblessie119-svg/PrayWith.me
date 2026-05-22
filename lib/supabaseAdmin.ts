import { createClient } from '@supabase/supabase-js';

let supabaseAdminClient: ReturnType<typeof createClient> | null = null;

/**
 * Lazily retrieves the admin-level Supabase client for backend operations.
 * Returns null if service role key is not configured.
 */
export function getSupabaseAdmin() {
  if (supabaseAdminClient) return supabaseAdminClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!url || !serviceKey || url.includes('YOUR_') || serviceKey.includes('YOUR_') || (!url.startsWith('http://') && !url.startsWith('https://'))) {
    console.warn('Supabase Admin Service Key or URL is missing, default, or invalid. Admin routines will operate on the local server database.');
    return null;
  }

  try {
    supabaseAdminClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });
    return supabaseAdminClient;
  } catch (error) {
    console.error('Failed to initialize Supabase Admin client:', error);
    return null;
  }
}
