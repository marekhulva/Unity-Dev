-- Schema Analysis Queries for Phase 2 Planning
-- Copy each query and run in Supabase SQL Editor (https://supabase.com/dashboard)

-- ============================================
-- QUERY 1: Check actions table schema
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'actions'
ORDER BY ordinal_position;

-- ============================================
-- QUERY 2: Check if challenge_id exists and has data
-- ============================================
SELECT
  COUNT(*) as total_actions,
  COUNT(challenge_id) as actions_with_challenge,
  COUNT(DISTINCT challenge_id) as unique_challenges_referenced
FROM actions;

-- ============================================
-- QUERY 3: Check challenges table schema
-- ============================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'challenges'
ORDER BY ordinal_position;

-- ============================================
-- QUERY 4: Check existing challenges data
-- ============================================
SELECT
  COUNT(*) as total_challenges,
  COUNT(DISTINCT circle_id) as circles_with_challenges,
  COUNT(*) FILTER (WHERE is_active = true) as active_challenges
FROM challenges;

-- ============================================
-- QUERY 5: Check challenge_participants data
-- ============================================
SELECT
  COUNT(*) as total_participants,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT challenge_id) as challenges_with_participants
FROM challenge_participants;

-- ============================================
-- QUERY 6: Check if we have production data to preserve
-- ============================================
SELECT
  'challenges' as table_name,
  COUNT(*) as row_count
FROM challenges
UNION ALL
SELECT 'challenge_participants', COUNT(*) FROM challenge_participants
UNION ALL
SELECT 'challenge_completions', COUNT(*) FROM challenge_completions
UNION ALL
SELECT 'actions (with challenge_id)', COUNT(*) FROM actions WHERE challenge_id IS NOT NULL;

-- ============================================
-- QUERY 7: Sample challenge to understand structure
-- ============================================
SELECT *
FROM challenges
LIMIT 1;

-- ============================================
-- QUERY 8: Sample challenge_participant to understand structure
-- ============================================
SELECT *
FROM challenge_participants
LIMIT 1;
