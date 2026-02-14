-- ==========================================
-- RE-ENABLE RLS WITH CORRECT POLICIES
-- ==========================================
-- Run this AFTER confirming challenges work with RLS disabled
-- This will re-enable RLS with the correct policies
-- ==========================================

-- Re-enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_replies ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first
DROP POLICY IF EXISTS "authenticated_can_view_challenges" ON challenges;
DROP POLICY IF EXISTS "view_own_participations" ON challenge_participants;
DROP POLICY IF EXISTS "insert_own_participations" ON challenge_participants;
DROP POLICY IF EXISTS "update_own_participations" ON challenge_participants;
DROP POLICY IF EXISTS "view_own_completions" ON challenge_completions;
DROP POLICY IF EXISTS "insert_own_completions" ON challenge_completions;
DROP POLICY IF EXISTS "view_all_badges" ON user_badges;
DROP POLICY IF EXISTS "system_insert_badges" ON user_badges;
DROP POLICY IF EXISTS "view_forum_threads" ON challenge_forum_threads;
DROP POLICY IF EXISTS "create_forum_threads" ON challenge_forum_threads;
DROP POLICY IF EXISTS "view_forum_replies" ON challenge_forum_replies;
DROP POLICY IF EXISTS "create_forum_replies" ON challenge_forum_replies;

-- Create simple, permissive policies

-- CHALLENGES: Allow all authenticated users to view active challenges
CREATE POLICY "authenticated_can_view_challenges"
ON challenges FOR SELECT
USING (auth.role() = 'authenticated' AND status = 'active');

-- CHALLENGE_PARTICIPANTS: Users can view their own participations
CREATE POLICY "view_own_participations"
ON challenge_participants FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_participations"
ON challenge_participants FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_participations"
ON challenge_participants FOR UPDATE
USING (auth.uid() = user_id);

-- CHALLENGE_COMPLETIONS: Users can view and insert their own completions
CREATE POLICY "view_own_completions"
ON challenge_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "insert_own_completions"
ON challenge_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- USER_BADGES: All authenticated users can view all badges
CREATE POLICY "view_all_badges"
ON user_badges FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "system_insert_badges"
ON user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- FORUM: Authenticated users can view and create
CREATE POLICY "view_forum_threads"
ON challenge_forum_threads FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "create_forum_threads"
ON challenge_forum_threads FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "view_forum_replies"
ON challenge_forum_replies FOR SELECT
USING (auth.role() = 'authenticated');

CREATE POLICY "create_forum_replies"
ON challenge_forum_replies FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Test that queries work
DO $$
DECLARE
  challenge_count INT;
BEGIN
  SELECT COUNT(*) INTO challenge_count FROM challenges WHERE status = 'active';
  RAISE NOTICE '✅ RLS has been re-enabled with policies';
  RAISE NOTICE '✅ Found % active challenges', challenge_count;
  RAISE NOTICE '✅ Refresh your app to verify it still works';
END $$;
