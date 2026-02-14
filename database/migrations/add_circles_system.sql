-- Circle/Following System Migration
-- Created: Jan 22, 2025
-- Purpose: Add circles (groups) and following functionality

-- 1. Create circles table
CREATE TABLE IF NOT EXISTS circles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  invite_code VARCHAR(10) UNIQUE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- 2. Create circle_members table (who's in each circle)
CREATE TABLE IF NOT EXISTS circle_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  role VARCHAR(20) DEFAULT 'member', -- 'admin', 'member'
  UNIQUE(circle_id, user_id)
);

-- 3. Create follows table (who follows whom)
CREATE TABLE IF NOT EXISTS follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

-- 4. Add circle_id to users table (current circle)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES circles(id),
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0;

-- 5. Update posts table for better visibility control
ALTER TABLE posts
ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES circles(id);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_circle_members_circle_id ON circle_members(circle_id);
CREATE INDEX IF NOT EXISTS idx_circle_members_user_id ON circle_members(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_posts_circle_id ON posts(circle_id);

-- 7. Create function to generate unique invite codes
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger to auto-generate invite codes
CREATE OR REPLACE FUNCTION set_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invite_code IS NULL THEN
    NEW.invite_code := generate_invite_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_invite_code
BEFORE INSERT ON circles
FOR EACH ROW
EXECUTE FUNCTION set_invite_code();

-- 9. RLS Policies for circles
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Anyone can view circles (for discovery later)
CREATE POLICY "Circles are viewable by everyone" 
ON circles FOR SELECT 
USING (true);

-- Only circle members can see who's in the circle
CREATE POLICY "Circle members can see other members" 
ON circle_members FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM circle_members cm 
    WHERE cm.circle_id = circle_members.circle_id 
    AND cm.user_id = auth.uid()
  )
);

-- Users can see who they follow and who follows them
CREATE POLICY "Users can see their follows" 
ON follows FOR SELECT 
USING (follower_id = auth.uid() OR following_id = auth.uid());

-- Users can follow/unfollow others
CREATE POLICY "Users can manage their follows" 
ON follows FOR ALL 
USING (follower_id = auth.uid());

-- 10. Helper functions

-- Join a circle with invite code
CREATE OR REPLACE FUNCTION join_circle_with_code(code TEXT)
RETURNS JSON AS $$
DECLARE
  v_circle_id UUID;
  v_user_id UUID;
  v_result JSON;
BEGIN
  v_user_id := auth.uid();
  
  -- Find circle by invite code
  SELECT id INTO v_circle_id 
  FROM circles 
  WHERE UPPER(invite_code) = UPPER(code) 
  AND is_active = true;
  
  IF v_circle_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid invite code');
  END IF;
  
  -- Check if already a member
  IF EXISTS (
    SELECT 1 FROM circle_members 
    WHERE circle_id = v_circle_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Already a member of this circle');
  END IF;
  
  -- Add user to circle
  INSERT INTO circle_members (circle_id, user_id)
  VALUES (v_circle_id, v_user_id);
  
  -- Update user's current circle
  UPDATE profiles 
  SET circle_id = v_circle_id 
  WHERE id = v_user_id;
  
  -- Update member count
  UPDATE circles 
  SET member_count = member_count + 1 
  WHERE id = v_circle_id;
  
  RETURN json_build_object('success', true, 'circle_id', v_circle_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT ALL ON circles TO authenticated;
GRANT ALL ON circle_members TO authenticated;
GRANT ALL ON follows TO authenticated;
GRANT ALL ON circles TO anon;
GRANT ALL ON circle_members TO anon;
GRANT ALL ON follows TO anon;