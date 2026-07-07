-- Migration: Add UNIQUE constraint on stripe_session_id
-- Purpose: Prevent duplicate orders from race conditions between
--          Stripe webhook and POST /api/verify-session
--
-- PostgreSQL UNIQUE constraint allows multiple NULL values,
-- so existing rows with NULL stripe_session_id are unaffected.
-- Only non-NULL values must be unique.

ALTER TABLE orders ADD CONSTRAINT orders_stripe_session_id_unique UNIQUE (stripe_session_id);
