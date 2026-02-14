-- Check the specific participation that's showing in the logs
SELECT 
    id,
    user_id,
    challenge_id,
    selected_activity_ids,
    activity_times,
    linked_action_ids
FROM challenge_participants
WHERE id = 'b7b0518a-44ce-4ba8-b5c9-6fdfbf9e6e2b';

-- Also check if ANY participant has activity_times saved
SELECT 
    id,
    user_id,
    activity_times,
    jsonb_array_length(activity_times) as num_times
FROM challenge_participants
WHERE activity_times IS NOT NULL 
    AND activity_times != '[]'::jsonb
LIMIT 5;