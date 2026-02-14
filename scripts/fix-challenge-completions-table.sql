-- Check current structure of challenge_completions table
SELECT 
  column_name, 
  data_type,
  column_default
FROM information_schema.columns
WHERE table_name = 'challenge_completions'
ORDER BY ordinal_position;

-- Drop and recreate the table with correct structure
DROP TABLE IF EXISTS challenge_completions CASCADE;

CREATE TABLE challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES challenge_activities(id) ON DELETE CASCADE,
  completion_date DATE DEFAULT CURRENT_DATE,
  linked_action_completion_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(participant_id, activity_id, completion_date)
);

-- Disable RLS for now
ALTER TABLE challenge_completions DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON challenge_completions TO anon;
GRANT ALL ON challenge_completions TO authenticated;

-- Verify the structure
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'challenge_completions'
ORDER BY ordinal_position;