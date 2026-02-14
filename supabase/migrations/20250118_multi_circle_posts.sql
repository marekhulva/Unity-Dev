-- Migration: Multi-Circle Posts and Explore Feature
-- Date: 2025-01-18
-- Description: Adds support for posts to go to multiple circles and be discoverable in Explore

-- ============================================
-- 1. CREATE JUNCTION TABLE FOR POST-CIRCLE RELATIONSHIPS
-- ============================================

CREATE TABLE IF NOT EXISTS post_circles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  circle_id UUID NOT NULL REFERENCES circles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique post-circle combinations
  UNIQUE(post_id, circle_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_circles_post_id ON post_circles(post_id);
CREATE INDEX IF NOT EXISTS idx_post_circles_circle_id ON post_circles(circle_id);

-- ============================================
-- 2. UPDATE POSTS TABLE WITH NEW VISIBILITY MODEL
-- ============================================

-- Add new visibility fields
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_explore BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_network BOOLEAN DEFAULT false;

-- Add a computed visibility_scope for easier querying
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS visibility_scope TEXT GENERATED ALWAYS AS (
  CASE
    WHEN is_private = true THEN 'private'
    WHEN is_network = true AND is_explore = true THEN 'network_explore'
    WHEN is_network = true THEN 'network'
    WHEN is_explore = true THEN 'explore'
    ELSE 'circles'
  END
) STORED;

-- Create index for explore queries
CREATE INDEX IF NOT EXISTS idx_posts_explore ON posts(is_explore, created_at DESC)
WHERE is_explore = true;

-- Create index for network posts
CREATE INDEX IF NOT EXISTS idx_posts_network ON posts(is_network, user_id)
WHERE is_network = true;

-- ============================================
-- 3. MIGRATE EXISTING DATA
-- ============================================

-- Migrate existing posts to the new structure
DO $$
BEGIN
  -- Update private posts
  UPDATE posts
  SET is_private = true
  WHERE visibility = 'private';

  -- Update public posts (if any exist)
  UPDATE posts
  SET is_explore = true
  WHERE visibility = 'public';

  -- Update follower posts to network
  UPDATE posts
  SET is_network = true
  WHERE visibility = 'followers';

  -- For circle posts, create entries in post_circles table
  INSERT INTO post_circles (post_id, circle_id)
  SELECT id, circle_id
  FROM posts
  WHERE visibility = 'circle'
    AND circle_id IS NOT NULL
  ON CONFLICT (post_id, circle_id) DO NOTHING;
END $$;

-- ============================================
-- 4. CREATE FUNCTIONS FOR EASIER QUERYING
-- ============================================

-- Function to get all posts visible to a user
CREATE OR REPLACE FUNCTION get_visible_posts(user_id UUID)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.*
  FROM posts p
  LEFT JOIN post_circles pc ON p.id = pc.post_id
  LEFT JOIN circle_members cm ON pc.circle_id = cm.circle_id
  LEFT JOIN follows f ON p.user_id = f.following_id
  WHERE
    -- User's own posts
    p.user_id = user_id

    -- Explore posts (visible to everyone)
    OR p.is_explore = true

    -- Network posts from people user follows
    OR (p.is_network = true AND f.follower_id = user_id)

    -- Network posts from circle members (if network includes circles)
    OR (p.is_network = true AND EXISTS (
      SELECT 1 FROM circle_members cm2
      WHERE cm2.user_id = user_id
        AND cm2.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = p.user_id
        )
    ))

    -- Circle posts where user is a member
    OR (cm.user_id = user_id AND pc.post_id IS NOT NULL)

    -- Legacy: old visibility system support during transition
    OR (p.visibility = 'public')
    OR (p.visibility = 'followers' AND f.follower_id = user_id)
    OR (p.visibility = 'circle' AND p.circle_id IN (
      SELECT circle_id FROM circle_members WHERE user_id = user_id
    ));
END;
$$ LANGUAGE plpgsql;

-- Function to get explore feed
CREATE OR REPLACE FUNCTION get_explore_feed(
  limit_count INTEGER DEFAULT 20,
  offset_count INTEGER DEFAULT 0
)
RETURNS SETOF posts AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM posts
  WHERE is_explore = true
  ORDER BY created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. UPDATE RLS POLICIES
-- ============================================

-- Drop existing select policy if it exists
DROP POLICY IF EXISTS "posts_select_policy" ON posts;

-- Create new select policy with multi-circle support
CREATE POLICY "posts_select_policy" ON posts
FOR SELECT
TO authenticated
USING (
  -- User can see their own posts
  user_id = auth.uid()

  -- Explore posts are visible to everyone
  OR is_explore = true

  -- Network posts: visible to followers and circle members
  OR (is_network = true AND (
    -- User follows the author
    EXISTS (
      SELECT 1 FROM follows
      WHERE follower_id = auth.uid()
        AND following_id = posts.user_id
    )
    -- Or user shares a circle with the author
    OR EXISTS (
      SELECT 1 FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid()
        AND cm2.user_id = posts.user_id
    )
  ))

  -- Circle-specific posts: visible to circle members
  OR EXISTS (
    SELECT 1 FROM post_circles pc
    JOIN circle_members cm ON pc.circle_id = cm.circle_id
    WHERE pc.post_id = posts.id
      AND cm.user_id = auth.uid()
  )

  -- Legacy support for old visibility field
  OR (visibility = 'public')
  OR (visibility = 'followers' AND EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = auth.uid()
      AND following_id = posts.user_id
  ))
  OR (visibility = 'circle' AND circle_id IN (
    SELECT circle_id FROM circle_members
    WHERE user_id = auth.uid()
  ))
);

-- Update insert policy for new fields
DROP POLICY IF EXISTS "posts_insert_policy" ON posts;

CREATE POLICY "posts_insert_policy" ON posts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Update update policy
DROP POLICY IF EXISTS "posts_update_policy" ON posts;

CREATE POLICY "posts_update_policy" ON posts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- ============================================
-- 6. CREATE RLS POLICIES FOR POST_CIRCLES TABLE
-- ============================================

ALTER TABLE post_circles ENABLE ROW LEVEL SECURITY;

-- Users can see post-circle relationships for posts they can see
CREATE POLICY "post_circles_select_policy" ON post_circles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts p
    WHERE p.id = post_circles.post_id
      AND (
        p.user_id = auth.uid()
        OR p.is_explore = true
        OR EXISTS (
          SELECT 1 FROM circle_members cm
          WHERE cm.circle_id = post_circles.circle_id
            AND cm.user_id = auth.uid()
        )
      )
  )
);

-- Users can insert post-circle relationships for their own posts
CREATE POLICY "post_circles_insert_policy" ON post_circles
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_circles.post_id
      AND posts.user_id = auth.uid()
  )
);

-- Users can delete post-circle relationships for their own posts
CREATE POLICY "post_circles_delete_policy" ON post_circles
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM posts
    WHERE posts.id = post_circles.post_id
      AND posts.user_id = auth.uid()
  )
);

-- ============================================
-- 7. ADD HELPER VIEW FOR EASIER QUERYING
-- ============================================

CREATE OR REPLACE VIEW post_visibility_details AS
SELECT
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  p.is_private,
  p.is_explore,
  p.is_network,
  p.visibility_scope,
  ARRAY_AGG(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL) as circle_names,
  ARRAY_AGG(DISTINCT c.id) FILTER (WHERE c.id IS NOT NULL) as circle_ids,
  COUNT(DISTINCT pc.circle_id) as circle_count
FROM posts p
LEFT JOIN post_circles pc ON p.id = pc.post_id
LEFT JOIN circles c ON pc.circle_id = c.id
GROUP BY p.id, p.user_id, p.content, p.created_at,
         p.is_private, p.is_explore, p.is_network, p.visibility_scope;

-- ============================================
-- ROLLBACK SCRIPT (Save separately)
-- ============================================
/*
-- To rollback this migration:
DROP VIEW IF EXISTS post_visibility_details;
DROP FUNCTION IF EXISTS get_visible_posts(UUID);
DROP FUNCTION IF EXISTS get_explore_feed(INTEGER, INTEGER);
DROP TABLE IF EXISTS post_circles;
ALTER TABLE posts
  DROP COLUMN IF EXISTS is_private,
  DROP COLUMN IF EXISTS is_explore,
  DROP COLUMN IF EXISTS is_network,
  DROP COLUMN IF EXISTS visibility_scope;
DROP INDEX IF EXISTS idx_posts_explore;
DROP INDEX IF EXISTS idx_posts_network;
*/