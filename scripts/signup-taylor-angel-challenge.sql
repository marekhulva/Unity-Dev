-- Manually sign up Taylor and Angel for Mental Detox Challenge
-- Starting today with reasonable reminder times

-- First, let's see Taylor and Angel's user IDs
SELECT
  id,
  email,
  raw_user_meta_data->>'name' as name
FROM auth.users
WHERE email ILIKE '%taylor%' OR email ILIKE '%angel%';

-- Get the Mental Detox challenge info
SELECT
  id,
  name,
  predetermined_activities
FROM challenges
WHERE name ILIKE '%Mental Detox%';

-- Insert Taylor's participation
-- (Replace USER_ID and CHALLENGE_ID with actual values from queries above)
INSERT INTO challenge_participants (
  challenge_id,
  user_id,
  selected_activity_ids,
  activity_times,
  personal_start_date,
  personal_end_date,
  current_day,
  completed_days,
  current_streak,
  longest_streak,
  completion_percentage,
  status,
  created_at,
  updated_at
)
VALUES (
  -- challenge_id (get from query above)
  (SELECT id FROM challenges WHERE name ILIKE '%Mental Detox%' LIMIT 1),

  -- user_id for Taylor (get from query above)
  (SELECT id FROM auth.users WHERE email ILIKE '%taylor%' LIMIT 1),

  -- selected_activity_ids (all activities)
  ARRAY[
    'detox-brain-dump',
    'detox-freewrite',
    'detox-exercise',
    'detox-sleep',
    'detox-no-social',
    'detox-no-content',
    'detox-compliance'
  ],

  -- activity_times with reasonable reminder times
  ARRAY[
    '{"activity_id": "detox-brain-dump", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-freewrite", "scheduled_time": "08:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-exercise", "scheduled_time": "07:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-sleep", "scheduled_time": "22:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-social", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-content", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-compliance", "scheduled_time": "09:00", "is_link": false}'::jsonb
  ],

  -- personal_start_date (today at midnight)
  DATE_TRUNC('day', NOW()),

  -- personal_end_date (7 days from today)
  DATE_TRUNC('day', NOW()) + INTERVAL '7 days',

  -- current_day
  1,

  -- completed_days
  0,

  -- current_streak
  0,

  -- longest_streak
  0,

  -- completion_percentage
  0,

  -- status
  'active',

  -- created_at
  NOW(),

  -- updated_at
  NOW()
);

-- Insert Angel's participation
INSERT INTO challenge_participants (
  challenge_id,
  user_id,
  selected_activity_ids,
  activity_times,
  personal_start_date,
  personal_end_date,
  current_day,
  completed_days,
  current_streak,
  longest_streak,
  completion_percentage,
  status,
  created_at,
  updated_at
)
VALUES (
  -- challenge_id
  (SELECT id FROM challenges WHERE name ILIKE '%Mental Detox%' LIMIT 1),

  -- user_id for Angel
  (SELECT id FROM auth.users WHERE email ILIKE '%angel%' LIMIT 1),

  -- selected_activity_ids (all activities)
  ARRAY[
    'detox-brain-dump',
    'detox-freewrite',
    'detox-exercise',
    'detox-sleep',
    'detox-no-social',
    'detox-no-content',
    'detox-compliance'
  ],

  -- activity_times with reasonable reminder times
  ARRAY[
    '{"activity_id": "detox-brain-dump", "scheduled_time": "10:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-freewrite", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-exercise", "scheduled_time": "06:30", "is_link": false}'::jsonb,
    '{"activity_id": "detox-sleep", "scheduled_time": "21:30", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-social", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-content", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-compliance", "scheduled_time": "09:00", "is_link": false}'::jsonb
  ],

  -- personal_start_date (today at midnight)
  DATE_TRUNC('day', NOW()),

  -- personal_end_date (7 days from today)
  DATE_TRUNC('day', NOW()) + INTERVAL '7 days',

  -- current_day
  1,

  -- completed_days
  0,

  -- current_streak
  0,

  -- longest_streak
  0,

  -- completion_percentage
  0,

  -- status
  'active',

  -- created_at
  NOW(),

  -- updated_at
  NOW()
);

-- Verify they were added
SELECT
  cp.id,
  au.email,
  p.name,
  cp.personal_start_date,
  cp.current_day,
  cp.status
FROM challenge_participants cp
JOIN auth.users au ON au.id = cp.user_id
LEFT JOIN profiles p ON p.id = cp.user_id
WHERE cp.challenge_id = (SELECT id FROM challenges WHERE name ILIKE '%Mental Detox%' LIMIT 1)
  AND (au.email ILIKE '%taylor%' OR au.email ILIKE '%angel%')
ORDER BY au.email;
