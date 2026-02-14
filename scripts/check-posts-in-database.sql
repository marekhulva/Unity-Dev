-- Check if posts are being saved to database
-- Run this after completing actions and posting them

-- 1. Check the most recent posts
SELECT 
  p.id,
  p.type,
  p.visibility,
  p.content,
  p.action_title,
  p.goal_title,
  p.circle_id,
  p.user_id,
  p.created_at,
  prof.email,
  prof.name
FROM posts p
JOIN profiles prof ON prof.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- 2. Check posts from specific user
SELECT 
  p.id,
  p.type,
  p.visibility,
  p.content,
  p.action_title,
  p.created_at
FROM posts p
JOIN profiles prof ON prof.id = p.user_id
WHERE prof.email = 'eeeee@eeee.com'
ORDER BY p.created_at DESC;

-- 3. Check posts with action_title (challenge completions)
SELECT 
  p.id,
  p.content,
  p.action_title,
  p.created_at,
  prof.email
FROM posts p
JOIN profiles prof ON prof.id = p.user_id
WHERE p.action_title IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;

-- 4. Check posts in circles
SELECT 
  p.id,
  p.content,
  p.action_title,
  p.circle_id,
  c.name as circle_name,
  p.created_at
FROM posts p
LEFT JOIN circles c ON c.id = p.circle_id
WHERE p.circle_id IS NOT NULL
ORDER BY p.created_at DESC
LIMIT 10;