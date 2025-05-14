import { createClient } from '@supabase/supabase-js';
import { env } from './environment';

// Create Supabase client
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
} 