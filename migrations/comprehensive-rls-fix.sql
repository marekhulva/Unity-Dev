-- ==========================================
-- COMPREHENSIVE RLS FIX FOR CHALLENGES
-- ==========================================
-- This script will:
-- 1. Drop ALL existing policies
-- 2. Verify RLS is enabled
-- 3. Create simple, permissive policies for testing
-- 4. Test that queries work
-- ==========================================

-- STEP 1: Drop ALL existing policies on challenge tables
DO $$
BEGIN
    -- Drop challenges policies
    DROP POLICY IF EXISTS "Anyone can view active challenges" ON challenges;
    DROP POLICY IF EXISTS "Authenticated users can view active challenges" ON challenges;
    DROP POLICY IF EXISTS "Circle members can view circle challenges" ON challenges;
    DROP POLICY IF EXISTS "Users can create challenges" ON challenges;
    DROP POLICY IF EXISTS "Challenge creators can update their challenges" ON challenges;

    -- Drop challenge_participants policies
    DROP POLICY IF EXISTS "View participants of joined challenges" ON challenge_participants;
    DROP POLICY IF EXISTS "Users can view own participation" ON challenge_participants;
    DROP POLICY IF EXISTS "View other participants in your challenges" ON challenge_participants;
    DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
    DROP POLICY IF EXISTS "Users can update own participation" ON challenge_participants;

    -- Drop challenge_completions policies
    DROP POLICY IF EXISTS "Users can view own completions" ON challenge_completions;
    DROP POLICY IF EXISTS "Users can insert own completions" ON challenge_completions;

    -- Drop user_badges policies
    DROP POLICY IF EXISTS "Users can view own badges" ON user_badges;
    DROP POLICY IF EXISTS "Users can view all badges" ON user_badges;

    -- Drop forum policies
    DROP POLICY IF EXISTS "View threads in accessible challenges" ON challenge_forum_threads;
    DROP POLICY IF EXISTS "Create threads in joined challenges" ON challenge_forum_threads;
    DROP POLICY IF EXISTS "View replies in accessible threads" ON challenge_forum_replies;
    DROP POLICY IF EXISTS "Create replies in accessible threads" ON challenge_forum_replies;

    RAISE NOTICE 'All old policies dropped';
END $$;

-- STEP 2: Ensure RLS is enabled on all tables
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_forum_replies ENABLE ROW LEVEL SECURITY;

-- STEP 3: Create VERY SIMPLE policies for testing

-- === CHALLENGES TABLE ===
-- Allow ALL authenticated users to view ALL active challenges (global + circle)
CREATE POLICY "authenticated_can_view_challenges"
ON challenges FOR SELECT
TO authenticated
USING (status = 'active');

-- === CHALLENGE_PARTICIPANTS TABLE ===
-- Allow authenticated users to view their OWN participations
CREATE POLICY "view_own_participations"
ON challenge_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to INSERT their own participations
CREATE POLICY "insert_own_participations"
ON challenge_participants FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to UPDATE their own participations
CREATE POLICY "update_own_participations"
ON challenge_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- === CHALLENGE_COMPLETIONS TABLE ===
-- Allow authenticated users to view their OWN completions
CREATE POLICY "view_own_completions"
ON challenge_completions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Allow authenticated users to INSERT their own completions
CREATE POLICY "insert_own_completions"
ON challenge_completions FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- === USER_BADGES TABLE ===
-- Allow all authenticated users to view ALL badges (for social features)
CREATE POLICY "view_all_badges"
ON user_badges FOR SELECT
TO authenticated
USING (true);

-- Allow system to insert badges (via SECURITY DEFINER function)
CREATE POLICY "system_insert_badges"
ON user_badges FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- === FORUM TABLES ===
-- Allow authenticated users to view forum threads
CREATE POLICY "view_forum_threads"
ON challenge_forum_threads FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create forum threads
CREATE POLICY "create_forum_threads"
ON challenge_forum_threads FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Allow authenticated users to view forum replies
CREATE POLICY "view_forum_replies"
ON challenge_forum_replies FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to create forum replies
CREATE POLICY "create_forum_replies"
ON challenge_forum_replies FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- STEP 4: Test queries (these should work now)
-- Test 1: Can we query challenges?
DO $$
DECLARE
  challenge_count INT;
BEGIN
  SELECT COUNT(*) INTO challenge_count FROM challenges WHERE status = 'active';
  RAISE NOTICE 'Found % active challenges', challenge_count;
END $$;

-- Test 2: Can we query challenge_participants? (will be 0 for new user)
DO $$
DECLARE
  participant_count INT;
BEGIN
  SELECT COUNT(*) INTO participant_count FROM challenge_participants;
  RAISE NOTICE 'Found % challenge participations', participant_count;
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies have been reset and simplified!';
  RAISE NOTICE '✅ Try refreshing your app now';
END $$;
