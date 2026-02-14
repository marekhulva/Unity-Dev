-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add constraint for content length
  CONSTRAINT content_length CHECK (char_length(content) <= 500)
);

-- Create indexes for better performance
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view comments on posts they can see
CREATE POLICY "Users can view comments" ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = comments.post_id
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

-- Users can create comments on posts they can see
CREATE POLICY "Users can create comments" ON comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_id
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

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON comments
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON comments
  FOR DELETE
  USING (user_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comments_updated_at();