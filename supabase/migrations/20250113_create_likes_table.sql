-- Create dedicated likes table for better performance
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one like per user per post
  UNIQUE(post_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_created_at ON likes(created_at DESC);

-- Enable RLS
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view likes on posts they can see
CREATE POLICY "Users can view likes" ON likes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = likes.post_id
      AND (
        -- User owns the post
        p.user_id = auth.uid()
        -- Or post is public
        OR p.visibility = 'public'
        -- Or post is in circle and user is in same circle
        OR (
          p.visibility = 'circle' 
          AND EXISTS (
            SELECT 1 FROM circle_members cm1
            JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
            WHERE cm1.user_id = auth.uid()
            AND cm2.user_id = p.user_id
          )
        )
        -- Or post is from someone user follows
        OR (
          p.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = auth.uid()
            AND following_id = p.user_id
          )
        )
      )
    )
  );

-- Users can like posts they can see
CREATE POLICY "Users can like posts" ON likes
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
      AND (
        -- User owns the post (yes, you can like your own posts)
        p.user_id = auth.uid()
        -- Or post is public
        OR p.visibility = 'public'
        -- Or post is in circle and user is in same circle
        OR (
          p.visibility = 'circle' 
          AND EXISTS (
            SELECT 1 FROM circle_members cm1
            JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
            WHERE cm1.user_id = auth.uid()
            AND cm2.user_id = p.user_id
          )
        )
        -- Or post is from someone user follows
        OR (
          p.visibility = 'followers'
          AND EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = auth.uid()
            AND following_id = p.user_id
          )
        )
      )
    )
  );

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can unlike posts" ON likes
  FOR DELETE
  USING (user_id = auth.uid());

-- Create a view for like counts per post
CREATE OR REPLACE VIEW post_like_counts AS
SELECT 
  post_id,
  COUNT(*) as like_count,
  ARRAY_AGG(user_id) as user_ids
FROM likes
GROUP BY post_id;

-- Function to toggle like (like if not liked, unlike if liked)
CREATE OR REPLACE FUNCTION toggle_like(p_post_id UUID)
RETURNS JSON AS $$
DECLARE
  v_result JSON;
  v_like_exists BOOLEAN;
  v_like_count INTEGER;
BEGIN
  -- Check if user already liked this post
  SELECT EXISTS(
    SELECT 1 FROM likes 
    WHERE post_id = p_post_id 
    AND user_id = auth.uid()
  ) INTO v_like_exists;
  
  IF v_like_exists THEN
    -- Unlike: Remove the like
    DELETE FROM likes 
    WHERE post_id = p_post_id 
    AND user_id = auth.uid();
    
    -- Get updated count
    SELECT COUNT(*) INTO v_like_count
    FROM likes 
    WHERE post_id = p_post_id;
    
    v_result := json_build_object(
      'liked', false,
      'like_count', v_like_count,
      'action', 'unliked'
    );
  ELSE
    -- Like: Add a new like
    INSERT INTO likes (post_id, user_id)
    VALUES (p_post_id, auth.uid())
    ON CONFLICT (post_id, user_id) DO NOTHING;
    
    -- Get updated count
    SELECT COUNT(*) INTO v_like_count
    FROM likes 
    WHERE post_id = p_post_id;
    
    v_result := json_build_object(
      'liked', true,
      'like_count', v_like_count,
      'action', 'liked'
    );
  END IF;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;