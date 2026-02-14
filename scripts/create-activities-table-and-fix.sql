-- First, create the challenge_activities table
CREATE TABLE IF NOT EXISTS challenge_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  canonical_name VARCHAR(255),
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE challenge_activities ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing
DROP POLICY IF EXISTS "Anyone can view challenge activities" ON challenge_activities;
CREATE POLICY "Anyone can view challenge activities" 
  ON challenge_activities FOR SELECT 
  USING (true);

-- Now update the Jing Challenge with proper settings
UPDATE challenges
SET 
  end_date = CURRENT_DATE + INTERVAL '29 days',  -- Set 30-day duration
  config = jsonb_build_object(
    'min_activities', 3,
    'max_activities', 5,
    'required_daily', 3,
    'scoring_type', 'consistency',
    'icon', '⚡',
    'status', 'active',
    'color', '#FFD700'
  )
WHERE id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';

-- Add the activities for the Jing Challenge
INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Meditation', '🧘', 'meditation', 1),
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Heart Meditation', '❤️', 'meditation_heart', 3),
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Cold Showers', '🚿', 'cold_exposure', 4),
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Time in Nature', '🌲', 'nature', 5),
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Journaling', '📝', 'journaling', 6),
  ('b26052e8-1893-44cf-8507-7fcd52d122d6', 'Standing Qi Gong', '🧍', 'qigong', 7);

-- Verify everything worked
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.start_date,
  c.end_date,
  c.config
FROM challenges c
WHERE c.id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';

-- Show the activities
SELECT * FROM challenge_activities 
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6'
ORDER BY order_index;

-- Also create the challenge_participants table if it doesn't exist
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

-- Create policy for completions
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