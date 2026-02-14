-- First, find the Jing Challenge in TEST123 circle
SELECT 
  id, 
  name, 
  circle_id,
  config
FROM challenges 
WHERE name = 'Jing Challenge'
AND circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9';

-- Check if activities exist for the Jing Challenge
SELECT * FROM challenge_activities
WHERE challenge_id IN (
  SELECT id FROM challenges 
  WHERE name = 'Jing Challenge'
  AND circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'
);

-- If no activities, add them
DO $$
DECLARE
  v_challenge_id UUID;
BEGIN
  -- Get the Jing Challenge ID in TEST123 circle
  SELECT id INTO v_challenge_id
  FROM challenges 
  WHERE name = 'Jing Challenge'
  AND circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'
  LIMIT 1;
  
  IF v_challenge_id IS NULL THEN
    RAISE NOTICE 'Jing Challenge not found in TEST123 circle!';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found Jing Challenge with ID: %', v_challenge_id;
  
  -- Delete any existing activities to avoid duplicates
  DELETE FROM challenge_activities WHERE challenge_id = v_challenge_id;
  
  -- Add the 7 activities
  INSERT INTO challenge_activities (challenge_id, title, icon, canonical_name, order_index) VALUES
    (v_challenge_id, 'Meditation', '🧘', 'meditation', 1),
    (v_challenge_id, 'Lower Dantian Breathing', '🫁', 'breathing_lower', 2),
    (v_challenge_id, 'Heart Meditation', '❤️', 'meditation_heart', 3),
    (v_challenge_id, 'Cold Showers', '🚿', 'cold_exposure', 4),
    (v_challenge_id, 'Time in Nature', '🌲', 'nature', 5),
    (v_challenge_id, 'Journaling', '📝', 'journaling', 6),
    (v_challenge_id, 'Standing Qi Gong', '🧍', 'qigong', 7);
  
  RAISE NOTICE 'Added 7 activities to Jing Challenge';
END $$;

-- Verify the activities were added
SELECT 
  ca.*
FROM challenge_activities ca
JOIN challenges c ON c.id = ca.challenge_id
WHERE c.name = 'Jing Challenge'
AND c.circle_id = '37467c2e-24dc-4388-88e6-f7d69b166fc9'
ORDER BY ca.order_index;