-- Create challenge_participants table if missing
CREATE TABLE IF NOT EXISTS challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  selected_activity_ids UUID[],
  linked_action_ids UUID[],
  total_completions INTEGER DEFAULT 0,
  consistency_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Disable RLS for now to avoid permission issues
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON challenge_participants TO anon;
GRANT ALL ON challenge_participants TO authenticated;

-- Test insert (replace with your actual user ID)
-- This will verify the table works
DO $$
DECLARE
  v_user_id UUID;
  v_challenge_id UUID;
BEGIN
  -- Get your user ID
  SELECT id INTO v_user_id 
  FROM profiles 
  WHERE email = 'mfdermmm@gmail.com'
  LIMIT 1;
  
  -- Get the Jing Challenge ID
  SELECT id INTO v_challenge_id
  FROM challenges 
  WHERE name = 'Jing Challenge'
  AND circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'
  LIMIT 1;
  
  IF v_user_id IS NOT NULL AND v_challenge_id IS NOT NULL THEN
    -- Try to insert (will fail if already joined, that's ok)
    BEGIN
      INSERT INTO challenge_participants (
        challenge_id,
        user_id,
        selected_activity_ids
      ) VALUES (
        v_challenge_id,
        v_user_id,
        ARRAY[]::UUID[]  -- Empty array for now
      );
      RAISE NOTICE 'Test participant created successfully';
    EXCEPTION 
      WHEN unique_violation THEN
        RAISE NOTICE 'User already joined this challenge';
    END;
  ELSE
    RAISE NOTICE 'Could not find user or challenge';
  END IF;
END $$;

-- Check if participants exist
SELECT 
  cp.*,
  p.email,
  c.name as challenge_name
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
JOIN challenges c ON c.id = cp.challenge_id
WHERE c.name = 'Jing Challenge';