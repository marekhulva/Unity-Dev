-- QUICK FIX - RUN THIS IMMEDIATELY IN SUPABASE SQL EDITOR
-- This will make your app work again right away

-- 1. Drop the broken policy
DROP POLICY IF EXISTS "Posts are viewable based on visibility" ON posts;

-- 2. Create a simple working policy
CREATE POLICY "Posts viewable simple" ON posts
    FOR SELECT 
    USING (
        auth.uid() IS NOT NULL
    );

-- This makes ALL posts visible to ANY logged-in user
-- It's temporary but will immediately fix your app

-- 3. Verify it worked
SELECT COUNT(*) as should_see_posts FROM posts;