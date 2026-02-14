-- Fix the RLS policy for challenge_activities table
-- First, drop any existing policies
DROP POLICY IF EXISTS "Anyone can view challenge activities" ON challenge_activities;
DROP POLICY IF EXISTS "Users can view challenge activities" ON challenge_activities;
DROP POLICY IF EXISTS "Public read access to challenge activities" ON challenge_activities;

-- Create a new policy that allows everyone to view activities
CREATE POLICY "Public read access to challenge activities" 
  ON challenge_activities 
  FOR SELECT 
  USING (true);

-- Make sure RLS is enabled but with the permissive policy
ALTER TABLE challenge_activities ENABLE ROW LEVEL SECURITY;

-- Test that we can now read activities
SELECT * FROM challenge_activities 
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';

-- Also check and fix challenge_participants table permissions
DROP POLICY IF EXISTS "Anyone can view participants" ON challenge_participants;
DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;

-- Create proper policies for participants
CREATE POLICY "Public read access to participants" 
  ON challenge_participants 
  FOR SELECT 
  USING (true);

CREATE POLICY "Users can join challenges" 
  ON challenge_participants 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation" 
  ON challenge_participants 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Verify the policies are working
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('challenge_activities', 'challenge_participants')
ORDER BY tablename, policyname;