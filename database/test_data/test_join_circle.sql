-- Test if the circle exists and the function works
SELECT * FROM circles WHERE invite_code = 'TEST123';

-- Test the join function directly (replace with your user ID)
-- You can get your user ID from: SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- If you want to test with the first user:
SELECT join_circle_with_code('TEST123');