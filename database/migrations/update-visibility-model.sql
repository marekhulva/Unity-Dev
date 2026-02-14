-- Migration: Update visibility model to hierarchical levels
-- Run this in Supabase SQL Editor

-- Step 1: Add new visibility column (keep old one for safety)
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS visibility_level TEXT;

-- Step 2: Migrate existing data
-- Map old visibility to new levels
UPDATE posts
SET visibility_level = 
  CASE 
    WHEN visibility = 'circle' THEN 'circle'
    WHEN visibility = 'follow' THEN 'friends'
    ELSE 'circle' -- Default to circle for safety
  END
WHERE visibility_level IS NULL;

-- Step 3: Create enum type for better validation (optional but recommended)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_level_enum') THEN
    CREATE TYPE visibility_level_enum AS ENUM ('private', 'circle', 'friends', 'public');
  END IF;
END $$;

-- Step 4: After testing, we can alter the column to use enum
-- ALTER TABLE posts 
-- ALTER COLUMN visibility_level TYPE visibility_level_enum 
-- USING visibility_level::visibility_level_enum;

-- Step 5: Set default and not null (after testing)
-- ALTER TABLE posts 
-- ALTER COLUMN visibility_level SET DEFAULT 'circle',
-- ALTER COLUMN visibility_level SET NOT NULL;

-- Step 6: Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_visibility_level 
ON posts(visibility_level);

-- Verify migration
SELECT 
  visibility as old_visibility,
  visibility_level as new_visibility,
  COUNT(*) as count
FROM posts
GROUP BY visibility, visibility_level
ORDER BY count DESC;