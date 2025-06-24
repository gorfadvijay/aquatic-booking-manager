// Environment variables with fallbacks for development
export const env = {
  supabaseUrl: import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://sbpswmrjgieicdxnjnhc.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNicHN3bXJqZ2llaWNkeG5qbmhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5Mjc5MDEsImV4cCI6MjA1MDUwMzkwMX0.H_KwdQm8VIGpxOGBOFNYlw8TGG3_3r-8xPK2B3SWBH4',
  environment: import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  
  // PhonePe Configuration
  phonePe: {
    // Using official PhonePe test credentials
    merchantId: import.meta.env.VITE_PHONEPE_MERCHANT_ID || 'TEST-M2342E2P0D51P_25061',
    saltKey: import.meta.env.VITE_PHONEPE_SALT_KEY || 'ZWE1NTZiYWEtZGIwYS00YjQ1LTk4MmUtMDY5ZjM3N2Y3NGJo',
    saltIndex: import.meta.env.VITE_PHONEPE_SALT_INDEX || '1',
    apiUrl: import.meta.env.MODE === 'production' 
      ? 'https://api.phonepe.com/apis/hermes'
      : 'https://api-preprod.phonepe.com/apis/pg-sandbox'
  },
  
  // Application URLs
  baseUrl: import.meta.env.MODE === 'production'
    ? import.meta.env.VITE_PRODUCTION_URL || 'https://your-domain.com'
    : 'http://localhost:5173',
    
  // PhonePe Backend URL
  phonepeBackendUrl: import.meta.env.VITE_PHONEPE_BACKEND_URL || 'http://localhost:5000',
    
  // Payment Gateway Default
  defaultPaymentGateway: import.meta.env.VITE_DEFAULT_PAYMENT_GATEWAY || 'phonepe'
}; 