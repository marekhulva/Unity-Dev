-- Check and fix Following feed issues
-- Run this in Supabase SQL Editor to diagnose Following tab

-- 1. Check if follows table exists and has data
SELECT 
    f.follower_id,
    f.following_id,
    p1.name as follower_name,
    p2.name as following_name,
    f.created_at
FROM follows f
LEFT JOIN profiles p1 ON f.follower_id = p1.id
LEFT JOIN profiles p2 ON f.following_id = p2.id
ORDER BY f.created_at DESC;

-- 2. Check for NULL values that might break queries
SELECT COUNT(*) as null_following_ids
FROM follows 
WHERE following_id IS NULL;

-- 3. Check posts with 'follow' visibility
SELECT 
    p.id,
    p.user_id,
    p.visibility,
    p.content,
    p.created_at,
    pr.name as author_name
FROM posts p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.visibility = 'follow'
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. If you need to create test follows (replace with actual user IDs)
-- Get all user IDs first:
SELECT id, name FROM profiles;

-- Then create some follows (uncomment and modify as needed):
-- INSERT INTO follows (follower_id, following_id) VALUES
-- ('your-user-id', 'other-user-id-1'),
-- ('your-user-id', 'other-user-id-2');

-- 5. Fix: Remove any NULL following_ids
DELETE FROM follows WHERE following_id IS NULL OR follower_id IS NULL;

-- 6. Alternative: Make all users follow each other for testing
-- This will create a fully connected network (use with caution!)
/*
INSERT INTO follows (follower_id, following_id)
SELECT DISTINCT p1.id, p2.id
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.id != p2.id
ON CONFLICT (follower_id, following_id) DO NOTHING;
*/