-- Enable testing without authentication
-- Run this in Supabase SQL Editor for local testing

-- Drop existing policies that require authentication
DROP POLICY IF EXISTS "Users can create own posts" ON posts;
DROP POLICY IF EXISTS "Posts are viewable based on visibility" ON posts;

-- Create permissive policies for testing
CREATE POLICY "Anyone can create posts for testing" ON posts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view posts for testing" ON posts
  FOR SELECT USING (true);

-- Ensure test user profile exists
INSERT INTO profiles (id, email, name, username)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'test@freestyle.app',
  'Test User',
  'testuser'
)
ON CONFLICT (id) DO UPDATE
SET name = 'Test User',
    username = 'testuser';

-- Also make goals and actions viewable/creatable for testing
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can create own goals" ON goals;
CREATE POLICY "Anyone can view goals for testing" ON goals
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create goals for testing" ON goals
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view own actions" ON actions;
DROP POLICY IF EXISTS "Users can create own actions" ON actions;
CREATE POLICY "Anyone can view actions for testing" ON actions
  FOR SELECT USING (true);
CREATE POLICY "Anyone can create actions for testing" ON actions
  FOR INSERT WITH CHECK (true);

SELECT 'Testing mode enabled! You can now post without authentication.' as message;