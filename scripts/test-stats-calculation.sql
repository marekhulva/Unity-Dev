-- Test query to verify stats are calculated correctly
-- Check current stats for our test user
SELECT 
  p.email,
  cp.total_completions,
  cp.consistency_percentage,
  cp.current_streak,
  cp.joined_at,
  DATE(cp.joined_at) as joined_date,
  CURRENT_DATE as today,
  CURRENT_DATE - DATE(cp.joined_at) + 1 as days_since_joined
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
WHERE p.email = 'eeeee@eeee.com';

-- Check all completions for this user
SELECT 
  cc.completion_date,
  ca.title as activity_title,
  cc.created_at
FROM challenge_completions cc
JOIN challenge_activities ca ON ca.id = cc.activity_id
JOIN challenge_participants cp ON cp.id = cc.participant_id
JOIN profiles p ON p.id = cp.user_id
WHERE p.email = 'eeeee@eeee.com'
ORDER BY cc.completion_date DESC, cc.created_at DESC;

-- Check leaderboard data
SELECT 
  p.email,
  p.name,
  cp.total_completions,
  cp.consistency_percentage,
  cp.current_streak
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
JOIN challenges c ON c.id = cp.challenge_id
WHERE c.name = 'Jing Challenge'
ORDER BY cp.total_completions DESC, cp.consistency_percentage DESC;