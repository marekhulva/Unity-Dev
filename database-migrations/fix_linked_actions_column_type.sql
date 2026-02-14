-- Check current column type
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'challenge_participants' 
AND column_name = 'linked_action_ids';

-- If it exists with wrong type, drop and recreate
ALTER TABLE challenge_participants 
DROP COLUMN IF EXISTS linked_action_ids;

-- Add with correct JSONB type
ALTER TABLE challenge_participants
ADD COLUMN linked_action_ids JSONB DEFAULT '[]'::jsonb;

-- Verify it's correct now
SELECT column_name, data_type, udt_name
FROM information_schema.columns 
WHERE table_name = 'challenge_participants' 
AND column_name = 'linked_action_ids';

-- Test with sample data to ensure it works
UPDATE challenge_participants 
SET linked_action_ids = '[{"activity_id": "test", "action_id": "test"}]'::jsonb
WHERE id = (SELECT id FROM challenge_participants LIMIT 1);

-- Check it saved correctly
SELECT id, linked_action_ids 
FROM challenge_participants 
WHERE linked_action_ids != '[]'::jsonb
LIMIT 1;