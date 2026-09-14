import { createClient } from '@supabase/supabase-js';

const defaultSupabaseUrl = 'https://xootmi7yjqr7.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;


const supabaseUrl =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  defaultSupabaseUrl;

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  defaultPublishableKey;

export const SUPABASE_SECRET_KEY =
  (typeof process !== 'undefined' && process.env?.SUPABASE_SECRET_KEY) ||
  defaultSecretKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

