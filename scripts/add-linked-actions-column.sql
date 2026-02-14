-- Add linked_action_ids column to challenge_participants table
-- This stores the mapping between challenge activities and existing daily actions

ALTER TABLE challenge_participants
ADD COLUMN IF NOT EXISTS linked_action_ids JSONB DEFAULT '[]'::jsonb;

-- The column will store an array of objects like:
-- [
--   { "activity_id": "uuid-1", "action_id": "uuid-2" },
--   { "activity_id": "uuid-3", "action_id": "uuid-4" }
-- ]

COMMENT ON COLUMN challenge_participants.linked_action_ids IS 'Maps challenge activities to existing daily actions for deduplication';