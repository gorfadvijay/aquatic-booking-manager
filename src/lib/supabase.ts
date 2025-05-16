import { createClient } from '@supabase/supabase-js';
import { env } from './environment';

// Create Supabase client
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Validate Supabase credentials
if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.error('ERROR: Supabase URL and Anon Key are required for this application to function properly');
} 