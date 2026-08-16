import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Verify Supabase is configured with a valid, non-placeholder URL and key
export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('placeholder') &&
  !rawUrl.includes('your-supabase-url') &&
  rawUrl.startsWith('https://')
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'placeholder-anon-key';

if (!isSupabaseConfigured) {
  // eslint-disable-next-line no-console
  console.info('Supabase environment variables not set or contain placeholders. Running in seamless Demo Mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
