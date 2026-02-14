-- Add missing columns to challenge_participants table
ALTER TABLE challenge_participants 
ADD COLUMN IF NOT EXISTS linked_action_ids UUID[] DEFAULT ARRAY[]::UUID[];

-- Check the table structure
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'challenge_participants'
ORDER BY ordinal_position;

-- Now test that join works by manually creating a participant
INSERT INTO challenge_participants (
  challenge_id,
  user_id,
  selected_activity_ids,
  linked_action_ids
) VALUES (
  'b26052e8-1893-44cf-8507-7fcd52d122d6',  -- Jing Challenge
  '8d91be59-2f5d-4ef1-85ad-0ee4f2d8999a',  -- Your user ID
  ARRAY['e42c4445-5799-434c-b444-d5b985273cdd', '6f437ba8-99b8-49d6-91a1-c423e7b90fa0', 'c4712e5c-c63f-4d93-8d85-f33909c569fd']::UUID[],
  ARRAY[]::UUID[]  -- Empty linked actions for now
)
ON CONFLICT (challenge_id, user_id) 
DO UPDATE SET 
  selected_activity_ids = EXCLUDED.selected_activity_ids,
  joined_at = NOW();

-- Verify you're now joined
SELECT 
  cp.*,
  c.name as challenge_name,
  p.email
FROM challenge_participants cp
JOIN challenges c ON c.id = cp.challenge_id
JOIN profiles p ON p.id = cp.user_id
WHERE cp.user_id = '8d91be59-2f5d-4ef1-85ad-0ee4f2d8999a';