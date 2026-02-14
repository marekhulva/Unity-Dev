-- Create the challenge_participants table if it doesn't exist
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

-- Enable RLS for participants
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;

-- Create policies for participants
DROP POLICY IF EXISTS "Anyone can view participants" ON challenge_participants;
CREATE POLICY "Anyone can view participants" 
  ON challenge_participants FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Users can join challenges" ON challenge_participants;
CREATE POLICY "Users can join challenges" 
  ON challenge_participants FOR INSERT 
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their participation" ON challenge_participants;
CREATE POLICY "Users can update their participation" 
  ON challenge_participants FOR UPDATE 
  USING (user_id = auth.uid());

-- Create challenge_completions table if needed
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES challenge_participants(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES challenge_activities(id) ON DELETE CASCADE,
  linked_action_completion_id UUID,
  completed_at TIMESTAMP DEFAULT NOW(),
  completion_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  media_url TEXT,
  UNIQUE(participant_id, activity_id, completion_date)
);

-- Enable RLS for completions
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

-- Create policies for completions
DROP POLICY IF EXISTS "Users can view their completions" ON challenge_completions;
CREATE POLICY "Users can view their completions" 
  ON challenge_completions FOR SELECT 
  USING (
    participant_id IN (
      SELECT id FROM challenge_participants WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create their completions" ON challenge_completions;
CREATE POLICY "Users can create their completions" 
  ON challenge_completions FOR INSERT 
  WITH CHECK (
    participant_id IN (
      SELECT id FROM challenge_participants WHERE user_id = auth.uid()
    )
  );

-- Check that everything is set up
SELECT 
  'challenges' as table_name,
  COUNT(*) as count
FROM challenges
WHERE name = 'Jing Challenge'
UNION ALL
SELECT 
  'challenge_activities',
  COUNT(*)
FROM challenge_activities
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6'
UNION ALL
SELECT 
  'challenge_participants',
  COUNT(*)
FROM challenge_participants
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';