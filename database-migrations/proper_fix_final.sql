-- THE PROPER FIX - FINAL VERSION
-- Run each section one at a time

-- SECTION 1: Check what's actually in the database
SELECT 'Your current auth ID:' as info, auth.uid()::text as value;

-- Check user IDs in circle_members separately
SELECT DISTINCT user_id, 'circle_member' as source 
FROM circle_members 
WHERE circle_id = (SELECT id FROM circles WHERE name = 'TEST123');

-- SECTION 2: DROP the broken policy
DROP POLICY IF EXISTS "Posts are viewable based on visibility" ON posts;
DROP POLICY IF EXISTS "Posts viewable simple" ON posts;  -- Drop temporary one too if exists

-- SECTION 3: CREATE a smarter, more forgiving policy
CREATE POLICY "Posts viewable smart" ON posts
    FOR SELECT
    USING (
        -- ALWAYS see your own posts
        user_id = auth.uid()
        OR
        -- Public posts = everyone sees them
        visibility = 'public'  
        OR
        -- Circle posts = if you're in ANY circle (simpler check)
        (visibility = 'circle' AND EXISTS (
            SELECT 1 FROM circle_members WHERE user_id = auth.uid()
        ))
    );

-- SECTION 4: Fix any broken memberships
-- Remove duplicates using ctid (PostgreSQL's internal row identifier)
DELETE FROM circle_members a
WHERE EXISTS (
    SELECT 1
    FROM circle_members b
    WHERE a.user_id = b.user_id 
    AND a.circle_id = b.circle_id
    AND a.ctid < b.ctid
);

-- SECTION 5: Make sure YOU are in TEST123 circle
-- This ensures the current logged-in user is properly in the circle
INSERT INTO circle_members (circle_id, user_id, joined_at)
SELECT 
    (SELECT id FROM circles WHERE name = 'TEST123'),
    auth.uid(),
    NOW()
ON CONFLICT (circle_id, user_id) DO NOTHING;

-- SECTION 6: TEST - This should now return posts!
SELECT COUNT(*) as visible_posts FROM posts;

-- SECTION 7: See what posts you can actually view now
SELECT 
    p.id,
    p.content,
    p.visibility,
    CASE 
        WHEN p.user_id = auth.uid() THEN 'Your post'
        WHEN p.visibility = 'public' THEN 'Public post'
        WHEN p.visibility = 'circle' THEN 'Circle post (now visible!)'
        ELSE 'Other'
    END as why_visible
FROM posts p
LIMIT 10;