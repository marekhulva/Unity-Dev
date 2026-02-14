-- Diagnose which users can see Mental Detox activities with CURRENT code/data
-- Run this in Supabase SQL Editor

WITH challenge_info AS (
  SELECT id, name, duration_days
  FROM challenges
  WHERE name ILIKE '%Mental Detox%'
  LIMIT 1
),
user_visibility AS (
  SELECT
    cp.id as participation_id,
    cp.user_id,
    p.name as user_name,
    p.username,
    cp.status,
    cp.personal_start_date,
    cp.current_day as stored_current_day,
    -- Calculate what the OLD code would compute
    FLOOR(EXTRACT(EPOCH FROM (NOW() - cp.personal_start_date)) / 86400) + 1 as calculated_current_day_old_code,
    -- Calculate what the NEW code would compute (dates normalized to midnight)
    FLOOR(EXTRACT(EPOCH FROM (DATE_TRUNC('day', NOW()) - DATE_TRUNC('day', cp.personal_start_date))) / 86400) + 1 as calculated_current_day_new_code,
    CASE
      WHEN FLOOR(EXTRACT(EPOCH FROM (NOW() - cp.personal_start_date)) / 86400) + 1 < 1
      THEN FALSE
      ELSE TRUE
    END as can_see_with_old_code,
    CASE
      WHEN FLOOR(EXTRACT(EPOCH FROM (DATE_TRUNC('day', NOW()) - DATE_TRUNC('day', cp.personal_start_date))) / 86400) + 1 < 1
      THEN FALSE
      ELSE TRUE
    END as can_see_with_new_code
  FROM challenge_participants cp
  JOIN challenge_info c ON c.id = cp.challenge_id
  LEFT JOIN profiles p ON p.id = cp.user_id
  WHERE cp.challenge_id = (SELECT id FROM challenge_info)
    AND cp.status = 'active'
)
SELECT
  CASE
    WHEN can_see_with_old_code THEN '✅'
    ELSE '❌'
  END as visibility_status,
  COALESCE(user_name, username, LEFT(user_id::text, 8)) as user_identifier,
  status,
  personal_start_date,
  calculated_current_day_old_code as current_day_old_code,
  calculated_current_day_new_code as current_day_new_code,
  CASE
    WHEN can_see_with_old_code THEN 'Can see activities'
    ELSE 'CANNOT see (starts in ' || (ABS(calculated_current_day_old_code) + 1)::text || ' days)'
  END as status_message
FROM user_visibility
ORDER BY can_see_with_old_code DESC, personal_start_date;

-- Summary
SELECT
  COUNT(*) FILTER (WHERE can_see_with_old_code) as users_can_see,
  COUNT(*) FILTER (WHERE NOT can_see_with_old_code) as users_cannot_see,
  COUNT(*) as total_users
FROM user_visibility;
