-- First, let's see what columns the challenges table actually has
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'challenges'
ORDER BY ordinal_position;

-- Check if we have a 'name' column instead of 'title'
SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'name'
) AS has_name_column,
EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'title'
) AS has_title_column;

-- Let's see what challenges exist (if any)
SELECT * FROM challenges LIMIT 5;

-- Now create the Jing Challenge with the correct column names
DO $$
DECLARE
  v_circle_id UUID;
  v_challenge_id UUID;
  v_name_column TEXT;
BEGIN
  -- Get the circle ID for TEST123
  SELECT id INTO v_circle_id 
  FROM circles 
  WHERE name ILIKE '%TEST123%' 
  LIMIT 1;
  
  IF v_circle_id IS NULL THEN
    RAISE NOTICE 'Circle TEST123 not found!';
    RETURN;
  ELSE
    RAISE NOTICE 'Found TEST123 circle with ID: %', v_circle_id;
  END IF;
  
  -- Check which column name to use (name vs title)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'name'
  ) THEN
    v_name_column := 'name';
    
    -- Check if Jing Challenge already exists using 'name' column
    EXECUTE format('SELECT id FROM challenges WHERE %I = $1 AND circle_id = $2', v_name_column)
    INTO v_challenge_id
    USING 'Jing Challenge', v_circle_id;
    
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'title'
  ) THEN
    v_name_column := 'title';
    
    -- Check if Jing Challenge already exists using 'title' column
    EXECUTE format('SELECT id FROM challenges WHERE %I = $1 AND circle_id = $2', v_name_column)
    INTO v_challenge_id
    USING 'Jing Challenge', v_circle_id;
  ELSE
    RAISE NOTICE 'Neither name nor title column found in challenges table!';
    RETURN;
  END IF;
  
  IF v_challenge_id IS NOT NULL THEN
    RAISE NOTICE 'Jing Challenge already exists with ID: %', v_challenge_id;
    -- Delete it to recreate
    DELETE FROM challenges WHERE id = v_challenge_id;
    RAISE NOTICE 'Deleted existing challenge';
  END IF;
  
  -- Build dynamic INSERT based on existing columns
  RAISE NOTICE 'Creating challenge using column: %', v_name_column;
  
  -- Insert with dynamic column name
  EXECUTE format('
    INSERT INTO challenges (
      circle_id,
      %I,
      description,
      start_date,
      end_date,
      status,
      min_activities,
      max_activities,
      required_daily,
      icon
    ) VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      $8,
      $9,
      $10
    ) RETURNING id
  ', v_name_column)
  INTO v_challenge_id
  USING 
    v_circle_id,
    'Jing Challenge',
    'Build your vital energy through 30 days of consistent wellness practices. Choose 3-5 activities and complete at least 3 daily to strengthen your foundation.',
    NOW() - INTERVAL '1 day',  -- Started yesterday
    NOW() + INTERVAL '29 days', -- 30 day challenge
    'active',
    3,
    5,
    3,
    '⚡';
  
  RAISE NOTICE 'Created Jing Challenge with ID: %', v_challenge_id;
  
  -- Try to add activities (handle both possible table names)
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activities'
  ) THEN
    RAISE NOTICE 'Adding activities to challenge_activities table';
    
    INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) 
    SELECT v_challenge_id, title, icon, canonical_name, order_index
    FROM (VALUES
      ('Meditation', '🧘', 'meditation', 1),
      ('Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
      ('Heart Meditation', '❤️', 'meditation_heart', 3),
      ('Cold Showers', '🚿', 'cold_exposure', 4),
      ('Time in Nature', '🌲', 'nature', 5),
      ('Journaling', '📝', 'journaling', 6),
      ('Standing Qi Gong', '🧍', 'qigong', 7)
    ) AS activities(title, icon, canonical_name, order_index);
    
  ELSIF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'challenge_activity_types'
  ) THEN
    RAISE NOTICE 'Adding activities to challenge_activity_types table';
    
    -- Try with challenge_activity_types
    BEGIN
      INSERT INTO challenge_activity_types (challenge_id, title, icon, canonical_name, order_index) 
      SELECT v_challenge_id, title, icon, canonical_name, order_index
      FROM (VALUES
        ('Meditation', '🧘', 'meditation', 1),
        ('Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
        ('Heart Meditation', '❤️', 'meditation_heart', 3),
        ('Cold Showers', '🚿', 'cold_exposure', 4),
        ('Time in Nature', '🌲', 'nature', 5),
        ('Journaling', '📝', 'journaling', 6),
        ('Standing Qi Gong', '🧍', 'qigong', 7)
      ) AS activities(title, icon, canonical_name, order_index);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not add to challenge_activity_types: %', SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'No activities table found - challenge created without activities';
  END IF;
  
  RAISE NOTICE '✅ Jing Challenge created successfully!';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE NOTICE 'Error detail: %', SQLSTATE;
END $$;

-- Verify what we created
SELECT * FROM challenges 
WHERE circle_id IN (
  SELECT id FROM circles WHERE name ILIKE '%TEST123%'
);