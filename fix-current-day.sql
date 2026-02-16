-- Fix current_day calculation bug
-- Run this in Unity Dev Supabase first to test!

-- Step 1: See the problem (before fix)
SELECT
  p.name,
  cp.personal_start_date,
  cp.current_day as "current_day (WRONG)",
  (CURRENT_DATE - cp.personal_start_date::date) + 1 as "should_be",
  CURRENT_DATE as today
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
  AND cp.status != 'left'
ORDER BY cp.personal_start_date, p.name;

-- Step 2: Fix all current_day values
UPDATE challenge_participants
SET current_day = (CURRENT_DATE - personal_start_date::date) + 1
WHERE status != 'left';

-- Step 3: Verify the fix (after)
SELECT
  p.name,
  cp.personal_start_date,
  cp.current_day as "current_day (FIXED)",
  (CURRENT_DATE - cp.personal_start_date::date) + 1 as "calculated",
  CASE
    WHEN cp.current_day = (CURRENT_DATE - cp.personal_start_date::date) + 1
    THEN '✅ CORRECT'
    ELSE '❌ STILL WRONG'
  END as status
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
  AND cp.status != 'left'
ORDER BY cp.personal_start_date, p.name;

-- Summary: Show counts by start date
SELECT
  personal_start_date,
  current_day,
  COUNT(*) as user_count,
  ARRAY_AGG(p.name) as users
FROM challenge_participants cp
JOIN profiles p ON cp.user_id = p.id
WHERE cp.challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647'
  AND cp.status != 'left'
GROUP BY personal_start_date, current_day
ORDER BY personal_start_date, current_day;
