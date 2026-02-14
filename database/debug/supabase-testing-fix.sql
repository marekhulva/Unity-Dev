-- TEMPORARY FIX FOR TESTING
-- This allows posts to be created and viewed without authentication
-- RUN THIS IN SUPABASE SQL EDITOR

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Posts are viewable based on visibility" ON posts;
DROP POLICY IF EXISTS "Users can create own posts" ON posts;

-- Create more permissive policies for testing
CREATE POLICY "Posts are viewable by everyone" ON posts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can create posts temporarily" ON posts
  FOR INSERT WITH CHECK (true);

-- Allow anonymous users to view profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

-- Create a test user profile if needed
INSERT INTO profiles (id, email, name, username)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@freestyle.app', 
  'Test User',
  'testuser'
)
ON CONFLICT (id) DO NOTHING;

SELECT 'Testing mode enabled! Posts should work now.' as message;