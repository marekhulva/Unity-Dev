-- Create the Jing Challenge with the correct column names for your schema
DO $$
DECLARE
  v_circle_id UUID;
  v_challenge_id UUID;
  v_config JSONB;
BEGIN
  -- Get the circle ID for TEST123
  SELECT id INTO v_circle_id 
  FROM circles 
  WHERE name ILIKE '%TEST123%' 
  LIMIT 1;
  
  IF v_circle_id IS NULL THEN
    RAISE NOTICE 'Circle TEST123 not found! Please create it first.';
    RETURN;
  ELSE
    RAISE NOTICE 'Found TEST123 circle with ID: %', v_circle_id;
  END IF;
  
  -- Check if Jing Challenge already exists
  SELECT id INTO v_challenge_id
  FROM challenges
  WHERE name = 'Jing Challenge'
  AND circle_id = v_circle_id;
  
  IF v_challenge_id IS NOT NULL THEN
    RAISE NOTICE 'Jing Challenge already exists with ID: %', v_challenge_id;
    -- Delete it to recreate fresh
    DELETE FROM challenges WHERE id = v_challenge_id;
    RAISE NOTICE 'Deleted existing challenge to recreate';
  END IF;
  
  -- Build the config JSON with all the challenge settings
  v_config := jsonb_build_object(
    'min_activities', 3,
    'max_activities', 5,
    'required_daily', 3,
    'scoring_type', 'consistency',
    'icon', '⚡',
    'status', 'active',
    'color', '#FFD700'
  );
  
  -- Create the Jing Challenge
  INSERT INTO challenges (
    circle_id,
    name,
    description,
    start_date,
    end_date,
    is_active,
    config,
    created_by
  ) VALUES (
    v_circle_id,
    'Jing Challenge',
    'Build your vital energy through 30 days of consistent wellness practices. Choose 3-5 activities and complete at least 3 daily to strengthen your foundation.',
    CURRENT_DATE - INTERVAL '1 day',  -- Started yesterday (so it's active)
    CURRENT_DATE + INTERVAL '29 days', -- 30 day challenge
    true,  -- is_active = true
    v_config,
    (SELECT id FROM profiles LIMIT 1)  -- Use first profile as creator
  ) RETURNING id INTO v_challenge_id;
  
  RAISE NOTICE 'Created Jing Challenge with ID: %', v_challenge_id;
  
  -- Now add activities - check which table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activities'
  ) THEN
    RAISE NOTICE 'Adding activities to challenge_activities table';
    
    INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
      (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
      (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
      (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
      (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
      (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
      (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
      (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
      
    RAISE NOTICE 'Added 7 activities to challenge';
    
  ELSE
    RAISE NOTICE 'challenge_activities table not found!';
    RAISE NOTICE 'Creating challenge_activities table...';
    
    -- Create the activities table
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
    CREATE POLICY "Anyone can view challenge activities" 
      ON challenge_activities FOR SELECT 
      USING (true);
    
    -- Now insert the activities
    INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
      (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
      (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
      (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
      (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
      (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
      (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
      (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
      
    RAISE NOTICE 'Created activities table and added 7 activities';
  END IF;
  
  RAISE NOTICE '✅ Jing Challenge created successfully!';
  RAISE NOTICE 'Challenge ID: %', v_challenge_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    RAISE;
END $$;

-- Verify the challenge was created
SELECT 
  c.id,
  c.name,
  c.is_active,
  c.circle_id,
  ci.name as circle_name,
  c.start_date,
  c.end_date,
  c.config
FROM challenges c
LEFT JOIN circles ci ON c.circle_id = ci.id
WHERE c.name = 'Jing Challenge';

-- Check if activities were created
SELECT * FROM challenge_activities 
WHERE challenge_id IN (
  SELECT id FROM challenges WHERE name = 'Jing Challenge'
);