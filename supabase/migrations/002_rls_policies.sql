-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Users can view all profiles (for social features)
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Goals policies
-- Users can view their own goals
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own goals
CREATE POLICY "Users can create own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own goals
CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own goals
CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- Actions policies
-- Users can view their own actions
CREATE POLICY "Users can view own actions" ON actions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own actions
CREATE POLICY "Users can create own actions" ON actions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own actions
CREATE POLICY "Users can update own actions" ON actions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own actions
CREATE POLICY "Users can delete own actions" ON actions
  FOR DELETE USING (auth.uid() = user_id);

-- Posts policies
-- Complex visibility rules for posts
CREATE POLICY "Posts are viewable based on visibility" ON posts
  FOR SELECT USING (
    -- User can see their own posts
    auth.uid() = user_id
    OR
    -- Public posts are visible to everyone
    visibility = 'public'
    OR
    -- Circle posts visible to circle members
    (visibility = 'circle' AND EXISTS (
      SELECT 1 FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = posts.user_id 
      AND cm2.user_id = auth.uid()
    ))
    OR
    -- Follow posts visible to followers
    (visibility = 'follow' AND EXISTS (
      SELECT 1 FROM follows
      WHERE following_id = posts.user_id 
      AND follower_id = auth.uid()
    ))
  );

-- Users can create their own posts
CREATE POLICY "Users can create own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);

-- Reactions policies
-- Users can view reactions on visible posts
CREATE POLICY "Reactions viewable on visible posts" ON reactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = reactions.post_id
      AND (
        posts.user_id = auth.uid() 
        OR posts.visibility = 'public'
        OR (posts.visibility = 'circle' AND EXISTS (
          SELECT 1 FROM circle_members cm1
          JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
          WHERE cm1.user_id = posts.user_id 
          AND cm2.user_id = auth.uid()
        ))
        OR (posts.visibility = 'follow' AND EXISTS (
          SELECT 1 FROM follows
          WHERE following_id = posts.user_id 
          AND follower_id = auth.uid()
        ))
      )
    )
  );

-- Users can add reactions to visible posts
CREATE POLICY "Users can add reactions to visible posts" ON reactions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = post_id
      AND (
        posts.visibility = 'public'
        OR (posts.visibility = 'circle' AND EXISTS (
          SELECT 1 FROM circle_members cm1
          JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
          WHERE cm1.user_id = posts.user_id 
          AND cm2.user_id = auth.uid()
        ))
        OR (posts.visibility = 'follow' AND EXISTS (
          SELECT 1 FROM follows
          WHERE following_id = posts.user_id 
          AND follower_id = auth.uid()
        ))
      )
    )
  );

-- Users can delete their own reactions
CREATE POLICY "Users can delete own reactions" ON reactions
  FOR DELETE USING (auth.uid() = user_id);

-- Streaks policies
-- Users can view their own streaks
CREATE POLICY "Users can view own streaks" ON streaks
  FOR SELECT USING (auth.uid() = user_id);

-- Users can manage their own streaks
CREATE POLICY "Users can manage own streaks" ON streaks
  FOR ALL USING (auth.uid() = user_id);

-- Circles policies
-- Anyone can view circles they're a member of
CREATE POLICY "View circles you're a member of" ON circles
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM circle_members 
      WHERE circle_id = circles.id 
      AND user_id = auth.uid()
    )
  );

-- Users can create circles
CREATE POLICY "Users can create circles" ON circles
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Circle creators can update their circles
CREATE POLICY "Circle creators can update" ON circles
  FOR UPDATE USING (auth.uid() = created_by);

-- Circle creators can delete their circles
CREATE POLICY "Circle creators can delete" ON circles
  FOR DELETE USING (auth.uid() = created_by);

-- Circle members policies
-- View members of circles you're in
CREATE POLICY "View members of your circles" ON circle_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM circle_members cm
      WHERE cm.circle_id = circle_members.circle_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Circle creators can add members
CREATE POLICY "Circle creators can add members" ON circle_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM circles 
      WHERE id = circle_id 
      AND created_by = auth.uid()
    )
  );

-- Users can leave circles (delete themselves)
CREATE POLICY "Users can leave circles" ON circle_members
  FOR DELETE USING (user_id = auth.uid());

-- Follows policies
-- Anyone can view follows (for social features)
CREATE POLICY "Follows are public" ON follows
  FOR SELECT USING (true);

-- Users can follow others
CREATE POLICY "Users can follow others" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their follows)
CREATE POLICY "Users can unfollow" ON follows
  FOR DELETE USING (auth.uid() = follower_id);