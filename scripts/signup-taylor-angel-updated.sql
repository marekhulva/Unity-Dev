-- Sign up Taylor and Angel for Mental Detox Challenge
-- Brain Dump & Freewriting: 5:00 PM for both
-- Exercise: Angel 6:00 AM, Taylor 10:00 AM
-- Sleep reminder: 10:00 PM for both

-- Sign up Taylor
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
  (SELECT id FROM challenges WHERE name ILIKE '%Mental Detox%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email ILIKE '%taylor%' LIMIT 1),
  ARRAY['detox-brain-dump', 'detox-freewrite', 'detox-exercise', 'detox-sleep', 'detox-no-social', 'detox-no-content', 'detox-compliance'],
  ARRAY[
    '{"activity_id": "detox-brain-dump", "scheduled_time": "17:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-freewrite", "scheduled_time": "17:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-exercise", "scheduled_time": "10:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-sleep", "scheduled_time": "22:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-social", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-content", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-compliance", "scheduled_time": "09:00", "is_link": false}'::jsonb
  ],
  DATE_TRUNC('day', NOW()),
  DATE_TRUNC('day', NOW()) + INTERVAL '7 days',
  1,
  0,
  0,
  0,
  0,
  'active',
  NOW(),
  NOW()
);

-- Sign up Angel
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
  (SELECT id FROM challenges WHERE name ILIKE '%Mental Detox%' LIMIT 1),
  (SELECT id FROM auth.users WHERE email ILIKE '%angel%' LIMIT 1),
  ARRAY['detox-brain-dump', 'detox-freewrite', 'detox-exercise', 'detox-sleep', 'detox-no-social', 'detox-no-content', 'detox-compliance'],
  ARRAY[
    '{"activity_id": "detox-brain-dump", "scheduled_time": "17:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-freewrite", "scheduled_time": "17:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-exercise", "scheduled_time": "06:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-sleep", "scheduled_time": "22:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-social", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-no-content", "scheduled_time": "09:00", "is_link": false}'::jsonb,
    '{"activity_id": "detox-compliance", "scheduled_time": "09:00", "is_link": false}'::jsonb
  ],
  DATE_TRUNC('day', NOW()),
  DATE_TRUNC('day', NOW()) + INTERVAL '7 days',
  1,
  0,
  0,
  0,
  0,
  'active',
  NOW(),
  NOW()
);

-- Verify they were added
SELECT
  au.email,
  p.name,
  cp.personal_start_date,
  cp.current_day,
  cp.status,
  cp.activity_times
FROM challenge_participants cp
JOIN auth.users au ON au.id = cp.user_id
LEFT JOIN profiles p ON p.id = cp.user_id
WHERE cp.challenge_id = (SELECT id FROM challenges WHERE name ILIKE '%Mental Detox%' LIMIT 1)
  AND (au.email ILIKE '%taylor%' OR au.email ILIKE '%angel%')
ORDER BY au.email;
