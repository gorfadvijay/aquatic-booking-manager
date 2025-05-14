import { createClient } from '@supabase/supabase-js';
import { env } from './environment';

// Create Supabase client
export const supabase = createClient(env.supabaseUrl, env.supabaseAnonKey);

// Check if we're missing Supabase credentials and log error
if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.error('ERROR: Supabase URL and Anon Key are required for this application to function properly');
} 