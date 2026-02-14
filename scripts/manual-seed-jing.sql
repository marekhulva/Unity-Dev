-- Manual SQL to create the Jing Challenge
-- Run this in Supabase SQL Editor to create the challenge

-- First, get your circle ID
-- Replace 'TEST123' with your actual circle name if different
DO $$
DECLARE
  v_circle_id UUID;
  v_challenge_id UUID;
BEGIN
  -- Get the circle ID
  SELECT id INTO v_circle_id 
  FROM circles 
  WHERE name ILIKE '%TEST123%' 
  LIMIT 1;
  
  IF v_circle_id IS NULL THEN
    RAISE NOTICE 'Circle TEST123 not found!';
    RETURN;
  END IF;
  
  -- Check if Jing Challenge already exists
  SELECT id INTO v_challenge_id
  FROM challenges
  WHERE title = 'Jing Challenge'
  AND circle_id = v_circle_id;
  
  IF v_challenge_id IS NOT NULL THEN
    RAISE NOTICE 'Jing Challenge already exists with ID: %', v_challenge_id;
    RETURN;
  END IF;
  
  -- Create the Jing Challenge
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
    NOW() + INTERVAL '1 day',  -- Starts tomorrow
    NOW() + INTERVAL '31 days', -- 30 day challenge
    'upcoming',
    3,
    5,
    3,
    'consistency',
    '⚡'
  ) RETURNING id INTO v_challenge_id;
  
  RAISE NOTICE 'Created Jing Challenge with ID: %', v_challenge_id;
  
  -- Add the activities
  INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
    (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
    (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
    (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
    (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
    (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
    (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
    (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
  
  RAISE NOTICE 'Added 7 activities to the challenge';
  RAISE NOTICE 'Jing Challenge created successfully!';
END $$;