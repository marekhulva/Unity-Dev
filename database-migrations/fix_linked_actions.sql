-- Check if linked_action_ids column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'challenge_participants' 
AND column_name = 'linked_action_ids';

-- Add the column if it doesn't exist
ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS linked_action_ids JSONB DEFAULT '[]'::jsonb;

-- Verify the column was added
SELECT 
    cp.id,
    cp.user_id,
    cp.challenge_id,
    cp.selected_activity_ids,
    cp.linked_action_ids,
    cp.activity_times
FROM challenge_participants cp
LIMIT 1;