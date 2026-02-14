-- COMPLETE DATABASE DISCOVERY - FIXED VERSION
-- Copy and paste this entire query into Supabase SQL Editor

-- 1. LIST ALL TABLES WITH DETAILS
SELECT
    '=== TABLES ===' as section,
    schemaname,
    tablename,
    n_live_tup as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. LIST ALL COLUMNS WITH DETAILS
SELECT
    '=== COLUMNS ===' as section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 3. LIST ALL FOREIGN KEYS
SELECT
    '=== FOREIGN KEYS ===' as section,
    tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_name AS target_table,
    ccu.column_name AS target_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 4. LIST ALL INDEXES
SELECT
    '=== INDEXES ===' as section,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. CHECK RLS STATUS
SELECT
    '=== RLS STATUS ===' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. LIST RLS POLICIES
SELECT
    '=== RLS POLICIES ===' as section,
    tablename,
    policyname,
    cmd as command,
    permissive,
    roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;