-- Add booking_metadata column to payments table
-- This will store the booking details needed to create bookings after successful payment

ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS booking_metadata JSONB;

-- Add an index for faster JSON queries on booking_metadata
CREATE INDEX IF NOT EXISTS idx_payments_booking_metadata ON payments USING GIN (booking_metadata);

-- Add a comment to document the column purpose
COMMENT ON COLUMN payments.booking_metadata IS 'JSON data containing booking details (daysInfo, startTime, endTime, userDetails) used to create bookings after payment success'; 