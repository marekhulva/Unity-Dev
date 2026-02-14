-- Debug script to check RLS policies and test queries

-- 1. Check what policies exist for challenges table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'challenges';

-- 2. Check what policies exist for challenge_participants table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'challenge_participants';

-- 3. Check if RLS is enabled on these tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('challenges', 'challenge_participants');

-- 4. Try to select from challenges (this will fail if RLS blocks it)
SELECT id, name, emoji, scope, status FROM challenges WHERE status = 'active';

-- 5. Check current user's auth
SELECT auth.uid() AS current_user_id, auth.role() AS current_role;
