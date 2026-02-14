-- Add privacy/visibility fields to goals and actions tables
-- This allows users to control who can see their goals and activities

-- Add visibility to goals table
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' 
CHECK (visibility IN ('public', 'circle', 'private'));

-- Add visibility to actions table
ALTER TABLE actions 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'
CHECK (visibility IN ('public', 'circle', 'private'));

-- Create profile views tracking table (for analytics/future features)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id, viewed_at) -- Prevent duplicate views in same second
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_goals_visibility ON goals(visibility);
CREATE INDEX IF NOT EXISTS idx_actions_visibility ON actions(visibility);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewed ON profile_views(viewed_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_viewer ON profile_views(viewer_id);

-- Update RLS policies for goals to respect visibility
DROP POLICY IF EXISTS "Users can view their own goals" ON goals;
DROP POLICY IF EXISTS "Users can view public goals" ON goals;

CREATE POLICY "Users can view their own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public goals" ON goals
  FOR SELECT USING (
    visibility = 'public' 
    OR 
    auth.uid() = user_id
  );

-- Add policy for circle members to view circle-visible goals
CREATE POLICY "Circle members can view circle goals" ON goals
  FOR SELECT USING (
    visibility = 'circle' 
    AND 
    EXISTS (
      SELECT 1 FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid() 
      AND cm2.user_id = goals.user_id
    )
  );

-- Similar policies for actions table
DROP POLICY IF EXISTS "Users can view their own actions" ON actions;
DROP POLICY IF EXISTS "Users can view public actions" ON actions;

CREATE POLICY "Users can view their own actions" ON actions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public actions" ON actions
  FOR SELECT USING (
    visibility = 'public' 
    OR 
    auth.uid() = user_id
  );

CREATE POLICY "Circle members can view circle actions" ON actions
  FOR SELECT USING (
    visibility = 'circle' 
    AND 
    EXISTS (
      SELECT 1 FROM circle_members cm1
      JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
      WHERE cm1.user_id = auth.uid() 
      AND cm2.user_id = actions.user_id
    )
  );

-- RLS for profile_views table
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile views" ON profile_views
  FOR SELECT USING (viewer_id = auth.uid() OR viewed_id = auth.uid());

CREATE POLICY "Users can insert profile views" ON profile_views
  FOR INSERT WITH CHECK (viewer_id = auth.uid());