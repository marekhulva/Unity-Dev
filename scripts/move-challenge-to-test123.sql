-- Move the Jing Challenge to the TEST123 circle that the user is actually in
UPDATE challenges
SET circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'  -- TEST123 circle ID
WHERE id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';  -- Jing Challenge ID

-- Verify the move
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.circle_id,
  ci.name as circle_name,
  c.start_date,
  c.end_date,
  c.config,
  (SELECT COUNT(*) FROM challenge_activities WHERE challenge_id = c.id) as activity_count
FROM challenges c
LEFT JOIN circles ci ON c.circle_id = ci.id
WHERE c.id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';