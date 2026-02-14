-- Fix: Allow users to see all participants in challenges they've joined
-- Current policy only lets you see your own row, breaking the leaderboard

DROP POLICY IF EXISTS "view_own_participations" ON challenge_participants;

CREATE POLICY "view_participants_in_joined_challenges"
ON challenge_participants FOR SELECT
TO authenticated
USING (
  challenge_id IN (
    SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
  )
);
