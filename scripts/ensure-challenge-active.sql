-- Make sure the Jing Challenge is marked as active
UPDATE challenges
SET is_active = true
WHERE name = 'Jing Challenge';

-- Verify the challenge is active
SELECT 
  id,
  name,
  is_active,
  circle_id,
  start_date,
  end_date
FROM challenges
WHERE name = 'Jing Challenge';

-- Check if user eeeee has joined the challenge
SELECT 
  cp.id,
  cp.challenge_id,
  cp.user_id,
  cp.selected_activity_ids,
  p.email,
  c.name as challenge_name,
  c.is_active
FROM challenge_participants cp
JOIN profiles p ON p.id = cp.user_id
JOIN challenges c ON c.id = cp.challenge_id
WHERE p.email = 'eeeee@eeee.com';