-- Debug: Check what's stored for linked activities
-- Run this in Supabase SQL editor to see what's actually in the database

-- 1. Find the user's participation
SELECT 
  cp.id as participant_id,
  cp.user_id,
  cp.challenge_id,
  cp.selected_activity_ids,
  cp.linked_action_ids,
  cp.activity_times,
  c.name as challenge_name
FROM challenge_participants cp
JOIN challenges c ON c.id = cp.challenge_id
WHERE cp.user_id = '063d8479-2b06-41e0-8245-89a0e50fd412';

-- 2. Look at the activity_times structure for this user
SELECT 
  id,
  user_id,
  activity_times::text as activity_times_raw
FROM challenge_participants
WHERE user_id = '063d8479-2b06-41e0-8245-89a0e50fd412';

-- 3. Check if there are any is_link entries
SELECT 
  id,
  jsonb_array_elements(activity_times) as time_entry
FROM challenge_participants
WHERE user_id = '063d8479-2b06-41e0-8245-89a0e50fd412'
  AND activity_times IS NOT NULL;