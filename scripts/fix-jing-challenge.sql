-- First, let's see what circles exist
SELECT id, name FROM circles;

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

-- Check if activities exist for this challenge
SELECT COUNT(*) as activity_count 
FROM challenge_activities 
WHERE challenge_id = 'b26052e8-1893-44cf-8507-7fcd52d122d6';

-- If no activities, add them
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
    
    -- Check if table exists and add activities
    IF EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'challenge_activities'
    ) THEN
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
      -- Create the activities table first
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
      
      -- Create policy
      CREATE POLICY "Anyone can view challenge activities" 
        ON challenge_activities FOR SELECT 
        USING (true);
      
      -- Now add activities
      INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
        (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
        (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
        (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
        (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
        (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
        (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
        (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
      
      RAISE NOTICE 'Created table and added 7 activities';
    END IF;
  ELSE
    RAISE NOTICE 'Activities already exist: %', v_activity_count;
  END IF;
END $$;

-- Now check if you're a member of the Retreat circle
SELECT 
  cm.*,
  c.name as circle_name
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE cm.user_id = (
  SELECT id FROM profiles 
  WHERE email = 'mfdermmm@gmail.com'  -- Your email
  LIMIT 1
);

-- If not a member of Retreat circle, join it
INSERT INTO circle_members (circle_id, user_id, role)
SELECT 
  '3ea414a5-7b57-49ab-b6de-ba0590f19bdd',  -- Retreat circle ID
  (SELECT id FROM profiles WHERE email = 'mfdermmm@gmail.com' LIMIT 1),
  'member'
WHERE NOT EXISTS (
  SELECT 1 FROM circle_members 
  WHERE circle_id = '3ea414a5-7b57-49ab-b6de-ba0590f19bdd'
  AND user_id = (SELECT id FROM profiles WHERE email = 'mfdermmm@gmail.com' LIMIT 1)
);

-- Final verification
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.start_date,
  c.end_date,
  c.config,
  ci.name as circle_name,
  (SELECT COUNT(*) FROM challenge_activities WHERE challenge_id = c.id) as activity_count
FROM challenges c
LEFT JOIN circles ci ON c.circle_id = ci.id
WHERE c.name = 'Jing Challenge';