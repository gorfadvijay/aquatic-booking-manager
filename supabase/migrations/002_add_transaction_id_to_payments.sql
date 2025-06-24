-- Add missing transaction_id column to payments table
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) UNIQUE;

-- Create index for the new transaction_id column
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);

-- Add other missing columns that our Edge Function expects
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update the RLS policy to ensure Edge Functions can work with the table
DROP POLICY IF EXISTS "Allow service role access" ON payments;
CREATE POLICY "Allow service role access" ON payments
  FOR ALL USING (auth.role() = 'service_role' OR auth.role() = 'authenticated'); 