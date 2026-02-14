-- First, let's check what tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%challenge%'
ORDER BY table_name;

-- Now let's create the Jing Challenge with proper error handling
DO $$
DECLARE
  v_circle_id UUID;
  v_challenge_id UUID;
  v_activities_table TEXT;
BEGIN
  -- Get the circle ID for TEST123
  SELECT id INTO v_circle_id 
  FROM circles 
  WHERE name ILIKE '%TEST123%' 
  LIMIT 1;
  
  IF v_circle_id IS NULL THEN
    RAISE NOTICE 'Circle TEST123 not found! Creating it...';
    -- You might need to adjust this based on your circles table structure
    INSERT INTO circles (name, description, created_by)
    VALUES ('TEST123', 'Test Circle', (SELECT id FROM profiles LIMIT 1))
    RETURNING id INTO v_circle_id;
    RAISE NOTICE 'Created TEST123 circle with ID: %', v_circle_id;
  ELSE
    RAISE NOTICE 'Found TEST123 circle with ID: %', v_circle_id;
  END IF;
  
  -- Check if Jing Challenge already exists
  SELECT id INTO v_challenge_id
  FROM challenges
  WHERE title = 'Jing Challenge'
  AND circle_id = v_circle_id;
  
  IF v_challenge_id IS NOT NULL THEN
    RAISE NOTICE 'Jing Challenge already exists with ID: %', v_challenge_id;
    -- Delete it to recreate fresh
    DELETE FROM challenges WHERE id = v_challenge_id;
    RAISE NOTICE 'Deleted existing challenge to recreate';
  END IF;
  
  -- Create the Jing Challenge (set as active for immediate testing)
  INSERT INTO challenges (
    circle_id,
    title,
    description,
    start_date,
    end_date,
    status,
    min_activities,
    max_activities,
    required_daily,
    scoring_type,
    icon
  ) VALUES (
    v_circle_id,
    'Jing Challenge',
    'Build your vital energy through 30 days of consistent wellness practices. Choose 3-5 activities and complete at least 3 daily to strengthen your foundation.',
    NOW() - INTERVAL '1 day',  -- Started yesterday (so it's active now)
    NOW() + INTERVAL '29 days', -- 30 day challenge
    'active',  -- Set as active
    3,
    5,
    3,
    'consistency',
    '⚡'
  ) RETURNING id INTO v_challenge_id;
  
  RAISE NOTICE 'Created Jing Challenge with ID: %', v_challenge_id;
  
  -- Check which activities table exists
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activities'
  ) THEN
    v_activities_table := 'challenge_activities';
    RAISE NOTICE 'Using table: challenge_activities';
    
    -- Add activities to challenge_activities
    INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
      (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
      (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
      (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
      (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
      (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
      (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
      (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
      
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activity_types'
  ) THEN
    v_activities_table := 'challenge_activity_types';
    RAISE NOTICE 'Using table: challenge_activity_types';
    
    -- Add activities to challenge_activity_types (might have different columns)
    EXECUTE format('
      INSERT INTO %I (challenge_id, title, icon, canonical_name, order_index) VALUES
        ($1, ''Meditation'', ''🧘'', ''meditation'', 1),
        ($1, ''Lower Dantian Breathing'', ''🫁'', ''breathing_lower'', 2),
        ($1, ''Heart Meditation'', ''❤️'', ''meditation_heart'', 3),
        ($1, ''Cold Showers'', ''🚿'', ''cold_exposure'', 4),
        ($1, ''Time in Nature'', ''🌲'', ''nature'', 5),
        ($1, ''Journaling'', ''📝'', ''journaling'', 6),
        ($1, ''Standing Qi Gong'', ''🧍'', ''qigong'', 7)
    ', v_activities_table) USING v_challenge_id;
  ELSE
    RAISE NOTICE 'No activities table found! Creating challenge_activities...';
    
    -- Create the table if it doesn't exist
    CREATE TABLE IF NOT EXISTS challenge_activities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      icon VARCHAR(50),
      canonical_name VARCHAR(255),
      order_index INTEGER DEFAULT 0
    );
    
    -- Enable RLS
    ALTER TABLE challenge_activities ENABLE ROW LEVEL SECURITY;
    
    -- Create policy
    CREATE POLICY "Anyone can view activities" ON challenge_activities 
      FOR SELECT USING (true);
    
    -- Now add the activities
    INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
      (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
      (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
      (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
      (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
      (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
      (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
      (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
  END IF;
  
  RAISE NOTICE 'Added 7 activities to the challenge';
  RAISE NOTICE '✅ Jing Challenge created successfully!';
  RAISE NOTICE 'Challenge ID: %', v_challenge_id;
  RAISE NOTICE 'Circle ID: %', v_circle_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error occurred: %', SQLERRM;
    RAISE;
END $$;

-- Verify the challenge was created
SELECT 
  c.id,
  c.title,
  c.status,
  c.circle_id,
  ci.name as circle_name,
  c.start_date,
  c.end_date
FROM challenges c
LEFT JOIN circles ci ON c.circle_id = ci.id
WHERE c.title = 'Jing Challenge';