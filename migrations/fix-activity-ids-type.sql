-- Fix selected_activity_ids column type
-- Change from UUID[] to TEXT[] since activity IDs are simple strings like "cold-shower-1"
-- not references to another table

ALTER TABLE challenge_participants
ALTER COLUMN selected_activity_ids TYPE TEXT[] USING selected_activity_ids::TEXT[];

-- Update the comment
COMMENT ON COLUMN challenge_participants.selected_activity_ids IS 'Array of activity IDs from predetermined_activities (strings like "cold-shower-1", not UUIDs)';

-- Test query to verify
SELECT
  id,
  challenge_id,
  selected_activity_ids,
  activity_times
FROM challenge_participants
LIMIT 1;
