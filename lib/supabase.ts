import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

if (!isSupabaseConfigured) {
  console.warn("Supabase environment variables are missing. Defaulting to offline local mock client.");
}

// Safe dummy client to prevent runtime crashes when offline/unconfigured
const dummyClient = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => { throw new Error("Supabase is not configured. Please use Offline Mode."); },
    signUp: async () => { throw new Error("Supabase is not configured. Please use Offline Mode."); },
    signOut: async () => {}
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: new Error("Supabase is not configured.") })
      })
    }),
    upsert: async () => ({ data: null, error: new Error("Supabase is not configured.") })
  })
} as any;

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseAnonKey) : dummyClient;
