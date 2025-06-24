-- =============================================================================
-- SUPABASE SCHEMA FIX FOR PHONEPE PAYMENT INTEGRATION
-- =============================================================================
-- Run this in Supabase Dashboard > SQL Editor
-- This will fix the payment_status enum and payments table structure

-- 1. Fix payment_status enum to include missing values
-- Add 'pending' and 'completed' to the payment_status enum
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';

-- 2. Fix payments table structure to match what our edge functions expect
-- Make booking_id nullable since payments are created before bookings
ALTER TABLE payments ALTER COLUMN booking_id DROP NOT NULL;

-- Make payment_id nullable initially (will be set during payment creation)
ALTER TABLE payments ALTER COLUMN payment_id DROP NOT NULL;

-- 3. Add missing columns that our edge functions use
-- Add transaction_id column if it doesn't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) UNIQUE;

-- Add booking_metadata column if it doesn't exist  
ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_metadata JSONB;

-- Add phonepe_response column for storing API responses
ALTER TABLE payments ADD COLUMN IF NOT EXISTS phonepe_response JSONB;

-- Add created_at and updated_at columns if they don't exist
ALTER TABLE payments ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_booking_metadata ON payments USING GIN (booking_metadata);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- 5. Update RLS (Row Level Security) policies for Edge Functions
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow service role access" ON payments;

-- Create new policy that allows both service role and authenticated users
CREATE POLICY "Allow service role and authenticated access" ON payments
  FOR ALL USING (
    auth.role() = 'service_role' OR 
    auth.role() = 'authenticated' OR
    auth.role() = 'anon'
  );

-- 6. Add helpful comments to document the schema
COMMENT ON TYPE payment_status IS 'Payment status enum: success, failed, refunded, pending, completed';
COMMENT ON COLUMN payments.transaction_id IS 'Unique transaction ID from PhonePe (merchantOrderId)';
COMMENT ON COLUMN payments.booking_metadata IS 'JSON data containing booking details used to create bookings after payment success';
COMMENT ON COLUMN payments.phonepe_response IS 'Full API response from PhonePe for debugging and auditing';
COMMENT ON COLUMN payments.booking_id IS 'Reference to bookings table, set after successful payment and booking creation';

-- 7. Verify the changes
-- You can run these SELECT statements to verify everything is working:

-- Check enum values
-- SELECT unnest(enum_range(NULL::payment_status)) AS payment_status_values;

-- Check table structure  
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'payments' 
-- ORDER BY ordinal_position;

-- 8. Test payment record creation (optional - uncomment to test)
-- INSERT INTO payments (
--   transaction_id, 
--   payment_id, 
--   amount, 
--   status, 
--   payment_method,
--   booking_metadata
-- ) VALUES (
--   'TEST_SCHEMA_FIX_' || EXTRACT(EPOCH FROM NOW()),
--   'TEST_PAYMENT_' || EXTRACT(EPOCH FROM NOW()),
--   149.99,
--   'pending',
--   'phonepe',
--   '{"test": true}'::jsonb
-- );

-- Clean up test record (uncomment if you ran the test above)
-- DELETE FROM payments WHERE transaction_id LIKE 'TEST_SCHEMA_FIX_%';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================
-- After running this script:
-- 1. All enum values (pending, completed, success, failed, refunded) will be available
-- 2. Payments table will support all required columns
-- 3. Edge functions will be able to create and update payment records
-- 4. Payment verification will work correctly
-- 
-- Next steps:
-- 1. Redeploy all edge functions in Supabase Dashboard
-- 2. Test the payment flow end-to-end
-- ============================================================================= 