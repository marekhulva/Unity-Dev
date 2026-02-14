-- Add visibility column to goals table if it doesn't exist
ALTER TABLE goals 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' 
CHECK (visibility IN ('public', 'circle', 'private'));

-- Add visibility to actions table if it doesn't exist
ALTER TABLE actions 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public'
CHECK (visibility IN ('public', 'circle', 'private'));

-- Create profile views tracking table (for analytics/future features)
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(viewer_id, viewed_id, viewed_at)
);

-- Add RLS policies for profile_views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

-- Users can insert their own profile views
CREATE POLICY "Users can track their own views" ON profile_views
  FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Users can see who viewed their profile
CREATE POLICY "Users can see their profile viewers" ON profile_views
  FOR SELECT USING (auth.uid() = viewed_id);