// Environment variables with fallbacks for development
export const env = {
  supabaseUrl: import.meta.env.VITE_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || '',
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
}; 