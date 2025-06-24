-- Create payments table for PhonePe integration
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES bookings(id),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  payment_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method VARCHAR(50) DEFAULT 'phonepe',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role (Edge Functions) to insert/update
CREATE POLICY "Allow service role access" ON payments
  FOR ALL USING (auth.role() = 'service_role');

-- Policy to allow users to view their own payments
CREATE POLICY "Users can view own payments" ON payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = payments.booking_id 
      AND bookings.user_id = auth.uid()
    )
  ); 


--   getting error while running this abobe query -> ERROR:  42703: column "transaction_id" does not exist