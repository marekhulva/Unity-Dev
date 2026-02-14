-- Debug auth issue
-- Run this in Supabase SQL Editor to see what's wrong

-- 1. Check if trigger exists
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'profiles';

-- 2. Check notification_preferences constraints
SELECT
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'notification_preferences';

-- 3. Try to manually create a test user to see the actual error
-- (This will fail but show us the real error)
DO $$
DECLARE
  test_user_id UUID := gen_random_uuid();
BEGIN
  -- First insert into profiles
  INSERT INTO profiles (id, email, username, name)
  VALUES (test_user_id, 'test@test.com', 'testuser', 'Test User');

  RAISE NOTICE 'Profile created successfully';

  -- Clean up
  DELETE FROM profiles WHERE id = test_user_id;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error: %', SQLERRM;
  -- Clean up on error
  DELETE FROM profiles WHERE id = test_user_id;
END $$;
