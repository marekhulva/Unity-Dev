-- Check existing circle challenges
SELECT
  c.id,
  c.name,
  c.description,
  c.circle_id,
  ci.name as circle_name,
  c.start_date,
  c.end_date,
  c.status,
  c.created_at
FROM circle_challenges c
LEFT JOIN circles ci ON c.circle_id = ci.id
ORDER BY c.created_at DESC
LIMIT 10;

-- Check your circle memberships
SELECT
  cm.circle_id,
  ci.name as circle_name,
  ci.invite_code
FROM circle_members cm
JOIN circles ci ON cm.circle_id = ci.id
WHERE cm.user_id = (SELECT id FROM profiles WHERE name = '12221212' OR email LIKE '%12221212%' LIMIT 1);

-- Check challenge participants
SELECT
  cp.challenge_id,
  cc.name as challenge_name,
  COUNT(*) as participant_count
FROM circle_challenge_participants cp
JOIN circle_challenges cc ON cp.challenge_id = cc.id
GROUP BY cp.challenge_id, cc.name;

-- Check challenge activities
SELECT
  ca.id,
  ca.challenge_id,
  cc.name as challenge_name,
  ca.action_id,
  a.title as action_title,
  ca.scheduled_time
FROM circle_challenge_activities ca
JOIN circle_challenges cc ON ca.challenge_id = cc.id
LEFT JOIN actions a ON ca.action_id = a.id
ORDER BY ca.scheduled_time
LIMIT 20;
