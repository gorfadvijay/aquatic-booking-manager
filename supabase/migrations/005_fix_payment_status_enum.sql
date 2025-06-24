-- Fix payment_status enum to include missing values
-- Add 'pending' and 'completed' to the payment_status enum

-- First, add the missing enum values
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'pending';
ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'completed';

-- Update any existing 'pending' status payments (if any exist)
-- This is safe because we're just adding enum values

-- Add index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- Add comment to document the change
COMMENT ON TYPE payment_status IS 'Payment status enum: success, failed, refunded, pending, completed'; 