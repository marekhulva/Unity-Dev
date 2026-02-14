-- Find duplicate Living Progress Cards for today (2026-02-12)
-- Run this in Supabase SQL Editor

SELECT
  p.id,
  p.user_id,
  prof.username,
  p.challenge_id,
  p.challenge_name,
  p.completed_actions,
  p.actions_today,
  p.created_at,
  p.updated_at
FROM posts p
LEFT JOIN profiles prof ON prof.id = p.user_id
WHERE p.is_daily_progress = true
  AND p.progress_date = '2026-02-12'
ORDER BY p.user_id, p.created_at;
