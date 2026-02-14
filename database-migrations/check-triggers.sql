-- Check what's failing during user registration
-- Run this in Supabase SQL Editor

-- 1. List all triggers on profiles table
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. Test the notification preferences trigger manually
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
BEGIN
  -- Try creating notification preferences directly
  INSERT INTO notification_preferences (user_id)
  VALUES (test_id);

  RAISE NOTICE 'SUCCESS: Notification preferences created for %', test_id;

  -- Clean up
  DELETE FROM notification_preferences WHERE user_id = test_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ERROR: %', SQLERRM;
  DELETE FROM notification_preferences WHERE user_id = test_id;
END $$;

-- 3. Check if there are any other constraints or triggers that might fail
SELECT
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'notification_preferences'::regclass;
