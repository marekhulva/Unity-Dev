-- First, let's see your user ID
SELECT id, email, name FROM profiles WHERE email LIKE '%12221212%' OR name = '12221212';

-- Insert a test notification (replace YOUR_USER_ID with your actual user ID from above)
-- Run this AFTER you see your user ID above
INSERT INTO notifications (user_id, type, title, body, data, action_url, is_read, created_at)
VALUES (
  (SELECT id FROM profiles WHERE email LIKE '%12221212%' OR name = '12221212' LIMIT 1),
  'circle_challenge_created',
  '🎯 New Circle Challenge!',
  'Your circle has created a new 7-day meditation challenge. Join now to participate!',
  '{"challengeId": "test-123", "circleName": "Morning Warriors"}'::jsonb,
  '/challenges/test-123',
  false,
  NOW()
);

-- Verify it was created
SELECT 
  id,
  type,
  title,
  body,
  is_read,
  created_at
FROM notifications
WHERE user_id = (SELECT id FROM profiles WHERE email LIKE '%12221212%' OR name = '12221212' LIMIT 1)
ORDER BY created_at DESC
LIMIT 5;
