-- Update the existing Jing Challenge with proper settings
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

-- Add activities if they don't exist
DO $$
DECLARE
  v_challenge_id UUID := 'b26052e8-1893-44cf-8507-7fcd52d122d6';
  v_activity_count INTEGER;
BEGIN
  -- Check if activities already exist
  SELECT COUNT(*) INTO v_activity_count
  FROM challenge_activities 
  WHERE challenge_id = v_challenge_id;
  
  IF v_activity_count = 0 THEN
    RAISE NOTICE 'Adding activities to challenge...';
    
    -- Create the activities table if needed
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
    
    -- Create policy (drop first if exists to avoid error)
    DROP POLICY IF EXISTS "Anyone can view challenge activities" ON challenge_activities;
    CREATE POLICY "Anyone can view challenge activities" 
      ON challenge_activities FOR SELECT 
      USING (true);
    
    -- Add activities
    INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
      (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
      (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
      (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
      (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
      (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
      (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
      (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
    
    RAISE NOTICE 'Added 7 activities';
  ELSE
    RAISE NOTICE 'Activities already exist: %', v_activity_count;
  END IF;
END $$;

-- Verify the fix
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.start_date,
  c.end_date,
  c.config,
  (SELECT COUNT(*) FROM challenge_activities WHERE challenge_id = c.id) as activity_count
FROM challenges c
WHERE c.id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';

-- Show the activities
SELECT * FROM challenge_activities 
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6'
ORDER BY order_index;