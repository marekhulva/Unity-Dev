-- Complete Test Data Cleanup Script
-- ⚠️ BE CAREFUL - This will delete data!

-- Option 1: Delete ALL test users (with test in email)
-- This will cascade delete their data from other tables
DELETE FROM auth.users
WHERE email LIKE 'test%@%'
OR email LIKE '%+test%@%';

-- Option 2: Clean specific tables without deleting users
-- Use this if you want to keep user accounts but clear their data

-- Clear all posts from test users
DELETE FROM posts
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE 'test%@%'
);

-- Clear all challenge participations from test users
DELETE FROM challenge_participants
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE 'test%@%'
);

-- Clear all actions from test users
DELETE FROM actions
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE 'test%@%'
);

-- Clear all goals from test users
DELETE FROM goals
WHERE user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE 'test%@%'
);

-- Option 3: Nuclear option - Reset TEST123 circle completely
-- ⚠️ This will remove ALL members from TEST123
DELETE FROM circle_members
WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123');

-- Then add yourself back
INSERT INTO circle_members (circle_id, user_id, role, joined_at)
SELECT 
    (SELECT id FROM circles WHERE code = 'TEST123'),
    (SELECT id FROM profiles WHERE email = 'your-email@example.com'),
    'member',
    NOW()
WHERE EXISTS (SELECT 1 FROM profiles WHERE email = 'your-email@example.com');

-- Option 4: Keep last N users, delete the rest
DELETE FROM circle_members
WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
AND user_id NOT IN (
    SELECT user_id FROM (
        SELECT user_id
        FROM circle_members
        WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
        ORDER BY joined_at DESC
        LIMIT 5  -- Keep only the 5 most recent members
    ) AS recent_members
);

-- Check what's left
SELECT 
    c.code as circle_code,
    COUNT(cm.user_id) as member_count
FROM circles c
LEFT JOIN circle_members cm ON cm.circle_id = c.id
WHERE c.code = 'TEST123'
GROUP BY c.id, c.code;