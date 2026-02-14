-- Add challenge_activity_id column to challenge_completions table
-- This stores the string ID of the challenge activity (e.g., "cold-shower-1")
-- separate from action_id which references the actions table for linked activities

ALTER TABLE challenge_completions
ADD COLUMN IF NOT EXISTS challenge_activity_id TEXT;

-- Add participant_id column to reference the challenge_participants table
-- This makes it easier to track which participant completed the activity
ALTER TABLE challenge_completions
ADD COLUMN IF NOT EXISTS participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_challenge_completions_participant_activity
ON challenge_completions(participant_id, challenge_activity_id, completion_date);

-- Comment for documentation
COMMENT ON COLUMN challenge_completions.challenge_activity_id IS 'String ID of the challenge activity from predetermined_activities (e.g., "cold-shower-1")';
COMMENT ON COLUMN challenge_completions.participant_id IS 'Reference to the challenge_participants table';

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'challenge_completions'
ORDER BY ordinal_position;
