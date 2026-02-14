-- 1. Check ALL participants and their activity_times
SELECT 
    id,
    user_id,
    challenge_id,
    activity_times,
    jsonb_array_length(COALESCE(activity_times, '[]'::jsonb)) as num_times,
    created_at,
    updated_at
FROM challenge_participants
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check the most recent participant (likely yours from testing)
SELECT 
    id,
    user_id,
    challenge_id,
    selected_activity_ids,
    activity_times,
    linked_action_ids,
    created_at,
    updated_at
FROM challenge_participants
ORDER BY created_at DESC
LIMIT 1;

-- 3. Check if ANY participant has activity_times saved
SELECT 
    COUNT(*) as total_participants,
    COUNT(CASE WHEN activity_times IS NOT NULL AND activity_times != '[]'::jsonb THEN 1 END) as with_times,
    COUNT(CASE WHEN activity_times IS NULL OR activity_times = '[]'::jsonb THEN 1 END) as without_times
FROM challenge_participants;

-- 4. Show actual content of activity_times for any participant that has them
SELECT 
    id,
    user_id,
    jsonb_pretty(activity_times) as formatted_times
FROM challenge_participants
WHERE activity_times IS NOT NULL 
    AND activity_times != '[]'::jsonb
LIMIT 5;

-- 5. Check the structure of activity_times column
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'challenge_participants'
    AND column_name = 'activity_times';