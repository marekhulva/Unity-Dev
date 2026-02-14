-- SIMPLE QUERY TO GET YOUR CURRENT SCHEMA
-- Run this in Supabase SQL Editor and save the results

-- This gives you a clean, readable format of your entire database schema
SELECT 
    t.table_name AS "Table",
    STRING_AGG(
        c.column_name || ': ' || 
        CASE 
            WHEN c.data_type = 'character varying' THEN 'VARCHAR(' || c.character_maximum_length || ')'
            WHEN c.data_type = 'timestamp with time zone' THEN 'TIMESTAMPTZ'
            WHEN c.data_type = 'timestamp without time zone' THEN 'TIMESTAMP'
            WHEN c.data_type = 'integer' THEN 'INTEGER'
            WHEN c.data_type = 'boolean' THEN 'BOOLEAN'
            WHEN c.data_type = 'uuid' THEN 'UUID'
            WHEN c.data_type = 'text' THEN 'TEXT'
            WHEN c.data_type = 'jsonb' THEN 'JSONB'
            WHEN c.data_type = 'numeric' THEN 'NUMERIC'
            WHEN c.data_type = 'ARRAY' THEN 'ARRAY'
            WHEN c.data_type LIKE '%[]' THEN UPPER(REPLACE(c.data_type, '[]', ' ARRAY'))
            ELSE UPPER(c.data_type)
        END ||
        CASE WHEN c.is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
        E'\n  ' ORDER BY c.ordinal_position
    ) AS "Columns"
FROM information_schema.tables t
JOIN information_schema.columns c ON c.table_name = t.table_name
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND t.table_name NOT LIKE 'pg_%'
    AND t.table_name NOT LIKE '_prisma%'
GROUP BY t.table_name
ORDER BY t.table_name;