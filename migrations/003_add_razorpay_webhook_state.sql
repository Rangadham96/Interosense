-- Preserve Razorpay webhook ordering and terminal subscription state.
-- This prevents an old signed activation event from restoring premium after
-- a cancellation/expiration event has already been processed.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS razorpay_last_webhook_at text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS razorpay_last_webhook_event_id text;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS razorpay_subscription_status text;