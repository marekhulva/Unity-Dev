-- ============================================================================
-- COMPLETE DATABASE DIAGNOSTIC
-- Run this in Supabase SQL Editor to understand your setup
-- ============================================================================

-- 1. What database are we in?
SELECT current_database(), current_schema();

-- 2. What tables exist in public schema?
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- 3. Check ALL challenges (without RLS filtering)
SET session_replication_role = 'replica'; -- Temporarily disable RLS for diagnosis
SELECT id, name, scope, circle_id, created_at
FROM challenges
ORDER BY created_at DESC
LIMIT 10;
SET session_replication_role = 'origin'; -- Re-enable RLS

-- 4. Check if the mystery challenge exists
SELECT id, name, circle_id, scope, status, created_at,
       substring(description, 1, 100) as description_preview
FROM challenges
WHERE id = '6cbb28cf-f679-439a-8222-1a073bae3647';

-- 5. Check challenge_participants for this challenge
SELECT id, challenge_id, user_id, joined_at, personal_start_date
FROM challenge_participants
WHERE challenge_id = '6cbb28cf-f679-439a-8222-1a073bae3647';

-- 6. Check what circles exist
SELECT id, name, join_code, created_at
FROM circles
ORDER BY created_at DESC
LIMIT 10;

-- 7. Check RLS policies on challenges table
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'challenges';

-- 8. Check your current role
SELECT current_user, current_role;
