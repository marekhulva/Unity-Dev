-- Check posts table
SELECT id, user_id, type, visibility, content, created_at 
FROM posts 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if profiles exist for post users
SELECT DISTINCT p.user_id, prof.id as profile_id, prof.name
FROM posts p
LEFT JOIN profiles prof ON p.user_id = prof.id
ORDER BY p.created_at DESC
LIMIT 10;

-- Test the exact query the app uses
SELECT 
  p.*,
  prof.name as profile_name,
  prof.avatar_url as profile_avatar
FROM posts p
LEFT JOIN profiles prof ON p.user_id = prof.id
WHERE p.visibility = 'circle'
ORDER BY p.created_at DESC
LIMIT 10;