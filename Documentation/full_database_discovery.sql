-- COMPLETE DATABASE DISCOVERY - SINGLE QUERY TO COPY & PASTE
-- Run this entire block in Supabase SQL Editor

-- Clear previous results
DO $$
BEGIN
    RAISE NOTICE 'Starting database discovery...';
END $$;

-- Combined discovery query
WITH table_info AS (
    SELECT
        'TABLES_AND_COUNTS' as query_type,
        jsonb_build_object(
            'table_name', tablename,
            'schema', schemaname,
            'row_count', n_live_tup
        ) as result
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
),
columns_info AS (
    SELECT
        'COLUMN_DETAILS' as query_type,
        jsonb_build_object(
            'table_name', table_name,
            'column_name', column_name,
            'data_type', data_type,
            'max_length', character_maximum_length,
            'is_nullable', is_nullable,
            'column_default', column_default,
            'ordinal_position', ordinal_position
        ) as result
    FROM information_schema.columns
    WHERE table_schema = 'public'
),
foreign_keys AS (
    SELECT
        'FOREIGN_KEYS' as query_type,
        jsonb_build_object(
            'source_table', tc.table_name,
            'source_column', kcu.column_name,
            'target_table', ccu.table_name,
            'target_column', ccu.column_name,
            'constraint_name', tc.constraint_name
        ) as result
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
),
indexes_info AS (
    SELECT
        'INDEXES' as query_type,
        jsonb_build_object(
            'table_name', tablename,
            'index_name', indexname,
            'index_definition', indexdef
        ) as result
    FROM pg_indexes
    WHERE schemaname = 'public'
),
rls_status AS (
    SELECT
        'RLS_STATUS' as query_type,
        jsonb_build_object(
            'table_name', tablename,
            'rls_enabled', rowsecurity
        ) as result
    FROM pg_tables
    WHERE schemaname = 'public'
),
rls_policies AS (
    SELECT
        'RLS_POLICIES' as query_type,
        jsonb_build_object(
            'table_name', tablename,
            'policy_name', policyname,
            'permissive', permissive,
            'command', cmd,
            'roles', roles,
            'using_expression', qual,
            'check_expression', with_check
        ) as result
    FROM pg_policies
    WHERE schemaname = 'public'
),
db_functions AS (
    SELECT
        'FUNCTIONS' as query_type,
        jsonb_build_object(
            'function_name', routine_name,
            'return_type', data_type,
            'definition', routine_definition
        ) as result
    FROM information_schema.routines
    WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
),
db_views AS (
    SELECT
        'VIEWS' as query_type,
        jsonb_build_object(
            'view_name', table_name,
            'definition', view_definition
        ) as result
    FROM information_schema.views
    WHERE table_schema = 'public'
),
db_triggers AS (
    SELECT
        'TRIGGERS' as query_type,
        jsonb_build_object(
            'trigger_name', trigger_name,
            'table_name', event_object_table,
            'event', event_manipulation,
            'timing', action_timing,
            'statement', action_statement
        ) as result
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
)
SELECT query_type, result FROM table_info
UNION ALL
SELECT query_type, result FROM columns_info
UNION ALL
SELECT query_type, result FROM foreign_keys
UNION ALL
SELECT query_type, result FROM indexes_info
UNION ALL
SELECT query_type, result FROM rls_status
UNION ALL
SELECT query_type, result FROM rls_policies
UNION ALL
SELECT query_type, result FROM db_functions
UNION ALL
SELECT query_type, result FROM db_views
UNION ALL
SELECT query_type, result FROM db_triggers
ORDER BY query_type, result->>'table_name', result->>'ordinal_position';

-- Summary statistics
SELECT
    '=== DATABASE SUMMARY ===' as info,
    COUNT(DISTINCT tablename) as total_tables,
    COUNT(DISTINCT indexname) as total_indexes,
    COUNT(DISTINCT policyname) as total_policies
FROM pg_tables
LEFT JOIN pg_indexes USING (tablename)
LEFT JOIN pg_policies USING (tablename)
WHERE pg_tables.schemaname = 'public';