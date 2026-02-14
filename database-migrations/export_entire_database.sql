-- EXPORT ENTIRE DATABASE
-- Run each query in Supabase SQL Editor and save the results

-- 1. Export ALL profiles/users
SELECT * FROM profiles;

-- 2. Export ALL circles
SELECT * FROM circles;

-- 3. Export ALL circle members
SELECT * FROM circle_members;

-- 4. Export ALL challenges
SELECT * FROM challenges;

-- 5. Export ALL challenge participants
SELECT * FROM challenge_participants;

-- 6. Export ALL challenge activities
SELECT * FROM challenge_activities;

-- 7. Export ALL actions (habits)
SELECT * FROM actions;

-- 8. Export ALL goals
SELECT * FROM goals;

-- 9. Export ALL posts
SELECT * FROM posts;

-- 10. Export ALL completed actions
SELECT * FROM completed_actions;

-- 11. Export ALL follows (if exists)
SELECT * FROM follows;

-- 12. Export ALL post likes (if exists)
SELECT * FROM post_likes;

-- 13. Export ALL comments (if exists)
SELECT * FROM comments;

-- 14. Export ALL notifications (if exists)
SELECT * FROM notifications;

-- 15. Count total records
SELECT 
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM circles) as total_circles,
  (SELECT COUNT(*) FROM challenges) as total_challenges,
  (SELECT COUNT(*) FROM posts) as total_posts,
  (SELECT COUNT(*) FROM actions) as total_actions,
  (SELECT COUNT(*) FROM goals) as total_goals;