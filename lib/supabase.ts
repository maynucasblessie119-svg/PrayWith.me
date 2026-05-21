import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

/**
 * Lazily retrieves the public Supabase client.
 * Returns null if environment variables are not present, allowing the app to fall back gently.
 */
export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (!url || !key || url.includes('YOUR_') || key.includes('YOUR_')) {
    console.warn('Supabase public configuration is missing or default. App will use the Express server fallback database.');
    return null;
  }

  try {
    supabaseClient = createClient(url, key);
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}
