-- Check Zaine's Living Progress Cards for today
-- Run in Supabase SQL Editor

SELECT
  p.id,
  p.challenge_id,
  p.challenge_name,
  p.completed_actions::jsonb AS actions,
  jsonb_array_length(p.completed_actions::jsonb) AS action_count,
  p.actions_today,
  p.created_at,
  p.updated_at
FROM posts p
WHERE p.user_id = '53e3fb35-df02-4cc8-877d-f6eac6c8f490'  -- Zaine
  AND p.progress_date = '2026-02-12'
  AND p.is_daily_progress = true
ORDER BY p.created_at;
