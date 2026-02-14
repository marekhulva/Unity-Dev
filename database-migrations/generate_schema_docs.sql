-- AUTOMATICALLY GENERATE DATABASE SCHEMA DOCUMENTATION
-- Run this in Supabase SQL Editor to get your current schema

-- 1. Get all tables with their descriptions
SELECT 
    schemaname,
    tablename,
    obj_description(pgc.oid) AS table_comment
FROM pg_tables t
JOIN pg_class pgc ON pgc.relname = t.tablename
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get detailed schema for all tables (this is the main one you want!)
SELECT 
    t.table_name,
    STRING_AGG(
        CONCAT(
            c.column_name, ' ',
            UPPER(c.data_type),
            CASE 
                WHEN c.character_maximum_length IS NOT NULL 
                THEN CONCAT('(', c.character_maximum_length, ')')
                ELSE ''
            END,
            CASE 
                WHEN c.is_nullable = 'NO' THEN ' NOT NULL'
                ELSE ''
            END,
            CASE 
                WHEN c.column_default IS NOT NULL 
                THEN CONCAT(' DEFAULT ', c.column_default)
                ELSE ''
            END
        ),
        E',\n    ' ORDER BY c.ordinal_position
    ) AS columns
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name
ORDER BY t.table_name;

-- 3. Get all columns with details (easier to read format)
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- 4. Get all foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Get all indexes
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 6. Generate CREATE TABLE statements (for documentation)
SELECT 
    'CREATE TABLE ' || table_name || ' (' || E'\n' ||
    STRING_AGG(
        '    ' || column_name || ' ' || 
        CASE 
            WHEN data_type = 'character varying' THEN 'VARCHAR(' || character_maximum_length || ')'
            WHEN data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
            WHEN data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            ELSE UPPER(data_type)
        END ||
        CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
        CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
        E',\n' ORDER BY ordinal_position
    ) || E'\n);' AS create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;