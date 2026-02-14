-- Show what each user sees in their Daily tab TODAY
-- This shows which challenge activities appear for each user

WITH user_challenges AS (
  SELECT
    cp.id as participation_id,
    cp.user_id,
    COALESCE(p.name, p.username, au.email) as user_name,
    au.email,
    c.id as challenge_id,
    c.name as challenge_name,
    c.duration_days,
    c.predetermined_activities,
    cp.personal_start_date,
    cp.current_day as stored_day,
    -- Calculate actual current day
    FLOOR(EXTRACT(EPOCH FROM (DATE_TRUNC('day', NOW()) - DATE_TRUNC('day', cp.personal_start_date))) / 86400) + 1 as calculated_day,
    cp.selected_activity_ids,
    cp.activity_times,
    cp.status
  FROM challenge_participants cp
  JOIN challenges c ON c.id = cp.challenge_id
  LEFT JOIN profiles p ON p.id = cp.user_id
  JOIN auth.users au ON au.id = cp.user_id
  WHERE cp.status = 'active'
)
SELECT
  uc.user_name,
  uc.email,
  uc.challenge_name,
  uc.calculated_day as current_day,
  uc.status,
  -- Extract activities that should show today
  (
    SELECT json_agg(
      json_build_object(
        'activity_id', activity->>'id',
        'title', activity->>'title',
        'emoji', activity->>'emoji',
        'is_abstinence', COALESCE((activity->>'is_abstinence')::boolean, false),
        'scheduled_time', (
          SELECT at->>'scheduled_time'
          FROM jsonb_array_elements(uc.activity_times) at
          WHERE at->>'activity_id' = activity->>'id'
        ),
        'day_range', CONCAT(
          COALESCE((activity->>'start_day')::text, '1'),
          '-',
          COALESCE((activity->>'end_day')::text, uc.duration_days::text)
        )
      )
    )
    FROM jsonb_array_elements(uc.predetermined_activities) activity
    WHERE
      -- Check if activity is selected (or all are selected if array is empty)
      (
        array_length(uc.selected_activity_ids, 1) IS NULL OR
        activity->>'id' = ANY(uc.selected_activity_ids)
      )
      -- Check if activity should show on current day
      AND uc.calculated_day >= COALESCE((activity->>'start_day')::int, 1)
      AND uc.calculated_day <= COALESCE((activity->>'end_day')::int, uc.duration_days)
  ) as activities_today
FROM user_challenges uc
ORDER BY uc.user_name;
