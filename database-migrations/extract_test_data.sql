-- Run this in Supabase SQL Editor to see all TEST123 data before deletion
-- Copy the results to save as backup

-- 1. Get the TEST123 circle
SELECT * FROM circles WHERE invite_code = 'TEST123';

-- 2. Get all members of TEST123
SELECT p.* 
FROM profiles p
JOIN circle_members cm ON cm.user_id = p.id
JOIN circles c ON c.id = cm.circle_id
WHERE c.invite_code = 'TEST123';

-- 3. Get all challenges in TEST123
SELECT ch.*
FROM challenges ch
JOIN circles c ON c.id = ch.circle_id
WHERE c.invite_code = 'TEST123';

-- 4. Get all posts from TEST123 members
SELECT posts.*
FROM posts
JOIN profiles p ON p.id = posts.user_id
JOIN circle_members cm ON cm.user_id = p.id
JOIN circles c ON c.id = cm.circle_id
WHERE c.invite_code = 'TEST123';

-- 5. Count how many users will be affected
SELECT COUNT(DISTINCT p.id) as user_count
FROM profiles p
JOIN circle_members cm ON cm.user_id = p.id
JOIN circles c ON c.id = cm.circle_id
WHERE c.invite_code = 'TEST123';