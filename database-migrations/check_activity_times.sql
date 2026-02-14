-- Check what's stored in the challenge_participants table for activity times
SELECT 
    cp.id as participant_id,
    cp.user_id,
    cp.challenge_id,
    c.name as challenge_name,
    cp.selected_activity_ids,
    cp.activity_times,
    cp.joined_at
FROM challenge_participants cp
JOIN challenges c ON c.id = cp.challenge_id
WHERE cp.user_id = '24d77702-4fdf-45ee-b1be-dec94a218bcb'
ORDER BY cp.joined_at DESC;

-- Also check if there are ANY records with activity_times data
SELECT 
    COUNT(*) as total_participants,
    COUNT(CASE WHEN activity_times IS NOT NULL AND activity_times != '[]'::jsonb THEN 1 END) as with_times
FROM challenge_participants;