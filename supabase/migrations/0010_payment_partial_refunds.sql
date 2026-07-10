-- Add refunded_amount_kobo to track partial refunds
ALTER TABLE payments
ADD COLUMN IF NOT EXISTS refunded_amount_kobo INTEGER DEFAULT 0 NOT NULL;

-- Backfill any existing 'refunded' rows to full refund
UPDATE payments
SET refunded_amount_kobo = amount_kobo
WHERE status = 'refunded' AND refunded_amount_kobo = 0;
