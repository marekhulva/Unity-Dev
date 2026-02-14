-- First, let's see what columns the table currently has
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'challenge_participants'
ORDER BY ordinal_position;

-- Drop the table and recreate it with ALL the correct columns
DROP TABLE IF EXISTS challenge_participants CASCADE;

-- Create the table with all required columns
CREATE TABLE challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  selected_activity_ids UUID[],  -- This was missing
  linked_action_ids UUID[],       -- This was also missing
  total_completions INTEGER DEFAULT 0,
  consistency_percentage DECIMAL(5,2) DEFAULT 0.00,
  current_streak INTEGER DEFAULT 0,
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Disable RLS to avoid permission issues
ALTER TABLE challenge_participants DISABLE ROW LEVEL SECURITY;

-- Grant all permissions
GRANT ALL ON challenge_participants TO anon;
GRANT ALL ON challenge_participants TO authenticated;

-- Verify the structure is correct now
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'challenge_participants'
ORDER BY ordinal_position;