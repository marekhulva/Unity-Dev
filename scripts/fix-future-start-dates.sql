-- Fix challenge participations with future start dates
-- This updates any active challenges that haven't started yet to start today

-- Show what we're about to fix
SELECT
  id,
  user_id,
  challenge_id,
  personal_start_date,
  current_day,
  status
FROM challenge_participants
WHERE status = 'active'
  AND personal_start_date > NOW()
ORDER BY personal_start_date;

-- Update future start dates to today (local midnight)
UPDATE challenge_participants
SET
  personal_start_date = DATE_TRUNC('day', NOW()),
  current_day = 1,
  updated_at = NOW()
WHERE status = 'active'
  AND personal_start_date > NOW();

-- Verify the fix
SELECT
  id,
  user_id,
  challenge_id,
  personal_start_date,
  current_day,
  status
FROM challenge_participants
WHERE status = 'active'
ORDER BY personal_start_date;
