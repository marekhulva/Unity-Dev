-- ONE-TIME RECALCULATION: Fix all challenge_participants scores, streaks, and ranks
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- Step 1: Fix completion_percentage using actual completion counts
-- This calculates: completions / (days_so_far * activities_per_day)
-- Capped at 100%

WITH participant_stats AS (
  SELECT
    cp.id,
    cp.user_id,
    cp.challenge_id,
    cp.personal_start_date,
    cp.selected_activity_ids,
    cp.longest_streak,
    c.duration_days,
    c.predetermined_activities,
    c.success_threshold,
    -- Current day for this participant
    GREATEST(1, EXTRACT(DAY FROM (NOW() - cp.personal_start_date))::int + 1) as current_day,
    -- Days so far (capped at duration)
    LEAST(
      GREATEST(1, EXTRACT(DAY FROM (NOW() - cp.personal_start_date))::int + 1),
      c.duration_days
    ) as days_so_far,
    -- Count total completions
    (SELECT COUNT(*) FROM challenge_completions cc
     WHERE cc.user_id = cp.user_id AND cc.challenge_id = cp.challenge_id) as total_completions,
    -- Count unique days with completions
    (SELECT COUNT(DISTINCT completion_date) FROM challenge_completions cc
     WHERE cc.user_id = cp.user_id AND cc.challenge_id = cp.challenge_id) as completed_days_count,
    -- Get completion dates for streak calc
    (SELECT ARRAY_AGG(DISTINCT completion_date ORDER BY completion_date DESC)
     FROM challenge_completions cc
     WHERE cc.user_id = cp.user_id AND cc.challenge_id = cp.challenge_id) as completion_dates
  FROM challenge_participants cp
  JOIN challenges c ON c.id = cp.challenge_id
  WHERE cp.status != 'left'
),
-- Count expected activities per participant (accounting for selected_activity_ids)
expected_counts AS (
  SELECT
    ps.id,
    ps.user_id,
    ps.challenge_id,
    ps.current_day,
    ps.days_so_far,
    ps.total_completions,
    ps.completed_days_count,
    ps.completion_dates,
    ps.duration_days,
    ps.success_threshold,
    ps.longest_streak,
    -- Count expected activities: for each day 1..days_so_far, count activities available that day
    -- Using jsonb_array_elements to iterate predetermined_activities
    (
      SELECT COALESCE(SUM(
        CASE
          WHEN day_num >= COALESCE((act->>'start_day')::int, 1)
           AND day_num <= COALESCE((act->>'end_day')::int, ps.duration_days)
           AND (
             ps.selected_activity_ids IS NULL
             OR jsonb_array_length(ps.selected_activity_ids) = 0
             OR ps.selected_activity_ids ? (act->>'id')
           )
          THEN 1
          ELSE 0
        END
      ), 0)
      FROM generate_series(1, ps.days_so_far) as day_num,
           jsonb_array_elements(COALESCE(ps.predetermined_activities, '[]'::jsonb)) as act
    ) as expected_activities
  FROM participant_stats ps
)
UPDATE challenge_participants cp
SET
  completion_percentage = CASE
    WHEN ec.expected_activities > 0
    THEN LEAST(100, ROUND((ec.total_completions::numeric / ec.expected_activities) * 100))
    ELSE 0
  END,
  completed_days = ec.completed_days_count,
  current_day = ec.current_day,
  days_taken = CASE WHEN ec.current_day > ec.duration_days THEN ec.duration_days ELSE ec.current_day END,
  -- Streak: count consecutive days ending today
  current_streak = CASE
    WHEN ec.completion_dates IS NULL THEN 0
    ELSE (
      SELECT COUNT(*)
      FROM unnest(ec.completion_dates) WITH ORDINALITY AS t(d, i)
      WHERE d = CURRENT_DATE - ((i - 1)::int * INTERVAL '1 day')
    )
  END,
  longest_streak = GREATEST(
    COALESCE(ec.longest_streak, 0),
    CASE
      WHEN ec.completion_dates IS NULL THEN 0
      ELSE (
        SELECT COUNT(*)
        FROM unnest(ec.completion_dates) WITH ORDINALITY AS t(d, i)
        WHERE d = CURRENT_DATE - ((i - 1)::int * INTERVAL '1 day')
      )
    END
  ),
  -- Status: if past duration, check threshold
  status = CASE
    WHEN ec.current_day > ec.duration_days AND
         CASE WHEN ec.expected_activities > 0
              THEN LEAST(100, ROUND((ec.total_completions::numeric / ec.expected_activities) * 100))
              ELSE 0 END >= COALESCE(ec.success_threshold, 70)
    THEN 'completed'
    WHEN ec.current_day > ec.duration_days
    THEN 'failed'
    ELSE cp.status
  END,
  badge_earned = CASE
    WHEN ec.current_day > ec.duration_days AND
         CASE WHEN ec.expected_activities > 0
              THEN LEAST(100, ROUND((ec.total_completions::numeric / ec.expected_activities) * 100))
              ELSE 0 END >= 80
    THEN 'gold'
    WHEN ec.current_day > ec.duration_days AND
         CASE WHEN ec.expected_activities > 0
              THEN LEAST(100, ROUND((ec.total_completions::numeric / ec.expected_activities) * 100))
              ELSE 0 END >= 60
    THEN 'silver'
    WHEN ec.current_day > ec.duration_days AND
         CASE WHEN ec.expected_activities > 0
              THEN LEAST(100, ROUND((ec.total_completions::numeric / ec.expected_activities) * 100))
              ELSE 0 END >= COALESCE(ec.success_threshold, 70)
    THEN 'bronze'
    WHEN ec.current_day > ec.duration_days
    THEN 'failed'
    ELSE cp.badge_earned
  END
FROM expected_counts ec
WHERE cp.id = ec.id;

-- Step 2: Recalculate ranks per challenge based on completion_percentage
WITH ranked AS (
  SELECT
    id,
    challenge_id,
    ROW_NUMBER() OVER (
      PARTITION BY challenge_id
      ORDER BY completion_percentage DESC, days_taken ASC
    ) as new_rank,
    COUNT(*) OVER (PARTITION BY challenge_id) as total_in_challenge
  FROM challenge_participants
  WHERE status != 'left'
)
UPDATE challenge_participants cp
SET
  rank = r.new_rank,
  percentile = ROUND(((r.total_in_challenge - r.new_rank + 1)::numeric / r.total_in_challenge) * 100)
FROM ranked r
WHERE cp.id = r.id;

-- Step 3: Verify results
SELECT
  cp.user_id,
  p.name,
  c.name as challenge_name,
  cp.completion_percentage,
  cp.completed_days,
  cp.current_streak,
  cp.rank,
  cp.status,
  cp.current_day,
  c.duration_days
FROM challenge_participants cp
JOIN challenges c ON c.id = cp.challenge_id
LEFT JOIN profiles p ON p.id = cp.user_id
WHERE cp.status != 'left'
ORDER BY c.name, cp.rank;
