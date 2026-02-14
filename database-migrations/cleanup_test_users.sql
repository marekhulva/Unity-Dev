-- Cleanup Test Users from TEST123 Circle
-- Run these queries in Supabase SQL Editor

-- 1. First, let's see all users in TEST123 circle
SELECT 
    cm.user_id,
    p.email,
    p.name,
    cm.joined_at
FROM circle_members cm
JOIN profiles p ON p.id = cm.user_id
JOIN circles c ON c.id = cm.circle_id
WHERE c.code = 'TEST123'
ORDER BY cm.joined_at DESC;

-- 2. Count how many users are in TEST123
SELECT COUNT(*) as total_members
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
WHERE c.code = 'TEST123';

-- 3. Remove test users from TEST123 circle (adjust pattern as needed)
-- This removes users with email pattern like 'test%@example.com'
DELETE FROM circle_members
WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
AND user_id IN (
    SELECT id FROM profiles 
    WHERE email LIKE 'test%@example.com'
    OR email LIKE 'test+%@example.com'
);

-- 4. Alternative: Remove ALL users from TEST123 except specific ones
-- Replace 'keeper@example.com' with emails you want to keep
DELETE FROM circle_members
WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
AND user_id NOT IN (
    SELECT id FROM profiles 
    WHERE email IN ('your-real-email@example.com', 'keeper@example.com')
);

-- 5. Or remove users who joined after a certain date (for recent test users)
DELETE FROM circle_members
WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
AND joined_at > '2025-08-28'::timestamp;

-- 6. Clean up challenge participants for deleted users
DELETE FROM challenge_participants
WHERE user_id NOT IN (
    SELECT user_id FROM circle_members
    WHERE circle_id = (SELECT id FROM circles WHERE code = 'TEST123')
);

-- 7. Verify remaining members
SELECT 
    cm.user_id,
    p.email,
    p.name,
    cm.joined_at
FROM circle_members cm
JOIN profiles p ON p.id = cm.user_id
JOIN circles c ON c.id = cm.circle_id
WHERE c.code = 'TEST123'
ORDER BY cm.joined_at;