-- Apply the post_comments migration
-- This creates the post_comments table with proper RLS policies

-- Create reactions table if it doesn't exist
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

-- Indexes for performance (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_reactions_post_id ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_reactions_user_id ON post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON post_comments(user_id);

-- Enable RLS
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all reactions on public/circle posts" ON post_reactions;
DROP POLICY IF EXISTS "Users can add reactions to visible posts" ON post_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON post_reactions;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON post_comments;
DROP POLICY IF EXISTS "Users can add comments to visible posts" ON post_comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON post_comments;

-- RLS Policies for reactions
CREATE POLICY "Users can view all reactions on public/circle posts" ON post_reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_reactions.post_id
      AND (
        posts.visibility IN ('public', 'followers')
        OR (posts.visibility = 'circle' AND EXISTS (
          SELECT 1 FROM circle_members cm1
          JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
          WHERE cm1.user_id = auth.uid()
          AND cm2.user_id = posts.user_id
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
        OR (posts.visibility = 'circle' AND EXISTS (
          SELECT 1 FROM circle_members cm1
          JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
          WHERE cm1.user_id = auth.uid()
          AND cm2.user_id = posts.user_id
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
        OR (posts.visibility = 'circle' AND EXISTS (
          SELECT 1 FROM circle_members cm1
          JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
          WHERE cm1.user_id = auth.uid()
          AND cm2.user_id = posts.user_id
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
        OR (posts.visibility = 'circle' AND EXISTS (
          SELECT 1 FROM circle_members cm1
          JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
          WHERE cm1.user_id = auth.uid()
          AND cm2.user_id = posts.user_id
        ))
      )
    )
  );

CREATE POLICY "Users can delete their own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Check if tables were created successfully
SELECT 'post_reactions' as table_name, EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'post_reactions'
) as exists
UNION ALL
SELECT 'post_comments' as table_name, EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'post_comments'
) as exists;