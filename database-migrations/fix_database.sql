-- STEP 1: DIAGNOSE THE ISSUE
-- Run this in Supabase SQL editor as admin

-- Check current user's auth ID
SELECT auth.uid() as your_auth_id;

-- Check if your user exists in profiles
SELECT * FROM profiles WHERE email = 'aneel@gmail.com';

-- Check circle memberships
SELECT 
    cm.*,
    c.name as circle_name,
    p.email as member_email
FROM circle_members cm
JOIN circles c ON c.id = cm.circle_id
JOIN profiles p ON p.id = cm.user_id
WHERE c.name = 'TEST123';

-- Check if posts exist
SELECT 
    p.id,
    p.content,
    p.visibility,
    p.user_id,
    prof.email as author_email
FROM posts p
LEFT JOIN profiles prof ON prof.id = p.user_id
WHERE p.visibility = 'circle'
LIMIT 10;

-- Test RLS policy directly
SELECT 
    p.*,
    CASE 
        WHEN p.user_id = auth.uid() THEN 'Own post'
        WHEN p.visibility = 'public' THEN 'Public post'
        WHEN p.visibility = 'circle' AND EXISTS (
            SELECT 1 FROM circle_members cm1
            JOIN circle_members cm2 ON cm1.circle_id = cm2.circle_id
            WHERE cm1.user_id = p.user_id 
            AND cm2.user_id = auth.uid()
        ) THEN 'Circle post - SHOULD BE VISIBLE'
        ELSE 'BLOCKED BY RLS'
    END as visibility_reason
FROM posts p
LIMIT 20;

-- STEP 2: TEMPORARY FIX - MAKE POSTS VISIBLE
-- This will immediately fix the issue

-- First, check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'posts';

-- Temporarily drop the restrictive policy and add a simpler one
DROP POLICY IF EXISTS "Posts are viewable based on visibility" ON posts;

-- Create a more permissive temporary policy
CREATE POLICY "Posts viewable by authenticated users temp" ON posts
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL AND (
            -- Own posts always visible
            user_id = auth.uid()
            OR
            -- Public posts visible to all
            visibility = 'public'
            OR
            -- For now, make ALL circle posts visible to authenticated users
            -- We'll fix the circle membership later
            (visibility = 'circle' AND auth.uid() IS NOT NULL)
        )
    );

-- STEP 3: FIX CIRCLE MEMBERSHIPS
-- Ensure the current user is properly in TEST123

-- Get the TEST123 circle ID
SELECT id, name, invite_code FROM circles WHERE name = 'TEST123';

-- Fix membership for specific user (replace with actual user_id from step 1)
-- First delete any duplicate memberships
DELETE FROM circle_members 
WHERE circle_id = (SELECT id FROM circles WHERE name = 'TEST123')
AND user_id = auth.uid();

-- Then add proper membership
INSERT INTO circle_members (circle_id, user_id, joined_at)
SELECT 
    (SELECT id FROM circles WHERE name = 'TEST123'),
    auth.uid(),
    NOW()
ON CONFLICT DO NOTHING;

-- STEP 4: VERIFY THE FIX
-- After running above, test if posts are visible

SELECT COUNT(*) as visible_posts_count
FROM posts 
WHERE visibility = 'circle';

-- Should now return posts!

-- STEP 5: PERMANENT FIX - BETTER RLS POLICY
-- Once we verify posts are showing, implement a more robust policy

DROP POLICY IF EXISTS "Posts viewable by authenticated users temp" ON posts;

CREATE POLICY "Posts viewable with fixed visibility" ON posts
    FOR SELECT
    USING (
        -- Always see your own posts
        user_id = auth.uid()
        OR
        -- Public posts
        visibility = 'public'
        OR
        -- Circle posts - simplified check
        (visibility = 'circle' AND EXISTS (
            SELECT 1 FROM circle_members
            WHERE user_id = auth.uid()
            AND circle_id IN (
                SELECT circle_id FROM circle_members WHERE user_id = posts.user_id
            )
        ))
        OR
        -- Following posts
        (visibility = 'follow' AND EXISTS (
            SELECT 1 FROM follows
            WHERE follower_id = auth.uid() AND following_id = posts.user_id
        ))
    );

-- STEP 6: CLEAN UP TEST DATA
-- Remove auto-assignment to TEST123 for new users

-- Check if there's a trigger auto-assigning users
SELECT * FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- If you find any problematic triggers, drop them:
-- DROP TRIGGER IF EXISTS [trigger_name] ON profiles;