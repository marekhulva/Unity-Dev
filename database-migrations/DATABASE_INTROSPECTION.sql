-- DATABASE INTROSPECTION QUERIES
-- Run these in Supabase SQL Editor to get actual database schema
-- Created: 2025-01-21

-- ============================================
-- 1. LIST ALL TABLES IN PUBLIC SCHEMA
-- ============================================
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================
-- 2. GET COMPLETE SCHEMA FOR 'actions' TABLE
-- ============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'actions'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 3. GET COMPLETE SCHEMA FOR 'goals' TABLE
-- ============================================
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'goals'
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- 4. CHECK DATA FOR USER 'JHJH'
-- ============================================
-- First get JHJH's user ID
SELECT id, username, display_name, email
FROM profiles
WHERE display_name = 'jhjh'
    OR username = 'JHJH'
    OR username = 'jhjh';

-- ============================================
-- 5. CHECK JHJH's ACTIONS AND COMPLETION STATUS
-- ============================================
-- Replace USER_ID with actual ID from query above
SELECT
    id,
    title,
    completed,
    completed_at,
    created_at,
    goal_id,
    time
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'  -- JHJH's ID
ORDER BY created_at DESC;

-- ============================================
-- 6. COUNT COMPLETED vs UNCOMPLETED ACTIONS
-- ============================================
SELECT
    COUNT(*) as total_actions,
    COUNT(CASE WHEN completed = true THEN 1 END) as completed_true,
    COUNT(CASE WHEN completed_at IS NOT NULL THEN 1 END) as has_completed_at,
    COUNT(CASE WHEN completed = true AND completed_at IS NULL THEN 1 END) as completed_but_no_timestamp
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a';

-- ============================================
-- 7. CHECK RLS POLICIES ON ACTIONS TABLE
-- ============================================
SELECT
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'actions';

-- ============================================
-- 8. CHECK IF 'daily_actions' TABLE EXISTS
-- ============================================
SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
        AND table_name = 'daily_actions'
) as daily_actions_exists;

-- ============================================
-- 9. GET SAMPLE OF COMPLETED ACTIONS WITH TIMESTAMPS
-- ============================================
SELECT
    title,
    completed,
    completed_at,
    DATE(completed_at) as completion_date,
    created_at
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
    AND completed_at IS NOT NULL
ORDER BY completed_at DESC
LIMIT 10;

-- ============================================
-- 10. CHECK COMPLETION HISTORY BY DAY (LAST 7 DAYS)
-- ============================================
SELECT
    DATE(completed_at) as completion_date,
    COUNT(*) as actions_completed
FROM actions
WHERE user_id = 'bcd3d06b-b74d-4b6b-8b53-5e4249828a2a'
    AND completed_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(completed_at)
ORDER BY completion_date DESC;