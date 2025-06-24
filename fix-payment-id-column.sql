-- Fix the payment_id column to allow NULL values
-- This is needed because we create payment records before PhonePe assigns payment IDs

-- Check current column constraints
SELECT column_name, is_nullable, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'payment_id';

-- Drop the NOT NULL constraint from payment_id
ALTER TABLE payments ALTER COLUMN payment_id DROP NOT NULL;

-- Verify the change
SELECT column_name, is_nullable, column_default, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' AND column_name = 'payment_id'; 