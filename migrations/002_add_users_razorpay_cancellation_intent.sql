-- Migration: persist Razorpay cancellation intent on the users table
-- razorpay_cancel_at_cycle_end: true when the user scheduled a cancel-at-cycle-end;
--   lets the app show "will not renew" without a live Razorpay fetch.
-- razorpay_current_end: ISO timestamp of the current billing period end, kept in
--   sync by cancel/verify endpoints and subscription webhooks.
-- Both idempotent; safe to run on any environment.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS razorpay_cancel_at_cycle_end boolean DEFAULT false;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS razorpay_current_end text;
