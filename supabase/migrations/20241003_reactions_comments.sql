-- Create reactions table (fire emoji only)
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- One reaction per user per post
);

-- Create comments table
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_reactions_post_id ON post_reactions(post_id);
CREATE INDEX idx_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_reactions_user_id ON post_reactions(user_id);
CREATE INDEX idx_comments_user_id ON post_comments(user_id);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reactions
CREATE POLICY "Users can view all reactions on public/circle posts" ON post_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_reactions.post_id
      AND (
        posts.visibility IN ('public', 'followers')
        OR (posts.visibility = 'circle' AND posts.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
        ))
        OR posts.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add reactions to visible posts" ON post_reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_reactions.post_id
      AND (
        posts.visibility IN ('public', 'followers')
        OR (posts.visibility = 'circle' AND posts.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can remove their own reactions" ON post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for comments
CREATE POLICY "Users can view comments on visible posts" ON post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND (
        posts.visibility IN ('public', 'followers')
        OR (posts.visibility = 'circle' AND posts.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
        ))
        OR posts.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can add comments to visible posts" ON post_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_comments.post_id
      AND (
        posts.visibility IN ('public', 'followers')
        OR (posts.visibility = 'circle' AND posts.circle_id IN (
          SELECT circle_id FROM circle_members WHERE user_id = auth.uid()
        ))
      )
    )
  );

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get reaction counts with user info
CREATE OR REPLACE FUNCTION get_post_reactions(post_id_param UUID)
RETURNS TABLE (
  reaction_count INT,
  user_reacted BOOLEAN,
  reactor_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INT as reaction_count,
    EXISTS(SELECT 1 FROM post_reactions WHERE post_id = post_id_param AND user_id = auth.uid()) as user_reacted,
    ARRAY_AGG(p.username ORDER BY pr.created_at DESC) FILTER (WHERE p.username IS NOT NULL) as reactor_names
  FROM post_reactions pr
  LEFT JOIN profiles p ON pr.user_id = p.id
  WHERE pr.post_id = post_id_param
  GROUP BY post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;