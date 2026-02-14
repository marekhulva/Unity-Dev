-- Fix RLS policies to allow proper access

-- Drop the broken policies
DROP POLICY IF EXISTS "Anyone can view active challenges" ON challenges;
DROP POLICY IF EXISTS "View participants of joined challenges" ON challenge_participants;

-- Fix challenges policy - allow ALL authenticated users to view
CREATE POLICY "Authenticated users can view active challenges"
ON challenges FOR SELECT
TO authenticated
USING (status = 'active');

-- Fix participants policy - remove the recursive check
CREATE POLICY "Users can view own participation"
ON challenge_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Add policy to view all participants in challenges you've joined
CREATE POLICY "View other participants in your challenges"
ON challenge_participants FOR SELECT
TO authenticated
USING (
  challenge_id IN (
    SELECT cp.challenge_id
    FROM challenge_participants cp
    WHERE cp.user_id = auth.uid()
  )
);
