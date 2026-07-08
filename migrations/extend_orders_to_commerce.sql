-- Migration: Extend orders to full commerce management (non-destructive)
-- Run manually: psql $DATABASE_URL -f migrations/extend_orders_to_commerce.sql
--
-- This migration adds:
--   1. New columns to orders (order_number, source, billing/shipping, payment_status, etc.)
--   2. order_items table (structured line items, decoupled from product changes)
--   3. quotes table
--   4. quote_items table
--   5. document_counters table (atomic sequential numbering)
-- Existing orders remain fully compatible.

-- ============================================================
-- 1. Add new columns to orders
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'stripe',
  ADD COLUMN IF NOT EXISTS customer_first_name TEXT,
  ADD COLUMN IF NOT EXISTS customer_last_name TEXT,
  ADD COLUMN IF NOT EXISTS billing_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10,2) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10,2) DEFAULT '0',
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS order_status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS carrier TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS quote_id INTEGER,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ============================================================
-- 2. Backfill new columns from legacy data for existing orders
-- ============================================================

-- Split customer_name into first/last name
UPDATE orders
  SET customer_first_name = split_part(customer_name, ' ', 1),
      customer_last_name = CASE
        WHEN position(' ' in customer_name) > 0
        THEN substring(customer_name from position(' ' in customer_name) + 1)
        ELSE ''
      END
  WHERE customer_first_name IS NULL AND customer_name IS NOT NULL;

-- Copy address fields to billing/shipping
UPDATE orders
  SET billing_address = customer_address || ', ' || customer_postal_code || ' ' || customer_city || ', ' || customer_country,
      shipping_address = customer_address || ', ' || customer_postal_code || ' ' || customer_city || ', ' || customer_country
  WHERE billing_address IS NULL AND customer_address IS NOT NULL;

UPDATE orders SET country = customer_country WHERE country IS NULL;
UPDATE orders SET subtotal = total_amount - COALESCE(shipping_cost, 0) WHERE subtotal = 0;

-- Map legacy status to new payment_status and order_status
UPDATE orders SET payment_status = 'paid' WHERE status = 'paid' AND payment_status = 'unpaid';
UPDATE orders SET payment_status = 'unpaid' WHERE status = 'pending' AND payment_status = 'unpaid';
UPDATE orders SET order_status = 'confirmed' WHERE status = 'paid' AND order_status = 'draft';
UPDATE orders SET order_status = 'confirmed' WHERE status = 'pending' AND order_status = 'draft';
UPDATE orders SET order_status = 'shipped' WHERE status = 'shipped' AND order_status = 'confirmed';
UPDATE orders SET order_status = 'delivered' WHERE status = 'delivered' AND order_status = 'shipped';

-- Generate order numbers for existing orders
UPDATE orders
  SET order_number = 'ES-CMD-' || EXTRACT(YEAR FROM created_at)::text || '-' || LPAD(id::text, 4, '0')
  WHERE order_number IS NULL;

-- ============================================================
-- 3. Create order_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT '0',
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================================
-- 4. Create quotes table
-- ============================================================
CREATE TABLE IF NOT EXISTS quotes (
  id SERIAL PRIMARY KEY,
  quote_number TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  billing_address TEXT,
  shipping_address TEXT,
  notes TEXT,
  subtotal DECIMAL(10,2) DEFAULT '0',
  shipping_cost DECIMAL(10,2) DEFAULT '0',
  discount_amount DECIMAL(10,2) DEFAULT '0',
  tax_amount DECIMAL(10,2) DEFAULT '0',
  total_amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  valid_until TIMESTAMP,
  converted_order_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_email ON quotes(customer_email);

-- ============================================================
-- 5. Create quote_items table
-- ============================================================
CREATE TABLE IF NOT EXISTS quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  product_id INTEGER,
  product_name TEXT NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT '0',
  line_total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- ============================================================
-- 6. Create document_counters table for atomic numbering
-- ============================================================
CREATE TABLE IF NOT EXISTS document_counters (
  id SERIAL PRIMARY KEY,
  counter_type TEXT NOT NULL,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  UNIQUE(counter_type, year)
);

-- ============================================================
-- 7. Indexes on orders for search/filter
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- ============================================================
-- 8. Verify
-- ============================================================
SELECT 'Migration complete. Orders: ' || COUNT(*)::text FROM orders;
