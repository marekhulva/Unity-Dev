-- See ALL challenges in the TEST123 circle
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.start_date,
  c.end_date,
  c.config,
  c.circle_id,
  (SELECT COUNT(*) FROM challenge_activities WHERE challenge_id = c.id) as activity_count
FROM challenges c
WHERE c.circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'  -- TEST123 circle
ORDER BY c.created_at DESC;

-- Check if our Jing Challenge got moved correctly
SELECT 
  c.id,
  c.name,
  c.circle_id,
  ci.name as circle_name
FROM challenges c
LEFT JOIN circles ci ON c.circle_id = ci.id
WHERE c.name = 'Jing Challenge';

-- Clean up option 1: Delete all the broken test challenges (OPTIONAL - only if you want)
-- DELETE FROM challenges 
-- WHERE circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'
-- AND end_date IS NULL
-- AND name != 'Jing Challenge';

-- Option 2: Fix all challenges to have proper dates and config
UPDATE challenges
SET 
  end_date = COALESCE(end_date, start_date + INTERVAL '30 days'),
  config = CASE 
    WHEN config IS NULL OR config = '{}'::jsonb 
    THEN jsonb_build_object(
      'min_activities', 3,
      'max_activities', 5,
      'required_daily', 3,
      'icon', '🏆'
    )
    ELSE config
  END
WHERE circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'
AND (end_date IS NULL OR config IS NULL OR config = '{}'::jsonb);