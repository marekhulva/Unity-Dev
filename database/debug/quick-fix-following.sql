-- Quick fix to populate Following tab
-- This creates follow relationships for testing

-- 1. First, check current user ID
SELECT id, email, name FROM profiles WHERE email = 'your-email@example.com';

-- 2. Make your user follow everyone in your circle
-- Replace 'YOUR-USER-ID' with your actual user ID from step 1
INSERT INTO follows (follower_id, following_id)
SELECT 
    'YOUR-USER-ID' as follower_id,
    cm.user_id as following_id
FROM circle_members cm
WHERE cm.circle_id = (
    SELECT circle_id 
    FROM profiles 
    WHERE id = 'YOUR-USER-ID'
)
AND cm.user_id != 'YOUR-USER-ID'
AND cm.user_id IS NOT NULL
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- 3. Verify it worked
SELECT COUNT(*) as following_count
FROM follows
WHERE follower_id = 'YOUR-USER-ID';

-- 4. Alternative: Make everyone follow everyone (for testing only!)
-- This ensures the Following tab has content
INSERT INTO follows (follower_id, following_id)
SELECT DISTINCT 
    p1.id as follower_id,
    p2.id as following_id
FROM profiles p1
CROSS JOIN profiles p2
WHERE p1.id != p2.id
  AND p1.circle_id IS NOT NULL
  AND p2.circle_id IS NOT NULL
ON CONFLICT (follower_id, following_id) DO NOTHING;