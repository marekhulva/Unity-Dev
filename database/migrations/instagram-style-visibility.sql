-- Instagram-Style Visibility Model Migration
-- Run this in Supabase SQL Editor

-- Step 1: Add account privacy setting to profiles (for future)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- Step 2: Update posts table with new visibility model
ALTER TABLE posts 
ADD COLUMN IF NOT EXISTS visibility_new TEXT;

-- Step 3: Migrate existing data
UPDATE posts
SET visibility_new = 
  CASE 
    WHEN visibility = 'circle' THEN 'circle'    -- Keep circle as is
    WHEN visibility = 'follow' THEN 'followers' -- 'follow' becomes 'followers'
    ELSE 'followers' -- Default to followers
  END
WHERE visibility_new IS NULL;

-- Step 4: Create enum for validation
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'post_visibility') THEN
    CREATE TYPE post_visibility AS ENUM ('private', 'circle', 'followers');
  END IF;
END $$;

-- Step 5: Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_posts_visibility_new ON posts(visibility_new);
CREATE INDEX IF NOT EXISTS idx_profiles_is_private ON profiles(is_private);

-- Step 6: After testing, rename columns
-- ALTER TABLE posts DROP COLUMN visibility;
-- ALTER TABLE posts RENAME COLUMN visibility_new TO visibility;

-- Verify migration
SELECT 
  visibility as old_visibility,
  visibility_new as new_visibility,
  COUNT(*) as count
FROM posts
GROUP BY visibility, visibility_new
ORDER BY count DESC;

-- Check account privacy settings
SELECT 
  COUNT(*) FILTER (WHERE is_private = true) as private_accounts,
  COUNT(*) FILTER (WHERE is_private = false OR is_private IS NULL) as public_accounts
FROM profiles;