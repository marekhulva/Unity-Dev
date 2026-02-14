-- URGENT FIX: Add circle_id column if missing
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES circles(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_posts_circle_id ON posts(circle_id);

-- Update existing posts to belong to user's first circle (temporary fix)
-- Only run this if you want to assign orphaned posts
UPDATE posts p
SET circle_id = (
  SELECT cm.circle_id
  FROM circle_members cm
  WHERE cm.user_id = p.user_id
  LIMIT 1
)
WHERE p.circle_id IS NULL
AND p.visibility = 'circle';

-- Fix RLS policies to respect circle boundaries
DROP POLICY IF EXISTS "posts_select_policy" ON posts;

CREATE POLICY "posts_select_policy" ON posts
FOR SELECT
TO authenticated
USING (
  -- User can see their own posts
  user_id = auth.uid()
  OR
  -- Public posts
  visibility = 'public'
  OR
  -- Circle posts: only if in the SAME circle the post was made to
  (visibility = 'circle' AND circle_id IN (
    SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
  ))
  OR
  -- Follower posts: if following the author
  (visibility = 'followers' AND user_id IN (
    SELECT following_id FROM follows WHERE follower_id = auth.uid()
  ))
);