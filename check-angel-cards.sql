-- Check Angel's Living Progress Cards for today
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
WHERE p.user_id = '60341cc9-99b3-4b25-b26f-3a4a518d169f'  -- Angel
  AND p.progress_date = '2026-02-12'
  AND p.is_daily_progress = true
ORDER BY p.created_at;
