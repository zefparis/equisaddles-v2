-- Migration: Extend gallery_images to mediatheque (non-destructive)
-- Run manually: psql $DATABASE_URL -f migrations/extend_gallery_to_mediatheque.sql
--
-- This migration adds support for videos, YouTube, Vimeo, titles, descriptions,
-- manual ordering, featured flag, and active/inactive status.
-- Existing image rows remain fully compatible.

-- 1. Add new columns with safe defaults
ALTER TABLE gallery_images
  ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS public_id TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- 2. Make alt nullable (was NOT NULL, new rows may use title instead)
ALTER TABLE gallery_images ALTER COLUMN alt DROP NOT NULL;

-- 3. Set alt = title for old rows where alt is null
UPDATE gallery_images SET alt = title WHERE alt IS NULL AND title IS NOT NULL;
UPDATE gallery_images SET alt = '' WHERE alt IS NULL;

-- 4. Set title = alt for old rows where title is null (backfill)
UPDATE gallery_images SET title = alt WHERE title IS NULL AND alt IS NOT NULL;

-- 5. Index for sorting and filtering
CREATE INDEX IF NOT EXISTS idx_gallery_sort_order ON gallery_images(sort_order);
CREATE INDEX IF NOT EXISTS idx_gallery_active ON gallery_images(active);
CREATE INDEX IF NOT EXISTS idx_gallery_media_type ON gallery_images(media_type);
CREATE INDEX IF NOT EXISTS idx_gallery_featured ON gallery_images(featured);

-- 6. Verify
SELECT 'Migration complete. Rows: ' || COUNT(*)::text FROM gallery_images;
